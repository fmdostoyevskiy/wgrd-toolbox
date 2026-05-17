import React from 'react';
import { DotRow } from '../primitives/DotRow.jsx';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { byTier, OPTICS, STEALTH, AIR_STEALTH, AIR_OPTICS } from '../../format/tiers.js';
import { useHide } from '../HideContext.js';

export function hasOptics(unit) {
  return unit.stealth    != null
      || unit.optics     != null
      || unit.seaOptics  != null
      || unit.airStealth != null
      || (unit.airOptics != null && unit.airOptics >= 20);
}

function spotterType(tab) {
  if (tab === 'AIR') return 'plane';
  if (tab === 'HEL') return 'heli';
  return 'ground';
}

function opticsHref(key, value, tab) {
  const p = new URLSearchParams();
  const isAir = key === 'airStealth' || key === 'airOptics';
  const isOptics = key === 'optics' || key === 'seaOptics' || key === 'airOptics';
  if (isAir) p.set('mode', 'air');
  if (isOptics) p.set('spotter', spotterType(tab));
  p.set(isOptics ? 'o' : 's', value);
  p.set('lock', isOptics ? 'optics' : 'stealth');
  return import.meta.env.BASE_URL + 'optics/?' + p.toString();
}

const ROWS = [
  { key: 'stealth',    label: 'Stealth',     table: STEALTH     },
  { key: 'optics',     label: 'Optics',      table: OPTICS      },
  { key: 'seaOptics',  label: 'Sea Optics',  table: OPTICS      },
  { key: 'airStealth', label: 'Air Stealth', table: AIR_STEALTH },
];

export function OpticsSection({ unit, s }) {
  const hide = useHide();

  const rows = ROWS.flatMap(r => {
    if (!hide.field(r.key)) return [];
    const v = unit[r.key];
    if (v == null) return [];
    const tier = byTier(v, r.table);
    if (!tier) return [];
    return [{ key: r.key, label: r.label, value: `${tier.label} (${v})`, accent: tier.color, href: opticsHref(r.key, v, unit.tab) }];
  });

  if (unit.airOptics != null && unit.airOptics >= 20 && hide.field('airOptics')) {
    const tier = byTier(unit.airOptics, AIR_OPTICS);
    if (tier) {
      rows.push({ key: 'airOptics', label: 'Air Optics', value: `${tier.label} (${unit.airOptics})`, accent: tier.color, href: opticsHref('airOptics', unit.airOptics, unit.tab) });
    }
  }

  if (rows.length === 0) return null;

  return (
    <>
      <SectionHeader title="Optics" s={s} />
      <div className="sr">
        {rows.map(r => (
          <DotRow key={r.key} label={r.label} value={r.value} accent={r.accent} href={r.href} s={s} />
        ))}
      </div>
    </>
  );
}
