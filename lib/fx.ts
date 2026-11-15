'use client';

import { useSyncExternalStore } from 'react';
import { FX_KEY } from './fx-inline';

// FX: FULL / LITE. LITE is a real low-power mode: no film grain, no scanlines,
// no 3D (flat renders, so no live helicopter swap and none of the 3D dust and
// motes), the simple boot preloader. Remembered in localStorage "fx" (the boot
// preloader's inline script and FX_INLINE (./fx-inline) read the same key before first
// paint, so a LITE visitor never sees a FULL frame). Shown on <html data-fx="lite">.
export type FxMode = 'full' | 'lite';

const KEY = FX_KEY;
const listeners = new Set<() => void>();

export function getFx(): FxMode {
  if (typeof document === 'undefined') return 'full';
  return document.documentElement.getAttribute('data-fx') === 'lite' ? 'lite' : 'full';
}

export function setFx(mode: FxMode) {
  if (mode === getFx()) return;
  try {
    if (mode === 'lite') localStorage.setItem(KEY, 'lite');
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked (private mode): the choice still applies for this page view
  }
  if (mode === 'lite') document.documentElement.setAttribute('data-fx', 'lite');
  else document.documentElement.removeAttribute('data-fx');
  listeners.forEach((l) => l());
}

export function subscribeFx(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useFx() {
  return useSyncExternalStore(subscribeFx, getFx, () => 'full' as FxMode);
}
