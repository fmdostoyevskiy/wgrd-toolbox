// Unit and weapon classifications the card's display rules are written in.
// Section-level rules live here; row-level rules are in fields/*.

// ── Units ────────────────────────────────────────────────────────────────────

export const isFob     = u => u.type === 'FOB';
export const isPlane   = u => u.type === 'Plane';
export const isAirUnit = u => u.type === 'Plane' || u.type === 'Helicopter';

// Vehicles move as wheeled, truck or tracked; anything else counts as tracked.
export function motionOf(u) {
  return u.motionType === 'wheeled' ? 'wheeled'
       : u.motionType === 'truck'   ? 'truck'
       : 'tracked';
}

// A FOB only shows its general stats.
export const showsMobility = u => !isFob(u);
export const showsOptics   = u => !isFob(u);

// Infantry and FOBs have no armor block. Aircraft only show it when they have
// front armor.
export function showsArmor(u) {
  return u.armor != null && u.type !== 'Infantry' && !isFob(u)
    && (!isAirUnit(u) || (u.armor?.F ?? 0) >= 1);
}

export const showsArmament = u => u.weapons?.length > 0 && !isFob(u);

// ── Weapons ──────────────────────────────────────────────────────────────────

export const hasTag    = (w, tag) => w.tag?.includes(tag) ?? false;
export const isMissile = w => w.category === 'Missile';

// Artillery scatters by dispersion instead of rolling accuracy.
export const showsAccuracy = w => w.category !== 'Artillery';

// Only guns and missiles have a stabilizer (accuracy on the move).
export const hasStabilizer = w => w.category === 'Gun' || w.category === 'Missile';

// Artillery AP is only shown for cluster munitions, which deal AP damage.
export const showsAp = w => w.category !== 'Artillery' || hasTag(w, 'CLUS');

// Artillery and bombs hit an area, so their damage and suppression radii are
// always shown; for other weapons they're expert-mode detail.
export const isAreaWeapon = w => w.category === 'Artillery' || w.category === 'Bomb';

// Bombs have no aim time or reload; they show a salvo size instead.
export const isBomb = w => w.category === 'Bomb';
