// Static "poster" renders of the models (public/images/renders/*.webp).
// Used as stand-ins until the live 3D scenes load (and as the mobile /
// reduced-motion fallback). Side view, looking along -Z (+X right, +Y up).
//   mode 'shaded':     monochrome clay render (two-sided flat lighting)
//   mode 'silhouette': solid fill, for backlit shapes against the sky
// Also returns where each part's centre lands in the image (percent), so the
// site can point callouts at specific parts.
import sharp from 'sharp';
import { boundsCenter, emptyBounds, expandBounds, positionsOf } from './geometry.mjs';
import { triangles } from './preview.mjs';

const LIGHT = (() => {
  const l = [-0.35, 0.6, 0.72];
  const n = Math.hypot(...l);
  return l.map((v) => v / n);
})();

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function renderPoster(parts, { file, width, mode, color, padding = 0.03 }) {
  const tris = triangles(parts, 0);
  const proj = (p) => [p[0], -p[1], p[2]];
  const b = emptyBounds();
  for (const t of tris) for (const p of [t.a, t.b, t.c]) expandBounds(b, proj(p));

  const pad = Math.round(width * padding);
  const scale = (width - 2 * pad) / (b.max[0] - b.min[0]);
  const height = Math.ceil((b.max[1] - b.min[1]) * scale + 2 * pad);
  const X = (p) => (pad + (proj(p)[0] - b.min[0]) * scale).toFixed(2);
  const Y = (p) => (pad + (proj(p)[1] - b.min[1]) * scale).toFixed(2);
  const base = hexToRgb(color);

  const sorted = tris
    .map((t) => ({ ...t, depth: (t.a[2] + t.b[2] + t.c[2]) / 3 }))
    .sort((p, q) => p.depth - q.depth); // far (low z) first, camera on +Z
  const polys = sorted.map((t) => {
    let fill = color;
    if (mode === 'shaded') {
      const u = [0, 1, 2].map((k) => t.b[k] - t.a[k]);
      const w = [0, 1, 2].map((k) => t.c[k] - t.a[k]);
      const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const l = Math.hypot(...n) || 1;
      const f = 0.22 + 0.78 * Math.abs((n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / l);
      fill = `rgb(${base.map((c) => Math.round(Math.min(255, c * f))).join(',')})`;
    }
    return `<polygon points="${X(t.a)},${Y(t.a)} ${X(t.b)},${Y(t.b)} ${X(t.c)},${Y(t.c)}" fill="${fill}" stroke="${fill}" stroke-width="0.6" stroke-linejoin="round"/>`;
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${polys.join('')}</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 88, alphaQuality: 90, effort: 6 }).toFile(file);

  const anchors = {};
  for (const part of parts) {
    const pb = emptyBounds();
    for (const prim of part.prims) {
      const pos = positionsOf(prim);
      for (let i = 0; i < pos.length; i += 3) expandBounds(pb, [pos[i] + part.pivot[0], pos[i + 1] + part.pivot[1], pos[i + 2] + part.pivot[2]]);
    }
    const c = boundsCenter(pb);
    anchors[part.name] = [+((+X(c) / width) * 100).toFixed(2), +((+Y(c) / height) * 100).toFixed(2)];
  }
  return { width, height, anchors };
}
