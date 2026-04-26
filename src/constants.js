// ── Nation codes ──────────────────────────────────────────────────────────────

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

// ── Coalitions ────────────────────────────────────────────────────────────────
// Maps coalition display name → array of raw nation codes.
// Selecting a coalition is a shortcut that toggles its member nations.

export const COALITION_NATIONS = {
  'Eurocorps':      ['FR',  'RFA'],
  'Scandinavia':    ['SWE', 'DAN', 'NOR'],
  'Commonwealth':   ['UK',  'CAN', 'ANZ'],
  'Blue Dragons':   ['ROK', 'JAP'],
  'Landjut':        ['RFA', 'DAN'],
  'NORAD':          ['US',  'CAN'],
  'Dutch-German':   ['RFA', 'HOL'],
  'Eastern Bloc':   ['POL', 'TCH', 'RDA'],
  'Red Dragons':    ['CHI', 'NK'],
  'Baltic Front':   ['FIN', 'POL'],
  'Entente':        ['TCH', 'YUG'],
};

export const COALITIONS = Object.keys(COALITION_NATIONS);

// ── Flag image paths ───────────────────────────────────────────────────────────

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

// ── Specializations ───────────────────────────────────────────────────────────

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

// ── Unit tabs ─────────────────────────────────────────────────────────────────

export const TABS = ['LOG', 'INF', 'SUP', 'TNK', 'REC', 'VHC', 'HEL', 'AIR', 'NAV'];

// ── Veterancy ─────────────────────────────────────────────────────────────────

export const VET_TIERS = [
  { id: 'RKI', label: 'RKI', accMul: 1.00 },
  { id: 'TRN', label: 'TRN', accMul: 1.08 },
  { id: 'HRD', label: 'HRD', accMul: 1.16 },
  { id: 'VET', label: 'VET', accMul: 1.24 },
  { id: 'ELI', label: 'ELI', accMul: 1.32 },
];

// ── Visual themes ─────────────────────────────────────────────────────────────

export const BROWSER_TOKENS = {
  bg:          '#0f1115',
  surface:     '#151922',
  surface2:    '#1c2230',
  rule:        '#252b38',
  ruleStrong:  '#343c4e',
  ink:         '#d8dde6',
  dim:         '#7a8296',
  dimmer:      '#525a6c',
  accent:      '#e8a852',
  accent2:     '#8fb4d8',
  ok:          '#72d6a8',
  natoTag:     '#7fb4d8',
  pactTag:     '#e07a6c',
};

export const BMono = { fontFamily: 'var(--wrd-mono)' };

export const V2_THEMES = {
  signal: {
    bg:         '#130608',
    paper:      'rgba(255,255,255,0.02)',
    ink:        '#f0e6e6',
    dim:        '#7d6a6a',
    rule:       '#241c1e',
    ruleStrong: '#3d2e32',
    accent:     '#ff3d48',
    blueprint:  '#ff8a6b',
    ok:         '#e8a852',
  },
  tactical: {
    bg:         '#080e18',
    paper:      'rgba(255,255,255,0.02)',
    ink:        '#d8e8f8',
    dim:        '#5a7090',
    rule:       '#101e30',
    ruleStrong: '#1e3450',
    accent:     '#4d9fff',
    blueprint:  '#7fd4ff',
    ok:         '#72d6a8',
  },
};
