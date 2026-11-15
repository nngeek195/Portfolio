'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { LOADOUT } from '@/lib/loadout';
import { model } from '@/lib/models';
import { LOADOUT_PROGRESS_EVENT, type LoadoutProgressDetail } from '@/components/scenes/LoadoutScene';
import { loadoutApproach } from '@/lib/motion/heli';
import { prepareModel, setGlow } from '../nightVision';
import ModelView, { ReadySignal } from './ModelView';

const URL = model('rifle').url;

// Where each part floats before it is assembled (model space: metres, +X = muzzle, +Y = up).
const EXPLODE: Record<string, [number, number, number]> = {
  receiver: [0, -0.1, 0.05],
  scope: [0, 0.24, -0.04],
  sight_rear: [-0.06, 0.17, 0.06],
  sight_front: [0.06, 0.17, 0.06],
  handguard: [0.14, -0.13, 0.08],
  foregrip: [0.12, -0.27, 0.04],
  magazine: [0, -0.3, -0.06],
  stock: [-0.3, -0.02, 0.06],
  cheekrest: [-0.26, 0.15, -0.04],
  buttpad: [-0.44, 0, 0.02],
  suppressor: [0.46, 0.02, -0.05],
};

const smooth = (t: number) => t * t * (3 - 2 * t);
// Air drop: parts start this far above their exploded positions (metres) and
// come down, module by module, as the helicopter passes over (see loadoutApproach).
const DROP_HEIGHT = 0.75;

function Rifle({ onReady }: { onReady: () => void }) {
  const { scene } = useGLTF(URL, false, true);
  const root = useMemo(() => scene.clone(true), [scene]);

  // Per-frame state lives in a ref (three.js objects are mutated every frame).
  const rig = useRef<{ rifle: THREE.Object3D; parts: Map<string, THREE.Object3D>; base: Map<string, THREE.Vector3>; materials: Map<string, THREE.MeshStandardMaterial[]> } | null>(null);
  useEffect(() => {
    // The glTF scene and the model node share the model's name, so find the node as
    // the parent of a known part (getObjectByName would return the scene root itself).
    const rifle = root.getObjectByName('receiver')?.parent ?? root;
    rig.current = {
      rifle,
      parts: new Map(rifle.children.map((c) => [c.name, c])),
      base: new Map(rifle.children.map((c) => [c.name, c.position.clone()])),
      materials: prepareModel(rifle),
    };
  }, [root]);

  const target = useRef({ progress: 0, index: 0 });
  const current = useRef(0);
  const glowing = useRef(-1);

  useEffect(() => {
    const onProgress = (e: Event) => (target.current = (e as CustomEvent<LoadoutProgressDetail>).detail);
    window.addEventListener(LOADOUT_PROGRESS_EVENT, onProgress);
    return () => window.removeEventListener(LOADOUT_PROGRESS_EVENT, onProgress);
  }, []);

  useFrame((state, delta) => {
    const r = rig.current;
    if (!r) return;
    const { rifle, parts, base, materials } = r;
    const p = (current.current = THREE.MathUtils.damp(current.current, target.current.progress, 6, delta));
    const t = state.clock.elapsedTime;
    const n = LOADOUT.length;
    const stage = document.querySelector('#skills [data-loadout="stage"]');
    const approach = stage ? loadoutApproach(stage.getBoundingClientRect().top, window.innerHeight) : 1;

    LOADOUT.forEach((module, i) => {
      const assembled = smooth(THREE.MathUtils.clamp(p * n - i, 0, 1));
      for (const name of module.modelParts) {
        const part = parts.get(name);
        const home = base.get(name);
        const off = EXPLODE[name];
        if (!part || !home || !off) continue;
        const loose = 1 - assembled;
        const bob = Math.sin(t * 1.4 + i) * 0.006 * loose;
        const landed = smooth(THREE.MathUtils.clamp((approach - 0.52 - i * 0.04) / 0.26, 0, 1));
        const fall = (1 - landed) * DROP_HEIGHT;
        part.position.set(home.x + off[0] * loose, home.y + off[1] * loose + bob + fall, home.z + off[2] * loose);
      }
    });

    // Glow the active module (pulse); clear the previous one.
    const active = target.current.index;
    if (glowing.current !== active) {
      LOADOUT[glowing.current]?.modelParts.forEach((name) => setGlow(materials.get(name), 0));
      glowing.current = active;
    }
    const pulse = 0.55 + Math.sin(t * 3) * 0.25;
    LOADOUT[active]?.modelParts.forEach((name) => setGlow(materials.get(name), pulse));

    // Three-quarter view while exploded, turning to a clean side view when assembled.
    rifle.rotation.y = THREE.MathUtils.lerp(-0.55, -0.08, p) + Math.sin(t * 0.4) * 0.03;
    rifle.rotation.x = THREE.MathUtils.lerp(0.22, 0.04, p);
  });

  return (
    <>
      <primitive object={root} />
      <ReadySignal onReady={onReady} />
    </>
  );
}

export default function RifleView({ onReady }: { onReady: () => void }) {
  return (
    <ModelView camera={{ position: [0, 0.08, 1.95], fov: 28 }}>
      <Rifle onReady={onReady} />
    </ModelView>
  );
}

useGLTF.preload(URL, false, true);
