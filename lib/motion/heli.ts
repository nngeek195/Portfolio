// Shared constants for the companion helicopter (components/three/companion).

/** In Operations the helicopter holds this fraction of the viewport width while the map scrolls under it. */
export const OPS_HELI_X = 0.3;

/** Set on <html> while the live 3D helicopter is flying; CSS hides the flat helicopter stills. */
export const HELI_LIVE_ATTR = 'data-heli-live';

/**
 * Loadout air drop: 0 when the loadout stage's top enters at the bottom of the
 * viewport, 1 when it reaches its pinned position (top + 88px). Shared by the
 * helicopter pass overhead and the rifle parts descending into place.
 */
export function loadoutApproach(stageTop: number, viewportHeight: number) {
  return Math.min(1, Math.max(0, (viewportHeight - stageTop) / (viewportHeight - 88)));
}

/**
 * Air drop: how far rifle module `i` has come down (0 = still up, 1 = landed)
 * at a given approach value. Timed to the helicopter's right-to-left pass
 * over the rifle (it is over the right-hand half around approach 0.2–0.6).
 */
export function rifleDropLanded(approach: number, i: number) {
  const t = Math.min(1, Math.max(0, (approach - 0.22 - i * 0.06) / 0.28));
  return t * t * (3 - 2 * t);
}
