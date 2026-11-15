import { arrival, clamp01, easeOut, lerp, setFlag, smoothstep, type Claim, type DirectorContext } from '../types';
import { patrolSize, stationX } from './patrol';

/**
 * Comms (exfil): full landing sequence into the extraction panel as the
 * section scrolls in (same range as the ETA countdown): descent from the upper
 * right, flare (nose up), then a low hover over the pad with dust and
 * downwash; the searchlight locks onto TRANSMIT. Hovering a channel makes it
 * dip towards it.
 */
export function comms({ t, W, H, gutter, rect, signals }: DirectorContext): Claim | null {
  const section = rect('#contact');
  const lz = rect('#contact [data-comms="lz"]');
  const transmitEl = document.querySelector('#contact [data-comms="transmit"]');
  const p = section ? arrival(section, H) : 0;
  const weight = section && lz ? smoothstep(0, 0.12, p) : 0;
  if (!section || !lz || weight <= 0) {
    setFlag(transmitEl, 'data-locked', false);
    return null;
  }
  const size = Math.min(lz.width * 0.8, 470);
  const padX = lz.left + lz.width / 2;
  const padY = lz.bottom - lz.height * 0.14 - 12;
  const hoverY = padY - size * 0.24;

  // Descent from the right-hand station (where patrol hands it over), on screen throughout.
  const d = easeOut(clamp01(p / 0.55));
  let x = lerp(stationX('right', W, gutter, patrolSize(W, gutter)), padX, d);
  let y = lerp(H * 0.2, hoverY - size * 0.22, d);
  const settle = smoothstep(0.5, 0.82, p);
  y = lerp(y, hoverY, settle) + Math.sin(t * 1.7) * 4 * settle;
  const flare = Math.sin(Math.PI * clamp01((p - 0.38) / 0.3)) * 0.24;

  let pitch = flare;
  let roll = 0;
  const h = signals.hovered;
  if (h && settle > 0.5) {
    // Dip towards the hovered channel (nose is facing left, towards the list).
    const hx = h.left + h.width / 2;
    x += Math.max(-36, Math.min(36, (hx - x) * 0.05));
    y += 16;
    pitch -= 0.12;
    roll += 0.08;
  }

  const lock = smoothstep(0.72, 0.9, p);
  setFlag(transmitEl, 'data-locked', lock > 0.6);
  const target = transmitEl?.getBoundingClientRect();
  return {
    weight,
    pose: {
    x,
    y,
    size: lerp(patrolSize(W, gutter), size, smoothstep(0, 0.4, p)),
    yaw: Math.PI,
    pitch,
    roll,
    light: lock,
    lightX: target ? target.left + target.width / 2 : x - size,
    lightY: target ? target.top + target.height / 2 : padY,
    dust: settle,
    groundY: padY,
    shadow: 0.25 + 0.6 * settle,
    lambda: 5,
    },
  };
}
