// units-core: shared API for the WGRD armory and companion apps.
// See README.md for the full spec.

export { loadData } from './data/loader.js';
export { readUnitFromUrl, writeUnitToUrl } from './data/selection.js';

export { useFilterState } from './filter/useFilterState.js';

export { UnitList } from './list/UnitList.jsx';
export { UnitListRow, ROW_HEIGHTS } from './list/UnitListRow.jsx';
export { FlagImg } from './list/FlagImg.jsx';

export { V2Card } from './card/V2Card.jsx';
export { SECTION_IDS, FIELD_IDS, HideContext, makeHide, useHide } from './card/HideContext.js';

export {
  BROWSER_TOKENS, BMono, V2_THEMES,
} from './constants/theme.js';
export {
  ALL_NATIONS, PACT_NATIONS, NATION_CODE_MAP, NATION_FLAG_MAP, sideOf,
} from './constants/nations.js';
export {
  COALITIONS, COALITION_NATIONS, COALITION_FLAG_MAP,
} from './constants/coalitions.js';
export { SPECS, SPEC_VET_BONUS, SPEC_CODE_MAP } from './constants/specs.js';
export { TABS } from './constants/tabs.js';
export { VET_TIERS, VET_TOOLTIPS } from './constants/veterancy.js';
