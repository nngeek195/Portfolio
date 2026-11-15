import { HELI_LIVE_ATTR } from '@/lib/motion/heli';

// Last pose the 3D helicopter drew, so the flat stand-in (after a fallback)
// can start exactly where it was: no jump when 3D switches off.
// Also read by the rotor sound (components/site/AudioDirector): `presence` is
// 0..1 (1 = on screen, fading to 0 a little off screen), `rotor` the rotor
// speed 0..1 and `at` the performance.now() of the last frame that wrote it.
export const lastHeli = { valid: false, x: 0, y: 0, size: 0, yaw: 0, pitch: 0, bright: 1, presence: 0, rotor: 0.5, at: 0 };


// html[data-heli-live] (which hides the section stills) is shared by the 3D and
// the flat helicopter; during a handoff both are mounted for a moment, so it is
// reference-counted: present while either one holds it.
const holders = new Set<string>();
export function holdLive(id: string) {
  holders.add(id);
  document.documentElement.setAttribute(HELI_LIVE_ATTR, '');
  return () => {
    holders.delete(id);
    if (!holders.size) document.documentElement.removeAttribute(HELI_LIVE_ATTR);
  };
}
