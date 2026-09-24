// Several weapons firing together: the damage dealt over time, as a
// distribution, stepping through every shot in time order.
import { WORST_Q, BEST_Q } from './outcome.js';

// Weapons on the same turret can't fire together. Returns [{ turret, idx: [weapon indices] }]
// in order of first appearance.
export function turretGroups(weapons) {
  const groups = [];
  (weapons ?? []).forEach((w, i) => {
    const turret = w.turret_index ?? i;
    const g = groups.find(x => x.turret === turret);
    if (g) g.idx.push(i); else groups.push({ turret, idx: [i] });
  });
  return groups;
}

// The weapons that fire, from the chosen ones: one per turret group, falling
// back to the group's first usable weapon when the chosen one can't fire, or
// to the first usable weapon at all when nothing chosen can. The choice is
// kept so it comes back when it's usable again.
export function effectiveSelection(chosen, groups, usable) {
  const out = [];
  for (const g of groups) {
    if (!g.idx.some(i => chosen.includes(i))) continue;
    const pick = g.idx.find(i => chosen.includes(i) && usable[i]) ?? g.idx.find(i => usable[i]);
    if (pick != null) out.push(pick);
  }
  if (out.length === 0) {
    const first = usable.indexOf(true);
    if (first >= 0) out.push(first);
  }
  return out.sort((a, b) => a - b);
}

// The weapon a turret group shows: the selected one, else its first usable
// one, else its first.
export const shownWeapon = (g, sel, usable) =>
  g.idx.find(i => sel.includes(i)) ?? g.idx.find(i => usable[i]) ?? g.idx[0];

// Damage is tracked in steps of the largest of these that every hit's damage
// is a whole number of, but in no more than MAX_BINS steps up to the target's
// health. With coarser steps, a hit that falls between two is split between
// them, which keeps the average exact.
const MAX_BINS = 4000;
const QUANTA = [1, 0.5, 0.25, 0.1, 0.05, 0.025, 0.01, 0.005, 0.001];
const quantum = dmgs => QUANTA.find(q => dmgs.every(d => Math.abs(d / q - Math.round(d / q)) < 1e-6)) ?? 0.001;

// shooters: [{ times (shot times, s), p (hit chance), dmg (per hit) }];
// hp: the target's health. Damage is capped at hp.
// Returns { steps, at, killAt } where steps is one entry per moment something
// changes, starting at t = 0: { t, mean, worst, best, kill, parts } (parts: each
// shooter's share of mean, split by its expected uncapped damage). at(t) is
// the step in force at t; killAt(q) the first time the kill chance reaches q,
// or null.
export function volley(shooters, hp) {
  const live = shooters.map((s, i) => ({ ...s, i })).filter(s => s.dmg > 0 && s.p > 0);
  const q = Math.max(quantum(live.map(s => s.dmg)), hp / MAX_BINS);
  const cap = Math.max(1, Math.ceil(hp / q - 1e-9));
  for (const s of live) {
    const x = s.dmg / q;
    s.m = Math.floor(x + 1e-9);
    s.fr = x - s.m > 1e-6 ? x - s.m : 0;
  }
  let top = 0;  // highest bin that can be non-zero
  const dist = new Float64Array(cap + 1);
  dist[0] = 1;

  const events = live
    // Rounded so float drift doesn't split shots at one moment or show in times.
    .flatMap(s => s.times.map(t => ({ t: Math.round(t * 1000) / 1000, s })))
    .sort((a, b) => a.t - b.t || a.s.i - b.s.i);
  const expected = shooters.map(() => 0);

  const snapshot = t => {
    let mean = 0, acc = 0, worst = null, best = null;
    for (let b = 0; b <= top; b++) {
      const v = dist[b];
      mean += v * Math.min(hp, b * q);
      acc += v;
      if (worst == null && acc >= WORST_Q - 1e-12) worst = Math.min(hp, b * q);
      if (best == null && acc >= BEST_Q - 1e-12) best = Math.min(hp, b * q);
    }
    const total = expected.reduce((a, b) => a + b, 0);
    return {
      t, mean, worst: worst ?? hp, best: best ?? hp, kill: Math.min(1, dist[cap]),
      parts: expected.map(x => (total > 0 ? mean * x / total : 0)),
    };
  };

  const steps = [snapshot(0)];
  for (let k = 0; k < events.length; k++) {
    const { t, s } = events[k];
    const { m, fr, p } = s;
    for (let b = top; b >= 0; b--) {
      const v = dist[b];
      if (!v) continue;
      dist[b] = v * (1 - p);
      dist[Math.min(cap, b + m)] += v * p * (1 - fr);
      if (fr) dist[Math.min(cap, b + m + 1)] += v * p * fr;
    }
    top = Math.min(cap, top + m + (fr ? 1 : 0));
    expected[s.i] += s.p * s.dmg;
    // Shots at the same moment make one step.
    if (events[k + 1]?.t === t) continue;
    if (t === 0) steps[0] = snapshot(0); else steps.push(snapshot(t));
  }

  const at = t => {
    let lo = 0, hi = steps.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (steps[mid].t <= t + 1e-9) lo = mid; else hi = mid - 1;
    }
    return steps[lo];
  };
  const killAt = p => steps.find(x => x.kill >= p - 1e-12)?.t ?? null;
  return { steps, at, killAt };
}
