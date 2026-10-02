import React from 'react';
import { CaptureButton } from '../primitives/CaptureButton.jsx';
import { TagChip } from '../primitives/TagChip.jsx';
import { FieldRow, useVisibleRows } from '../FieldRows.jsx';
import { WEAPON_FIELDS } from '../fields/weapon.jsx';

// Tags the header leaves out: KE and HEAT show next to the AP value, AUTO as
// [AL] on the reload row, and STAT isn't shown.
const HEADER_TAG_BLACKLIST = new Set(['KE', 'HEAT', 'STAT', 'AUTO']);

// activeRange, onRange, accMode and onAccMode are for tools that compute hit
// chance: they mark the range row and the accuracy/stabilizer row in use, and
// make those rows clickable. activeDamage ('AP' or 'HE') marks the damage and aim time rows
// in use and greys the others. effectiveAp replaces the AP value (KE AP at the
// current distance), with apNote as its tooltip. baseAccuracyOnly drops the
// veterancy-adjusted value from the accuracy and stabilizer rows. With onToggle, the
// header collapses the rows (open = false).
export function WeaponBlock({
  w, vet, s, sharedTurrets, weaponIdx, onCapture,
  activeRange, onRange, accMode, onAccMode, activeDamage, effectiveAp, apNote, baseAccuracyOnly,
  open = true, onToggle,
}) {
  const ctx  = { s, vet, effectiveAp, apNote, baseAccuracyOnly, sharedTurrets };
  const rows = useVisibleRows(WEAPON_FIELDS, w, ctx);
  const interaction = { activeRange, onRange, accMode, onAccMode, activeDamage };
  const headerTags  = (w.tag ?? []).filter(t => !HEADER_TAG_BLACKLIST.has(t));

  return (
    <div data-weapon-idx={weaponIdx} style={{ margin: '10px 0 12px', border: `1px solid ${s.rule}`, background: s.paper }}>
      <div
        {...(onToggle && {
          role: 'button', tabIndex: 0, 'aria-expanded': open,
          title: open ? 'Hide the weapon details' : 'Show the weapon details',
          onClick: e => { if (!e.target.closest('button')) onToggle(); },
          onKeyDown: e => {
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToggle(); }
          },
        })}
        style={{
          padding: '8px 12px', borderBottom: open ? `1px solid ${s.rule}` : 'none',
          background: s.paper, cursor: onToggle ? 'pointer' : undefined,
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, minWidth: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{w.name}</div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'baseline' }}>
            {headerTags.map(tag => <TagChip key={tag} tag={tag} s={s} />)}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <div style={{ fontSize: 11, color: s.dim }}>
            {w.caliber != null ? `${w.caliber} × ${w.ammo}` : `× ${w.ammo}`}
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CaptureButton onCapture={onCapture} s={s} />
            {onToggle && <span style={{ fontSize: 11, letterSpacing: '0.14em', color: s.dim }}>{open ? '▾ HIDE' : '▸ DETAILS'}</span>}
          </span>
        </div>
      </div>

      {open && <div className="sr" style={{ padding: '6px 12px 8px' }}>
        {rows.map(r => <FieldRow key={r.key} row={r} s={s} dense interaction={interaction} />)}
      </div>}
    </div>
  );
}
