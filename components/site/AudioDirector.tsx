'use client';

import { useEffect, useRef } from 'react';
import { getAudioContext, useSoundOn } from '@/lib/audio/sound';
import { playCue } from '@/lib/audio/cues';
import type { RotorAudio } from '@/lib/audio/rotor';
import { useActiveObjective } from '@/lib/motion/scroll-store';
import { HELI_LIVE_ATTR } from '@/lib/motion/heli';
import { lastHeli } from '@/components/three/companion/handoff';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** A helicopter frame older than this (ms) means it stopped drawing (off screen): silent. */
const STALE_MS = 250;

/**
 * Site sound, only while AUDIO is on (nothing here downloads or runs before that):
 *  - Rotor chop that follows the helicopter: louder the bigger (closer) it is and
 *    the more of it is on screen, silent once it has left. Reads the flying
 *    helicopter (3D or flat, via lastHeli) when one is live, otherwise the
 *    section stills it would replace (phones, reduced motion, FX: LITE).
 *  - Radio squelch when the section in view changes (home page).
 * The mechanical clack of the rifle lives with the Loadout scene (LoadoutScene).
 */
export default function AudioDirector() {
  const soundOn = useSoundOn();
  const active = useActiveObjective();

  // Squelch on a section change (not on the first section reported, nor when sound comes on).
  const prev = useRef(active);
  useEffect(() => {
    if (prev.current && active && prev.current !== active) playCue('squelch');
    prev.current = active;
  }, [active]);

  useEffect(() => {
    if (!soundOn) return;
    playCue('squelch'); // confirms the switch
    let cancelled = false;
    let rotor: RotorAudio | null = null;
    let raf = 0;
    let lastY = window.scrollY;
    let scrollV = 0;

    const fromStills = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      let best = 0;
      for (const el of document.querySelectorAll<HTMLElement>('[data-heli-still]')) {
        const r = el.getBoundingClientRect();
        if (!r.width) continue;
        const offBy = Math.max(0, -r.right, r.left - W, -r.bottom, r.top - H);
        const presence = clamp01(1 - offBy / 450);
        best = Math.max(best, clamp01(r.width / 520) * presence);
      }
      return best;
    };

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!rotor) return;
      const y = window.scrollY;
      scrollV += (Math.abs(y - lastY) - scrollV) * 0.15;
      lastY = y;
      let volume: number;
      let rate: number;
      if (document.documentElement.hasAttribute(HELI_LIVE_ATTR)) {
        const fresh = performance.now() - lastHeli.at < STALE_MS;
        volume = fresh ? Math.max(0.1, clamp01(lastHeli.size / 420)) * lastHeli.presence * clamp01(lastHeli.bright) : 0;
        rate = lastHeli.rotor;
      } else {
        volume = fromStills();
        rate = clamp01(0.35 + scrollV / 60);
      }
      rotor.update(volume, rate);
    };

    const onVisibility = () => document.hidden && rotor?.update(0, 0);
    document.addEventListener('visibilitychange', onVisibility);
    import('@/lib/audio/rotor').then(({ createRotorAudio }) => {
      const ctx = getAudioContext();
      if (cancelled || !ctx) return;
      rotor = createRotorAudio(ctx);
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      rotor?.dispose();
    };
  }, [soundOn]);

  return null;
}
