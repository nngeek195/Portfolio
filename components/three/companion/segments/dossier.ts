import { sceneProgress } from '@/lib/motion/scene-progress';
import { lerp, smoothstep, type Claim, type DirectorContext } from '../types';
import { patrolSize, stationX } from './patrol';

/**
 * Personnel File: fly-by while the dossier is pinned. Crosses left to right
 * above the file, its searchlight landing on each redaction bar as it wipes
 * (bars clear over 0..0.72), then holds the right-hand station until the
 * section scrolls away.
 */
export function dossier({ W, H, gutter, rect, rects }: DirectorContext): Claim | null {
  const p = sceneProgress('dossier');
  const section = rect('#about');
  const file = rect('#about [data-dossier="stage"] article');
  if (p < 0 || !section || !file) return null;
  const weight = smoothstep(0, 0.06, p) * smoothstep(H * 0.25, H * 0.62, section.bottom);
  if (weight <= 0) return null;

  const size = Math.min(230, W * 0.15);
  const startX = stationX('left', W, gutter, patrolSize(W, gutter));
  const endX = stationX('right', W, gutter, size);
  const u = smoothstep(0.02, 0.82, p);
  const x = lerp(startX, endX, u);
  const y = lerp(Math.max(96, file.top - size * 0.05) + Math.sin(u * Math.PI) * 26, H * 0.34, smoothstep(0.82, 1, p));

  const bars = rects('#about [data-redact]');
  const n = bars.length;
  let lightX = x + size;
  let lightY = file.top + file.height * 0.4;
  if (n) {
    const b = bars[Math.min(n - 1, Math.floor(p / (0.72 / n)))];
    lightX = b.left + b.width / 2;
    lightY = b.top + b.height / 2;
  }
  return {
    weight,
    pose: { x, y, size, yaw: 0, light: (1 - smoothstep(0.72, 0.82, p)) * smoothstep(0, 0.03, p), lightX, lightY, lambda: 7 },
  };
}
