'use client';

import { useSyncExternalStore } from 'react';
import type { ObjectiveId } from '@/lib/sections';

// Tiny shared store for the section currently in view on the home page.
// Written by the live HUD's scroll tracker; read by the nav (active link).
// Only changes when the section changes, so subscribers don't re-render per frame.
let active: ObjectiveId | null = null;
const listeners = new Set<() => void>();

export function setActiveObjective(id: ObjectiveId | null) {
  if (id === active) return;
  active = id;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useActiveObjective() {
  return useSyncExternalStore(subscribe, () => active, () => null);
}
