import { byTier, OPTICS, STEALTH, AIR_STEALTH, AIR_OPTICS } from '../../format/tiers.js';

const BASE_URL = import.meta.env.BASE_URL;

function spotterType(tab) {
  if (tab === 'AIR') return 'plane';
  if (tab === 'HEL') return 'heli';
  return 'ground';
}

// Link to the optics tool with this value locked in.
function opticsHref(key, value, tab) {
  const p = new URLSearchParams();
  const isAir = key === 'airStealth' || key === 'airOptics';
  const isOptics = key === 'optics' || key === 'seaOptics' || key === 'airOptics';
  if (isAir) p.set('mode', 'air');
  if (isOptics) p.set('spotter', spotterType(tab));
  p.set(isOptics ? 'o' : 's', value);
  p.set('lock', isOptics ? 'optics' : 'stealth');
  return BASE_URL + 'optics/?' + p.toString();
}

// A row is shown when the value falls into one of the table's tiers.
const tiered = (key, label, table, { min = -Infinity } = {}) => ({
  id: key, label,
  when:   u => u[key] != null && u[key] >= min && byTier(u[key], table) != null,
  value:  u => `${byTier(u[key], table).label} (${u[key]})`,
  accent: u => byTier(u[key], table).color,
  href:   u => opticsHref(key, u[key], u.tab),
});

export const OPTICS_FIELDS = [
  tiered('stealth',    'Stealth',     STEALTH),
  tiered('optics',     'Optics',      OPTICS),
  tiered('seaOptics',  'Sea Optics',  OPTICS),
  tiered('airStealth', 'Air Stealth', AIR_STEALTH),
  // Air optics only shows from 20 up.
  tiered('airOptics',  'Air Optics',  AIR_OPTICS, { min: 20 }),
];
