'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { PROFILE } from '@/lib/profile';
import { OBJECTIVES, type ObjectiveId } from '@/lib/sections';
import { setActiveObjective } from '@/lib/motion/scroll-store';

const ROUNDS = 30;
const DEG_PX = 3; // compass: pixels per degree of heading
const COMPASS_STEP = 15;
const COMPASS_LABELS: Record<number, string> = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
// Two full turns so the strip never runs out while translating.
const COMPASS_TICKS = Array.from({ length: (720 + COMPASS_STEP) / COMPASS_STEP }, (_, i) => i * COMPASS_STEP);

/**
 * Live HUD for the home page (decorative, aria-hidden, >=1440px wide only).
 *  - Objective tracker: current section + overall mission progress
 *  - Compass: heading turns with overall scroll progress
 *  - Ammo counter: rounds left = progress through the current section;
 *    magazine pips = sections; "RELOAD" flickers on each new section
 * Updates the DOM directly from a single ScrollTrigger (no per-frame React renders).
 * Also publishes the active section for the nav (lib/motion/scroll-store).
 */
export default function HudOverlay() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = (sel: string) => root.current!.querySelector<HTMLElement>(sel)!;
      const code = q('[data-hud="code"]');
      const title = q('[data-hud="title"]');
      const bar = q('[data-hud="bar"]');
      const strip = q('[data-hud="compass"]');
      const heading = q('[data-hud="heading"]');
      const rounds = q('[data-hud="rounds"]');
      const reload = q('[data-hud="reload"]');
      const pips = Array.from(root.current!.querySelectorAll<HTMLElement>('[data-hud="pip"]'));
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Each section's "magazine" spans the scroll range from when it reaches the
      // probe line (40% down the viewport) until the next one does; the first
      // starts at the top of the page and the last ends at the bottom.
      const PROBE = 0.4;
      let spans: { id: ObjectiveId; start: number; end: number }[] = [];
      const measure = () => {
        const max = ScrollTrigger.maxScroll(window);
        const starts = OBJECTIVES.map((o, i) => {
          const el = document.getElementById(o.id);
          const top = el ? el.getBoundingClientRect().top + window.scrollY : 0;
          return i === 0 ? 0 : Math.max(0, Math.min(max, top - window.innerHeight * PROBE));
        });
        spans = OBJECTIVES.map((o, i) => ({ id: o.id, start: starts[i], end: i < starts.length - 1 ? starts[i + 1] : max }));
      };

      let current = -1;
      const update = () => {
        const y = window.scrollY;
        let i = 0;
        for (let k = 0; k < spans.length; k++) if (spans[k].start <= y) i = k;
        const sec = spans[i];
        const local = gsap.utils.clamp(0, 1, (y - sec.start) / Math.max(sec.end - sec.start, 1));
        const max = ScrollTrigger.maxScroll(window) || 1;
        const overall = gsap.utils.clamp(0, 1, y / max);

        if (i !== current) {
          const first = current === -1;
          current = i;
          const o = OBJECTIVES[i];
          code.textContent = `OBJ ${o.code}/${String(OBJECTIVES.length).padStart(2, '0')}`;
          title.textContent = o.title.toUpperCase();
          pips.forEach((p, k) => p.classList.toggle('bg-nv', k <= i));
          pips.forEach((p, k) => p.classList.toggle('bg-steel', k > i));
          setActiveObjective(o.id);
          if (!first && !reduced) {
            gsap.killTweensOf(reload);
            gsap.fromTo(reload, { opacity: 1 }, { opacity: 0, duration: 0.6, ease: 'steps(6)' });
          }
        }

        const deg = overall * 360;
        bar.style.transform = `scaleX(${overall})`;
        strip.style.transform = `translateX(${-deg * DEG_PX}px)`;
        heading.textContent = String(Math.round(deg) % 360).padStart(3, '0');
        rounds.textContent = String(Math.max(0, ROUNDS - Math.round(local * ROUNDS))).padStart(2, '0');
      };

      measure();
      update();
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: () => (measure(), update()) });
      return () => setActiveObjective(null);
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 hidden select-none font-mono text-[10px] tracking-[0.2em] text-ash/80 min-[1440px]:block"
    >
      {/* Compass: a window over a strip that slides with scroll progress */}
      <div className="absolute left-1/2 top-[74px] w-[420px] -translate-x-1/2 opacity-80">
        <div className="relative h-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_18%,#000_82%,transparent)]">
          <div data-hud="compass" className="absolute left-1/2 top-0 flex will-change-transform">
            {COMPASS_TICKS.map((d) => {
              const label = COMPASS_LABELS[d % 360];
              return (
                <div key={d} className="flex flex-col items-center" style={{ width: COMPASS_STEP * DEG_PX, marginLeft: d === 0 ? -(COMPASS_STEP * DEG_PX) / 2 : 0 }}>
                  <span className={label ? 'text-bone' : ''}>{label ?? String(d % 360).padStart(3, '0')}</span>
                  <span className={`mt-1 w-px ${label ? 'h-2.5 bg-ash' : 'h-1.5 bg-steel'}`} />
                </div>
              );
            })}
          </div>
        </div>
        <div className="mx-auto mt-1 flex w-max flex-col items-center text-nv">
          <span className="h-0 w-0 border-x-4 border-b-4 border-x-transparent border-b-nv" />
          <span data-hud="heading" className="mt-0.5">000</span>
        </div>
      </div>

      {/* Objective tracker */}
      <div className="absolute right-6 top-[84px] text-right">
        <div data-hud="code" className="text-nv">
          OBJ 01/{String(OBJECTIVES.length).padStart(2, '0')}
        </div>
        <div data-hud="title" className="mt-1 text-bone">
          {OBJECTIVES[0].title.toUpperCase()}
        </div>
        <div className="ml-auto mt-2 h-0.5 w-16 bg-steel">
          <div data-hud="bar" className="h-full w-full origin-left bg-nv" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>

      {/* Left tick ruler */}
      <div className="absolute left-5 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        {Array.from({ length: 21 }, (_, i) => (
          <span key={i} className={`h-px ${i % 5 === 0 ? 'w-4 bg-ash' : 'w-2 bg-steel'}`} />
        ))}
      </div>

      {/* Location / time readout */}
      <div className="absolute bottom-6 left-6 space-y-1">
        <div className="flex items-center gap-2 text-signal">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal motion-reduce:animate-none" /> REC
        </div>
        {PROFILE.location.coords.split(' ').map((c) => (
          <div key={c}>{c}</div>
        ))}
        <div>{PROFILE.location.utcOffset}</div>
      </div>

      {/* Ammo counter */}
      <div className="absolute bottom-[92px] right-6 text-right">
        <div data-hud="reload" className="mb-1 text-amber opacity-0">
          RELOAD
        </div>
        <div className="font-display text-3xl font-bold tracking-normal text-bone/90">
          <span data-hud="rounds">{ROUNDS}</span>
          <span className="text-ash"> / {ROUNDS}</span>
        </div>
        <div className="mt-1 flex justify-end gap-1">
          {OBJECTIVES.map((o, i) => (
            <span key={o.id} data-hud="pip" className={`h-2 w-1 ${i === 0 ? 'bg-nv' : 'bg-steel'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
