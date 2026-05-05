import React from 'react';
import { DotRow } from '../primitives/DotRow.jsx';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { speedColor, autonomyColor } from '../../format/tiers.js';
import { useHide } from '../HideContext.js';

const FOREST_TOOLTIPS = {
  wheeled: 'Wheeled units always travel at 50% speed in forests.',
  tracked: 'Tracked units always travel at 60% speed in forests.',
  truck:   'Trucks always travel at 30% speed in forests.',
};

const ROAD_TOOLTIPS = {
  wheeled: 'Wheeled units always move at 150 km/h on roads.',
  tracked: 'Tracked units always move at 110 km/h on roads.',
  truck:   'Trucks always move at 150 km/h on roads.',
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
  const hide = useHide();
  const motion = unit.motionType === 'wheeled' ? 'wheeled'
               : unit.motionType === 'truck'   ? 'truck'
               : 'tracked';

  const accelDecel = (() => {
    const a = unit.maxAcceleration;
    const d = unit.maxDeceleration;
    if (a == null && d == null) return null;
    if (a != null && d != null) return { label: 'Accel / Decel', value: `${a} / ${d} km/h/s` };
    if (a != null)              return { label: 'Accel',         value: `${a} km/h/s` };
    return                             { label: 'Decel',         value: `${d} km/h/s` };
  })();

  const rows = [
    unit.speed       != null && hide.field('speed')       && <DotRow key="speed" label="Speed"  value={`${unit.speed} km/h`} accent={speedColor(unit)} s={s} />,
    unit.forestSpeed != null && hide.field('forestSpeed') && <DotRow key="forest" label="Forest" value={`${unit.forestSpeed} km/h`} accent={speedColor(unit, unit.forestSpeed)} tooltip={FOREST_TOOLTIPS[motion]} s={s} />,
    unit.swimSpeed   != null && hide.field('swimSpeed')   && <DotRow key="swim" label="Amphib" value={`${unit.swimSpeed} km/h`} accent={speedColor(unit, unit.swimSpeed)} tooltip="Amphibious movement is always 50% speed." s={s} />,
    unit.roadSpeed   != null && hide.field('roadSpeed')   && <DotRow key="road" label="Road" value={`${unit.roadSpeed} km/h`} accent={speedColor(unit, unit.roadSpeed)} tooltip={ROAD_TOOLTIPS[motion]} s={s} />,
    unit.autonomy    != null && hide.field('autonomy')    && <DotRow key="auto" label={unit.type === 'Plane' ? 'Time Over Target' : 'Autonomy'} value={`${unit.autonomy} s`} accent={autonomyColor(unit.autonomy)} tooltip="Autonomy is the seconds a unit can be on the move." s={s} />,
    unit.fuel        != null && hide.field('fuel')        && <DotRow key="fuel" label="Fuel" value={`${unit.fuel} L`} s={s} />,
    unit.refuelTime  != null && hide.field('refuelTime')  && <DotRow key="refuel" label="Refuel Time" value={`${unit.refuelTime} s`} s={s} />,
    unit.altitude    != null && hide.field('altitude')    && <DotRow key="alt" label="Altitude" value={`${unit.altitude} m`} s={s} />,
    unit.turnRadius  != null && hide.field('turnRadius')  && <DotRow key="turn" label="Turn Radius" value={`${unit.turnRadius} m`} s={s} />,
    accelDecel && hide.field('accelDecel') && <DotRow key="ad" label={accelDecel.label} value={accelDecel.value} s={s} />,
    unit.sailing     != null && hide.field('sailing')     && <DotRow key="sail" label="Sailing" value={unit.sailing} s={s} />,
  ].filter(Boolean);

  if (rows.length === 0) return null;

  return (
    <>
      <SectionHeader title="Mobility" s={s} />
      <div className="sr">{rows}</div>
    </>
  );
}
