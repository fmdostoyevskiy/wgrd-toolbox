export const GROUND_OPTICS = [
  { v: 40,  label: 'Bad' },
  { v: 60,  label: 'Poor' },
  { v: 80,  label: 'Medium' },
  { v: 120, label: 'Good' },
  { v: 170, label: 'Very Good' },
  { v: 220, label: 'Exceptional' },
];

export const STEALTH = [
  { v: 1,    label: 'Poor' },
  { v: 1.5,  label: 'Medium' },
  { v: 1.6,  label: 'Tiger' },
  { v: 1.75, label: 'Ninja' },
  { v: 2,    label: 'Good' },
  { v: 2.5,  label: 'Very Good' },
  { v: 3,    label: 'Exceptional' },
];

// Air mode stealth: no Very Good, adds Mig-29M (1.25)
export const STEALTH_AIR = [
  { v: 1,    label: 'Poor' },
  { v: 1.25, label: 'Mig-29M' },
  { v: 1.5,  label: 'Medium' },
  { v: 1.6,  label: 'Tiger' },
  { v: 1.75, label: 'Ninja' },
  { v: 2,    label: 'Raven' },
  { v: 3,    label: 'Nighthawk' },
];

export const COVER = [
  { v: 1, label: 'No Cover' },
  { v: 3, label: 'Forest' },
  { v: 4, label: 'Urban' },
];

export const AIR_OPTICS = {
  ground: [
    { v: 20,  label: 'Tanks' },
    { v: 40,  label: 'Infantry' },
    { v: 80,  label: 'Manpads' },
    { v: 120, label: 'Good' },
    { v: 250, label: 'Very Good' },
  ],
  heli: [
    { v: 80,  label: 'Medium' },
    { v: 120, label: 'Good' },
    { v: 170, label: 'Very Good' },
  ],
  plane: [
    { v: 150, label: 'Good' },
    { v: 300, label: 'Very Good' },
    { v: 450, label: 'Exceptional' },
    { v: 900, label: 'Exceptional++' },
  ],
};

// Spotting caps by spotter type and optics/stealth combination
function getCap(O, S, isHeli) {
  if (isHeli) {
    if (O === 120 && S === 1) return 4500;
    if ((O === 170 || O === 220) && S === 1) return 4900;
    if (O === 220 && S === 1.5) return 4900;
    return 4200;
  }
  return O === 220 ? 4200 : 3500;
}

// formula: (37.5 * O) / ((S / N) * C)
export function calcRange({ O, S, N, C = 1, mode = 'ground', isHeli = false }) {
  const raw = (37.5 * O) / ((S / N) * C);
  if (mode === 'air') return { raw, capped: raw, capHit: false };
  const cap = getCap(O, S, isHeli);
  return { raw, capped: Math.min(raw, cap), capHit: raw >= cap, cap };
}

// classify distance into a color tier
export function tier(d) {
  if (!isFinite(d) || d <= 0) return 'min';
  if (d < 500)  return 'near';
  if (d < 1500) return 'mid';
  if (d < 3000) return 'far';
  return 'cap';
}

// Arc colors for radar — bright versions of the same 5 tiers, mode-aware
const ARC_THRESHOLDS = {
  ground: [
    [1500,     '#ef4444'],  // dark red
    [2275,     '#f87171'],  // red
    [2975,     '#e8a852'],  // orange
    [3325,     '#4ade80'],  // green
    [Infinity, '#2dd4bf'],  // teal
  ],
  air: [
    [2000,     '#ef4444'],  // dark red
    [3200,     '#f87171'],  // red
    [5625,     '#e8a852'],  // orange
    [11250,    '#4ade80'],  // green
    [Infinity, '#2dd4bf'],  // teal
  ],
};

export function arcColor(d, mode = 'ground') {
  if (!isFinite(d) || d <= 0) return '#4a5d75';
  for (const [cutoff, color] of ARC_THRESHOLDS[mode] ?? ARC_THRESHOLDS.ground) {
    if (d < cutoff) return color;
  }
  return '#2dd4bf';
}

// Heatmap background — discrete cutoffs by mode
const HEAT_THRESHOLDS = {
  ground: [
    [1500,     '#5c1111'],  // dark red
    [2275,     '#991b1b'],  // red
    [2975,     '#92400e'],  // orange
    [3325,     '#166534'],  // green
    [Infinity, '#0f766e'],  // teal
  ],
  air: [
    [2000,     '#5c1111'],  // dark red
    [3200,     '#991b1b'],  // red
    [5625,     '#92400e'],  // orange
    [11250,    '#166534'],  // green
    [Infinity, '#0f766e'],  // teal
  ],
};

export function heatBg(d, mode = 'ground') {
  if (!isFinite(d) || d <= 0) return '#0d1010';
  for (const [cutoff, color] of HEAT_THRESHOLDS[mode] ?? HEAT_THRESHOLDS.ground) {
    if (d < cutoff) return color;
  }
  return '#0f766e';
}

export const HEAT_LEGEND = {
  ground: [
    { color: '#5c1111', label: '<1 500m' },
    { color: '#991b1b', label: '<2 275m' },
    { color: '#92400e', label: '<2 975m' },
    { color: '#166534', label: '<3 325m' },
    { color: '#0f766e', label: '3 325m+' },
  ],
  air: [
    { color: '#5c1111', label: '<2 000m'  },
    { color: '#991b1b', label: '<3 200m'  },
    { color: '#92400e', label: '<5 625m'  },
    { color: '#166534', label: '<11 250m' },
    { color: '#0f766e', label: '11 250m+' },
  ],
};

export function fmt0(d) { return Math.round(d).toLocaleString(); }
