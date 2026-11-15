'use client';

import { useCallback, useEffect, useId, useRef, useState, type ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { useThree3D } from './ThreeProvider';

export type ModelKind = 'rifle' | 'pistol' | 'heli-comms' | 'heli-debrief';

// Each model view is its own lazy chunk (they share the three.js chunk).
// A kind without a view keeps its flat render.
const VIEWS: Partial<Record<ModelKind, ComponentType<{ onReady: () => void }>>> = {
  rifle: dynamic(() => import('./views/RifleView'), { ssr: false }),
  pistol: dynamic(() => import('./views/PistolView'), { ssr: false }),
};

/**
 * Place where a 3D model appears. `children` is the flat render: it is what
 * phones, reduced-motion and low-end devices see, and it stays visible on
 * capable devices until the 3D model has loaded, then fades out.
 *  - Loads the 3D view (and the shared canvas) when the slot is ~1 screen away.
 *  - Reports on-screen visibility so the canvas only renders frames when needed.
 */
export default function ModelSlot({
  kind,
  className = '',
  fallbackClassName = '',
  children,
}: {
  kind: ModelKind;
  /** Classes for the slot box (the 3D view fills it). Positioned `relative` unless absolute/fixed is given. */
  className?: string;
  /** Classes for the wrapper around the flat render. */
  fallbackClassName?: string;
  children?: React.ReactNode;
}) {
  const { enabled, requestCanvas, setVisible } = useThree3D();
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          requestCanvas();
          nearObserver.disconnect();
        }
      },
      { rootMargin: '100% 0px' }
    );
    const visibleObserver = new IntersectionObserver(([entry]) => setVisible(id, entry.isIntersecting));
    nearObserver.observe(el);
    visibleObserver.observe(el);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
      setVisible(id, false);
    };
  }, [enabled, requestCanvas, setVisible, id]);

  const View = VIEWS[kind];
  return (
    <div
      ref={ref}
      data-model-slot={kind}
      data-ready={(ready && enabled) || undefined}
      className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} ${className}`}
    >
      <div className={`transition-opacity duration-700 ${ready && enabled ? 'opacity-0' : 'opacity-100'} ${fallbackClassName}`}>{children}</div>
      {enabled && near && View && <View onReady={onReady} />}
    </div>
  );
}
