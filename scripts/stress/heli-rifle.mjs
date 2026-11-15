#!/usr/bin/env node
// Stress test for the companion helicopter and the Loadout rifle.
//
// Drives system Google Chrome over the DevTools protocol (no extra deps) on
// the real GPU, against a running site with ?debug=1 (which exposes the
// runtime diagnostics as window.__dbg, see lib/debug.ts). An in-page sampler
// checks every animation frame:
//   - helicopter: invisible while it should be visible (once it has gone live,
//     except while the hero's eye slit closes), with the reason
//   - rifle: parts away from the pose the current scroll position calls for,
//     or the rifle not re-rendering after a scroll while on screen
// "settled" counts only samples taken >1 s after the last scroll change:
// those are the stuck / missing states a visitor actually sees.
//
// Usage (Node 20 needs the flag; Node 22+ has WebSocket built in):
//   npm run build && npx next start -p 3100
//   node --experimental-websocket scripts/stress/heli-rifle.mjs [--url http://localhost:3100]
//        [--size 1440x900] [--mode auto|forced|both] [--swiftshader] [--only flicks,nav,...]

import { spawn } from 'node:child_process';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const BASE = arg('url', 'http://localhost:3100');
const [W, H] = arg('size', '1440x900').split('x').map(Number);
const MODE = arg('mode', 'both');
const ONLY = arg('only', '')?.split(',').filter(Boolean);
const GPU = process.argv.includes('--swiftshader')
  ? ['--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  : ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const port = 9400 + Math.floor(Math.random() * 400);
  const chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--no-default-browser-check', ...GPU, `--window-size=${W},${H}`, `--user-data-dir=/tmp/heli-stress-${port}`, 'about:blank'], { stdio: 'ignore' });
  let list;
  for (let i = 0; i < 60; i++) {
    try {
      list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      if (list.length) break;
    } catch {}
    await sleep(200);
  }
  const page = list.find((t) => t.type === 'page');
  const browserWs = new WebSocket((await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await Promise.all([new Promise((r) => (ws.onopen = r)), new Promise((r) => (browserWs.onopen = r))]);
  const mk = (sock) => {
    let id = 0;
    const pend = new Map();
    sock.onmessage = (m) => {
      const d = JSON.parse(m.data);
      if (d.id && pend.has(d.id)) {
        pend.get(d.id)(d);
        pend.delete(d.id);
      } else if (d.method === 'Runtime.exceptionThrown') console.log('  [page exception]', d.params.exceptionDetails.exception?.description?.split('\n')[0]);
    };
    return (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); sock.send(JSON.stringify({ id: i, method, params })); });
  };
  return { chrome, send: mk(ws), browser: mk(browserWs), targetId: page.id };
}

// In-page sampler (re-installed after every navigation).
const SAMPLER = `(() => {
  if (window.__stress) return;
  const S = window.__stress = { frames: 0, heliShould: 0, heliMissing: 0, heliMissingSettled: 0, rifleChecked: 0, rifleBad: 0, rifleBadSettled: 0, rifleStale: 0, maxRifleErr: 0, reasons: {}, examples: [] };
  let lastY = scrollY, lastChange = performance.now(), everLive = false;
  const note = (kind, reason, extra) => {
    S.reasons[kind + ': ' + reason] = (S.reasons[kind + ': ' + reason] || 0) + 1;
    if (S.examples.length < 60) S.examples.push({ kind, reason, y: Math.round(scrollY), ...extra });
  };
  const sectionAt = () => {
    let id = '-';
    for (const s of document.querySelectorAll('main section[id]')) if (s.getBoundingClientRect().top < innerHeight * 0.5) id = s.id;
    return id;
  };
  function tick() {
    requestAnimationFrame(tick);
    const d = window.__dbg;
    if (!d) return;
    const now = performance.now();
    if (Math.abs(scrollY - lastY) > 0.5) { lastY = scrollY; lastChange = now; }
    const settled = now - lastChange > 1000;
    S.frames++;
    // ---- helicopter
    const h = d.heli;
    if (h.live) everLive = true;
    const hero = d.triggers.hero;
    const heroExit = hero && hero.progress > 0.6 && hero.progress < 1 && scrollY <= hero.end;
    if (everLive && !heroExit) {
      S.heliShould++;
      let reason = '';
      const fresh = Math.abs(h.frameScrollY - scrollY) < 60 || now - h.lastFrameAt < 150;
      const inView = h.x + h.size * 0.3 > 0 && h.x - h.size * 0.3 < innerWidth && h.y + h.size * 0.15 > 0 && h.y - h.size * 0.15 < innerHeight;
      // After a fallback the flat stand-in writes the same heli state (owner "... (flat)"); without
      // one (old behaviour) the state goes stale and the helicopter counts as missing.
      const flat = d.three.fellBack && String(h.owner).endsWith('(flat)');
      if (d.three.fellBack && !flat) reason = 'fell back, no helicopter';
      else if (!flat && (!d.three.companionMounted || !h.loaded)) reason = 'companion not mounted';
      else if (!h.finite) reason = 'NaN pose';
      else if (!inView) reason = 'off screen (owner ' + h.owner + ')';
      else if (!fresh) reason = 'frames not rendering (loop ' + d.canvas.frameloop + ')';
      else if (h.bright < 0.25) reason = 'too dim';
      if (reason) {
        S.heliMissing++;
        if (settled) { S.heliMissingSettled++; note('heli', reason, { section: sectionAt(), x: Math.round(h.x), hy: Math.round(h.y), owner: h.owner }); }
      }
    }
    // ---- rifle: expected progress is derived here from the scroll position and the scene trigger's
    // start/end (independent of the app), then compared with what the rifle last applied; the rifle's
    // own maxPartErr checks that the parts really sit where that applied value puts them.
    const slot = document.querySelector('#skills [data-model-slot="rifle"]');
    const r = slot && slot.getBoundingClientRect();
    const onScreen = r && r.width > 0 && r.bottom > 0 && r.top < innerHeight;
    const t = d.triggers.loadout;
    if (onScreen && d.rifle.loaded && t) {
      S.rifleChecked++;
      const expected = Math.min(1, Math.max(0, (scrollY - t.start) / Math.max(1, t.end - t.start)));
      const fresh = Math.abs(d.rifle.frameScrollY - scrollY) <= 2;
      const stale = !fresh && now - d.rifle.lastFrameAt > 250;
      const progErr = fresh ? Math.abs(d.rifle.applied - expected) : 0;
      const err = d.rifle.maxPartErr;
      S.maxRifleErr = Math.max(S.maxRifleErr, err);
      S.maxProgErr = Math.max(S.maxProgErr || 0, progErr);
      if (stale) S.rifleStale++;
      if (err > 0.015 || progErr > 0.02 || stale) {
        S.rifleBad++;
        if (settled) { S.rifleBadSettled++; note('rifle', stale ? 'not re-rendering' : progErr > 0.02 ? 'progress off scroll' : 'parts off pose', { err: +err.toFixed(3), applied: +d.rifle.applied.toFixed(3), expected: +expected.toFixed(3) }); }
      }
    }
  }
  requestAnimationFrame(tick);
})()`;

async function main() {
  const modes = MODE === 'both' ? ['auto', 'forced'] : [MODE];
  const results = {};
  for (const mode of modes) {
    const { chrome, send, browser, targetId } = await launch();
    const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
    const url = `${BASE}/?debug=1${mode === 'forced' ? '&3d=on' : ''}`;
    const load = async () => {
      await send('Page.navigate', { url });
      await sleep(7000); // load + idle swap of the live helicopter
      await ev(SAMPLER);
    };
    await load();
    if (mode === 'forced') await send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const env = await ev(`({ three: __dbg.three.enabled, live: __dbg.heli.live, renderer: (()=>{const g=document.createElement('canvas').getContext('webgl2');const e=g.getExtension('WEBGL_debug_renderer_info');return g.getParameter(e.UNMASKED_RENDERER_WEBGL)})() })`);
    console.log(`\n=== mode ${mode} (${url}, ${W}x${H}${mode === 'forced' ? ', CPU 4x throttled' : ''}) ${JSON.stringify(env)}`);

    const wheel = (dy) => send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: W / 2, y: H / 2, deltaX: 0, deltaY: dy });
    const maxY = () => ev('document.documentElement.scrollHeight - innerHeight');
    const tops = () => ev(`[...document.querySelectorAll('main section[id]')].map(s => [s.id, Math.round(s.getBoundingClientRect().top + scrollY)])`);
    const jump = (y) => ev(`window.scrollTo(0, ${y})`);
    const trig = (name, f) => ev(`(() => { const t = __dbg.triggers.${name}; return t ? Math.round(t.start + (t.end - t.start) * ${f}) : null })()`);
    const snap = async () => ev(`(() => { const s = JSON.parse(JSON.stringify(window.__stress)); Object.assign(window.__stress, { frames: 0, heliShould: 0, heliMissing: 0, heliMissingSettled: 0, rifleChecked: 0, rifleBad: 0, rifleBadSettled: 0, rifleStale: 0, maxRifleErr: 0, maxProgErr: 0, reasons: {}, examples: [] }); return s; })()`);

    const scenarios = {
      async flicks() {
        let dir = 1;
        for (let i = 0; i < 40; i++) {
          const y = await ev('scrollY');
          if (y > (await maxY()) - 300) dir = -1;
          if (y < 300) dir = 1;
          for (let k = 0; k < 6; k++) { await wheel(dir * (300 + Math.random() * 500)); await sleep(16); }
          await sleep(80 + Math.random() * 500);
          if (i % 8 === 7) await sleep(1300); // settle now and then
        }
        await sleep(1300);
      },
      async nav() {
        for (const id of ['about', 'skills', 'operations', 'experience', 'certificates', 'contact', 'debrief', 'top', 'skills', 'contact', 'about', 'operations']) {
          await ev(`(() => { const a = document.querySelector('header a[href="/#${id}"], header a[href="#${id}"]'); if (a) a.click(); else location.hash = '#${id}'; })()`);
          await sleep(1800);
        }
        const m = await maxY();
        for (let i = 0; i < 12; i++) { await jump(Math.round(Math.random() * m)); await sleep(1400); }
        for (const id of ['skills', 'contact', 'top']) { await ev(`location.hash = '#${id}'`); await sleep(1500); }
      },
      async boundaries() {
        for (const [, top] of (await tops()).slice(1)) {
          await jump(Math.max(0, top - 450));
          await sleep(700);
          for (let k = 0; k < 6; k++) {
            for (let j = 0; j < 3; j++) { await wheel(260); await sleep(20); }
            await sleep(250);
            for (let j = 0; j < 3; j++) { await wheel(-260); await sleep(20); }
            await sleep(250);
          }
          await sleep(1300);
        }
      },
      async reload() {
        // Reload, then jump mid-scene ~1 s later, before the models have loaded (a plain reload or
        // a deep link lands at the top: the browser's scroll restoration is overridden).
        for (const [name, f] of [['loadout', 0.5], ['loadout', 1.05], ['dossier', 0.4], ['loadout', 0.15]]) {
          const y = await trig(name, f);
          await send('Page.reload');
          await sleep(1200);
          await ev(SAMPLER);
          if (y != null) await jump(y);
          await sleep(9000);
          for (let j = 0; j < 3; j++) { await wheel(-200); await sleep(25); }
          await sleep(1500);
        }
      },
      async resize() {
        for (const [name, f] of [['loadout', 0.4], ['dossier', 0.5]]) {
          const y = await trig(name, f);
          if (y == null) continue;
          await jump(y);
          await sleep(1200);
          await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
          await sleep(1800);
          await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
          await sleep(1800);
          for (let j = 0; j < 4; j++) { await wheel(300); await sleep(30); }
          await sleep(1300);
        }
      },
      async hidden() {
        for (const [name, f] of [['loadout', 0.6], ['dossier', 0.3]]) {
          const y = await trig(name, f);
          if (y == null) continue;
          await jump(y);
          await sleep(1200);
          const { result } = await browser('Target.createTarget', { url: 'about:blank' });
          await sleep(300);
          const vis = await ev('document.visibilityState');
          await sleep(3000);
          await browser('Target.activateTarget', { targetId });
          await browser('Target.closeTarget', { targetId: result.targetId });
          await sleep(1500);
          console.log(`  (hidden test: visibilityState while other tab in front = ${vis})`);
          for (let j = 0; j < 6; j++) { await wheel(-250); await sleep(30); }
          await sleep(1300);
        }
      },
      async fallback() {
        // Force the frame-rate fallback mid-scroll (debug hook) and keep scrolling: the swap must
        // wait for the scroll to stop and the helicopter must carry on (flat) without vanishing.
        if (mode === 'forced') return console.log('  (fallback scenario skipped: ?3d=on suppresses fallback)');
        const y = await trig('loadout', 0.3);
        await jump(y);
        await sleep(1500);
        await ev('__dbg.hooks.fallback && __dbg.hooks.fallback("stress test")');
        for (let i = 0; i < 30; i++) { await wheel(i < 15 ? 260 : -260); await sleep(60); }
        await sleep(2500);
        const m = await maxY();
        for (let i = 0; i < 6; i++) { await jump(Math.round(Math.random() * m)); await sleep(1300); }
        await sleep(3500); // the swap happens here, once the page has been still for 1.2 s
        for (let i = 0; i < 8; i++) { await jump(Math.round(Math.random() * m)); await sleep(1300); }
        for (let i = 0; i < 20; i++) { await wheel(i < 10 ? 300 : -300); await sleep(60); }
        await sleep(1500);
        console.log('  (after fallback: ' + JSON.stringify(await ev('({ fellBack: __dbg.three.fellBack, owner: __dbg.heli.owner })')) + ')');
      },
    };

    results[mode] = {};
    for (const [name, run] of Object.entries(scenarios)) {
      if (ONLY.length && !ONLY.includes(name)) continue;
      await snap();
      const t0 = Date.now();
      await run();
      const s = await snap();
      const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) + '%' : '-');
      results[mode][name] = s;
      console.log(
        `  ${name.padEnd(10)} ${((Date.now() - t0) / 1000).toFixed(0).padStart(3)}s  heli missing ${String(s.heliMissing).padStart(5)}/${String(s.heliShould).padEnd(5)} (${pct(s.heliMissing, s.heliShould).padStart(6)})  settled ${String(s.heliMissingSettled).padStart(4)}   rifle off-pose ${String(s.rifleBad).padStart(4)}/${String(s.rifleChecked).padEnd(4)} settled ${String(s.rifleBadSettled).padStart(4)}  stale ${s.rifleStale}  maxPartErr ${s.maxRifleErr.toFixed(3)}m maxProgErr ${(s.maxProgErr || 0).toFixed(2)}`
      );
      for (const [k, v] of Object.entries(s.reasons)) console.log(`      ${String(v).padStart(5)}  ${k}`);
    }
    const events = await ev('__dbg.events.join("\\n")');
    console.log('  debug events:\n    ' + (events || '').split('\n').slice(-12).join('\n    '));
    // ScrollTrigger staleness: after everything has loaded and been scrolled through, does a fresh
    // refresh move any scene trigger? (If so, the positions in use were measured too early.)
    await jump(0);
    await sleep(1500);
    const st = await ev(`(async () => { const pick = () => Object.fromEntries(Object.entries(__dbg.triggers).filter(([, t]) => t).map(([k, t]) => [k, [Math.round(t.start), Math.round(t.end)]])); const b = pick(); __dbgRefresh(); await new Promise((r) => setTimeout(r, 400)); return { before: b, after: pick() }; })()`);
    const moved = Object.keys(st.before).filter((k) => JSON.stringify(st.before[k]) !== JSON.stringify(st.after[k]));
    console.log(`  trigger staleness: ${moved.length ? 'MOVED on refresh -> ' + moved.map((k) => `${k} ${st.before[k]} -> ${st.after[k]}`).join('; ') : 'none (positions match a fresh refresh)'}`);
    results[mode].staleTriggers = moved;
    chrome.kill();
  }
  return results;
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
