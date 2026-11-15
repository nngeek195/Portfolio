'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { SCENE_MEDIA } from '@/lib/motion/scenes';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Shared with the Phase 4 3D rifle: current module + scrub progress.
export const LOADOUT_PROGRESS_EVENT = 'loadout:progress';
export type LoadoutProgressDetail = { progress: number; index: number };

/**
 * OBJ-03 Loadout (desktop scene). Switches the section to its "stage" layout
 * (data-scene="on"), pins it and steps through the modules as you scroll:
 * module row, schematic marker and skill panel follow the active index, and a
 * blueprint scan line sweeps the rifle. Emits LOADOUT_PROGRESS_EVENT on window.
 */
export default function LoadoutScene({ count }: { count: number }) {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SCENE_MEDIA, () => {
      const section = document.getElementById('skills');
      const stage = section?.querySelector<HTMLElement>('[data-loadout="stage"]');
      if (!section || !stage) return;
      section.dataset.scene = 'on';

      const rows = gsap.utils.toArray<HTMLElement>('[data-module]', stage);
      const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', stage);
      const markers = gsap.utils.toArray<HTMLElement>('[data-marker]', stage);
      const counter = stage.querySelector<HTMLElement>('[data-loadout="counter"]');
      const scan = stage.querySelector<HTMLElement>('[data-loadout="scan"]');

      let active = -1;
      const activate = (i: number) => {
        if (i === active) return;
        active = i;
        rows.forEach((r, k) => (r.dataset.active = String(k === i)));
        panels.forEach((p, k) => gsap.to(p, { opacity: k === i ? 1 : 0, y: k === i ? 0 : 8, duration: 0.35, overwrite: true }));
        markers.forEach((m, k) => gsap.to(m, { opacity: k === i ? 1 : 0.3, scale: k === i ? 1.3 : 0.85, duration: 0.3, overwrite: true }));
        if (counter) counter.textContent = `Module ${String(i + 1).padStart(2, '0')}/${String(count).padStart(2, '0')}`;
      };
      activate(0);

      ScrollTrigger.create({
        trigger: stage,
        start: 'top top+=88',
        end: `+=${count * 55}%`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        animation: scan ? gsap.fromTo(scan, { left: '2%' }, { left: '98%', ease: 'none' }) : undefined,
        onUpdate: (self) => {
          const index = Math.min(count - 1, Math.floor(self.progress * count));
          activate(index);
          window.dispatchEvent(new CustomEvent<LoadoutProgressDetail>(LOADOUT_PROGRESS_EVENT, { detail: { progress: self.progress, index } }));
        },
      });
      // The layout switched; recompute every trigger below this one.
      ScrollTrigger.refresh();

      return () => {
        delete section.dataset.scene;
        rows.forEach((r) => delete r.dataset.active);
      };
    });
    return () => mm.revert();
  });

  return null;
}
