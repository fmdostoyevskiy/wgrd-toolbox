import React from 'react';
import { DotRow } from '../primitives/DotRow.jsx';
import { GREEN, RED, accuracyColor, apColor, heColor, missileSpeedColor, suppressionColor } from '../../format/tiers.js';
import {
  rofString, isLongRof, formatRearm, formatSupply, heMissileTooltip,
  heCategory as weaponHeCategory, hasHE,
} from '../../format/weapon.js';
import { vetAccuracy } from '../../format/accuracy.js';
import { useHide } from '../HideContext.js';
import { useExpertMode } from '../ExpertModeContext.js';
import { CaptureButton } from '../primitives/CaptureButton.jsx';

const HEADER_TAG_BLACKLIST = new Set(['KE', 'HEAT', 'STAT', 'AUTO']);

// activeRange is the label of the range row to mark (e.g. 'Range G AP'); when
// it's set, the other range values are greyed out. onRange makes the rows
// clickable.
function rangeRows(w, s, activeRange, onRange) {
  const row = (label, v) => (
    <DotRow key={label} label={label} value={v} active={label === activeRange}
      accent={activeRange && label !== activeRange ? s.dim : undefined}
      onClick={onRange && (() => onRange(label))} clickTitle={onRange && `Use ${label.toLowerCase()}`}
      s={s} dense />
  );
  const rng = (label, max) => {
    if (max == null || max <= 0) return null;
    return row(label, w.minRange ? `${w.minRange} – ${max} m` : `${max} m`);
  };

  switch (w.category) {
    case 'Gun':
      return [
        w.rng_gAP != null
          ? row('Range G AP', `${w.rng_gAP} m`)
          : (w.rng_g > 0 && row('Range G', `${w.rng_g} m`)),
        w.rng_gHE != null && row('Range G HE', `${w.rng_gHE} m`),
        w.rng_h > 0 && row('Range H', `${w.rng_h} m`),
        w.rng_a > 0 && row('Range A', `${w.rng_a} m`),
      ];
    case 'Missile':
      return [rng('Range G', w.rng_g), rng('Range H', w.rng_h), rng('Range A', w.rng_a)];
    case 'Artillery':
      return [row('Range', w.minRange ? `${w.minRange} – ${w.maxRange} m` : `${w.maxRange} m`)];
    case 'Bomb':
      return w.rng_g != null ? [row('Range G', `${w.rng_g} m`)] : [];
    default:
      return [];
  }
}

// activeRange, onRange, accMode and onAccMode are for tools that compute hit
// chance: they mark the range row and the accuracy/stabilizer row in use, and
// make those rows clickable. activeDamage ('AP' or 'HE') marks the damage and aim time rows
// in use and greys the others. effectiveAp replaces the AP value (KE AP at the
// current distance), with apNote as its tooltip. baseAccuracyOnly drops the
// veterancy-adjusted value from the accuracy and stabilizer rows. With onToggle, the
// header collapses the rows (open = false).
export function WeaponBlock({
  w, vet, s, sharedTurrets, weaponIdx, onCapture,
  activeRange, onRange, accMode, onAccMode, activeDamage, effectiveAp, apNote, baseAccuracyOnly,
  open = true, onToggle,
}) {
  const hide = useHide();
  const { expert } = useExpertMode();
  const tags    = w.tag ?? [];
  const hasKE   = tags.includes('KE');
  const hasHEAT = tags.includes('HEAT');
  const hasAuto = tags.includes('AUTO');
  const apInlineTag = hasKE ? ' KE' : hasHEAT ? ' HEAT' : '';
  const heCategory  = weaponHeCategory(w);
  const headerTags  = tags.filter(t => !HEADER_TAG_BLACKLIST.has(t));

  const modAcc  = w.acc  != null ? vetAccuracy(w.acc, vet.accMul) : null;
  const modStab = w.stab != null ? vetAccuracy(w.stab, vet.accMul) : null;
  const longRof = isLongRof(w);

  const accValue = w.acc != null && (baseAccuracyOnly ? `${w.acc}%` : (
    <>{w.acc}%{'  →  '}<span title="Accuracy with the veterancy bonus applied." style={{ cursor: 'help' }}>{modAcc}%</span></>
  ));
  const stabValue = w.stab != null && w.stab !== 0 && (baseAccuracyOnly ? `${w.stab}%` : (
    <>{w.stab}%{'  →  '}<span title="Stabilizer with the veterancy bonus applied." style={{ cursor: 'help' }}>{modStab}%</span></>
  ));

  const accRow = (mode, title) => onAccMode
    ? { active: accMode === mode, onClick: () => onAccMode(mode), clickTitle: title }
    : {};
  const dmgRow = (kind, accent) => activeDamage
    ? { active: activeDamage === kind, accent: activeDamage === kind ? accent : s.dim }
    : { accent };

  const rearm = w.rearmTime  != null ? formatRearm(w)  : null;
  const supply = (w.supplyPerShot != null && w.supplyPerShot > 0) ? formatSupply(w) : null;

  return (
    <div data-weapon-idx={weaponIdx} style={{ margin: '10px 0 12px', border: `1px solid ${s.rule}`, background: s.paper }}>
      <div
        {...(onToggle && {
          role: 'button', tabIndex: 0, 'aria-expanded': open,
          title: open ? 'Hide the weapon details' : 'Show the weapon details',
          onClick: e => { if (!e.target.closest('button')) onToggle(); },
          onKeyDown: e => {
            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onToggle(); }
          },
        })}
        style={{
          padding: '8px 12px', borderBottom: open ? `1px solid ${s.rule}` : 'none',
          background: s.paper, cursor: onToggle ? 'pointer' : undefined,
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CaptureButton onCapture={onCapture} s={s} />
            {onToggle && <span style={{ fontSize: 11, letterSpacing: '0.14em', color: s.dim }}>{open ? '▾ HIDE' : '▸ DETAILS'}</span>}
          </span>
        </div>
      </div>

      {open && <div className="sr" style={{ padding: '6px 12px 8px' }}>
        {hide.field('weaponRange') && rangeRows(w, s, activeRange, onRange)}

        {hide.field('weaponRange') && w.rng_s != null && (
          <DotRow label="Range S" value={w.minRange ? `${w.minRange} – ${w.rng_s} m` : `${w.rng_s} m`}
            active={activeRange === 'Range S'}
            accent={activeRange && activeRange !== 'Range S' ? s.dim : undefined}
            onClick={onRange && (() => onRange('Range S'))} clickTitle={onRange && 'Use range s'} s={s} dense />
        )}

        {hide.field('weaponAccuracy') && accValue && w.category !== 'Artillery' && (
          <DotRow label="Accuracy" value={accValue} accent={accuracyColor(w.acc)}
            {...accRow('acc', 'Use accuracy (firing while stopped)')} s={s} dense />
        )}

        {hide.field('weaponStabilizer') && (w.category === 'Gun' || w.category === 'Missile') && w.stab != null && (
          <DotRow label="Stabilizer"
            value={w.stab === 0 ? '—' : stabValue}
            accent={w.stab === 0 ? null : accuracyColor(w.stab)}
            {...accRow('stab', 'Use stabilizer (firing on the move)')}
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
            const ap = effectiveAp ?? w.ap;
            if (!hasKE && !hasHEAT) return `${ap}${apInlineTag}`;
            const params = new URLSearchParams({ aps: w.ap });
            if (hasKE) params.set('mode', 'KE');
            const href = `${import.meta.env.BASE_URL}apdamage/?${params}`;
            return <><a href={href} style={{ color: 'inherit', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}>{ap}</a>{apInlineTag}</>;
          })()} tooltip={apNote} {...dmgRow('AP', apColor(effectiveAp ?? w.ap, hasKE))} s={s} dense />
        )}

        {hide.field('weaponHe') && hasHE(w) && (
          <DotRow label="HE Power" value={w.dmg}
            {...dmgRow('HE', heColor(w.dmg, heCategory))}
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
            {hide.field('weaponAimTime') && w.aimTimeAP != null && <DotRow label="Aim Time AP" value={`${w.aimTimeAP} s`} {...dmgRow('AP')} s={s} dense />}
            {hide.field('weaponAimTime') && w.aimTimeHE != null && <DotRow label="Aim Time HE" value={`${w.aimTimeHE} s`} {...dmgRow('HE')} s={s} dense />}
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
      </div>}
    </div>
  );
}
