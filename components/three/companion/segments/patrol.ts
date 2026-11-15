import { OBJECTIVES } from '@/lib/sections';
import { lerp, smoothstep, type DirectorContext, type Pose } from '../types';

const SELECTORS = OBJECTIVES.map((o) => `#${o.id}`);

/**
 * The default flight path, tied to scroll position rather than time: the
 * helicopter holds station in a side gutter (wide screens) or just off-screen,
 * and every time a section boundary passes the middle of the screen it crosses
 * to the other side through the gap between the two sections, banking into the
 * turn. Section segments (hero, dossier, ...) override this where they run.
 */
export function patrol({ W, H, gutter, scrollY, rect }: DirectorContext): Pose {
  const roomy = gutter >= 110;
  const size = roomy ? Math.min(gutter * 0.95, 130) : 120;
  const sideX = (k: number) => {
    const right = k % 2 === 0;
    if (roomy) return right ? W - gutter / 2 : gutter / 2;
    return right ? W + size : -size;
  };

  // Fractional "boundaries passed" count; the fraction is how far through the current crossing.
  let passed = 0;
  let crossingY = H / 2;
  let crossing = 0;
  for (let i = 1; i < SELECTORS.length; i++) {
    const r = rect(SELECTORS[i]);
    if (!r) continue;
    const u = smoothstep(-0.32 * H, 0.32 * H, H / 2 - r.top);
    passed += u;
    const c = Math.sin(Math.PI * u);
    if (c > crossing) {
      crossing = c;
      crossingY = Math.min(H * 0.82, Math.max(H * 0.18, r.top));
    }
  }
  const k = Math.floor(passed);
  const f = passed - k;
  const holdY = H * (0.36 + 0.14 * Math.sin(scrollY / 650));
  return {
    x: lerp(sideX(k), sideX(k + 1), f),
    y: lerp(holdY, crossingY, crossing),
    size,
    light: 0,
    lambda: 4,
  };
}
