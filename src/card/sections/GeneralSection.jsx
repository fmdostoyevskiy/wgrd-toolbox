import React from 'react';
import { DotRow } from '../primitives/DotRow.jsx';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { sizeInfo, ecmColor } from '../../format/tiers.js';

export function GeneralSection({ unit, s }) {
  const showSize = unit.type !== 'Plane';
  const si = showSize ? sizeInfo(unit.size ?? 0) : null;

  return (
    <>
      <SectionHeader title="General" s={s} />
      <div className="sr">
        <DotRow label="Health" value={unit.health} s={s} />
        {showSize && si && (
          <DotRow
            label="Size"
            value={`${si.label} (${unit.size ?? 0})`}
            accent={si.color}
            tooltip="Size increases or decreases the chance of a unit being hit."
            s={s}
          />
        )}
        {unit.trainingLabel    && <DotRow label="Training"  value={unit.trainingLabel}    s={s} />}
        {unit.ecm     != null && <DotRow label="ECM"       value={`${unit.ecm}%`}        accent={ecmColor(unit.ecm)} tooltip="Decreases a weapon's accuracy by this percentage when targeting this plane." s={s} />}
        {unit.ciws    != null && <DotRow label="CIWS"      value={unit.ciws}             s={s} />}
        {unit.capacity != null && <DotRow label="Supply"    value={`${unit.capacity} L`}  s={s} />}
        {unit.isTransport      && <DotRow label="Transport" value="YES"                   s={s} />}
        {unit.prototype        && <DotRow label="Prototype" value="YES"                   s={s} />}
        {unit.command          && <DotRow label="Command"   value="YES" accent={s.ok}     s={s} />}
        {unit.era              && <DotRow label="Era"       value={unit.era}              s={s} />}
      </div>
    </>
  );
}
