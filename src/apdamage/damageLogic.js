// HEAT damage: AP and armor only
export function calcHeatDamage(AP, armor) {
  if (armor === 0) return AP * 2;
  if (armor === 1) return AP;
  if (armor >= AP) return 1;
  return (AP - armor) / 2 + 1;
}

// KE damage: AP, armor, max range and distance
export function calcKeDamage(AP, armor, maxRange, distance) {
  const bonus = Math.floor((maxRange - distance) / 175);
  const effectiveAP = Math.min(AP + bonus, 30);
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

// Map a damage value to a "shots to kill 10HP" tier 0..8
function damageTier(dmg) {
  if (dmg <= 0) return 0;
  if (dmg >= 10) return 8;
  if (dmg >= 5) return 7;
  if (dmg >= 3.5) return 6;
  if (dmg >= 2.5) return 5;
  if (dmg >= 2) return 4;
  if (dmg >= 1.5) return 3;
  if (dmg >= 1) return 2;
  return 1;
}

export const TIER_COLORS = {
  tactical: [
    '#5a0d12',
    '#7d1418',
    '#9a1d1d',
    '#b8451d',
    '#c9701f',
    '#c89527',
    '#a8a02a',
    '#5e8a2a',
    '#1f5d27',
  ],
  muted: [
    '#3a1116',
    '#5a1a1d',
    '#7a2422',
    '#a04722',
    '#b87126',
    '#b8932c',
    '#8e9a30',
    '#4f7a30',
    '#1c4d24',
  ],
};

export function tierColor(dmg, palette = 'tactical') {
  return TIER_COLORS[palette][damageTier(dmg)];
}

export function shotsToKill(dmg) {
  if (dmg <= 0) return Infinity;
  return Math.ceil(10 / dmg);
}

export function fmtDmg(d) {
  if (d <= 0) return '0.0';
  return (Math.round(d * 10) / 10).toFixed(1);
}

export const AP_RANGE = Array.from({ length: 30 }, (_, i) => i + 1);
export const ARMOR_RANGE = Array.from({ length: 26 }, (_, i) => i);
