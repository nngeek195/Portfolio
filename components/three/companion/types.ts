// Companion helicopter: the flight director asks the current section's segment
// for a target pose; the rig springs towards it every frame.
// Coordinates are viewport CSS pixels (origin top-left, y down).

export type Pose = {
  x: number;
  y: number;
  /** On-screen length of the helicopter (nose to tail, rotor included), px. */
  size: number;
  /**
   * Heading. Side view: 0 = nose right, PI = nose left (turns through a front
   * view). Top-down: screen angle, counter-clockwise from "right" (y up).
   * Undefined = follow the direction of travel.
   */
  yaw?: number;
  /** Extra nose-up pitch, radians (flare, lean). */
  pitch?: number;
  /** Extra bank about the nose axis, radians. */
  roll?: number;
  /** 0 = side view, 1 = looking straight down (Operations map). */
  topDown?: number;
  /** Searchlight strength 0..1 and where it points (px). */
  light?: number;
  lightX?: number;
  lightY?: number;
  /** Dust / downwash strength 0..1 and the ground line (px). */
  dust?: number;
  groundY?: number;
  /** Soft ground shadow strength 0..1 (needs groundY in side view). */
  shadow?: number;
  /** Rotor speed multiplier (1 = flight, ~0.25 = idling on the pad). */
  rotor?: number;
  /** Night-vision grade strength (default 0.85) and brightness (default 1). */
  nv?: number;
  bright?: number;
  /** How tightly to follow the target (higher = snappier). */
  lambda?: number;
};

export type DirectorContext = {
  t: number;
  W: number;
  H: number;
  /** Side gutter width beside the 1280px content column, px. */
  gutter: number;
  scrollY: number;
  maxScroll: number;
  /** getBoundingClientRect of the first match (cached per frame), or null if missing / not rendered. */
  rect: (selector: string) => DOMRect | null;
  /** All matches (cached per frame). */
  rects: (selector: string) => DOMRect[];
  signals: Signals;
};

export type Signals = {
  heroProgress: number;
  dossierProgress: number;
  /** Comms channel currently hovered (for the dip), if any. */
  hovered: DOMRect | null;
};

export type Segment = (ctx: DirectorContext) => Pose | null;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Progress (0..1) of an element scrolling from "top at viewport bottom" to "centre at viewport centre". */
export function arrival(r: DOMRect, H: number) {
  return clamp01((H - r.top) / (H / 2 + r.height / 2));
}

/** Sets a data attribute on elements only when it changes (cheap per-frame DOM sync). */
export function setFlag(el: Element | null | undefined, name: string, on: boolean) {
  if (!el) return;
  if (on !== el.hasAttribute(name)) {
    if (on) el.setAttribute(name, '');
    else el.removeAttribute(name);
  }
}
