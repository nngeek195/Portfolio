// ---------------------------------------------------------------------------
// LOOK: tuning knobs for how bright the 3D models read under the night-vision
// grade (rifle, pistol, helicopter). Raise or lower these to taste; they apply
// to every model and are independent of any quality tier (the 1.5x -> 1x pixel
// ratio step-down never changes brightness).
// Previous values in brackets.
// ---------------------------------------------------------------------------
export const LOOK = {
  /** Flat ambient light [0.25]. */
  ambient: 0.5,
  /** Sky/ground hemisphere light [0.7]. */
  hemi: 1.15,
  /** Cool key light from the upper left front [2.2]. */
  key: 3.4,
  /** Green rim light from behind right: separates the silhouette from the dark page [1.6]. */
  rim: 2.8,
  /** Soft front fill from the lower right: lifts the shadow side [none]. */
  fill: 1.4,
  /** Reflections from the procedural environment map; metal reads mostly through these [1]. */
  envIntensity: 1.6,

  /** Night-vision grade: phosphor gain [1.4]. */
  nvGain: 1.7,
  /** Night-vision grade: gamma; lower lifts the darks [0.85]. */
  nvGamma: 0.7,
  /** Night-vision grade: phosphor floor, so black metal still shows its shape [0]. */
  nvFloor: 0.045,

  /** Small emissive green lift on every part [0]. */
  partLift: 0.035,
  /** Fresnel edge glow on exploded / moving parts (rifle, pistol) at full separation [0]. */
  edgeGlow: 0.6,
  /** Constant faint edge glow on the helicopter [0]. */
  heliEdge: 0.08,
  /** Helicopter exposure: its bright livery clips at full green with the lifted grade, so it is
   *  pulled back a little (the rifle and pistol are dark metal and need the full lift) [1]. */
  heliExposure: 0.82,
} as const;

/** Night-vision gain the flat renders were made to match (the grade before the visibility lift). */
const NV_GAIN_BASE = 1.4;

/**
 * FX: LITE has no 3D, so the flat renders (helicopter stills, rifle and pistol
 * schematics) stand in for the lifted 3D models. They get the same lift the
 * night-vision gain gives the 3D models over the original grade, so LITE is
 * never darker than FULL (checked with screenshots, see the FX: LITE commit).
 * Applied in CSS through --fx-flat-lift (app/(site)/layout.tsx).
 */
export const FLAT_LIFT = +(LOOK.nvGain / NV_GAIN_BASE).toFixed(3);
