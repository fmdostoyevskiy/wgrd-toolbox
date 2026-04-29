import React from 'react';
import { DotRow } from '../primitives/DotRow.jsx';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { speedColor, autonomyColor } from '../../format/tiers.js';

const FOREST_TOOLTIPS = {
  wheeled: 'Wheeled units always travel at 50% speed in forests.',
  tracked: 'Tracked units always travel at 70% speed in forests.',
};

const ROAD_TOOLTIPS = {
  wheeled: 'Wheeled units always move at 150 km/h on roads.',
  tracked: 'Tracked units always move at 110 km/h on roads.',
};

export function hasMobility(unit) {
  return unit.speed != null
      || unit.forestSpeed != null
      || unit.swimSpeed != null
      || unit.autonomy != null
      || unit.fuel != null
      || unit.refuelTime != null
      || unit.altitude != null
      || unit.roadSpeed != null
      || unit.turnRadius != null
      || unit.maxAcceleration != null
      || unit.maxDeceleration != null
      || unit.sailing != null;
}

export function MobilitySection({ unit, s }) {
  const motion = unit.motionType === 'wheeled' ? 'wheeled' : 'tracked';

  const accelDecel = (() => {
    const a = unit.maxAcceleration;
    const d = unit.maxDeceleration;
    if (a == null && d == null) return null;
    if (a != null && d != null) return { label: 'Accel / Decel', value: `${a} / ${d} km/h/s` };
    if (a != null)              return { label: 'Accel',         value: `${a} km/h/s` };
    return                             { label: 'Decel',         value: `${d} km/h/s` };
  })();

  return (
    <>
      <SectionHeader title="Mobility" s={s} />
      <div className="sr">
        {unit.speed       != null && <DotRow label="Speed"  value={`${unit.speed} km/h`}       accent={speedColor(unit)}                       s={s} />}
        {unit.forestSpeed != null && <DotRow label="Forest" value={`${unit.forestSpeed} km/h`} accent={speedColor(unit, unit.forestSpeed)} tooltip={FOREST_TOOLTIPS[motion]} s={s} />}
        {unit.swimSpeed   != null && <DotRow label="Amphib" value={`${unit.swimSpeed} km/h`}   accent={speedColor(unit, unit.swimSpeed)}   tooltip="Amphibious movement is always 50% speed." s={s} />}
        {unit.roadSpeed   != null && <DotRow label="Road"   value={`${unit.roadSpeed} km/h`}   accent={speedColor(unit, unit.roadSpeed)}   tooltip={ROAD_TOOLTIPS[motion]} s={s} />}
        {unit.autonomy    != null && <DotRow
          label={unit.type === 'Plane' ? 'Time Over Target' : 'Autonomy'}
          value={`${unit.autonomy} s`}
          accent={autonomyColor(unit.autonomy)}
          tooltip="Autonomy is the seconds a unit can be on the move."
          s={s}
        />}
        {unit.fuel        != null && <DotRow label="Fuel"        value={`${unit.fuel} L`}       s={s} />}
        {unit.refuelTime  != null && <DotRow label="Refuel Time" value={`${unit.refuelTime} s`} s={s} />}
        {unit.altitude    != null && <DotRow label="Altitude"    value={`${unit.altitude} m`}   s={s} />}
        {unit.turnRadius  != null && <DotRow label="Turn Radius" value={`${unit.turnRadius} m`} s={s} />}
        {accelDecel && <DotRow label={accelDecel.label} value={accelDecel.value} s={s} />}
        {unit.sailing     != null && <DotRow label="Sailing"     value={unit.sailing}           s={s} />}
      </div>
    </>
  );
}
