// accMul scales the erfinv of accuracy, not the percentage itself: each
// veterancy level cuts dispersion by 10%, so accMul = 1 / (1 - 0.1 * level).
export const VET_TIERS = [
  { id: 'RKI', label: 'RKI', accMul: 1 },
  { id: 'TRN', label: 'TRN', accMul: 1 / 0.9 },
  { id: 'HRD', label: 'HRD', accMul: 1 / 0.8 },
  { id: 'VET', label: 'VET', accMul: 1 / 0.7 },
  { id: 'ELI', label: 'ELI', accMul: 1 / 0.6 },
];

export const VET_TOOLTIPS = [
  'No Bonus',
  '-10% dispersion on artillery shots\n+150% faster morale recovery\n+5% more chances to see and identify enemy units\n-19% stun effect duration',
  '-19% dispersion on artillery shots\n+200% faster morale recovery\n+10% more chances to see and identify enemy units\n-39% stun effect duration',
  '-30% dispersion on artillery shots\n+250% faster morale recovery\n+15% more chances to see and identify enemy units\n-60% stun effect duration',
  '-39% dispersion on artillery shots\n+300% faster morale recovery\n+20% more chances to see and identify enemy units\n-80% stun effect duration',
];
