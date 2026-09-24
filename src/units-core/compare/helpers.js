// Shared bits of the unit comparison tools (accuracy, combat).
import { BROWSER_TOKENS, V2_THEMES } from '../constants/theme.js';
import { sideOf } from '../constants/nations.js';
import { accuracyColor } from '../format/tiers.js';

const HEX = 175;

// Panel colors follow the unit's coalition: NATO blue, PACT red.
export const themeOf = unit => V2_THEMES[sideOf(unit.nation)] ?? V2_THEMES.tactical;

export const TYPE_LABELS = {
  Vehicle: 'VEHICLE', Infantry: 'INFANTRY', Helicopter: 'HELO', Plane: 'PLANE', Ship: 'SHIP',
};

export const hitColor = r => (r.ok ? accuracyColor(r.hit) : BROWSER_TOKENS.dimmer);
export const hitText  = r => (r.ok ? `${r.hit}%` : '—');

export const clampInt = (v, lo, hi, dflt) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= lo && n <= hi ? n : dflt;
};

// Tick every 175 m; labels on every nth tick, about five of them, plus the
// end of the scale when it isn't crowding the last one.
export function distanceScale(maxD) {
  const hexes = maxD / HEX;
  const every = Math.max(1, Math.ceil(hexes / 5));
  const labelled = i => i % every === 0 || (i === hexes && hexes % every >= every / 2);
  const ticks = Array.from({ length: hexes + 1 }, (_, i) => ({ d: i * HEX, major: labelled(i) }));
  const labels = ticks.filter(tk => tk.major).map(tk => ({ d: tk.d, text: tk.d === maxD ? `${tk.d} m` : String(tk.d) }));
  return { ticks, labels };
}

// The weapon to show: the chosen one if it's usable, else the first one that
// is. The choice is kept so it comes back when it's usable again.
export function effectiveWeapon(idx, usable) {
  if (usable[idx]) return idx;
  const first = usable.indexOf(true);
  return first >= 0 ? first : Math.min(idx, Math.max(0, usable.length - 1));
}
