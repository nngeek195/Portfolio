'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { SCENE_MEDIA } from '@/lib/motion/scenes';

// The shared WebGL canvas (three.js, R3F, drei) is a separate lazy chunk: it is
// only downloaded once a 3D section is about to come into view.
const SharedCanvas = dynamic(() => import('./SharedCanvas'), { ssr: false });
// The companion helicopter that flies the whole page (its own chunk, same three.js chunk).
const CompanionHeli = dynamic(() => import('./companion/CompanionHeli'), { ssr: false });

/**
 * Calls back once the page has finished loading, the hero's CSS intro has
 * played (~2.4 s) and the main thread is idle, so the 3D helicopter never
 * competes with first paint / LCP.
 */
function whenIdleAfterLoad(cb: () => void) {
  let cancelled = false;
  let idleId = 0;
  const idle = () => {
    if (cancelled) return;
    const ric = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200));
    idleId = ric(() => !cancelled && cb(), { timeout: 3000 });
  };
  const afterIntro = () => window.setTimeout(idle, Math.max(0, 2600 - performance.now()));
  if (document.readyState === 'complete') afterIntro();
  else window.addEventListener('load', afterIntro, { once: true });
  return () => {
    cancelled = true;
    window.removeEventListener('load', afterIntro);
    window.cancelIdleCallback?.(idleId);
  };
}

type ThreeContextValue = {
  /** 3D allowed on this device (decided once on the client; false on the server). */
  enabled: boolean;
  /** A model slot is near the viewport: mount the shared canvas. */
  requestCanvas: () => void;
  /** Model slots report whether they are on screen; frames render only while one is. */
  setVisible: (id: string, visible: boolean) => void;
};

const ThreeContext = createContext<ThreeContextValue>({ enabled: false, requestCanvas: () => {}, setVisible: () => {} });
export const useThree3D = () => useContext(ThreeContext);

/**
 * Decides whether real-time 3D runs. Requires the same conditions as the pinned
 * scenes (desktop-sized viewport, motion allowed) plus a capable device:
 * WebGL2, >= 4 CPU threads, >= 4 GB memory when reported, no Data Saver.
 * Override for testing with ?3d=on or ?3d=off in the URL.
 * Everywhere else the flat renders stay (phones, reduced motion, low-end).
 */
function detectCapable(): boolean {
  const force = new URLSearchParams(location.search).get('3d');
  if (force === 'off') return false;
  if (force === 'on') return true;
  if (!window.matchMedia(SCENE_MEDIA).matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

let capableCache: boolean | null = null;
const getCapable = () => (capableCache ??= detectCapable());
const isForced = () => new URLSearchParams(location.search).get('3d') === 'on';

export default function ThreeProvider({ children }: { children: React.ReactNode }) {
  // Client-only decision without a setState-in-effect; false during SSR/hydration.
  const enabled = useSyncExternalStore(
    () => () => {},
    getCapable,
    () => false
  );
  // Set when the device can't keep up at runtime (see SharedCanvas): back to flat renders.
  const [fellBack, setFellBack] = useState(false);
  const [canvasRequested, setCanvasRequested] = useState(false);
  const [visible, setVisibleSet] = useState<ReadonlySet<string>>(() => new Set());

  const [companion, setCompanion] = useState(false);
  const requestCanvas = useCallback(() => setCanvasRequested(true), []);
  const setVisible = useCallback((id: string, isVisible: boolean) => {
    setVisibleSet((prev) => {
      if (prev.has(id) === isVisible) return prev;
      const next = new Set(prev);
      if (isVisible) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const onFallback = useCallback(() => {
    if (isForced()) return;
    console.info('3D switched off for this visit (device could not keep a smooth frame rate); showing flat renders.');
    setFellBack(true);
  }, []);
  const active3D = enabled && !fellBack;

  // Swap the hero's pre-rendered helicopter for the live one once the page is idle.
  useEffect(() => {
    if (!active3D) return;
    return whenIdleAfterLoad(() => {
      setCanvasRequested(true);
      setCompanion(true);
    });
  }, [active3D]);
  const onCompanionVisible = useCallback((v: boolean) => setVisible('companion', v), [setVisible]);

  const value = useMemo(() => ({ enabled: active3D, requestCanvas, setVisible }), [active3D, requestCanvas, setVisible]);

  return (
    <ThreeContext.Provider value={value}>
      {children}
      {active3D && canvasRequested && <SharedCanvas active={visible.size > 0} onFallback={onFallback} />}
      {active3D && companion && <CompanionHeli onVisible={onCompanionVisible} />}
    </ThreeContext.Provider>
  );
}
