import React from 'react';
import { DotRow } from '../primitives/DotRow.jsx';
import { GREEN, RED, accuracyColor, apColor, heColor, missileSpeedColor, suppressionColor } from '../../format/tiers.js';
import {
  rofString, isLongRof, formatRearm, formatSupply, heMissileTooltip,
} from '../../format/weapon.js';
import { useHide } from '../HideContext.js';
import { useExpertMode } from '../ExpertModeContext.js';
import { CaptureButton } from '../primitives/CaptureButton.jsx';

const HEADER_TAG_BLACKLIST = new Set(['KE', 'HEAT', 'STAT', 'AUTO']);

function rangeRows(w, s) {
  const rng = (label, max) => {
    if (max == null || max <= 0) return null;
    const v = w.minRange ? `${w.minRange} – ${max} m` : `${max} m`;
    return <DotRow key={label} label={label} value={v} s={s} dense />;
  };

  switch (w.category) {
    case 'Gun':
      return [
        w.rng_gAP != null
          ? <DotRow key="rg-ap" label="Range G AP" value={`${w.rng_gAP} m`} s={s} dense />
          : (w.rng_g > 0 && <DotRow key="rg" label="Range G" value={`${w.rng_g} m`} s={s} dense />),
        w.rng_gHE != null && <DotRow key="rg-he" label="Range G HE" value={`${w.rng_gHE} m`} s={s} dense />,
        w.rng_h > 0 && <DotRow key="rh" label="Range H" value={`${w.rng_h} m`} s={s} dense />,
        w.rng_a > 0 && <DotRow key="ra" label="Range A" value={`${w.rng_a} m`} s={s} dense />,
      ];
    case 'Missile':
      return [rng('Range G', w.rng_g), rng('Range H', w.rng_h), rng('Range A', w.rng_a)];
    case 'Artillery':
      return [
        <DotRow key="ra" label="Range" value={w.minRange ? `${w.minRange} – ${w.maxRange} m` : `${w.maxRange} m`} s={s} dense />
      ];
    case 'Bomb':
      return w.rng_g != null
        ? [<DotRow key="rg" label="Range G" value={`${w.rng_g} m`} s={s} dense />]
        : [];
    default:
      return [];
  }
}

const TWO_OVER_SQRT_PI = 2 / Math.sqrt(Math.PI);

// erf(x) = 2/sqrt(pi) * e^(-x^2) * sum 2^n x^(2n+1) / (1*3*...*(2n+1)).
// All terms are positive, so there's no cancellation at large x.
function erf(x) {
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
function erfinv(y) {
  let x = y < 0.9 ? y : Math.sqrt(-Math.log(1 - y));
  for (let i = 0; i < 50; i++) {
    const step = (erf(x) - y) / (TWO_OVER_SQRT_PI * Math.exp(-x * x));
    x -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return x;
}

// Game formula: hit = erf(accMul * erfinv(base) * maxRange / range), shown floored.
// On the card range = maxRange. Fitted to in-game hit-chance measurements.
function vet_accuracy(base, accMul) {
  if (base <= 0) return 0;
  if (base >= 100) return 100;
  return Math.floor(100 * erf(accMul * erfinv(base / 100)) + 1e-9);
}

export function WeaponBlock({ w, vet, s, sharedTurrets, weaponIdx, onCapture }) {
  const hide = useHide();
  const { expert } = useExpertMode();
  const tags    = w.tag ?? [];
  const hasKE   = tags.includes('KE');
  const hasHEAT = tags.includes('HEAT');
  const hasAuto = tags.includes('AUTO');
  const apInlineTag = hasKE ? ' KE' : hasHEAT ? ' HEAT' : '';
  // Radar autocannons (SPAAGs, ship CIWS) are categorised as missiles in the game data.
  const isRadarGun  = w.category === 'Missile' && tags.includes('RAD')
    && !tags.includes('GUID') && !tags.includes('FnF');
  const heCategory  = isRadarGun ? 'Gun' : w.category;
  const headerTags  = tags.filter(t => !HEADER_TAG_BLACKLIST.has(t));

  const modAcc  = w.acc  != null ? vet_accuracy(w.acc, vet.accMul) : null;
  const modStab = w.stab != null ? vet_accuracy(w.stab, vet.accMul) : null;
  const longRof = isLongRof(w);

  const accValue = w.acc != null && (
    <>{w.acc}%{'  →  '}<span title="Accuracy with the veterancy bonus applied." style={{ cursor: 'help' }}>{modAcc}%</span></>
  );
  const stabValue = w.stab != null && w.stab !== 0 && (
    <>{w.stab}%{'  →  '}<span title="Stabilizer with the veterancy bonus applied." style={{ cursor: 'help' }}>{modStab}%</span></>
  );

  const rearm = w.rearmTime  != null ? formatRearm(w)  : null;
  const supply = (w.supplyPerShot != null && w.supplyPerShot > 0) ? formatSupply(w) : null;

  return (
    <div data-weapon-idx={weaponIdx} style={{ margin: '10px 0 12px', border: `1px solid ${s.rule}`, background: s.paper }}>
      <div style={{
        padding: '8px 12px', borderBottom: `1px solid ${s.rule}`,
        background: s.paper,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, minWidth: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{w.name}</div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'baseline' }}>
            {headerTags.map(tag => (
              <span key={tag} style={{
                fontSize: 9.5, color: s.ok, border: `1px solid ${s.ok}`,
                padding: '1px 5px', letterSpacing: '0.08em',
              }}>[{tag}]</span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
          <div style={{ fontSize: 11, color: s.dim }}>
            {w.caliber != null ? `${w.caliber} × ${w.ammo}` : `× ${w.ammo}`}
          </div>
          <CaptureButton onCapture={onCapture} s={s} />
        </div>
      </div>

      <div className="sr" style={{ padding: '6px 12px 8px' }}>
        {hide.field('weaponRange') && rangeRows(w, s)}

        {hide.field('weaponRange') && w.rng_s != null && (
          <DotRow label="Range S" value={w.minRange ? `${w.minRange} – ${w.rng_s} m` : `${w.rng_s} m`} s={s} dense />
        )}

        {hide.field('weaponAccuracy') && accValue && w.category !== 'Artillery' && (
          <DotRow label="Accuracy" value={accValue} accent={accuracyColor(w.acc)} s={s} dense />
        )}

        {hide.field('weaponStabilizer') && (w.category === 'Gun' || w.category === 'Missile') && w.stab != null && (
          <DotRow label="Stabilizer"
            value={w.stab === 0 ? '—' : stabValue}
            accent={w.stab === 0 ? null : accuracyColor(w.stab)}
            s={s} dense />
        )}

        {hide.field('weaponTurreted') && w.turreted === true && (
          <DotRow label="Turreted" value="YES" accent={GREEN} tooltip="This gun can fire without rotating the hull." s={s} dense />
        )}
        {hide.field('weaponTurreted') && w.turreted === false && (
          <DotRow label="Turreted" value="NO" accent={RED} tooltip="This gun can't fire without rotating the hull." s={s} dense />
        )}

        {hide.field('weaponTurretIndex') && sharedTurrets?.has(w.turret_index) && (
          <DotRow label="Turret Group" value={w.turret_index} tooltip="Weapons with the same turret group can't fire at the same time." s={s} dense />
        )}

        {hide.field('weaponAp') && w.ap != null && w.category !== 'Artillery' && (
          <DotRow label="AP Power" value={(() => {
            if (!hasKE && !hasHEAT) return `${w.ap}${apInlineTag}`;
            const params = new URLSearchParams({ aps: w.ap });
            if (hasKE) params.set('mode', 'KE');
            const href = `${import.meta.env.BASE_URL}apdamage/?${params}`;
            return <><a href={href} style={{ color: 'inherit', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{w.ap}</a>{apInlineTag}</>;
          })()} accent={apColor(w.ap, hasKE)} s={s} dense />
        )}

        {hide.field('weaponHe') && w.dmg > 0 && !(heCategory === 'Missile' && w.dmg === 1) && (
          <DotRow label="HE Power" value={w.dmg}
            accent={heColor(w.dmg, heCategory)}
            tooltip={heCategory === 'Missile' ? heMissileTooltip(w.dmg) : null}
            s={s} dense />
        )}

        {hide.field('weaponSuppress') && w.suppressAP != null && (
          <DotRow label="Suppression AP" value={w.suppressAP} accent={suppressionColor(w.suppressAP)} s={s} dense />
        )}
        {hide.field('weaponSuppress') && w.suppressHE != null && (
          <DotRow label="Suppression HE" value={w.suppressHE} accent={suppressionColor(w.suppressHE)} s={s} dense />
        )}
        {hide.field('weaponSuppress') && w.suppressAP == null && w.suppress != null && w.suppress > 0 && (
          <DotRow label="Suppression" value={w.suppress} accent={suppressionColor(w.suppress)} s={s} dense />
        )}

        {hide.field('weaponDispersion') && w.category === 'Artillery' && w.dispersion != null && (
          w.dispersionMin != null && w.dispersionMin !== w.dispersion
            ? <DotRow label="Dispersion" value={`${w.dispersionMin} – ${w.dispersion} m`} s={s} dense />
            : <DotRow label="Dispersion" value={`${w.dispersion} m`} s={s} dense />
        )}

        {hide.field('weaponDmgRadius') && w.dmgRadius != null &&
          ((w.category === 'Artillery' || w.category === 'Bomb') || expert) && (
          <DotRow label="Dmg Radius" value={`${w.dmgRadius} m`} s={s} dense />
        )}
        {hide.field('weaponSuppRadius') && w.suppRadius != null &&
          ((w.category === 'Artillery' || w.category === 'Bomb') || expert) && (
          <DotRow label="Supp Radius" value={`${w.suppRadius} m`} s={s} dense />
        )}

        {hide.field('weaponMissileSpeed') && w.category === 'Missile' && [
          ['Missile Speed AP', w.missileSpeedAP],
          ['Missile Speed HE', w.missileSpeedHE],
          ['Missile Speed',    w.missileSpeed],
        ].map(([label, v]) => v != null && (
          <DotRow key={label} label={label} value={v} accent={missileSpeedColor(v)} s={s} dense />
        ))}
        {hide.field('weaponMissileAccel') && w.category === 'Missile' && expert && [
          ['Missile Accel AP', w.missileAccelAP],
          ['Missile Accel HE', w.missileAccelHE],
          ['Missile Accel',    w.missileAccel],
        ].map(([label, v]) => v != null && (
          <DotRow key={label} label={label} value={`${v} m/s²`} s={s} dense />
        ))}

        {w.category !== 'Bomb' && (
          <>
            {hide.field('weaponAimTime') && w.aimTimeAP != null && <DotRow label="Aim Time AP" value={`${w.aimTimeAP} s`} s={s} dense />}
            {hide.field('weaponAimTime') && w.aimTimeHE != null && <DotRow label="Aim Time HE" value={`${w.aimTimeHE} s`} s={s} dense />}
            {hide.field('weaponAimTime') && w.aimTime != null && <DotRow label="Aim Time" value={`${w.aimTime} s`} s={s} dense />}
            {hide.field('weaponRof') && (
              <DotRow
                label={longRof ? 'RoF' : 'Reload'}
                value={`${rofString(w)}${hasAuto ? '  [AL]' : ''}`}
                tooltip={longRof ? 'rounds × shot interval ↺ salvo reload' : undefined}
                s={s} dense />
            )}
          </>
        )}

        {hide.field('weaponSalvoSize') && w.category === 'Bomb' && w.salvoLen != null && w.salvoLen !== w.ammo && (
          <DotRow label="Salvo Size" value={w.salvoLen} s={s} dense />
        )}

        {hide.field('weaponNoise') && w.noise != null && expert && (
          <DotRow label="Noise" value={w.noise.toFixed(1)}
            tooltip="The factor by which your stealth is decreased when the weapon fires."
            s={s} dense />
        )}

        {hide.field('weaponRearm') && rearm && <DotRow label="Rearm Time" value={rearm.value} tooltip={rearm.tooltip} s={s} dense />}
        {hide.field('weaponSupply') && supply && <DotRow label="Supply"     value={supply.value} tooltip={supply.tooltip} s={s} dense />}
      </div>
    </div>
  );
}
