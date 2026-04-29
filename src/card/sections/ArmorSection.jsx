import React from 'react';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { armorColor } from '../../format/tiers.js';

function ArmorCell({ label, v, s }) {
  const c = armorColor(v) ?? s.accent;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ fontSize: 9.5, color: s.dim, letterSpacing: '0.1em' }}>{label}</div>
      <div style={{
        border: `1.5px solid ${c}`,
        background: `color-mix(in srgb, ${c} 6%, transparent)`,
        padding: '4px 12px', minWidth: 40, textAlign: 'center',
        fontSize: 16, color: c, fontVariantNumeric: 'tabular-nums',
      }}>{v}</div>
    </div>
  );
}

export function ArmorSection({ armor, s }) {
  return (
    <>
      <SectionHeader title="Armor" s={s} />
      <div style={{ padding: '8px 0 4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <ArmorCell label="FRONT ↑" v={armor.F} s={s} />
        <ArmorCell label="SIDE →"  v={armor.S} s={s} />
        <ArmorCell label="REAR ↓"  v={armor.R} s={s} />
        <ArmorCell label="TOP ◉"   v={armor.T} s={s} />
      </div>
    </>
  );
}
