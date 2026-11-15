'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { dbg, dbgEvent } from '@/lib/debug';
import { PerformanceMonitor, View } from '@react-three/drei';
import * as THREE from 'three';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Continuous frames only while something 3D is on screen; otherwise render on
// demand: one frame per scroll event, so the companion helicopter can notice
// when its flight path brings it back into view (and nothing renders at rest).
// The mode itself is the <Canvas frameloop> prop (a prop, so re-renders such as
// a dpr change can't silently reset it).
function ScrollInvalidator({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    dbg.canvas.frameloop = active ? 'always' : 'demand';
    invalidate(); // one frame so views clear / re-check cleanly
    if (active) return;
    const onScroll = () => invalidate();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [active, invalidate]);
  return null;
}

/**
 * Fallback detector: hands back to the flat renders only when the frame rate
 * stays really low (< 24 fps over two consecutive 3 s windows) at 1x pixel
 * ratio while frames are rendering continuously. Gaps (tab hidden, demand-mode
 * idle, the first seconds after mount) restart the measurement, so a tab
 * switch or a single hitch never counts.
 */
function SustainedFpsWatch({ atLowest, onFallback }: { atLowest: boolean; onFallback: (reason: string) => void }) {
  const st = useRef({ start: 0, last: 0, frames: 0, strikes: 0, warmUntil: 0, done: false });
  useEffect(() => {
    const reset = () => Object.assign(st.current, { start: 0, frames: 0, warmUntil: performance.now() + 2500 });
    reset();
    document.addEventListener('visibilitychange', reset);
    return () => document.removeEventListener('visibilitychange', reset);
  }, []);
  useFrame(() => {
    const s = st.current;
    const now = performance.now();
    const gap = now - s.last;
    s.last = now;
    if (s.done || document.hidden || now < s.warmUntil || gap > 250 || !atLowest) {
      s.start = 0;
      s.frames = 0;
      return;
    }
    if (!s.start) s.start = now;
    s.frames++;
    const span = now - s.start;
    if (span < 3000) return;
    const fps = (s.frames * 1000) / span;
    s.strikes = fps < 24 ? s.strikes + 1 : 0;
    s.start = 0;
    s.frames = 0;
    if (s.strikes >= 2) {
      s.done = true;
      onFallback(`sustained ${fps.toFixed(0)} fps at 1x`);
    }
  });
  return null;
}

/**
 * Every ScrollTrigger refresh (resize, late layout) can move the scenes' start/end, which changes
 * the pose for the current scroll position: draw a frame so the views re-apply it right away.
 */
function RefreshInvalidator() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const onRefresh = () => invalidate();
    ScrollTrigger.addEventListener('refresh', onRefresh);
    return () => ScrollTrigger.removeEventListener('refresh', onRefresh);
  }, [invalidate]);
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
export default function SharedCanvas({ active, onFallback }: { active: boolean; onFallback: (reason: string) => void }) {
  // Adaptive quality, one way only: 1.5x pixel ratio, stepping down to 1x the
  // first time frames drop (and staying there: stepping back up made it
  // flip-flop, and the flip-flops themselves used to trigger the fallback).
  const [dpr, setDpr] = useState(1.5);
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
      frameloop={active ? 'always' : 'demand'}
    >
      <PerformanceMonitor
        flipflops={Infinity}
        onDecline={() => {
          dbg.canvas.declines++;
          if (dpr > 1) {
            dbgEvent('perf decline: dpr 1.5 -> 1');
            setDpr(1);
          }
        }}
      />
      <SustainedFpsWatch atLowest={dpr <= 1} onFallback={onFallback} />
      <FrameCounter />
      <RefreshInvalidator />
      <View.Port />
      <ScrollInvalidator active={active} />
    </Canvas>
  );
}
