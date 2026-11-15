#!/usr/bin/env node
// README audit: reads the published projects from Firestore (READ-ONLY, same
// client SDK and config as the site) and calls /api/github/readme for each of
// them the way the project popup does, logging status and a body summary.
// Also probes a repo that is NOT published (must stay blocked when signed out).
// Never prints secrets.
//
//   node --env-file=.env.local scripts/stress/readme.mjs [--url http://localhost:3100] [--token <admin ID token>]

import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const BASE = arg('url', 'http://localhost:3100');
const TOKEN = arg('token', '');

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);
const snap = await getDocs(query(collection(db, 'curated_content'), where('category', '==', 'project')));
const projects = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

console.log(`${projects.length} published projects (stored fields):`);
for (const p of projects) console.log(`  repoName=${JSON.stringify(p.repoName ?? null)}  repoUrl=${JSON.stringify(p.repoUrl ?? null)}  storedReadme=${typeof p.readmeHtml === 'string' && p.readmeHtml ? 'yes' : 'no'}  source=${p.source ?? '-'}`);

const call = async (repo, label) => {
  const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
  const t = Date.now();
  try {
    const r = await fetch(`${BASE}/api/github/readme?repo=${encodeURIComponent(repo)}`, { headers });
    const text = await r.text();
    let body;
    try {
      const j = JSON.parse(text);
      body = j.html ? `html ${j.html.length} chars${/No README found/.test(j.html) ? ' ("No README found")' : ''}` : JSON.stringify(j).slice(0, 140);
    } catch {
      body = text.slice(0, 100);
    }
    console.log(`  ${String(r.status).padEnd(4)} ${String(Date.now() - t).padStart(5)}ms  ${label.padEnd(28)} ${body}`);
    return r.status;
  } catch (e) {
    console.log(`  ERR  ${label} ${e.message}`);
    return 0;
  }
};

console.log(`\n/api/github/readme (${TOKEN ? 'signed in' : 'signed out'}) at ${BASE}:`);
const results = [];
for (const p of projects) {
  // The popup sends item.repoName.
  if (p.repoName) results.push(await call(p.repoName, String(p.repoName)));
  else console.log(`  (no repoName) repoUrl=${p.repoUrl ?? '-'}`);
}
console.log('\nmatching variants (case, owner prefix):');
await call('webify.me', 'webify.me (lower case)');
await call('kaveeshasm/Webify.me', 'kaveeshasm/Webify.me');
await call('CV-NET-ORG/CVNET-FRONTEND', 'CV-NET-ORG/CVNET-FRONTEND');
console.log('\nmust stay blocked / rejected when signed out:');
await call('definitely-not-a-published-repo', 'unpublished repo (404)');
await call('someoneelse/Webify.me', 'published name, other owner (404)');
await call('../../etc', 'path traversal (400)');
console.log(`\nSUMMARY ${JSON.stringify(results.reduce((m, s) => ((m[s] = (m[s] || 0) + 1), m), {}))}`);
process.exit(0);
