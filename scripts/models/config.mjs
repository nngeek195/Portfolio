// Per-model settings for `npm run models`. Coordinates in the split rules are
// in the source model's world space (after its root transform, before
// re-orientation and re-centering): metres, +Y up, gun muzzles toward +X.
import { assignByAnchors, dot, len, principalAxisXZ, rotationY, sub } from './geometry.mjs';

// ---------------------------------------------------------------- logo patches
// rect = [x0, y0, x1, y1) in texture pixels. Each list is applied to the base
// colour texture AND the matching metal/roughness texture (same UV layout).

const RIFLE_BODY = [
  // Steel brightness varies along x here, so fill from the borders instead of cloning.
  { label: 'RUSTACT DYNAMICS logo', rect: [244, 819, 379, 851], inpaint: { grain: [394, 822, 53, 25] } },
  { label: 'RTD-V22K (lower receiver)', rect: [795, 822, 873, 846], clone: [-125, 0] },
  { label: 'RTD-V22K + emblem (rail block)', rect: [757, 115, 810, 154], inpaint: { grain: [400, 356, 53, 38] } },
];
const RIFLE_SCOPE = [
  // The tube gets brighter toward the bottom, so fill from the borders (follows the gradient).
  { label: 'HENSOLDT / ZEISS / 6-24x72', rect: [313, 368, 363, 433], inpaint: { grain: [300, 318, 40, 40] } },
  { label: 'M0 marking (tube)', rect: [304, 439, 349, 474], inpaint: { grain: [300, 318, 40, 40] } },
  { label: 'M0 marking (turret)', rect: [26, 236, 81, 289], clone: [75, 0] },
  { label: 'WEAVER (mount)', rect: [257, 78, 321, 93], inpaint: { grain: [262, 99, 40, 14] } },
];
const RIFLE_SUPPRESSOR = [
  { label: 'Flame decal', rect: [56, 18, 206, 125], clone: [152, 0] },
  { label: 'Skull decal', rect: [421, 48, 466, 104], clone: [-62, 0] },
];
const PISTOL_BODY = [
  // The H's left leg runs into the panel border; clone it away sideways first (keeps the
  // border line), so the inpaint below doesn't pick up red from its bottom edge.
  { label: 'HK (grip, lower H leg)', rect: [433, 219, 444, 227], clone: [-12, 0], feather: 2 },
  { label: 'HK USP (grip)', rect: [432, 199, 522, 222], inpaint: { grain: [432, 232, 90, 23] } },
  { label: 'HK logo (slide)', rect: [56, 737, 106, 776], clone: [105, 0] },
  { label: 'USP (slide)', rect: [111, 739, 154, 764], clone: [105, 0] },
];
const PISTOL_RED_DOT = [
  { label: 'DELTAPOINT', rect: [21, 136, 164, 157], inpaint: { grain: [40, 200, 60, 20] } },
  { label: 'Leupold logo', rect: [46, 228, 90, 272], inpaint: { grain: [40, 195, 40, 30] } },
];

// ------------------------------------------------------------- model configs

const metal = (name) => ({ name, metallic: 1, doubleSided: false });
const glass = (name) => ({ name, doubleSided: true });

export const MODELS = [
  {
    id: 'rifle',
    input: 'Model/guns/riffel.glb',
    output: 'public/models/rifle.glb',
    credit: {
      title: 'VSSK Vykhlop | Contract Wars',
      author: 'xlisov',
      authorUrl: 'https://sketchfab.com/xlisov74',
      source: 'https://sketchfab.com/3d-models/vssk-vykhlop-contract-wars-162cb40bccd24dd498b76c6bcd4f3738',
      license: 'Used under purchased licence',
    },
    // texture (image) index in the source file -> patches; sizes are asserted
    textures: {
      8: { size: [1024, 1024], patches: RIFLE_BODY, preview: 'Body (base colour)' },
      9: { size: [1024, 1024], patches: RIFLE_BODY },
      10: { size: [512, 512], patches: RIFLE_SCOPE, preview: 'Scope (base colour)' },
      11: { size: [512, 512], patches: RIFLE_SCOPE },
      5: { size: [512, 128], patches: RIFLE_SUPPRESSOR, preview: 'Suppressor (base colour)' },
      6: { size: [512, 128], patches: RIFLE_SUPPRESSOR },
    },
    materials: {
      vihlop: metal('rifle_body'),
      vihlop_optic: metal('rifle_scope'),
      ironSight: metal('rifle_sights'),
      suppressor: metal('rifle_suppressor'),
      angleGrip: metal('rifle_foregrip'),
      OpticSight_hen_glass: glass('rifle_scope_glass_rear'),
      optic_glass_round_optic: glass('rifle_scope_glass_front'),
    },
    // Parts in assembly order (outermost / last to lock in at the end).
    parts: [
      { name: 'receiver', fromSplit: true },
      { name: 'stock', fromSplit: true },
      { name: 'magazine', fromSplit: true },
      { name: 'cheekrest', fromSplit: true },
      { name: 'buttpad', fromSplit: true },
      { name: 'handguard', fromSplit: true },
      { name: 'foregrip', materials: ['angleGrip'] },
      { name: 'sight_rear', fromSplit: true },
      { name: 'sight_front', fromSplit: true },
      { name: 'scope', materials: ['vihlop_optic', 'OpticSight_hen_glass', 'optic_glass_round_optic'] },
      { name: 'suppressor', materials: ['suppressor'] },
    ],
    splits: {
      // Main body: 122 loose pieces grouped around the large structural ones.
      // Bullpup layout: the magazine sits behind the pistol grip; the grip is
      // part of the stock/lower piece.
      vihlop: (comps) => ({
        labels: assignByAnchors(comps, {
          buttpad: (c) => c.center[0] < -0.28,
          stock: (c) => c.tris === 859,
          cheekrest: (c) => c.tris === 484,
          magazine: (c) => c.tris === 502,
          // upper receiver + top rail + charging handle (sticks out on the left side)
          receiver: (c) => c.tris === 1676 || (c.tris === 256 && c.center[1] > 0.1) || ((c.tris === 566 || c.tris === 124) && c.center[2] < -0.02),
          handguard: (c) => [2412, 102, 161, 52].includes(c.tris) && c.center[0] > 0.08,
        }),
      }),
      // Flip-up iron sights: the rear unit sits behind x = 0.08, the front ahead of it.
      ironSight: (comps) => ({ labels: comps.map((c) => (c.center[0] < 0.08 ? 'sight_rear' : 'sight_front')) }),
    },
  },

  {
    id: 'pistol',
    input: 'Model/guns/pistol.glb',
    output: 'public/models/pistol.glb',
    credit: {
      title: 'H&K USP Match | Contract Wars',
      author: 'xlisov',
      authorUrl: 'https://sketchfab.com/xlisov74',
      source: 'https://sketchfab.com/3d-models/hk-usp-match-contract-wars-24eccdba4c464cfb87fade3182ad5783',
      license: 'Used under purchased licence',
    },
    textures: {
      4: { size: [1024, 1024], patches: PISTOL_BODY, preview: 'Frame + slide (base colour)' },
      5: { size: [1024, 1024], patches: PISTOL_BODY },
      0: { size: [512, 512], patches: PISTOL_RED_DOT, preview: 'Red dot (base colour)' },
      1: { size: [512, 512], patches: PISTOL_RED_DOT },
    },
    materials: {
      USP_Match: metal('pistol_body'),
      Kompensator: metal('pistol_compensator'),
      Kollim: metal('pistol_red_dot'),
    },
    parts: [
      { name: 'frame', fromSplit: true },
      { name: 'magazine', fromSplit: true },
      { name: 'guide_rod', fromSplit: true },
      { name: 'slide', fromSplit: true },
      { name: 'compensator', materials: ['Kompensator'] },
      { name: 'red_dot', materials: ['Kollim'] },
    ],
    splits: {
      USP_Match: (comps) => ({
        labels: assignByAnchors(comps, {
          slide: (c) => c.tris === 1329,
          // frame + the two decocker/safety levers on its sides
          frame: (c) => c.tris === 1797 || c.tris === 240,
          magazine: (c) => c.tris === 396 && c.center[1] < -0.04,
          guide_rod: (c) => c.tris === 130 && c.center[0] > 0.09,
        }),
      }),
    },
  },

  {
    id: 'heli',
    input: 'Model/hellicopter.glb',
    output: 'public/models/heli.glb',
    credit: {
      title: 'MH-6 Little Bird [Low Poly]',
      author: 'Muhamad Mirza Arrafi',
      authorUrl: 'https://sketchfab.com/MirzaArrafiERV_45',
      source: 'https://sketchfab.com/3d-models/mh-6-little-bird-low-poly-d7068144bfeb4d91bde5d30755657d97',
      license: 'CC BY 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
    textures: {},
    materials: {
      'mat_0-ah6.jpg': { name: 'heli_body', removeEmissive: true, doubleSided: false },
      'mat_1-color_0.023500-0.525500-0.227500.jpg': glass('heli_glass'),
    },
    parts: [
      { name: 'body', fromSplit: true },
      { name: 'canopy', fromSplit: true },
      { name: 'rotor_main', fromSplit: true },
      { name: 'rotor_tail', fromSplit: true },
    ],
    splits: {
      // Canopy panes are duplicated as two near-identical shells: keep one of each pair.
      'mat_1-color_0.023500-0.525500-0.227500.jpg': (comps) => {
        const kept = [];
        const labels = comps.map((c) => {
          const dup = kept.some(
            (k) => k.tris === c.tris && len(sub(k.center, c.center)) < 0.004 && len(sub(k.size, c.size)) < 0.004
          );
          if (dup) return null; // dropped
          kept.push(c);
          return 'canopy';
        });
        return { labels };
      },
      'mat_0-ah6.jpg': (comps) => {
        const one = (what, test) => {
          const hits = comps.filter(test);
          if (hits.length !== 1) throw new Error(`Expected exactly one ${what}, found ${hits.length}`);
          return hits[0];
        };
        const hub = one('main rotor hub', (c) => c.tris === 110 && c.center[1] > 0.37);
        const tailHub = one('tail rotor hub', (c) => c.tris === 48 && c.center[0] > 0.7 && c.center[2] > 0.7);
        const boom = one('tail boom', (c) => c.tris === 330);

        // Fuselage axis from the tail boom's shape, pointing from the mast to the tail.
        let axis = principalAxisXZ(boom.points());
        if (dot(axis, sub(tailHub.center, hub.center)) < 0) axis = axis.map((v) => -v);
        // Tail rotor spins about the horizontal axis perpendicular to the boom.
        const tailAxis = [axis[2], 0, -axis[0]];

        const radiusFromMast = (c) => Math.hypot(c.center[0] - hub.center[0], c.center[2] - hub.center[2]);
        const isBlade = (c) => c.tris === 44 && c.center[1] > 0.25 && radiusFromMast(c) > 0.6 && radiusFromMast(c) < 0.8;
        const blades = comps.filter(isBlade).length;
        if (blades !== 5) throw new Error(`Expected 5 main rotor blades, found ${blades}`);

        const labels = comps.map((c) => {
          if (isBlade(c) || (radiusFromMast(c) < 0.2 && c.center[1] > 0.28)) return 'rotor_main';
          const offset = sub(c.center, tailHub.center);
          if (len(offset) < 0.2 && Math.abs(dot(offset, tailAxis)) < 0.012) return 'rotor_tail';
          return 'body';
        });

        // Nose = opposite of the tail direction; turn it to face +X.
        const nose = axis.map((v) => -v);
        return {
          labels,
          orientation: rotationY(Math.atan2(nose[2], nose[0])),
          pivots: { rotor_main: hub.center, rotor_tail: tailHub.center },
          spinAxes: { rotor_main: [0, 1, 0], rotor_tail: tailAxis },
        };
      },
    },
  },
];
