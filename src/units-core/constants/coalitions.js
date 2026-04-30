const BASE = import.meta.env.BASE_URL;

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
  'NATO':         `${BASE}flags/coalition_nato.png`,
  'PACT':         `${BASE}flags/coalition_pact.png`,
  'Eurocorps':    `${BASE}flags/coalition_euro.png`,
  'Scandinavia':  `${BASE}flags/coalition_scand.png`,
  'Commonwealth': `${BASE}flags/coalition_cmw.png`,
  'Blue Dragons': `${BASE}flags/coalition_bluedragons.png`,
  'Landjut':      `${BASE}flags/coalition_land.png`,
  'NORAD':        `${BASE}flags/coalition_norad.png`,
  'Dutch-German': `${BASE}flags/coalition_dutchgerman.png`,
  'Eastern Bloc': `${BASE}flags/coalition_ebloc.png`,
  'Red Dragons':  `${BASE}flags/coalition_reddragons.png`,
  'Baltic Front': `${BASE}flags/coalition_finpol.png`,
  'Entente':      `${BASE}flags/coalition_entente.png`,
};
