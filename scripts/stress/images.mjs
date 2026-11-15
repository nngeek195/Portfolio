#!/usr/bin/env node
// Image audit: opens pages in system Chrome (DevTools protocol, no extra deps),
// scrolls through them so lazy images load, and logs every failed image
// request (URL, status, whether it went through /_next/image and the original
// URL behind it) plus every <img> that ended up broken (naturalWidth 0).
//
//   node --experimental-websocket scripts/stress/images.mjs [--url http://localhost:3100] [--pages /,/projects,/articles]

import { spawn } from 'node:child_process';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const BASE = arg('url', 'http://localhost:3100');
const PAGES = arg('pages', '/,/projects,/articles').split(',');
// --block <pattern>: block matching URLs (e.g. *res.cloudinary.com*) to test the placeholder fallback.
const BLOCK = arg('block', '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const port = 9300 + Math.floor(Math.random() * 300);
const chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--window-size=1440,900', `--user-data-dir=/tmp/img-audit-${port}`, 'about:blank'], { stdio: 'ignore' });
let list;
for (let i = 0; i < 60; i++) {
  try {
    list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    if (list.length) break;
  } catch {}
  await sleep(200);
}
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pend = new Map();
const requests = new Map();
const failures = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) {
    pend.get(d.id)(d);
    pend.delete(d.id);
    return;
  }
  const p = d.params;
  if (d.method === 'Network.requestWillBeSent' && (p.type === 'Image' || /\/_next\/image/.test(p.request.url))) requests.set(p.requestId, p.request.url);
  if (d.method === 'Network.responseReceived' && requests.has(p.requestId) && p.response.status >= 400) failures.push({ url: requests.get(p.requestId), status: p.response.status });
  if (d.method === 'Network.loadingFailed' && requests.has(p.requestId) && !p.canceled) failures.push({ url: requests.get(p.requestId), status: p.errorText });
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

const describe = (url) => {
  try {
    const u = new URL(url, BASE);
    if (u.pathname === '/_next/image') {
      const orig = new URL(u.searchParams.get('url'), BASE);
      return { optimizer: true, host: orig.host || '(local)', original: orig.href };
    }
    return { optimizer: false, host: u.host, original: u.href };
  } catch {
    return { optimizer: false, host: '?', original: url };
  }
};

await send('Network.enable');
if (BLOCK) await send('Network.setBlockedURLs', { urls: [BLOCK] });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
const summary = {};
for (const path of PAGES) {
  failures.length = 0;
  requests.clear();
  await send('Page.navigate', { url: `${BASE}${path}?3d=off` });
  await sleep(5000);
  // Scroll through slowly so every lazy image is requested, then wait for slow hosts.
  await ev(`(async () => { const max = document.documentElement.scrollHeight; for (let y = 0; y < max; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); } })()`);
  await sleep(9000);
  const broken = await ev(`[...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map(i => ({ src: i.currentSrc || i.src, alt: i.alt, where: (i.closest('section[id]')?.id || i.closest('main') && 'main' || '?') }))`);
  const total = await ev('document.images.length');
  const placeholders = await ev(`[...document.querySelectorAll('span')].filter((s) => s.textContent === 'Image unavailable').length`);
  const byHost = {};
  for (const f of failures) {
    const d = describe(f.url);
    const k = `${d.host} ${d.optimizer ? 'via /_next/image' : 'direct'} -> ${f.status}`;
    (byHost[k] ??= []).push(d.original);
  }
  console.log(`\n=== ${path}: ${total} <img>, ${failures.length} failed image requests, ${broken.length} broken <img>, ${placeholders} styled placeholders`);
  for (const [k, urls] of Object.entries(byHost)) {
    console.log(`  ${String(urls.length).padStart(3)}  ${k}`);
    for (const u of [...new Set(urls)].slice(0, 4)) console.log(`         ${u.length > 150 ? u.slice(0, 150) + '…' : u}`);
  }
  const brokenByHost = {};
  for (const b of broken) {
    const d = describe(b.src);
    (brokenByHost[`${d.host} ${d.optimizer ? 'via /_next/image' : 'direct'} (in #${b.where})`] ??= []).push(d.original);
  }
  for (const [k, urls] of Object.entries(brokenByHost)) console.log(`  broken ${String(urls.length).padStart(3)}  ${k}`);
  summary[path] = { images: total, failed: failures.length, broken: broken.length, placeholders };
}
console.log('\nSUMMARY', JSON.stringify(summary));
chrome.kill();
process.exit(0);
