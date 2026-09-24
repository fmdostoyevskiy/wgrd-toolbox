import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BROWSER_TOKENS, BMono, VET_TIERS, WeaponBlock, HideContext, makeHide,
  accuracyColor, sizeInfo, lowestVet, targetModifiers, hitChance, GREEN, ORANGE, RED,
  FACINGS, hasArmor, HE_MAX_ARMOR, HE_ARMOR_MUL, COVER, canDamage, engagement, aimTime, damageOutcome,
  UnitPicker, SeriesChart, VerticalSlider, CompareHeader, CrewControls, SquarePicker, ArmorPicker, ControlRow, WeaponTabs, CalcSteps,
  themeOf, TYPE_LABELS, distanceScale, effectiveWeapon, clampInt, hitColor, hitText,
} from '@units-core';

const HEX = 175;
const MAX_SECONDS = 60;
const TIME_STEP = 0.5;
// Ticks every 0.5 s, larger every 5 s, labels every 10 s (the unit is in the readout).
const TIME_SCALE = {
  ticks: Array.from({ length: MAX_SECONDS / TIME_STEP + 1 }, (_, i) => ({ d: i * TIME_STEP, major: i % 10 === 0 })),
  labels: Array.from({ length: MAX_SECONDS / 10 + 1 }, (_, i) => ({ d: i * 10, text: String(i * 10) })),
};

// The weapon card keeps the rows that feed the hit and damage calculations.
const WEAPON_HIDE = makeHide({
  fields: [
    'weaponSuppress', 'weaponDispersion', 'weaponDmgRadius', 'weaponSuppRadius',
    'weaponMissileSpeed', 'weaponMissileAccel', 'weaponSalvoSize', 'weaponNoise',
    'weaponRearm', 'weaponSupply', 'weaponTurreted', 'weaponTurretIndex',
  ],
});

// Unit B's chart line is dashed so the two stay apart when both are on one side.
const SIDES = {
  a: { label: 'UNIT A', dash: undefined, other: 'b' },
  b: { label: 'UNIT B', dash: '6 4', other: 'a' },
};
const FACING_KEYS = FACINGS.map(f => f.key);
const FACING_NAME = Object.fromEntries(FACINGS.map(f => [f.key, f.label]));
const DOMAIN_NAME = { Infantry: 'INFANTRY', Helicopter: 'HELO', Plane: 'PLANE' };
const COVER_KEYS = COVER.map(c => c.key);
const COVER_COLOR = { O: RED, F: ORANGE, B: GREEN };  // by how much it protects
const COVER_WHERE = { O: 'in the open', F: 'in forest', B: 'in buildings' };
const COVER_CELLS = COVER.map(c => ({
  key: c.key, name: c.label, value: `${Math.round(c.mul * 100)}%`, color: COVER_COLOR[c.key],
  title: `Infantry ${COVER_WHERE[c.key]} takes ${Math.round(c.mul * 100)}% damage`,
}));

const fmtDmg = d => (Math.round(d * 10) / 10).toFixed(1);
const pct = f => `${Math.round(f * 100)}%`;
const shareColor = f => accuracyColor(f * 100);

// The unit's type plus the stats it contributes as a target.
function unitMeta(unit) {
  const parts = [TYPE_LABELS[unit.type] ?? String(unit.type ?? '').toUpperCase(), `${unit.health ?? 10} HP`];
  const { size, ecm } = targetModifiers(unit);
  if (unit.type !== 'Plane' && unit.type !== 'Ship') {
    parts.push(`SIZE ${sizeInfo(size).label.toUpperCase()} ×${(1 + size).toFixed(2)}`);
  }
  if (ecm) parts.push(`ECM ${ecm}% ×${(1 - ecm / 100).toFixed(2)}`);
  return parts.join(' · ');
}

// Seconds in 0.5 s steps, 0.5 to 60.
function readSeconds(v) {
  const n = Math.round(parseFloat(v) / TIME_STEP) * TIME_STEP;
  return Number.isFinite(n) && n >= TIME_STEP && n <= MAX_SECONDS ? n : 30;
}

function readState(units, fallbackA, fallbackB) {
  const p = new URLSearchParams(window.location.search);
  const side = (k, fallback) => ({
    unit:   units[p.get(k)] ? p.get(k) : fallback,  // vet -1: the unit's lowest
    weapon: clampInt(p.get(`w${k}`), 0, 99, 0),
    vet:    clampInt(p.get(`v${k}`), 0, 4, -1),
    morale: clampInt(p.get(`m${k}`), 0, 3, 0),
    mode:   p.get(`s${k}`) === '1' ? 'stab' : 'acc',
    facing: FACING_KEYS.includes(p.get(`f${k}`)) ? p.get(`f${k}`) : 'F',
    cover:  COVER_KEYS.includes(p.get(`c${k}`)) ? p.get(`c${k}`) : 'O',
  });
  return {
    a: side('a', fallbackA),
    b: side('b', fallbackB),
    distance: clampInt(p.get('d'), 0, 100000, 1225),
    seconds:  readSeconds(p.get('t')),
  };
}

function writeState(st) {
  const p = new URLSearchParams();
  for (const k of ['a', 'b']) {
    const sd = st[k];
    p.set(k, sd.unit);
    if (sd.weapon) p.set(`w${k}`, sd.weapon);
    if (sd.vet >= 0) p.set(`v${k}`, sd.vet);
    if (sd.morale) p.set(`m${k}`, sd.morale);
    if (sd.mode === 'stab') p.set(`s${k}`, '1');
    if (sd.facing !== 'F') p.set(`f${k}`, sd.facing);
    if (sd.cover !== 'O') p.set(`c${k}`, sd.cover);
  }
  p.set('d', st.distance);
  p.set('t', st.seconds);
  history.replaceState(null, '', '?' + p.toString());
}

// What one hit does, as a row label: "KE AP 19 +6 VS FRONT 5", "HE VS HELO".
function damageLabel(e, w, target) {
  const d = e.damage;
  if (d.armor == null) {
    const cover = d.cover.mul < 1 ? ` IN ${d.cover.label} ×${d.cover.mul.toFixed(1)}` : '';
    return `HE VS ${DOMAIN_NAME[target.type] ?? 'TARGET'}${cover}`;
  }
  const facing = `${FACING_NAME[e.facing]} ${d.armor}`;
  if (d.kind === 'HE') return `HE VS ${facing}${d.armorMul < 1 ? ` ×${d.armorMul.toFixed(1)}` : ''}`;
  const bonus = d.ap - w.ap;
  return `${d.kind} AP ${w.ap}${bonus ? ` ${bonus > 0 ? '+' : '−'}${Math.abs(bonus)}` : ''} VS ${facing}`;
}

// The card's AP row shows KE AP at the current distance.
function keAp(w, e) {
  if (!e.hit.ok || e.damage?.kind !== 'KE') return {};
  const bonus = e.damage.ap - w.ap;
  return {
    effectiveAp: e.damage.ap,
    apNote: `${w.ap} base ${bonus >= 0 ? '+' : '−'}${Math.abs(bonus)} at ${e.distance} m: +1 per 175 m inside the ${e.hit.range} m max range, up to 30`,
  };
}

// One result box: a big colored value, an optional "/ hp" suffix and a note.
function Tile({ label, value, color, suffix, note, s }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, padding: '8px clamp(6px, 2vw, 10px)', background: s.paper, border: `1px solid ${s.rule}` }}>
      <span style={{ fontSize: 11, letterSpacing: '0.12em', color: s.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 'clamp(15px, 4.5vw, 20px)', fontWeight: 700, color }}>{value}</span>
        {suffix && <span style={{ fontSize: 12, color: s.dim }}> {suffix}</span>}
      </span>
      <span style={{ fontSize: 11, color: s.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{note}</span>
    </div>
  );
}

function DamageCalc({ e, w, target, seconds, s, fold }) {
  const title = `DAMAGE IN ${seconds} s`;
  if (!e.ok) return <CalcSteps title={title} steps={[]} total={{ label: e.reason, text: '—', color: s.dim }} s={s} inline />;

  const o = e.outcome;
  const hp = target.health ?? 10;
  const kind = e.damage.kind === 'HE' ? 'HE' : 'AP';
  const outOfAmmo = w.ammo > 0 && o.shots === w.ammo;
  const hitsText = n => `${n} ${n === 1 ? 'HIT' : 'HITS'}`;
  const steps = [
    {
      label: `SHOTS${outOfAmmo ? ' · ALL AMMO' : ''}`, val: `aim ${aimTime(w, kind)} s`, res: String(o.shots),
      title: 'First shot after the aim time, then at the card\'s rate of fire',
    },
    { label: 'HIT CHANCE', val: `${(e.hit.frac * 100).toFixed(1)}%`, res: `${o.hits.toFixed(1)} hits` },
    { label: damageLabel(e, w, target), val: `${fmtDmg(e.damage.dmg)} / hit`, res: '' },
    {
      label: 'HEALTH · HITS TO KILL', val: `${hp} HP`,
      res: Number.isFinite(o.killHits) ? String(o.killHits) : '—',
    },
  ];
  return (
    <CalcSteps title={title} steps={steps} s={s} {...fold}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, margin: '6px 0 2px' }}>
        <Tile label="AVERAGE" value={fmtDmg(o.mean)} color={shareColor(o.mean / hp)} suffix={`/ ${hp}`}
          note={`${o.hits.toFixed(1)} HITS`} s={s} />
        <Tile label="BEST" value={fmtDmg(o.best)} color={shareColor(o.best / hp)} suffix={`/ ${hp}`}
          note={hitsText(o.bestHits)} s={s} />
        <Tile label="KILL" value={pct(o.kill)} color={shareColor(o.kill)}
          note={Number.isFinite(o.killHits) ? `${o.killHits} TO KILL` : 'CAN\'T KILL'} s={s} />
      </div>
    </CalcSteps>
  );
}

function SidePanel({ side, sd, unit, target, usable, results, e, seconds, roster, update, onSelectUnit, action, details, onDetails }) {
  const fold = key => ({ open: details[key], onToggle: () => onDetails(key) });
  const { label } = SIDES[side];
  const s = themeOf(unit);
  const weapons = unit.weapons ?? [];
  const w = weapons[sd.weapon];
  const stats = results.map(r => ({
    text: r.ok ? fmtDmg(r.outcome.mean) : '—',
    color: r.ok ? shareColor(r.outcome.mean / (target.health ?? 10)) : s.dim,
    reason: r.reason,
  }));

  return (
    <div style={{
      background: s.bg, borderTop: `2px solid ${s.accent}`, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, color: s.ink,
    }}>
      <UnitPicker roster={roster} unit={unit} s={s}
        onSelect={onSelectUnit}
        meta={{ label, text: unitMeta(unit) }} action={action}
        beside={weapons.length > 0
          ? <WeaponTabs weapons={weapons} stats={stats} usable={usable} value={sd.weapon} onChange={i => update({ weapon: i })} s={s} max={3} />
          : <div style={{ fontSize: 12, letterSpacing: '0.14em', color: s.dim, padding: '12px 0' }}>NO WEAPONS</div>} />

      <ControlRow>
        <CrewControls unit={unit} vet={sd.vet} morale={sd.morale} s={s}
          onVet={i => update({ vet: i })} onMorale={i => update({ morale: i })} />
        {hasArmor(unit) && (
          <ArmorPicker label="ARMOR HIT" armor={unit.armor} facings={FACING_KEYS} value={sd.facing}
            onChange={f => update({ facing: f })} s={s}
            titles={Object.fromEntries(FACINGS.map(f => [f.key, `${target.name} hits the ${f.label.toLowerCase()} armor`]))} />
        )}
        {unit.type === 'Infantry' && (
          <SquarePicker label="COVER" cells={COVER_CELLS} value={sd.cover} width={62}
            onChange={c => update({ cover: c })} s={s} />
        )}
      </ControlRow>

      {w && (
        <HideContext.Provider value={WEAPON_HIDE}>
          <div style={{ margin: '-10px 0 -12px' }}>
            <WeaponBlock w={w} vet={VET_TIERS[sd.vet]} s={s} weaponIdx={sd.weapon}
              activeRange={e.hit.rangeLabel} accMode={sd.mode} onAccMode={mode => update({ mode })}
              activeDamage={e.damage ? (e.damage.kind === 'HE' ? 'HE' : 'AP') : undefined}
              {...keAp(w, e)}
              vetAccuracyOnly open={details.wpn} onToggle={() => onDetails('wpn')} />
          </div>
        </HideContext.Provider>
      )}

      {w && (
        <CalcSteps title="HIT CHANCE" steps={e.hit.steps} s={s} {...fold('hit')} inline
          total={{ label: e.hit.ok ? 'HIT CHANCE' : e.hit.reason, text: hitText(e.hit), color: hitColor(e.hit) }} />
      )}
      {w && <DamageCalc e={e} w={w} target={target} seconds={seconds} s={s} fold={fold('dmg')} />}
    </div>
  );
}

// Which breakdowns are expanded, shared by both sides and remembered per
// browser. The weapon card starts open, the calculations collapsed.
const DETAILS_KEY = 'wrd-combat-details';
function readDetails() {
  try {
    const v = JSON.parse(localStorage.getItem(DETAILS_KEY));
    return { wpn: v?.wpn !== false, hit: v?.hit === true, dmg: v?.dmg === true };
  } catch {
    return { wpn: true, hit: false, dmg: false };
  }
}

export function CombatApp({ roster, units, defaultA, defaultB }) {
  const t = BROWSER_TOKENS;
  const pickable = useMemo(() => roster.filter(u => units[u.id]?.type !== 'FOB'), [roster, units]);
  const [st, setSt] = useState(() => readState(units, defaultA, defaultB));
  const [details, setDetails] = useState(readDetails);
  const toggleDetails = key => setDetails(prev => {
    const next = { ...prev, [key]: !prev[key] };
    try { localStorage.setItem(DETAILS_KEY, JSON.stringify(next)); } catch {}
    return next;
  });

  useEffect(() => { writeState(st); }, [st]);

  const update = useCallback(side => patch => setSt(prev => ({ ...prev, [side]: { ...prev[side], ...patch } })), []);
  const selectUnit = side => id => update(side)({ unit: id, weapon: 0, vet: lowestVet(units[id]), facing: 'F', cover: 'O' });
  const swap = () => setSt(prev => ({ ...prev, a: prev.b, b: prev.a }));
  const set = key => v => setSt(prev => ({ ...prev, [key]: v }));

  const u = { a: units[st.a.unit], b: units[st.b.unit] };
  const side = k => {
    const unit = u[k], target = u[SIDES[k].other];
    const { facing, cover } = st[SIDES[k].other];
    const weapons = unit.weapons ?? [];
    const eng = weapons.map(w => canDamage(w, target, facing));
    const usable = eng.map(x => x.ok);
    const weapon = effectiveWeapon(st[k].weapon, usable);
    const sd = { ...st[k], weapon, vet: Math.max(st[k].vet, lowestVet(unit)) };
    const cond = (d, seconds = st.seconds) => ({ distance: d, vetIdx: sd.vet, morale: sd.morale, mode: sd.mode, facing, cover, seconds });
    return { unit, target, facing, weapons, eng, usable, sd, cond, s: themeOf(unit) };
  };
  const A = side('a'), B = side('b');

  // Chart span: the longest range any weapon on either unit has against the other.
  const longest = Math.max(HEX, ...[...A.eng, ...B.eng].map(x => (x.ok ? x.range : 0)));
  const maxD = Math.ceil(longest / HEX) * HEX;
  const dist = Math.min(st.distance, maxD);

  for (const X of [A, B]) {
    X.results = X.weapons.map(w => ({ ...engagement(w, X.target, X.cond(dist)), facing: X.facing, distance: dist }));
    const none = { ok: false, reason: 'NO WEAPON', hit: hitChance(null, X.target, X.cond(dist)), damage: null, outcome: null };
    X.e = X.results[X.sd.weapon] ?? none;
    X.hp = X.target.health ?? 10;
    X.share = X.e.ok ? X.e.outcome.mean / X.hp : 0;
    X.name = `${X.unit.name} · ${X.weapons[X.sd.weapon]?.name ?? '—'}`;
  }

  let deltaText = 'NEITHER CAN FIRE', deltaColor = t.dim;
  if (A.e.ok && B.e.ok) {
    const d = Math.round(100 * (A.share - B.share));
    deltaText = d === 0 ? 'EVEN' : d > 0 ? `◂ A +${d}% HP` : `B +${-d}% HP ▸`;
    deltaColor = d === 0 ? t.ink : d > 0 ? A.s.accent : B.s.accent;
  } else if (A.e.ok || B.e.ok) {
    deltaText = A.e.ok ? '◂ ONLY A CAN FIRE' : 'ONLY B CAN FIRE ▸';
    deltaColor = A.e.ok ? A.s.accent : B.s.accent;
  }

  // Damage against time at the current distance. Shot times come from one run
  // over the whole minute; each shot count's outcome is worked out once.
  const timeFn = X => {
    const e = engagement(X.weapons[X.sd.weapon], X.target, X.cond(dist, MAX_SECONDS));
    if (!e.ok) return () => ({ ok: false, reason: e.reason });
    const memo = [];
    return sec => {
      const n = e.times.filter(ts => ts <= sec + 1e-9).length;
      const o = memo[n] ??= damageOutcome({ shots: n, p: e.hit.frac, dmg: e.damage.dmg, hp: X.hp });
      return {
        ok: true, frac: o.mean / X.hp, hi: o.best / X.hp,
        text: `${fmtDmg(o.mean)} / ${X.hp} · best ${fmtDmg(o.best)}`,
      };
    };
  };
  const timeSeries = [A, B].map((X, i) => ({
    key: i ? 'b' : 'a', name: X.name, color: X.s.accent, dash: SIDES[i ? 'b' : 'a'].dash, fn: timeFn(X),
  }));

  const panel = { background: t.surface, border: `1px solid ${t.rule}` };
  const bigNum = { fontSize: 'clamp(26px, 6vw, 40px)', fontWeight: 700, lineHeight: 1, flexShrink: 0, fontVariantNumeric: 'tabular-nums' };
  const hName  = { fontSize: 14, color: t.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 };
  const sub    = { fontSize: 12, letterSpacing: '0.08em', color: t.dimmer };
  const headline = X => (
    <span style={{ ...bigNum, color: X.e.ok ? shareColor(X.share) : t.dimmer }}>
      {X.e.ok ? fmtDmg(X.e.outcome.mean) : '—'}
      {X.e.ok && <span style={{ fontSize: 14, fontWeight: 400, color: t.dim }}> / {X.hp}</span>}
    </span>
  );
  const detail = X => (X.e.ok
    ? `${hitText(X.e.hit)} HIT · ${X.e.outcome.shots} SHOTS · ${pct(X.e.outcome.kill)} KILL`
    : X.e.reason);

  return (
    <div style={{ ...BMono, width: '100%', height: '100%', overflowY: 'auto', background: t.bg, color: t.ink }}>
      <div className="cmp-page" style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <CompareHeader name="COMBAT" subtitle="AVERAGE DAMAGE DEALT · ESTIMATE" />

        {/* Head to head: average damage each side deals to the other in the time */}
        <div style={{ ...panel, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="cmp-h2h">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, minWidth: 0 }}>
                {headline(A)}<span style={hName} title={A.name}>{A.name}</span>
              </div>
              <div style={sub}>{detail(A)}</div>
            </div>
            <div className="cmp-delta" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                fontSize: 13, letterSpacing: '0.12em', padding: '6px 12px',
                border: `1px solid ${t.ruleStrong}`, color: deltaColor, whiteSpace: 'nowrap',
              }}>{deltaText}</div>
              <div style={{ ...sub, whiteSpace: 'nowrap' }}>{dist} m · {st.seconds} s</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 12, minWidth: 0, maxWidth: '100%' }}>
                <span style={hName} title={B.name}>{B.name}</span>{headline(B)}
              </div>
              <div style={{ ...sub, textAlign: 'right' }}>{detail(B)}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <div style={{ height: 6, background: t.surface2, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: pct(A.share), background: A.s.accent }} />
            </div>
            <div style={{ height: 6, background: t.surface2 }}>
              <div style={{ width: pct(B.share), height: '100%', background: B.s.accent }} />
            </div>
          </div>
        </div>

        <div className="cmp-cols">
          {[['a', A], ['b', B]].map(([k, X]) => (
            <SidePanel key={k} side={k} sd={X.sd} unit={X.unit} target={X.target} usable={X.usable}
              details={details} onDetails={toggleDetails}
              results={X.results} e={X.e} seconds={st.seconds} roster={pickable}
              update={update(k)} onSelectUnit={selectUnit(k)}
              action={k === 'a' && (
                <button onClick={swap} style={{
                  fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.14em', padding: '5px 10px',
                  background: 'transparent', border: `1px solid ${A.s.rule}`, color: A.s.dim,
                  cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                }}>⇄ SWAP</button>
              )} />
          ))}
        </div>

        {/* Time along the plot, distance on the slider beside it */}
        <SeriesChart label="TIME · DISTANCE" unit="s" xMax={MAX_SECONDS} xMin={TIME_STEP} value={st.seconds} onChange={set('seconds')}
          snap={TIME_STEP} bigStep={5} scale={TIME_SCALE} series={timeSeries} samples={MAX_SECONDS * 10}
          readout={`${st.seconds} s · ${dist} m`}
          caption="AVG DAMAGE (% OF TARGET HEALTH) OVER TIME · DOTTED: BEST · RIGHT SLIDER: DISTANCE"
          valueText={r => r.text}
          aside={<VerticalSlider label="Distance" unit="m" max={maxD} value={dist} onChange={set('distance')}
            snap={25} bigStep={HEX} scale={distanceScale(maxD)} />} />

        <div style={{ fontSize: 11, lineHeight: 1.7, color: t.dimmer, letterSpacing: '0.04em' }}>
          Unit A fires at unit B and B fires at A, from a standing start, for the chosen time. The first shot
          leaves after the aim time, then at the weapon's rate of fire, up to its ammo; missile flight time,
          suppression and return fire aren't counted. Each shot hits independently with the hit chance
          (erf(vet × erfinv(accuracy) × max range / distance) × morale × (1 − ECM) × (1 + size)).
          Against a vehicle or ship, a hit does AP damage to the armor facing chosen on the target's panel
          (KE gains 1 AP per 175 m closer than max range); weapons without AP only damage armor
          of {HE_MAX_ARMOR} or less, with HE (full damage to armor 0 and 1, {HE_ARMOR_MUL * 100}% to armor {HE_MAX_ARMOR}),
          and infantry rifles and machine guns only damage armor 0. Infantry, helicopters and planes take HE; weapons without HE can't
          target infantry. Infantry in forest takes 60% of the damage, and in buildings 30%. Damage is capped at the target's health. Best is the 90th percentile: one
          engagement in ten does that much or more.
          Weapons that can't damage the target are greyed out.
        </div>
      </div>
    </div>
  );
}
