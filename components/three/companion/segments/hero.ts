import { gsap } from 'gsap';
import { sceneProgress } from '@/lib/motion/scene-progress';
import { clamp01, lerp, smoothstep, type Claim, type DirectorContext } from '../types';

/**
 * Insertion: the live helicopter takes the exact place of the pre-rendered
 * still (which HeroScene keeps animating, invisibly, along its flight path),
 * drifts with its searchlight sweeping the ground, then climbs out of frame
 * (hero progress 0.5 → 0.7) before the eye slit closes. Owns the helicopter
 * while the hero fills the screen; hands over as the hero scrolls away.
 */
export function hero({ t, W, H, rect }: DirectorContext): Claim | null {
  const section = rect('#top');
  const el = document.querySelector<HTMLElement>('[data-hero="heli"]');
  const still = rect('[data-hero="heli"]');
  if (!section || !el || !still || still.width === 0) return null;
  const weight = smoothstep(H * 0.55, H * 0.95, section.bottom);
  if (weight <= 0) return null;

  const sp = sceneProgress('hero');
  const p = sp < 0 ? 0 : sp;
  const size = still.width * 0.9;
  const calm = 1 - smoothstep(0, 0.08, p);
  let x = still.left + still.width / 2 + Math.sin(t * 0.23) * 28 * calm;
  let y = still.top + still.height * 0.52 + Math.sin(t * 1.3) * 5;
  // GSAP has folded Tailwind's -rotate-3 into its rotation; CSS negative = nose up for a nose-right heli.
  const pitch = (-Number(gsap.getProperty(el, 'rotation') || 0) * Math.PI) / 180;
  const exit = smoothstep(0.5, 0.7, p);
  x = lerp(x, -size * 0.7, exit);
  y = lerp(y, -size * 0.35, exit);
  return {
    weight,
    pose: {
      x,
      y,
      size,
      yaw: p > 0.03 ? Math.PI : 0,
      pitch: p > 0.03 ? lerp(-0.1, -0.2, exit) : pitch,
      light: clamp01(1 - p * 2.2),
      lightX: x + Math.sin(t * 0.55) * W * 0.18 - W * 0.05,
      lightY: H * 0.9,
      groundY: H * 0.92,
      shadow: 0.5 * (1 - exit),
      lambda: exit > 0 ? 5 : 14,
    },
  };
}
