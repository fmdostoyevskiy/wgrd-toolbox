import { sizeInfo, ecmColor } from '../../format/tiers.js';
import { isPlane } from '../rules.js';

export const GENERAL_FIELDS = [
  { id: 'health', label: 'Health', value: u => u.health },
  // Planes don't show a size.
  { id: 'size', label: 'Size',
    when:    u => !isPlane(u),
    value:   u => `${sizeInfo(u.size ?? 0).label} (${u.size ?? 0})`,
    accent:  u => sizeInfo(u.size ?? 0).color,
    tooltip: 'Size increases or decreases the chance of a unit being hit.' },
  { id: 'training', label: 'Training', when: u => u.trainingLabel, value: u => u.trainingLabel },
  { id: 'ecm', label: 'ECM',
    when:    u => u.ecm != null,
    value:   u => `${u.ecm}%`,
    accent:  u => ecmColor(u.ecm),
    tooltip: "Decreases a weapon's accuracy by this percentage when targeting this plane." },
  { id: 'ciws',      label: 'CIWS',      when: u => u.ciws != null,     value: u => u.ciws },
  { id: 'supply',    label: 'Supply',    when: u => u.capacity != null, value: u => `${u.capacity} L` },
  { id: 'transport', label: 'Transport', when: u => u.isTransport, value: 'YES' },
  { id: 'prototype', label: 'Prototype', when: u => u.prototype,   value: 'YES' },
  { id: 'command',   label: 'Command',   when: u => u.command,     value: 'YES', accent: (u, { s }) => s.ok },
  { id: 'era',       label: 'Era',       when: u => u.era,         value: u => u.era },
];
