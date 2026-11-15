import type Lenis from 'lenis';

// The site's Lenis instance (created by MotionProvider), for code that needs to
// stop/start smooth scrolling or jump immediately (the boot preloader).
let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => void (instance = l);
export const getLenis = () => instance;

/**
 * Keyboard focus inside a pinned scene: jump (no smoothing) to the scroll
 * position where the focused element is actually visible. Applied again on the
 * next frame, after the browser's own focus scroll, which knows nothing about
 * pins and scrubbed transforms. `settle` runs after each jump: scenes use it to
 * update their trigger and finish the smoothed (scrubbed) animation at once, so
 * the element doesn't fade or slide in late while it already has focus.
 */
export function scrollForFocus(y: number, settle?: () => void) {
  const go = () => {
    if (instance) instance.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo({ top: y, behavior: 'auto' });
    settle?.();
  };
  go();
  requestAnimationFrame(go);
}
