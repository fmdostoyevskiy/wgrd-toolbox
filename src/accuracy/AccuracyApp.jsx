import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BROWSER_TOKENS, BMono, VET_TIERS, WeaponBlock, HideContext, makeHide,
  lowestVet, canEngage, hitChance,
  UnitPicker, DistanceChart, CompareHeader, CrewControls, ControlRow, WeaponTabs, CalcSteps,
  themeOf, TYPE_LABELS, distanceScale, effectiveWeapon, clampInt, hitColor, hitText,
} from '@units-core';

const HEX = 175;

// The weapon card keeps only the rows that matter for hit chance.
const WEAPON_HIDE = makeHide({
  fields: [
    'weaponAp', 'weaponHe', 'weaponSuppress', 'weaponAimTime', 'weaponRof',
    'weaponDispersion', 'weaponDmgRadius', 'weaponSuppRadius',
    'weaponMissileSpeed', 'weaponMissileAccel', 'weaponSalvoSize', 'weaponNoise',
    'weaponRearm', 'weaponSupply', 'weaponTurreted', 'weaponTurretIndex',
  ],
});

// There's no target unit, so the range row picked on the card decides what's
// being shot at. Each class is a stand-in target with no size or ECM.
const CLASSES = {
  g: { unit: { type: 'Vehicle' },    name: 'GROUND' },
  i: { unit: { type: 'Infantry' },   name: 'GROUND · HE' },
  h: { unit: { type: 'Helicopter' }, name: 'HELO' },
  a: { unit: { type: 'Plane' },      name: 'AIR' },
  s: { unit: { type: 'Ship' },       name: 'SHIP' },
};
const RANGE_CLASS = {
  'Range G': 'g', 'Range G AP': 'g', 'Range G HE': 'i', 'Range H': 'h', 'Range A': 'a', 'Range S': 's',
};

// The classes a weapon has a range row for, in card order.
function weaponClasses(w) {
  const out = [];
  if (w.rng_gAP != null) out.push('g', 'i');
  else if (w.rng_g > 0) out.push('g');
  if (w.rng_h > 0) out.push('h');
  if (w.rng_a > 0) out.push('a');
  if (w.rng_s != null) out.push('s');
  return out;
}

// The chosen class if the weapon has it, else its first one.
function classFor(w, chosen) {
  const own = w ? weaponClasses(w) : [];
  return own.includes(chosen) ? chosen : own[0] ?? 'g';
}

function readState(units, fallback) {
  const p = new URLSearchParams(window.location.search);
  return {
    unit:     units[p.get('u')] ? p.get('u') : fallback,
    weapon:   clampInt(p.get('w'), 0, 99, 0),
    vet:      clampInt(p.get('v'), 0, 4, -1),  // -1: the unit's lowest
    morale:   clampInt(p.get('m'), 0, 3, 0),
    mode:     p.get('s') === '1' ? 'stab' : 'acc',
    target:   CLASSES[p.get('r')] ? p.get('r') : 'g',
    distance: clampInt(p.get('d'), 0, 100000, 1225),
  };
}

function writeState(st) {
  const p = new URLSearchParams();
  p.set('u', st.unit);
  if (st.weapon) p.set('w', st.weapon);
  if (st.vet >= 0) p.set('v', st.vet);
  if (st.morale) p.set('m', st.morale);
  if (st.mode === 'stab') p.set('s', '1');
  if (st.target !== 'g') p.set('r', st.target);
  p.set('d', st.distance);
  history.replaceState(null, '', '?' + p.toString());
}

export function AccuracyApp({ roster, units, defaultUnit }) {
  const t = BROWSER_TOKENS;
  const pickable = useMemo(() => roster.filter(u => units[u.id]?.type !== 'FOB'), [roster, units]);
  const [st, setSt] = useState(() => readState(units, defaultUnit));

  useEffect(() => { writeState(st); }, [st]);

  const update = useCallback(patch => setSt(prev => ({ ...prev, ...patch })), []);
  const selectUnit = id => update({ unit: id, weapon: 0, vet: lowestVet(units[id]) });

  const unit = units[st.unit];
  const s = themeOf(unit);
  const weapons = unit.weapons ?? [];
  const targets = weapons.map(w => CLASSES[classFor(w, st.target)].unit);
  const eng = weapons.map((w, i) => canEngage(w, targets[i]));
  const usable = eng.map(e => e.ok);
  const idx = effectiveWeapon(st.weapon, usable);
  const vet = Math.max(st.vet, lowestVet(unit));
  const w = weapons[idx];
  const cls = classFor(w, st.target);

  // Chart span: the longest range any of the unit's weapons has.
  const longest = Math.max(HEX, ...eng.map(e => (e.ok ? e.range : 0)));
  const maxD = Math.ceil(longest / HEX) * HEX;
  const dist = Math.min(st.distance, maxD);

  const opts = d => ({ distance: d, vetIdx: vet, morale: st.morale, mode: st.mode, shooter: unit });
  const results = weapons.map((wp, i) => hitChance(wp, targets[i], opts(dist)));
  const r = results[idx] ?? hitChance(null, CLASSES.g.unit, opts(dist));
  const stats = results.map(res => ({ text: hitText(res), color: hitColor(res), reason: res.reason }));

  const name = `${unit.name} · ${w?.name ?? '—'}`;
  const series = [{ key: 'u', name, color: s.accent, fn: d => hitChance(w, CLASSES[cls].unit, opts(d)) }];

  return (
    <div style={{ ...BMono, width: '100%', height: '100%', overflowY: 'auto', background: t.bg, color: t.ink }}>
      <div className="cmp-page" style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <CompareHeader name="ACCURACY" subtitle="HIT CHANCE PER SHOT · ESTIMATE" />

        <DistanceChart series={series} maxD={maxD} distance={dist} scale={distanceScale(maxD)}
          onChange={d => update({ distance: d })} />

        {/* Headline */}
        <div style={{
          background: t.surface, border: `1px solid ${t.rule}`, padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(26px, 6vw, 40px)', fontWeight: 700, lineHeight: 1, color: hitColor(r) }}>{hitText(r)}</span>
            <span style={{ fontSize: 14, color: t.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}
              title={name}>{name}</span>
            <span style={{ fontSize: 12, letterSpacing: '0.12em', color: t.dimmer }}>
              {r.ok ? `VS ${CLASSES[cls].name} · ${dist} m` : r.reason}
            </span>
          </div>
          <div style={{ height: 6, background: t.surface2 }}>
            <div style={{ width: `${r.ok ? r.hit : 0}%`, height: '100%', background: s.accent }} />
          </div>
        </div>

        {/* Unit and crew on the left; weapons, the weapon card and the calculation on the right */}
        <div className="cmp-cols" style={{ background: s.bg, borderTop: `2px solid ${s.accent}`, padding: 16, color: s.ink }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <UnitPicker roster={pickable} unit={unit} s={s} onSelect={selectUnit}
              meta={{ label: 'UNIT', text: TYPE_LABELS[unit.type] ?? String(unit.type ?? '').toUpperCase() }} />

            <ControlRow>
              <CrewControls unit={unit} vet={vet} morale={st.morale} s={s}
                onVet={i => update({ vet: i })} onMorale={i => update({ morale: i })} />
            </ControlRow>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            {weapons.length > 0
              ? <WeaponTabs weapons={weapons} stats={stats} usable={usable} value={idx} onChange={i => update({ weapon: i })} s={s} />
              : <div style={{ fontSize: 12, letterSpacing: '0.14em', color: s.dim }}>NO WEAPONS</div>}
            {w && (<>
              <HideContext.Provider value={WEAPON_HIDE}>
                <div style={{ margin: '-10px 0 -12px' }}>
                  <WeaponBlock w={w} vet={VET_TIERS[vet]} s={s} weaponIdx={idx}
                    activeRange={r.rangeLabel} onRange={label => update({ target: RANGE_CLASS[label] ?? 'g' })}
                    accMode={st.mode} onAccMode={mode => update({ mode })}
                    baseAccuracyOnly />
                </div>
              </HideContext.Provider>
              <CalcSteps title="HIT CALCULATION" steps={r.steps} s={s}
                total={{ label: r.ok ? 'HIT CHANCE' : r.reason, text: hitText(r), color: hitColor(r) }} />
            </>)}
          </div>
        </div>

        <div style={{ fontSize: 11, lineHeight: 1.7, color: t.dimmer, letterSpacing: '0.04em' }}>
          hit = erf(vet × erfinv(accuracy) × max range / distance) × morale. Base accuracy is the hit chance
          at max range; it rises as the target gets closer, except for shots at or from planes. The target's size and
          ECM also multiply the hit chance; the combat tool counts them.
          Click a range row on the weapon card to pick what's being shot at, and the accuracy or
          stabilizer row to switch between firing stopped and on the move.
        </div>
      </div>
    </div>
  );
}
