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

export const SPEC_VET_BONUS = {
  'Mechanized': { 'VHC': 2 },
  'Motorized':  { 'INF': 1, 'VHC': 1, 'REC': 1 },
  'Armored':    { 'TNK': 2 },
  'Airborne':   { 'INF': 1, 'HEL': 1, 'AIR': 1 },
  'Support':    { 'SUP': 1 },
  'Marine':     { 'INF': 1, 'AIR': 1 },
  'Naval':      {},
};
