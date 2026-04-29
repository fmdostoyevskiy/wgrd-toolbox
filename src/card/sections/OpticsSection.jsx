import React from 'react';
import { DotRow } from '../primitives/DotRow.jsx';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { byTier, OPTICS, STEALTH, AIR_STEALTH, AIR_OPTICS } from '../../format/tiers.js';

export function hasOptics(unit) {
  return unit.stealth    != null
      || unit.optics     != null
      || unit.seaOptics  != null
      || unit.airStealth != null
      || (unit.airOptics != null && unit.airOptics >= 20);
}

const ROWS = [
  { key: 'stealth',    label: 'Stealth',     table: STEALTH     },
  { key: 'optics',     label: 'Optics',      table: OPTICS      },
  { key: 'seaOptics',  label: 'Sea Optics',  table: OPTICS      },
  { key: 'airStealth', label: 'Air Stealth', table: AIR_STEALTH },
];

export function OpticsSection({ unit, s }) {
  const rows = ROWS.flatMap(r => {
    const v = unit[r.key];
    if (v == null) return [];
    const tier = byTier(v, r.table);
    if (!tier) return [];
    return [{ key: r.key, label: r.label, value: `${tier.label} (${v})`, accent: tier.color }];
  });

  // Air Optics has the special "only show if >= 20" rule
  if (unit.airOptics != null && unit.airOptics >= 20) {
    const tier = byTier(unit.airOptics, AIR_OPTICS);
    if (tier) {
      rows.push({ key: 'airOptics', label: 'Air Optics', value: `${tier.label} (${unit.airOptics})`, accent: tier.color });
    }
  }

  return (
    <>
      <SectionHeader title="Optics" s={s} />
      <div className="sr">
        {rows.map(r => (
          <DotRow key={r.key} label={r.label} value={r.value} accent={r.accent} s={s} />
        ))}
      </div>
    </>
  );
}
