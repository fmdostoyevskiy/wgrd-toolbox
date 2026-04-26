// Extended unit roster for the armory browser.
// Each entry: { id, name, tab, nation, coalition, spec, cost, tags }
// tab  = type/icon slot (TNK, INF, HEL, AIR, AA, ART, REC, SUP, LOG, SHP, ATK)
// spec = deck slot (MOTO, MECH, ARMOR, PARA, MAR, SUP, AIR)
// coalition = NORAD | COMMONWEALTH | SCANDINAVIA | EUROCORPS | NORTHAG
//           | RED DRAGONS | WARSAW PACT
// nation = USA, UK, FR, W.GER, CAN, DEN, NOR, NED, USSR, E.GER, POL,
//          CZE, CHN, DPRK, ROK, JPN, ANZ, SWE

const COALITIONS = ['NORAD','Commonwealth','Scandinavia','Eurocorps','NORTHAG','Red Dragons','Warsaw Pact'];
const NATIONS_NATO = ['USA','UK','FR','W.GER','CAN','DEN','NOR','NED','SWE'];
const NATIONS_PACT = ['USSR','E.GER','POL','CZE','CHN','DPRK'];
const NATIONS_ASIA = ['ROK','JPN','ANZ'];
const ALL_NATIONS = [...NATIONS_NATO, ...NATIONS_PACT, ...NATIONS_ASIA];

const SPECS = ['MOTO','MECH','ARMOR','PARA','MAR','SUP','AIR'];
const TABS  = ['LOG','INF','SUP','TNK','REC','AA','ART','HEL','AIR','NAV'];
const TAGS  = ['KE','HEAT','RAD','ATGM','HE','AP','DISP','STAT','CLUS','SMOKE','SA','AL'];

// Side derivation (for card theme) — NATO/Asia = tactical (blue), PACT = signal (red)
const PACT_NATIONS = new Set(NATIONS_PACT);

function sideOf(nation) {
  return PACT_NATIONS.has(nation) ? 'signal' : 'tactical';
}

// Roster — about 40 units covering the tabs. Uses real unit strings but
// cost values are made up for the mock.
const ROSTER = [
  // Tanks
  { id: 'm1a1', name: 'M1A1 Abrams', tab: 'TNK', nation: 'USA', coalition: 'NORAD', spec: 'ARMOR', cost: 145, tags: ['KE','HEAT'] },
  { id: 'chal2', name: 'Challenger 2', tab: 'TNK', nation: 'UK', coalition: 'Commonwealth', spec: 'ARMOR', cost: 160, tags: ['KE','HEAT'] },
  { id: 'leclerc', name: 'Leclerc', tab: 'TNK', nation: 'FR', coalition: 'Eurocorps', spec: 'ARMOR', cost: 170, tags: ['KE','HEAT'] },
  { id: 't80u', name: 'T-80U', tab: 'TNK', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'ARMOR', cost: 140, tags: ['KE','HEAT','ATGM'] },
  { id: 'strv103c', name: 'Strv 103C', tab: 'TNK', nation: 'SWE', coalition: 'Scandinavia', spec: 'ARMOR', cost: 125, tags: ['KE'] },
  { id: 'leo2a5', name: 'Leopard 2A5', tab: 'TNK', nation: 'W.GER', coalition: 'NORTHAG', spec: 'ARMOR', cost: 155, tags: ['KE','HEAT'] },
  { id: 'type90', name: 'Type 90', tab: 'TNK', nation: 'JPN', coalition: 'Red Dragons', spec: 'ARMOR', cost: 165, tags: ['KE','HEAT'] },
  { id: 'amx30b2', name: 'AMX-30 B2', tab: 'TNK', nation: 'FR', coalition: 'Eurocorps', spec: 'MECH', cost: 65, tags: ['KE','HEAT'] },

  // Infantry
  { id: 'm2brad', name: 'M2 Bradley', tab: 'INF', nation: 'USA', coalition: 'NORAD', spec: 'MECH', cost: 75, tags: ['ATGM','HE'] },
  { id: 'bmp2', name: 'BMP-2', tab: 'INF', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'MECH', cost: 50, tags: ['HE','ATGM'] },
  { id: 'motostrelki', name: 'Motostrelki', tab: 'INF', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'MOTO', cost: 15, tags: ['HE','AP'] },
  { id: 'marines', name: 'Marines', tab: 'INF', nation: 'USA', coalition: 'NORAD', spec: 'MAR', cost: 25, tags: ['HE','AP'] },

  // Helicopters
  { id: 'ah64a', name: 'AH-64A Apache', tab: 'HEL', nation: 'USA', coalition: 'NORAD', spec: 'AIR', cost: 175, tags: ['ATGM','HE','RAD'] },
  { id: 'mi24v', name: 'Mi-24V Hind', tab: 'HEL', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'AIR', cost: 80, tags: ['ATGM','HE'] },
  { id: 'mil8', name: 'Mil Mi-8', tab: 'HEL', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'AIR', cost: 30, tags: ['HE'] },
  { id: 'uh60', name: 'UH-60 Supply', tab: 'LOG', nation: 'USA', coalition: 'NORAD', spec: 'SUP', cost: 35, tags: [] },

  // AA
  { id: 'gepard', name: 'Gepard 1A2', tab: 'AA', nation: 'W.GER', coalition: 'NORTHAG', spec: 'SUP', cost: 90, tags: ['HE','RAD'] },
  { id: 'zsu234', name: 'ZSU-23-4 Shilka', tab: 'AA', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'SUP', cost: 65, tags: ['HE'] },

  // Artillery
  { id: '2s1', name: '2S1 Gvozdika', tab: 'ART', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'SUP', cost: 45, tags: ['HE','SMOKE'] },
  { id: 'm270', name: 'M270 MLRS', tab: 'ART', nation: 'USA', coalition: 'NORAD', spec: 'SUP', cost: 140, tags: ['HE','CLUS'] },
  { id: 'dana', name: 'DANA 152mm', tab: 'ART', nation: 'CZE', coalition: 'Warsaw Pact', spec: 'SUP', cost: 75, tags: ['HE','SMOKE'] },

  // Recon / support
  { id: 'hmmwv-tow', name: 'HMMWV TOW', tab: 'REC', nation: 'USA', coalition: 'NORAD', spec: 'MECH', cost: 30, tags: ['ATGM'] },

  // Planes
  { id: 'su27', name: 'Su-27', tab: 'AIR', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'AIR', cost: 190, tags: ['RAD','HE'] },
  { id: 'f16', name: 'F-16 Fighting Falcon', tab: 'AIR', nation: 'USA', coalition: 'NORAD', spec: 'AIR', cost: 150, tags: ['RAD','HE','CLUS'] },
  { id: 'su25', name: 'Su-25 Frogfoot', tab: 'AIR', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'AIR', cost: 120, tags: ['HE','CLUS'] },
  { id: 'a10', name: 'A-10 Thunderbolt', tab: 'AIR', nation: 'USA', coalition: 'NORAD', spec: 'AIR', cost: 130, tags: ['HE','KE'] },
  { id: 'mig29', name: 'MiG-29', tab: 'AIR', nation: 'E.GER', coalition: 'Warsaw Pact', spec: 'AIR', cost: 140, tags: ['RAD','HE'] },
  { id: 'mig21', name: 'MiG-21bis', tab: 'AIR', nation: 'POL', coalition: 'Warsaw Pact', spec: 'AIR', cost: 60, tags: ['HE','AP'] },
  { id: 'harrier', name: 'Harrier GR.7', tab: 'AIR', nation: 'UK', coalition: 'Commonwealth', spec: 'AIR', cost: 110, tags: ['HE','CLUS'] },

  // Logistics
  { id: 'm548', name: 'M548 Supply', tab: 'LOG', nation: 'USA', coalition: 'NORAD', spec: 'SUP', cost: 20, tags: [] },
  { id: 'gaz66', name: 'GAZ-66 Supply', tab: 'LOG', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'SUP', cost: 15, tags: [] },
  { id: 'fv432', name: 'FV432 Supply', tab: 'LOG', nation: 'UK', coalition: 'Commonwealth', spec: 'SUP', cost: 20, tags: [] },

  // Naval
  { id: 'tarantul', name: 'Tarantul II', tab: 'NAV', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'MAR', cost: 120, tags: ['HE','ATGM'] },
  { id: 'perry', name: 'O.H. Perry FFG', tab: 'NAV', nation: 'USA', coalition: 'NORAD', spec: 'MAR', cost: 180, tags: ['HE','RAD','ATGM'] },

  // More misc to fill list
  { id: 'scimitar', name: 'Scimitar', tab: 'REC', nation: 'UK', coalition: 'Commonwealth', spec: 'ARMOR', cost: 35, tags: ['AP'] },
  { id: 'luchs', name: 'Spähpanzer Luchs', tab: 'REC', nation: 'W.GER', coalition: 'NORTHAG', spec: 'MECH', cost: 30, tags: ['HE'] },
  { id: 'cv9040', name: 'CV9040', tab: 'INF', nation: 'SWE', coalition: 'Scandinavia', spec: 'MECH', cost: 80, tags: ['HE','AP'] },
  { id: 'rangers', name: 'Rangers', tab: 'INF', nation: 'USA', coalition: 'NORAD', spec: 'PARA', cost: 45, tags: ['HE','AP','ATGM'] },
  { id: 'vdv', name: 'VDV', tab: 'INF', nation: 'USSR', coalition: 'Warsaw Pact', spec: 'PARA', cost: 35, tags: ['HE','AP'] },
  { id: 'adats', name: 'ADATS', tab: 'AA', nation: 'CAN', coalition: 'Commonwealth', spec: 'SUP', cost: 110, tags: ['RAD','ATGM'] },
];

Object.assign(window, {
  ROSTER, COALITIONS, NATIONS_NATO, NATIONS_PACT, NATIONS_ASIA, ALL_NATIONS,
  SPECS, TABS, TAGS, sideOf,
});
