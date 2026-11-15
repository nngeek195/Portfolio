'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { getCapable } from '@/lib/three-capability';
import { model } from '@/lib/models';
import { introStartedAt, whenBootDone } from '@/lib/boot/state';
import { dbg, dbgEvent } from '@/lib/debug';
import DebugOverlay from '@/components/debug/DebugOverlay';

// The shared WebGL canvas (three.js, R3F, drei) is a separate lazy chunk: it is
// only downloaded once a 3D section is about to come into view.
const SharedCanvas = dynamic(() => import('./SharedCanvas'), { ssr: false });
// The companion helicopter that flies the whole page (its own chunk, same three.js chunk).
const CompanionHeli = dynamic(() => import('./companion/CompanionHeli'), { ssr: false });
// After a fallback the helicopter carries on as the flat still (no three.js in this chunk).
const FlatCompanion = dynamic(() => import('./companion/FlatCompanion'), { ssr: false });

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
  // The hero intro starts when the boot preloader exits (or at navigation start without one).
  const afterIntro = () => void whenBootDone().then(() => !cancelled && window.setTimeout(idle, Math.max(0, introStartedAt() + 2600 - performance.now())));
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
  const [fallbackReason, setFallbackReason] = useState('');
  // Handoff: the flat helicopter mounts first; 3D switches off once it has drawn (onFlatReady).
  const [flatMounted, setFlatMounted] = useState(false);
  const onFlatReady = useCallback(() => setFellBack(true), []);
  // The helicopter model couldn't be loaded (twice): fly the flat one, keep the other 3D views.
  const [heliFailed, setHeliFailed] = useState(false);
  const onHeliFailed = useCallback(() => setHeliFailed(true), []);
  const fallbackPending = useRef(false);
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

  // The device can't keep up: switch to the flat renders, but never mid-scroll. The swap
  // waits until scrolling has stopped for a moment, so no pose snaps while the visitor moves.
  const onFallback = useCallback((reason = 'frame rate') => {
    if (isForced()) {
      dbgEvent(`fallback suppressed by ?3d=on (${reason})`);
      return;
    }
    if (fallbackPending.current) return;
    fallbackPending.current = true;
    dbgEvent(`fallback requested (${reason}); waiting for scroll to stop`);
    let timer = 0;
    // Have the flat helicopter's image ready before the swap.
    new Image().src = model('heli').poster.src;
    const apply = () => {
      window.removeEventListener('scroll', arm);
      console.info('3D switched off for this visit (device could not keep a smooth frame rate); showing flat renders.');
      dbgEvent('3D fallback applied');
      setFallbackReason(reason);
      setFlatMounted(true);
    };
    function arm() {
      window.clearTimeout(timer);
      timer = window.setTimeout(apply, 1200);
    }
    window.addEventListener('scroll', arm, { passive: true });
    arm();
  }, []);
  const active3D = enabled && !fellBack;
  useEffect(() => {
    dbg.hooks.fallback = onFallback;
    // Preload the flat helicopter's chunk so a fallback swap has nothing to wait for.
    if (enabled) void import('./companion/FlatCompanion');
  }, [enabled, onFallback]);

  // Swap the hero's pre-rendered helicopter for the live one once the page is idle.
  useEffect(() => {
    if (!active3D) return;
    return whenIdleAfterLoad(() => {
      setCanvasRequested(true);
      setCompanion(true);
    });
  }, [active3D]);
  const onCompanionVisible = useCallback((v: boolean) => setVisible('companion', v), [setVisible]);

  useEffect(() => {
    Object.assign(dbg.three, { enabled: active3D, fellBack, fallbackReason, canvasMounted: active3D && canvasRequested, companionMounted: active3D && companion, visibleSlots: [...visible] });
  }, [active3D, fellBack, fallbackReason, canvasRequested, companion, visible]);

  const value = useMemo(() => ({ enabled: active3D, requestCanvas, setVisible }), [active3D, requestCanvas, setVisible]);

  return (
    <ThreeContext.Provider value={value}>
      {children}
      {active3D && canvasRequested && <SharedCanvas active={visible.size > 0} onFallback={onFallback} />}
      {active3D && companion && !heliFailed && <CompanionHeli onVisible={onCompanionVisible} onFailed={onHeliFailed} />}
      {enabled && (flatMounted || heliFailed) && <FlatCompanion onReady={flatMounted ? onFlatReady : undefined} />}
      <DebugOverlay />
    </ThreeContext.Provider>
  );
}
