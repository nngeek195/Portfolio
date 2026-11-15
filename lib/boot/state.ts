// Boot preloader state, shared by the preloader, the scroll engine and the 3D
// layer. The inline boot script sets html[data-boot="on"] before first paint
// when the preloader is shown; the controller moves it to "exit", then "done".

export const BOOT_DONE_EVENT = 'boot:done';

declare global {
  interface Window {
    /** performance.now() when the preloader started to exit (the hero intro starts then). */
    __bootExitAt?: number;
    /** performance.now() when the preloader was fully gone. */
    __bootDoneAt?: number;
  }
}

export function isBooting() {
  if (typeof document === 'undefined') return false;
  const s = document.documentElement.dataset.boot;
  return s === 'on' || s === 'exit';
}

/** Resolves once the preloader has finished (immediately if it isn't shown). */
export function whenBootDone(): Promise<void> {
  if (!isBooting()) return Promise.resolve();
  return new Promise((resolve) => window.addEventListener(BOOT_DONE_EVENT, () => resolve(), { once: true }));
}

/** When the hero intro started (navigation start without a preloader). */
export const introStartedAt = () => (typeof window !== 'undefined' ? (window.__bootExitAt ?? 0) : 0);
