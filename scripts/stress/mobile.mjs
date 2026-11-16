#!/usr/bin/env node
// Phone check for the 3D layer: emulates a phone (touch, mobile viewport,
// DPR 3) in system Chrome on the real GPU, loads the site with ?debug=1, then
// scrolls down the page in touch-sized steps. At each stop it records the 3D
// state (window.__dbg), the frame rate, and saves a screenshot to
// /tmp/mobile-shots/NN.png so the helicopter's placement can be looked at.
//
// Usage (needs a running production build):
//   npm run build && npx next start -p 3100
//   node --experimental-websocket scripts/stress/mobile.mjs [--url http://localhost:3100] [--size 390x844] [--query 3d=on]

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const BASE = arg('url', 'http://localhost:3100');
const [W, H] = arg('size', '390x844').split('x').map(Number);
const QUERY = arg('query', '');
const OUT = '/tmp/mobile-shots';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const port = 9400 + Math.floor(Math.random() * 400);
  const chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--no-default-browser-check', '--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', `--window-size=${W},${H}`, `--user-data-dir=/tmp/mobile-probe-${port}`, 'about:blank'], { stdio: 'ignore' });
  let list;
  for (let i = 0; i < 60; i++) {
    try {
      list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      if (list.length) break;
    } catch {}
    await sleep(200);
  }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pend = new Map();
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) {
      pend.get(d.id)(d);
      pend.delete(d.id);
    } else if (d.method === 'Runtime.exceptionThrown') console.log('  [page exception]', d.params.exceptionDetails.exception?.description?.split('\n')[0]);
  };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  return { chrome, send };
}

const evaluate = async (send, expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

// Frames per second over `ms`, measured in the page.
const FPS = (ms) => `new Promise((r) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < ${ms}) requestAnimationFrame(f); else r(Math.round(n * 1000 / (performance.now() - t0))); }; requestAnimationFrame(f); })`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { chrome, send } = await launch();
  try {
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 3, mobile: true });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }] });
    await send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36' });
    const url = `${BASE}/?debug=1${QUERY ? `&${QUERY}` : ''}`;
    console.log(`phone ${W}x${H} @3x, ${url}`);
    await send('Page.navigate', { url });
    await sleep(12000); // boot preloader + idle-after-load before the live helicopter mounts
    const renderer = await evaluate(send, `(() => { const gl = document.createElement('canvas').getContext('webgl2'); const i = gl && gl.getExtension('WEBGL_debug_renderer_info'); return gl ? String(gl.getParameter(i ? i.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : 'no webgl2'; })()`);
    console.log(`renderer: ${renderer}`);
    console.log('three:', JSON.stringify(await evaluate(send, 'window.__dbg && window.__dbg.three')));
    const total = await evaluate(send, 'document.documentElement.scrollHeight - innerHeight');
    const stops = 14;
    const rows = [];
    for (let i = 0; i <= stops; i++) {
      const y = Math.round((total * i) / stops);
      await evaluate(send, `window.scrollTo(0, ${y})`);
      await sleep(1400);
      const fps = await evaluate(send, FPS(1500));
      const s = await evaluate(send, `(() => { const d = window.__dbg; const h = d.heli; let sec = '-'; for (const s of document.querySelectorAll('main section[id]')) if (s.getBoundingClientRect().top < innerHeight * 0.5) sec = s.id; return { sec, live: h.live, owner: h.owner, x: Math.round(h.x), y: Math.round(h.y), size: Math.round(h.size), onScreen: h.onScreen, fellBack: d.three.fellBack, dpr: d.canvas.dpr, loop: d.canvas.frameloop }; })()`);
      rows.push({ i, scrollY: y, fps, ...s });
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(`${OUT}/${String(i).padStart(2, '0')}.png`, Buffer.from(shot.result.data, 'base64'));
    }
    console.table(rows);
    console.log('events:', JSON.stringify(await evaluate(send, 'window.__dbg.events'), null, 1));
    console.log(`screenshots in ${OUT}`);
  } finally {
    chrome.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
