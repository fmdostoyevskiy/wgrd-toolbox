// Damage dealt by a number of shots, as a distribution.

// P(k hits) for k = 0..n, in log space so long bursts don't underflow.
function binomial(n, p) {
  if (p <= 0) return Array.from({ length: n + 1 }, (_, k) => (k === 0 ? 1 : 0));
  if (p >= 1) return Array.from({ length: n + 1 }, (_, k) => (k === n ? 1 : 0));
  const lp = Math.log(p), lq = Math.log(1 - p);
  const out = [];
  let logC = 0;
  for (let k = 0; k <= n; k++) {
    out.push(Math.exp(logC + k * lp + (n - k) * lq));
    logC += Math.log(n - k) - Math.log(k + 1);
  }
  return out;
}

// Worst and best case are the 10th and 90th percentile: nine engagements in
// ten do at least the worst case, one in ten does the best case or more.
export const WORST_Q = 0.1;
export const BEST_Q = 0.9;

// shots: number fired; p: hit chance of each; dmg: damage per hit; hp: the
// target's health. Damage is capped at hp.
// Returns { shots, hits (expected), mean, worst, best, worstHits, bestHits,
// killHits (hits needed to kill, Infinity if it can't), kill (chance) }.
export function damageOutcome({ shots, p, dmg, hp }) {
  const pmf = binomial(shots, p);
  const dealt = k => Math.min(hp, k * dmg);
  const quantile = q => {
    let acc = 0;
    for (let k = 0; k <= shots; k++) {
      acc += pmf[k];
      if (acc >= q - 1e-12) return k;
    }
    return shots;
  };
  const killHits = dmg > 0 ? Math.ceil(hp / dmg - 1e-9) : Infinity;
  let mean = 0, kill = 0;
  pmf.forEach((pk, k) => {
    mean += pk * dealt(k);
    if (k >= killHits) kill += pk;
  });
  const worstHits = quantile(WORST_Q), bestHits = quantile(BEST_Q);
  return {
    shots, hits: shots * p, mean,
    worst: dealt(worstHits), best: dealt(bestHits), worstHits, bestHits,
    killHits, kill: Math.min(1, kill),
  };
}
