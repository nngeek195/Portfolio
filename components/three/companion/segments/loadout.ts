import { loadoutApproach } from '@/lib/motion/heli';
import { lerp, smoothstep, type Claim, type DirectorContext } from '../types';
import { patrolSize, stationX } from './patrol';

/**
 * Loadout: air-support drop. As the loadout screen scrolls up to its pin the
 * helicopter passes overhead right to left (from where the dossier left it),
 * light on the drop zone, while RifleView drops the parts into the exploded
 * view under it (same loadoutApproach value). Then it holds the left station
 * through the module steps until the section scrolls away.
 */
export function loadout({ W, H, gutter, rect }: DirectorContext): Claim | null {
  const section = rect('#skills');
  const stage = rect('#skills [data-loadout="stage"]');
  const zone = rect('#skills [data-loadout="viewport"]');
  if (!section || !stage || !zone) return null;
  const u = loadoutApproach(stage.top, H);
  const weight = smoothstep(0, 0.15, u) * smoothstep(H * 0.25, H * 0.62, section.bottom);
  if (weight <= 0) return null;

  const size = Math.min(260, W * 0.17);
  const k = smoothstep(0.05, 1, u);
  const x = lerp(stationX('right', W, gutter, size), stationX('left', W, gutter, patrolSize(W, gutter)), k);
  const y = lerp(Math.max(90, zone.top - size * 0.12), H * 0.3, smoothstep(0.85, 1, u));
  return {
    weight,
    pose: {
      x,
      y,
      size: lerp(size, patrolSize(W, gutter), smoothstep(0.85, 1, u)),
      yaw: Math.PI,
      pitch: -0.08 * (1 - smoothstep(0.85, 1, u)),
      light: smoothstep(0.12, 0.3, u) * (1 - smoothstep(0.8, 0.95, u)),
      lightX: x - size * 0.15,
      lightY: zone.top + zone.height * 0.55,
      lambda: 8,
    },
  };
}
