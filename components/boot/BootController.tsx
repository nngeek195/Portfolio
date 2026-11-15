'use client';

import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getLenis } from '@/lib/motion/lenis';
import { BOOT_DONE_EVENT } from '@/lib/boot/state';
import { startBootProgress, type LineId } from '@/lib/boot/progress';

// Timing rules for the boot preloader (ms since navigation start).
export const BOOT_MIN_MS = 1200; // never flicker on fast connections
export const BOOT_MAX_MS = 4000; // hard cap: show the site anyway, keep loading in the background
const EXIT_MS = 450;

// Screen-reader milestones (the live region is not updated on every percent).
const MILESTONE: Record<LineId, string> = {
  auth: 'Connected.',
  fonts: 'Fonts loaded.',
  nvg: 'Images loaded.',
  engine: '3D engine ready.',
  assets: '3D models loaded.',
};

const COLOMBO_TIME = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

/**
 * Drives the server-rendered boot preloader (components/boot/BootScreen.tsx):
 * real progress (lib/boot/progress.ts) -> percentage, ammo bar, terminal "OK"s,
 * screen-reader milestones; scroll lock, clock, skip (button, Esc, Enter),
 * minimum / maximum display time and the exit. Does nothing when the inline
 * script decided not to show it.
 */
export default function BootController() {
  useEffect(() => {
    const root = document.documentElement;
    const boot = document.getElementById('boot');
    // Only take over a preloader that is still loading (the inline script may already
    // have exited it at the hard cap on a slow device).
    if (root.dataset.boot !== 'on' || !boot) return;
    window.__bootCtl = true;

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

    // ---- real progress ------------------------------------------------------
    const progress = startBootProgress();
    const pctEl = $<HTMLElement>('[data-boot-pct]');
    const statusEl = $<HTMLElement>('[data-boot-status]');
    const segs = Array.from(boot.querySelectorAll<HTMLElement>('[data-boot-seg]'));
    progress.onLine((id, result) => {
      const li = $<HTMLElement>(`[data-boot-line="${id}"]`);
      if (li) {
        if (result === 'flat') li.querySelector('.boot-ok')!.textContent = 'FLAT';
        li.dataset.state = 'ok';
      }
      // Milestones only; a polite region coalesces quick successions.
      if (statusEl && result === 'ok') {
        statusEl.textContent = MILESTONE[id];
      }
    });

    // Displayed percentage: follows the real value, never goes back, and is paced so it
    // can't reach 100 before the minimum display time; the hard cap forces it to 100.
    let shown = 0;
    let lastLit = -1;
    let lastText = '';
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const capped = now >= BOOT_MAX_MS;
      const pace = Math.min(1, now / BOOT_MIN_MS);
      const target = capped ? 1 : Math.min(progress.value(), pace);
      shown = Math.min(1, Math.max(shown, shown + (target - shown) * Math.min(1, dt * (capped ? 14 : 7)) + (target >= 1 ? dt * 0.6 : 0)));
      const pct = Math.min(100, Math.floor(shown * 100 + 0.001));
      const text = pct >= 100 ? '100' : String(pct).padStart(2, '0');
      if (text !== lastText && pctEl) pctEl.textContent = lastText = text;
      const lit = Math.min(segs.length, Math.floor((pct / 100) * segs.length));
      if (lit !== lastLit) {
        segs.forEach((el, i) => el.classList.toggle('on', i < lit));
        lastLit = lit;
      }
      boot.style.setProperty('--boot-p', String(shown));
      if (pct >= 100) {
        cancelAnimationFrame(raf);
        if (statusEl) statusEl.textContent = capped && progress.value() < 1 ? 'Site ready; still loading some 3D assets in the background.' : 'Uplink established. Site ready.';
        exit();
      }
    };
    raf = requestAnimationFrame(frame);

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
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(clock);
      window.removeEventListener('keydown', onKey);
      skipBtn?.removeEventListener('click', onSkip);
    };
  }, []);

  return null;
}
