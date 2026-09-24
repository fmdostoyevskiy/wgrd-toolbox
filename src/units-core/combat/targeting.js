import { hasHE } from '../format/weapon.js';

const DOMAINS = { Plane: 'AIR', Helicopter: 'HELO', Ship: 'SHIP' };

// Which range class a weapon uses against this unit: GROUND, HELO, AIR or SHIP.
export function targetDomain(unit) {
  return DOMAINS[unit.type] ?? 'GROUND';
}

// The max range the weapon uses against this target, and the label of the
// matching range row on the weapon card (see WeaponBlock's activeRange).
export function rangeAgainst(w, target) {
  switch (targetDomain(target)) {
    case 'AIR':  return { range: w.rng_a ?? 0, label: 'Range A' };
    case 'HELO': return { range: w.rng_h ?? 0, label: 'Range H' };
    case 'SHIP':
      return w.rng_s != null
        ? { range: w.rng_s, label: 'Range S' }
        : { range: w.rng_g ?? 0, label: 'Range G' };
    default:
      if (w.category === 'Artillery') return { range: w.maxRange ?? 0, label: 'Range' };
      if (w.rng_gAP != null) {
        return target.type === 'Vehicle'
          ? { range: w.rng_gAP, label: 'Range G AP' }
          : { range: w.rng_gHE, label: 'Range G HE' };
      }
      return { range: w.rng_g ?? 0, label: 'Range G' };
  }
}

// Hit-roll modifiers the target carries. Both multiply the hit chance:
// size by (1 + size), ECM by (1 - ecm / 100).
export function targetModifiers(unit) {
  const size = unit.type === 'Plane' || unit.type === 'Ship' ? 0 : (unit.size ?? 0);
  return { size, ecm: unit.ecm ?? 0 };
}

// A direct-fire weapon with only AP ammo (KE or HEAT), like most infantry AT
// launchers. Their HE value comes with the AP round and isn't used against
// infantry; weapons that can fire at infantry have a separate HE ammo, merged
// in by enrich.py and tagged AoE. Heavy machine guns (KPVT and its AA
// mounts) are tagged AC and have only KE ammo, but still fire at infantry.
const apOnly = w => {
  const tags = w.tag ?? [];
  return (w.category === 'Gun' || w.category === 'Missile')
    && (tags.includes('KE') || tags.includes('HEAT')) && !tags.includes('AoE') && !tags.includes('AC');
};

// Whether the weapon can fire at the target at all, at any distance.
// Returns { ok, reason, range, rangeLabel, domain }.
export function canEngage(w, target) {
  if (!w) return { ok: false, reason: 'NO WEAPON', range: 0, rangeLabel: null, domain: null };
  const domain = targetDomain(target);
  const { range, label } = rangeAgainst(w, target);
  const out = { ok: true, reason: null, range, rangeLabel: label, domain };
  if (!range) return { ...out, ok: false, reason: `CAN'T TARGET ${domain}` };
  if (target.type === 'Infantry' && apOnly(w)) return { ...out, ok: false, reason: 'AT ONLY' };
  if (target.type === 'Infantry' && !hasHE(w)) return { ...out, ok: false, reason: 'NO HE VS INFANTRY' };
  return out;
}
