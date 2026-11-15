import { clamp01, easeInOut, easeOut, lerp, smoothstep, type DirectorContext, type Pose } from '../types';

/**
 * Debrief: lift-off. Idling on the pad as the section arrives, the rotor
 * spins up, it lifts, banks and climbs away to the upper right while the
 * "camera" pulls back (it shrinks into the night sky) and its night-vision
 * grade powers down. Tied to the last stretch of the page so it always
 * completes at the bottom.
 */
export function debrief({ W, H, scrollY, maxScroll, rect }: DirectorContext): Pose | null {
  const sec = rect('#debrief');
  const pad = rect('#debrief [data-debrief="pad"]');
  if (!sec || !pad || sec.top > H * 0.9) return null;

  const start = sec.top + scrollY - H * 0.9;
  const p = clamp01((scrollY - start) / Math.max(1, maxScroll - start));
  const size0 = Math.min(300, W * 0.2);
  const padX = pad.left + pad.width * 0.28;
  const padY = pad.top + pad.height * 0.55;

  const c = easeInOut(smoothstep(0.22, 1, p));
  const lift = smoothstep(0.22, 0.4, p);
  return {
    x: lerp(padX, W * 0.88, c),
    y: lerp(padY, H * 0.1, c) - lift * 10,
    size: lerp(size0, 34, easeOut(c)),
    yaw: 0,
    pitch: -0.16 * c + 0.06 * lift * (1 - c),
    roll: -0.32 * Math.sin(Math.PI * c),
    rotor: lerp(0.28, 1, smoothstep(0.06, 0.24, p)),
    dust: smoothstep(0.08, 0.2, p) * (1 - smoothstep(0.3, 0.5, p)),
    groundY: padY + size0 * 0.17,
    shadow: 0.7 * (1 - smoothstep(0.25, 0.55, p)),
    nv: lerp(0.85, 0.15, smoothstep(0.55, 1, p)),
    bright: lerp(1, 0.3, smoothstep(0.6, 1, p)),
    light: 0,
    lambda: 6,
  };
}
