import { loadoutApproach } from '@/lib/motion/heli';
import { smoothstep, lerp, type DirectorContext, type Pose } from '../types';

/**
 * Loadout: air-support drop. As the loadout screen scrolls up to its pinned
 * position the helicopter passes overhead left to right, light on the drop
 * zone; RifleView drops the parts into the exploded view underneath it on the
 * same approach progress (loadoutApproach).
 */
export function loadout({ W, H, rect }: DirectorContext): Pose | null {
  const stage = rect('#skills [data-loadout="stage"]');
  const zone = rect('#skills [data-loadout="viewport"]');
  if (!stage || !zone) return null;
  const u = loadoutApproach(stage.top, H);
  if (u <= 0 || u >= 1) return null;

  const size = Math.min(260, W * 0.17);
  const k = smoothstep(0.08, 1, u);
  const x = lerp(-size, W + size, k);
  const y = Math.max(90, zone.top - size * 0.12);
  return {
    x,
    y,
    size,
    yaw: 0,
    pitch: -0.08,
    light: smoothstep(0.2, 0.4, u) * (1 - smoothstep(0.85, 1, u)),
    lightX: x + size * 0.15,
    lightY: zone.top + zone.height * 0.55,
    lambda: 8,
  };
}
