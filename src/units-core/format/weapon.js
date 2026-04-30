export function rofString(w) {
  if (w.salvoLen === 1 || w.shotReload == null || w.shotReload === w.salvoReload) {
    const rpm = Math.round(60 / w.salvoReload);
    return `${w.salvoReload} s (${rpm} r/m)`;
  }
  const rpm = Math.round(w.salvoLen * 60 / (w.shotReload * w.salvoLen + w.salvoReload));
  return `${w.salvoLen}×${w.shotReload}s ↺ ${w.salvoReload}s (${rpm} r/m)`;
}

export function isLongRof(w) {
  return w.salvoLen > 1 && w.shotReload != null && w.shotReload !== w.salvoReload;
}

export function formatRearm(w) {
  const perShot   = w.rearmTime;
  const perSalvo  = parseFloat((w.rearmTime * (w.salvoLen ?? 1)).toFixed(2));
  const perFull   = parseFloat((w.rearmTime * w.ammo).toFixed(2));
  const showSalvo = perSalvo !== perFull && (w.salvoLen ?? 1) > 1;
  if (w.ammo <= 1) return { value: `${perShot} s`, tooltip: undefined };
  return showSalvo
    ? { value: `${perShot} / ${perSalvo} / ${perFull} s`, tooltip: 'per shot / per salvo / total' }
    : { value: `${perShot} / ${perFull} s`,                tooltip: 'per shot / total' };
}

export function formatSupply(w) {
  const perShot   = Math.round(w.supplyPerShot);
  const perSalvo  = Math.round(w.supplyPerShot * (w.salvoLen ?? 1));
  const perFull   = Math.round(w.supplyPerShot * w.ammo);
  const showSalvo = perSalvo !== perFull && (w.salvoLen ?? 1) > 1;
  return showSalvo
    ? { value: `${perShot} / ${perSalvo} / ${perFull} L`, tooltip: 'per shot / per salvo / per full load' }
    : { value: `${perShot} / ${perFull} L`,               tooltip: 'per shot / per full load' };
}

export function heMissileTooltip(val) {
  if (val == null) return null;
  if (val >= 8) return 'Will two-shot B-5s and instastun planes on hit.';
  if (val >= 5) return 'Will two-shot most planes.';
  if (val >= 4) return 'Will two-shot most helos.';
  return 'Will require 4 hits to kill a plane.';
}
