'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera, View, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { model } from '@/lib/models';
import { PROFILE } from '@/lib/profile';
import { HELI_LIVE_ATTR } from '@/lib/motion/heli';
import { dbg, dbgEvent } from '@/lib/debug';
import { getAudioContext, useSoundOn } from '@/lib/audio/sound';
import type { RotorAudio } from '@/lib/audio/rotor';
import { prepareModel, applyNightVision, type NightVisionUniforms } from '../nightVision';
import { Environment, ModelErrorBoundary } from '../views/ModelView';
import { createDirector, type Director } from './director';
import { holdLive, lastHeli } from './handoff';
import { requestRefresh } from '@/lib/motion/refresh';
import { makeCrew, makeParticles, makeRotorDisc, makeSearchlight, makeShadow, makeShimmer, makeStrobe, makeTailNumber } from './effects';

const URL = model('heli').url;
const MODEL_LENGTH = 2.78; // model units, nose to tail (rotor included)
const BODY_Z = -0.036; // body centre line (model units)
// Basic-shape crew silhouettes on the outboard benches (STEP 2 option).
const SHOW_CREW = true;
// PLACEHOLDER: callsign — tail number shows the callsign once PROFILE.callsign is set.
const TAIL_TEXT = PROFILE.callsign ? PROFILE.callsign.toUpperCase() : '[CALLSIGN]';

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;
const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const q = new THREE.Quaternion(); // per-frame scratch objects
const v3 = new THREE.Vector3();
const setOpacity = (mats: THREE.Material[], o: number) => mats.forEach((m) => (m.opacity = o));
const fine = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

type RigState = {
  x: number; y: number; size: number; yaw: number; pitch: number; roll: number; topDown: number;
  light: number; lx: number; ly: number; dust: number; shadow: number; rotor: number; nv: number; bright: number;
  vx: number; vy: number; yawRate: number; scrollV: number; lastScroll: number; rotorSpeed: number; tiltZ: number; tiltR: number;
  yawTarget: number; started: boolean;
};

function buildRig(gltfScene: THREE.Object3D, gl: THREE.WebGLRenderer) {
  const root = gltfScene.clone(true);
  const heli = root.getObjectByName('rotor_main')?.parent ?? root;
  const uniforms: NightVisionUniforms = { uNV: { value: 0.85 }, uBright: { value: 1 } };
  const materials = prepareModel(heli, uniforms);
  const bladeMats = materials.get('rotor_main') ?? [];
  for (const m of bladeMats) m.transparent = true;

  const rotors = heli.children
    .filter((c) => Array.isArray(c.userData.spinAxis))
    .map((c) => ({ node: c, axis: new THREE.Vector3(...(c.userData.spinAxis as [number, number, number])).normalize(), mult: c.name === 'rotor_tail' ? 1.9 : 1 }));

  const mainDisc = makeRotorDisc(1.15);
  mainDisc.rotation.x = -Math.PI / 2;
  mainDisc.position.set(0.17, 0.335, -0.03);
  const tailDisc = makeRotorDisc(0.245);
  tailDisc.position.set(-1.235, 0.097, -0.112);

  const strobeRed = makeStrobe('#ff4a3a'); // port (-Z)
  strobeRed.position.set(-1.36, 0.41, -0.33);
  const strobeGreen = makeStrobe('#5dff6a'); // starboard (+Z)
  strobeGreen.position.set(-1.36, 0.41, 0.32);
  const beacon = makeStrobe('#ff6a4a');
  beacon.position.set(-0.05, 0.3, BODY_Z);

  const shimmer = makeShimmer();
  shimmer.mesh.position.set(-0.42, 0.44, BODY_Z);

  const lightAnchor = new THREE.Object3D();
  lightAnchor.position.set(0.5, -0.36, BODY_Z);

  const extras: THREE.Object3D[] = [mainDisc, tailDisc, strobeRed, strobeGreen, beacon, shimmer.mesh, lightAnchor, makeTailNumber(TAIL_TEXT, !PROFILE.callsign)];
  if (SHOW_CREW) {
    const crewMat = new THREE.MeshStandardMaterial({ color: '#1b1f1b', roughness: 0.9, metalness: 0 });
    applyNightVision(crewMat, uniforms);
    extras.push(makeCrew(crewMat));
  }
  heli.add(...extras);

  // Rig hierarchy: outer (screen position + scale + pointer tilt) → topDown (tips the view to look down)
  // → attitude (yaw → pitch → roll, intrinsic) → model.
  const attitude = new THREE.Group();
  attitude.rotation.order = 'YZX';
  attitude.add(root);
  const top = new THREE.Group();
  top.add(attitude);
  const outer = new THREE.Group();
  outer.add(top);

  const searchlight = makeSearchlight();
  searchlight.group.position.z = -700; // behind the hull in depth
  const shadow = makeShadow();
  shadow.position.z = -800;
  const particles = makeParticles(Math.min(gl.getPixelRatio(), 2));
  particles.points.position.z = 600;

  return { outer, top, attitude, rotors, mainDisc, tailDisc, strobeRed, strobeGreen, beacon, shimmer, lightAnchor, bladeMats, uniforms, searchlight, shadow, particles };
}

function Rig({ onVisible }: { onVisible: (visible: boolean) => void }) {
  const { scene: gltfScene } = useGLTF(URL, false, true);
  const get = useThree((s) => s.get);
  // Everything three.js lives in a ref and is mutated per frame.
  const rig = useRef<ReturnType<typeof buildRig> | null>(null);

  useEffect(() => {
    const { scene, gl } = get(); // `scene` is this view's own (portal) scene
    const built = buildRig(gltfScene, gl);
    rig.current = built;
    dbg.heli.loaded = true;
    dbgEvent('heli model ready');
    requestRefresh('heli model loaded');
    scene.add(built.outer, built.searchlight.group, built.shadow, built.particles.points);
    // Draw on top of the other model views: clear depth before this view renders.
    const prev = scene.onBeforeRender;
    scene.onBeforeRender = (renderer) => renderer.clearDepth();
    return () => {
      scene.onBeforeRender = prev;
      scene.remove(built.outer, built.searchlight.group, built.shadow, built.particles.points);
      rig.current = null;
    };
  }, [gltfScene, get]);

    // The glTF scene and the model node share the name "heli": take the parent of a known part.


  // Director lives with the effect (StrictMode-safe: its listeners are re-attached on remount).
  const directorRef = useRef<Director | null>(null);
  useEffect(() => {
    const d = createDirector();
    directorRef.current = d;
    return () => {
      d.dispose();
      directorRef.current = null;
    };
  }, []);

  // Pointer, for the subtle tilt towards the cursor (mouse / trackpad only).
  const pointer = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    if (!fine()) return;
    const onMove = (e: PointerEvent) => (pointer.current = { x: e.clientX, y: e.clientY });
    const onLeave = () => (pointer.current = null);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  // Mark the page "live" once the first 3D frame is up (CSS fades the flat stills); undo on unmount.
  const live = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      live.current?.();
      live.current = null;
      dbg.heli.loaded = false;
      onVisible(false);
    },
    [onVisible]
  );

  // Rotor sound, only once the visitor has turned sound on (the synth module loads then).
  const soundOn = useSoundOn();
  const audio = useRef<RotorAudio | null>(null);
  useEffect(() => {
    if (!soundOn) return;
    let cancelled = false;
    let a: RotorAudio | null = null;
    import('@/lib/audio/rotor').then(({ createRotorAudio }) => {
      const ctx = getAudioContext();
      if (cancelled || !ctx) return;
      a = audio.current = createRotorAudio(ctx);
    });
    return () => {
      cancelled = true;
      a?.dispose();
      audio.current = null;
    };
  }, [soundOn]);

  const visible = useRef(false);
  const s = useRef<RigState>({
    x: 0, y: 0, size: 100, yaw: 0, pitch: 0, roll: 0, topDown: 0, light: 0, lx: 0, ly: 0, dust: 0, shadow: 0, rotor: 1, nv: 0.85, bright: 1,
    vx: 0, vy: 0, yawRate: 0, scrollV: 0, lastScroll: 0, rotorSpeed: 22, tiltZ: 0, tiltR: 0, yawTarget: 0, started: false,
  });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const r = s.current;
    const director = directorRef.current;
    if (!director) return;
    const pose = director.pose(t);
    const k = pose.lambda ?? 4;
    const topDown = pose.topDown ?? 0;

    // Scroll velocity (px/s), smoothed.
    const sy = window.scrollY;
    if (!r.started) r.lastScroll = sy;
    const scrolled = sy - r.lastScroll;
    r.scrollV = damp(r.scrollV, scrolled / Math.max(delta, 1e-3), 6, dt);
    r.lastScroll = sy;

    // Heading target comes from the pose only (never from the direction of travel, so the same
    // scroll position always gives the same heading). Side view keeps yaw in [-PI, 0] so turns
    // pass through a front view.
    if (pose.yaw !== undefined) r.yawTarget = pose.yaw;
    let yawT = wrapPi(r.yawTarget);
    if (topDown < 0.5) {
      if (yawT > 0) yawT = -yawT;
    } else {
      yawT = r.yaw + wrapPi(yawT - r.yaw); // shortest turn on the map
    }

    if (!r.started) {
      Object.assign(r, { x: pose.x, y: pose.y, size: pose.size, yaw: yawT, topDown, lx: pose.lightX ?? pose.x, ly: pose.lightY ?? H, started: true });
    }
    const px = r.x, py = r.y, pyaw = r.yaw;
    const vdt = Math.max(dt, 1e-3); // frames can arrive with a zero delta: never divide by it (NaN would stick)
    r.x = damp(r.x, pose.x, k, dt);
    r.y = damp(r.y, pose.y, k, dt);
    r.size = damp(r.size, pose.size, k, dt);
    r.topDown = damp(r.topDown, topDown, 3, dt);
    r.yaw = damp(r.yaw, yawT, 3.2, dt);
    r.vx = damp(r.vx, (r.x - px) / vdt, 8, dt);
    r.vy = damp(r.vy, (r.y - py) / vdt, 8, dt);
    r.yawRate = damp(r.yawRate, (r.yaw - pyaw) / vdt, 6, dt);
    // Keep the side-view heading bounded after map-view turns (shortest-arc turns can wind it up).
    if (r.topDown < 0.02 && Math.abs(r.yaw) > Math.PI * 1.5) r.yaw = wrapPi(r.yaw);

    // Attitude from motion: lean into travel (nose down), bank into turns and with scroll direction.
    const side = 1 - r.topDown;
    const forward = r.vx * Math.cos(r.yaw) * side;
    const pitchT = (pose.pitch ?? 0) - clamp(forward / 2200, -0.28, 0.28) + clamp(-r.vy / 5000, -0.08, 0.08) * side;
    const rollT = (pose.roll ?? 0) + clamp(r.yawRate * 0.22, -0.45, 0.45) + clamp(r.scrollV / 9000, -0.14, 0.14);
    r.pitch = damp(r.pitch, pitchT, 5, dt);
    r.roll = damp(r.roll, rollT, 4, dt);

    // Subtle tilt towards the cursor.
    let tiltZ = 0, tiltR = 0;
    const p = pointer.current;
    if (p) {
      tiltZ = clamp(((r.x - p.x) / W) * 0.12, -0.07, 0.07);
      tiltR = clamp(((p.y - r.y) / H) * 0.16, -0.08, 0.08);
    }
    r.tiltZ = damp(r.tiltZ, tiltZ, 3, dt);
    r.tiltR = damp(r.tiltR, tiltR, 3, dt);

    r.light = damp(r.light, pose.light ?? 0, 4, dt);
    r.lx = damp(r.lx, pose.lightX ?? r.x, 7, dt);
    r.ly = damp(r.ly, pose.lightY ?? r.y + 200, 7, dt);
    r.dust = damp(r.dust, pose.dust ?? 0, 3, dt);
    r.shadow = damp(r.shadow, pose.shadow ?? 0, 3, dt);
    r.nv = damp(r.nv, pose.nv ?? 0.85, 3, dt);
    r.bright = damp(r.bright, pose.bright ?? 1, 3, dt);

    // Rotor speed follows scroll velocity (spins up while you scroll, settles at rest).
    const rotorT = (pose.rotor ?? 1) * (20 + Math.min(Math.abs(r.scrollV) / 55, 28));
    r.rotorSpeed = damp(r.rotorSpeed, rotorT, 2.2, dt);

    // --- apply ---------------------------------------------------------------
    const parts = rig.current;
    if (!parts) return;
    const { outer, top, attitude, rotors, mainDisc, tailDisc, strobeRed, strobeGreen, beacon, shimmer, lightAnchor, bladeMats, uniforms, searchlight, shadow, particles } = parts;
    const scale = r.size / MODEL_LENGTH;
    outer.position.set(r.x - W / 2, H / 2 - r.y, 0);
    outer.scale.setScalar(scale);
    outer.rotation.z = r.tiltZ;
    top.rotation.x = r.topDown * (Math.PI / 2);
    attitude.rotation.set(r.roll + r.tiltR, r.yaw, r.pitch);

    for (const rot of rotors) rot.node.quaternion.multiply(q.setFromAxisAngle(rot.axis, r.rotorSpeed * rot.mult * dt));
    const blur = THREE.MathUtils.smoothstep(r.rotorSpeed, 14, 40);
    (mainDisc.material as THREE.MeshBasicMaterial).opacity = 0.03 + blur * 0.3;
    (tailDisc.material as THREE.MeshBasicMaterial).opacity = 0.02 + blur * 0.3;
    setOpacity(bladeMats, 1 - blur * 0.6);

    // Nav strobes: red/green double-flash, beacon slow pulse.
    const cyc = t % 1.3;
    const flash = cyc < 0.06 || (cyc > 0.16 && cyc < 0.22) ? 1 : 0.18;
    const sm = 0.05 / Math.max(0.6, scale / 160) + 0.04;
    (strobeRed.material as THREE.SpriteMaterial).opacity = flash;
    (strobeGreen.material as THREE.SpriteMaterial).opacity = flash;
    strobeRed.scale.setScalar(sm * (flash > 0.5 ? 1.6 : 1));
    strobeGreen.scale.setScalar(sm * (flash > 0.5 ? 1.6 : 1));
    const bp = 0.5 + 0.5 * Math.sin(t * 4.2);
    (beacon.material as THREE.SpriteMaterial).opacity = bp * bp * 0.6;
    beacon.scale.setScalar(sm);

    shimmer.uniforms.uTime.value = t;
    shimmer.uniforms.uStrength.value = side * (0.6 + blur * 0.4);
    uniforms.uNV.value = r.nv;
    uniforms.uBright.value = r.bright;

    // Searchlight from the belly to its target (scene px, y up).
    lightAnchor.getWorldPosition(v3);
    searchlight.update(v3.x, v3.y, r.lx - W / 2, H / 2 - r.ly, r.light * side * r.bright, t);

    // Ground shadow: under the heli on the ground line (side view) or offset below it (map view).
    const shadowMat = shadow.material as THREE.MeshBasicMaterial;
    const groundY = pose.groundY ?? null;
    if (r.topDown > 0.5) {
      shadow.position.set(r.x - W / 2 + r.size * 0.08, H / 2 - r.y - r.size * 0.14, -800);
      shadow.scale.set(r.size * 0.9, r.size * 0.62, 1);
      shadowMat.opacity = r.shadow * 0.55;
    } else if (groundY !== null) {
      const h = Math.max(0, groundY - r.y);
      const near = clamp(1 - h / (H * 0.7), 0, 1);
      shadow.position.set(r.x - W / 2, H / 2 - groundY, -800);
      shadow.scale.set(r.size * (0.7 + (1 - near) * 0.5), r.size * 0.12, 1);
      shadowMat.opacity = r.shadow * near * 0.7;
    } else shadowMat.opacity = 0;

    // Dust + rotor wash on nearby motes.
    const dustAlive = particles.update(dt, W, H, r.x - W / 2, H / 2 - r.y, r.size * 0.42, groundY === null ? null : H / 2 - groundY, r.dust, side * blur, scrolled);

    // --- visibility: keep frames running only while something is on screen ----
    const m = r.size * 0.7;
    const onScreen = r.x + m > 0 && r.x - m < W && r.y + m > 0 && r.y - m < H;
    const targetOn = pose.x + m > 0 && pose.x - m < W && pose.y + m > 0 && pose.y - m < H;
    const want = onScreen || targetOn || dustAlive || r.light > 0.02;
    if (want !== visible.current) {
      visible.current = want;
      onVisible(want);
    }

    // Rotor chop: louder when the helicopter is bigger (closer) and on screen; silent once frames stop.
    const offBy = Math.max(0, -r.x, r.x - W, -r.y, r.y - H);
    const presence = want ? clamp(1 - offBy / 450, 0, 1) : 0;
    audio.current?.update(clamp(r.size / 420, 0.1, 1) * presence * r.bright, clamp((r.rotorSpeed - 6) / 42, 0, 1));
    Object.assign(lastHeli, { valid: true, x: r.x, y: r.y, size: r.size, yaw: r.yaw, pitch: r.pitch, bright: r.bright });
    Object.assign(dbg.heli, {
      owner: director.owner, x: r.x, y: r.y, size: r.size, bright: r.bright, nv: r.nv, targetX: pose.x, targetY: pose.y,
      onScreen, want, finite: [r.x, r.y, r.size, r.yaw, r.pitch, r.roll].every(Number.isFinite), lastFrameAt: performance.now(), frameScrollY: sy,
      live: document.documentElement.hasAttribute(HELI_LIVE_ATTR),
    });
    if (!live.current) {
      let release: (() => void) | null = null;
      const raf = requestAnimationFrame(() => (release = holdLive('3d')));
      live.current = () => (cancelAnimationFrame(raf), release?.());
    }
  });

  return null;
}

/**
 * The companion helicopter: one full-viewport view in the shared canvas
 * (orthographic, 1 unit = 1 CSS px) that flies the model across the whole
 * page, directed by the current section (see ./director.ts).
 */
export default function CompanionHeli({ onVisible, onFailed }: { onVisible: (visible: boolean) => void; onFailed: () => void }) {
  // A failed model download (flaky network) is retried once; if it fails again the flat
  // helicopter takes over (onFailed) rather than leaving the page without one.
  const [attempt, setAttempt] = useState(0);
  const onError = useCallback(() => {
    dbgEvent(`heli model failed (attempt ${attempt + 1})`);
    useGLTF.clear(URL);
    if (attempt === 0) window.setTimeout(() => setAttempt(1), 1500);
    else onFailed();
  }, [attempt, onFailed]);
  return (
    <View className="pointer-events-none fixed inset-0" index={10}>
      <OrthographicCamera makeDefault position={[0, 0, 1000]} near={1} far={4000} />
      <ambientLight intensity={0.25} />
      <hemisphereLight args={['#d8ffd0', '#0b120b', 0.7]} />
      <directionalLight position={[-2, 3, 4]} intensity={2.2} />
      <directionalLight position={[3, 1, -3]} intensity={1.6} color="#7cff5b" />
      <Environment />
      <ModelErrorBoundary key={attempt} onError={onError}>
        <Suspense fallback={null}>
          <Rig onVisible={onVisible} />
        </Suspense>
      </ModelErrorBoundary>
    </View>
  );
}

useGLTF.preload(URL, false, true);
