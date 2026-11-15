#!/usr/bin/env node
// Builds the optimized 3D models used by the site:
//   Model/** (raw sources, git-ignored) -> public/models/*.glb + lib/generated/models.json
//
// For each model (see config.mjs):
//   1. paint brand markings out of the textures
//   2. bake node transforms into the geometry
//   3. split meshes into separately named parts (by loose-part analysis)
//   4. re-orient (+Y up, front toward +X) and re-center on the origin
//   5. give every part its own pivot: <part> (translation = pivot) -> <part>_mesh
//      Animate the <part> node; the _mesh child carries Meshopt's dequantization transform.
//   6. fix materials, convert textures to WebP, compress geometry with Meshopt
//
// Review images (part split + logo before/after) are written to Model/_review/.
// Usage: npm run models
import fs from 'node:fs/promises';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, meshopt, prune, textureCompress, transformPrimitive } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { MODELS } from './config.mjs';
import { boundsCenter, boundsOfPrimitives, indicesOf, looseParts, multiply, subsetPrimitive, transformDirection, transformPoint, translation } from './geometry.mjs';
import { renderPartsSheet, renderPatchSheet } from './preview.mjs';
import { applyPatches, decodeImage, encodePng } from './textures.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const REVIEW_DIR = path.join(ROOT, 'Model/_review');
const MANIFEST = path.join(ROOT, 'lib/generated/models.json');
const IDENTITY = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
const round = (v, d = 4) => +v.toFixed(d);
const triangleCount = (prims) => prims.reduce((s, p) => s + indicesOf(p).length / 3, 0);

async function buildModel(io, model, patchEntries) {
  const doc = await io.read(path.join(ROOT, model.input));
  const root = doc.getRoot();

  // 1. Texture patches -------------------------------------------------------
  const textures = root.listTextures();
  for (const [index, spec] of Object.entries(model.textures)) {
    const texture = textures[Number(index)];
    if (!texture) throw new Error(`${model.id}: no texture #${index}`);
    const before = Buffer.from(texture.getImage());
    const img = await decodeImage(before);
    if (img.w !== spec.size[0] || img.h !== spec.size[1]) {
      throw new Error(`${model.id}: texture #${index} is ${img.w}x${img.h}, expected ${spec.size.join('x')} — has the source changed?`);
    }
    applyPatches(img, spec.patches);
    const after = await encodePng(img);
    texture.setImage(after).setMimeType('image/png');
    if (spec.preview) {
      for (const p of spec.patches) patchEntries.push({ model: model.id, texture: spec.preview, label: p.label, rect: p.rect, before, after });
    }
  }

  // 2. Bake node transforms into the geometry --------------------------------
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  const byMaterial = new Map();
  const seenMeshes = new Set();
  scene.traverse((node) => {
    const mesh = node.getMesh();
    if (!mesh) return;
    if (seenMeshes.has(mesh)) throw new Error(`${model.id}: mesh "${mesh.getName()}" is instanced; not supported`);
    seenMeshes.add(mesh);
    const world = node.getWorldMatrix();
    for (const prim of mesh.listPrimitives()) {
      transformPrimitive(prim, world);
      const name = prim.getMaterial()?.getName() ?? '(none)';
      byMaterial.set(name, [...(byMaterial.get(name) ?? []), prim]);
    }
  });

  // 3. Split into parts ------------------------------------------------------
  const partPrims = new Map(model.parts.map((p) => [p.name, []]));
  const consumed = new Set();
  let orientation = IDENTITY;
  const pivots = {}, spinAxes = {};
  const addTo = (part, prim) => {
    if (!partPrims.has(part)) throw new Error(`${model.id}: split produced unknown part "${part}"`);
    partPrims.get(part).push(prim);
  };

  for (const [material, split] of Object.entries(model.splits ?? {})) {
    const prims = byMaterial.get(material);
    if (!prims) throw new Error(`${model.id}: split material "${material}" not found`);
    for (const prim of prims) {
      const comps = looseParts(prim);
      const result = split(comps);
      const groups = new Map();
      result.labels.forEach((label, i) => {
        if (label === null) return; // intentionally dropped (e.g. duplicate glass)
        groups.set(label, [...(groups.get(label) ?? []), ...comps[i].triangles]);
      });
      for (const [label, tris] of groups) addTo(label, subsetPrimitive(doc, prim, tris.sort((a, b) => a - b)));
      consumed.add(prim);
      if (result.orientation) orientation = result.orientation;
      Object.assign(pivots, result.pivots ?? {});
      Object.assign(spinAxes, result.spinAxes ?? {});
    }
  }
  for (const part of model.parts.filter((p) => p.materials)) {
    for (const material of part.materials) {
      const prims = byMaterial.get(material);
      if (!prims) throw new Error(`${model.id}: material "${material}" for part "${part.name}" not found`);
      for (const prim of prims) {
        if (consumed.has(prim)) throw new Error(`${model.id}: material "${material}" used by two parts`);
        consumed.add(prim);
        addTo(part.name, prim);
      }
    }
  }
  for (const [material, prims] of byMaterial) {
    if (prims.some((p) => !consumed.has(p))) throw new Error(`${model.id}: material "${material}" is not assigned to any part`);
  }
  for (const [name, prims] of partPrims) if (prims.length === 0) throw new Error(`${model.id}: part "${name}" is empty`);

  // 4. Re-orient and re-center -----------------------------------------------
  const allPrims = [...partPrims.values()].flat();
  for (const prim of allPrims) transformPrimitive(prim, orientation);
  const center = boundsCenter(boundsOfPrimitives(allPrims));
  const recenter = translation(center.map((v) => -v));
  for (const prim of allPrims) transformPrimitive(prim, recenter);
  const fix = multiply(recenter, orientation);

  // 5. New scene graph with one pivot node per part ---------------------------
  const oldNodes = new Set(root.listNodes());
  const oldMeshes = new Set(root.listMeshes());
  const modelNode = doc.createNode(model.id);
  const parts = [];
  for (const part of model.parts) {
    const prims = partPrims.get(part.name);
    const pivot = pivots[part.name] ? transformPoint(fix, pivots[part.name]) : boundsCenter(boundsOfPrimitives(prims));
    for (const prim of prims) transformPrimitive(prim, translation(pivot.map((v) => -v)));
    const mesh = doc.createMesh(part.name);
    for (const prim of prims) mesh.addPrimitive(prim);
    const node = doc
      .createNode(part.name)
      .setTranslation(pivot)
      .addChild(doc.createNode(`${part.name}_mesh`).setMesh(mesh));
    const spinAxis = spinAxes[part.name] ? transformDirection(orientation, spinAxes[part.name]).map((v) => round(v)) : undefined;
    if (spinAxis) node.setExtras({ spinAxis });
    modelNode.addChild(node);
    parts.push({ name: part.name, pivot, prims, triangles: triangleCount(prims), spinAxis });
  }
  for (const s of root.listScenes()) s.dispose();
  root.setDefaultScene(doc.createScene(model.id).addChild(modelNode));
  for (const n of oldNodes) n.dispose();
  for (const m of oldMeshes) {
    for (const prim of m.listPrimitives()) m.removePrimitive(prim);
    m.dispose();
  }

  // 6. Materials -------------------------------------------------------------
  for (const material of root.listMaterials()) {
    const spec = model.materials[material.getName()];
    if (!spec) throw new Error(`${model.id}: no material settings for "${material.getName()}"`);
    material.setName(spec.name);
    if (spec.metallic !== undefined) material.setMetallicFactor(spec.metallic);
    if (spec.doubleSided !== undefined) material.setDoubleSided(spec.doubleSided);
    if (spec.removeEmissive) material.setEmissiveTexture(null).setEmissiveFactor([0, 0, 0]);
  }
  await doc.transform(prune(), dedup());

  await renderPartsSheet(model.id, parts, path.join(REVIEW_DIR, `${model.id}-parts.png`));

  // 7. Compression -----------------------------------------------------------
  await doc.transform(
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], slots: /^(?!normalTexture|metallicRoughnessTexture)/, quality: 88 }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], slots: /^normalTexture/, nearLossless: true }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], slots: /^metallicRoughnessTexture/, quality: 90, chromaSubsampling: '4:4:4' }),
    meshopt({ encoder: MeshoptEncoder, level: 'medium' })
  );

  const { title, author, source, license } = model.credit;
  Object.assign(root.getAsset(), { copyright: `"${title}" by ${author} (${source}). ${license}. Modified for this site.` });

  const outFile = path.join(ROOT, model.output);
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await io.write(outFile, doc);
  const [inSize, outSize] = await Promise.all([fs.stat(path.join(ROOT, model.input)), fs.stat(outFile)]);

  console.log(`\n${model.id}: ${(inSize.size / 1024).toFixed(0)} KB -> ${(outSize.size / 1024).toFixed(0)} KB  (${model.output})`);
  for (const p of parts) {
    console.log(`  ${p.name.padEnd(12)} ${String(p.triangles).padStart(6)} tris  pivot [${p.pivot.map((v) => round(v, 3)).join(', ')}]${p.spinAxis ? `  spin [${p.spinAxis}]` : ''}`);
  }

  return {
    id: model.id,
    url: '/' + path.relative(path.join(ROOT, 'public'), outFile).split(path.sep).join('/'),
    bytes: outSize.size,
    credit: model.credit,
    parts: parts.map((p) => ({ name: p.name, node: p.name, triangles: p.triangles, pivot: p.pivot.map((v) => round(v)), ...(p.spinAxis ? { spinAxis: p.spinAxis } : {}) })),
  };
}

async function main() {
  await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

  await fs.mkdir(REVIEW_DIR, { recursive: true });
  const patchEntries = [];
  const manifest = [];
  for (const model of MODELS) manifest.push(await buildModel(io, model, patchEntries));

  await renderPatchSheet(patchEntries, path.join(REVIEW_DIR, 'logo-patches.png'));
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  await fs.writeFile(MANIFEST, JSON.stringify({ generatedBy: 'scripts/models/build-models.mjs (npm run models)', models: manifest }, null, 2) + '\n');
  console.log(`\nManifest: ${path.relative(ROOT, MANIFEST)}\nReview images: ${path.relative(ROOT, REVIEW_DIR)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
