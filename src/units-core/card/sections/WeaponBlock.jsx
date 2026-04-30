import React from 'react';
import { DotRow } from '../primitives/DotRow.jsx';
import { accuracyColor, apColor, heColor, missileSpeedColor } from '../../format/tiers.js';
import {
  rofString, isLongRof, formatRearm, formatSupply, heMissileTooltip,
} from '../../format/weapon.js';
import { useHide } from '../HideContext.js';

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
        w.rng_g > 0 && <DotRow key="rg" label="Range G" value={`${w.rng_g} m`} s={s} dense />,
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

export function WeaponBlock({ w, vetMul, s }) {
  const hide = useHide();
  const tags    = w.tag ?? [];
  const hasKE   = tags.includes('KE');
  const hasHEAT = tags.includes('HEAT');
  const hasAuto = tags.includes('AUTO');
  const apInlineTag = hasKE ? ' KE' : hasHEAT ? ' HEAT' : '';
  const headerTags  = tags.filter(t => !HEADER_TAG_BLACKLIST.has(t));

  const modAcc  = w.acc  != null ? Math.floor(w.acc  * vetMul) : null;
  const modStab = w.stab != null ? Math.floor(w.stab * vetMul) : null;
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
    <div style={{ margin: '10px 0 12px', border: `1px solid ${s.rule}`, background: s.paper }}>
      <div style={{
        padding: '8px 12px', borderBottom: `1px solid ${s.rule}`,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 600, minWidth: 0,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{w.name}</div>
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {headerTags.map(tag => (
              <span key={tag} style={{
                fontSize: 9.5, color: s.ok, border: `1px solid ${s.ok}`,
                padding: '1px 5px', letterSpacing: '0.08em',
              }}>[{tag}]</span>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 11, color: s.dim, marginTop: 3 }}>
          {w.caliber != null ? `${w.caliber} × ${w.ammo}` : `× ${w.ammo}`}
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

        {hide.field('weaponAp') && w.ap != null && w.category !== 'Artillery' && (
          <DotRow label="AP Power" value={`${w.ap}${apInlineTag}`} accent={apColor(w.ap, hasKE)} s={s} dense />
        )}

        {hide.field('weaponHe') && w.dmg > 0 && !(w.category === 'Missile' && w.dmg === 1) && (
          <DotRow label="HE Power" value={w.dmg}
            accent={heColor(w.dmg, w.category)}
            tooltip={w.category === 'Missile' ? heMissileTooltip(w.dmg) : null}
            s={s} dense />
        )}

        {hide.field('weaponSuppress') && w.suppress != null && w.suppress > 0 && (
          <DotRow label="Suppression" value={w.suppress} s={s} dense />
        )}

        {hide.field('weaponDispersion') && w.category === 'Artillery' && w.dispersion != null && (
          w.dispersionMin != null && w.dispersionMin !== w.dispersion
            ? <DotRow label="Dispersion" value={`${w.dispersionMin} – ${w.dispersion} m`} s={s} dense />
            : <DotRow label="Dispersion" value={`${w.dispersion} m`} s={s} dense />
        )}

        {hide.field('weaponDmgRadius') && (w.category === 'Artillery' || w.category === 'Bomb') && w.dmgRadius != null && (
          <DotRow label="Dmg Radius" value={`${w.dmgRadius} m`} s={s} dense />
        )}
        {hide.field('weaponSuppRadius') && (w.category === 'Artillery' || w.category === 'Bomb') && w.suppRadius != null && (
          <DotRow label="Supp Radius" value={`${w.suppRadius} m`} s={s} dense />
        )}

        {hide.field('weaponMissileSpeed') && w.category === 'Missile' && w.missileAccel != null && (
          <DotRow
            label="Missile Speed"
            value={`${w.missileAccel} / ${w.missileSpeed}`}
            accent={missileSpeedColor(w.missileSpeed)}
            tooltip="Acceleration / Max Speed"
            s={s} dense />
        )}

        {w.category !== 'Bomb' && (
          <>
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

        {hide.field('weaponNoise') && (w.category === 'Gun' || w.category === 'Missile') && w.noise != null && (
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
