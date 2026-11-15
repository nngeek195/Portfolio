import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from '@/lib/motion/lenis';

// Deep links (/#skills) and reloads used to land at the top: the browser jumps
// to the target early, before the pinned scenes exist (so the target is still
// moving), and the many ScrollTrigger refreshes while the page settles lose
// that position. Instead, once the layout has settled (preloader exit, or after
// load), jump to the hash target, or on a reload / back-forward to the saved
// position. For a few seconds afterwards, any re-measure (late images, model
// loads) re-aims at the hash target unless the visitor has started scrolling.

const KEY = () => `scroll:${location.pathname}`;

/** Remember the scroll position when leaving the page (for reloads / back-forward). */
export function rememberScroll() {
  const save = () => {
    try {
      sessionStorage.setItem(KEY(), String(Math.round(window.scrollY)));
    } catch {}
  };
  window.addEventListener('pagehide', save);
  return () => window.removeEventListener('pagehide', save);
}

function hashTarget(): HTMLElement | null {
  if (!location.hash || location.hash.length < 2) return null;
  try {
    return document.getElementById(decodeURIComponent(location.hash.slice(1)));
  } catch {
    return null;
  }
}

function savedPosition(): number | null {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (nav?.type !== 'reload' && nav?.type !== 'back_forward') return null;
  try {
    const v = sessionStorage.getItem(KEY());
    return v === null ? null : Number(v);
  } catch {
    return null;
  }
}

function jump(target: HTMLElement | number) {
  const lenis = getLenis();
  // force: Lenis is still stopped while the preloader covers the page.
  if (lenis) lenis.scrollTo(target, { immediate: true, force: true });
  else if (typeof target === 'number') window.scrollTo(0, target);
  else target.scrollIntoView({ block: 'start' });
}

/**
 * Scroll to where the visitor asked to be. Call once the scenes have been
 * measured (ScrollTrigger.refresh). Returns a cleanup.
 */
export function goToScrollTarget(): () => void {
  const el = hashTarget();
  const saved = el ? null : savedPosition();
  if (!el && saved === null) return () => {};
  jump(el ?? saved!);
  if (!el) return () => {};

  // Re-aim at the hash target after late re-measures, until the visitor scrolls.
  let userScrolled = false;
  const stop = () => (userScrolled = true);
  const onRefresh = () => !userScrolled && jump(el);
  const opts = { passive: true } as const;
  window.addEventListener('wheel', stop, opts);
  window.addEventListener('touchstart', stop, opts);
  window.addEventListener('keydown', stop);
  ScrollTrigger.addEventListener('refresh', onRefresh);
  const cleanup = () => {
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
    ScrollTrigger.removeEventListener('refresh', onRefresh);
  };
  const t = window.setTimeout(cleanup, 4000);
  return () => {
    window.clearTimeout(t);
    cleanup();
  };
}

/** Typing a new #hash in the address bar (same page) jumps there too (Lenis would swallow it). */
export function followHashChanges() {
  const onHash = () => {
    const el = hashTarget();
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el);
    else el.scrollIntoView({ block: 'start' });
  };
  window.addEventListener('hashchange', onHash);
  return () => window.removeEventListener('hashchange', onHash);
}

/** Without a preloader: wait for the page to settle (fonts, load), re-measure, then go. */
export function goToScrollTargetAfterLoad(): () => void {
  let cancelled = false;
  let cleanup = () => {};
  const run = () =>
    (document.fonts?.ready ?? Promise.resolve()).then(() =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (cancelled) return;
          ScrollTrigger.refresh();
          cleanup = goToScrollTarget();
        })
      )
    );
  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener('load', run);
    cleanup();
  };
}
