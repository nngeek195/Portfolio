'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { SCENE_MEDIA } from '@/lib/motion/scenes';

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * OBJ-01 Insertion (desktop scene). Pins the hero and scrubs:
 *   0.00–0.60  helicopter flies across and away; skyline drops; copy lifts off
 *   0.45–0.70  goggles flip up: night-vision green drains to grey (NVG: OFF)
 *   0.72–1.00  eyelids close to a balaclava eye slit, handing over to the dossier
 * Markup hooks are data-hero="…" attributes in components/sections/Hero.tsx.
 */
export default function HeroScene() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(SCENE_MEDIA, () => {
      const section = document.getElementById('top');
      if (!section) return;
      const $ = (name: string) => section.querySelector<HTMLElement | SVGElement>(`[data-hero="${name}"]`);
      const nvg = $('nvg');

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
          onUpdate: (self) => {
            if (nvg) nvg.textContent = self.progress > 0.52 ? 'OFF' : 'ON';
          },
        },
      });

      tl.to($('heli'), { xPercent: -150, yPercent: -40, scale: 0.55, rotation: -9, duration: 0.6 }, 0)
        .to($('sky'), { scale: 1.18, duration: 0.6 }, 0)
        .to($('ridge'), { yPercent: 35, duration: 0.6 }, 0)
        .to($('copy'), { y: -90, duration: 0.6 }, 0)
        .to($('copy'), { opacity: 0, duration: 0.18 }, 0.48)
        .to($('art'), { y: -60, opacity: 0, duration: 0.25 }, 0.4)
        .to($('nvoff'), { opacity: 1, duration: 0.25 }, 0.45)
        .to($('frame'), { opacity: 0, duration: 0.1 }, 0.62)
        .to([$('lid-top'), $('lid-bottom')], { height: '49.6%', duration: 0.26, ease: 'power2.in' }, 0.72)
        .to($('slit'), { opacity: 1, duration: 0.06 }, 0.9)
        .to({}, { duration: 0.04 }); // short hold on the slit before unpinning

      return () => {
        if (nvg) nvg.textContent = 'ON';
      };
    });
    return () => mm.revert();
  });

  return null;
}
