import { NATION_CODE_MAP, SPEC_CODE_MAP } from './constants.js';

const SIZE_LABELS     = ['Very Small', 'Small', 'Medium', 'Big', 'Very Big'];
const TRAINING_LABELS = ['Militia', 'Regular', 'Shock', 'Elite'];

function deriveEra(year) {
  if (year <= 1980) return 'PRE-80';
  if (year <= 1985) return 'PRE-85';
  return null;
}

function deriveUnitTags(weapons = []) {
  const tags = new Set();
  for (const w of weapons) {
    for (const t of w.tag || []) tags.add(t);
  }
  return [...tags];
}

function convertSpecs(rawSpecs = []) {
  const seen = new Set();
  const out  = [];
  for (const code of rawSpecs) {
    const display = SPEC_CODE_MAP[code];
    if (display && !seen.has(display)) { seen.add(display); out.push(display); }
  }
  return out;
}

function transformUnit(unit) {
  const nationName = NATION_CODE_MAP[unit.nation] || unit.nation;
  const era        = deriveEra(unit.year ?? 0);

  const derived = { nationName, era };

  if (unit.training != null) {
    derived.trainingLabel = TRAINING_LABELS[unit.training] ?? String(unit.training);
  }

  if (unit.type === 'Vehicle' && unit.speed != null && unit.motionType) {
    const wheeled = unit.motionType === 'wheeled';
    derived.roadSpeed   = wheeled ? 150 : 110;
    derived.forestSpeed = Math.round(unit.speed * (wheeled ? 0.5 : 0.7));
    if (unit.amphibious) {
      derived.swimSpeed = Math.round(unit.speed * 0.5);
    }
  }

  return { ...unit, ...derived };
}

export async function loadData() {
  let raw;

  const res = await fetch('./units.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf  = await res.arrayBuffer();
  const view = new Uint8Array(buf, 0, 2);
  // Strip UTF-16 LE BOM (FF FE) if present, then decode
  const isUtf16 = view[0] === 0xFF && view[1] === 0xFE;
  const text = isUtf16
    ? new TextDecoder('utf-16le').decode(buf).replace(/^\uFEFF/, '')
    : new TextDecoder('utf-8').decode(buf);
  raw = JSON.parse(text);

  const roster = [];
  const units  = {};
  let   defaultId = null;

  for (const unit of raw) {
    const unitTags = deriveUnitTags(unit.weapons);
    const specs    = convertSpecs(unit.specs);
    const nationName = NATION_CODE_MAP[unit.nation];
    if (!nationName) {
      console.warn(`Unknown nation code: "${unit.nation}" (unit: ${unit.name})`);
    }

    roster.push({
      id:          unit.id,
      name:        unit.name,
      tab:         unit.tab,
      nation:      unit.nation,
      nationName:  nationName ?? unit.nation,
      specs,
      cost:        unit.cost,
      unitTags,
      era:         deriveEra(unit.year ?? 0),
      transports:  unit.transports ?? [],
    });

    units[unit.id] = transformUnit(unit);

    if (!defaultId && unit.type !== 'FOB') {
      defaultId = unit.id;
    }
  }

  for (const entry of roster) {
    if (entry.transports.length > 0) {
      entry.transports = entry.transports.map(tid => ({
        id:     tid,
        name:   units[tid]?.name   ?? tid,
        nation: units[tid]?.nation ?? '',
        tab:    units[tid]?.tab    ?? '',
      }));
    }
  }

  return { roster, units, defaultId };
}
