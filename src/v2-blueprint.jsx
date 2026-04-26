import React, { useState } from 'react';
import { VET_TIERS, V2_THEMES, NATION_FLAG_MAP } from './constants.js';

// ── Shared primitives ─────────────────────────────────────────────────────────

function DotRow({ label, value, accent, tooltip, s }) {
  return (
    <div className="dr" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, fontSize: 13, padding: '3px 0',
      borderBottom: `1px solid ${s.rule}`,
    }}>
      <span style={{
        color: s.dim, letterSpacing: '0.04em', textTransform: 'uppercase',
        fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0,
      }}>{label}</span>
      <span title={tooltip} style={{
        color: accent || s.ink, fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap', flexShrink: 0,
        cursor: tooltip ? 'help' : undefined,
      }}>{value}</span>
    </div>
  );
}

function SectionHeader({ title, s }) {
  return (
    <div style={{
      margin: '14px 0 2px', display: 'flex', alignItems: 'baseline', gap: 8,
      borderBottom: `1.5px solid ${s.ruleStrong}`, paddingBottom: 4,
    }}>
      <div style={{
        fontSize: 12, color: s.ink, letterSpacing: '0.16em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>{title}</div>
    </div>
  );
}

// ── Armor 2×2 grid ────────────────────────────────────────────────────────────

function ArmorCells({ armor, s }) {
  const Cell = ({ label, v }) => {
    const c = armorColor(v) ?? s.accent;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div style={{ fontSize: 9.5, color: s.dim, letterSpacing: '0.1em' }}>{label}</div>
        <div style={{
          border: `1.5px solid ${c}`,
          background: `color-mix(in srgb, ${c} 6%, transparent)`,
          padding: '4px 12px', minWidth: 40, textAlign: 'center',
          fontSize: 16, color: c, fontVariantNumeric: 'tabular-nums',
        }}>{v}</div>
      </div>
    );
  };
  return (
    <div style={{ padding: '8px 0 4px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Cell label="FRONT ↑" v={armor.F} />
      <Cell label="SIDE →"  v={armor.S} />
      <Cell label="REAR ↓"  v={armor.R} />
      <Cell label="TOP ◉"   v={armor.T} />
    </div>
  );
}

// ── Weapon block ──────────────────────────────────────────────────────────────

function WeaponBlock({ w, vetMul, s }) {
  const Row = ({ label, value, accent, tooltip }) => (
    <div className="dr" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, fontSize: 12, padding: '2px 0',
      borderBottom: `1px solid ${s.rule}`,
    }}>
      <span style={{
        color: s.dim, letterSpacing: '0.04em', textTransform: 'uppercase',
        fontSize: 10.5, whiteSpace: 'nowrap', flexShrink: 0,
      }}>{label}</span>
      <span title={tooltip} style={{
        color: accent || s.ink, fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap', flexShrink: 0,
        cursor: tooltip ? 'help' : undefined,
      }}>{value}</span>
    </div>
  );

  const tags    = w.tag ?? [];
  const hasKE   = tags.includes('KE');
  const hasHEAT = tags.includes('HEAT');
  const hasAuto = tags.includes('AUTO');
  const apInlineTag = hasKE ? ' KE' : hasHEAT ? ' HEAT' : '';

  // Header tags: everything except KE, HEAT, STAT, AUTO
  const headerTags = tags.filter(t => !['KE', 'HEAT', 'STAT', 'AUTO'].includes(t));

  const modAcc  = w.acc  != null ? Math.floor(w.acc  * vetMul) : null;
  const modStab = w.stab != null ? Math.floor(w.stab * vetMul) : null;
  const accDisplay = w.acc != null ? `${w.acc}%  →  ${modAcc}%` : null;

  // Rate of fire string
  function rofStr() {
    if (w.salvoLen === 1 || w.shotReload == null || w.shotReload === w.salvoReload) {
      const rpm = Math.round(60 / w.salvoReload);
      return `${w.salvoReload} s (${rpm} r/m)`;
    }
    const rpm = Math.round(w.salvoLen * 60 / (w.shotReload * w.salvoLen + w.salvoReload));
    return `${w.salvoLen}×${w.shotReload}s ↺ ${w.salvoReload}s (${rpm} r/m)`;
  }

  const isLongRof = w.salvoLen > 1 && w.shotReload != null && w.shotReload !== w.salvoReload;
  const rofTooltip = isLongRof ? 'rounds × shot interval ↺ salvo reload' : undefined;

  return (
    <div style={{ margin: '10px 0 12px', border: `1px solid ${s.rule}`, background: s.paper }}>
      {/* Header */}
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

      {/* Stat rows */}
      <div className="sr" style={{ padding: '6px 12px 8px' }}>

        {/* ── RANGE ── */}
        {w.category === 'Gun' && (
          <>
            {w.rng_g > 0 && <Row label="Range G" value={`${w.rng_g} m`} />}
            {w.rng_h > 0 && <Row label="Range H" value={`${w.rng_h} m`} />}
            {w.rng_a > 0 && <Row label="Range A" value={`${w.rng_a} m`} />}
          </>
        )}

        {w.category === 'Missile' && (
          <>
            {(w.rng_g > 0) && <Row label="Range G" value={w.minRange ? `${w.minRange} – ${w.rng_g} m` : `${w.rng_g} m`} />}
            {(w.rng_h > 0) && <Row label="Range H" value={w.minRange ? `${w.minRange} – ${w.rng_h} m` : `${w.rng_h} m`} />}
            {(w.rng_a > 0) && <Row label="Range A" value={w.minRange ? `${w.minRange} – ${w.rng_a} m` : `${w.rng_a} m`} />}
          </>
        )}

        {w.category === 'Artillery' && (
          <Row label="Range" value={w.minRange ? `${w.minRange} – ${w.maxRange} m` : `${w.maxRange} m`} />
        )}

        {w.category === 'Bomb' && w.rng_g != null && (
          <Row label="Range G" value={`${w.rng_g} m`} />
        )}

        {w.rng_s != null && (
          <Row label="Range S" value={w.minRange ? `${w.minRange} – ${w.rng_s} m` : `${w.rng_s} m`} />
        )}

        {/* ── ACCURACY (not Artillery) ── */}
        {accDisplay && w.category !== 'Artillery' && (
          <Row label="Accuracy" value={<>{w.acc}%{'  →  '}<span title="Accuracy with the veterancy bonus applied." style={{cursor:'help'}}>{modAcc}%</span></>} accent={accuracyColor(w.acc)} />
        )}

        {/* ── STABILIZER (Gun and Missile) ── */}
        {(w.category === 'Gun' || w.category === 'Missile') && w.stab != null && (
          <Row label="Stabilizer" value={w.stab === 0 ? '—' : <>{w.stab}%{'  →  '}<span title="Stabilizer with the veterancy bonus applied." style={{cursor:'help'}}>{modStab}%</span></>} accent={w.stab === 0 ? null : accuracyColor(w.stab)} />
        )}

        {/* ── AP POWER (not Artillery) ── */}
        {w.ap != null && w.category !== 'Artillery' && (
          <Row label="AP Power" value={`${w.ap}${apInlineTag}`} accent={apColor(w.ap, hasKE)} />
        )}

        {/* ── HE POWER ── */}
        {w.dmg > 0 && !(w.category === 'Missile' && w.dmg === 1) && (
          <Row label="HE Power" value={w.dmg}
            accent={heColor(w.dmg, w.category)}
            tooltip={w.category === 'Missile' ? heMissileTooltip(w.dmg) : null}
          />
        )}

        {/* ── SUPPRESSION ── */}
        {w.suppress != null && w.suppress > 0 && <Row label="Suppression" value={w.suppress} />}

        {/* ── DISPERSION (Artillery) ── */}
        {w.category === 'Artillery' && w.dispersion != null && (
          w.dispersionMin != null && w.dispersionMin !== w.dispersion
            ? <Row label="Dispersion" value={`${w.dispersionMin} – ${w.dispersion} m`} />
            : <Row label="Dispersion" value={`${w.dispersion} m`} />
        )}

        {/* ── DMG / SUPP RADIUS (Artillery and Bomb) ── */}
        {(w.category === 'Artillery' || w.category === 'Bomb') && w.dmgRadius != null && (
          <Row label="Dmg Radius" value={`${w.dmgRadius} m`} />
        )}
        {(w.category === 'Artillery' || w.category === 'Bomb') && w.suppRadius != null && (
          <Row label="Supp Radius" value={`${w.suppRadius} m`} />
        )}

        {/* ── MISSILE ACCEL / SPEED ── */}
        {w.category === 'Missile' && w.missileAccel != null && (
          <Row
            label="Missile Speed"
            value={`${w.missileAccel} / ${w.missileSpeed}`}
            accent={missileSpeedColor(w.missileSpeed)}
            tooltip="Acceleration / Max Speed"
          />
        )}

        {/* ── AIM TIME + RATE OF FIRE (not Bomb) ── */}
        {w.category !== 'Bomb' && (<>
          {w.aimTime != null && <Row label="Aim Time" value={`${w.aimTime} s`} />}
          <Row
            label={isLongRof ? 'Rate of Fire' : 'Reload'}
            value={`${rofStr()}${hasAuto ? '  [AL]' : ''}`}
            tooltip={rofTooltip}
          />
        </>)}

        {/* ── SALVO SIZE (Bomb) ── */}
        {w.category === 'Bomb' && w.salvoLen != null && w.salvoLen !== w.ammo && (
          <Row label="Salvo Size" value={w.salvoLen} />
        )}

        {/* ── NOISE (Gun and Missile) ── */}
        {(w.category === 'Gun' || w.category === 'Missile') && w.noise != null && (
          <Row label="Noise" value={w.noise.toFixed(1)} tooltip="The factor by which your stealth is decreased when the weapon fires." />
        )}

        {/* ── REARM TIME (per shot / per salvo / total) — plane weapons ── */}
        {w.rearmTime != null && (() => {
          const perShot  = w.rearmTime;
          const perSalvo = parseFloat((w.rearmTime * (w.salvoLen ?? 1)).toFixed(2));
          const perFull  = parseFloat((w.rearmTime * w.ammo).toFixed(2));
          const showSalvo = perSalvo !== perFull && (w.salvoLen ?? 1) > 1;
          if (w.ammo <= 1) {
            return <Row label="Rearm Time" value={`${perShot} s`} />;
          }
          const value = showSalvo
            ? `${perShot} / ${perSalvo} / ${perFull} s`
            : `${perShot} / ${perFull} s`;
          const tooltip = showSalvo
            ? 'per shot / per salvo / total'
            : 'per shot / total';
          return <Row label="Rearm Time" value={value} tooltip={tooltip} />;
        })()}

        {/* ── SUPPLY (per shot / per salvo / per full load) ── */}
        {w.supplyPerShot != null && w.supplyPerShot > 0 && (() => {
          const perShot  = Math.round(w.supplyPerShot);
          const perSalvo = Math.round(w.supplyPerShot * (w.salvoLen ?? 1));
          const perFull  = Math.round(w.supplyPerShot * w.ammo);
          const showSalvo = perSalvo !== perFull && (w.salvoLen ?? 1) > 1;
          const value   = showSalvo
            ? `${perShot} / ${perSalvo} / ${perFull} L`
            : `${perShot} / ${perFull} L`;
          const tooltip = showSalvo
            ? 'per shot / per salvo / per full load'
            : 'per shot / per full load';
          return <Row label="Supply" value={value} tooltip={tooltip} />;
        })()}

      </div>
    </div>
  );
}

// ── Veterancy tooltips ────────────────────────────────────────────────────────

const VET_TOOLTIPS = [
  'No Bonus',
  '+8% Accuracy\n-10% dispersion on artillery shots\n+150% faster morale recovery\n+5% more chances to see and identify enemy units\n-19% stun effect duration',
  '+16% Accuracy\n-19% dispersion on artillery shots\n+200% faster morale recovery\n+10% more chances to see and identify enemy units\n-39% stun effect duration',
  '+24% Accuracy\n-30% dispersion on artillery shots\n+250% faster morale recovery\n+15% more chances to see and identify enemy units\n-60% stun effect duration',
  '+32% Accuracy\n-39% dispersion on artillery shots\n+300% faster morale recovery\n+20% more chances to see and identify enemy units\n-80% stun effect duration',
];

// ── Size / optics / stealth label+colour helpers ─────────────────────────────

function opticsInfo(val) {
  if (val == null) return null;
  if (val >= 220) return { label: 'Exceptional', color: '#2dd4bf' }; // teal
  if (val >= 170) return { label: 'V. Good',     color: '#4ade80' }; // green
  if (val >= 120) return { label: 'Good',        color: '#4ade80' }; // green
  if (val >= 80)  return { label: 'Medium',      color: '#e8a852' }; // orange
  if (val >= 60)  return { label: 'Poor',        color: '#f87171' }; // red
  return                 { label: 'Bad',         color: '#f87171' }; // red
}

function stealthInfo(val) {
  if (val == null) return null;
  if (val >= 3)   return { label: 'Exceptional', color: '#2dd4bf' }; // teal
  if (val >= 2.5) return { label: 'V. Good',     color: '#4ade80' }; // green
  if (val >= 1.6) return { label: 'Good',        color: '#4ade80' }; // green
  if (val >= 1.5) return { label: 'Medium',      color: '#e8a852' }; // orange
  if (val >= 1)   return { label: 'Poor',        color: '#f87171' }; // red
  return null;
}

function airStealthInfo(val) {
  if (val == null) return null;
  if (val >= 3)    return { label: 'Exceptional', color: '#2dd4bf' }; // teal
  if (val >= 2)    return { label: 'Good',        color: '#4ade80' }; // green
  if (val >= 1.25) return { label: 'Medium',      color: '#e8a852' }; // orange
  if (val >= 1)    return { label: 'Poor',        color: '#f87171' }; // red
  return null;
}

function airOpticsInfo(val) {
  if (val == null) return null;
  if (val >= 900) return { label: 'Exceptional++', color: '#2dd4bf' }; // teal
  if (val >= 450) return { label: 'Exceptional',   color: '#2dd4bf' }; // teal
  if (val >= 150) return { label: 'Good',          color: '#4ade80' }; // green
  if (val >= 80)  return { label: 'Medium',        color: '#e8a852' }; // orange
  if (val >= 40)  return { label: 'Poor',          color: '#f87171' }; // red
  return                 { label: 'Bad',           color: '#f87171' }; // red
}

function ecmColor(val) {
  if (val == null) return null;
  if (val > 40) return '#2dd4bf'; // teal
  if (val > 20) return '#4ade80'; // green
  if (val > 10) return '#e8a852'; // orange
  return '#f87171';               // red
}

function autonomyColor(val) {
  if (val == null) return null;
  if (val >= 700) return '#2dd4bf'; // teal
  if (val > 500)  return '#4ade80'; // green
  if (val > 300)  return '#e8a852'; // orange
  return '#f87171';                 // red
}

function armorColor(val) {
  if (val == null) return null;
  if (val >= 21) return '#2dd4bf'; // teal
  if (val >= 13) return '#4ade80'; // green
  if (val >= 8)  return '#e8a852'; // orange
  return '#f87171';                // red
}

function sizeInfo(size) {
  if (size == null) return null;
  if (size < -0.05) return { label: 'V. Small', color: '#2dd4bf' }; // teal
  if (size < 0)     return { label: 'Small',    color: '#4ade80' }; // green
  if (size === 0)   return { label: 'Medium',   color: '#e8a852' }; // orange
  if (size > 0.05)  return { label: 'V. Big',   color: '#f87171' }; // red
  return                   { label: 'Big',      color: '#f87171' }; // red
}

function accuracyColor(val) {
  if (val == null) return null;
  if (val >= 60) return '#2dd4bf'; // teal
  if (val >= 50) return '#4ade80'; // green
  if (val >= 35) return '#e8a852'; // orange
  return '#f87171';                // red
}

function apColor(val, isKE) {
  if (val == null) return null;
  if (isKE) {
    if (val >= 21) return '#2dd4bf'; // teal  (21+)
    if (val >= 16) return '#4ade80'; // green (16–20)
    if (val >= 11) return '#e8a852'; // orange (11–15)
    return '#f87171';                // red   (≤10)
  }
  // HEAT
  if (val >= 25) return '#2dd4bf'; // teal  (25+)
  if (val >= 21) return '#4ade80'; // green (21–24)
  if (val >= 16) return '#e8a852'; // orange (16–20)
  return '#f87171';                // red   (≤15)
}

function heColor(val, category) {
  if (val == null) return null;
  if (category === 'Missile') {
    if (val >= 8) return '#2dd4bf'; // teal  (8+)
    if (val >= 5) return '#4ade80'; // green (5–7)
    if (val >= 4) return '#e8a852'; // orange (4)
    return '#f87171';               // red   (≤3)
  }
  if (category === 'Bomb') {
    if (val >= 20) return '#2dd4bf'; // teal  (20+)
    if (val >= 15) return '#4ade80'; // green (15–19)
    if (val >= 11) return '#e8a852'; // orange (11–14)
    return '#f87171';                // red   (≤10)
  }
  if (category === 'Artillery') {
    if (val >= 9) return '#2dd4bf'; // teal  (9+)
    if (val >= 7) return '#4ade80'; // green (7–8)
    if (val >= 5) return '#e8a852'; // orange (5–6)
    return '#f87171';               // red   (≤4)
  }
  if (category === 'Gun') {
    if (val >= 5)   return '#2dd4bf'; // teal  (5+)
    if (val >= 4)   return '#4ade80'; // green (4)
    if (val >= 2.5) return '#e8a852'; // orange (2.5–3)
    return '#f87171';                 // red   (<2.5)
  }
  return null; // others: uncolored
}

function heMissileTooltip(val) {
  if (val == null) return null;
  if (val >= 8) return 'Will two-shot B-5s and instastun planes on hit.';
  if (val >= 5) return 'Will two-shot most planes.';
  if (val >= 4) return 'Will two-shot most helos.';
  return 'Will require 4 hits to kill a plane.';
}

function missileSpeedColor(val) {
  if (val == null) return null;
  if (val >= 2500) return '#2dd4bf'; // teal
  if (val >= 1000) return '#4ade80'; // green
  if (val >= 750)  return '#e8a852'; // orange
  return '#f87171';                  // red
}

function speedColor(unit, v = unit.speed) {
  if (v == null) return null;
  if (unit.type === 'Infantry') {
    if (v >= 45) return '#2dd4bf'; // teal
    if (v >= 35) return '#4ade80'; // green
    if (v >= 30) return '#e8a852'; // orange
    return '#f87171';              // red
  }
  if (unit.type === 'Helicopter') {
    if (v >= 300) return '#2dd4bf'; // teal
    if (v > 250)  return '#4ade80'; // green
    if (v > 220)  return '#e8a852'; // orange
    return '#f87171';               // red
  }
  if (unit.type === 'Plane') {
    if (v >= 1000) return '#2dd4bf'; // teal
    if (v >= 900)  return '#4ade80'; // green
    if (v >= 750)  return '#e8a852'; // orange
    return '#f87171';                // red
  }
  if (unit.type === 'Vehicle') {
    if (unit.motionType === 'wheeled') {
      if (v >= 90) return '#2dd4bf'; // teal
      if (v >= 70) return '#4ade80'; // green
      if (v >= 55) return '#e8a852'; // orange
      return '#f87171';              // red
    }
    // tracked
    if (v >= 75) return '#2dd4bf'; // teal
    if (v >= 60) return '#4ade80'; // green
    if (v >= 50) return '#e8a852'; // orange
    return '#f87171';              // red
  }
  return null;
}

// ── Main card ─────────────────────────────────────────────────────────────────

export function V2Card({ unit, avail: availProp, vetIdx, setVetIdx, theme = 'tactical' }) {
  const avail = availProp ?? unit.avail;
  const s = {
    ...V2_THEMES[theme] ?? V2_THEMES.tactical,
    font: 'var(--wrd-mono, "JetBrains Mono", ui-monospace, Menlo, monospace)',
  };

  const vet = VET_TIERS[vetIdx];

  const showMobility = unit.type !== 'FOB';
  const showOptics   = unit.type !== 'FOB';
  const showArmor    = unit.armor != null
    && unit.type !== 'Infantry'
    && unit.type !== 'FOB';
  const showWeapons  = unit.weapons?.length > 0 && unit.type !== 'FOB';

  return (
    <div style={{
      background: s.bg, color: s.ink,
      fontFamily: s.font,
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      fontSize: 13, overflow: 'hidden',
    }}>
      {/* ── Title block ── */}
      <div style={{ padding: '18px 18px 0', flexShrink: 0 }}>
        <div style={{
          border: `1.5px solid ${s.ruleStrong}`, padding: '10px 14px',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
          background: s.paper,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: s.dim, letterSpacing: '0.16em' }}>
              DWG. № {unit.tab}-{String(unit.id).slice(-8).toUpperCase()}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em',
              marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{unit.name}</div>
            <div style={{ fontSize: 11, color: s.dim, marginTop: 3, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
              {unit.tab} ·
              <img src={NATION_FLAG_MAP[unit.nation]} alt={unit.nationName ?? unit.nation}
                   style={{ height: 14, width: 'auto' }} />
              {unit.nationName ?? unit.nation}
            </div>
          </div>
          <div style={{
            borderLeft: `1px solid ${s.ruleStrong}`, paddingLeft: 12,
            textAlign: 'right', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', minWidth: 60,
          }}>
            <div style={{ fontSize: 26, color: s.accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {unit.cost}<span style={{ fontSize: 12, marginLeft: 2 }}>pt</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 18px' }}>

        {/* ── Vet selector ── */}
        <div style={{ margin: '10px 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: s.dim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Vet
          </span>
          <div style={{
            flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
            border: `1px solid ${s.rule}`,
          }}>
            {VET_TIERS.map((t, i) => {
              const active = i === vetIdx;
              const unavailable = avail?.[i] === 0;
              return (
                <button key={t.id}
                  title={VET_TOOLTIPS[i]}
                  onClick={unavailable ? undefined : () => setVetIdx(i)}
                  style={{
                    background: active ? s.accent : 'transparent',
                    border: 'none',
                    borderLeft: i === 0 ? 'none' : `1px solid ${s.rule}`,
                    color: active ? s.bg : s.dim,
                    padding: '4px 0 3px', fontFamily: 'inherit',
                    cursor: unavailable ? 'not-allowed' : 'pointer',
                    opacity: unavailable ? 0.35 : 1,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', lineHeight: 1.05,
                  }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: active ? 600 : 400 }}>
                    {t.label}
                  </span>
                  <span style={{
                    fontSize: 9, opacity: active ? 0.85 : 0.65,
                    fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', marginTop: 1,
                  }}>
                    ×{avail?.[i] ?? '—'}
                  </span>
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 10, color: s.dim, fontVariantNumeric: 'tabular-nums', minWidth: 42, textAlign: 'right' }}>
            ×{vet.accMul.toFixed(1)}
          </span>
        </div>

        {/* ── General ── */}
        <SectionHeader title="General" s={s} />
        <div className="sr">
          <DotRow label="Health" value={unit.health} s={s} />
          {unit.type !== 'Plane' && (() => {
            const rawSize = unit.size ?? 0;
            const si = sizeInfo(rawSize);
            return <DotRow label="Size" value={`${si.label} (${rawSize})`} accent={si.color} tooltip="Size increases or decreases the chance of a unit being hit." s={s} />;
          })()}
          {unit.trainingLabel && <DotRow label="Training" value={unit.trainingLabel} s={s} />}
          {unit.ecm  != null && <DotRow label="ECM"     value={`${unit.ecm}%`}    accent={ecmColor(unit.ecm)} tooltip="Decreases a weapon's accuracy by this percentage when targeting this plane." s={s} />}
          {unit.ciws != null && <DotRow label="CIWS"    value={unit.ciws}                                   s={s} />}
          {unit.capacity != null && <DotRow label="Supply" value={`${unit.capacity} L`} s={s} />}
          {unit.isTransport && <DotRow label="Transport"  value="YES" s={s} />}
          {unit.prototype  && <DotRow label="Prototype"  value="YES" s={s} />}
          {unit.command    && <DotRow label="Command"   value="YES" accent={s.ok} s={s} />}
          {unit.era        && <DotRow label="Era"       value={unit.era}           s={s} />}
        </div>

        {/* ── Mobility ── */}
        {showMobility && (
          unit.speed != null ||
          unit.forestSpeed != null ||
          unit.swimSpeed != null ||
          unit.autonomy != null ||
          unit.fuel != null ||
          unit.refuelTime != null ||
          unit.altitude != null ||
          unit.roadSpeed != null ||
          unit.turnRadius != null ||
          unit.maxAcceleration != null ||
          unit.maxDeceleration != null ||
          unit.sailing != null
        ) && <>
          <SectionHeader title="Mobility" s={s} />
          <div className="sr">
            {unit.speed      != null && <DotRow label="Speed"       value={`${unit.speed} km/h`}      accent={speedColor(unit)} s={s} />}
            {unit.forestSpeed!= null && <DotRow label="Forest"      value={`${unit.forestSpeed} km/h`} accent={speedColor(unit, unit.forestSpeed)} s={s}
              tooltip={unit.motionType === 'wheeled'
                ? 'Wheeled units always travel at 50% speed in forests.'
                : 'Tracked units always travel at 70% speed in forests.'} />}
            {unit.swimSpeed  != null && <DotRow label="Amphib"      value={`${unit.swimSpeed} km/h`}  accent={speedColor(unit, unit.swimSpeed)} s={s} tooltip="Amphibious movement is always 50% speed." />}
            {unit.roadSpeed  != null && <DotRow label="Road"        value={`${unit.roadSpeed} km/h`}  accent={speedColor(unit, unit.roadSpeed)} s={s}
              tooltip={unit.motionType === 'wheeled'
                ? 'Wheeled units always move at 150 km/h on roads.'
                : 'Tracked units always move at 110 km/h on roads.'} />}
            {unit.autonomy   != null && <DotRow label={unit.type === 'Plane' ? 'Time Over Target' : 'Autonomy'} value={`${unit.autonomy} s`} accent={autonomyColor(unit.autonomy)} tooltip="Autonomy is the seconds a unit can be on the move." s={s} />}
            {unit.fuel       != null && <DotRow label="Fuel"        value={`${unit.fuel} L`}          s={s} />}
            {unit.refuelTime != null && <DotRow label="Refuel Time" value={`${unit.refuelTime} s`}    s={s} />}
            {unit.altitude   != null && <DotRow label="Altitude"    value={`${unit.altitude} m`}      s={s} />}
            {unit.turnRadius    != null && <DotRow label="Turn Radius" value={`${unit.turnRadius} m`}         s={s} />}
            {(unit.maxAcceleration != null || unit.maxDeceleration != null) && (() => {
              const both = unit.maxAcceleration != null && unit.maxDeceleration != null;
              const value = both
                ? `${unit.maxAcceleration} / ${unit.maxDeceleration} km/h/s`
                : unit.maxAcceleration != null
                  ? `${unit.maxAcceleration} km/h/s`
                  : `${unit.maxDeceleration} km/h/s`;
              const label = both ? 'Accel / Decel' : unit.maxAcceleration != null ? 'Accel' : 'Decel';
              return <DotRow label={label} value={value} s={s} />;
            })()}
            {unit.sailing    != null && <DotRow label="Sailing"     value={unit.sailing}              s={s} />}
          </div>
        </>}

        {/* ── Optics ── */}
        {showOptics && (
          unit.stealth    != null ||
          unit.optics     != null ||
          unit.seaOptics  != null ||
          unit.airStealth != null ||
          (unit.airOptics != null && unit.airOptics >= 20)
        ) && <>
          <SectionHeader title="Optics" s={s} />
          <div className="sr">
            {unit.stealth != null && (() => {
              const si = stealthInfo(unit.stealth);
              return si && <DotRow label="Stealth" value={`${si.label} (${unit.stealth})`} accent={si.color} s={s} />;
            })()}
            {unit.optics != null && (() => {
              const oi = opticsInfo(unit.optics);
              return oi && <DotRow label="Optics" value={`${oi.label} (${unit.optics})`} accent={oi.color} s={s} />;
            })()}
            {unit.seaOptics != null && (() => {
              const so = opticsInfo(unit.seaOptics);
              return so && <DotRow label="Sea Optics" value={`${so.label} (${unit.seaOptics})`} accent={so.color} s={s} />;
            })()}
            {unit.airStealth != null && (() => {
              const ai = airStealthInfo(unit.airStealth);
              return ai && <DotRow label="Air Stealth" value={`${ai.label} (${unit.airStealth})`} accent={ai.color} s={s} />;
            })()}
            {unit.airOptics != null && unit.airOptics >= 20 && (() => {
              const ao = airOpticsInfo(unit.airOptics);
              return ao && <DotRow label="Air Optics" value={`${ao.label} (${unit.airOptics})`} accent={ao.color} s={s} />;
            })()}
          </div>
        </>}

        {/* ── Armor ── */}
        {showArmor && <>
          <SectionHeader title="Armor" s={s} />
          <ArmorCells armor={unit.armor} s={s} />
        </>}

        {/* ── Weapons ── */}
        {showWeapons && <>
          <SectionHeader title="Armament" s={s} />
          {unit.weapons.slice(0, 3).map((w, i) => (
            <WeaponBlock key={i} w={w} vetMul={vet.accMul} s={s} />
          ))}
        </>}

      </div>
    </div>
  );
}
