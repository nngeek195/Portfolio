// Shared constants for the companion helicopter (components/three/companion).

/** Hero pinned-scene progress (0..1), emitted by HeroScene. */
export const HERO_PROGRESS_EVENT = 'hero:progress';
export type HeroProgressDetail = { progress: number };

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
