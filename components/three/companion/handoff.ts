// Last pose the 3D helicopter drew, so the flat stand-in (after a fallback)
// can start exactly where it was: no jump when 3D switches off.
export const lastHeli = { valid: false, x: 0, y: 0, size: 0, yaw: 0, pitch: 0, bright: 1 };
