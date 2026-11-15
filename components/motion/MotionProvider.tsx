'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { useGSAP } from '@gsap/react';
import { installAutoRefresh } from '@/lib/motion/refresh';
import { setLenis } from '@/lib/motion/lenis';
import { isBooting } from '@/lib/boot/state';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, useGSAP);


/**
 * Scroll engine for the public site (not used by /admin):
 *  - Lenis smooth scrolling on desktop wheel/trackpad, driven by GSAP's ticker
 *    so ScrollTrigger and Lenis stay in sync. Touch devices keep native scroll.
 *  - Off entirely when the user prefers reduced motion.
 *  - In-page anchor links (#id, /#id on the home page) scroll smoothly.
 *  - Pauses while a modal locks the page (ItemModal sets body overflow:hidden),
 *    detected from the outside so the shared modal needs no changes.
 *  - Inner scroll areas (modal body, chat log, anything overflow-y-auto)
 *    keep native wheel scrolling.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const instance = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      prevent: (node) => !!node.closest('[data-lenis-prevent], [role="dialog"], .overflow-y-auto, .overflow-auto'),
    });
    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    lenisRef.current = instance;
    setLenis(instance);
    // The boot preloader keeps the page still until it exits (it starts Lenis again).
    if (isBooting()) instance.stop();

    // Pause while something locks body scrolling (modals).
    const syncLock = () => (document.body.style.overflow === 'hidden' || isBooting() ? instance.stop() : instance.start());
    const observer = new MutationObserver(syncLock);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  // Smooth in-page anchors. Runs in the capture phase so it can take over
  // before next/link handles the click (Link skips defaultPrevented clicks).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank') return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!target) return;
      e.preventDefault();
      history.pushState(null, '', url.hash);
      const lenis = lenisRef.current;
      // Sections carry scroll-margin-top for the fixed nav; Lenis honours it.
      if (lenis) lenis.scrollTo(target);
      else target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      // Move focus for keyboard and screen-reader users without a second jump.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Keyboard focus must not sit under the fixed nav: the nav slides back in when the page
  // scrolls up (Shift+Tab), over an element the browser considered already in view.
  useEffect(() => {
    const NAV = 64;
    const onFocus = (e: FocusEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el?.matches?.(':focus-visible') || el.closest('header, [role="dialog"]')) return;
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        if (r.top >= NAV + 8 || r.bottom <= 0) return;
        const y = window.scrollY + r.top - (NAV + 24);
        const lenis = lenisRef.current;
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo({ top: y, behavior: 'auto' });
      });
    };
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, []);

  // Recalculate trigger positions once late layout settles: web fonts, images,
  // and <details> toggles (e.g. "Show all commendations").
  // Also on resize and whenever the page height changes after the first measure (images that
  // load late and change the layout; next/image reserves space, so most don't),
  // via lib/motion/refresh (forced, once the page is still: ScrollTrigger's own resize refresh
  // waits for a scroll-end signal that Lenis doesn't reliably produce).
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);
    const onToggle = () => requestAnimationFrame(refresh);
    document.addEventListener('toggle', onToggle, true);
    const uninstall = installAutoRefresh();
    // A refresh briefly moves pinned sections out of their pin spacers and back (GSAP),
    // which drops keyboard focus to <body> if it was inside one: put it back.
    let focused: Element | null = null;
    const saveFocus = () => (focused = document.activeElement);
    const restoreFocus = () => {
      const el = focused as HTMLElement | null;
      focused = null;
      if (el && el !== document.body && el.isConnected && document.activeElement !== el) el.focus({ preventScroll: true });
    };
    ScrollTrigger.addEventListener('refreshInit', saveFocus);
    ScrollTrigger.addEventListener('refresh', restoreFocus);
    return () => {
      ScrollTrigger.removeEventListener('refreshInit', saveFocus);
      ScrollTrigger.removeEventListener('refresh', restoreFocus);
      window.removeEventListener('load', refresh);
      document.removeEventListener('toggle', onToggle, true);
      uninstall();
    };
  }, []);

  // After client-side navigation, start at the top (or the hash target).
  // Skipped on first load so the browser's scroll restoration (refresh) is kept.
  const lastPath = useRef(pathname);
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis || lastPath.current === pathname) return;
    lastPath.current = pathname;
    const hash = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    lenis.scrollTo(hash ?? 0, { immediate: true });
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [pathname]);

  return <>{children}</>;
}
