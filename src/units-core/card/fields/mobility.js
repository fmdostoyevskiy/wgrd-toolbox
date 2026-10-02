import { speedColor, autonomyColor } from '../../format/tiers.js';
import { motionOf, isPlane } from '../rules.js';

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

// Speed rows for a unit stat in km/h, coloured by the unit's speed tiers.
const speed = (id, label, key, tooltip) => ({
  id, label, tooltip,
  when:   u => u[key] != null,
  value:  u => `${u[key]} km/h`,
  accent: u => speedColor(u, u[key]),
});

// Accel and decel share a row; either may be missing.
function accelDecel(u) {
  const a = u.maxAcceleration;
  const d = u.maxDeceleration;
  if (a != null && d != null) return { label: 'Accel / Decel', value: `${a} / ${d} km/h/s` };
  if (a != null)              return { label: 'Accel',         value: `${a} km/h/s` };
  return                             { label: 'Decel',         value: `${d} km/h/s` };
}

export const MOBILITY_FIELDS = [
  speed('speed',       'Speed',  'speed'),
  speed('forestSpeed', 'Forest', 'forestSpeed', u => FOREST_TOOLTIPS[motionOf(u)]),
  speed('swimSpeed',   'Amphib', 'swimSpeed',   'Amphibious movement is always 50% speed.'),
  speed('roadSpeed',   'Road',   'roadSpeed',   u => ROAD_TOOLTIPS[motionOf(u)]),
  { id: 'autonomy',
    label:   u => (isPlane(u) ? 'Time Over Target' : 'Autonomy'),
    when:    u => u.autonomy != null,
    value:   u => `${u.autonomy} s`,
    accent:  u => autonomyColor(u.autonomy),
    tooltip: 'Autonomy is the seconds a unit can be on the move.' },
  { id: 'fuel',       label: 'Fuel',        when: u => u.fuel != null,       value: u => `${u.fuel} L` },
  { id: 'refuelTime', label: 'Refuel Time', when: u => u.refuelTime != null, value: u => `${u.refuelTime} s` },
  { id: 'altitude',   label: 'Altitude',    when: u => u.altitude != null,   value: u => `${u.altitude} m` },
  { id: 'turnRadius', label: 'Turn Radius', when: u => u.turnRadius != null, value: u => `${u.turnRadius} m` },
  { id: 'turningTime', label: 'Turning Time', expert: true,
    when: u => u.turningTime != null, value: u => `${u.turningTime} s` },
  { id: 'accelDecel', expert: true,
    when: u => u.maxAcceleration != null || u.maxDeceleration != null,
    rows: u => [accelDecel(u)] },
  { id: 'sailing', label: 'Sailing', when: u => u.sailing != null, value: u => u.sailing },
];
