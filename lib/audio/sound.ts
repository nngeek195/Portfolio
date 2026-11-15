'use client';

import { useSyncExternalStore } from 'react';

// Site sound switch. Off by default; nothing audio-related is downloaded or
// created until the visitor turns it on. The AudioContext is created inside
// that click (a user gesture), so browsers allow it to play.
let on = false;
let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

export function isSoundOn() {
  return on;
}

/** Call from a click / key handler. */
export function setSoundOn(next: boolean) {
  if (next === on) return;
  on = next;
  if (on) {
    ctx ??= new AudioContext();
    void ctx.resume();
  } else {
    void ctx?.suspend();
  }
  listeners.forEach((l) => l());
}

/** The shared AudioContext (only exists once sound has been turned on). */
export function getAudioContext() {
  return ctx;
}

export function subscribeSound(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSoundOn() {
  return useSyncExternalStore(subscribeSound, isSoundOn, () => false);
}
