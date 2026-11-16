import { SCENE_MEDIA } from '@/lib/motion/scenes';
import { getFx } from '@/lib/fx';

// Shared by the 3D layer (ThreeProvider) and the boot preloader (which only
// prefetches the 3D code and models on devices that will actually use them).

/**
 * Decides whether real-time 3D runs. Requires the same conditions as the pinned
 * scenes (desktop-sized viewport, motion allowed) plus a capable device:
 * hardware-accelerated WebGL2 (not a software renderer), >= 4 CPU threads,
 * >= 4 GB memory when reported, no Data Saver.
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
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    const software = isSoftwareRenderer(gl);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); // free the probe context
    return !software;
  } catch {
    return false;
  }
}

/**
 * WebGL drawn by the CPU (no GPU acceleration: blocklisted drivers, VMs, remote
 * desktops, headless Chrome as used by Lighthouse / PageSpeed Insights). The 3D
 * layer would saturate the main thread there, so those get the flat renders.
 */
const SOFTWARE_RENDERER = /swiftshader|llvmpipe|lavapipe|softpipe|software|basic render|mesa offscreen/i;
function isSoftwareRenderer(gl: WebGL2RenderingContext): boolean {
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '');
  return SOFTWARE_RENDERER.test(renderer);
}

let capableCache: boolean | null = null;
export const getCapable = () => (capableCache ??= detectCapable());

/**
 * Whether the 3D layer runs right now: a capable device with FX: FULL. FX: LITE
 * switches it off (flat renders, no live helicopter) and can change at any time,
 * so this is not cached; ?3d=on still forces it on for testing.
 */
export function get3D(): boolean {
  if (new URLSearchParams(location.search).get('3d') === 'on') return true;
  return getFx() !== 'lite' && getCapable();
}
