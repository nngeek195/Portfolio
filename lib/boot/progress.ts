import { MODELS } from '@/lib/models';
import { get3D } from '@/lib/three-capability';

// Real loading progress for the boot preloader. Each terminal line is a task
// with a weight; the percentage is the weighted share of work actually done.
//
//   auth    the app has hydrated (the controller is running)
//   fonts   document.fonts.ready
//   nvg     hero helicopter still + the first profile photo decoded (other pages: window load)
//   engine  the three.js chunk downloaded and evaluated (prefetch only, no scene)
//   assets  heli.glb, rifle.glb, pistol.glb fetched into the HTTP cache, byte by byte
//           (prefetch only: nothing is parsed or built here)
// engine/assets only run on the home page on devices that will use 3D; elsewhere
// they complete at once and read "FLAT".

export type LineId = 'auth' | 'fonts' | 'nvg' | 'engine' | 'assets';
type Task = { weight: number; done: number; result?: 'ok' | 'flat' };
export type BootProgress = {
  /** 0..1, weighted. */
  value: () => number;
  /** Called when a line completes (once per line). */
  onLine: (fn: (id: LineId, result: 'ok' | 'flat') => void) => void;
};

const WEIGHTS: Record<LineId, number> = { auth: 0.5, fonts: 1, nvg: 1.5, engine: 1.5, assets: 4 };

async function fetchWithProgress(url: string, onProgress: (f: number) => void) {
  try {
    const res = await fetch(url, { priority: 'low' } as RequestInit);
    const total = Number(res.headers.get('content-length')) || 0;
    if (!res.body || !total) {
      await res.arrayBuffer();
    } else {
      const reader = res.body.getReader();
      let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        got += value.byteLength;
        onProgress(Math.min(1, got / total));
      }
    }
  } catch {
    // A failed prefetch never blocks the boot; the model loads (or falls back) later.
  }
  onProgress(1);
}

function imageSettled(img: HTMLImageElement) {
  if (img.complete) return Promise.resolve();
  return new Promise<void>((resolve) => {
    img.addEventListener('load', () => resolve(), { once: true });
    img.addEventListener('error', () => resolve(), { once: true });
  });
}

export function startBootProgress(): BootProgress {
  const tasks = Object.fromEntries(Object.entries(WEIGHTS).map(([k, w]) => [k, { weight: w, done: 0 } as Task])) as Record<LineId, Task>;
  const listeners: ((id: LineId, result: 'ok' | 'flat') => void)[] = [];
  const set = (id: LineId, done: number, result: 'ok' | 'flat' = 'ok') => {
    const t = tasks[id];
    if (t.result) return;
    t.done = Math.max(t.done, Math.min(1, done));
    if (t.done >= 1) {
      t.result = result;
      listeners.forEach((l) => l(id, result));
    }
  };

  const home = !!document.getElementById('top');
  const threeOk = home && get3D();

  // auth: we are running, so the app has hydrated.
  queueMicrotask(() => set('auth', 1));

  // fonts
  (document.fonts?.ready ?? Promise.resolve()).then(() => set('fonts', 1));

  // nvg: the hero still and the profile photos (lazy by default: load them now).
  if (home) {
    // Only the profile photo that shows first: the rest stay lazy, so they don't compete
    // with the app's own code on a slow connection.
    const firstPhoto = document.querySelector<HTMLImageElement>('#about figure img');
    const imgs = [...document.querySelectorAll<HTMLImageElement>('[data-hero="heli"]'), ...(firstPhoto ? [firstPhoto] : [])];
    imgs.forEach((img) => img.loading === 'lazy' && (img.loading = 'eager'));
    let settled = 0;
    if (!imgs.length) set('nvg', 1);
    imgs.forEach((img) =>
      imageSettled(img).then(() => {
        settled++;
        set('nvg', settled / imgs.length);
      })
    );
  } else if (document.readyState === 'complete') set('nvg', 1);
  else window.addEventListener('load', () => set('nvg', 1), { once: true });

  // engine + assets (3D devices on the home page only)
  if (threeOk) {
    import('@/components/three/SharedCanvas').then(
      () => set('engine', 1),
      () => set('engine', 1)
    );
    const files = MODELS.map((m) => ({ url: m.url, bytes: m.bytes || 1 }));
    const total = files.reduce((n, f) => n + f.bytes, 0);
    const got = files.map(() => 0);
    files.forEach((f, i) =>
      fetchWithProgress(f.url, (frac) => {
        got[i] = frac * f.bytes;
        set('assets', got.reduce((a, b) => a + b, 0) / total);
      })
    );
  } else {
    queueMicrotask(() => {
      set('engine', 1, 'flat');
      set('assets', 1, 'flat');
    });
  }

  return {
    value: () => {
      let w = 0;
      let d = 0;
      for (const t of Object.values(tasks)) {
        w += t.weight;
        d += t.weight * t.done;
      }
      return w ? d / w : 1;
    },
    onLine: (fn) => void listeners.push(fn),
  };
}
