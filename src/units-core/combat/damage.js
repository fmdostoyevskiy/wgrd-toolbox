// Damage per hit. calcHeatDamage/calcKeDamage are shared with the AP damage tool.

const HEX = 175;

// HEAT damage: AP and armor only
export function calcHeatDamage(AP, armor) {
  if (armor === 0) return AP * 2;
  if (armor === 1) return AP;
  if (armor >= AP) return 1;
  const diff = AP - armor;
  const base = diff >= 10 ? diff - 4 : diff * 0.5 + 1; // reaches 6 at diff=10, then +1 per point
  return armor >= 21 && diff > 5 ? base + 0.5 : base;
}

// KE AP gains 1 per 175 m closer than max range, up to 30.
export function keEffectiveAP(AP, maxRange, distance) {
  return Math.min(AP + Math.floor((maxRange - distance) / HEX), 30);
}

// KE damage: AP, armor, max range and distance
export function calcKeDamage(AP, armor, maxRange, distance) {
  const effectiveAP = keEffectiveAP(AP, maxRange, distance);
  let damage;
  if (armor === 0) {
    damage = effectiveAP * 2;
  } else if (armor === 1) {
    damage = effectiveAP;
  } else if (armor > effectiveAP) {
    damage = 0;
  } else {
    damage = 1 + (effectiveAP - armor) * 0.5;
  }
  return damage;
}

// Armor facings a direct-fire shot can hit, as keyed in unit.armor. Top armor
// (unit.armor.T) is only hit from above, which isn't modelled.
export const FACINGS = [
  { key: 'F', label: 'FRONT' },
  { key: 'S', label: 'SIDE' },
  { key: 'R', label: 'REAR' },
];

// Armor only counts on vehicles and ships. Shots at helicopters and planes
// always use HE, and infantry has no armor.
export function hasArmor(unit) {
  return (unit.type === 'Vehicle' || unit.type === 'Ship') && unit.armor != null;
}

// Weapons without AP can't damage anything with more armor than this, and do
// HE_ARMOR_MUL of their damage to armor at exactly this value.
export const HE_MAX_ARMOR = 2;
export const HE_ARMOR_MUL = 0.6;

// Infantry rifles and machine guns (the tags enrich.py's infantry smalls and
// infantry support handlers set) can't damage any armor at all.
const INFANTRY_ARMS_TAGS = new Set([
  'AR', 'BR', 'SMG', 'CAR', 'BA', 'SPEC',
  'GENMG', 'MG3', 'BREN', 'RPD', 'COLT', 'MINI', 'RPK74', 'RPK', 'FALO', 'GALIL', 'SHIT',
]);
export const isInfantryArms = w => (w?.tag ?? []).some(t => INFANTRY_ARMS_TAGS.has(t));

// What one hit does to the target.
// opts: { facing (key into unit.armor), distance, range (the weapon's max range
// against the target, for the KE bonus) }
// Returns { ok, reason, kind: 'KE' | 'HEAT' | 'HE', dmg, ap (effective AP, or
// null), armor (the facing's value, or null), armorMul (HE vs armor only) }. Whether it's ok doesn't depend
// on the distance.
// Infantry in cover takes a share of the damage it would in the open.
// Only infantry gets the bonus.
export const COVER = [
  { key: 'O', label: 'OPEN',     mul: 1 },
  { key: 'F', label: 'FOREST',   mul: 0.6 },
  { key: 'B', label: 'BUILDING', mul: 0.3 },
];
export const coverOf = (target, key) =>
  (target?.type === 'Infantry' ? COVER.find(c => c.key === key) : null) ?? COVER[0];

export function damagePerHit(w, target, { facing = 'F', distance = 0, range = 0, cover = 'O' } = {}) {
  const c = coverOf(target, cover);
  const he = { ok: true, reason: null, kind: 'HE', dmg: (w.dmg ?? 0) * c.mul, ap: null, armor: null, cover: c };
  if (!hasArmor(target)) return he;

  const armor = target.armor[facing] ?? 0;
  if (w.ap > 0) {
    if ((w.tag ?? []).includes('KE')) {
      return {
        ok: true, reason: null, kind: 'KE', armor, cover: c,
        ap: keEffectiveAP(w.ap, range, distance), dmg: calcKeDamage(w.ap, armor, range, distance),
      };
    }
    return { ok: true, reason: null, kind: 'HEAT', armor, cover: c, ap: w.ap, dmg: calcHeatDamage(w.ap, armor) };
  }
  if (isInfantryArms(w) && armor > 0) return { ...he, ok: false, reason: `SMALL ARMS VS ARMOR ${armor}`, armor };
  if (armor > HE_MAX_ARMOR) return { ...he, ok: false, reason: `NO AP VS ARMOR ${armor}`, armor };
  const mul = armor === HE_MAX_ARMOR ? HE_ARMOR_MUL : 1;
  return { ...he, armor, dmg: he.dmg * mul, armorMul: mul };
}
