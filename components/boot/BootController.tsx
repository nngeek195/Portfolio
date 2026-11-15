'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from '@/lib/motion/lenis';
import { BOOT_DONE_EVENT, isBooting } from '@/lib/boot/state';

// Timing rules for the boot preloader (ms since navigation start).
export const BOOT_MIN_MS = 1200; // never flicker on fast connections
export const BOOT_MAX_MS = 4000; // hard cap: show the site anyway, keep loading in the background
const EXIT_MS = 450;

const COLOMBO_TIME = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/**
 * Drives the server-rendered boot preloader (components/boot/BootScreen.tsx):
 * scroll lock, clock, skip (button, Esc, Enter), minimum / maximum display
 * time and the exit. Does nothing when the inline script decided not to show it.
 */
export default function BootController() {
  useEffect(() => {
    const root = document.documentElement;
    const boot = document.getElementById('boot');
    if (!isBooting() || !boot) return;

    root.classList.add('boot-lock');
    getLenis()?.stop();

    const $ = <T extends Element>(sel: string) => boot.querySelector<T>(sel);
    const timeEl = $<HTMLElement>('[data-boot-time]');
    const tickClock = () => timeEl && (timeEl.textContent = COLOMBO_TIME.format(new Date()));
    tickClock();
    const clock = window.setInterval(tickClock, 1000);

    let exiting = false;
    const timers: number[] = [];
    const exit = () => {
      if (exiting) return;
      exiting = true;
      window.__bootExitAt = performance.now();
      root.setAttribute('data-boot', 'exit');
      timers.push(
        window.setTimeout(() => {
          root.setAttribute('data-boot', 'done');
          root.classList.remove('boot-lock');
          window.clearInterval(clock);
          if (boot.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
          // Unlock first (Lenis's stopped state clips the page), then re-measure the scenes.
          getLenis()?.start();
          ScrollTrigger.refresh();
          window.__bootDoneAt = performance.now();
          window.dispatchEvent(new Event(BOOT_DONE_EVENT));
        }, EXIT_MS)
      );
    };

    // Exit once the page has loaded, but not before the minimum and never after the cap.
    const atLeast = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, Math.max(0, ms - performance.now())));
    const onLoad = () => atLeast(BOOT_MIN_MS, exit);
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
    atLeast(BOOT_MAX_MS, exit);

    const skipBtn = $<HTMLButtonElement>('[data-boot-skip]');
    const onSkip = () => exit();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        exit();
      }
    };
    skipBtn?.addEventListener('click', onSkip);
    window.addEventListener('keydown', onKey);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(clock);
      window.removeEventListener('load', onLoad);
      window.removeEventListener('keydown', onKey);
      skipBtn?.removeEventListener('click', onSkip);
    };
  }, []);

  return null;
}
