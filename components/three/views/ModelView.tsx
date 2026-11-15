'use client';

import { Component, Suspense, useEffect, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera, View } from '@react-three/drei';
import { getEnvironment } from '../nightVision';

// If a model fails to load or render, keep the flat render (never show an error).
export class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('3D view disabled, keeping the flat render:', error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Environment() {
  const get = useThree((s) => s.get);
  useEffect(() => {
    const { gl, scene } = get();
    scene.environment = getEnvironment(gl);
  }, [get]);
  return null;
}

/** Calls onReady once its parent (inside Suspense) has rendered, i.e. the model loaded. */
export function ReadySignal({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    // Wait one frame so the first 3D frame is drawn before the flat render fades.
    const id = requestAnimationFrame(() => onReady());
    return () => cancelAnimationFrame(id);
  }, [onReady]);
  return null;
}

/**
 * A model drawn into the shared canvas, inside this element's rectangle
 * (drei <View>). Night-vision-friendly lighting: cool key, green rim, soft fill.
 */
export default function ModelView({ camera, children }: { camera: { position: [number, number, number]; fov: number }; children: ReactNode }) {
  return (
    <View className="pointer-events-none absolute inset-0">
      <PerspectiveCamera makeDefault position={camera.position} fov={camera.fov} near={0.01} far={100} />
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#d8ffd0', '#0b120b', 0.7]} />
      <directionalLight position={[-2, 3, 4]} intensity={2.2} />
      <directionalLight position={[3, 1, -3]} intensity={1.6} color="#7cff5b" />
      <Environment />
      <ModelErrorBoundary>
        <Suspense fallback={null}>{children}</Suspense>
      </ModelErrorBoundary>
    </View>
  );
}
