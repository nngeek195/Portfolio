import { clamp01, lerp, smoothstep, type DirectorContext, type Pose } from '../types';

/**
 * Personnel File: a quick fly-by while the dossier is pinned. The helicopter
 * crosses right to left above the file and its searchlight sweeps over each
 * redaction bar just as DossierScene wipes it away (bars clear over 0..0.72).
 */
export function dossier({ W, H, rect, rects, signals }: DirectorContext): Pose | null {
  const p = signals.dossierProgress;
  const file = rect('#about [data-dossier="stage"] article');
  if (!file || p <= 0.001 || p >= 0.999 || file.bottom < 0 || file.top > H) return null;

  const size = Math.min(230, W * 0.15);
  const u = clamp01(p / 0.82);
  const x = lerp(W + size * 0.8, -size * 0.8, u);
  const y = Math.max(96, file.top - size * 0.05) + Math.sin(u * Math.PI) * 26;

  const bars = rects('#about [data-redact]');
  const n = bars.length;
  let lightX = x - size;
  let lightY = file.top + file.height * 0.4;
  if (n) {
    const i = Math.min(n - 1, Math.floor(p / (0.72 / n)));
    const b = bars[i];
    lightX = b.left + b.width / 2;
    lightY = b.top + b.height / 2;
  }
  return {
    x,
    y,
    size,
    yaw: Math.PI,
    light: (1 - smoothstep(0.72, 0.82, p)) * smoothstep(0, 0.03, p),
    lightX,
    lightY,
    lambda: 7,
  };
}
