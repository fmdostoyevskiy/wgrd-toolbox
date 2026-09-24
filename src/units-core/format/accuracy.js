const TWO_OVER_SQRT_PI = 2 / Math.sqrt(Math.PI);

// erf(x) = 2/sqrt(pi) * e^(-x^2) * sum 2^n x^(2n+1) / (1*3*...*(2n+1)).
// All terms are positive, so there's no cancellation at large x.
export function erf(x) {
  if (x < 0) return -erf(-x);
  if (x > 6) return 1;
  let term = x, sum = x;
  for (let n = 1; term > sum * 1e-17; n++) {
    term *= 2 * x * x / (2 * n + 1);
    sum += term;
  }
  return TWO_OVER_SQRT_PI * Math.exp(-x * x) * sum;
}

// Newton iteration on erf; y is in [0, 1).
export function erfinv(y) {
  let x = y < 0.9 ? y : Math.sqrt(-Math.log(1 - y));
  for (let i = 0; i < 50; i++) {
    const step = (erf(x) - y) / (TWO_OVER_SQRT_PI * Math.exp(-x * x));
    x -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return x;
}

// Game formula: hit = erf(accMul * erfinv(base) * maxRange / range), as a
// fraction. rangeMul is maxRange / range (1 at max range). Fitted to in-game
// hit-chance measurements.
export function scaledAccuracy(base, accMul, rangeMul = 1) {
  if (base <= 0) return 0;
  if (base >= 100) return 1;
  return erf(accMul * erfinv(base / 100) * rangeMul);
}

// Accuracy at max range with the veterancy bonus, floored as the game shows it.
export function vetAccuracy(base, accMul) {
  return Math.floor(100 * scaledAccuracy(base, accMul) + 1e-9);
}
