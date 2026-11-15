import { HERO_PROGRESS_EVENT, type HeroProgressDetail } from '@/lib/motion/heli';
import { DOSSIER_PROGRESS_EVENT, type DossierProgressDetail } from '@/components/scenes/DossierScene';
import type { DirectorContext, Pose, Segment, Signals } from './types';
import { patrol } from './segments/patrol';
import { hero } from './segments/hero';
import { dossier } from './segments/dossier';
import { loadout } from './segments/loadout';

// Section segments in page order. The first one that returns a pose flies the
// helicopter; when none does (between scenes) it patrols.
const SEGMENTS: Segment[] = [hero, dossier, loadout];

/**
 * Flight director: once per frame, works out where the helicopter should be
 * from the page's scroll state (section positions, scene progress events,
 * hovered elements). DOM reads are cached for the frame.
 */
export function createDirector() {
  const signals: Signals = { heroProgress: 0, dossierProgress: 0, hovered: null };
  const onHero = (e: Event) => (signals.heroProgress = (e as CustomEvent<HeroProgressDetail>).detail.progress);
  const onDossier = (e: Event) => (signals.dossierProgress = (e as CustomEvent<DossierProgressDetail>).detail.progress);
  const onOver = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.('[data-channel]');
    signals.hovered = el ? el.getBoundingClientRect() : null;
  };
  window.addEventListener(HERO_PROGRESS_EVENT, onHero);
  window.addEventListener(DOSSIER_PROGRESS_EVENT, onDossier);
  window.addEventListener('pointerover', onOver, { passive: true });

  let cache = new Map<string, DOMRect | null>();
  let cacheAll = new Map<string, DOMRect[]>();
  const rect = (sel: string) => {
    if (cache.has(sel)) return cache.get(sel)!;
    const el = document.querySelector(sel);
    const r = el ? el.getBoundingClientRect() : null;
    const v = r && (r.width > 0 || r.height > 0) ? r : null;
    cache.set(sel, v);
    return v;
  };
  const rects = (sel: string) => {
    let v = cacheAll.get(sel);
    if (!v) cacheAll.set(sel, (v = Array.from(document.querySelectorAll(sel), (el) => el.getBoundingClientRect())));
    return v;
  };

  return {
    signals,
    pose(t: number): Pose {
      cache = new Map();
      cacheAll = new Map();
      const W = window.innerWidth;
      const H = window.innerHeight;
      const ctx: DirectorContext = {
        t,
        W,
        H,
        gutter: Math.max(0, (W - 1280) / 2),
        scrollY: window.scrollY,
        maxScroll: Math.max(1, document.documentElement.scrollHeight - H),
        rect,
        rects,
        signals,
      };
      for (const seg of SEGMENTS) {
        const p = seg(ctx);
        if (p) return p;
      }
      return patrol(ctx);
    },
    dispose() {
      window.removeEventListener(HERO_PROGRESS_EVENT, onHero);
      window.removeEventListener(DOSSIER_PROGRESS_EVENT, onDossier);
      window.removeEventListener('pointerover', onOver);
    },
  };
}

export type Director = ReturnType<typeof createDirector>;
