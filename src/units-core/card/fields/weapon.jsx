import React from 'react';
import { GREEN, RED, accuracyColor, apColor, heColor, missileSpeedColor, suppressionColor } from '../../format/tiers.js';
import {
  rofString, isLongRof, formatRearm, formatSupply, heMissileTooltip, heCategory, hasHE,
} from '../../format/weapon.js';
import { vetAccuracy } from '../../format/accuracy.js';
import {
  hasTag, isMissile, isBomb, isAreaWeapon, showsAccuracy, hasStabilizer, showsAp,
} from '../rules.js';

// Weapon rows. Spec functions get (w, ctx), where ctx holds the card theme `s`,
// the veterancy tier `vet`, and the per-card overrides WeaponBlock passes on:
// `effectiveAp` and `apNote` replace the AP value and its tooltip,
// `baseAccuracyOnly` drops the veterancy-adjusted accuracy, and
// `sharedTurrets` is the set of turret indexes used by more than one weapon.

const BASE_URL = import.meta.env.BASE_URL;

// Each category has its own set of range rows; Range S follows for any weapon
// that can hit ships.
function rangeRows(w) {
  const m    = v   => `${v} m`;
  const span = max => (w.minRange ? `${w.minRange} – ${max} m` : `${max} m`);
  const rows = [];
  switch (w.category) {
    case 'Gun':
      if (w.rng_gAP != null) rows.push({ label: 'Range G AP', value: m(w.rng_gAP) });
      else if (w.rng_g > 0)  rows.push({ label: 'Range G',    value: m(w.rng_g) });
      if (w.rng_gHE != null) rows.push({ label: 'Range G HE', value: m(w.rng_gHE) });
      if (w.rng_h > 0)       rows.push({ label: 'Range H',    value: m(w.rng_h) });
      if (w.rng_a > 0)       rows.push({ label: 'Range A',    value: m(w.rng_a) });
      break;
    case 'Missile':
      for (const [label, max] of [['Range G', w.rng_g], ['Range H', w.rng_h], ['Range A', w.rng_a]]) {
        if (max > 0) rows.push({ label, value: span(max) });
      }
      break;
    case 'Artillery':
      rows.push({ label: 'Range', value: span(w.maxRange) });
      break;
    case 'Bomb':
      if (w.rng_g != null) rows.push({ label: 'Range G', value: m(w.rng_g) });
      break;
  }
  if (w.rng_s != null) rows.push({ label: 'Range S', value: span(w.rng_s) });
  return rows;
}

// "base% → vet%", or just the base value when the tool computes with base accuracy.
function withVet(base, { vet, baseAccuracyOnly }, what) {
  if (baseAccuracyOnly) return `${base}%`;
  return (
    <>{base}%{'  →  '}<span title={`${what} with the veterancy bonus applied.`} style={{ cursor: 'help' }}>
      {vetAccuracy(base, vet.accMul)}%
    </span></>
  );
}

// KE and HEAT AP link to the AP damage tool; the kind follows the value.
function apValue(w, { effectiveAp }) {
  const ap   = effectiveAp ?? w.ap;
  const isKE = hasTag(w, 'KE');
  if (!isKE && !hasTag(w, 'HEAT')) return `${ap}`;
  const kind = isKE ? ' KE' : ' HEAT';
  const params = new URLSearchParams({ aps: w.ap });
  if (isKE) params.set('mode', 'KE');
  const href = `${BASE_URL}apdamage/?${params}`;
  return <><a href={href} style={{ color: 'inherit', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{ap}</a>{kind}</>;
}

// Missile speed and acceleration come as AP/HE pairs or a single value.
const missileVariants = (label, keys, { format = v => v, accent } = {}) => w =>
  [[`${label} AP`, w[keys[0]]], [`${label} HE`, w[keys[1]]], [label, w[keys[2]]]]
    .filter(([, v]) => v != null)
    .map(([l, v]) => ({ label: l, value: format(v), accent: accent?.(v) }));

export const WEAPON_FIELDS = [
  { id: 'weaponRange', range: true, rows: rangeRows },

  { id: 'weaponAccuracy', label: 'Accuracy',
    when:    w => w.acc != null && showsAccuracy(w),
    value:   (w, ctx) => withVet(w.acc, ctx, 'Accuracy'),
    accent:  w => accuracyColor(w.acc),
    accMode: { mode: 'acc', title: 'Use accuracy (firing while stopped)' } },
  { id: 'weaponStabilizer', label: 'Stabilizer',
    when:    w => hasStabilizer(w) && w.stab != null,
    value:   (w, ctx) => (w.stab === 0 ? '—' : withVet(w.stab, ctx, 'Stabilizer')),
    accent:  w => (w.stab === 0 ? null : accuracyColor(w.stab)),
    accMode: { mode: 'stab', title: 'Use stabilizer (firing on the move)' } },

  // turreted is only set for some weapons; unset shows no row.
  { id: 'weaponTurreted', label: 'Turreted',
    when:    w => typeof w.turreted === 'boolean',
    value:   w => (w.turreted ? 'YES' : 'NO'),
    accent:  w => (w.turreted ? GREEN : RED),
    tooltip: w => (w.turreted ? 'This gun can fire without rotating the hull.' : "This gun can't fire without rotating the hull.") },
  // Only shown when another weapon shares the turret.
  { id: 'weaponTurretIndex', label: 'Turret Group',
    when:    (w, { sharedTurrets }) => sharedTurrets?.has(w.turret_index),
    value:   w => w.turret_index,
    tooltip: "Weapons with the same turret group can't fire at the same time." },

  { id: 'weaponAp', label: 'AP Power', damage: 'AP',
    when:    w => w.ap != null && showsAp(w),
    value:   apValue,
    accent:  (w, { effectiveAp }) => apColor(effectiveAp ?? w.ap, hasTag(w, 'KE')),
    tooltip: (w, { apNote }) => apNote },
  { id: 'weaponHe', label: 'HE Power', damage: 'HE',
    when:    hasHE,
    value:   w => w.dmg,
    accent:  w => heColor(w.dmg, heCategory(w)),
    tooltip: w => (heCategory(w) === 'Missile' ? heMissileTooltip(w.dmg) : null) },

  // Split AP/HE suppression replaces the single value.
  { id: 'weaponSuppress', label: 'Suppression AP',
    when: w => w.suppressAP != null, value: w => w.suppressAP, accent: w => suppressionColor(w.suppressAP) },
  { id: 'weaponSuppress', label: 'Suppression HE',
    when: w => w.suppressHE != null, value: w => w.suppressHE, accent: w => suppressionColor(w.suppressHE) },
  { id: 'weaponSuppress', label: 'Suppression',
    when: w => w.suppressAP == null && w.suppress > 0, value: w => w.suppress, accent: w => suppressionColor(w.suppress) },

  { id: 'weaponDispersion', label: 'Dispersion',
    when:  w => w.category === 'Artillery' && w.dispersion != null,
    value: w => (w.dispersionMin != null && w.dispersionMin !== w.dispersion
      ? `${w.dispersionMin} – ${w.dispersion} m`
      : `${w.dispersion} m`) },
  { id: 'weaponDmgRadius', label: 'Dmg Radius', expert: w => !isAreaWeapon(w),
    when: w => w.dmgRadius != null, value: w => `${w.dmgRadius} m` },
  { id: 'weaponSuppRadius', label: 'Supp Radius', expert: w => !isAreaWeapon(w),
    when: w => w.suppRadius != null, value: w => `${w.suppRadius} m` },

  { id: 'weaponMissileSpeed', when: isMissile,
    rows: missileVariants('Missile Speed', ['missileSpeedAP', 'missileSpeedHE', 'missileSpeed'], { accent: missileSpeedColor }) },
  { id: 'weaponMissileAccel', when: isMissile, expert: true,
    rows: missileVariants('Missile Accel', ['missileAccelAP', 'missileAccelHE', 'missileAccel'], { format: v => `${v} m/s²` }) },

  { id: 'weaponAimTime', label: 'Aim Time AP', damage: 'AP',
    when: w => !isBomb(w) && w.aimTimeAP != null, value: w => `${w.aimTimeAP} s` },
  { id: 'weaponAimTime', label: 'Aim Time HE', damage: 'HE',
    when: w => !isBomb(w) && w.aimTimeHE != null, value: w => `${w.aimTimeHE} s` },
  { id: 'weaponAimTime', label: 'Aim Time',
    when: w => !isBomb(w) && w.aimTime != null, value: w => `${w.aimTime} s` },
  // Weapons that fire in salvos show the shot interval and salvo reload;
  // [AL] marks an autoloader.
  { id: 'weaponRof',
    when:    w => !isBomb(w),
    label:   w => (isLongRof(w) ? 'RoF' : 'Reload'),
    value:   w => `${rofString(w)}${hasTag(w, 'AUTO') ? '  [AL]' : ''}`,
    tooltip: w => (isLongRof(w) ? 'rounds × shot interval ↺ salvo reload' : undefined) },
  { id: 'weaponSalvoSize', label: 'Salvo Size',
    when: w => isBomb(w) && w.salvoLen != null && w.salvoLen !== w.ammo, value: w => w.salvoLen },

  { id: 'weaponNoise', label: 'Noise', expert: true,
    when:    w => w.noise != null,
    value:   w => w.noise.toFixed(1),
    tooltip: 'The factor by which your stealth is decreased when the weapon fires.' },

  { id: 'weaponRearm', label: 'Rearm Time',
    when: w => w.rearmTime != null, value: w => formatRearm(w).value, tooltip: w => formatRearm(w).tooltip },
  { id: 'weaponSupply', label: 'Supply',
    when: w => w.supplyPerShot > 0, value: w => formatSupply(w).value, tooltip: w => formatSupply(w).tooltip },
];
