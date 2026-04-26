// Invented unit data for the Armory card tool.
// Values informed by the Mi-24V screenshot + WRD-style conventions.
// All stats, weapon values, and ranges are fabricated for mockup purposes.

const UNITS = {
  mi24v: {
    id: 'mi24v',
    name: 'Mi-24V Hind',
    cost: 80, // avail[vetIdx] scales with tier
    nation: 'USSR',
    tab: 'HEL',
    type: 'helicopter',
    general: {
      avail: [3, 3, 2, 2, 1],
      health: 10,
      size: 'Small',
      era: 'PRE-80',
      prototype: false,
      command: false,
    },
    mobility: {
      speed: 310, // km/h
      autonomy: 2800, // s
      fuel: 1500, // L
    },
    optics: { stealth: 1, optics: 2, airStealth: 1, airOptics: 2 },
    armor: { front: 3, side: 3, rear: 2, top: 2 },
    weapons: [
      {
        name: '9M114 Shturm',
        type: 'ATGM',
        tags: ['SA'],
        apKind: 'HEAT',
        he: 0, ap: 20, supp: 350, acc: 60, stab: null,
        rngGroundMin: 500, rngGround: 2975, ammo: 8,
        shot: 3.0, salvo: 2, salvoLen: 4.0, rload: 25, salvoRload: 1.5, noise: 1.1,
        spd: 1400, accel: 700,
      },
      {
        name: 'YaK-B 12.7mm',
        type: 'HE',
        he: 2, ap: 2, apKind: 'KE', supp: 55, acc: 40, stab: 40,
        rngGround: 1575, rngHeli: 1575, ammo: 1470,
        shot: 1.0, salvo: 10, salvoLen: 2.0, rload: 3, salvoRload: 0.1, noise: 1.5,
      },
    ],
  },
  strv103c: {
    id: 'strv103c',
    name: 'Strv 103C',
    cost: 125,
    nation: 'SWE',
    tab: 'TNK',
    type: 'vehicle',
    general: {
      avail: [4, 4, 3, 2, 1],
      health: 10,
      size: 'Medium',
      era: 'PRE-80',
      prototype: false,
      command: false,
    },
    mobility: {
      speed: 50,
      forest: 35,
      road: 90,
      autonomy: 560,
      fuel: 820,
      amphibious: true,
      swim: 25,
    },
    optics: { stealth: 1, optics: 2 },
    armor: { front: 17, side: 4, rear: 3, top: 2 },
    weapons: [
      {
        name: 'Strv 103 105mm',
        type: 'AP',
        tags: ['AL'],
        apKind: 'KE',
        he: 4, ap: 20, supp: 420, acc: 60, stab: null,
        rngGround: 2100, ammo: 50,
        shot: 3.5, salvo: 1, salvoLen: 0, rload: 6, salvoRload: 0, noise: 3.0,
      },
      {
        name: 'Ksp m/58 7.62mm',
        type: 'HE',
        he: 1, ap: 0, supp: 30, acc: 35, stab: null,
        rngGround: 850, ammo: 1200,
        shot: 0.8, salvo: 8, salvoLen: 1.5, rload: 4, salvoRload: 0.4, noise: 0.8,
      },
    ],
  },
  motostrelki: {
    id: 'motostrelki',
    name: 'Motostrelki',
    cost: 15,
    nation: 'USSR',
    tab: 'INF',
    type: 'infantry',
    general: {
      avail: [16, 16, 12, 8, 4],
      health: 10,
      size: 'Very Small',
      training: 'Regular',
      era: 'PRE-80',
    },
    mobility: { speed: 20 },
    optics: { stealth: 2, optics: 1, airOptics: 0 },
    weapons: [
      {
        name: 'AK-74',
        type: 'HE',
        tags: ['SA'],
        he: 1, ap: 0, supp: 22, acc: 30, stab: null,
        rngGround: 400, ammo: 240,
        shot: 0.3, salvo: 30, salvoLen: 3.0, rload: 2, salvoRload: 0.1, noise: 0.5,
      },
      {
        name: 'RPG-16',
        type: 'AP',
        apKind: 'HEAT',
        he: 3, ap: 14, supp: 180, acc: 40, stab: null,
        rngGround: 600, ammo: 4,
        shot: 3.0, salvo: 1, salvoLen: 0, rload: 6, salvoRload: 0, noise: 1.8,
      },
    ],
  },
  su25: {
    id: 'su25',
    name: 'Su-25 Frogfoot',
    cost: 120,
    nation: 'USSR',
    tab: 'PLA',
    type: 'plane',
    general: {
      avail: [3, 3, 2, 2, 1],
      health: 10,
      size: 'Medium',
      ecm: 20,
      era: 'PRE-80',
    },
    mobility: {
      speed: 950,
      autonomy: 900,
      fuel: 3600,
      altitude: 4200,
      turnRadius: 550,
    },
    optics: { airStealth: 2, airOptics: 3 },
    armor: { front: 2, side: 1, rear: 1, top: 0 },
    weapons: [
      {
        name: 'GSh-30-2',
        type: 'HE',
        he: 3, ap: 4, apKind: 'KE', supp: 180, acc: 50, stab: null,
        rngGround: 1750, ammo: 250,
        shot: 1.2, salvo: 20, salvoLen: 2.5, rload: 0, salvoRload: 0.1, noise: 2.0,
      },
      {
        name: 'S-24 × 4',
        type: 'ATGM',
        tags: ['SA'],
        apKind: 'HEAT',
        he: 0, ap: 6, supp: 900, acc: 30, stab: null,
        rngGroundMin: 300, rngGround: 2400, ammo: 4,
        shot: 1.0, salvo: 1, salvoLen: 0, rload: 0, salvoRload: 0, noise: 4.0,
        spd: 1800, accel: 900,
      },
      {
        name: 'FAB-500 × 4',
        type: 'BOMB',
        he: 12, ap: 0, supp: 1400, acc: 55, stab: null,
        rngGround: 800, ammo: 4,
        shot: 2.0, salvo: 1, salvoLen: 0, rload: 0, salvoRload: 0, noise: 5.5,
      },
    ],
  },
};

// Veterancy tiers. Accuracy modifier per tier is a flat additive %.
const VET_TIERS = [
  { id: 'RKI', label: 'RKI', accMod: -15, availMul: 1.0 },
  { id: 'TRN', label: 'TRN', accMod: 0,   availMul: 1.0 },
  { id: 'HRD', label: 'HRD', accMod: +10, availMul: 1.0 },
  { id: 'VET', label: 'VET', accMod: +20, availMul: 1.0 },
  { id: 'ELI', label: 'ELI', accMod: +30, availMul: 1.0 },
];

// Small helpers for consistent formatting across variations.
const fmt = {
  acc: (v, mod) => v == null ? '—' : Math.max(0, Math.min(100, v + (mod||0))) + '%',
  pct: v => v == null ? '—' : v + '%',
  km:  v => v == null ? '—' : v + ' km/h',
  m:   v => v == null ? '—' : v + 'm',
  mL:  v => v == null ? '—' : v + ' m',
  s:   v => v == null ? '—' : v + 's',
  L:   v => v == null ? '—' : v + ' L',
  sec: v => v == null ? '—' : v + ' s',
  int: v => v == null ? '—' : String(v),
};

Object.assign(window, { UNITS, VET_TIERS, fmt });
