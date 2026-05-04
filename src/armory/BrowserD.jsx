import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BROWSER_TOKENS, BMono,
  ALL_NATIONS, PACT_NATIONS, NATION_FLAG_MAP,
  COALITIONS, COALITION_NATIONS, COALITION_FLAG_MAP,
  SPECS, TABS,
  writeUnitToUrl, useFilterState, UnitList,
} from '@units-core';
import { useWindowWidth } from './useWindowWidth.js';
import { Seg } from './Seg.jsx';
import { TagDropdown } from './TagDropdown.jsx';
import { CornerMarks } from './CornerMarks.jsx';
import { CardPane } from './CardPane.jsx';

const NATO_NATIONS = ALL_NATIONS.filter(n => !PACT_NATIONS.has(n));
const PACT_NATIONS_ORDERED = ALL_NATIONS.filter(n =>  PACT_NATIONS.has(n));

const NATION_OPTIONS = ALL_NATIONS.flatMap((code, i, arr) => {
  const item = { label: code, value: code, flag: NATION_FLAG_MAP[code] };
  const addSep = i > 0 && !PACT_NATIONS.has(arr[i - 1]) && PACT_NATIONS.has(code);
  return addSep ? [{ separator: true }, item] : [item];
});

const MOBILE_BREAKPOINT = 900;

export function BrowserD({ roster, units, initialUnit }) {
  const t = BROWSER_TOKENS;
  const { f, setQ, toggle, select, solo, toggleCoalition, toggleSide, filtered } = useFilterState(roster);

  const [selected, setSelected] = useState(initialUnit ?? null);
  const [pinned,   setPinned]   = useState([]);
  const [expandedTransports, setExpandedTransports] = useState(() => new Set());
  const [listOpen, setListOpen] = useState(true);

  const winWidth = useWindowWidth();
  const isMobile = winWidth < MOBILE_BREAKPOINT;

  useEffect(() => { if (isMobile) setPinned([]); }, [isMobile]);

  const selectUnit = useCallback((id) => {
    setSelected(id);
    writeUnitToUrl(id);
  }, []);

  const togglePin = useCallback((id) => {
    setPinned(p => p.includes(id) ? [] : [id]);
  }, []);

  const toggleTransports = useCallback((id) => {
    setExpandedTransports(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const allTags = useMemo(() => [...new Set(roster.flatMap(u => u.unitTags))].sort(), [roster]);

  const setSearch = useCallback((e) => setQ(e.target.value), [setQ]);

  const natoActive = NATO_NATIONS.length > 0 && NATO_NATIONS.every(n => f.nation.includes(n));
  const pactActive = PACT_NATIONS_ORDERED.length > 0 && PACT_NATIONS_ORDERED.every(n => f.nation.includes(n));

  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg, color: t.ink,
      ...BMono, fontSize: 12,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
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
        <CoalBtn label="ALL"  flagSrc={null}                          onClick={() => toggleCoalition(null)}            active={f.nation.length === 0} color={t.accent}  />
        <CoalBtn label="NATO" flagSrc={COALITION_FLAG_MAP['NATO']}    onClick={() => toggleSide(NATO_NATIONS)}         active={natoActive}            color={t.natoTag} />
        <CoalBtn label="PACT" flagSrc={COALITION_FLAG_MAP['PACT']}    onClick={() => toggleSide(PACT_NATIONS_ORDERED)} active={pactActive}            color={t.pactTag} />
        <div style={{ width: 1, alignSelf: 'stretch', background: t.rule, margin: '4px 2px', flexShrink: 0 }} />
        {COALITIONS.map(name => {
          const members = COALITION_NATIONS[name];
          const active  = members.length > 0 && members.every(n => f.nation.includes(n));
          return <CoalBtn key={name} label={name} flagSrc={COALITION_FLAG_MAP[name]} onClick={() => toggleCoalition(name)} active={active} color={t.accent} />;
        })}
      </div>

      <div style={{ flexShrink: 0, background: t.surface }}>
        <Seg label="NATION" options={NATION_OPTIONS} selected={f.nation} onToggle={toggle('nation')} onSolo={solo('nation')} />
        <Seg label="TAB"    options={TABS}           selected={f.tab}    onToggle={select('tab')}    onSolo={solo('tab')} />
      </div>

      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: listOpen ? '290px 1fr' : '32px 1fr', minHeight: 0,
      }}>
        <ListPane
          listOpen={listOpen}
          setListOpen={setListOpen}
          q={f.q}
          setSearch={setSearch}
          spec={f.spec}
          onSpec={select('spec')}
          era={f.era}
          onEra={select('era')}
          tag={f.tag}
          onTag={toggle('tag')}
          allTags={allTags}
          filtered={filtered}
          rosterCount={roster.length}
          selected={selected}
          pinnedIds={pinned}
          expandedTransports={expandedTransports}
          onSelect={selectUnit}
          onToggleTransports={toggleTransports}
        />

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

const CoalBtn = React.memo(function CoalBtn({ label, flagSrc, onClick, active, color }) {
  const t = BROWSER_TOKENS;
  return (
    <button onClick={onClick} style={{
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
});

function ListPane({
  listOpen, setListOpen,
  q, setSearch,
  spec, onSpec, era, onEra, tag, onTag, allTags,
  filtered, rosterCount,
  selected, pinnedIds, expandedTransports,
  onSelect, onToggleTransports,
}) {
  const t = BROWSER_TOKENS;

  return (
    <div style={{
      borderRight: `1px solid ${t.rule}`,
      display: 'flex', flexDirection: 'column', minHeight: 0,
      background: t.surface, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        borderBottom: `1px solid ${t.rule}`, padding: '5px 10px',
        background: t.bg, flexShrink: 0,
      }}>
        {listOpen && (
          <>
            <span style={{ color: t.dimmer, fontSize: 10 }}>⌕</span>
            <input
              value={q}
              onChange={setSearch}
              placeholder="search…"
              style={{
                ...BMono, background: 'transparent', color: t.ink,
                border: 'none', padding: '2px 0',
                fontSize: 11, outline: 'none', flex: 1,
                letterSpacing: '0.04em',
              }}
            />
          </>
        )}
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

      {listOpen && (
        <>
          <div style={{
            display: 'flex', alignItems: 'stretch',
            borderBottom: `1px solid ${t.rule}`,
            background: `color-mix(in srgb, ${t.surface} 80%, black)`,
            flexShrink: 0,
          }}>
            <FilterSelect value={spec[0] ?? ''} active={spec.length > 0} onChange={v => onSpec(v || null)}
              items={[['', 'SPEC: ALL'], ...SPECS.map(s => [s, s.toUpperCase()])]} />
            <FilterSelect value={era[0] ?? ''}  active={era.length > 0}  onChange={v => onEra(v || null)}
              items={[['', 'ERA: ALL'], ['PRE-85', 'PRE-85'], ['PRE-80', 'PRE-80']]} />
            <TagDropdown allTags={allTags} selected={tag} onToggle={onTag} />
          </div>


          <div style={{ flex: 1, minHeight: 0 }}>
            {filtered.length === 0 ? (
              <div style={{
                padding: 24, textAlign: 'center',
                color: t.dimmer, fontSize: 10, letterSpacing: '0.2em',
              }}>◦ NO RESULTS</div>
            ) : (
              <UnitList
                rows={filtered}
                selectedId={selected}
                pinnedIds={pinnedIds}
                expandedIds={expandedTransports}
                onSelect={onSelect}
                onToggleTransports={onToggleTransports}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

const FILTER_SELECT_BASE = {
  ...BMono,
  flex: 1,
  background: 'transparent',
  border: 'none',
  padding: '4px 6px',
  fontSize: 10,
  letterSpacing: '0.12em',
  cursor: 'pointer',
  outline: 'none',
};

function FilterSelect({ value, active, onChange, items }) {
  const t = BROWSER_TOKENS;
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        ...FILTER_SELECT_BASE,
        color: active ? t.accent : t.dim,
        borderRight: `1px solid ${t.rule}`,
        borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
        borderTop: '2px solid transparent',
      }}>
      {items.map(([v, label]) => <option key={label} value={v}>{label}</option>)}
    </select>
  );
}
