import { armorColor, armorTopColor, armorSideRearColor } from '../../format/tiers.js';

const facing = (id, key, label, color) => ({
  id, label,
  value:  u => u.armor[key],
  accent: u => color(u.armor[key]),
});

// Side and rear, and top, have their own colour tiers.
export const ARMOR_FIELDS = [
  facing('armorFront', 'F', 'FRONT ↑', armorColor),
  facing('armorSide',  'S', 'SIDE →',  armorSideRearColor),
  facing('armorRear',  'R', 'REAR ↓',  armorSideRearColor),
  facing('armorTop',   'T', 'TOP ◉',   armorTopColor),
];
