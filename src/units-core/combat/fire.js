// When a weapon fires.

// Aim time before the first shot. Guns with separate AP and HE rounds aim
// each one differently.
export function aimTime(w, kind) {
  const split = kind === 'HE' ? w.aimTimeHE : w.aimTimeAP;
  return split ?? w.aimTime ?? w.aimTimeAP ?? 0;
}

const MAX_SHOTS = 10000;

// Times (s) of the shots fired in the first `seconds` of an engagement,
// starting loaded. The first shot leaves after the aim time. Shots in a salvo
// are shotReload apart and a salvo cycle takes salvoLen × shotReload +
// salvoReload, the same as the card's RoF. Capped at the ammo count; missile
// flight time isn't counted.
export function shotTimes(w, seconds, kind) {
  const perSalvo = Math.max(1, w.salvoLen ?? 1);
  const uniform = perSalvo === 1 || w.shotReload == null || w.shotReload === w.salvoReload;
  const gap = Math.max(0.01, uniform ? w.salvoReload ?? 0 : w.shotReload);
  const cycle = uniform ? gap * perSalvo : perSalvo * w.shotReload + (w.salvoReload ?? 0);
  const cap = Math.min(w.ammo > 0 ? w.ammo : MAX_SHOTS, MAX_SHOTS);
  const aim = aimTime(w, kind);

  const times = [];
  for (let i = 0; i < cap; i++) {
    const t = aim + Math.floor(i / perSalvo) * cycle + (i % perSalvo) * gap;
    if (t > seconds + 1e-9) break;
    times.push(t);
  }
  return times;
}
