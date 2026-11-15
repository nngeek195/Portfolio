'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { dbg, dbgEvent } from '@/lib/debug';
import { PerformanceMonitor, View } from '@react-three/drei';
import * as THREE from 'three';

// Continuous frames only while something 3D is on screen. Otherwise render on
// demand: one frame per scroll event, so the companion helicopter can notice
// when its flight path brings it back into view (and nothing renders at rest).
function FrameloopController({ active }: { active: boolean }) {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    setFrameloop(active ? 'always' : 'demand');
    dbg.canvas.frameloop = active ? 'always' : 'demand';
    invalidate(); // one frame so views clear / re-check cleanly
    if (active) return;
    const onScroll = () => invalidate();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [active, setFrameloop, invalidate]);
  return null;
}

/** Diagnostics only: counts rendered frames (lib/debug). */
function FrameCounter() {
  useFrame(() => {
    dbg.canvas.frames++;
    dbg.canvas.lastFrameAt = performance.now();
  });
  useEffect(() => () => void (dbg.canvas.frameloop = 'none'), []);
  return null;
}

/**
 * The one WebGL canvas for the page. Fixed over the viewport, transparent and
 * click-through; each model view (drei <View>) draws only inside its own
 * section's rectangle. Sits under the HUD (z-30), nav, chat and dialogs.
 */
export default function SharedCanvas({ active, onFallback }: { active: boolean; onFallback: () => void }) {
  // Adaptive quality: 1.5x pixel ratio normally, 1x when frames drop. If the
  // frame rate keeps dropping at 1x (or keeps flip-flopping), hand back to the
  // flat renders for the rest of the visit.
  const [dpr, setDpr] = useState(1.5);
  const declinesAtLowest = useRef(0);
  useEffect(() => void (dbg.canvas.dpr = dpr), [dpr]);
  return (
    <Canvas
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 25, pointerEvents: 'none' }}
      dpr={dpr}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      frameloop="always"
    >
      <PerformanceMonitor
        flipflops={4}
        onDecline={() => {
          dbg.canvas.declines++;
          dbgEvent(`perf decline at dpr ${dpr}`);
          if (dpr > 1) setDpr(1);
          else if (++declinesAtLowest.current >= 2) onFallback();
        }}
        onIncline={() => {
          declinesAtLowest.current = 0;
          setDpr(1.5);
        }}
        onFallback={() => {
          dbgEvent('perf monitor flip-flop fallback');
          onFallback();
        }}
      />
      <FrameCounter />
      <View.Port />
      <FrameloopController active={active} />
    </Canvas>
  );
}
