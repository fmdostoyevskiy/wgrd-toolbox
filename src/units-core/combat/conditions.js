// Per-unit combat state that isn't in the unit data.

// Morale divides the hit chance: calm 1, worried 1.2, shaken 1.6, panicked 3.
export const MORALE = [
  { label: 'CALM',     mul: 1 },
  { label: 'WORRIED',  mul: 1 / 1.2 },
  { label: 'SHAKEN',   mul: 1 / 1.6 },
  { label: 'PANICKED', mul: 1 / 3 },
];

// Lowest veterancy the unit can be bought at, as an index into VET_TIERS.
export function lowestVet(unit) {
  const i = (unit.avail ?? []).findIndex(n => n > 0);
  return i < 0 ? 0 : i;
}
