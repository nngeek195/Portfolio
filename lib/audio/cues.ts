'use client';

import { getAudioContext, isSoundOn } from './sound';
import type { Sfx } from './sfx';

// Fire-and-forget sound cues. A no-op while sound is off; the synth module
// (./sfx) is only downloaded the first time a cue plays with sound on.
export type Cue = keyof Sfx;

let sfx: Promise<Sfx> | null = null;
const lastAt: Partial<Record<Cue, number>> = {};
/** Minimum gap between two plays of the same cue (ms): fast scrolls and jumps don't stack. */
const MIN_GAP: Record<Cue, number> = { squelch: 350, clack: 90 };

export function playCue(cue: Cue) {
  if (!isSoundOn()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = performance.now();
  if (now - (lastAt[cue] ?? -Infinity) < MIN_GAP[cue]) return;
  lastAt[cue] = now;
  sfx ??= import('./sfx').then(({ createSfx }) => createSfx(ctx));
  void sfx.then((s) => isSoundOn() && s[cue]());
}
