'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { model } from '@/lib/models';
import { prepareModel } from '../nightVision';
import ModelView, { ReadySignal } from './ModelView';

gsap.registerPlugin(ScrollTrigger);

const URL = model('heli').url;
const ROTOR_SPEED: Record<string, number> = { rotor_main: 22, rotor_tail: 40 }; // rad/s

/** Scroll progress (0..1) of a ScrollTrigger range, read in useFrame without re-renders. */
function useScrollProgress(trigger: string, start: string, end: string) {
  const progress = useRef(0);
  useEffect(() => {
    const st = ScrollTrigger.create({ trigger, start, end, onUpdate: (self) => (progress.current = self.progress), onRefresh: (self) => (progress.current = self.progress) });
    progress.current = st.progress;
    return () => st.kill();
  }, [trigger, start, end]);
  return progress;
}

/** The helicopter model with spinning rotors; `drive` positions it each frame. */
function Heli({ onReady, drive }: { onReady: () => void; drive: (heli: THREE.Object3D, t: number, delta: number) => void }) {
  const { scene } = useGLTF(URL, false, true);
  const root = useMemo(() => scene.clone(true), [scene]);
  // The glTF scene and the model node share the name "heli": find the node as the
  // parent of a known part (getObjectByName would return the scene root itself).
  const heli = useMemo(() => root.getObjectByName('rotor_main')?.parent ?? root, [root]);
  useMemo(() => prepareModel(heli), [heli]);
  const rotors = useMemo(
    () =>
      heli.children
        .filter((c) => ROTOR_SPEED[c.name] && Array.isArray(c.userData.spinAxis))
        .map((c) => ({ node: c, axis: new THREE.Vector3(...(c.userData.spinAxis as [number, number, number])).normalize(), speed: ROTOR_SPEED[c.name] })),
    [heli]
  );
  const q = useMemo(() => new THREE.Quaternion(), []);

  useFrame((state, delta) => {
    for (const r of rotors) r.node.quaternion.multiply(q.setFromAxisAngle(r.axis, r.speed * Math.min(delta, 0.05)));
    drive(heli, state.clock.elapsedTime, delta);
  });

  return (
    <>
      <primitive object={root} />
      <ReadySignal onReady={onReady} />
    </>
  );
}

const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/** Comms: descends from above into the radar panel as the section arrives, then hovers. */
export function HeliCommsView({ onReady }: { onReady: () => void }) {
  const progress = useScrollProgress('#contact', 'top bottom', 'center center');
  const drive = (heli: THREE.Object3D, t: number) => {
    const p = ease(progress.current);
    heli.position.set(0, THREE.MathUtils.lerp(2.6, 0, p) + Math.sin(t * 1.6) * 0.04, 0);
    heli.rotation.set(Math.sin(t * 0.9) * 0.015, THREE.MathUtils.lerp(-0.9, -0.35, p), THREE.MathUtils.lerp(0.12, 0, p) + Math.sin(t * 1.1) * 0.02);
  };
  return (
    <ModelView camera={{ position: [0, 0.35, 5.8], fov: 30 }}>
      <Heli onReady={onReady} drive={drive} />
    </ModelView>
  );
}

/** Debrief: lifts off and banks away to the upper right as the debrief scrolls in. */
export function HeliDebriefView({ onReady }: { onReady: () => void }) {
  const progress = useScrollProgress('#debrief', 'top bottom', 'center center');
  const drive = (heli: THREE.Object3D, t: number) => {
    const p = progress.current;
    const climb = ease(THREE.MathUtils.clamp((p - 0.2) / 0.8, 0, 1));
    heli.position.set(THREE.MathUtils.lerp(-3.2, 7.5, climb), THREE.MathUtils.lerp(-0.55, 2.4, climb) + Math.sin(t * 1.6) * 0.03 * (1 - climb), 0);
    heli.rotation.set(0, THREE.MathUtils.lerp(-0.25, 0.15, climb), THREE.MathUtils.lerp(0, -0.22, climb) + Math.sin(t * 1.1) * 0.015);
    // Nose-down while accelerating away (pitch around the model's Z for a +X-facing nose).
    heli.rotateZ(-0.12 * climb);
  };
  return (
    <ModelView camera={{ position: [0, 0.4, 9], fov: 30 }}>
      <Heli onReady={onReady} drive={drive} />
    </ModelView>
  );
}

useGLTF.preload(URL, false, true);
