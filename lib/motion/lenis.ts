import type Lenis from 'lenis';

// The site's Lenis instance (created by MotionProvider), for code that needs to
// stop/start smooth scrolling or jump immediately (the boot preloader).
let instance: Lenis | null = null;
export const setLenis = (l: Lenis | null) => void (instance = l);
export const getLenis = () => instance;
