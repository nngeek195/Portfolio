#!/usr/bin/env node
// Web vitals probe: loads a page N times in system Chrome (cold cache) and
// reports FCP, LCP (+ element), CLS and when the hero intro / page became
// usable. Optional network + CPU throttling.
//
//   node --experimental-websocket scripts/stress/vitals.mjs --url "http://localhost:3100/" [--runs 3] [--net slow4g] [--cpu 4] [--size 1440x900]

import { spawn } from 'node:child_process';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const URL_ = arg('url', 'http://localhost:3100/');
const RUNS = Number(arg('runs', '3'));
const NET = arg('net', '');
const CPU = Number(arg('cpu', '1'));
const [W, H] = arg('size', '1440x900').split('x').map(Number);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// DevTools "Slow 4G" preset.
const PRESETS = { slow4g: { latency: 562.5, downloadThroughput: (1.44 * 1024 * 1024) / 8, uploadThroughput: (675 * 1024) / 8 } };

const port = 9200 + Math.floor(Math.random() * 300);
const chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--window-size=${W},${H}`, `--user-data-dir=/tmp/vitals-${port}`, 'about:blank'], { stdio: 'ignore' });
let list;
for (let i = 0; i < 60; i++) {
  try { list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (list.length) break; } catch {}
  await sleep(200);
}
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.enable');
await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: W < 700 });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__v = { lcp: 0, lcpEl: '', cls: 0, fcp: 0, shifts: [] };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { __v.lcp = e.startTime; const el = e.element; __v.lcpEl = el ? (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.dataset?.hero ? '[data-hero=' + el.dataset.hero + ']' : '') + ' ' + (el.textContent || el.getAttribute('src') || '').trim().slice(0, 30)) : '?'; } }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { __v.cls += e.value; __v.shifts.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map(s => s.node && (s.node.id || s.node.className || s.node.tagName)).join(',').slice(0, 80)]); } }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') __v.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
` });
if (NET) await send('Network.emulateNetworkConditions', { offline: false, ...PRESETS[NET] });
if (CPU > 1) await send('Emulation.setCPUThrottlingRate', { rate: CPU });

const rows = [];
for (let r = 0; r < RUNS; r++) {
  await send('Network.clearBrowserCache');
  await send('Network.setCacheDisabled', { cacheDisabled: false });
  await ev('sessionStorage.clear()').catch(() => {});
  await send('Page.navigate', { url: URL_ });
  await sleep(NET ? 16000 : 9000);
  const v = await ev(`({ ...window.__v, bootDone: window.__bootDoneAt ?? null })`);
  rows.push(v);
  console.log(`run ${r + 1}: FCP ${Math.round(v.fcp)}ms  LCP ${Math.round(v.lcp)}ms (${v.lcpEl})  CLS ${v.cls.toFixed(4)}${v.bootDone ? `  preloader exit ${Math.round(v.bootDone)}ms` : ''}${v.shifts.length ? '  shifts ' + JSON.stringify(v.shifts.slice(0, 4)) : ''}`);
}
const med = (k) => { const a = rows.map((x) => x[k]).sort((a, b) => a - b); return a[Math.floor(a.length / 2)]; };
console.log(`MEDIAN  FCP ${Math.round(med('fcp'))}ms  LCP ${Math.round(med('lcp'))}ms  CLS ${med('cls').toFixed(4)}`);
chrome.kill();
process.exit(0);
