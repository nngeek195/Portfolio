'use client';

import { useEffect, useRef } from 'react';
import { model } from '@/lib/models';
import { HELI_LIVE_ATTR } from '@/lib/motion/heli';
import { dbg } from '@/lib/debug';
import { createDirector } from './director';
import { lastHeli } from './handoff';

const POSTER = model('heli').poster;
const ASPECT = POSTER.height / POSTER.width;
const damp = (a: number, b: number, lambda: number, dt: number) => a + (b - a) * (1 - Math.exp(-lambda * dt));
const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Flat stand-in for the companion helicopter after the 3D layer has fallen
 * back (device too slow): the pre-rendered still, flown by the same flight
 * director (same pure poses, same owners), starting from the 3D helicopter's
 * last pose. No three.js; one transform write per frame.
 */
export default function FlatCompanion() {
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = img.current;
    if (!el) return;
    const director = createDirector();
    const s = lastHeli.valid ? { ...lastHeli } : null;
    const root = document.documentElement;
    root.setAttribute(HELI_LIVE_ATTR, ''); // the stills stay hidden: this one carries on instead
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      const pose = director.pose(now / 1000);
      const W = window.innerWidth;
      const size = pose.size * (1 - 0.25 * (pose.topDown ?? 0)); // no top view of the still: a little smaller on the map
      const yawT = Math.abs(wrapPi(pose.yaw ?? 0)) > Math.PI / 2 ? Math.PI : 0;
      const k = pose.lambda ?? 4;
      const c = s ?? { x: pose.x, y: pose.y, size, yaw: yawT, pitch: 0, bright: 1, valid: true };
      c.x = damp(c.x, pose.x, k, dt);
      c.y = damp(c.y, pose.y, k, dt);
      c.size = damp(c.size, size, k, dt);
      c.yaw = damp(Math.abs(c.yaw), yawT, 3.2, dt);
      c.pitch = damp(c.pitch, pose.pitch ?? 0, 5, dt);
      c.bright = damp(c.bright, pose.bright ?? 1, 3, dt);
      Object.assign(lastHeli, c);
      // Facing: scaleX squeezes through 0 while turning (reads as a turn); pitch rotates the nose.
      const face = Math.cos(c.yaw);
      const h = c.size * ASPECT;
      el.style.width = `${c.size}px`;
      el.style.opacity = String(Math.max(0, Math.min(1, c.bright)));
      el.style.transform = `translate3d(${c.x - c.size / 2}px, ${c.y - h / 2}px, 0) rotate(${(-c.pitch * Math.sign(face || 1) * 180) / Math.PI}deg) scaleX(${face})`;
      Object.assign(dbg.heli, {
        loaded: true, live: true, owner: `${director.owner} (flat)`, x: c.x, y: c.y, size: c.size, bright: c.bright, targetX: pose.x, targetY: pose.y,
        onScreen: c.x + c.size / 2 > 0 && c.x - c.size / 2 < W, want: true, finite: Number.isFinite(c.x + c.y), lastFrameAt: now, frameScrollY: window.scrollY,
      });
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      director.dispose();
      root.removeAttribute(HELI_LIVE_ATTR);
    };
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- moved every frame; already cached by the hero still
    <img
      ref={img}
      src={POSTER.src}
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[25] origin-center drop-shadow-[0_0_2px_rgb(124_255_91/0.8)] will-change-transform"
      style={{ width: 0 }}
    />
  );
}
