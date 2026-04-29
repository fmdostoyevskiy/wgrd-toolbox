// Coalition display name → array of raw nation codes.
// Selecting a coalition is a shortcut that toggles its member nations.
export const COALITION_NATIONS = {
  'Eurocorps':    ['FR',  'RFA'],
  'Scandinavia':  ['SWE', 'DAN', 'NOR'],
  'Commonwealth': ['UK',  'CAN', 'ANZ'],
  'Blue Dragons': ['ROK', 'JAP'],
  'Landjut':      ['RFA', 'DAN'],
  'NORAD':        ['US',  'CAN'],
  'Dutch-German': ['RFA', 'HOL'],
  'Eastern Bloc': ['POL', 'TCH', 'RDA'],
  'Red Dragons':  ['CHI', 'NK'],
  'Baltic Front': ['FIN', 'POL'],
  'Entente':      ['TCH', 'YUG'],
};

export const COALITIONS = Object.keys(COALITION_NATIONS);

export const COALITION_FLAG_MAP = {
  'NATO':         './flags/coalition_nato.png',
  'PACT':         './flags/coalition_pact.png',
  'Eurocorps':    './flags/coalition_euro.png',
  'Scandinavia':  './flags/coalition_scand.png',
  'Commonwealth': './flags/coalition_cmw.png',
  'Blue Dragons': './flags/coalition_bluedragons.png',
  'Landjut':      './flags/coalition_land.png',
  'NORAD':        './flags/coalition_norad.png',
  'Dutch-German': './flags/coalition_dutchgerman.png',
  'Eastern Bloc': './flags/coalition_ebloc.png',
  'Red Dragons':  './flags/coalition_reddragons.png',
  'Baltic Front': './flags/coalition_finpol.png',
  'Entente':      './flags/coalition_entente.png',
};
