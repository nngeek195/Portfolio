import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { dbg } from '@/lib/debug';

// Registry of the pinned scenes' ScrollTriggers, so 3D views and the
// helicopter can read a scene's progress *from the current scroll position*
// whenever they render, instead of accumulating progress events. The same
// scroll position therefore always gives the same pose, whatever the speed,
// direction or history (and it is right even if a model loads late, after
// its scene's events have already fired).

const scenes = new Map<string, ScrollTrigger>();

/** Called by a scene when its trigger is created; returns the cleanup for gsap.matchMedia. */
export function registerScene(name: string, st: ScrollTrigger | undefined) {
  if (!st) return () => {};
  scenes.set(name, st);
  dbg.triggers[name] = st;
  return () => {
    if (scenes.get(name) !== st) return;
    scenes.delete(name);
    delete dbg.triggers[name];
  };
}

/** Scroll distance past a scene's end (negative before it ends), or null when the scene isn't running. */
export function scenePastEnd(name: string): number | null {
  const st = scenes.get(name);
  return st ? st.scroll() - st.end : null;
}

/**
 * Progress 0..1 of a scene for the current scroll position, or -1 when the
 * scene isn't running (phones, reduced motion, short screens).
 */
export function sceneProgress(name: string): number {
  const st = scenes.get(name);
  if (!st) return -1;
  const span = st.end - st.start;
  if (!(span > 0)) return 0;
  return Math.min(1, Math.max(0, (st.scroll() - st.start) / span));
}
