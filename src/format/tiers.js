// Single source of truth for the tier color palette and thresholds used to
// color-code stat values on cards. Each tier table is sorted descending by
// minimum value; byTier() walks them top-to-bottom and returns the first match.

export const TEAL   = '#2dd4bf';
export const GREEN  = '#4ade80';
export const ORANGE = '#e8a852';
export const RED    = '#f87171';

// thresholds: [[min, color, label?], ...] descending.
// Pass { strict: true } to use `>` instead of `>=` (matches a few legacy helpers).
export function byTier(value, thresholds, { strict = false } = {}) {
  if (value == null) return null;
  for (const [min, color, label] of thresholds) {
    if (strict ? value > min : value >= min) return { color, label };
  }
  return null;
}

// ── Stat tier tables ──────────────────────────────────────────────────────────

export const ARMOR = [
  [21, TEAL],
  [13, GREEN],
  [8,  ORANGE],
  [-Infinity, RED],
];

export const ACCURACY = [
  [60, TEAL],
  [50, GREEN],
  [35, ORANGE],
  [-Infinity, RED],
];

export const AP_KE = [
  [21, TEAL],
  [16, GREEN],
  [11, ORANGE],
  [-Infinity, RED],
];

export const AP_HEAT = [
  [25, TEAL],
  [21, GREEN],
  [16, ORANGE],
  [-Infinity, RED],
];

export const HE_MISSILE = [
  [8, TEAL],
  [5, GREEN],
  [4, ORANGE],
  [-Infinity, RED],
];

export const HE_BOMB = [
  [20, TEAL],
  [15, GREEN],
  [11, ORANGE],
  [-Infinity, RED],
];

export const HE_ARTILLERY = [
  [9, TEAL],
  [7, GREEN],
  [5, ORANGE],
  [-Infinity, RED],
];

export const HE_GUN = [
  [5,   TEAL],
  [4,   GREEN],
  [2.5, ORANGE],
  [-Infinity, RED],
];

export const MISSILE_SPEED = [
  [2500, TEAL],
  [1000, GREEN],
  [750,  ORANGE],
  [-Infinity, RED],
];

// ECM uses strict greater-than at every tier
export const ECM = [
  [40, TEAL],
  [20, GREEN],
  [10, ORANGE],
  [-Infinity, RED],
];

// Speed varies by unit type
export const SPEED = {
  Infantry:       [[45,   TEAL], [35,  GREEN], [30,  ORANGE], [-Infinity, RED]],
  Plane:          [[1000, TEAL], [900, GREEN], [750, ORANGE], [-Infinity, RED]],
  VehicleWheeled: [[90,   TEAL], [70,  GREEN], [55,  ORANGE], [-Infinity, RED]],
  VehicleTracked: [[75,   TEAL], [60,  GREEN], [50,  ORANGE], [-Infinity, RED]],
};

// ── Labelled tiers (return label + color) ─────────────────────────────────────

export const OPTICS = [
  [220, TEAL,   'Exceptional'],
  [170, GREEN,  'V. Good'],
  [120, GREEN,  'Good'],
  [80,  ORANGE, 'Medium'],
  [60,  RED,    'Poor'],
  [-Infinity, RED, 'Bad'],
];

export const STEALTH = [
  [3,   TEAL,   'Exceptional'],
  [2.5, GREEN,  'V. Good'],
  [1.6, GREEN,  'Good'],
  [1.5, ORANGE, 'Medium'],
  [1,   RED,    'Poor'],
  // < 1: returns null (no tier applies)
];

export const AIR_STEALTH = [
  [3,    TEAL,   'Exceptional'],
  [2,    GREEN,  'Good'],
  [1.25, ORANGE, 'Medium'],
  [1,    RED,    'Poor'],
];

export const AIR_OPTICS = [
  [900, TEAL,   'Exceptional++'],
  [450, TEAL,   'Exceptional'],
  [150, GREEN,  'Good'],
  [80,  ORANGE, 'Medium'],
  [40,  RED,    'Poor'],
  [-Infinity, RED, 'Bad'],
];

// ── Special: size uses ascending thresholds and an exact-zero check ──────────

export function sizeInfo(size) {
  if (size == null) return null;
  if (size < -0.05) return { color: TEAL,   label: 'V. Small' };
  if (size < 0)     return { color: GREEN,  label: 'Small' };
  if (size === 0)   return { color: ORANGE, label: 'Medium' };
  if (size > 0.05)  return { color: RED,    label: 'V. Big' };
  return                   { color: RED,    label: 'Big' };
}

// ── Convenience wrappers preserving exact legacy semantics ───────────────────

export const armorColor       = v => byTier(v, ARMOR)?.color ?? null;
export const accuracyColor    = v => byTier(v, ACCURACY)?.color ?? null;
export const missileSpeedColor = v => byTier(v, MISSILE_SPEED)?.color ?? null;
export const ecmColor         = v => byTier(v, ECM, { strict: true })?.color ?? null;

export function autonomyColor(v) {
  if (v == null) return null;
  if (v >= 700) return TEAL;
  if (v >  500) return GREEN;
  if (v >  300) return ORANGE;
  return RED;
}

export function apColor(val, isKE) {
  return byTier(val, isKE ? AP_KE : AP_HEAT)?.color ?? null;
}

export function heColor(val, category) {
  if (val == null) return null;
  switch (category) {
    case 'Missile':   return byTier(val, HE_MISSILE)?.color ?? null;
    case 'Bomb':      return byTier(val, HE_BOMB)?.color ?? null;
    case 'Artillery': return byTier(val, HE_ARTILLERY)?.color ?? null;
    case 'Gun':       return byTier(val, HE_GUN)?.color ?? null;
    default:          return null;
  }
}

export function speedColor(unit, v = unit?.speed) {
  if (v == null) return null;
  if (unit.type === 'Infantry')   return byTier(v, SPEED.Infantry)?.color ?? null;
  if (unit.type === 'Plane')      return byTier(v, SPEED.Plane)?.color ?? null;
  if (unit.type === 'Helicopter') {
    if (v >= 300) return TEAL;
    if (v >  250) return GREEN;
    if (v >  220) return ORANGE;
    return RED;
  }
  if (unit.type === 'Vehicle') {
    const table = unit.motionType === 'wheeled' ? SPEED.VehicleWheeled : SPEED.VehicleTracked;
    return byTier(v, table)?.color ?? null;
  }
  return null;
}
