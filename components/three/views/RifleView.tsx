'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { LOADOUT } from '@/lib/loadout';
import { model } from '@/lib/models';
import { loadoutApproach, rifleDropLanded } from '@/lib/motion/heli';
import { sceneProgress } from '@/lib/motion/scene-progress';
import { requestRefresh } from '@/lib/motion/refresh';
import { dbg, dbgEvent } from '@/lib/debug';
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
  const invalidate = useThree((s) => s.invalidate);

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
    dbg.rifle.loaded = true;
    dbgEvent('rifle model ready');
    invalidate(); // draw the correct pose right away, even if the canvas is rendering on demand
    requestRefresh('rifle model loaded');
    return () => void (dbg.rifle.loaded = false);
  }, [root, invalidate]);

  const glowing = useRef(-1);

  useFrame((state) => {
    const r = rig.current;
    if (!r) return;
    const { rifle, parts, base, materials } = r;
    const n = LOADOUT.length;
    // Pose = pure function of the scroll position: progress is read from the scene's trigger at
    // render time (set, never accumulated). Scene not running (e.g. ?3d=on on a small screen): assembled.
    const sp = sceneProgress('loadout');
    const p = sp < 0 ? 1 : sp;
    const t = state.clock.elapsedTime;
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
        const landed = rifleDropLanded(approach, i);
        const fall = (1 - landed) * DROP_HEIGHT;
        part.position.set(home.x + off[0] * loose, home.y + off[1] * loose + bob + fall, home.z + off[2] * loose);
      }
    });

    // Diagnostics: how far each part is from the pose the *current* scroll position calls for.
    const expected = sp;
    let maxErr = 0;
    if (expected >= 0)
      LOADOUT.forEach((module, i) => {
        const assembled = smooth(THREE.MathUtils.clamp(expected * n - i, 0, 1));
        const landed = rifleDropLanded(approach, i);
        for (const name of module.modelParts) {
          const part = parts.get(name), home = base.get(name), off = EXPLODE[name];
          if (!part || !home || !off) continue;
          const loose = 1 - assembled;
          const ex = home.x + off[0] * loose, ey = home.y + off[1] * loose + (1 - landed) * DROP_HEIGHT, ez = home.z + off[2] * loose;
          maxErr = Math.max(maxErr, Math.hypot(part.position.x - ex, part.position.y - ey, part.position.z - ez));
        }
      });
    Object.assign(dbg.rifle, { applied: p, expected, approach, maxPartErr: maxErr, lastFrameAt: performance.now(), frameScrollY: window.scrollY });

    // Glow the active module (pulse); clear the previous one.
    const active = Math.min(n - 1, Math.floor(p * n));
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
