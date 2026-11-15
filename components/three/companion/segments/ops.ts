import { OPS_HELI_X } from '@/lib/motion/heli';
import { lerp, setFlag, smoothstep, type Claim, type DirectorContext } from '../types';

// Waypoint inside each card: banner centre (header ~42px + half the 160px banner), alternating up / down.
const LZ_Y = 122;
const LZ_SWING = 38;

let lastFull = '';
let lastDone = '';

/**
 * Operations: tactical-map view. The camera tips to look straight down; the
 * helicopter flies landing zone to landing zone (one per project card) as the
 * track scrolls under it, turning to face each leg, with a dotted route trail.
 * The card it is over lights up as the active LZ.
 */
export function ops({ W, H, rect }: DirectorContext): Claim | null {
  const pin = rect('#operations [data-ops="pin"]');
  const track = rect('#operations [data-ops="track"]');
  if (!pin || !track) return null;
  const d = Math.abs(pin.top + pin.height / 2 - H / 2) / H;
  const weight = 1 - smoothstep(0.42, 0.8, d);
  if (weight <= 0) return clear();

  const cards = Array.from(document.querySelectorAll<HTMLElement>('#operations [data-lz]'));
  const n = cards.length;
  if (!n) return clear();
  const lz = cards.map((el, i) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + LZ_Y + (i % 2 ? LZ_SWING : -LZ_SWING) };
  });

  // Where the fixed anchor line falls between card centres: k = leg, frac = progress along it.
  const ax = OPS_HELI_X * W;
  let k = 0;
  let frac = 0;
  if (ax >= lz[n - 1].x) k = n - 1;
  else if (ax > lz[0].x) {
    while (k < n - 2 && lz[k + 1].x <= ax) k++;
    frac = (ax - lz[k].x) / (lz[k + 1].x - lz[k].x);
  }
  const a = lz[k];
  const b = lz[Math.min(k + 1, n - 1)];
  const e = smoothstep(0.3, 0.72, frac); // hold over each LZ, then a quick hop to the next
  const x = lerp(a.x, b.x, e);
  const y = lerp(a.y, b.y, e);
  const heading = b === a ? 0 : Math.atan2(-(b.y - a.y), b.x - a.x);

  const active = e < 0.12 ? k : e > 0.88 ? Math.min(k + 1, n - 1) : -1;
  cards.forEach((el, i) => setFlag(el, 'data-lz-active', i === active));

  // Route trail in the track's own coordinates (it scrolls with the cards).
  const pts = lz.map((p) => `${(p.x - track.left).toFixed(1)},${(p.y - track.top).toFixed(1)}`);
  const full = pts.join(' ');
  const done = [...pts.slice(0, k + 1), `${(x - track.left).toFixed(1)},${(y - track.top).toFixed(1)}`].join(' ');
  if (full !== lastFull) document.querySelector('#operations [data-ops-route="full"]')?.setAttribute('points', (lastFull = full));
  if (done !== lastDone) document.querySelector('#operations [data-ops-route="done"]')?.setAttribute('points', (lastDone = done));

  const topDown = 1 - smoothstep(0.18, 0.5, d);
  return {
    weight,
    pose: {
      x,
      y,
      size: Math.min(170, W * 0.11),
      // Before it tips over to the map view it faces along the track (right), then follows each leg.
      yaw: topDown > 0.5 ? heading : 0,
      topDown,
      shadow: topDown,
      light: 0,
      lambda: 6,
    },
  };
}

function clear(): null {
  document.querySelectorAll('#operations [data-lz-active]').forEach((el) => el.removeAttribute('data-lz-active'));
  return null;
}
