// Geometry helpers for the model pipeline. They operate on glTF-Transform
// Primitives whose POSITION data is still plain float (i.e. before quantization).
import { compactPrimitive } from '@gltf-transform/functions';

// ---------- small vector / matrix helpers (glTF mat4 is column-major) ----------

export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);

export const translation = ([x, y, z]) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1];

// Rotation about +Y. rotationY(atan2(dz, dx)) turns the horizontal direction (dx, dz) to +X.
export function rotationY(theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1];
}

export function multiply(a, b) {
  const o = new Array(16).fill(0);
  for (let col = 0; col < 4; col++)
    for (let row = 0; row < 4; row++)
      for (let k = 0; k < 4; k++) o[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
  return o;
}

export const transformPoint = (m, p) => [0, 1, 2].map((i) => m[i] * p[0] + m[4 + i] * p[1] + m[8 + i] * p[2] + m[12 + i]);
export const transformDirection = (m, d) => {
  const v = [0, 1, 2].map((i) => m[i] * d[0] + m[4 + i] * d[1] + m[8 + i] * d[2]);
  const l = len(v) || 1;
  return v.map((x) => x / l);
};

// ---------- primitive data access ----------

export const positionsOf = (prim) => prim.getAttribute('POSITION').getArray();

export function indicesOf(prim) {
  const acc = prim.getIndices();
  if (acc) return acc.getArray();
  const count = prim.getAttribute('POSITION').getCount();
  return Uint32Array.from({ length: count }, (_, i) => i);
}

export function emptyBounds() {
  return { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
}

export function expandBounds(b, p) {
  for (let k = 0; k < 3; k++) {
    b.min[k] = Math.min(b.min[k], p[k]);
    b.max[k] = Math.max(b.max[k], p[k]);
  }
}

export const boundsCenter = (b) => b.min.map((v, k) => (v + b.max[k]) / 2);
export const boundsSize = (b) => b.min.map((v, k) => b.max[k] - v);

export function boundsOfPrimitives(prims) {
  const b = emptyBounds();
  for (const prim of prims) {
    const pos = positionsOf(prim);
    for (let i = 0; i < pos.length; i += 3) expandBounds(b, [pos[i], pos[i + 1], pos[i + 2]]);
  }
  return b;
}

// Distance from a point to an axis-aligned box (0 when inside).
export function pointBoxDistance(p, box) {
  const d = [0, 1, 2].map((k) => Math.max(box.min[k] - p[k], 0, p[k] - box.max[k]));
  return len(d);
}

export const boxVolume = (box) => boundsSize(box).reduce((a, s) => a * Math.max(s, 1e-6), 1);

// ---------- loose-part analysis ----------

/**
 * Splits a triangle primitive into connected components ("loose parts").
 * Vertices at the same position are welded first, so UV/normal seams don't
 * break a part apart. Each component lists its triangles, bounds and vertices.
 */
export function looseParts(prim) {
  const pos = positionsOf(prim);
  const idx = indicesOf(prim);
  const vertexCount = pos.length / 3;

  const parent = Int32Array.from({ length: vertexCount }, (_, i) => i);
  const find = (x) => {
    while (parent[x] !== x) x = parent[x] = parent[parent[x]];
    return x;
  };
  const union = (a, b) => {
    a = find(a);
    b = find(b);
    if (a !== b) parent[a] = b;
  };

  const byPosition = new Map();
  for (let v = 0; v < vertexCount; v++) {
    const key = `${pos[v * 3].toFixed(5)},${pos[v * 3 + 1].toFixed(5)},${pos[v * 3 + 2].toFixed(5)}`;
    const first = byPosition.get(key);
    if (first === undefined) byPosition.set(key, v);
    else union(v, first);
  }
  for (let t = 0; t < idx.length; t += 3) {
    union(idx[t], idx[t + 1]);
    union(idx[t], idx[t + 2]);
  }

  const groups = new Map();
  for (let t = 0; t < idx.length; t += 3) {
    const root = find(idx[t]);
    let g = groups.get(root);
    if (!g) groups.set(root, (g = { triangles: [], vertices: new Set(), bounds: emptyBounds() }));
    g.triangles.push(t / 3);
    for (const v of [idx[t], idx[t + 1], idx[t + 2]]) {
      g.vertices.add(v);
      expandBounds(g.bounds, [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]]);
    }
  }

  return [...groups.values()].map((g) => ({
    tris: g.triangles.length,
    triangles: g.triangles,
    bounds: g.bounds,
    center: boundsCenter(g.bounds),
    size: boundsSize(g.bounds),
    points: () => [...g.vertices].map((v) => [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]]),
  }));
}

/** New primitive containing only the given triangles, with unused vertices removed. */
export function subsetPrimitive(doc, prim, triangles) {
  const idx = indicesOf(prim);
  const out = new Uint32Array(triangles.length * 3);
  triangles.forEach((t, i) => out.set(idx.subarray(t * 3, t * 3 + 3), i * 3));
  const indices = doc
    .createAccessor()
    .setType('SCALAR')
    .setArray(out)
    .setBuffer(doc.getRoot().listBuffers()[0]);
  const copy = prim.clone().setIndices(indices);
  compactPrimitive(copy);
  return copy;
}

/** Dominant horizontal (XZ) direction of a point cloud, as a unit [x, 0, z] vector. */
export function principalAxisXZ(points) {
  const n = points.length;
  const mx = points.reduce((s, p) => s + p[0], 0) / n;
  const mz = points.reduce((s, p) => s + p[2], 0) / n;
  let sxx = 0, szz = 0, sxz = 0;
  for (const p of points) {
    const x = p[0] - mx, z = p[2] - mz;
    sxx += x * x;
    szz += z * z;
    sxz += x * z;
  }
  const angle = 0.5 * Math.atan2(2 * sxz, sxx - szz);
  return [Math.cos(angle), 0, Math.sin(angle)];
}

/**
 * Assigns loose parts to named groups. `anchors` maps a group name to a
 * predicate selecting its defining loose parts; every other loose part joins
 * the group whose anchor boxes are closest (ties go to the smaller box, i.e.
 * the more specific part). Throws if an anchor matches nothing, so a changed
 * source model fails loudly instead of producing a wrong split.
 */
export function assignByAnchors(comps, anchors) {
  const anchorBoxes = Object.fromEntries(Object.keys(anchors).map((name) => [name, []]));
  const labels = comps.map((c) => {
    const hits = Object.entries(anchors).filter(([, test]) => test(c)).map(([name]) => name);
    if (hits.length > 1) throw new Error(`Loose part matches several anchors: ${hits.join(', ')}`);
    if (hits.length === 1) anchorBoxes[hits[0]].push(c.bounds);
    return hits[0] ?? null;
  });
  for (const [name, boxes] of Object.entries(anchorBoxes)) {
    if (boxes.length === 0) throw new Error(`Anchor "${name}" matched no loose part — has the source model changed?`);
  }
  return labels.map((label, i) => {
    if (label) return label;
    let best = null;
    for (const [name, boxes] of Object.entries(anchorBoxes)) {
      for (const box of boxes) {
        const d = pointBoxDistance(comps[i].center, box);
        const v = boxVolume(box);
        if (!best || d < best.d - 1e-9 || (Math.abs(d - best.d) <= 1e-9 && v < best.v)) best = { name, d, v };
      }
    }
    return best.name;
  });
}
