import { hitChance } from './hit.js';
import { canEngage } from './targeting.js';
import { damagePerHit } from './damage.js';
import { shotTimes } from './fire.js';
import { damageOutcome } from './outcome.js';

// Whether the weapon can hurt the target at all: it can engage it and, against
// armor, has the AP for the facing it hits.
export function canDamage(w, target, facing) {
  const eng = canEngage(w, target);
  if (!eng.ok) return eng;
  const d = damagePerHit(w, target, { facing, range: eng.range });
  return d.ok ? eng : { ...eng, ok: false, reason: d.reason };
}

// One weapon firing at the target for `seconds` at a fixed distance.
// cond: hitChance's { distance, vetIdx, morale, mode } plus { facing, cover, seconds }.
// Returns { ok, reason, hit (hitChance result), damage (damagePerHit result),
// times (shot times), outcome (damageOutcome result) }.
export function engagement(w, target, cond) {
  const hit = hitChance(w, target, cond);
  const damage = w ? damagePerHit(w, target, { facing: cond.facing, cover: cond.cover, distance: cond.distance, range: hit.range }) : null;
  const reason = hit.ok ? (damage.ok ? null : damage.reason) : hit.reason;
  if (reason) return { ok: false, reason, hit, damage, times: [], outcome: null };

  const times = shotTimes(w, cond.seconds, damage.kind === 'HE' ? 'HE' : 'AP');
  const outcome = damageOutcome({ shots: times.length, p: hit.frac, dmg: damage.dmg, hp: target.health ?? 10 });
  return { ok: true, reason: null, hit, damage, times, outcome };
}
