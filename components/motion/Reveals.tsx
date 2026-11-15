'use client';

import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/**
 * Declarative scroll reveals. Server-rendered markup opts in with attributes:
 *   data-reveal="up"        fade + rise when it enters
 *   data-reveal="stagger"   children fade + rise in batches as they enter
 *   data-reveal="line"      divider draws left→right
 *   data-reveal="mask"      wipe in from the left (images, panels)
 *   data-reveal="decode"    text scrambles into place (headings)
 *   data-reveal="spine"     timeline line drawn by scroll (scrubbed)
 *   data-waypoint           lights up (.is-lit) once scrolled past
 *   data-parallax="-120"    moves N px while its section scrolls out (desktop)
 *
 * Rules: nothing animates with prefers-reduced-motion; elements already on
 * screen at load are left alone (no flash of hidden content); reveals only use
 * opacity/transform, so content stays in the accessibility tree.
 */
export default function Reveals() {
  const pathname = usePathname();

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 1024px) and (pointer: fine)' },
        (ctx) => {
          const { motion, desktop } = ctx.conditions as { motion: boolean; desktop: boolean };
          if (!motion) return;

          const fold = window.innerHeight * 0.92;
          const belowFold = (el: Element) => el.getBoundingClientRect().top > fold;
          const all = (sel: string) => gsap.utils.toArray<HTMLElement>(sel).filter(belowFold);
          const enter = { start: 'top 88%', once: true } as const;
          // Reveals that haven't played yet, so keyboard focus can finish them at once (a focused
          // element must never be invisible; the browser's focus scroll can stop short of the trigger line).
          const pending = new Map<Element, () => void>();
          const track = (el: Element, tween: gsap.core.Tween) => {
            pending.set(el, () => {
              tween.scrollTrigger?.kill(false, true); // keep the tween itself alive (kill() would kill it too)
              tween.progress(1);
            });
            return tween;
          };

          all('[data-reveal="up"]').forEach((el) => {
            track(el, gsap.from(el, { y: 28, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, ...enter } }));
          });

          all('[data-reveal="line"]').forEach((el) => {
            track(el, gsap.from(el, { scaleX: 0, transformOrigin: 'left center', duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, ...enter } }));
          });

          all('[data-reveal="mask"]').forEach((el) => {
            track(
              el,
              gsap.fromTo(
                el,
                { clipPath: 'inset(0 100% 0 0)' },
                { clipPath: 'inset(0 0% 0 0)', duration: 1.1, ease: 'expo.inOut', scrollTrigger: { trigger: el, ...enter } }
              )
            );
          });

          all('[data-reveal="decode"]').forEach((el) => {
            const text = el.textContent ?? '';
            gsap.to(el, {
              duration: 0.9,
              ease: 'none',
              scrambleText: { text, chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#', revealDelay: 0.25, speed: 0.6 },
              scrollTrigger: { trigger: el, ...enter },
            });
          });

          gsap.utils.toArray<HTMLElement>('[data-reveal="stagger"]').forEach((parent) => {
            const items = Array.from(parent.children).filter(belowFold) as HTMLElement[];
            if (!items.length) return;
            gsap.set(items, { opacity: 0, y: 24 });
            items.forEach((item) => pending.set(item, () => gsap.to(item, { opacity: 1, y: 0, duration: 0.2, overwrite: true })));
            ScrollTrigger.batch(items, {
              start: 'top 92%',
              once: true,
              onEnter: (batch) => {
                batch.forEach((item) => pending.delete(item));
                gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07, overwrite: true });
              },
            });
          });

          gsap.utils.toArray<HTMLElement>('[data-reveal="spine"]').forEach((el) => {
            gsap.fromTo(
              el,
              { scaleY: 0 },
              { scaleY: 1, ease: 'none', transformOrigin: 'top center', scrollTrigger: { trigger: el.parentElement, start: 'top 70%', end: 'bottom 70%', scrub: 0.4 } }
            );
          });

          gsap.utils.toArray<HTMLElement>('[data-waypoint]').forEach((el) => {
            ScrollTrigger.create({
              trigger: el,
              start: 'top 70%',
              onEnter: () => el.classList.add('is-lit'),
              onLeaveBack: () => el.classList.remove('is-lit'),
            });
          });

          const onFocus = (e: FocusEvent) => {
            for (let el = e.target as Element | null; el && el !== document.body; el = el.parentElement) {
              const finish = pending.get(el);
              if (finish) {
                pending.delete(el);
                finish();
              }
            }
          };
          document.addEventListener('focusin', onFocus);

          if (desktop) {
            gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
              const distance = Number(el.dataset.parallax) || 0;
              gsap.to(el, {
                y: distance,
                ease: 'none',
                scrollTrigger: { trigger: el.closest('section') ?? el, start: 'top top', end: 'bottom top', scrub: true },
              });
            });
          }
          return () => document.removeEventListener('focusin', onFocus);
        }
      );
      return () => mm.revert();
    },
    { dependencies: [pathname], revertOnUpdate: true }
  );

  return null;
}
