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

// Ordered for the filter bar (NATO-side first, then PACT/other)
export const ALL_NATIONS = [
  'US', 'UK', 'FR', 'RFA', 'CAN', 'DAN', 'SWE', 'NOR', 'ANZ',
  'ROK', 'JAP', 'HOL', 'ISR', 'SA', 'ITA',
  'URSS', 'RDA', 'POL', 'FIN', 'YUG', 'TCH', 'CHI', 'NK',
];

// Nations that display with the red (signal) card theme
export const PACT_NATIONS = new Set(['URSS', 'RDA', 'POL', 'FIN', 'YUG', 'TCH', 'CHI', 'NK']);

export function sideOf(nationCode) {
  return PACT_NATIONS.has(nationCode) ? 'signal' : 'tactical';
}

export const NATION_FLAG_MAP = {
  US:   './flags/nation_us.png',
  UK:   './flags/nation_uk.png',
  FR:   './flags/nation_fr.png',
  RFA:  './flags/nation_wger.png',
  CAN:  './flags/nation_can.png',
  DAN:  './flags/nation_dan.png',
  SWE:  './flags/nation_swe.png',
  NOR:  './flags/nation_norway.png',
  ANZ:  './flags/nation_anzac.png',
  JAP:  './flags/nation_jap.png',
  ROK:  './flags/nation_skor.png',
  HOL:  './flags/nation_nl.png',
  ISR:  './flags/nation_isr.png',
  SA:   './flags/nation_sa.png',
  ITA:  './flags/nation_ita.png',
  RDA:  './flags/nation_eger.png',
  URSS: './flags/nation_ussr.png',
  POL:  './flags/nation_pol.png',
  FIN:  './flags/nation_fin.png',
  YUG:  './flags/nation_yug.png',
  TCH:  './flags/nation_cz.png',
  CHI:  './flags/nation_chi.png',
  NK:   './flags/nation_nork.png',
};
