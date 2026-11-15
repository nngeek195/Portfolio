import { SCENE_MEDIA } from '@/lib/motion/scenes';

// Shared by the 3D layer (ThreeProvider) and the boot preloader (which only
// prefetches the 3D code and models on devices that will actually use them).

/**
 * Decides whether real-time 3D runs. Requires the same conditions as the pinned
 * scenes (desktop-sized viewport, motion allowed) plus a capable device:
 * WebGL2, >= 4 CPU threads, >= 4 GB memory when reported, no Data Saver.
 * Override for testing with ?3d=on or ?3d=off in the URL.
 * Everywhere else the flat renders stay (phones, reduced motion, low-end).
 */
function detectCapable(): boolean {
  const force = new URLSearchParams(location.search).get('3d');
  if (force === 'off') return false;
  if (force === 'on') return true;
  if (!window.matchMedia(SCENE_MEDIA).matches) return false;
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return false;
  if ((nav.hardwareConcurrency ?? 8) < 4) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

let capableCache: boolean | null = null;
export const getCapable = () => (capableCache ??= detectCapable());
