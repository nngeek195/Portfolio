// Runtime diagnostics for the 3D layer. Writers (helicopter rig, rifle view,
// shared canvas, provider) update this plain object every frame — cheap
// property writes, no React. It is only *shown* with ?debug=1 (DebugOverlay),
// where it is also exposed as window.__dbg for the stress test
// (scripts/stress/heli-rifle.mjs).

export type DebugState = {
  three: { enabled: boolean; fellBack: boolean; fallbackReason: string; canvasMounted: boolean; companionMounted: boolean; visibleSlots: string[] };
  canvas: { frameloop: 'always' | 'demand' | 'none'; dpr: number; frames: number; lastFrameAt: number; declines: number };
  heli: {
    loaded: boolean; live: boolean; owner: string; x: number; y: number; size: number; bright: number; nv: number;
    targetX: number; targetY: number; onScreen: boolean; want: boolean; finite: boolean; lastFrameAt: number; frameScrollY: number;
  };
  rifle: { loaded: boolean; applied: number; expected: number; approach: number; maxPartErr: number; lastFrameAt: number; frameScrollY: number };
  pistol: { loaded: boolean; applied: number; expected: number; lastFrameAt: number };
  /** Live ScrollTrigger instances of the scenes (read for expected values). */
  triggers: Record<string, { progress: number; start: number; end: number; isActive: boolean } | undefined>;
  events: string[];
  /** Test hooks (set by the 3D layer; only reachable with ?debug=1 via window.__dbg). */
  hooks: { fallback?: (reason?: string) => void };
};

export const dbg: DebugState = {
  three: { enabled: false, fellBack: false, fallbackReason: '', canvasMounted: false, companionMounted: false, visibleSlots: [] },
  canvas: { frameloop: 'none', dpr: 0, frames: 0, lastFrameAt: 0, declines: 0 },
  heli: { loaded: false, live: false, owner: '-', x: 0, y: 0, size: 0, bright: 1, nv: 0.85, targetX: 0, targetY: 0, onScreen: false, want: false, finite: true, lastFrameAt: 0, frameScrollY: 0 },
  rifle: { loaded: false, applied: 0, expected: 0, approach: 0, maxPartErr: 0, lastFrameAt: 0, frameScrollY: 0 },
  pistol: { loaded: false, applied: 0, expected: 0, lastFrameAt: 0 },
  triggers: {},
  events: [],
  hooks: {},
};

/** Notable one-off events (fallback, dpr change, model loaded, refresh), newest last. */
export function dbgEvent(msg: string) {
  dbg.events.push(`${(performance.now() / 1000).toFixed(2)}s ${msg}`);
  if (dbg.events.length > 40) dbg.events.shift();
}

export const isDebug = () => typeof window !== 'undefined' && new URLSearchParams(location.search).get('debug') === '1';
