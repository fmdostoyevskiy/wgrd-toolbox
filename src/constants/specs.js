// Converts raw spec codes from units.json to display names used by the filter.
export const SPEC_CODE_MAP = {
  AIR:   'Airborne',
  AIRB:  'Airborne',
  ARM:   'Armored',
  ARMOR: 'Armored',
  MAR:   'Marine',
  MECH:  'Mechanized',
  MOT:   'Motorized',
  MOTO:  'Motorized',
  NAV:   'Naval',
  NAVAL: 'Naval',
  SUP:   'Support',
};

export const SPECS = ['Mechanized', 'Motorized', 'Armored', 'Airborne', 'Marine', 'Support', 'Naval'];

// Veterancy shift applied to units of matching tab when a spec is selected.
// Key: spec display name → { tab: shift amount }
export const SPEC_VET_BONUS = {
  'Mechanized': { 'VHC': 2 },
  'Motorized':  { 'INF': 1, 'VHC': 1, 'REC': 1 },
  'Armored':    { 'TNK': 2 },
  'Airborne':   { 'INF': 1, 'HEL': 1, 'AIR': 1 },
  'Support':    { 'SUP': 1 },
  'Marine':     { 'INF': 1, 'AIR': 1 },
  'Naval':      {},
};
