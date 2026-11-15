import { OBJECTIVES } from '@/lib/sections';
import { lerp, smoothstep, type DirectorContext, type Pose } from '../types';

// Which screen edge the helicopter holds in each section when no scene owns it.
const SIDE: Record<string, 'left' | 'right'> = {
  top: 'right', about: 'left', skills: 'left', operations: 'left', experience: 'right', certificates: 'left', contact: 'right', debrief: 'left',
};
const SELECTORS = OBJECTIVES.map((o) => `#${o.id}`);

/** Station x for a side: the middle of the gutter when there is room, otherwise peeking in at the screen edge (always on screen). */
export function stationX(side: 'left' | 'right', W: number, gutter: number, size: number) {
  const inset = gutter >= 110 ? gutter / 2 : Math.max(gutter / 2, size * 0.24);
  return side === 'right' ? W - inset : inset;
}

export function patrolSize(W: number, gutter: number) {
  return gutter >= 110 ? Math.min(gutter * 0.95, 130) : Math.min(110, Math.max(84, W * 0.07));
}

/**
 * Base layer of the flight: always defined and always on screen. Holds a side
 * station (gutter, or peeking in at the edge) and, as each section boundary
 * passes the middle of the screen, crosses to the next section's side through
 * the gap between them. Pure function of the scroll position (section rects).
 */
export function patrol({ W, H, gutter, scrollY, rect }: DirectorContext): Pose {
  const size = patrolSize(W, gutter);
  let x = stationX(SIDE[OBJECTIVES[0].id], W, gutter, size);
  let yaw = SIDE[OBJECTIVES[0].id] === 'right' ? Math.PI : 0;
  let crossing = 0;
  let crossingY = H / 2;
  for (let i = 1; i < SELECTORS.length; i++) {
    const r = rect(SELECTORS[i]);
    if (!r) continue;
    const f = smoothstep(-0.32 * H, 0.32 * H, H / 2 - r.top);
    if (f <= 0) break;
    const to = SIDE[OBJECTIVES[i].id];
    const toX = stationX(to, W, gutter, size);
    const moving = Math.abs(toX - x) > 1;
    x = lerp(x, toX, f);
    // Facing: towards the destination while crossing, then inwards (towards the content) on station.
    if (moving && f < 0.85) yaw = to === 'left' ? Math.PI : 0;
    else if (f >= 0.85 || !moving) yaw = to === 'right' ? Math.PI : 0;
    const c = moving ? Math.sin(Math.PI * f) : 0;
    if (c > crossing) {
      crossing = c;
      crossingY = Math.min(H * 0.82, Math.max(H * 0.18, r.top));
    }
  }
  const holdY = H * (0.36 + 0.12 * Math.sin(scrollY / 650));
  return { x, y: lerp(holdY, crossingY, crossing), size, yaw, light: 0, lambda: 4 };
}
