const BASE = import.meta.env.BASE_URL;

export const NATION_CODE_MAP = {
  US:   'USA',
  UK:   'United Kingdom',
  FR:   'France',
  RFA:  'West Germany',
  CAN:  'Canada',
  DAN:  'Denmark',
  SWE:  'Sweden',
  NOR:  'Norway',
  ANZ:  'ANZAC',
  JAP:  'Japan',
  ROK:  'South Korea',
  HOL:  'Netherlands',
  ISR:  'Israel',
  SA:   'South Africa',
  ITA:  'Italy',
  RDA:  'East Germany',
  URSS: 'USSR',
  POL:  'Poland',
  FIN:  'Finland',
  YUG:  'Yugoslavia',
  TCH:  'Czechoslovakia',
  CHI:  'China',
  NK:   'North Korea',
};

export const ALL_NATIONS = [
  'US', 'UK', 'FR', 'RFA', 'CAN', 'DAN', 'SWE', 'NOR', 'ANZ',
  'ROK', 'JAP', 'HOL', 'ISR', 'SA', 'ITA',
  'URSS', 'RDA', 'POL', 'FIN', 'YUG', 'TCH', 'CHI', 'NK',
];

export const PACT_NATIONS = new Set(['URSS', 'RDA', 'POL', 'FIN', 'YUG', 'TCH', 'CHI', 'NK']);

export function sideOf(nationCode) {
  return PACT_NATIONS.has(nationCode) ? 'signal' : 'tactical';
}

export const NATION_FLAG_MAP = {
  US:   `${BASE}flags/nation_us.png`,
  UK:   `${BASE}flags/nation_uk.png`,
  FR:   `${BASE}flags/nation_fr.png`,
  RFA:  `${BASE}flags/nation_wger.png`,
  CAN:  `${BASE}flags/nation_can.png`,
  DAN:  `${BASE}flags/nation_dan.png`,
  SWE:  `${BASE}flags/nation_swe.png`,
  NOR:  `${BASE}flags/nation_norway.png`,
  ANZ:  `${BASE}flags/nation_anzac.png`,
  JAP:  `${BASE}flags/nation_jap.png`,
  ROK:  `${BASE}flags/nation_skor.png`,
  HOL:  `${BASE}flags/nation_nl.png`,
  ISR:  `${BASE}flags/nation_isr.png`,
  SA:   `${BASE}flags/nation_sa.png`,
  ITA:  `${BASE}flags/nation_ita.png`,
  RDA:  `${BASE}flags/nation_eger.png`,
  URSS: `${BASE}flags/nation_ussr.png`,
  POL:  `${BASE}flags/nation_pol.png`,
  FIN:  `${BASE}flags/nation_fin.png`,
  YUG:  `${BASE}flags/nation_yug.png`,
  TCH:  `${BASE}flags/nation_cz.png`,
  CHI:  `${BASE}flags/nation_chi.png`,
  NK:   `${BASE}flags/nation_nork.png`,
};
