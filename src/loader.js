import { NATION_CODE_MAP } from './constants/nations.js';
import { SPEC_CODE_MAP } from './constants/specs.js';

const TRAINING_LABELS = ['Militia', 'Regular', 'Shock', 'Elite'];

function deriveEra(year) {
  if (year <= 1980) return 'PRE-80';
  if (year <= 1985) return 'PRE-85';
  return null;
}

function deriveUnitTags(weapons = []) {
  const tags = new Set();
  for (const w of weapons) {
    for (const tag of w.tag ?? []) tags.add(tag);
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
  const nationName = NATION_CODE_MAP[unit.nation];
  if (!nationName) {
    console.warn(`Unknown nation code: "${unit.nation}" (unit: ${unit.name})`);
  }
  const era = deriveEra(unit.year ?? 0);
  const derived = { nationName: nationName ?? unit.nation, era };

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

// units.json may be served as UTF-16 LE with BOM (Excel-style export); strip
// it and decode accordingly so JSON.parse never sees stray code points.
async function fetchUnits() {
  const res = await fetch('./units.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf  = await res.arrayBuffer();
  const head = new Uint8Array(buf, 0, 2);
  const utf16 = head[0] === 0xFF && head[1] === 0xFE;
  const text = utf16
    ? new TextDecoder('utf-16le').decode(buf).replace(/^﻿/, '')
    : new TextDecoder('utf-8').decode(buf);
  return JSON.parse(text);
}

export async function loadData() {
  const raw = await fetchUnits();
  const roster = [];
  const units  = {};
  let   defaultId = null;

  for (const unit of raw) {
    const transformed = transformUnit(unit);
    units[unit.id] = transformed;

    roster.push({
      id:         unit.id,
      name:       unit.name,
      tab:        unit.tab,
      nation:     unit.nation,
      nationName: transformed.nationName,
      specs:      convertSpecs(unit.specs),
      cost:       unit.cost,
      unitTags:   deriveUnitTags(unit.weapons),
      era:        transformed.era,
      transports: unit.transports ?? [],
    });

    if (!defaultId && unit.type !== 'FOB') {
      defaultId = unit.id;
    }
  }

  // Resolve transport id references → small lookup objects for the row UI.
  for (const entry of roster) {
    if (entry.transports.length === 0) continue;
    entry.transports = entry.transports.map(tid => ({
      id:     tid,
      name:   units[tid]?.name   ?? tid,
      nation: units[tid]?.nation ?? '',
      tab:    units[tid]?.tab    ?? '',
    }));
  }

  return { roster, units, defaultId };
}
