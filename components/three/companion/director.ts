import type { Claim, DirectorContext, Pose, Segment, Signals } from './types';
import { lerp } from './types';
import { patrol } from './segments/patrol';
import { hero } from './segments/hero';
import { dossier } from './segments/dossier';
import { loadout } from './segments/loadout';
import { ops } from './segments/ops';
import { comms } from './segments/comms';
import { debrief } from './segments/debrief';

// Claims in page order, layered over the always-defined patrol: each one is
// blended in by its weight, so a later scene fades over an earlier one inside
// their overlapping zones. The patrol layer underneath means there is never a
// scroll position without a pose.
const LAYERS: [string, Segment][] = [
  ['hero', hero],
  ['dossier', dossier],
  ['loadout', loadout],
  ['ops', ops],
  ['comms', comms],
  ['debrief', debrief],
];

const wrapPi = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
/** Side-view headings live in [-PI, 0] so a turn passes through a front view (never the back). */
const sideYaw = (y: number) => {
  const w = wrapPi(y);
  return w > 0 ? -w : w;
};

function blend(a: Pose, b: Pose, w: number): Pose {
  const topDown = lerp(a.topDown ?? 0, b.topDown ?? 0, w);
  let ya = a.yaw ?? 0;
  let yb = b.yaw ?? 0;
  if (topDown < 0.5) {
    ya = sideYaw(ya);
    yb = sideYaw(yb);
  } else yb = ya + wrapPi(yb - ya);
  const lightA = a.light ?? 0;
  const lightB = b.light ?? 0;
  return {
    x: lerp(a.x, b.x, w),
    y: lerp(a.y, b.y, w),
    size: lerp(a.size, b.size, w),
    yaw: lerp(ya, yb, w),
    pitch: lerp(a.pitch ?? 0, b.pitch ?? 0, w),
    roll: lerp(a.roll ?? 0, b.roll ?? 0, w),
    topDown,
    light: lerp(lightA, lightB, w),
    // Aim where the brighter contributor aims.
    lightX: lightB * w >= lightA * (1 - w) ? (b.lightX ?? b.x) : (a.lightX ?? a.x),
    lightY: lightB * w >= lightA * (1 - w) ? (b.lightY ?? b.y + 200) : (a.lightY ?? a.y + 200),
    dust: lerp(a.dust ?? 0, b.dust ?? 0, w),
    groundY: a.groundY === undefined ? b.groundY : b.groundY === undefined ? a.groundY : lerp(a.groundY, b.groundY, w),
    shadow: lerp(a.shadow ?? 0, b.shadow ?? 0, w),
    rotor: lerp(a.rotor ?? 1, b.rotor ?? 1, w),
    nv: lerp(a.nv ?? 0.85, b.nv ?? 0.85, w),
    bright: lerp(a.bright ?? 1, b.bright ?? 1, w),
    lambda: lerp(a.lambda ?? 4, b.lambda ?? 4, w),
  };
}

/**
 * Flight director: once per frame, the helicopter's target pose as a pure
 * function of the page's scroll state (section rects, scene progress from
 * the scenes' triggers) plus pointer hover. Exactly one owner at any scroll
 * position: the layer contributing most after blending.
 */
export function createDirector() {
  const signals: Signals = { hovered: null };
  let hoveredEl: Element | null = null;
  const onOver = (e: PointerEvent) => (hoveredEl = (e.target as Element | null)?.closest?.('[data-channel]') ?? null);
  window.addEventListener('pointerover', onOver, { passive: true });

  let cache = new Map<string, DOMRect | null>();
  let cacheAll = new Map<string, DOMRect[]>();
  const rect = (sel: string) => {
    if (cache.has(sel)) return cache.get(sel)!;
    const el = document.querySelector(sel);
    const r = el ? el.getBoundingClientRect() : null;
    const v = r && (r.width > 0 || r.height > 0) ? r : null;
    cache.set(sel, v);
    return v;
  };
  const rects = (sel: string) => {
    let v = cacheAll.get(sel);
    if (!v) cacheAll.set(sel, (v = Array.from(document.querySelectorAll(sel), (el) => el.getBoundingClientRect())));
    return v;
  };

  return {
    signals,
    owner: 'patrol',
    pose(t: number): Pose {
      cache = new Map();
      cacheAll = new Map();
      signals.hovered = hoveredEl?.isConnected ? hoveredEl.getBoundingClientRect() : null;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const ctx: DirectorContext = {
        t,
        W,
        H,
        gutter: Math.max(0, (W - 1280) / 2),
        scrollY: window.scrollY,
        maxScroll: Math.max(1, document.documentElement.scrollHeight - H),
        rect,
        rects,
        signals,
      };
      let pose = patrol(ctx);
      const claims: [string, Claim][] = [];
      for (const [name, seg] of LAYERS) {
        const c = seg(ctx);
        if (!c || !(c.weight > 0)) continue;
        const w = Math.min(1, c.weight);
        pose = blend(pose, c.pose, w);
        claims.push([name, { weight: w, pose: c.pose }]);
      }
      // Owner = largest final contribution (a later layer covers earlier ones by its weight).
      let owner = 'patrol';
      let best = claims.reduce((m, [, c]) => m * (1 - c.weight), 1);
      claims.forEach(([name, c], i) => {
        const share = claims.slice(i + 1).reduce((m, [, d]) => m * (1 - d.weight), c.weight);
        if (share > best) {
          best = share;
          owner = name;
        }
      });
      this.owner = owner;
      return pose;
    },
    dispose() {
      window.removeEventListener('pointerover', onOver);
    },
  };
}

export type Director = ReturnType<typeof createDirector>;
