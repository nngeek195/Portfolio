// Review images for the model pipeline (written to Model/_review/, git-ignored):
//   - <id>-parts.png: flat-shaded orthographic views with each part in its own
//     colour (side, top, exploded), to check the split without a 3D viewer.
//   - logo-patches.png: before/after crops of every texture patch.
import sharp from 'sharp';
import { boundsCenter, emptyBounds, expandBounds, indicesOf, positionsOf } from './geometry.mjs';

const PALETTE = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#aaffc3'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** parts: [{ name, pivot, prims }] with prim positions relative to pivot. */
export function triangles(parts, explode) {
  const all = emptyBounds();
  for (const p of parts)
    for (const prim of p.prims) {
      const pos = positionsOf(prim);
      for (let i = 0; i < pos.length; i += 3) expandBounds(all, [pos[i] + p.pivot[0], pos[i + 1] + p.pivot[1], pos[i + 2] + p.pivot[2]]);
    }
  const modelCenter = boundsCenter(all);
  const out = [];
  parts.forEach((p, pi) => {
    const partBounds = emptyBounds();
    for (const prim of p.prims) {
      const pos = positionsOf(prim);
      for (let i = 0; i < pos.length; i += 3) expandBounds(partBounds, [pos[i], pos[i + 1], pos[i + 2]]);
    }
    const partCenter = boundsCenter(partBounds).map((v, k) => v + p.pivot[k]);
    const shift = explode ? partCenter.map((v, k) => (v - modelCenter[k]) * explode) : [0, 0, 0];
    for (const prim of p.prims) {
      const pos = positionsOf(prim), idx = indicesOf(prim);
      const v = (i) => [0, 1, 2].map((k) => pos[i * 3 + k] + p.pivot[k] + shift[k]);
      for (let t = 0; t < idx.length; t += 3) out.push({ part: pi, a: v(idx[t]), b: v(idx[t + 1]), c: v(idx[t + 2]) });
    }
  });
  return out;
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s) => Math.round(Math.min(255, ((n >> s) & 255) * f));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

// view: 'side' looks along -Z (x right, y up); 'top' looks down -Y (x right, z down).
function renderView(tris, parts, view, width, height, title) {
  const proj = view === 'side' ? (p) => [p[0], -p[1], p[2]] : (p) => [p[0], p[2], p[1]];
  const b = emptyBounds();
  for (const t of tris) for (const p of [t.a, t.b, t.c]) expandBounds(b, proj(p));
  const pad = 30, top = 40;
  const s = Math.min((width - 2 * pad) / (b.max[0] - b.min[0]), (height - top - pad) / (b.max[1] - b.min[1]));
  const X = (p) => (pad + (proj(p)[0] - b.min[0]) * s).toFixed(1);
  const Y = (p) => (top + (proj(p)[1] - b.min[1]) * s).toFixed(1);
  const light = view === 'side' ? [0.3, 0.6, 0.75] : [0.3, 0.75, 0.6];
  const sorted = tris.map((t) => ({ ...t, depth: (proj(t.a)[2] + proj(t.b)[2] + proj(t.c)[2]) / 3 })).sort((p, q) => p.depth - q.depth);
  const polys = sorted.map((t) => {
    const u = [0, 1, 2].map((k) => t.b[k] - t.a[k]), w = [0, 1, 2].map((k) => t.c[k] - t.a[k]);
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    const l = Math.hypot(...n) || 1;
    const f = 0.35 + 0.65 * Math.abs((n[0] * light[0] + n[1] * light[1] + n[2] * light[2]) / l);
    const col = shade(PALETTE[t.part % PALETTE.length], f);
    return `<polygon points="${X(t.a)},${Y(t.a)} ${X(t.b)},${Y(t.b)} ${X(t.c)},${Y(t.c)}" fill="${col}" stroke="${col}" stroke-width="0.4"/>`;
  });
  const legend = parts
    .map((p, i) => `<rect x="${pad + i * 120}" y="${height - 22}" width="12" height="12" fill="${PALETTE[i % PALETTE.length]}"/><text x="${pad + i * 120 + 16}" y="${height - 12}" font-size="12" fill="#ddd" font-family="sans-serif">${esc(p.name)}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height + 10}"><rect width="100%" height="100%" fill="#16181b"/><text x="${pad}" y="26" font-size="18" fill="#fff" font-family="sans-serif">${esc(title)}</text>${polys.join('')}${legend}</svg>`;
}

export async function renderPartsSheet(id, parts, file) {
  const W = Math.max(1400, parts.length * 120 + 60), H = 520;
  const views = [
    renderView(triangles(parts, 0), parts, 'side', W, H, `${id}: side view (each colour = one part)`),
    renderView(triangles(parts, 0), parts, 'top', W, H, `${id}: top view`),
    renderView(triangles(parts, 1.2), parts, 'side', W, H, `${id}: exploded side view`),
  ];
  const pngs = await Promise.all(views.map((svg) => sharp(Buffer.from(svg)).png().toBuffer()));
  await sharp({ create: { width: W, height: (H + 10) * 3, channels: 3, background: '#000' } })
    .composite(pngs.map((input, i) => ({ input, left: 0, top: i * (H + 10) })))
    .png()
    .toFile(file);
}

/** entries: [{ model, texture, label, rect, before: Buffer, after: Buffer }] */
export async function renderPatchSheet(entries, file) {
  const CELL_H = 170, LABEL_W = 330, GAP = 16, MAX_W = 520, M = 14;
  const rows = [];
  for (const e of entries) {
    const meta = await sharp(e.before).metadata();
    const [x0, y0, x1, y1] = e.rect;
    const box = {
      left: Math.max(0, x0 - M), top: Math.max(0, y0 - M),
      width: Math.min(meta.width, x1 + M) - Math.max(0, x0 - M), height: Math.min(meta.height, y1 + M) - Math.max(0, y0 - M),
    };
    const scale = Math.min(MAX_W / box.width, (CELL_H - 30) / box.height);
    const size = { width: Math.round(box.width * scale), height: Math.round(box.height * scale) };
    // Brighten so dark gunmetal detail is visible in the review sheet (display only).
    const crop = (buf) => sharp(buf).extract(box).resize({ ...size, kernel: 'nearest' }).linear(1.8, 0).png().toBuffer();
    rows.push({ e, size, before: await crop(e.before), after: await crop(e.after) });
  }
  const width = LABEL_W + 2 * (MAX_W + GAP) + GAP;
  const height = rows.length * CELL_H + 50;
  const text = rows
    .map(({ e }, i) => {
      const y = 50 + i * CELL_H;
      return `<text x="12" y="${y + 40}" font-size="15" fill="#fff" font-family="sans-serif">${esc(e.model)} — ${esc(e.texture)}</text>
<text x="12" y="${y + 64}" font-size="15" fill="#FFB020" font-family="sans-serif">${esc(e.label)}</text>
<text x="12" y="${y + 86}" font-size="12" fill="#999" font-family="monospace">rect [${e.rect.join(', ')}]</text>`;
    })
    .join('');
  const header = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#16181b"/>
<text x="${LABEL_W}" y="32" font-size="20" fill="#fff" font-family="sans-serif">BEFORE</text>
<text x="${LABEL_W + MAX_W + GAP}" y="32" font-size="20" fill="#fff" font-family="sans-serif">AFTER</text>
<text x="${width - 12}" y="32" font-size="12" fill="#999" text-anchor="end" font-family="sans-serif">crops brightened 1.8x for review only</text>${text}</svg>`;
  await sharp(Buffer.from(header))
    .composite(
      rows.flatMap(({ before, after }, i) => [
        { input: before, left: LABEL_W, top: 50 + i * CELL_H + 10 },
        { input: after, left: LABEL_W + MAX_W + GAP, top: 50 + i * CELL_H + 10 },
      ])
    )
    .png()
    .toFile(file);
}
