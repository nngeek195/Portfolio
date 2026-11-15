'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { SCENE_MEDIA } from '@/lib/motion/scenes';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Shared with the Phase 4 3D pistol (field-strip follows the redaction).
export const DOSSIER_PROGRESS_EVENT = 'dossier:progress';
export type DossierProgressDetail = { progress: number };

/**
 * OBJ-02 Personnel File (desktop scene). Pins the dossier + sidearm and scrubs:
 *   0.00–0.72  redaction bars wipe away one after another
 *   0.05–0.75  sidearm traits light up 01→05 with their pistol markers
 *   0.78–0.92  CLEARED stamp slams down
 * Markup hooks: [data-dossier], [data-redact], [data-trait], [data-marker].
 */
export default function DossierScene() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SCENE_MEDIA, () => {
      const section = document.getElementById('about');
      const stage = section?.querySelector<HTMLElement>('[data-dossier="stage"]');
      if (!section || !stage) return;
      const bars = gsap.utils.toArray<HTMLElement>('[data-redact]', section);
      const traits = gsap.utils.toArray<HTMLElement>('[data-trait]', section);
      const markers = gsap.utils.toArray<HTMLElement>('[data-marker]', section);
      const stamp = section.querySelector<HTMLElement>('[data-dossier="stamp"]');

      // Scene start state (only applied when the scene runs).
      gsap.set(bars, { opacity: 1, scaleX: 1 });
      gsap.set(traits, { opacity: 0.28 });
      gsap.set(markers, { opacity: 0.25, scale: 0.8 });
      if (stamp) gsap.set(stamp, { opacity: 0, scale: 2.4, rotation: -18 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: stage,
          // Centre the stage if it fits on screen, otherwise pin it just under the nav.
          start: () => (stage.offsetHeight > window.innerHeight - 80 ? 'top top+=72' : 'center center'),
          end: '+=140%',
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: true,
          onUpdate: (self) =>
            window.dispatchEvent(new CustomEvent<DossierProgressDetail>(DOSSIER_PROGRESS_EVENT, { detail: { progress: self.progress } })),
        },
      });

      const barStep = 0.72 / Math.max(bars.length, 1);
      bars.forEach((bar, i) => tl.to(bar, { scaleX: 0, duration: barStep * 1.4, ease: 'power2.inOut' }, i * barStep));

      const traitStep = 0.7 / Math.max(traits.length, 1);
      traits.forEach((row, i) => {
        const at = 0.05 + i * traitStep;
        tl.to(row, { opacity: 1, duration: traitStep * 0.6 }, at);
        if (markers[i]) tl.to(markers[i], { opacity: 1, scale: 1.15, duration: traitStep * 0.6, ease: 'back.out(3)' }, at);
      });

      if (stamp) tl.to(stamp, { opacity: 1, scale: 1, rotation: -6, duration: 0.14, ease: 'power4.in' }, 0.78);
      tl.to({}, { duration: 0.08 }); // hold on the cleared file
    });
    return () => mm.revert();
  });

  return null;
}
