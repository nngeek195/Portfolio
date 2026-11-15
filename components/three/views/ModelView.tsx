'use client';

import { Component, Suspense, useEffect, type ReactNode } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera, View } from '@react-three/drei';
import { getEnvironment } from '../nightVision';
import { LOOK } from '../look';

// If a model fails to load or render, keep the flat render (never show an error).
export class ModelErrorBoundary extends Component<{ children: ReactNode; onError?: (error: unknown) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn('3D view disabled, keeping the flat render:', error);
    this.props.onError?.(error);
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
    scene.environmentIntensity = LOOK.envIntensity;
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

/** Night-vision-friendly lighting shared by every model: cool key, green rim, soft front fill (values in ../look.ts). */
export function NightLights() {
  return (
    <>
      <ambientLight intensity={LOOK.ambient} />
      <hemisphereLight args={['#d8ffd0', '#0b120b', LOOK.hemi]} />
      <directionalLight position={[-2, 3, 4]} intensity={LOOK.key} />
      <directionalLight position={[3, 1, -3]} intensity={LOOK.rim} color="#7cff5b" />
      <directionalLight position={[2.5, -1, 3]} intensity={LOOK.fill} color="#cfe8ff" />
    </>
  );
}

/** A model drawn into the shared canvas, inside this element's rectangle (drei <View>). */
export default function ModelView({ camera, children }: { camera: { position: [number, number, number]; fov: number }; children: ReactNode }) {
  return (
    <View className="pointer-events-none absolute inset-0">
      <PerspectiveCamera makeDefault position={camera.position} fov={camera.fov} near={0.01} far={100} />
      <NightLights />
      <Environment />
      <ModelErrorBoundary>
        <Suspense fallback={null}>{children}</Suspense>
      </ModelErrorBoundary>
    </View>
  );
}
