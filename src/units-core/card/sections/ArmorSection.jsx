import React from 'react';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { useVisibleRows } from '../FieldRows.jsx';
import { ARMOR_FIELDS } from '../fields/armor.js';

const AP_DAMAGE_URL = `${import.meta.env.BASE_URL}apdamage/`;

function ArmorCell({ label, v, accent, s }) {
  const c = accent ?? s.accent;
  const href = `${AP_DAMAGE_URL}?armors=${v}`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ fontSize: 9.5, color: s.dim, letterSpacing: '0.1em' }}>{label}</div>
      <a href={href} style={{
        border: `1.5px solid ${c}`,
        background: `color-mix(in srgb, ${c} 6%, transparent)`,
        padding: '4px 12px', minWidth: 40, textAlign: 'center',
        fontSize: 16, color: c, fontVariantNumeric: 'tabular-nums',
        textDecoration: 'none', display: 'block',
      }}>{v}</a>
    </div>
  );
}

export function ArmorSection({ unit, s }) {
  const cells = useVisibleRows(ARMOR_FIELDS, unit, { s });
  if (cells.length === 0) return null;

  return (
    <>
      <SectionHeader title="Armor" s={s} />
      <div style={{ padding: '8px 0 4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cells.map(c => <ArmorCell key={c.id} label={c.label} v={c.value} accent={c.accent} s={s} />)}
      </div>
    </>
  );
}
