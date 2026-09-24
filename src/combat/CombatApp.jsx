import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BROWSER_TOKENS, BMono, VET_TIERS, WeaponBlock, HideContext, makeHide,
  accuracyColor, sizeInfo, lowestVet, targetModifiers, GREEN, ORANGE, RED,
  FACINGS, hasArmor, HE_MAX_ARMOR, HE_ARMOR_MUL, COVER, canDamage, engagement, aimTime,
  turretGroups, effectiveSelection, shownWeapon, volley,
  UnitPicker, VerticalSlider, CompareHeader, CrewControls, SquarePicker, ArmorPicker, ControlRow, WeaponGroups, CalcSteps,
  themeOf, TYPE_LABELS, distanceScale, clampInt, hitColor, hitText,
} from '@units-core';
import { VolleyChart, shadeOf } from './VolleyChart.jsx';

const HEX = 175;
// The time the graph runs to, in seconds.
const SPANS = [30, 60, 90];
// The time can be picked in 0.2 s steps on the 30 s graph, 0.5 s on the others.
const timeStep = span => (span === 30 ? 0.2 : 0.5);
const toStep = (x, span) => Number((Math.round(x / timeStep(span)) * timeStep(span)).toFixed(6));
// Ticks every 0.5 s (every 1 s on the 30 s graph, so they land on its steps),
// larger every 5 s, labels every 10 s (the unit is in the readout).
const timeScale = span => {
  const tick = span === 30 ? 1 : 0.5;
  return {
    ticks: Array.from({ length: span / tick + 1 }, (_, i) => ({ d: i * tick, major: (i * tick) % 5 === 0 })),
    labels: Array.from({ length: span / 10 + 1 }, (_, i) => ({ d: i * 10, text: String(i * 10) })),
  };
};

// The weapon card keeps the rows that feed the hit and damage calculations.
const WEAPON_HIDE = makeHide({
  fields: [
    'weaponSuppress', 'weaponDispersion', 'weaponDmgRadius', 'weaponSuppRadius',
    'weaponMissileSpeed', 'weaponMissileAccel', 'weaponSalvoSize', 'weaponNoise',
    'weaponRearm', 'weaponSupply', 'weaponTurreted', 'weaponTurretIndex',
  ],
});

const SIDES = {
  a: { label: 'UNIT A', other: 'b' },
  b: { label: 'UNIT B', other: 'a' },
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

// Seconds in the graph's time steps, one step to the graph's span.
function readSeconds(v, span) {
  const n = toStep(parseFloat(v), span);
  return Number.isFinite(n) && n >= timeStep(span) && n <= span ? n : Math.min(30, span);
}

// Chosen weapons as "0.2"; none given (null) means one from every turret group.
function readWeapons(v) {
  const idx = [...new Set((v ?? '').split('.').map(x => clampInt(x, 0, 99, -1)).filter(i => i >= 0))];
  return idx.length ? idx.sort((a, b) => a - b) : null;
}

function readState(units, fallbackA, fallbackB) {
  const p = new URLSearchParams(window.location.search);
  const span = SPANS.find(x => x === Number(p.get('span'))) ?? SPANS[0];
  const side = (k, fallback) => ({
    unit:    units[p.get(k)] ? p.get(k) : fallback,  // vet -1: the unit's lowest
    weapons: readWeapons(p.get(`w${k}`)),
    info:    null,  // the turret whose weapon details are shown (null: the first firing one); not in the URL
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
    seconds:  readSeconds(p.get('t'), span),
    span,
  };
}

function writeState(st) {
  const p = new URLSearchParams();
  for (const k of ['a', 'b']) {
    const sd = st[k];
    p.set(k, sd.unit);
    if (sd.weapons) p.set(`w${k}`, sd.weapons.join('.'));
    if (sd.vet >= 0) p.set(`v${k}`, sd.vet);
    if (sd.morale) p.set(`m${k}`, sd.morale);
    if (sd.mode === 'stab') p.set(`s${k}`, '1');
    if (sd.facing !== 'F') p.set(`f${k}`, sd.facing);
    if (sd.cover !== 'O') p.set(`c${k}`, sd.cover);
  }
  p.set('d', st.distance);
  p.set('t', st.seconds);
  if (st.span !== SPANS[0]) p.set('span', st.span);
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

// How far the graph runs: 30, 60 or 90 s.
function SpanPicker({ value, onChange }) {
  const t = BROWSER_TOKENS;
  return (
    <div role="group" aria-label="Time scale" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, letterSpacing: '0.14em', color: t.dimmer, marginRight: 4 }}>SCALE</span>
      {SPANS.map(x => {
        const on = x === value;
        return (
          <button key={x} onClick={() => onChange(x)} aria-pressed={on} title={`Show the first ${x} seconds`} style={{
            fontFamily: 'inherit', fontSize: 11, letterSpacing: '0.08em', padding: '3px 8px', cursor: 'pointer',
            fontVariantNumeric: 'tabular-nums',
            background: on ? `color-mix(in srgb, ${t.accent} 14%, transparent)` : 'transparent',
            border: `1px solid ${on ? t.accent : t.rule}`, color: on ? t.ink : t.dim,
          }}>{x} s</button>
        );
      })}
    </div>
  );
}

const hitsText = n => `${n} ${n === 1 ? 'HIT' : 'HITS'}`;

// The damage of every selected weapon in the time, then all of them together.
function DamageCalc({ X, seconds, span, s, fold }) {
  const title = `DAMAGE IN ${seconds} s`;
  if (!X.now) return <CalcSteps title={title} steps={[]} total={{ label: X.reason, text: '—', color: s.dim }} s={s} inline />;

  const { target, hp, now } = X;
  const single = X.firing.length === 1 ? X.results[X.firing[0]] : null;
  const steps = X.sel.flatMap(i => {
    const w = X.weapons[i], e = X.results[i];
    const name = `WPN ${i + 1} · ${w.name.toUpperCase()}`;
    if (!e.ok) return [{ label: name, val: e.reason, res: '—' }];
    const o = e.outcome;
    const allAmmo = w.ammo > 0 && o.shots === w.ammo;
    return [
      {
        label: `${name}${allAmmo ? ' · ALL AMMO' : ''}`,
        val: `${o.shots} × ${(e.hit.frac * 100).toFixed(1)}%`, res: `${o.hits.toFixed(1)} hits`,
        title: `${o.shots} shots: the first after the ${aimTime(w, e.damage.kind === 'HE' ? 'HE' : 'AP')} s aim time, then at the card's rate of fire; each hits ${(e.hit.frac * 100).toFixed(1)}% of the time`,
      },
      {
        label: `  ${damageLabel(e, w, target)}`, val: `${fmtDmg(e.damage.dmg)} / hit`, res: fmtDmg(o.hits * e.damage.dmg),
        title: 'Damage per hit; right: the average this weapon does before the health cap',
      },
    ];
  });
  steps.push({
    label: single ? 'HEALTH · HITS TO KILL' : 'HEALTH', val: `${hp} HP`,
    res: single ? (Number.isFinite(single.outcome.killHits) ? String(single.outcome.killHits) : '—') : '',
  });

  const hits = X.firing.reduce((a, i) => a + X.results[i].outcome.hits, 0);
  const kill50 = X.v.killAt(0.5);
  const killNote = kill50 != null ? `50% AT ${kill50} s`
    : single && !Number.isFinite(single.outcome.killHits) ? 'CAN\'T KILL' : `UNDER 50% IN ${span} s`;
  return (
    <CalcSteps title={title} steps={steps} s={s} {...fold}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, margin: '6px 0 2px' }}>
        <Tile label="AVERAGE" value={fmtDmg(now.mean)} color={shareColor(now.mean / hp)} suffix={`/ ${hp}`}
          note={`${hits.toFixed(1)} HITS`} s={s} />
        <Tile label="BEST" value={fmtDmg(now.best)} color={shareColor(now.best / hp)} suffix={`/ ${hp}`}
          note={single ? hitsText(single.outcome.bestHits) : '1 IN 10'} s={s} />
        <Tile label="KILL" value={pct(now.kill)} color={shareColor(now.kill)} note={killNote} s={s} />
      </div>
    </CalcSteps>
  );
}

function SidePanel({ side, X, seconds, span, roster, update, onToggle, onInfo, onSelectUnit, action, details, onDetails }) {
  const fold = key => ({ open: details[key], onToggle: () => onDetails(key) });
  const { label } = SIDES[side];
  const { unit, target, weapons, sd, s } = X;
  const stats = X.results.map(r => ({
    text: r.ok ? fmtDmg(r.outcome.mean) : '—',
    color: r.ok ? shareColor(r.outcome.mean / X.hp) : s.dim,
    reason: r.reason,
  }));
  const swatch = Object.fromEntries(X.firing.map((i, n) => [i, shadeOf(n)]));

  return (
    <div style={{
      background: s.bg, borderTop: `2px solid ${s.accent}`, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, color: s.ink,
    }}>
      <UnitPicker roster={roster} unit={unit} s={s}
        onSelect={onSelectUnit}
        meta={{ label, text: unitMeta(unit) }} action={action}
        beside={weapons.length > 0
          ? <WeaponGroups weapons={weapons} groups={X.groups} stats={stats} usable={X.usable} value={X.sel}
              onToggle={onToggle} swatch={swatch} info={X.info} onInfo={onInfo} s={s} />
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

      {X.infoIdx.map(i => {
        const w = weapons[i], e = X.results[i];
        return (
          <React.Fragment key={i}>
            <HideContext.Provider value={WEAPON_HIDE}>
              <div style={{ margin: '-10px 0 -12px' }}>
                <WeaponBlock w={w} vet={VET_TIERS[sd.vet]} s={s} weaponIdx={i}
                  activeRange={e.hit.rangeLabel} accMode={sd.mode} onAccMode={mode => update({ mode })}
                  activeDamage={e.damage ? (e.damage.kind === 'HE' ? 'HE' : 'AP') : undefined}
                  {...keAp(w, e)}
                  baseAccuracyOnly open={details.wpn} onToggle={() => onDetails('wpn')} />
              </div>
            </HideContext.Provider>
            <CalcSteps title="HIT CHANCE" steps={e.hit.steps} s={s} {...fold('hit')} inline
              total={{ label: e.hit.ok ? 'HIT CHANCE' : e.hit.reason, text: hitText(e.hit), color: hitColor(e.hit) }} />
          </React.Fragment>
        );
      })}
      {weapons.length > 0 && <DamageCalc X={X} seconds={seconds} span={span} s={s} fold={fold('dmg')} />}
    </div>
  );
}

// The volley over the graph's span doesn't depend on the chosen time, so
// dragging through time reuses it. Keyed by what it's worked out from.
const VOLLEYS = new Map();
function cachedVolley(shooters, hp) {
  const key = JSON.stringify([hp, shooters]);
  let v = VOLLEYS.get(key);
  if (!v) {
    v = volley(shooters, hp);
    if (VOLLEYS.size >= 24) VOLLEYS.delete(VOLLEYS.keys().next().value);
    VOLLEYS.set(key, v);
  }
  return v;
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
  const selectUnit = side => id => update(side)({ unit: id, weapons: null, info: null, vet: lowestVet(units[id]), facing: 'F', cover: 'O' });
  const swap = () => setSt(prev => ({ ...prev, a: prev.b, b: prev.a }));
  const set = key => v => setSt(prev => ({ ...prev, [key]: v }));
  const setSpan = span => setSt(prev => ({ ...prev, span, seconds: Math.max(timeStep(span), Math.min(toStep(prev.seconds, span), span)) }));
  // Turns weapon i on, in place of the rest of its turret group, or off
  // (unless it's the only one firing).
  const toggle = (k, X) => i => {
    const g = X.groups.find(gr => gr.idx.includes(i));
    const rest = X.sel.filter(j => !g.idx.includes(j));
    if (!X.sel.includes(i)) update(k)({ weapons: [...rest, i].sort((a, b) => a - b) });
    else if (rest.length) update(k)({ weapons: rest });
  };
  // Shows the details of a turret's weapon.
  const toggleInfo = k => turret => update(k)({ info: turret });

  const u = { a: units[st.a.unit], b: units[st.b.unit] };
  const side = k => {
    const unit = u[k], target = u[SIDES[k].other];
    const { facing, cover } = st[SIDES[k].other];
    const weapons = unit.weapons ?? [];
    const groups = turretGroups(weapons);
    const eng = weapons.map(w => canDamage(w, target, facing));
    const usable = eng.map(x => x.ok);
    const sel = effectiveSelection(st[k].weapons ?? groups.map(g => g.idx[0]), groups, usable);
    const infoGroup = groups.find(g => g.turret === st[k].info) ?? groups.find(g => g.idx.includes(sel[0]));
    const info = infoGroup?.turret;
    const infoIdx = infoGroup ? [shownWeapon(infoGroup, sel, usable)] : [];
    const sd = { ...st[k], vet: Math.max(st[k].vet, lowestVet(unit)) };
    const cond = (d, seconds = st.seconds) => ({ distance: d, vetIdx: sd.vet, morale: sd.morale, mode: sd.mode, shooter: unit, facing, cover, seconds });
    return { unit, target, facing, weapons, groups, eng, usable, sel, info, infoIdx, sd, cond, s: themeOf(unit), hp: target.health ?? 10 };
  };
  const A = side('a'), B = side('b');

  // Chart span: the longest range any weapon on either unit has against the other.
  const longest = Math.max(HEX, ...[...A.eng, ...B.eng].map(x => (x.ok ? x.range : 0)));
  const maxD = Math.ceil(longest / HEX) * HEX;
  const dist = Math.min(st.distance, maxD);

  // Each weapon on its own at the current distance and time, then the
  // selected ones that are in range firing together over the graph's span.
  for (const X of [A, B]) {
    X.results = X.weapons.map(w => ({ ...engagement(w, X.target, X.cond(dist)), facing: X.facing, distance: dist }));
    X.firing = X.sel.filter(i => X.results[i].ok);
    X.reason = X.sel.length ? X.results[X.sel[0]].reason : 'NO WEAPON';
    X.v = X.firing.length > 0 ? cachedVolley(X.firing.map(i => {
      const e = engagement(X.weapons[i], X.target, X.cond(dist, st.span));
      return { times: e.times, p: e.hit.frac, dmg: e.damage.dmg };
    }), X.hp) : null;
    X.now = X.v?.at(st.seconds) ?? null;
    X.share = X.now ? X.now.mean / X.hp : 0;
    const names = X.firing.map(i => X.weapons[i].name);
    X.name = names.length === 0 || names.length > 2 ? X.unit.name : `${X.unit.name} · ${names.join(' + ')}`;
    X.shots = X.firing.reduce((a, i) => a + X.results[i].outcome.shots, 0);
  }

  let deltaText = 'NEITHER CAN FIRE', deltaColor = t.dim;
  if (A.now && B.now) {
    const d = Math.round(100 * (A.share - B.share));
    deltaText = d === 0 ? 'EVEN' : d > 0 ? `◂ A +${d}% HP` : `B +${-d}% HP ▸`;
    deltaColor = d === 0 ? t.ink : d > 0 ? A.s.accent : B.s.accent;
  } else if (A.now || B.now) {
    deltaText = A.now ? '◂ ONLY A CAN FIRE' : 'ONLY B CAN FIRE ▸';
    deltaColor = A.now ? A.s.accent : B.s.accent;
  }

  const chartSides = [A, B].map((X, i) => ({
    key: i ? 'b' : 'a', label: `${X.unit.name} → ${X.target.name}`, color: X.s.accent, hp: X.hp, v: X.v, reason: X.reason,
    weapons: X.firing.map((wi, n) => ({ i: wi, name: X.weapons[wi].name, shade: shadeOf(n) })),
  }));

  const panel = { background: t.surface, border: `1px solid ${t.rule}` };
  const bigNum = { fontSize: 'clamp(26px, 6vw, 40px)', fontWeight: 700, lineHeight: 1, flexShrink: 0, fontVariantNumeric: 'tabular-nums' };
  const hName  = { fontSize: 14, color: t.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 };
  const sub    = { fontSize: 12, letterSpacing: '0.08em', color: t.dimmer };
  const headline = X => (
    <span style={{ ...bigNum, color: X.now ? shareColor(X.share) : t.dimmer }}>
      {X.now ? fmtDmg(X.now.mean) : '—'}
      {X.now && <span style={{ fontSize: 14, fontWeight: 400, color: t.dim }}> / {X.hp}</span>}
    </span>
  );
  const detail = X => (X.now
    ? `${X.firing.length > 1 ? `${X.firing.length} WEAPONS` : `${hitText(X.results[X.firing[0]].hit)} HIT`} · ${X.shots} SHOTS · ${pct(X.now.kill)} KILL`
    : X.reason);

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
            <SidePanel key={k} side={k} X={X} seconds={st.seconds} span={st.span} roster={pickable}
              details={details} onDetails={toggleDetails}
              update={update(k)} onToggle={toggle(k, X)} onInfo={toggleInfo(k)} onSelectUnit={selectUnit(k)}
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
        <VolleyChart label="TIME · DISTANCE" xMax={st.span} xMin={timeStep(st.span)} value={st.seconds} onChange={set('seconds')}
          snap={timeStep(st.span)} bigStep={5} scale={timeScale(st.span)} sides={chartSides}
          controls={<SpanPicker value={st.span} onChange={setSpan} />}
          readout={`${st.seconds} s · ${dist} m`}
          aside={<VerticalSlider label="Distance" unit="m" max={maxD} value={dist} onChange={set('distance')}
            snap={25} bigStep={HEX} scale={distanceScale(maxD)} />} />

        <div style={{ fontSize: 11, lineHeight: 1.7, color: t.dimmer, letterSpacing: '0.04em' }}>
          Unit A fires at unit B and B fires at A, from a standing start, for the chosen time, with every
          selected weapon that's in range. Weapons on the same turret can't fire together, so only one per
          turret group can be selected. The first shot
          leaves after the aim time, then at the weapon's rate of fire, up to its ammo; missile flight time,
          suppression and return fire aren't counted. Each shot hits independently with the hit chance
          (erf(vet × erfinv(accuracy) × max range / distance) × morale × (1 − ECM) × (1 + size)); shots at or
          from planes don't gain from closing in, so they use max range / distance = 1.
          Against a vehicle or ship, a hit does AP damage to the armor facing chosen on the target's panel
          (KE gains 1 AP per 175 m closer than max range); weapons without AP only damage armor
          of {HE_MAX_ARMOR} or less, with HE (full damage to armor 0 and 1, {HE_ARMOR_MUL * 100}% to armor {HE_MAX_ARMOR}),
          and infantry rifles and machine guns only damage armor 0. Infantry, helicopters and planes take HE; weapons without HE can't
          target infantry. Infantry in forest takes 60% of the damage, and in buildings 30%. Damage is capped at the target's health. Best is the 90th percentile: one
          engagement in ten does that much or more. On the chart, each weapon's band is its share of the
          average, split by the damage it would do without the health cap.
          Weapons that can't damage the target are greyed out.
        </div>
      </div>
    </div>
  );
}
