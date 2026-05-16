import React from 'react';
import { DotRow } from '../primitives/DotRow.jsx';
import { CaptureButton } from '../primitives/CaptureButton.jsx';
import { sizeInfo, ecmColor } from '../../format/tiers.js';
import { useHide } from '../HideContext.js';

export function GeneralSection({ unit, s, onCapture }) {
  const hide = useHide();
  const showSize = unit.type !== 'Plane';
  const si = showSize ? sizeInfo(unit.size ?? 0) : null;

  const rows = [
    unit.ownTags?.length > 0 && (
      <div key="unitTags" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '2px 0 4px' }}>
        {unit.ownTags.map(tag => (
          <span key={tag} style={{
            fontSize: 9.5, color: s.ok, border: `1px solid ${s.ok}`,
            padding: '1px 5px', letterSpacing: '0.08em',
          }}>[{tag}]</span>
        ))}
      </div>
    ),
    hide.field('health')   && <DotRow key="health" label="Health" value={unit.health} s={s} />,
    showSize && si && hide.field('size') && (
      <DotRow key="size" label="Size"
              value={`${si.label} (${unit.size ?? 0})`}
              accent={si.color}
              tooltip="Size increases or decreases the chance of a unit being hit."
              s={s} />
    ),
    unit.trainingLabel && hide.field('training') && <DotRow key="training" label="Training" value={unit.trainingLabel} s={s} />,
    unit.ecm     != null && hide.field('ecm')       && <DotRow key="ecm" label="ECM" value={`${unit.ecm}%`} accent={ecmColor(unit.ecm)} tooltip="Decreases a weapon's accuracy by this percentage when targeting this plane." s={s} />,
    unit.ciws    != null && hide.field('ciws')      && <DotRow key="ciws" label="CIWS" value={unit.ciws} s={s} />,
    unit.capacity != null && hide.field('supply')   && <DotRow key="supply" label="Supply" value={`${unit.capacity} L`} s={s} />,
    unit.isTransport      && hide.field('transport') && <DotRow key="transport" label="Transport" value="YES" s={s} />,
    unit.prototype        && hide.field('prototype') && <DotRow key="prototype" label="Prototype" value="YES" s={s} />,
    unit.command          && hide.field('command')   && <DotRow key="command" label="Command" value="YES" accent={s.ok} s={s} />,
    unit.era              && hide.field('era')       && <DotRow key="era" label="Era" value={unit.era} s={s} />,
  ].filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <>
      <div style={{
        margin: '14px 0 2px', display: 'flex', alignItems: 'baseline', gap: 8,
        borderBottom: `1.5px solid ${s.ruleStrong}`, paddingBottom: 4,
      }}>
        <div style={{
          fontSize: 12, color: s.ink, letterSpacing: '0.16em',
          textTransform: 'uppercase', fontWeight: 600, flex: 1,
        }}>General</div>
        <CaptureButton onCapture={onCapture} s={s} style={{ flexShrink: 0 }} />
      </div>
      <div className="sr">{rows}</div>
    </>
  );
}
