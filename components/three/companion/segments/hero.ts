import { gsap } from 'gsap';
import { clamp01, lerp, smoothstep, type DirectorContext, type Pose } from '../types';

/**
 * Insertion: the live helicopter takes the exact place of the pre-rendered
 * still (which HeroScene keeps animating, invisibly, along its flight path),
 * so the swap is seamless. It drifts over the ridge with its searchlight
 * sweeping the ground, then climbs away out of frame before the eyelids close.
 */
export function hero({ t, W, H, rect, signals }: DirectorContext): Pose | null {
  const section = rect('#top');
  if (!section || section.bottom < H * 0.35) return null;
  const el = document.querySelector<HTMLElement>('[data-hero="heli"]');
  const still = rect('[data-hero="heli"]');
  if (!el || !still || still.width === 0) return null;

  const p = signals.heroProgress;
  const size = still.width * 0.9;
  // Gentle idle drift at rest, damped out once the scroll flight starts.
  const calm = 1 - smoothstep(0, 0.08, p);
  let x = still.left + still.width / 2 + Math.sin(t * 0.23) * 28 * calm;
  let y = still.top + still.height * 0.52 + Math.sin(t * 1.3) * 5;
  // Still's tilt (GSAP has folded Tailwind's -rotate-3 into its rotation; CSS negative = nose up for a nose-right heli).
  const deg = Number(gsap.getProperty(el, 'rotation') || 0);
  const pitch = (-deg * Math.PI) / 180;

  // 0.50 → 0.70: climb out of frame to the upper left, ahead of the eye slit.
  const exit = smoothstep(0.5, 0.7, p);
  x = lerp(x, -size * 0.7, exit);
  y = lerp(y, -size * 0.35, exit);

  return {
    x,
    y,
    size,
    // Once the scroll flight starts it turns (through a front view) to fly the way it's going.
    yaw: p > 0.03 ? Math.PI : 0,
    pitch: p > 0.03 ? lerp(-0.1, -0.2, exit) : pitch,
    light: clamp01(1 - p * 2.2),
    lightX: x + Math.sin(t * 0.55) * W * 0.18 - W * 0.05,
    lightY: H * 0.9,
    groundY: H * 0.92,
    shadow: 0.5 * (1 - exit),
    dust: 0,
    lambda: exit > 0 ? 5 : 14, // follow the still tightly, then fly freely
  };
}
