import { COALITION_NATIONS } from '@units-core';

// --- Slot cost matrices (extracted from aqarius) ---
// SLOT_COSTS[spec][tab] = array of AP costs per slot (0-indexed).
// Array length = number of available slots for that tab under that spec.

const G5 = [1, 2, 2, 2, 3];
const HEL5 = [1, 2, 2, 3, 3];
const AIR5 = [1, 2, 3, 4, 5];
const NAV5 = [0, 0, 0, 0, 0];
const BONUS7 = [1, 1, 1, 1, 2, 1, 1];
const BONUS9 = [1, 1, 1, 1, 2, 1, 1, 1, 1];

export const SLOT_COSTS = {
  General: {
    LOG: G5, INF: G5, SUP: G5, TNK: G5, REC: G5, VHC: G5,
    HEL: HEL5, AIR: AIR5, NAV: NAV5,
  },
  Support: {
    LOG: BONUS9, INF: G5, SUP: BONUS9, TNK: G5, REC: G5, VHC: G5,
    HEL: HEL5, AIR: AIR5, NAV: NAV5,
  },
  Motorized: {
    LOG: G5, INF: BONUS7, SUP: G5, TNK: G5, REC: BONUS7, VHC: BONUS7,
    HEL: HEL5, AIR: AIR5, NAV: NAV5,
  },
  Armored: {
    LOG: G5, INF: G5, SUP: G5, TNK: BONUS9, REC: G5, VHC: G5,
    HEL: HEL5, AIR: AIR5, NAV: NAV5,
  },
  Mechanized: {
    LOG: G5, INF: BONUS9, SUP: G5, TNK: G5, REC: G5, VHC: BONUS9,
    HEL: HEL5, AIR: AIR5, NAV: NAV5,
  },
  Airborne: {
    LOG: G5, INF: BONUS9, SUP: G5, TNK: G5, REC: G5, VHC: G5,
    HEL: [1, 1, 1, 2, 2, 1, 1, 1, 1],
    AIR: [1, 1, 2, 3, 4, 1, 1, 1, 1],
    NAV: NAV5,
  },
  Marine: {
    LOG: G5, INF: BONUS7, SUP: G5, TNK: G5, REC: G5, VHC: G5,
    HEL: HEL5,
    AIR: [1, 1, 2, 3, 4, 1, 1],
    NAV: [0, 0, 0, 0, 0, 0, 0, 0],
  },
  Naval: {
    LOG: [], INF: [], SUP: [], TNK: [], REC: [], VHC: [], HEL: [], AIR: [],
    NAV: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
};

// --- AP budget ---
// Total AP = BASE_AP + deckTypeBonus(nation/coal/alliance) + eraBonus
export const BASE_AP = 45;

export const DECK_TYPE_AP = {
  nation: 15,
  coalition: 10,
  alliance: 0,
};

export const ERA_AP = {
  A: 0,
  B: 5,
  C: 10,
};

// --- Availability bonus (placeholder percentages) ---
export const AVAIL_BONUS = {
  nation: 20,
  coalition: 10,
  alliance: 0,
};

// --- Deck type classification ---
export function classifyDeckChoice(choice) {
  if (choice === 'NATO' || choice === 'PACT') return 'alliance';
  if (COALITION_NATIONS[choice]) return 'coalition';
  return 'nation';
}

export function nationsForChoice(choice, allNato, allPact) {
  if (choice === 'NATO') return allNato;
  if (choice === 'PACT') return allPact;
  const members = COALITION_NATIONS[choice];
  if (members) return members;
  return [choice];
}

// --- Era helpers ---
export const ERAS = [
  { id: 'A', label: 'All', desc: '+0 AP' },
  { id: 'B', label: 'Pre-85', desc: '+5 AP' },
  { id: 'C', label: 'Pre-80', desc: '+10 AP' },
];

// --- Spec helpers ---
export const DECK_SPECS = [
  { id: null, label: 'General' },
  { id: 'Motorized', label: 'Motorized' },
  { id: 'Mechanized', label: 'Mechanized' },
  { id: 'Armored', label: 'Armored' },
  { id: 'Airborne', label: 'Airborne' },
  { id: 'Marine', label: 'Marine' },
  { id: 'Support', label: 'Support' },
  { id: 'Naval', label: 'Naval' },
];
