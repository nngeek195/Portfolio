'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SIDEARM_TRAITS } from '@/lib/profile';
import { model } from '@/lib/models';
import { DOSSIER_PROGRESS_EVENT, type DossierProgressDetail } from '@/components/scenes/DossierScene';
import { prepareModel, setGlow } from '../nightVision';
import ModelView, { ReadySignal } from './ModelView';
import { dbg } from '@/lib/debug';

const URL = model('pistol').url;

// Field-strip: where each part moves when its trait lights up (model space,
// metres, +X = muzzle). The guide rod travels with the slide step.
const STRIP: Record<string, [number, number, number]> = {
  red_dot: [-0.01, 0.05, 0],
  compensator: [0.07, 0, 0],
  slide: [-0.055, 0.03, 0],
  guide_rod: [0.07, -0.005, 0],
  frame: [0, 0, 0],
  magazine: [0, -0.07, 0],
};
const STEP_OF: Record<string, number> = { guide_rod: 2 }; // moves with trait 3 (slide)

// Mirrors DossierScene's timeline: trait i lights at 0.05 + i * 0.14; stamp at 0.78.
const TRAIT_START = 0.05;
const TRAIT_STEP = 0.7 / SIDEARM_TRAITS.length;
const REASSEMBLE = [0.78, 0.9] as const;
const smooth = (t: number) => t * t * (3 - 2 * t);

function Pistol({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(URL, false, true);
  const root = useMemo(() => scene.clone(true), [scene]);

  // Per-frame state lives in a ref (three.js objects are mutated every frame).
  const rig = useRef<{ pistol: THREE.Object3D; base: Map<string, THREE.Vector3>; materials: Map<string, THREE.MeshStandardMaterial[]> } | null>(null);
  useEffect(() => {
    // The glTF scene and the model node share the model's name, so find the node as
    // the parent of a known part (getObjectByName would return the scene root itself).
    const pistol = root.getObjectByName('frame')?.parent ?? root;
    rig.current = { pistol, base: new Map(pistol.children.map((c) => [c.name, c.position.clone()])), materials: prepareModel(pistol) };
    dbg.pistol.loaded = true;
  }, [root]);
  const target = useRef(0);
  const current = useRef(0);

  useEffect(() => {
    const onProgress = (e: Event) => (target.current = (e as CustomEvent<DossierProgressDetail>).detail.progress);
    window.addEventListener(DOSSIER_PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(DOSSIER_PROGRESS_EVENT, onProgress);
  }, []);

  useFrame((state, delta) => {
    const r = rig.current;
    if (!r) return;
    const { pistol, base, materials } = r;
    const p = (current.current = THREE.MathUtils.damp(current.current, target.current, 7, delta));
    const t = state.clock.elapsedTime;
    Object.assign(dbg.pistol, { applied: p, expected: dbg.triggers.dossier?.progress ?? -1, lastFrameAt: performance.now() });
    const back = smooth(THREE.MathUtils.clamp((p - REASSEMBLE[0]) / (REASSEMBLE[1] - REASSEMBLE[0]), 0, 1));

    for (const part of pistol.children) {
      const home = base.get(part.name);
      const off = STRIP[part.name];
      if (!home || !off) continue;
      const step = STEP_OF[part.name] ?? SIDEARM_TRAITS.findIndex((tr) => tr.part === part.name);
      const out = smooth(THREE.MathUtils.clamp((p - (TRAIT_START + step * TRAIT_STEP)) / (TRAIT_STEP * 0.8), 0, 1)) * (1 - back);
      part.position.set(home.x + off[0] * out, home.y + off[1] * out, home.z + off[2] * out);
      // The part being described glows; everything settles once cleared.
      const activeStep = Math.floor((p - TRAIT_START) / TRAIT_STEP);
      setGlow(materials.get(part.name), step === activeStep && back < 1 ? 0.5 + Math.sin(t * 3) * 0.2 : 0);
    }

    pistol.rotation.y = THREE.MathUtils.lerp(-0.45, 0.2, p) + Math.sin(t * 0.5) * 0.04;
    pistol.rotation.x = 0.12;
  });

  return (
    <>
      <primitive object={root} />
      <ReadySignal onReady={onReady} />
    </>
  );
}

export default function PistolView({ onReady }: { onReady: () => void }) {
  return (
    <ModelView camera={{ position: [0, 0.005, 0.6], fov: 30 }}>
      <Pistol onReady={onReady} />
    </ModelView>
  );
}

useGLTF.preload(URL, false, true);
