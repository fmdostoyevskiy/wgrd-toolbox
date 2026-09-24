import { VET_TIERS } from '../constants/veterancy.js';
import { scaledAccuracy } from '../format/accuracy.js';
import { sizeInfo } from '../format/tiers.js';
import { MORALE } from './conditions.js';
import { canEngage, targetModifiers } from './targeting.js';

const pct1 = f => `${(Math.min(1, Math.max(0, f)) * 100).toFixed(1)}%`;

// Hit chance of one shot from weapon w at the target unit.
//   hit = erf(vet * erfinv(base) * maxRange / distance) * morale * (1 - ecm) * (1 + size)
// Base accuracy is the hit chance at max range, so closing in only raises it.
// Shots at planes get no range bonus.
//
// cond: { distance, vetIdx, morale (index into MORALE), mode: 'acc' | 'stab' }
// Returns { ok, reason, hit (floored %), frac, range, rangeLabel, steps }, where
// each step is { label, val: the modifier, res: the running hit chance }.
export function hitChance(w, target, { distance, vetIdx, morale, mode }) {
  const eng = canEngage(w, target);
  const { range, rangeLabel } = eng;
  const steps = [];
  const step = (label, val, res) => steps.push({ label, val, res: pct1(res) });
  const fail = reason => ({ ok: false, reason, hit: 0, frac: 0, range, rangeLabel, steps });

  if (!eng.ok) return fail(eng.reason);
  if (w.category === 'Artillery') return fail('INDIRECT FIRE');

  const base = mode === 'stab' ? w.stab : w.acc;
  if (base == null || base <= 0) return fail(mode === 'stab' ? 'NO STABILIZER' : 'NO ACCURACY');
  step(mode === 'stab' ? 'STABILIZER' : 'ACCURACY', `${base}%`, base / 100);

  if (distance > range) return fail('OUT OF RANGE');
  if (w.minRange && distance < w.minRange) return fail('BELOW MIN RANGE');

  const vet = VET_TIERS[vetIdx];
  step(`VETERANCY ${vet.name}`, `×${vet.accMul.toFixed(2)}`, scaledAccuracy(base, vet.accMul));

  const air = eng.domain === 'AIR';
  const rangeMul = air ? 1 : range / Math.max(distance, 1);
  let frac = scaledAccuracy(base, vet.accMul, rangeMul);
  step(
    air ? 'RANGE (AIR TARGET)' : `RANGE ${distance} / ${range} m`,
    `×${rangeMul >= 100 ? rangeMul.toFixed(0) : rangeMul.toFixed(2)}`,
    frac,
  );

  const m = MORALE[morale];
  frac *= m.mul;
  step(`MORALE ${m.label}`, `×${m.mul.toFixed(2)}`, frac);

  const { size, ecm } = targetModifiers(target);
  if (ecm) {
    frac *= 1 - ecm / 100;
    step(`TARGET ECM ${ecm}%`, `×${(1 - ecm / 100).toFixed(2)}`, frac);
  }
  if (size) {
    frac *= 1 + size;
    step(`TARGET SIZE ${sizeInfo(size).label.toUpperCase()}`, `×${(1 + size).toFixed(2)}`, frac);
  }

  frac = Math.min(1, Math.max(0, frac));
  return { ok: true, reason: null, hit: Math.floor(100 * frac + 1e-9), frac, range, rangeLabel, steps };
}
