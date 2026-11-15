import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { dbgEvent } from '@/lib/debug';

// One place to re-measure the scroll scenes. ScrollTrigger's own resize
// refresh is deferred until its "scroll end" signal, which can arrive late or
// never while Lenis drives the scroll, so the scenes kept the previous
// viewport's positions after a resize. requestRefresh() forces a refresh once
// the page has been still for a moment (a refresh mid-scroll could jump a
// pinned scene), coalescing bursts of requests.

let timer = 0;
let lastScroll = 0;
let reasons = new Set<string>();

function run() {
  if (performance.now() - lastScroll < 250) {
    timer = window.setTimeout(run, 150);
    return;
  }
  timer = 0;
  dbgEvent(`ScrollTrigger refresh (${[...reasons].join(', ')})`);
  reasons = new Set();
  ScrollTrigger.refresh();
}

export function requestRefresh(reason: string) {
  if (typeof window === 'undefined') return;
  reasons.add(reason);
  if (!timer) timer = window.setTimeout(run, 200);
}

/** Wires the automatic triggers: resize and page-height changes (late images, toggles). Returns cleanup. */
export function installAutoRefresh() {
  const onScroll = () => (lastScroll = performance.now());
  const onResize = () => requestRefresh('resize');
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  // Height changes from content loading after the first measure. A refresh itself changes the
  // height (pin spacers), so compare against the height right after the last refresh, and stop
  // watching if it ever keeps oscillating.
  let measured = document.documentElement.scrollHeight;
  let count = 0;
  const windowStart = performance.now();
  const onRefreshed = () => (measured = document.documentElement.scrollHeight);
  ScrollTrigger.addEventListener('refresh', onRefreshed);
  const ro = new ResizeObserver(() => {
    const h = document.documentElement.scrollHeight;
    if (Math.abs(h - measured) < 2) return;
    if (++count > 20 && performance.now() - windowStart < 20000) return ro.disconnect();
    requestRefresh('layout height');
  });
  ro.observe(document.body);
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    ScrollTrigger.removeEventListener('refresh', onRefreshed);
    ro.disconnect();
    window.clearTimeout(timer);
    timer = 0;
  };
}
