'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { dbg, isDebug } from '@/lib/debug';
import { useActiveObjective } from '@/lib/motion/scroll-store';

const noop = () => () => {};

/**
 * ?debug=1 overlay: scroll position, active section, helicopter state (owner,
 * position, brightness, on screen), rifle progress (applied vs expected),
 * model load states, quality (dpr), fallback, and the canvas frame loop.
 * Text is rewritten from `dbg` every animation frame (no React renders).
 */
export default function DebugOverlay() {
  const on = useSyncExternalStore(noop, isDebug, () => false);
  const pre = useRef<HTMLPreElement>(null);
  const section = useActiveObjective();
  const sectionRef = useRef(section);
  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  useEffect(() => {
    if (!on) return;
    // Exposed for scripts/stress/heli-rifle.mjs (trigger-staleness probe).
    Object.assign(window, { __dbg: dbg, __dbgRefresh: () => ScrollTrigger.refresh() });
    let id = 0;
    const f2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : String(n));
    const f0 = (n: number) => (Number.isFinite(n) ? n.toFixed(0) : String(n));
    const tick = () => {
      const now = performance.now();
      const { three, canvas, heli, rifle, pistol } = dbg;
      const age = (t: number) => (t ? `${f0(now - t)}ms ago` : 'never');
      if (pre.current)
        pre.current.textContent = [
          `scrollY ${f0(scrollY)} / ${f0(document.documentElement.scrollHeight - innerHeight)}   section ${sectionRef.current ?? '-'}`,
          `3D ${three.enabled ? 'on' : 'off'}${three.fellBack ? `  FELL BACK (${three.fallbackReason})` : ''}   canvas ${three.canvasMounted ? 'mounted' : '-'}   loop ${canvas.frameloop}   dpr ${canvas.dpr}   declines ${canvas.declines}`,
          `frames ${canvas.frames}  last ${age(canvas.lastFrameAt)}   slots on screen [${three.visibleSlots.join(', ')}]`,
          `HELI ${heli.loaded ? 'loaded' : 'not loaded'}  live ${heli.live}  owner ${heli.owner}  ${heli.finite ? '' : 'NaN!'}`,
          `  pos ${f0(heli.x)},${f0(heli.y)}  size ${f0(heli.size)}  target ${f0(heli.targetX)},${f0(heli.targetY)}  bright ${f2(heli.bright)}`,
          `  onScreen ${heli.onScreen}  wantFrames ${heli.want}  last frame ${age(heli.lastFrameAt)} @y ${f0(heli.frameScrollY)}`,
          `RIFLE ${rifle.loaded ? 'loaded' : 'not loaded'}  applied ${f2(rifle.applied)}  expected ${f2(rifle.expected)}  approach ${f2(rifle.approach)}  partErr ${rifle.maxPartErr.toFixed(3)}m  last ${age(rifle.lastFrameAt)}`,
          `PISTOL ${pistol.loaded ? 'loaded' : 'not loaded'}  applied ${f2(pistol.applied)}  expected ${f2(pistol.expected)}`,
          ...dbg.events.slice(-6),
        ].join('\n');
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [on]);

  if (!on) return null;
  return (
    <pre
      ref={pre}
      aria-hidden="true"
      className="pointer-events-none fixed left-2 top-20 z-[70] max-w-[46rem] whitespace-pre-wrap rounded bg-black/80 p-3 font-mono text-[10px] leading-snug text-nv ring-1 ring-nv/40"
    />
  );
}
