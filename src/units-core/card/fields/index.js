import { GENERAL_FIELDS } from './general.js';
import { MOBILITY_FIELDS } from './mobility.js';
import { OPTICS_FIELDS } from './optics.js';
import { ARMOR_FIELDS } from './armor.js';
import { WEAPON_FIELDS } from './weapon.jsx';

export { GENERAL_FIELDS, MOBILITY_FIELDS, OPTICS_FIELDS, ARMOR_FIELDS, WEAPON_FIELDS };

// Every id `hide.fields` accepts, in card order.
export const FIELD_IDS = [...new Set(
  [GENERAL_FIELDS, MOBILITY_FIELDS, OPTICS_FIELDS, ARMOR_FIELDS, WEAPON_FIELDS].flat().map(f => f.id),
)];
