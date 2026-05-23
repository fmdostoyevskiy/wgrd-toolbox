import React from 'react';
import {
  GROUND_OPTICS, STEALTH, STEALTH_AIR, COVER, AIR_OPTICS,
  calcRange, arcColor, heatBg, HEAT_LEGEND, fmt0,
} from './optics-core.js';

const BASE = import.meta.env.BASE_URL;

// Sidebar display orders — subs are visually nested under their parent tier
const STEALTH_SIDEBAR_GROUND = [
  { v: 1,    label: 'Poor',        sub: null },
  { v: 1.5,  label: 'Medium',      sub: null },
  { v: 2,    label: 'Good',        sub: null },
  { v: 1.6,  label: 'Tiger',       sub: 'good' },
  { v: 1.75, label: 'Ninja',       sub: 'good' },
  { v: 2.5,  label: 'Very Good',   sub: null },
  { v: 3,    label: 'Exceptional', sub: null },
];
const STEALTH_SIDEBAR_AIR = [
  { v: 1,    label: 'Poor',        sub: null },
  { v: 1.5,  label: 'Medium',      sub: null },
  { v: 1.25, label: 'Mig-29M',     sub: 'medium' },
  { v: 2,    label: 'Raven',        sub: null },
  { v: 1.6,  label: 'Tiger',       sub: 'good' },
  { v: 1.75, label: 'Ninja',       sub: 'good' },
  { v: 3,    label: 'Nighthawk',   sub: null },
];

// Matrix column group brackets by mode
const MATRIX_GROUPS_GROUND = [{ label: 'Good family', vals: [1.6, 1.75, 2] }];
const MATRIX_GROUPS_AIR    = [{ label: 'Medium+', vals: [1.25, 1.5] }, { label: 'Good family', vals: [1.6, 1.75, 2] }];

/* ─── Topbar ─────────────────────────────────────────────────── */
function Topbar({ mode, setMode, view, setView }) {
  return (
    <div className="topbar" style={{ gap: 0 }}>
      <a href={BASE} className="brand" style={{ marginRight: 28 }}>
        OPTICS<span className="slash"> / </span><span className="sub">WRD</span>
      </a>
      <div className="tabs" style={{ borderRight: '1px solid var(--line)', paddingRight: 24, marginRight: 24 }}>
        <div className={`tab ${mode === 'ground' ? 'active' : ''}`} onClick={() => setMode('ground')}>Ground</div>
        <div className={`tab ${mode === 'air' ? 'active' : ''}`} onClick={() => setMode('air')}>Air</div>
      </div>
      <button className={`vbtn ${view === 'matrix' ? 'active' : ''}`} onClick={() => setView('matrix')}>Matrix</button>
      <button className={`vbtn ${view === 'radar' ? 'active' : ''}`} onClick={() => setView('radar')}>Radar</button>
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function Sidebar({ mode, lock, O, onPickO, S, onPickS, N, setN, C, setC, spotterHeli, setSpotterHeli, target, setTarget, opticsSet, stealthSidebar }) {
  const oFixed = lock === 'optics', sFixed = lock === 'stealth';

  function PickList({ items, activeVal, isFixed, onPick }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: 'var(--line)', padding: 1 }}>
        {items.map(s => {
          const isActive = s.v === activeVal;
          const isSub = !!s.sub;
          return (
            <button key={s.v} onClick={() => onPick(s.v)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: isActive && isFixed ? 'var(--blue)' : 'var(--bg-2)',
              color: isActive && isFixed ? 'var(--bg)' : isActive ? 'var(--blue)' : isSub ? 'var(--fg-low)' : 'var(--fg-dim)',
              border: isActive && !isFixed ? '1px solid rgba(90,158,255,0.35)' : '0',
              padding: isSub ? '5px 10px 5px 20px' : '7px 10px',
              fontFamily: 'var(--mono)', fontSize: isSub ? 10 : 11,
              letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer',
              borderLeft: isSub ? '2px solid var(--line-2)' : '0',
              width: '100%',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {isSub && <span style={{ color: 'var(--fg-low)', fontSize: 9 }}>└</span>}
                {s.label}
              </span>
              <span style={{ opacity: 0.6, fontSize: 10 }}>{s.v}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-2)' }}>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px' }}>

        {/* 1 — Spotter Type */}
        <div style={{ marginBottom: 14 }}>
          <div className="sel-hdr"><span className="k">Spotter Type</span></div>
          {mode === 'ground' ? (
            <div className="chips">
              <button className={`chip ${!spotterHeli ? 'active blue' : ''}`} onClick={() => setSpotterHeli(false)} style={{ fontSize: 10 }}>Ground</button>
              <button className={`chip ${spotterHeli ? 'active blue' : ''}`} onClick={() => setSpotterHeli(true)} style={{ fontSize: 10 }}>Heli</button>
            </div>
          ) : (
            <div className="chips">
              {['ground', 'heli', 'plane'].map(t => (
                <button key={t} className={`chip ${target === t ? 'active blue' : ''}`} onClick={() => setTarget(t)} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em' }}>{t}</button>
              ))}
            </div>
          )}
        </div>

        {/* 2 — Optics */}
        <div style={{ marginBottom: 14 }}>
          <div className="sel-hdr">
            <span className="k">(O) Optics</span>
            <span className={`v ${oFixed ? 'fixed' : 'swept'}`}>{oFixed ? 'FIXED' : 'SWEEP'}</span>
          </div>
          <PickList items={opticsSet} activeVal={O} isFixed={oFixed} onPick={onPickO} />
        </div>

        {/* 3 — Stealth */}
        <div style={{ marginBottom: 14 }}>
          <div className="sel-hdr">
            <span className="k">(S) Target Stealth</span>
            <span className={`v ${sFixed ? 'fixed' : 'swept'}`}>{sFixed ? 'FIXED' : 'SWEEP'}</span>
          </div>
          <PickList items={stealthSidebar} activeVal={S} isFixed={sFixed} onPick={onPickS} />
        </div>

        {/* 4 — Cover (ground only) */}
        {mode === 'ground' && (
          <div style={{ marginBottom: 14 }}>
            <div className="sel-hdr"><span className="k">(C) Cover</span></div>
            <div className="chips">
              {COVER.map(o => <button key={o.v} className={`chip ${C === o.v ? 'active blue' : ''}`} onClick={() => setC(o.v)} style={{ fontSize: 10 }}>{o.label}</button>)}
            </div>
          </div>
        )}

        {/* 5 — Noise */}
        <div style={{ marginBottom: 14 }}>
          <div className="sel-hdr">
            <span className="k">(N) Noise</span>
            <span className="mono blue" style={{ fontSize: 12 }}>{N.toFixed(2)}</span>
          </div>
          <input className="slider" type="range" min={1} max={7} step={0.05} value={N} onChange={e => setN(parseFloat(e.target.value))} />
        </div>
      </div>
    </div>
  );
}

/* ─── MatrixView ─────────────────────────────────────────────── */
function MatrixView({ mode, lock, O, S, N, C, opticsSet, stealthSet, calc, onDetail }) {

  const groups = mode === 'ground' ? MATRIX_GROUPS_GROUND : MATRIX_GROUPS_AIR;
  const subVals = new Set(mode === 'ground' ? [1.6, 1.75] : [1.25, 1.6, 1.75]);

  function groupInfo(v) {
    for (const g of groups) {
      const idx = g.vals.indexOf(v);
      if (idx === -1) continue;
      return { label: g.label, isFirst: idx === 0, isLast: idx === g.vals.length - 1, isMiddle: idx === Math.floor(g.vals.length / 2) };
    }
    return null;
  }

  return (
    <div style={{ overflow: 'auto', padding: 24 }}>
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, alignItems: 'center', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg-low)' }}>
        <span>OPTICS ↓ × STEALTH →</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          {HEAT_LEGEND[mode].map(({ color, label }) => (
            <span key={label}><span style={{ color }}>■</span> {label}</span>
          ))}
        </span>
      </div>

      {/* Group bracket row */}
      <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${stealthSet.length}, 1fr)`, gap: 2, marginBottom: 2 }}>
        <div />
        {stealthSet.map(s => {
          const gi = groupInfo(s.v);
          return (
            <div key={s.v} style={{ height: 20, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {gi && <div style={{ position: 'absolute', left: gi.isFirst ? '25%' : 0, right: gi.isLast ? '25%' : 0, top: '50%', borderTop: '1px solid var(--line-2)', borderLeft: gi.isFirst ? '1px solid var(--line-2)' : 'none', borderRight: gi.isLast ? '1px solid var(--line-2)' : 'none' }} />}
              {gi?.isMiddle && <span className="mono" style={{ fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg-low)', position: 'relative', background: 'var(--bg)', padding: '0 4px' }}>{gi.label}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${stealthSet.length}, 1fr)`, gap: 2 }}>
        {/* Column headers */}
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
          <span className="mono low" style={{ fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase' }}>O \ S</span>
        </div>
        {stealthSet.map(s => {
          const isLocked = lock === 'stealth' && s.v === S;
          const isSub = subVals.has(s.v);
          return (
            <div key={s.v} style={{ textAlign: 'center', padding: '6px 2px', borderBottom: isLocked ? '2px solid var(--blue)' : '2px solid transparent', background: isLocked ? 'rgba(90,158,255,0.08)' : isSub ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
              <div className="mono" style={{ fontSize: isSub ? 11 : 13, fontWeight: 600, color: isLocked ? 'var(--blue)' : isSub ? 'var(--fg-low)' : 'var(--fg-dim)' }}>{s.v}</div>
              <div className="mono" style={{ fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-low)' }}>{s.label}</div>
            </div>
          );
        })}

        {/* Rows */}
        {opticsSet.map(o => {
          const isLocked = lock === 'optics' && o.v === O;
          return (
            <React.Fragment key={o.v}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px', borderRight: isLocked ? '2px solid var(--blue)' : '2px solid transparent', background: isLocked ? 'rgba(90,158,255,0.06)' : 'transparent' }}>
                <div className="mono" style={{ fontSize: 13, fontWeight: 600, color: isLocked ? 'var(--blue)' : 'var(--fg-dim)' }}>{o.v}</div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--fg-low)' }}>{o.label}</div>
              </div>
              {stealthSet.map(s => {
                const res = calc(o.v, s.v);
                const bg = heatBg(res.capped, mode);
                const isIntersect = o.v === O && s.v === S;
                const isHighlight = (lock === 'optics' && o.v === O) || (lock === 'stealth' && s.v === S);
                return (
                  <div key={s.v}
                    style={{ position: 'relative', minHeight: 50, background: bg, outline: isIntersect ? '2px solid rgba(255,255,255,0.85)' : isHighlight ? '1px solid rgba(90,158,255,0.5)' : 'none', outlineOffset: -1, cursor: 'crosshair' }}
                    onMouseEnter={() => onDetail({ O: o.v, S: s.v, N, C, oLabel: `O=${o.v} ${o.label}`, sLabel: `S=${s.v} ${s.label}`, res })}
                    onMouseLeave={() => onDetail(null)}
                  >
                    <div className="hm-cell-inner">
                      <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{fmt0(res.capped)}</span>
                      {res.capHit
                        ? <span className="mono" style={{ fontSize: 8, letterSpacing: '.14em', color: '#f87171' }}>CAP</span>
                        : <span className="mono" style={{ fontSize: 8, letterSpacing: '.12em', color: 'rgba(255,255,255,0.4)' }}>m</span>}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/* ─── RadarView ──────────────────────────────────────────────── */
function RadarView({ mode, lock, O, S, N, C, opticsSet, stealthSet, calc }) {
  const W = 860, H = 820, cx = W / 2, cy = H / 2 + 30, R = 340;

  const items = lock === 'optics'
    ? stealthSet.map(s => ({ label: s.label, val: s.v, res: calc(O, s.v) }))
    : opticsSet.map(o => ({ label: o.label, val: o.v, res: calc(o.v, S) }));

  const sorted = [...items].sort((a, b) => a.res.capped - b.res.capped);
  const maxD = Math.max(...sorted.map(x => x.res.capped), 1000) * 1.08;
  const rScale = d => Math.min(1, d / maxD) * R;

  const spreadDeg = 210, startDeg = -90 - spreadDeg / 2;
  const angleAt = i => ((startDeg + (i / Math.max(sorted.length - 1, 1)) * spreadDeg) * Math.PI) / 180;

  const ringStep = Math.max(500, Math.ceil(maxD / 6 / 500) * 500);
  const rings = [];
  for (let d = ringStep; d <= maxD * 0.98; d += ringStep) rings.push(d);
  const hitCaps = [...new Set(sorted.filter(x => x.res.capHit).map(x => x.res.cap))];
  hitCaps.forEach(c => { if (!rings.includes(c)) rings.push(c); });

  const fixedLabel = lock === 'optics'
    ? `O = ${O} · ${opticsSet.find(x => x.v === O)?.label}`
    : `S = ${S} · ${stealthSet.find(x => x.v === S)?.label}`;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', top: 18, left: 28, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase' }}>
        <div className="blue">{fixedLabel} · FIXED</div>
        <div className="low" style={{ marginTop: 2 }}>{lock === 'optics' ? 'varying stealth' : 'varying optics'}</div>
      </div>
      <div style={{ position: 'absolute', bottom: 18, right: 28, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '.14em', color: 'var(--fg-low)', textTransform: 'uppercase' }}>
        scale linear · 0 → {fmt0(maxD)}m
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', maxHeight: '100%' }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * R} y2={cy + Math.sin(a) * R} stroke="var(--line-2)" strokeOpacity="0.4" strokeWidth={1} />;
        })}
        {rings.map(d => {
          const rr = rScale(d);
          const isCap = hitCaps.includes(d);
          return (
            <g key={d}>
              <circle cx={cx} cy={cy} r={rr} fill="none" stroke={isCap ? '#6b2020' : 'var(--line-2)'} strokeOpacity={isCap ? 1 : 0.5} strokeWidth={isCap ? 1.5 : 1} strokeDasharray={isCap ? '5 3' : '2 5'} />
              <text x={cx} y={cy - rr - 3} textAnchor="middle" fontFamily="var(--mono)" fontSize="10" fill={isCap ? '#6b2020' : 'var(--fg-low)'} letterSpacing="0.14em">
                {d >= 1000 ? `${(d / 1000).toFixed(d % 1000 ? 1 : 0)}KM` : `${d}M`}{isCap ? ' CAP' : ''}
              </text>
            </g>
          );
        })}
        {sorted.map((it, i) => {
          const a = angleAt(i);
          const rr = rScale(it.res.capped);
          const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
          const col = arcColor(it.res.capped, mode);
          const lx = cx + Math.cos(a) * (Math.min(rr + 28, R - 10) + 14);
          const ly = cy + Math.sin(a) * (Math.min(rr + 28, R - 10) + 14);
          const anchor = Math.cos(a) > 0.15 ? 'start' : Math.cos(a) < -0.15 ? 'end' : 'middle';
          const da = 0.05;
          const ax1 = cx + Math.cos(a - da) * rr, ay1 = cy + Math.sin(a - da) * rr;
          const ax2 = cx + Math.cos(a + da) * rr, ay2 = cy + Math.sin(a + da) * rr;
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={px} y2={py} stroke={col} strokeOpacity="0.22" strokeWidth={1} strokeDasharray="2 4" />
              <path d={`M ${ax1} ${ay1} A ${rr} ${rr} 0 0 1 ${ax2} ${ay2}`} stroke={col} strokeWidth={5} fill="none" strokeLinecap="round" />
              <circle cx={px} cy={py} r={4} fill={col} />
              <text x={lx} y={ly - 7} textAnchor={anchor} fontFamily="var(--mono)" fontSize="11" fill="var(--fg)" letterSpacing="0.1em">{it.label}</text>
              <text x={lx} y={ly + 8} textAnchor={anchor} fontFamily="var(--mono)" fontSize="13" fontWeight="600" fill={col} letterSpacing="0.04em">{fmt0(it.res.capped)}m{it.res.capHit ? ' ↑' : ''}</text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={20} fill="none" stroke="var(--blue)" strokeOpacity="0.3" />
        <circle cx={cx} cy={cy} r={10} fill="none" stroke="var(--blue)" strokeOpacity="0.6" />
        <circle cx={cx} cy={cy} r={4} fill="var(--blue)" />
        <text x={cx} y={cy + 32} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" letterSpacing="0.18em" fill="var(--fg-low)">SPOTTER</text>
      </svg>
    </div>
  );
}

/* ─── URL param helpers ───────────────────────────────────────── */
function readParams() {
  const p = new URLSearchParams(window.location.search);
  const mode = p.get('mode') === 'air' ? 'air' : 'ground';
  const spotter = p.get('spotter') ?? '';
  return {
    mode,
    spotterHeli: spotter === 'heli',
    target: ['ground', 'heli', 'plane'].includes(spotter) ? spotter : 'ground',
    O: parseFloat(p.get('o')) || 120,
    S: parseFloat(p.get('s')) || 1.5,
    lock: p.get('lock') === 'stealth' ? 'stealth' : 'optics',
  };
}

/* ─── App ────────────────────────────────────────────────────── */
export function App() {
  const init = React.useMemo(readParams, []);
  const [mode, setMode] = React.useState(init.mode);
  const [view, setView] = React.useState('matrix');
  const [lock, setLock] = React.useState(init.lock);
  const [O, setO] = React.useState(init.O);
  const [S, setS] = React.useState(init.S);
  const [N, setN] = React.useState(1.0);
  const [C, setC] = React.useState(1);
  const [spotterHeli, setSpotterHeli] = React.useState(init.spotterHeli);
  const [target, setTarget] = React.useState(init.target);
  const [detail, setDetail] = React.useState(null);

  const opticsSet = mode === 'ground' ? GROUND_OPTICS : AIR_OPTICS[target];
  const stealthSet = mode === 'ground' ? STEALTH : STEALTH_AIR;
  const stealthSidebar = mode === 'ground' ? STEALTH_SIDEBAR_GROUND : STEALTH_SIDEBAR_AIR;
  React.useEffect(() => {
    if (!opticsSet.find(o => o.v === O)) setO(opticsSet[Math.floor(opticsSet.length / 2)].v);
  }, [mode, target]);

  React.useEffect(() => {
    if (!stealthSet.find(s => s.v === S)) setS(stealthSet[0].v);
  }, [mode]);

  React.useEffect(() => {
    const p = new URLSearchParams();
    p.set('mode', mode);
    p.set('spotter', mode === 'ground' ? (spotterHeli ? 'heli' : 'ground') : target);
    p.set('o', O);
    p.set('s', S);
    p.set('lock', lock);
    history.replaceState(null, '', '?' + p.toString());
  }, [mode, spotterHeli, target, O, S, lock]);

  const calc = (o, s) => calcRange({ O: o, S: s, N, C: mode === 'ground' ? C : 1, mode, isHeli: spotterHeli });

  const handlePickO = v => { setO(v); setLock('optics'); };
  const handlePickS = v => { setS(v); setLock('stealth'); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg)', color: 'var(--fg)', fontFamily: 'var(--mono)' }}>
      <Topbar mode={mode} setMode={setMode} view={view} setView={setView} />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '270px 1fr', minHeight: 0 }}>
        <Sidebar
          mode={mode} lock={lock}
          O={O} onPickO={handlePickO}
          S={S} onPickS={handlePickS}
          N={N} setN={setN} C={C} setC={setC}
          spotterHeli={spotterHeli} setSpotterHeli={setSpotterHeli}
          target={target} setTarget={setTarget}
          opticsSet={opticsSet} stealthSidebar={stealthSidebar}
        />
        {view === 'matrix'
          ? <MatrixView mode={mode} lock={lock} O={O} S={S} N={N} C={mode === 'ground' ? C : 1} opticsSet={opticsSet} stealthSet={stealthSet} calc={calc} onDetail={setDetail} />
          : <RadarView  mode={mode} lock={lock} O={O} S={S} N={N} C={mode === 'ground' ? C : 1} opticsSet={opticsSet} stealthSet={stealthSet} calc={calc} />
        }
      </div>
    </div>
  );
}
