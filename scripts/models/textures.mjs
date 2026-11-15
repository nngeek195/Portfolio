// Texture patching for the model pipeline: paints logos/markings out of
// texture images. Two methods:
//   - clone:   copy a clean region at offset [dx, dy] over the target, with a
//              feathered edge (best when a matching clean area is nearby).
//   - inpaint: fill the target from its surrounding border (Coons patch), then
//              add fine grain sampled from a clean region so it isn't too smooth.
import sharp from 'sharp';

export async function decodeImage(buffer) {
  const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, c: info.channels };
}

export function encodePng(img) {
  return sharp(img.data, { raw: { width: img.w, height: img.h, channels: img.c } }).png().toBuffer();
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function checkRect(img, [x0, y0, x1, y1], what) {
  if (x0 < 0 || y0 < 0 || x1 > img.w || y1 > img.h || x0 >= x1 || y0 >= y1) {
    throw new Error(`${what} rect [${x0},${y0},${x1},${y1}] is outside the ${img.w}x${img.h} texture`);
  }
}

function clone(img, snap, rect, [dx, dy], feather = 3) {
  const [x0, y0, x1, y1] = rect;
  checkRect(img, [x0 + dx, y0 + dy, x1 + dx, y1 + dy], 'clone source');
  const { w, c } = img;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const edge = Math.min(x - x0, x1 - 1 - x, y - y0, y1 - 1 - y) + 1;
      const t = Math.min(1, edge / feather);
      const dst = (y * w + x) * c;
      const src = ((y + dy) * w + (x + dx)) * c;
      for (let k = 0; k < c; k++) img.data[dst + k] = Math.round(snap[src + k] * t + snap[dst + k] * (1 - t));
    }
  }
}

function inpaint(img, snap, rect, grain) {
  const [x0, y0, x1, y1] = rect;
  checkRect(img, [x0 - 2, y0 - 2, x1 + 2, y1 + 2], 'inpaint border of');
  const { w, c } = img;
  const W = x1 - x0, H = y1 - y0;
  const px = (x, y, k) => snap[(y * w + x) * c + k];

  // Border samples (2 px deep), smoothed along the edge so pixel noise in the
  // border doesn't streak across the fill.
  const sample = (n, get) => {
    const raw = Array.from({ length: n }, (_, i) => Array.from({ length: c }, (_, k) => get(i, k)));
    return raw.map((_, i) =>
      Array.from({ length: c }, (_, k) => {
        let s = 0, m = 0;
        for (let j = Math.max(0, i - 3); j <= Math.min(n - 1, i + 3); j++) {
          s += raw[j][k];
          m++;
        }
        return s / m;
      })
    );
  };
  const top = sample(W, (i, k) => (px(x0 + i, y0 - 1, k) + px(x0 + i, y0 - 2, k)) / 2);
  const bottom = sample(W, (i, k) => (px(x0 + i, y1, k) + px(x0 + i, y1 + 1, k)) / 2);
  const left = sample(H, (j, k) => (px(x0 - 1, y0 + j, k) + px(x0 - 2, y0 + j, k)) / 2);
  const right = sample(H, (j, k) => (px(x1, y0 + j, k) + px(x1 + 1, y0 + j, k)) / 2);
  const corner = (a, b) => a.map((v, k) => (v + b[k]) / 2);
  const TL = corner(top[0], left[0]), TR = corner(top[W - 1], right[0]);
  const BL = corner(bottom[0], left[H - 1]), BR = corner(bottom[W - 1], right[H - 1]);

  // High-pass detail (pixel minus its 5x5 mean) from the grain region, tiled.
  let detail = null;
  if (grain) {
    const [gx, gy, gw, gh] = grain;
    checkRect(img, [gx - 2, gy - 2, gx + gw + 2, gy + gh + 2], 'grain source');
    detail = (i, j, k) => {
      const x = gx + (i % gw), y = gy + (j % gh);
      let s = 0;
      for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) s += px(xx, yy, k);
      return px(x, y, k) - s / 25;
    };
  }

  for (let j = 0; j < H; j++) {
    const v = (j + 0.5) / H;
    for (let i = 0; i < W; i++) {
      const u = (i + 0.5) / W;
      const dst = ((y0 + j) * w + (x0 + i)) * c;
      for (let k = 0; k < c; k++) {
        const value =
          (1 - v) * top[i][k] + v * bottom[i][k] + (1 - u) * left[j][k] + u * right[j][k] -
          ((1 - u) * (1 - v) * TL[k] + u * (1 - v) * TR[k] + (1 - u) * v * BL[k] + u * v * BR[k]) +
          (detail ? detail(i, j, k) : 0);
        img.data[dst + k] = clamp(Math.round(value), 0, 255);
      }
    }
  }
}

/** Applies patches in order; each reads from the image as left by the previous one. */
export function applyPatches(img, patches) {
  for (const p of patches) {
    checkRect(img, p.rect, `patch "${p.label}"`);
    const snap = Buffer.from(img.data);
    if (p.clone) clone(img, snap, p.rect, p.clone, p.feather);
    else if (p.inpaint) inpaint(img, snap, p.rect, p.inpaint.grain);
    else throw new Error(`patch "${p.label}" needs either clone or inpaint`);
  }
}
