// Weapon picker helpers
const pw  = (unit, pred) => unit.weapons?.find(pred) ?? null;
const wf  = (w, key)     => w?.[key] ?? null;
const top = (unit, pred, sortKey) => {
  const matches = unit.weapons?.filter(pred) ?? [];
  return matches.sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0))[0] ?? null;
};

// Leading columns shared by all unit-based datasets
const N = [
  { key: 'name',   label: 'NAME',   type: 'text',   width: 220, heat: null },
  { key: 'nation', label: 'NATION', type: 'nation', width: 100, heat: null },
  { key: 'cost',   label: 'COST',   type: 'num',    width: 65,  heat: 'low' },
];

export const DATASETS = {

  // ── SPAAG ──────────────────────────────────────────────────────────────────
  spaags: {
    label: 'SPAAG',
    file: 'spaags.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'aim',      label: 'AIM',       type: 'num', width: 65,  heat: 'low'  },
      { key: 'he',       label: 'HE',        type: 'num', width: 65,  heat: 'high' },
      { key: 'planeRng', label: 'PLANE RNG', type: 'num', width: 105, heat: 'high' },
      { key: 'heloRng',  label: 'HELO RNG',  type: 'num', width: 100, heat: 'high' },
      { key: 'acc',      label: 'ACC',       type: 'pct', width: 65,  heat: 'high' },
      { key: 'stab',     label: 'STAB',      type: 'pct', width: 65,  heat: 'high' },
      { key: 'shot',     label: 'SHOT',      type: 'num', width: 65,  heat: 'low'  },
      { key: 'salvo',    label: 'SALVO RLD', type: 'num', width: 90,  heat: 'low'  },
      { key: 'salvoLen', label: 'SALVO LEN', type: 'num', width: 90,  heat: 'high' },
      { key: 'armor',    label: 'ARMOR',     type: 'num', width: 70,  heat: 'high' },
      { key: 'speed',    label: 'SPEED',     type: 'num', width: 70,  heat: 'high' },
      { key: 'radar',    label: 'RADAR',     type: 'bool', width: 65,  heat: null   },
      { key: 'samHelo',  label: 'SAM HELO',  type: 'num',  width: 100, heat: 'high' },
      { key: 'samPlane', label: 'SAM PLANE', type: 'num',  width: 100, heat: 'high' },
      { key: 'samAcc',   label: 'SAM ACC',   type: 'pct',  width: 80,  heat: 'high' },
      { key: 'samStab',  label: 'SAM STAB',  type: 'pct',  width: 80,  heat: 'high' },
    ],
    transform(u) {
      // RAD-tagged missiles are radar-tracked guns (Gepard, Tunguska gun barrels, etc.)
      const gun = pw(u, w => (w.category === 'Gun' || (w.category === 'Missile' && w.tag?.includes('RAD'))) && (w.rng_a ?? 0) > 0);
      const sam = pw(u, w => w.category === 'Missile' && (w.tag?.includes('FnF') || w.tag?.includes('GUID')) && (w.rng_a ?? 0) > 0);
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        aim:      wf(gun, 'aimTime'),
        he:       wf(gun, 'dmg'),
        planeRng: wf(gun, 'rng_a'),
        heloRng:  wf(gun, 'rng_h'),
        acc:      wf(gun, 'acc'),
        stab:     wf(gun, 'stab'),
        shot:     wf(gun, 'shotReload'),
        salvo:    wf(gun, 'salvoReload'),
        salvoLen: wf(gun, 'salvoLen'),
        armor:    u.armor?.F ?? null,
        speed:    u.speed ?? null,
        radar:    u.weapons?.some(w => w.tag?.includes('RAD')) ?? false,
        samHelo:  wf(sam, 'rng_h'),
        samPlane: wf(sam, 'rng_a'),
        samAcc:   wf(sam, 'acc'),
        samStab:  wf(sam, 'stab'),
      };
    },
  },

  // ── Superheavy ─────────────────────────────────────────────────────────────
  superheavies: {
    label: 'Superheavy',
    file: 'superheavies.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'health', label: 'HP',     type: 'num', width: 65,  heat: 'high' },
      { key: 'armorF', label: 'F',      type: 'num', width: 55,  heat: 'high' },
      { key: 'armorS', label: 'S',      type: 'num', width: 55,  heat: 'high' },
      { key: 'armorR', label: 'R',      type: 'num', width: 55,  heat: 'high' },
      { key: 'armorT', label: 'T',      type: 'num', width: 55,  heat: 'high' },
      { key: 'speed',  label: 'SPEED',  type: 'num', width: 70,  heat: 'high' },
      { key: 'ap',     label: 'AP',     type: 'num', width: 65,  heat: 'high' },
      { key: 'he',     label: 'HE',     type: 'num', width: 65,  heat: 'high' },
      { key: 'rng',    label: 'RNG',    type: 'num', width: 90,  heat: 'high' },
      { key: 'acc',    label: 'ACC',    type: 'pct', width: 65,  heat: 'high' },
      { key: 'stab',   label: 'STAB',   type: 'pct', width: 65,  heat: 'high' },
    ],
    transform(u) {
      const gun = top(u, w => w.category === 'Gun', 'ap');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        health: u.health ?? null,
        armorF: u.armor?.F ?? null,
        armorS: u.armor?.S ?? null,
        armorR: u.armor?.R ?? null,
        armorT: u.armor?.T ?? null,
        speed:  u.speed ?? null,
        ap:     wf(gun, 'ap'),
        he:     wf(gun, 'dmg'),
        rng:    wf(gun, 'rng_g'),
        acc:    wf(gun, 'acc'),
        stab:   wf(gun, 'stab'),
      };
    },
  },

  // ── Tube Artillery ─────────────────────────────────────────────────────────
  tubearty: {
    label: 'Tube Artillery',
    file: 'tubearty.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'dmg',         label: 'HE',         type: 'num', width: 65,  heat: 'high' },
      { key: 'suppress',    label: 'SUPP',        type: 'num', width: 65,  heat: 'high' },
      { key: 'aim',         label: 'AIM',         type: 'num', width: 65,  heat: 'low'  },
      { key: 'salvoLen',    label: 'SALVO LEN',   type: 'num', width: 90,  heat: 'high' },
      { key: 'shot',        label: 'SHOT RLD',    type: 'num', width: 80,  heat: 'low'  },
      { key: 'salvo',       label: 'SALVO RLD',   type: 'num', width: 90,  heat: 'low'  },
      { key: 'supplyShot',  label: 'SUP/SHOT',    type: 'num', width: 85,  heat: 'low'  },
      { key: 'supplySalvo', label: 'SUP/SALVO',   type: 'num', width: 95,  heat: 'low'  },
      { key: 'rng',         label: 'MAX RNG',     type: 'num', width: 90,  heat: 'high' },
      { key: 'minDisp',     label: 'MIN DISP',    type: 'num', width: 85,  heat: 'low'  },
      { key: 'maxDisp',     label: 'MAX DISP',    type: 'num', width: 85,  heat: 'low'  },
    ],
    transform(u) {
      const art = top(u, w => w.category === 'Artillery' && !(w.ap ?? 0) && !w.tag?.includes('NPLM'), 'rng_g');
      const supplyPerShot = wf(art, 'supplyPerShot');
      const salvoLen      = wf(art, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        dmg:         wf(art, 'dmg'),
        suppress:    wf(art, 'suppress'),
        aim:         wf(art, 'aimTime'),
        salvoLen,
        shot:        wf(art, 'shotReload'),
        salvo:       wf(art, 'salvoReload'),
        supplyShot:  supplyPerShot,
        supplySalvo: (supplyPerShot != null && salvoLen != null) ? Math.round(supplyPerShot * salvoLen) : null,
        rng:         wf(art, 'maxRange'),
        minDisp:     wf(art, 'dispersionMin'),
        maxDisp:     wf(art, 'dispersion'),
      };
    },
  },

  // ── HE MLRS ────────────────────────────────────────────────────────────────
  hemlrs: {
    label: 'HE MLRS',
    file: 'hemlrs.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'dmg',         label: 'HE',          type: 'num', width: 65,  heat: 'high' },
      { key: 'dmgRadius',   label: 'HE RAD',      type: 'num', width: 75,  heat: 'high' },
      { key: 'suppress',    label: 'SUPP',        type: 'num', width: 65,  heat: 'high' },
      { key: 'suppRadius',  label: 'SUPP RAD',    type: 'num', width: 85,  heat: 'high' },
      { key: 'aim',         label: 'AIM',         type: 'num', width: 65,  heat: 'low'  },
      { key: 'shot',        label: 'SHOT RLD',    type: 'num', width: 80,  heat: 'low'  },
      { key: 'salvoLen',    label: 'SALVO LEN',   type: 'num', width: 90,  heat: 'high' },
      { key: 'salvo',       label: 'SALVO RLD',   type: 'num', width: 90,  heat: 'low'  },
      { key: 'supplySalvo', label: 'SUP/SALVO',   type: 'num', width: 95,  heat: 'low'  },
      { key: 'minRng',      label: 'MIN RNG',     type: 'num', width: 80,  heat: null   },
      { key: 'rng',         label: 'MAX RNG',     type: 'num', width: 80,  heat: 'high' },
    ],
    transform(u) {
      // include NPLM so TOS-1 Buratino (thermobaric) shows stats
      const art = top(u, w => w.category === 'Artillery' && !(w.ap ?? 0), 'dmg');
      const supplyPerShot = wf(art, 'supplyPerShot');
      const salvoLen      = wf(art, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        dmg:         wf(art, 'dmg'),
        dmgRadius:   wf(art, 'dmgRadius'),
        suppress:    wf(art, 'suppress'),
        suppRadius:  wf(art, 'suppRadius'),
        aim:         wf(art, 'aimTime'),
        shot:        wf(art, 'shotReload'),
        salvoLen,
        salvo:       wf(art, 'salvoReload'),
        supplySalvo: (supplyPerShot != null && salvoLen != null) ? Math.round(supplyPerShot * salvoLen) : null,
        minRng:      wf(art, 'minRange'),
        rng:         wf(art, 'maxRange'),
      };
    },
  },

  // ── Cluster MLRS ───────────────────────────────────────────────────────────
  clustermlrs: {
    label: 'Cluster MLRS',
    file: 'clustermlrs.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'ap',          label: 'AP',          type: 'num', width: 65,  heat: 'high' },
      { key: 'dmgRadius',   label: 'DMG RAD',     type: 'num', width: 85,  heat: 'high' },
      { key: 'aim',         label: 'AIM',         type: 'num', width: 65,  heat: 'low'  },
      { key: 'shot',        label: 'SHOT RLD',    type: 'num', width: 80,  heat: 'low'  },
      { key: 'salvoLen',    label: 'SALVO LEN',   type: 'num', width: 90,  heat: 'high' },
      { key: 'salvo',       label: 'SALVO RLD',   type: 'num', width: 90,  heat: 'low'  },
      { key: 'supplySalvo', label: 'SUP/SALVO',   type: 'num', width: 95,  heat: 'low'  },
      { key: 'minRng',      label: 'MIN RNG',     type: 'num', width: 80,  heat: null   },
      { key: 'rng',         label: 'MAX RNG',     type: 'num', width: 80,  heat: 'high' },
    ],
    transform(u) {
      const art = top(u, w => w.category === 'Artillery' && (w.ap ?? 0) > 0, 'ap');
      const supplyPerShot = wf(art, 'supplyPerShot');
      const salvoLen      = wf(art, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        ap:          wf(art, 'ap'),
        dmgRadius:   wf(art, 'dmgRadius'),
        aim:         wf(art, 'aimTime'),
        shot:        wf(art, 'shotReload'),
        salvoLen,
        salvo:       wf(art, 'salvoReload'),
        supplySalvo: (supplyPerShot != null && salvoLen != null) ? Math.round(supplyPerShot * salvoLen) : null,
        minRng:      wf(art, 'minRange'),
        rng:         wf(art, 'maxRange'),
      };
    },
  },

  // ── Napalm MLRS ────────────────────────────────────────────────────────────
  napalmmlrs: {
    label: 'Napalm MLRS',
    file: 'napalmmlrs.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'dmg',         label: 'HE',          type: 'num', width: 65,  heat: 'high' },
      { key: 'dmgRadius',   label: 'DMG RAD',     type: 'num', width: 85,  heat: 'high' },
      { key: 'aim',         label: 'AIM',         type: 'num', width: 65,  heat: 'low'  },
      { key: 'shot',        label: 'SHOT RLD',    type: 'num', width: 80,  heat: 'low'  },
      { key: 'salvoLen',    label: 'SALVO LEN',   type: 'num', width: 90,  heat: 'high' },
      { key: 'salvo',       label: 'SALVO RLD',   type: 'num', width: 90,  heat: 'low'  },
      { key: 'supplySalvo', label: 'SUP/SALVO',   type: 'num', width: 95,  heat: 'low'  },
      { key: 'minRng',      label: 'MIN RNG',     type: 'num', width: 80,  heat: null   },
      { key: 'rng',         label: 'MAX RNG',     type: 'num', width: 80,  heat: 'high' },
    ],
    transform(u) {
      const art = pw(u, w => w.category === 'Artillery' && w.tag?.includes('NPLM'));
      const supplyPerShot = wf(art, 'supplyPerShot');
      const salvoLen      = wf(art, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        dmg:         wf(art, 'dmg'),
        dmgRadius:   wf(art, 'dmgRadius'),
        aim:         wf(art, 'aimTime'),
        shot:        wf(art, 'shotReload'),
        salvoLen,
        salvo:       wf(art, 'salvoReload'),
        supplySalvo: (supplyPerShot != null && salvoLen != null) ? Math.round(supplyPerShot * salvoLen) : null,
        minRng:      wf(art, 'minRange'),
        rng:         wf(art, 'maxRange'),
      };
    },
  },

  // ── Plane Missile AA ───────────────────────────────────────────────────────
  planemissileaa: {
    label: 'Plane Missile AA',
    file: 'planemissileaa.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'planeRng', label: 'PLANE RNG', type: 'num',  width: 105, heat: 'high' },
      { key: 'heloRng',  label: 'HELO RNG',  type: 'num',  width: 100, heat: 'high' },
      { key: 'dmg',      label: 'DMG',       type: 'num',  width: 65,  heat: 'high' },
      { key: 'salvoLen', label: 'SALVO LEN', type: 'num',  width: 90,  heat: 'high' },
      { key: 'radar',    label: 'RADAR',     type: 'bool',       width: 65,  heat: null   },
      { key: 'acc',      label: 'ACC',       type: 'pct',        width: 65,  heat: 'high' },
      { key: 'speed',    label: 'SPEED',     type: 'num',        width: 70,  heat: 'high' },
      { key: 'armorT',   label: 'TOP ARM',   type: 'num',        width: 80,  heat: 'high' },
      { key: 'proto',    label: 'PROTO',     type: 'bool-plain', width: 65,  heat: null   },
    ],
    transform(u) {
      const m = top(u, w => w.category === 'Missile' && (w.rng_a ?? 0) >= 3150, 'rng_a');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        planeRng: wf(m, 'rng_a'),
        heloRng:  wf(m, 'rng_h'),
        dmg:      wf(m, 'dmg'),
        salvoLen: wf(m, 'salvoLen'),
        radar:    u.weapons?.some(w => w.tag?.includes('RAD')) ?? false,
        acc:      wf(m, 'acc'),
        speed:    u.speed ?? null,
        armorT:   u.armor?.T ?? null,
        proto:    u.prototype ?? false,
      };
    },
  },

  // ── Helo Missile AA ────────────────────────────────────────────────────────
  helomissileaa: {
    label: 'Helo Missile AA',
    file: 'helomissileaa.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'heloRng',  label: 'HELO RNG',  type: 'num',  width: 100, heat: 'high' },
      { key: 'planeRng', label: 'PLANE RNG', type: 'num',  width: 105, heat: 'high' },
      { key: 'dmg',      label: 'DMG',       type: 'num',  width: 65,  heat: 'high' },
      { key: 'salvoLen', label: 'SALVO LEN', type: 'num',  width: 90,  heat: 'high' },
      { key: 'radar',    label: 'RADAR',     type: 'bool', width: 65,  heat: null   },
      { key: 'acc',      label: 'ACC',       type: 'pct',  width: 65,  heat: 'high' },
      { key: 'stab',     label: 'STAB',      type: 'pct',  width: 65,  heat: 'high' },
      { key: 'mspd',     label: 'MS SPD',    type: 'num',  width: 80,  heat: 'high' },
      { key: 'speed',    label: 'SPEED',     type: 'num',  width: 70,  heat: 'high' },
    ],
    transform(u) {
      // exclude dmg=1 guns (SPAAG guns that appear in this file as secondary weapons)
      const m = top(u, w => w.category === 'Missile' && (w.rng_a ?? 0) > 0 && (w.dmg ?? 0) > 1, 'rng_a');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        heloRng:  wf(m, 'rng_h'),
        planeRng: wf(m, 'rng_a'),
        dmg:      wf(m, 'dmg'),
        salvoLen: wf(m, 'salvoLen'),
        radar:    u.weapons?.some(w => w.tag?.includes('RAD')) ?? false,
        acc:      wf(m, 'acc'),
        stab:     wf(m, 'stab'),
        mspd:     wf(m, 'missileSpeed'),
        speed:    u.speed ?? null,
      };
    },
  },

  // ── Manpad ─────────────────────────────────────────────────────────────────
  manpads: {
    label: 'Manpad',
    file: 'manpads.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'health',   label: 'HP',        type: 'num', width: 55,  heat: 'high' },
      { key: 'training', label: 'TRAINING',  type: 'num', width: 85,  heat: 'high' },
      { key: 'heloRng',  label: 'HELO RNG',  type: 'num', width: 100, heat: 'high' },
      { key: 'planeRng', label: 'PLANE RNG', type: 'num', width: 105, heat: 'high' },
      { key: 'dmg',      label: 'DMG',       type: 'num', width: 65,  heat: 'high' },
      { key: 'acc',      label: 'ACC',       type: 'pct', width: 65,  heat: 'high' },
      { key: 'reload',   label: 'RELOAD',    type: 'num', width: 75,  heat: 'low'  },
    ],
    transform(u) {
      const m = top(u, w => w.category === 'Missile' && (w.rng_a ?? 0) > 0, 'rng_a');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        health:   u.health ?? null,
        training: u.training ?? null,
        heloRng:  wf(m, 'rng_h'),
        planeRng: wf(m, 'rng_a'),
        dmg:      wf(m, 'dmg'),
        acc:      wf(m, 'acc'),
        reload:   wf(m, 'salvoReload'),
      };
    },
  },

  // ── AA Helo ────────────────────────────────────────────────────────────────
  aahelos: {
    label: 'AA Helo',
    file: 'aahelos.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'health',   label: 'HP',        type: 'num', width: 55,  heat: 'high' },
      { key: 'heloRng',  label: 'HELO RNG',  type: 'num', width: 100, heat: 'high' },
      { key: 'planeRng', label: 'PLANE RNG', type: 'num', width: 105, heat: 'high' },
      { key: 'dmg',      label: 'DMG',       type: 'num', width: 65,  heat: 'high' },
      { key: 'ammo',     label: 'AMMO',      type: 'num', width: 65,  heat: 'high' },
      { key: 'acc',      label: 'ACC',       type: 'pct', width: 65,  heat: 'high' },
      { key: 'optics',   label: 'GND OPT',   type: 'num', width: 75,  heat: 'high' },
      { key: 'stealth',  label: 'STEALTH',   type: 'num', width: 75,  heat: 'high' },
      { key: 'size',     label: 'SIZE',      type: 'num', width: 65,  heat: 'low'  },
      { key: 'speed',    label: 'SPEED',     type: 'num', width: 70,  heat: 'high' },
    ],
    transform(u) {
      const m = top(u, w => w.category === 'Missile' && (w.rng_a ?? 0) > 0, 'rng_a');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        health:   u.health ?? null,
        heloRng:  wf(m, 'rng_h'),
        planeRng: wf(m, 'rng_a'),
        dmg:      wf(m, 'dmg'),
        ammo:     wf(m, 'ammo'),
        acc:      wf(m, 'acc'),
        optics:   u.optics ?? null,
        stealth:  u.stealth ?? null,
        size:     u.size ?? null,
        speed:    u.speed ?? null,
      };
    },
  },

  // ── Rocket Pod Helo ────────────────────────────────────────────────────────
  rocketpodhelos: {
    label: 'Rocket Pod Helo',
    file: 'rocketpodhelos.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'health',   label: 'HP',        type: 'num', width: 65,  heat: 'high' },
      { key: 'rng',      label: 'RNG',       type: 'num', width: 90,  heat: 'high' },
      { key: 'dmg',      label: 'DMG',       type: 'num', width: 65,  heat: 'high' },
      { key: 'salvoLen', label: 'SALVO LEN', type: 'num', width: 90,  heat: 'high' },
      { key: 'acc',      label: 'ACC',       type: 'pct', width: 65,  heat: 'high' },
      { key: 'speed',    label: 'SPEED',     type: 'num', width: 70,  heat: 'high' },
    ],
    transform(u) {
      const gun = top(u, w => w.category === 'Gun' && (w.rng_g ?? 0) >= 2100, 'rng_g');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        health:   u.health ?? null,
        rng:      wf(gun, 'rng_g'),
        dmg:      wf(gun, 'dmg'),
        salvoLen: wf(gun, 'salvoLen'),
        acc:      wf(gun, 'acc'),
        speed:    u.speed ?? null,
      };
    },
  },

  // ── HE Bomber ──────────────────────────────────────────────────────────────
  hebomber: {
    label: 'HE Bomber',
    file: 'hebomber.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'health',    label: 'HP',        type: 'num',       width: 55,  heat: 'high' },
      { key: 'ecm',       label: 'ECM',       type: 'pct',       width: 65,  heat: 'high' },
      { key: 'armorF',    label: 'F ARM',     type: 'num',       width: 65,  heat: 'high' },
      { key: 'dmg',       label: 'HE',        type: 'num',       width: 65,  heat: 'high' },
      { key: 'dmgRadius', label: 'DMG RAD',   type: 'num',       width: 85,  heat: 'high' },
      { key: 'acc',       label: 'ACC',       type: 'pct',       width: 65,  heat: 'high' },
      { key: 'ammo',      label: 'AMMO',      type: 'num',      width: 65,  heat: 'high' },
      { key: 'nplm',      label: 'NPLM',      type: 'bool-good',width: 60,  heat: null   },
      { key: 'lgb',       label: 'LGB',       type: 'bool-good',width: 55,  heat: null   },
      { key: 'rearm',     label: 'REARM',     type: 'num',      width: 70,  heat: 'low'  },
      { key: 'speed',     label: 'SPEED',     type: 'num',      width: 70,  heat: 'high' },
      { key: 'autonomy',  label: 'AUTONOMY',  type: 'num',      width: 85,  heat: 'high' },
    ],
    transform(u) {
      const bomb = top(u, w => w.category === 'Bomb' && !(w.ap ?? 0), 'dmg');
      const rearmTime = wf(bomb, 'rearmTime');
      const salvoLen  = wf(bomb, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        health:    u.health ?? null,
        ecm:       u.ecm ?? 0,
        armorF:    u.armor?.F ?? null,
        dmg:       wf(bomb, 'dmg'),
        dmgRadius: wf(bomb, 'dmgRadius'),
        acc:       wf(bomb, 'acc'),
        ammo:      wf(bomb, 'ammo'),
        nplm:      bomb?.tag?.includes('NPLM') ?? false,
        lgb:       bomb?.tag?.includes('LGB')  ?? false,
        rearm:     (rearmTime != null && salvoLen != null) ? Math.round(rearmTime * salvoLen) : null,
        speed:     u.speed ?? null,
        autonomy:  u.autonomy ?? null,
      };
    },
  },

  // ── Cluster Bomber ─────────────────────────────────────────────────────────
  clusterbombers: {
    label: 'Cluster Bomber',
    file: 'clusterbombers.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'ecm',       label: 'ECM',       type: 'pct',       width: 65,  heat: 'high' },
      { key: 'ap',        label: 'AP',        type: 'num',       width: 65,  heat: 'high' },
      { key: 'dmgRadius', label: 'DMG RAD',   type: 'num',       width: 85,  heat: 'high' },
      { key: 'acc',       label: 'ACC',       type: 'pct',       width: 65,  heat: 'high' },
      { key: 'salvoLen',  label: 'SALVO LEN', type: 'num',       width: 90,  heat: 'high' },
      { key: 'rearm',     label: 'REARM',     type: 'num',       width: 70,  heat: 'low'  },
      { key: 'speed',     label: 'SPEED',     type: 'num',       width: 70,  heat: 'high' },
      { key: 'autonomy',  label: 'AUTONOMY',  type: 'num',       width: 85,  heat: 'high' },
    ],
    transform(u) {
      const bomb = top(u, w => w.category === 'Bomb' && (w.ap ?? 0) > 0, 'ap');
      const rearmTime = wf(bomb, 'rearmTime');
      const salvoLen  = wf(bomb, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        ecm:       u.ecm ?? 0,
        ap:        wf(bomb, 'ap'),
        dmgRadius: wf(bomb, 'dmgRadius'),
        acc:       wf(bomb, 'acc'),
        salvoLen,
        rearm:     (rearmTime != null && salvoLen != null) ? Math.round(rearmTime * salvoLen) : null,
        speed:     u.speed ?? null,
        autonomy:  u.autonomy ?? null,
      };
    },
  },

  // ── Napalm Bomber ──────────────────────────────────────────────────────────
  naplmbombers: {
    label: 'Napalm Bomber',
    file: 'naplmbombers.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'ecm',       label: 'ECM',       type: 'pct',        width: 65,  heat: 'high' },
      { key: 'dmg',       label: 'HE',        type: 'num',        width: 65,  heat: 'high' },
      { key: 'dmgRadius', label: 'DMG RAD',   type: 'num',        width: 85,  heat: 'high' },
      { key: 'acc',       label: 'ACC',       type: 'pct',        width: 65,  heat: 'high' },
      { key: 'salvoLen',  label: 'SALVO LEN', type: 'num',        width: 90,  heat: 'high' },
      { key: 'ammo',      label: 'AMMO',      type: 'num',        width: 65,  heat: 'high' },
      { key: 'rearm',     label: 'REARM',     type: 'num',        width: 70,  heat: 'low'  },
      { key: 'speed',     label: 'SPEED',     type: 'num',        width: 70,  heat: 'high' },
      { key: 'autonomy',  label: 'AUTONOMY',  type: 'num',        width: 85,  heat: 'high' },
    ],
    transform(u) {
      const bomb = top(u, w => w.tag?.includes('NPLM'), 'dmg');
      const rearmTime = wf(bomb, 'rearmTime');
      const salvoLen  = wf(bomb, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        ecm:       u.ecm ?? 0,
        dmg:       wf(bomb, 'dmg'),
        dmgRadius: wf(bomb, 'dmgRadius'),
        acc:       wf(bomb, 'acc'),
        salvoLen,
        ammo:      wf(bomb, 'ammo'),
        rearm:     (rearmTime != null && salvoLen != null) ? Math.round(rearmTime * salvoLen) : null,
        speed:     u.speed ?? null,
        autonomy:  u.autonomy ?? null,
      };
    },
  },

  // ── ASF ────────────────────────────────────────────────────────────────────
  asfs: {
    label: 'ASF',
    file: 'asfs.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'ecm',      label: 'ECM',        type: 'pct',       width: 65,  heat: 'high' },
      { key: 'optics',   label: 'AIR OPT',    type: 'num',       width: 75,  heat: 'high' },
      { key: 'vet',      label: 'VET',        type: 'text',      width: 90,  heat: null   },
      { key: 'm1Plane',  label: 'M1 PLANE',   type: 'num',       width: 85,  heat: 'high' },
      { key: 'm1Helo',   label: 'M1 HELO',    type: 'num',       width: 80,  heat: 'high' },
      { key: 'm1Acc',    label: 'M1 ACC',     type: 'pct',       width: 70,  heat: 'high' },
      { key: 'm1He',     label: 'M1 HE',      type: 'num',       width: 65,  heat: 'high' },
      { key: 'm1Rld',    label: 'M1 RLD',     type: 'num',       width: 70,  heat: 'low'  },
      { key: 'm1Fnf',    label: 'M1 F&F',     type: 'bool-good', width: 65,  heat: null   },
      { key: 'm2Plane',  label: 'M2 PLANE',   type: 'num',       width: 85,  heat: 'high' },
      { key: 'm2Helo',   label: 'M2 HELO',    type: 'num',       width: 80,  heat: 'high' },
      { key: 'm2Acc',    label: 'M2 ACC',     type: 'pct',       width: 70,  heat: 'high' },
      { key: 'm2He',     label: 'M2 HE',      type: 'num',       width: 65,  heat: 'high' },
      { key: 'm2Rld',    label: 'M2 RLD',     type: 'num',       width: 70,  heat: 'low'  },
      { key: 'm2Fnf',    label: 'M2 F&F',     type: 'bool-good', width: 65,  heat: null   },
      { key: 'gunAcc',   label: 'GUN ACC',    type: 'pct',       width: 75,  heat: 'high' },
      { key: 'gunRld',   label: 'GUN RLD',    type: 'num',       width: 70,  heat: 'low'  },
      { key: 'speed',    label: 'SPEED',      type: 'num',       width: 70,  heat: 'high' },
      { key: 'autonomy', label: 'AUTONOMY',   type: 'num',       width: 85,  heat: 'high' },
      { key: 'stealth',  label: 'STEALTH',    type: 'num',       width: 75,  heat: 'high' },
    ],
    transform(u) {
      const missiles = (u.weapons ?? [])
        .filter(w => w.category === 'Missile' && (w.rng_a ?? 0) > 0)
        .sort((a, b) => (b.rng_a ?? 0) - (a.rng_a ?? 0));
      const m1  = missiles[0] ?? null;
      const m2  = missiles[1] ?? null;
      const gun = pw(u, w => w.category === 'Gun');
      const vetLabels = ['Beginner', 'Trained', 'Hardened', 'Veteran', 'Elite'];
      const avail = u.avail ?? [];
      let vet = null;
      for (let i = 4; i >= 0; i--) { if ((avail[i] ?? 0) > 0) { vet = vetLabels[i]; break; } }
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        ecm:     u.ecm ?? 0,
        optics:  u.airOptics ?? null,
        vet,
        m1Plane: wf(m1, 'rng_a'),
        m1Helo:  wf(m1, 'rng_h'),
        m1Acc:   wf(m1, 'acc'),
        m1He:    wf(m1, 'dmg'),
        m1Rld:   (wf(m1, 'rearmTime') != null && wf(m1, 'salvoLen') != null) ? Math.round(wf(m1, 'rearmTime') * wf(m1, 'salvoLen')) : null,
        m1Fnf:   m1?.tag?.includes('FnF') ?? false,
        m2Plane: wf(m2, 'rng_a'),
        m2Helo:  wf(m2, 'rng_h'),
        m2Acc:   wf(m2, 'acc'),
        m2He:    wf(m2, 'dmg'),
        m2Rld:   (wf(m2, 'rearmTime') != null && wf(m2, 'salvoLen') != null) ? Math.round(wf(m2, 'rearmTime') * wf(m2, 'salvoLen')) : null,
        m2Fnf:   m2?.tag?.includes('FnF') ?? false,
        gunAcc:  wf(gun, 'acc'),
        gunRld:  wf(gun, 'shotReload'),
        speed:    u.speed ?? null,
        autonomy: u.autonomy ?? null,
        stealth:  u.airStealth ?? null,
      };
    },
  },

  // ── ATGM Plane ─────────────────────────────────────────────────────────────
  atgmplanes: {
    label: 'ATGM Plane',
    file: 'atgmplanes.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'ecm',      label: 'ECM',       type: 'pct',       width: 65,  heat: 'high' },
      { key: 'armorF',   label: 'F ARM',     type: 'num',       width: 65,  heat: 'high' },
      { key: 'armorR',   label: 'R ARM',     type: 'num',       width: 65,  heat: 'high' },
      { key: 'ap',       label: 'AP',        type: 'num',       width: 65,  heat: 'high' },
      { key: 'rng',      label: 'GND RNG',   type: 'num',       width: 85,  heat: 'high' },
      { key: 'acc',      label: 'ACC',       type: 'pct',       width: 65,  heat: 'high' },
      { key: 'fnf',      label: 'F&F',       type: 'bool-good', width: 55,  heat: null   },
      { key: 'ammo',     label: 'AMMO',      type: 'num',       width: 65,  heat: 'high' },
      { key: 'rearm',    label: 'REARM',     type: 'num',       width: 70,  heat: 'low'  },
      { key: 'speed',    label: 'SPEED',     type: 'num',       width: 70,  heat: 'high' },
      { key: 'autonomy', label: 'AUTONOMY',  type: 'num',       width: 85,  heat: 'high' },
    ],
    transform(u) {
      const m = top(u, w => w.category === 'Missile' && (w.ap ?? 0) > 0, 'ap');
      const rearmTime = wf(m, 'rearmTime');
      const salvoLen  = wf(m, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        ecm:      u.ecm ?? 0,
        armorF:   u.armor?.F ?? null,
        armorR:   u.armor?.R ?? null,
        ap:       wf(m, 'ap'),
        rng:      wf(m, 'rng_g'),
        acc:      wf(m, 'acc'),
        fnf:      m?.tag?.includes('FnF') ?? false,
        ammo:     wf(m, 'ammo'),
        rearm:    (rearmTime != null && salvoLen != null) ? Math.round(rearmTime * salvoLen) : null,
        speed:    u.speed ?? null,
        autonomy: u.autonomy ?? null,
      };
    },
  },

  // ── ATGM Vehicle ───────────────────────────────────────────────────────────
  atgmvehicles: {
    label: 'ATGM Vehicle',
    file: 'atgmvehicles.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'armorF', label: 'F ARM',   type: 'num',       width: 65,  heat: 'high' },
      { key: 'ap',     label: 'AP',      type: 'num',       width: 65,  heat: 'high' },
      { key: 'rng',    label: 'GND RNG', type: 'num',       width: 85,  heat: 'high' },
      { key: 'acc',    label: 'ACC',     type: 'pct',       width: 65,  heat: 'high' },
      { key: 'stab',   label: 'STAB',    type: 'pct',       width: 65,  heat: 'high' },
      { key: 'fnf',    label: 'F&F',     type: 'bool-good', width: 55,  heat: null   },
      { key: 'ammo',   label: 'AMMO',    type: 'num',       width: 65,  heat: 'high' },
      { key: 'rearm',  label: 'REARM',   type: 'num',       width: 70,  heat: 'low'  },
      { key: 'speed',  label: 'SPEED',   type: 'num',       width: 70,  heat: 'high' },
    ],
    transform(u) {
      const m = top(u, w => w.category === 'Missile' && (w.ap ?? 0) > 0 && !w.tag?.includes('SHIP') && !w.tag?.includes('RAD') && !w.tag?.includes('SEAD'), 'ap');
      const rearmTime = wf(m, 'rearmTime');
      const salvoLen  = wf(m, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        armorF: u.armor?.F ?? null,
        ap:     wf(m, 'ap'),
        rng:    wf(m, 'rng_g'),
        acc:    wf(m, 'acc'),
        stab:   wf(m, 'stab'),
        fnf:    m?.tag?.includes('FnF') ?? false,
        ammo:   wf(m, 'ammo'),
        rearm:  (rearmTime != null && salvoLen != null) ? Math.round(rearmTime * salvoLen) : null,
        speed:  u.speed ?? null,
      };
    },
  },

  // ── ATGM Helo ──────────────────────────────────────────────────────────────
  atgmhelos: {
    label: 'ATGM Helo',
    file: 'atgmhelos.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'health',  label: 'HP',      type: 'num',       width: 55,  heat: 'high' },
      { key: 'ap',      label: 'AP',      type: 'num',       width: 65,  heat: 'high' },
      { key: 'rng',     label: 'GND RNG', type: 'num',       width: 85,  heat: 'high' },
      { key: 'acc',     label: 'ACC',     type: 'pct',       width: 65,  heat: 'high' },
      { key: 'fnf',     label: 'F&F',     type: 'bool-good', width: 55,  heat: null   },
      { key: 'ammo',    label: 'AMMO',    type: 'num',       width: 65,  heat: 'high' },
      { key: 'rearm',   label: 'REARM',   type: 'num',       width: 70,  heat: 'low'  },
      { key: 'speed',   label: 'SPEED',   type: 'num',       width: 70,  heat: 'high' },
      { key: 'stealth', label: 'STEALTH', type: 'num',       width: 75,  heat: 'high' },
    ],
    transform(u) {
      const m = top(u, w => w.category === 'Missile' && (w.ap ?? 0) > 0 && !w.tag?.includes('SHIP') && !w.tag?.includes('RAD') && !w.tag?.includes('SEAD'), 'ap');
      const rearmTime = wf(m, 'rearmTime');
      const salvoLen  = wf(m, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        health:  u.health ?? null,
        ap:      wf(m, 'ap'),
        rng:     wf(m, 'rng_g'),
        acc:     wf(m, 'acc'),
        fnf:     m?.tag?.includes('FnF') ?? false,
        ammo:    wf(m, 'ammo'),
        rearm:   (rearmTime != null && salvoLen != null) ? Math.round(rearmTime * salvoLen) : null,
        speed:   u.speed ?? null,
        stealth: u.stealth ?? null,
      };
    },
  },

  // ── SEAD ───────────────────────────────────────────────────────────────────
  sead: {
    label: 'SEAD',
    file: 'sead.json',
    isWeapon: false,
    defaultSort: 'cost',
    columns: [
      ...N,
      { key: 'ecm',      label: 'ECM',       type: 'pct', width: 65,  heat: 'high' },
      { key: 'ap',       label: 'AP',        type: 'num', width: 65,  heat: 'high' },
      { key: 'he',       label: 'HE',        type: 'num', width: 65,  heat: 'high' },
      { key: 'rng',      label: 'RNG',       type: 'num', width: 90,  heat: 'high' },
      { key: 'acc',      label: 'ACC',       type: 'pct', width: 65,  heat: 'high' },
      { key: 'salvoLen', label: 'SALVO LEN', type: 'num', width: 90,  heat: 'high' },
      { key: 'ammo',     label: 'AMMO',      type: 'num', width: 65,  heat: 'high' },
      { key: 'rearm',    label: 'REARM',     type: 'num', width: 70,  heat: 'low'  },
      { key: 'speed',    label: 'SPEED',     type: 'num', width: 70,  heat: 'high' },
      { key: 'autonomy', label: 'AUTONOMY',  type: 'num', width: 85,  heat: 'high' },
      { key: 'stealth',  label: 'STEALTH',   type: 'num', width: 75,  heat: 'high' },
    ],
    transform(u) {
      const m = top(u, w => w.category === 'Missile' && w.tag?.includes('SEAD'), 'rng_g');
      const rearmTime = wf(m, 'rearmTime');
      const salvoLen  = wf(m, 'salvoLen');
      return {
        id: u.id, name: u.name, nation: u.nation, cost: u.cost,
        ecm:      u.ecm ?? 0,
        ap:       wf(m, 'ap'),
        he:       wf(m, 'dmg'),
        rng:      wf(m, 'rng_g'),
        acc:      wf(m, 'acc'),
        salvoLen,
        ammo:     wf(m, 'ammo'),
        rearm:    rearmTime != null ? Math.round(rearmTime * (salvoLen ?? 1)) : wf(m, 'salvoReload'),
        speed:    u.speed ?? null,
        autonomy: u.autonomy ?? null,
        stealth:  u.airStealth ?? null,
      };
    },
  },

  // ── Fire Support (weapons) ─────────────────────────────────────────────────
  firesupport: {
    label: 'Fire Support',
    file: 'firesupport.json',
    isWeapon: true,
    defaultSort: 'rng',
    columns: [
      { key: 'name',       label: 'NAME',       type: 'text', width: 220, heat: null   },
      { key: 'caliber',    label: 'CALIBER',    type: 'text', width: 80,  heat: null   },
      { key: 'he',         label: 'HE',         type: 'num',  width: 65,  heat: 'high' },
      { key: 'ap',         label: 'AP',         type: 'num',  width: 65,  heat: 'high' },
      { key: 'rng',        label: 'RNG',        type: 'num',  width: 90,  heat: 'high' },
      { key: 'acc',        label: 'ACC',        type: 'pct',  width: 65,  heat: 'high' },
      { key: 'stab',       label: 'STAB',       type: 'pct',  width: 65,  heat: 'high' },
      { key: 'shot',       label: 'SHOT',       type: 'num',  width: 65,  heat: 'low'  },
      { key: 'salvo',      label: 'SALVO RLD',  type: 'num',  width: 90,  heat: 'low'  },
      { key: 'salvoLen',   label: 'SALVO LEN',  type: 'num',  width: 90,  heat: 'high' },
      { key: 'turreted',   label: 'TURRETED',   type: 'text', width: 85,  heat: null   },
    ],
    transform(w) {
      return {
        name:     w.name,
        caliber:  w.caliber ?? null,
        he:       w.dmg ?? null,
        ap:       w.ap  ?? null,
        rng:      w.rng_g ?? null,
        acc:      w.acc ?? null,
        stab:     w.stab ?? null,
        shot:     w.shotReload ?? null,
        salvo:    w.salvoReload ?? null,
        salvoLen: w.salvoLen ?? null,
        turreted: w.turreted != null ? (w.turreted ? 'Y' : 'N') : null,
      };
    },
  },

  // ── ATGM (weapons) ─────────────────────────────────────────────────────────
  atgm: {
    label: 'ATGM',
    file: 'atgm.json',
    isWeapon: true,
    defaultSort: 'ap',
    columns: [
      { key: 'name', label: 'NAME',    type: 'text', width: 220, heat: null   },
      { key: 'ap',   label: 'AP',      type: 'num',  width: 65,  heat: 'high' },
      { key: 'dmg',  label: 'HE',      type: 'num',  width: 65,  heat: 'high' },
      { key: 'rng',  label: 'GND RNG', type: 'num',  width: 90,  heat: 'high' },
      { key: 'rngH', label: 'HELO RNG',type: 'num',  width: 95,  heat: 'high' },
      { key: 'acc',  label: 'ACC',     type: 'pct',  width: 65,  heat: 'high' },
      { key: 'stab', label: 'STAB',    type: 'pct',  width: 65,  heat: 'high' },
      { key: 'mspd', label: 'MS SPD',  type: 'num',  width: 80,  heat: 'high' },
      { key: 'aim',  label: 'AIM',     type: 'num',  width: 65,  heat: 'low'  },
    ],
    transform(w) {
      return {
        name:  w.name,
        ap:    w.ap ?? null,
        dmg:   w.dmg ?? null,
        rng:   w.rng_g ?? null,
        rngH:  w.rng_h ?? null,
        acc:   w.acc ?? null,
        stab:  w.stab ?? null,
        mspd:  w.missileSpeed ?? null,
        aim:   w.aimTime ?? null,
      };
    },
  },
};
