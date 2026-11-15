import { HELI_LIVE_ATTR } from '@/lib/motion/heli';

// Last pose the 3D helicopter drew, so the flat stand-in (after a fallback)
// can start exactly where it was: no jump when 3D switches off.
export const lastHeli = { valid: false, x: 0, y: 0, size: 0, yaw: 0, pitch: 0, bright: 1 };


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
