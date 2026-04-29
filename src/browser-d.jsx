import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  BROWSER_TOKENS, BMono,
  ALL_NATIONS, PACT_NATIONS, COALITIONS, COALITION_NATIONS,
  SPECS, TABS, NATION_FLAG_MAP, COALITION_FLAG_MAP,
} from './constants.js';
import {
  UnitListRow, useFilterState, CardPane,
} from './browser-shared.jsx';

// ── Segmented filter row ──────────────────────────────────────────────────────
// options: string[] (raw values) or { label, value }[] for display-name separation

function Seg({ label, options, selected, onToggle, onSolo, rightSlot }) {
  const t = BROWSER_TOKENS;
  const items = [
    { label: 'ALL', value: null },
    ...options.map(o => typeof o === 'string' ? { label: o, value: o } : o),
  ];
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderTop: `1px solid ${t.rule}`, borderBottom: `1px solid ${t.rule}`,
      marginTop: -1,
    }}>
      <div style={{
        width: 68, flexShrink: 0, padding: '6px 12px',
        borderRight: `1px solid ${t.rule}`,
        background: `color-mix(in srgb, ${t.surface} 80%, black)`,
        display: 'flex', alignItems: 'center',
        fontSize: 9.5, color: t.dim, letterSpacing: '0.22em',
      }}>{label}</div>
      <div style={{
        flex: 1, display: 'flex', flexWrap: 'nowrap', overflowX: 'auto',
        padding: '2px 8px', gap: 0, alignItems: 'center',
      }}>
        {items.map((item, i) => {
          if (item.separator) {
            return <div key={`sep-${i}`} style={{
              width: 1, alignSelf: 'stretch', background: t.rule, margin: '4px 6px',
            }} />;
          }
          const { label: lbl, value: val } = item;
          const active = val == null
            ? selected.length === 0
            : selected.includes(val);
          return (
            <button key={lbl} onClick={() => onToggle(val)} onDoubleClick={val != null ? (e) => { e.preventDefault(); onSolo(val); } : undefined} style={{
              ...BMono,
              background: 'transparent',
              color: active ? t.accent : t.dim,
              border: 'none',
              padding: item.flag ? '3px 6px' : '4px 10px',
              fontSize: 10.5,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer',
              borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
              borderTop: '2px solid transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              {item.flag
                ? <img src={item.flag} alt={lbl} style={{ height: 14, width: 'auto', opacity: active ? 1 : 0.55 }} />
                : null}
              <span>{lbl}</span>
            </button>
          );
        })}
      </div>
      {rightSlot}
    </div>
  );
}


// Crosshair corner overlay for the card workspace
function CornerMarks() {
  const t = BROWSER_TOKENS;
  const mark = (pos) => (
    <div style={{
      position: 'absolute', width: 10, height: 10,
      borderColor: t.ruleStrong, pointerEvents: 'none', ...pos,
    }} />
  );
  return (
    <>
      {mark({ top: 0, left: 0, borderLeft: `1px solid ${t.ruleStrong}`, borderTop: `1px solid ${t.ruleStrong}` })}
      {mark({ top: 0, right: 0, borderRight: `1px solid ${t.ruleStrong}`, borderTop: `1px solid ${t.ruleStrong}` })}
      {mark({ bottom: 0, left: 0, borderLeft: `1px solid ${t.ruleStrong}`, borderBottom: `1px solid ${t.ruleStrong}` })}
      {mark({ bottom: 0, right: 0, borderRight: `1px solid ${t.ruleStrong}`, borderBottom: `1px solid ${t.ruleStrong}` })}
    </>
  );
}

// Multi-select tag dropdown
function TagDropdown({ allTags, selected, onToggle }) {
  const t = BROWSER_TOKENS;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const active = selected.length > 0;
  const label = active ? `TAG: ${selected.length}` : 'TAG: ALL';

  return (
    <div ref={ref} style={{ position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'stretch' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        ...BMono,
        background: 'transparent',
        color: active ? t.accent : t.dim,
        border: 'none',
        borderLeft: `1px solid ${t.rule}`,
        padding: '0 10px',
        fontSize: 10.5,
        letterSpacing: '0.14em',
        cursor: 'pointer',
        outline: 'none',
        alignSelf: 'stretch',
        borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
        borderTop: '2px solid transparent',
        whiteSpace: 'nowrap',
      }}>{label}</button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0,
          background: t.surface,
          border: `1px solid ${t.rule}`,
          zIndex: 20,
          display: 'flex', flexDirection: 'column',
          minWidth: 130,
        }}>
          <button onClick={() => onToggle(null)} style={{
            ...BMono,
            background: 'transparent',
            color: selected.length === 0 ? t.accent : t.dim,
            border: 'none',
            borderBottom: `1px solid ${t.rule}`,
            padding: '5px 12px',
            fontSize: 10.5, letterSpacing: '0.14em',
            textAlign: 'left', cursor: 'pointer',
          }}>ALL</button>
          {allTags.map(tag => {
            const on = selected.includes(tag);
            return (
              <button key={tag} onClick={() => onToggle(tag)} style={{
                ...BMono,
                background: 'transparent',
                color: on ? t.accent : t.dim,
                border: 'none',
                padding: '5px 12px',
                fontSize: 10.5, letterSpacing: '0.14em',
                textAlign: 'left', cursor: 'pointer',
                borderLeft: `2px solid ${on ? t.accent : 'transparent'}`,
              }}>{tag}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Browser D ─────────────────────────────────────────────────────────────────

export function BrowserD({ roster, units, initialUnit }) {
  const t = BROWSER_TOKENS;
  const { f, setF, toggle, select, solo, toggleCoalition, toggleSide, filtered } = useFilterState(roster);
  const natoNations = ALL_NATIONS.filter(n => !PACT_NATIONS.has(n));
  const pactNations = ALL_NATIONS.filter(n =>  PACT_NATIONS.has(n));
  const [selected, setSelected] = useState(initialUnit ?? null);
  const [pinned,   setPinned]   = useState([]);
  const [listOpen, setListOpen] = useState(true);
  const [winWidth, setWinWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const onResize = () => setWinWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isMobile = winWidth < 900;

  useEffect(() => {
    if (isMobile) setPinned([]);
  }, [isMobile]);

  const selectUnit = useCallback((id) => {
    setSelected(id);
    history.replaceState(null, '', `?unit=${encodeURIComponent(id)}`);
  }, []);

  const togglePin = (id) => setPinned(p =>
    p.includes(id) ? [] : [id]
  );

  const allTags = useMemo(() => [...new Set(roster.flatMap(u => u.unitTags))].sort(), [roster]);

  // Nation options using short codes with a separator between NATO and PACT
  const nationOptions = ALL_NATIONS.flatMap((code, i, arr) => {
    const item = { label: code, value: code, flag: NATION_FLAG_MAP[code] };
    const addSep = i > 0 && !PACT_NATIONS.has(arr[i - 1]) && PACT_NATIONS.has(code);
    return addSep ? [{ separator: true }, item] : [item];
  });

  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg, color: t.ink,
      ...BMono, fontSize: 12,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        flexShrink: 0, padding: '4px 18px',
        borderBottom: `1px solid ${t.rule}`,
        background: t.surface,
        display: 'flex', alignItems: 'center', gap: 14,
        overflowX: 'auto',
      }}>
        <div style={{ fontSize: 13, letterSpacing: '0.24em', color: t.ink, fontWeight: 600, flexShrink: 0 }}>
          ARMORY<span style={{ color: t.accent, marginLeft: 4 }}>/WRD</span>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: t.rule, flexShrink: 0, margin: '4px 0' }} />
        {/* Coalition shortcuts */}
        {(() => {
          const coalBtn = (label, flagSrc, onClick, active, color) => (
            <button key={label} onClick={onClick} style={{
              ...BMono,
              background: 'transparent', color: active ? color : t.dim,
              border: 'none', padding: '3px 6px', fontSize: 9,
              letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
              borderBottom: `2px solid ${active ? color : 'transparent'}`,
              borderTop: '2px solid transparent',
              flexShrink: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              {flagSrc && <img src={flagSrc} alt={label} style={{ height: 16, width: 'auto', opacity: active ? 1 : 0.5 }} />}
              <span>{label}</span>
            </button>
          );
          const natoActive = natoNations.length > 0 && natoNations.every(n => f.nation.includes(n));
          const pactActive = pactNations.length > 0 && pactNations.every(n => f.nation.includes(n));
          return (
            <>
              {coalBtn('ALL',  null,                          () => toggleCoalition(null),      f.nation.length === 0, t.accent)}
              {coalBtn('NATO', COALITION_FLAG_MAP['NATO'],    () => toggleSide(natoNations),    natoActive,            t.natoTag)}
              {coalBtn('PACT', COALITION_FLAG_MAP['PACT'],    () => toggleSide(pactNations),    pactActive,            t.pactTag)}
              <div style={{ width: 1, alignSelf: 'stretch', background: t.rule, margin: '4px 2px', flexShrink: 0 }} />
              {COALITIONS.map(name => {
                const members = COALITION_NATIONS[name];
                const active  = members.length > 0 && members.every(n => f.nation.includes(n));
                return coalBtn(name, COALITION_FLAG_MAP[name], () => toggleCoalition(name), active, t.accent);
              })}
            </>
          );
        })()}
      </div>

      {/* ── Filter bar: 2 stacked rows ── */}
      <div style={{ flexShrink: 0, background: t.surface }}>
        <Seg label="NATION" options={nationOptions} selected={f.nation} onToggle={toggle('nation')} onSolo={solo('nation')} />
        <Seg label="TAB" options={TABS} selected={f.tab} onToggle={select('tab')} onSolo={solo('tab')} />
      </div>

      {/* ── Main split: list | cards ── */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: listOpen ? '290px 1fr' : '32px 1fr', minHeight: 0,
      }}>
        {/* Unit list */}
        <div style={{
          borderRight: `1px solid ${t.rule}`,
          display: 'flex', flexDirection: 'column', minHeight: 0,
          background: t.surface, overflow: 'hidden',
        }}>
          {/* Search row + toggle button */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            borderBottom: `1px solid ${t.rule}`, padding: '5px 10px',
            background: t.bg, flexShrink: 0,
          }}>
            {listOpen && <>
              <span style={{ color: t.dimmer, fontSize: 10 }}>⌕</span>
              <input
                value={f.q}
                onChange={e => setF({ ...f, q: e.target.value })}
                placeholder="search…"
                style={{
                  ...BMono, background: 'transparent', color: t.ink,
                  border: 'none', padding: '2px 0',
                  fontSize: 11, outline: 'none', flex: 1,
                  letterSpacing: '0.04em',
                }}
              />
            </>}
            <button
              onClick={() => setListOpen(o => !o)}
              title={listOpen ? 'Collapse list' : 'Expand list'}
              style={{
                ...BMono,
                background: 'transparent', color: t.dim,
                border: 'none', padding: '2px 4px',
                fontSize: 12, cursor: 'pointer',
                flexShrink: 0, lineHeight: 1,
              }}
            >{listOpen ? '◀' : '▶'}</button>
          </div>

          {listOpen && <>
            {/* SPEC / ERA / TAG filter row */}
            <div style={{
              display: 'flex', alignItems: 'stretch',
              borderBottom: `1px solid ${t.rule}`,
              background: `color-mix(in srgb, ${t.surface} 80%, black)`,
              flexShrink: 0,
            }}>
              <select
                value={f.spec[0] ?? ''}
                onChange={e => select('spec')(e.target.value || null)}
                style={{
                  ...BMono,
                  flex: 1,
                  background: 'transparent',
                  color: f.spec.length ? t.accent : t.dim,
                  border: 'none',
                  borderRight: `1px solid ${t.rule}`,
                  padding: '4px 6px',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  outline: 'none',
                  borderBottom: `2px solid ${f.spec.length ? t.accent : 'transparent'}`,
                  borderTop: '2px solid transparent',
                }}
              >
                <option value="">SPEC: ALL</option>
                {SPECS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
              </select>
              <select
                value={f.era[0] ?? ''}
                onChange={e => select('era')(e.target.value || null)}
                style={{
                  ...BMono,
                  flex: 1,
                  background: 'transparent',
                  color: f.era.length ? t.accent : t.dim,
                  border: 'none',
                  borderRight: `1px solid ${t.rule}`,
                  padding: '4px 6px',
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  cursor: 'pointer',
                  outline: 'none',
                  borderBottom: `2px solid ${f.era.length ? t.accent : 'transparent'}`,
                  borderTop: '2px solid transparent',
                }}
              >
                <option value="">ERA: ALL</option>
                <option value="PRE-85">PRE-85</option>
                <option value="PRE-80">PRE-80</option>
              </select>
              <TagDropdown allTags={allTags} selected={f.tag} onToggle={toggle('tag')} />
            </div>

            {/* Targets count */}
            <div style={{
              padding: '8px 12px', borderBottom: `1px solid ${t.rule}`,
              fontSize: 10, letterSpacing: '0.22em', color: t.dimmer,
              display: 'flex', justifyContent: 'space-between', flexShrink: 0,
            }}>
              <span>▸ TARGETS</span>
              <span style={{ color: t.accent }}>{filtered.length} / {roster.length}</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              {filtered.map(u => (
                <UnitListRow
                  key={u.id} u={u}
                  active={selected === u.id}
                  pinned={pinned.includes(u.id)}
                  onClick={() => selectUnit(u.id)}
                  onPin={() => togglePin(u.id)}
                  onTransportClick={selectUnit}
                  selectedId={selected}
                  compact
                />
              ))}
              {filtered.length === 0 && (
                <div style={{
                  padding: 24, textAlign: 'center',
                  color: t.dimmer, fontSize: 10, letterSpacing: '0.2em',
                }}>◦ NO RESULTS</div>
              )}
            </div>
          </>}
        </div>

        {/* Card workspace */}
        <div style={{
          padding: 18, minHeight: 0,
          display: 'flex', flexDirection: 'column', gap: 10,
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 10, letterSpacing: '0.22em', color: t.dimmer,
            flexShrink: 0,
          }}>
            <span style={{ color: t.accent }}>◉</span>
            <span>WORKSPACE</span>
            <div style={{ flex: 1, borderTop: `1px solid ${t.rule}` }} />
            {!isMobile && <span>{pinned.length} PINNED</span>}
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: 6 }}>
            <CornerMarks />
            <CardPane
              selectedId={selected}
              pinnedIds={pinned}
              onTogglePin={togglePin}
              units={units}
              slots={2}
              selectedSpec={f.spec[0] ?? null}
              noPins={isMobile}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
