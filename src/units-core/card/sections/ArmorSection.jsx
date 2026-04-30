import React from 'react';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { armorColor, armorTopColor, armorSideRearColor } from '../../format/tiers.js';
import { useHide } from '../HideContext.js';

function ArmorCell({ label, v, s, colorFn = armorColor }) {
  const c = colorFn(v) ?? s.accent;
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
  const hide = useHide();
  const cells = [
    hide.field('armorFront') && <ArmorCell key="F" label="FRONT ↑" v={armor.F} s={s} />,
    hide.field('armorSide')  && <ArmorCell key="S" label="SIDE →"  v={armor.S} s={s} colorFn={armorSideRearColor} />,
    hide.field('armorRear')  && <ArmorCell key="R" label="REAR ↓"  v={armor.R} s={s} colorFn={armorSideRearColor} />,
    hide.field('armorTop')   && <ArmorCell key="T" label="TOP ◉"   v={armor.T} s={s} colorFn={armorTopColor} />,
  ].filter(Boolean);

  if (cells.length === 0) return null;

  return (
    <>
      <SectionHeader title="Armor" s={s} />
      <div style={{ padding: '8px 0 4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {cells}
      </div>
    </>
  );
}
