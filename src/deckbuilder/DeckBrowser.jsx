import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BROWSER_TOKENS, BMono,
  NATION_FLAG_MAP, COALITION_FLAG_MAP,
  SPECS, TABS,
  UnitList, V2Card, sideOf, SPEC_VET_BONUS, FlagImg,
} from '@units-core';
import { VET_TIERS } from '@units-core/constants/veterancy.js';
import { useWindowWidth } from '../armory/useWindowWidth.js';
import { Seg } from '../armory/Seg.jsx';
import { TagDropdown } from '../armory/TagDropdown.jsx';
import { CornerMarks } from '../armory/CornerMarks.jsx';
import { CardSlot } from '../armory/CardSlot.jsx';
import { OverviewTab } from './OverviewTab.jsx';
import { DeckBar } from './DeckBar.jsx';

const BASE = import.meta.env.BASE_URL;
import { classifyDeckChoice } from './deckConstants.js';

const WEAPON_TAG_GROUPS = [
  ['AL', 'AoE', 'STAT', 'NPLM'],
  ['KE', 'HEAT'],
  ['AC', 'MG', 'GL'],
  ['FnF', 'SA', 'GUID'],
  ['INDIR', 'MLRS', 'MOR', 'HOW', 'SMK'],
  ['SEAD', 'BOMB', 'LGB'],
  ['RAD', 'SAM', 'SPAAG'],
  ['SHIP', 'DEF'],
];

const UNIT_TAG_GROUPS = [
  ['INF', 'VEH', 'HEL', 'AIR', 'SHIP', 'FOB'],
  ['RESRV', 'REG', 'SHOCK', 'ELITE'],
  ['TRACK', 'WHEEL', 'TRUCK', 'AMPH'],
  ['TRANS', 'CMD', 'SUPPL', 'ARMOR', 'RECON'],
];

const MOBILE_BREAKPOINT = 900;

function shiftAvail(avail, shift) {
  if (!shift || !avail) return avail;
  const result = [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i++) {
    const target = Math.min(i + shift, 4);
    result[target] = Math.max(result[target], avail[i] ?? 0);
  }
  return result;
}

function effectiveAvail(unit, spec) {
  if (!unit?.avail || !spec) return unit?.avail;
  const shift = (SPEC_VET_BONUS[spec] ?? {})[unit.tab] ?? 0;
  return shift > 0 ? shiftAvail(unit.avail, shift) : unit.avail;
}

function applyAvailBonus(avail, bonusPct) {
  if (!avail || !bonusPct) return avail;
  return avail.map(a => a > 0 ? Math.max(1, Math.round(a * (100 + bonusPct) / 100)) : 0);
}

function lowestAvailVet(avail) {
  const idx = avail?.findIndex(a => a > 0) ?? -1;
  return idx >= 0 ? idx : 0;
}

export function DeckBrowser({ roster, units, deckState }) {
  const t = BROWSER_TOKENS;
  const {
    config, cards, nations, deckType, availBonus,
    totalAP, usedAP, tabSlots, deckCode, costMatrix,
    addCard, removeCard, clearDeck, resetDeck,
  } = deckState;

  const isAlliance = deckType === 'alliance';

  const transportIds = useMemo(() => {
    const ids = new Set();
    for (const u of roster) {
      for (const t of u.transports) ids.add(t.id);
    }
    return ids;
  }, [roster]);

  const deckRoster = useMemo(() => {
    return roster.filter(u => {
      if (transportIds.has(u.id)) return false;
      if (!nations.includes(u.nation)) return false;
      if (isAlliance && units[u.id]?.prototype) return false;
      if (config.era === 'B' && u.era !== 'PRE-80' && u.era !== 'PRE-85' && u.era != null) return false;
      if (config.era === 'C' && u.era !== 'PRE-80') return false;
      if (config.era === 'B') {
        const year = units[u.id]?.year ?? 0;
        if (year > 1985) return false;
      }
      if (config.era === 'C') {
        const year = units[u.id]?.year ?? 0;
        if (year > 1980) return false;
      }
      if (config.spec && !u.specs.some(s => s === config.spec)) return false;
      return true;
    });
  }, [roster, nations, isAlliance, config?.era, config?.spec, units]);

  // --- Filter state (simplified from useFilterState, no coalition toggle) ---
  const [f, setF] = useState({ nation: [], spec: [], tab: [], era: [], tag: [], q: '' });
  const [tagMode, setTagMode] = useState('OR');
  const toggleTagMode = useCallback(() => setTagMode(m => m === 'OR' ? 'AND' : m === 'AND' ? 'NOT' : 'OR'), []);
  const [showOverview, setShowOverview] = useState(true);

  const toggle = useCallback((key) => (val) => {
    setF(prev => {
      if (val == null) return { ...prev, [key]: [] };
      const has = prev[key].includes(val);
      return { ...prev, [key]: has ? prev[key].filter(x => x !== val) : [...prev[key], val] };
    });
  }, []);

  const solo = useCallback((key) => (val) => {
    if (val == null) return;
    setF(prev => ({ ...prev, [key]: [val] }));
  }, []);

  const select = useCallback((key) => (val) => {
    setF(prev => {
      if (val == null) return { ...prev, [key]: [] };
      const already = prev[key].length === 1 && prev[key][0] === val;
      return { ...prev, [key]: already ? [] : [val] };
    });
  }, []);

  const setQ = useCallback((q) => setF(prev => ({ ...prev, q })), []);

  const filtered = useMemo(() => {
    const q = f.q.toLowerCase();
    return deckRoster.filter(u => {
      if (f.nation.length && !f.nation.includes(u.nation)) return false;
      if (f.spec.length   && !u.specs.some(s => f.spec.includes(s))) return false;
      if (f.tab.length    && !f.tab.includes(u.tab)) return false;
      if (f.tag.length) {
        let check;
        if (tagMode === 'AND') check = f.tag.every(t => u.unitTags.includes(t));
        else if (tagMode === 'NOT') check = f.tag.every(t => !u.unitTags.includes(t));
        else check = f.tag.some(t => u.unitTags.includes(t));
        if (!check) return false;
      }
      if (q && !u.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [deckRoster, f, tagMode]);

  const [selected, setSelected]         = useState(null);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [displayUnitId, setDisplayUnitId] = useState(null);
  const [expandedTransports, setExpandedTransports] = useState(() => new Set());
  const [listOpen, setListOpen]         = useState(true);
  const [pinned, setPinned]             = useState([]);

  const winWidth = useWindowWidth();
  const isMobile = winWidth < MOBILE_BREAKPOINT;

  useEffect(() => { if (isMobile) setPinned([]); }, [isMobile]);

  const togglePin = useCallback((id) => {
    setPinned(p => p.includes(id) ? [] : [id]);
  }, []);

  const selectUnit = useCallback((id, isTransport = false, parentId = null) => {
    if (isTransport) {
      setSelected(parentId);
      setSelectedTransport(id);
      setDisplayUnitId(id);
      return;
    }
    const entry = deckRoster.find(u => u.id === id);
    if (!entry) return;
    const isReclick = id === selected;
    setSelected(id);
    setDisplayUnitId(id);
    if (!isReclick && entry.transports?.length > 0) {
      setExpandedTransports(prev => { const n = new Set(prev); n.add(id); return n; });
      setSelectedTransport(entry.transports[0].id);
    } else if (!entry.transports?.length) {
      setSelectedTransport(null);
    }
  }, [deckRoster, selected]);

  const toggleTransports = useCallback((id) => {
    setExpandedTransports(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const nationOptions = useMemo(() => {
    return nations.map(code => ({ label: code, value: code, flag: NATION_FLAG_MAP[code] }));
  }, [nations]);

  const allOwnTags = useMemo(() => {
    const available = new Set(deckRoster.flatMap(u => u.ownTags));
    const grouped = UNIT_TAG_GROUPS.map(g => g.filter(t => available.has(t))).filter(g => g.length > 0);
    const seen = new Set(grouped.flat());
    const rest = [...available].filter(t => !seen.has(t)).sort();
    if (rest.length) grouped.push(rest);
    return grouped;
  }, [deckRoster]);

  const allWeaponTags = useMemo(() => {
    const available = new Set(deckRoster.flatMap(u => u.unitTags.filter(t => !u.ownTags.includes(t))));
    const grouped = WEAPON_TAG_GROUPS.map(g => g.filter(t => available.has(t))).filter(g => g.length > 0);
    const seen = new Set(grouped.flat());
    const rest = [...available].filter(t => !seen.has(t)).sort();
    if (rest.length) grouped.push(rest);
    return grouped;
  }, [deckRoster]);

  const setSearch = useCallback((e) => setQ(e.target.value), [setQ]);

  const specForCard = config?.spec ?? null;
  const unit = units?.[selected];
  const cardUnit = units?.[displayUnitId] ?? unit;
  const avail = unit ? applyAvailBonus(effectiveAvail(unit, specForCard), availBonus) : null;
  const [vet, setVet] = useState(0);

  useEffect(() => {
    const u = units?.[selected];
    const a = u ? applyAvailBonus(effectiveAvail(u, specForCard), availBonus) : null;
    setVet(lowestAvailVet(a));
  }, [selected, specForCard, units, availBonus]);

  const packCounts = useMemo(() => {
    const map = {};
    for (const c of cards) map[c.unitId] = (map[c.unitId] ?? 0) + 1;
    return map;
  }, [cards]);

  const transportPackCounts = useMemo(() => {
    const map = {};
    for (const c of cards) {
      if (c.transportId) map[c.transportId] = (map[c.transportId] ?? 0) + 1;
    }
    return map;
  }, [cards]);

  const packsInDeck = selected ? (packCounts[selected] ?? 0) : 0;
  const transportPacksInDeck = selectedTransport ? (transportPackCounts[selectedTransport] ?? 0) : 0;
  const maxPacksReached = unit != null && (
    packsInDeck >= (unit.maxPacks ?? Infinity) ||
    (selectedTransport != null && transportPacksInDeck >= (units[selectedTransport]?.maxPacks ?? Infinity))
  );

  const transportAvail = selectedTransport
    ? applyAvailBonus(units[selectedTransport]?.avail ?? null, availBonus)
    : null;
  const displayAvail = avail && transportAvail
    ? avail.map((a, i) => Math.min(a, transportAvail[i] ?? 0))
    : avail;

  const handleVetAdd = useCallback((vetIdx) => {
    if (!selected || !displayAvail || displayAvail[vetIdx] === 0) return;
    const unitEntry = deckRoster.find(u => u.id === selected);
    if (packsInDeck >= (unitEntry?.maxPacks ?? Infinity)) return;
    let transport = selectedTransport;
    if (!transport && unitEntry?.transports?.length > 0) {
      transport = unitEntry.transports[0].id;
    }
    if (transport) {
      const tPacks = transportPackCounts[transport] ?? 0;
      if (tPacks >= (units[transport]?.maxPacks ?? Infinity)) return;
    }
    addCard(selected, vetIdx, transport);
    setVet(vetIdx);
  }, [selected, displayAvail, packsInDeck, selectedTransport, deckRoster, addCard, transportPackCounts, units]);

  const handleSelectTab = useCallback((tab) => {
    setShowOverview(false);
    setF(prev => ({ ...prev, tab: [tab] }));
  }, []);

  const deckTabOptions = useMemo(() => {
    return TABS.map(tab => {
      const slot = tabSlots[tab];
      const suffix = slot ? ` ${slot.used}/${slot.total}` : '';
      return { label: tab + suffix, value: tab };
    });
  }, [tabSlots]);

  const handleTabSelect = useCallback((val) => {
    if (val == null) {
      setShowOverview(true);
      setF(prev => ({ ...prev, tab: [] }));
    } else {
      setShowOverview(false);
      setF(prev => ({ ...prev, tab: [val] }));
    }
  }, []);

  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg, color: t.ink,
      ...BMono, fontSize: 12,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header bar - no coalition filter, just title + deck info */}
      <div style={{
        flexShrink: 0, padding: '4px 18px',
        borderBottom: `1px solid ${t.rule}`,
        background: t.surface,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <a href={BASE} style={{ fontSize: 13, letterSpacing: '0.24em', fontWeight: 600, flexShrink: 0, textDecoration: 'none', color: 'inherit' }}>
          DECK<span style={{ color: t.accent, marginLeft: 4 }}>BUILDER</span>
        </a>
        <div style={{ width: 1, alignSelf: 'stretch', background: t.rule, flexShrink: 0, margin: '4px 0' }} />
        <span style={{ fontSize: 10, color: t.dimmer, letterSpacing: '0.1em' }}>
          {config.choice}
          {config.spec ? ` · ${config.spec}` : ' · General'}
          {` · Era ${config.era}`}
        </span>
      </div>

      {/* Nation + Tab filter bars */}
      <div style={{ flexShrink: 0, background: t.surface }}>
        {nations.length > 1 && (
          <Seg label="NATION" options={nationOptions} selected={f.nation} onToggle={toggle('nation')} onSolo={solo('nation')} />
        )}
        <div style={{
          display: 'flex', alignItems: 'stretch',
          borderBottom: `1px solid ${t.rule}`,
          overflowX: 'auto',
        }}>
          <button
            onClick={() => handleTabSelect(null)}
            style={{
              ...BMono,
              background: showOverview ? t.accent : 'transparent',
              color: showOverview ? t.bg : t.dim,
              border: 'none', padding: '4px 10px', fontSize: 10,
              letterSpacing: '0.1em', cursor: 'pointer',
              borderRight: `1px solid ${t.rule}`,
            }}
          >OVERVIEW</button>
          {deckTabOptions.map(opt => {
            const active = f.tab.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => handleTabSelect(opt.value)}
                style={{
                  ...BMono,
                  background: 'transparent',
                  color: active ? t.accent : t.dim,
                  border: 'none', padding: '4px 10px', fontSize: 10.5,
                  letterSpacing: '0.14em', cursor: 'pointer',
                  borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
                  borderTop: '2px solid transparent',
                }}
              >{opt.label}</button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: showOverview
          ? '1fr'
          : (listOpen ? '290px 1fr' : '32px 1fr'),
        minHeight: 0,
      }}>
        {showOverview ? (
          <OverviewTab
            tabSlots={tabSlots}
            units={units}
            onRemoveCard={removeCard}
            onSelectTab={handleSelectTab}
            config={config}
            availBonus={availBonus}
          />
        ) : (
          <>
            {/* List pane */}
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
                      value={f.q}
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
                    ...BMono, background: 'transparent', color: t.dim,
                    border: 'none', padding: '2px 4px', fontSize: 12,
                    cursor: 'pointer', flexShrink: 0, lineHeight: 1,
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
                    <FilterSelect
                      value={f.spec[0] ?? ''} active={f.spec.length > 0}
                      onChange={v => select('spec')(v || null)}
                      items={[['', 'SPEC: ALL'], ...SPECS.map(s => [s, s.toUpperCase()])]}
                    />
                    <TagDropdown
                      weaponTags={allWeaponTags} unitTags={allOwnTags}
                      selected={f.tag} onToggle={toggle('tag')}
                      tagMode={tagMode} onTagMode={toggleTagMode}
                    />
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
                        selectedTransportId={selectedTransport}
                        pinnedIds={pinned}
                        expandedIds={expandedTransports}
                        onSelect={selectUnit}
                        onToggleTransports={toggleTransports}
                        packCounts={packCounts}
                        transportPackCounts={transportPackCounts}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Card pane */}
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
                <span>SELECT VETERANCY TO ADD</span>
                <div style={{ flex: 1, borderTop: `1px solid ${t.rule}` }} />
                {selectedTransport && (
                  <span>Transport: {units[selectedTransport]?.name}</span>
                )}
              </div>
              <div style={{ flex: 1, minHeight: 0, position: 'relative', padding: 6 }}>
                <CornerMarks />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${!isMobile && pinned[0] && pinned[0] !== selected ? 2 : 1}, auto)`,
                  justifyContent: 'end',
                  gap: 14, height: '100%',
                }}>
                {!isMobile && pinned[0] && pinned[0] !== selected && (
                  <CardSlot
                    unitId={pinned[0]}
                    units={units}
                    isPinned={true}
                    onTogglePin={() => togglePin(pinned[0])}
                    selectedSpec={specForCard}
                  />
                )}
                {selected && unit ? (
                  <DeckCardSlot
                    unit={unit}
                    cardUnit={cardUnit}
                    avail={displayAvail}
                    vet={vet}
                    onVetAdd={handleVetAdd}
                    specForCard={specForCard}
                    tabSlots={tabSlots}
                    maxPacksReached={maxPacksReached}
                    isPinned={pinned.includes(selected)}
                    onTogglePin={() => togglePin(selected)}
                  />
                ) : (
                  <div className="armory-card-frame" style={{
                    ...BMono,
                    border: `1px dashed ${t.rule}`,
                    background: `color-mix(in srgb, ${t.surface} 50%, transparent)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 6,
                    color: t.dimmer, fontSize: 11, letterSpacing: '0.2em',
                  }}>
                    <span>◦ SELECT A UNIT</span>
                    <span style={{ fontSize: 9 }}>click a unit from the list</span>
                  </div>
                )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom deck bar */}
      <DeckBar
        deckCode={deckCode}
        usedAP={usedAP}
        totalAP={totalAP}
        onClear={clearDeck}
        onReset={resetDeck}
      />
    </div>
  );
}

function DeckCardSlot({ unit, cardUnit, avail, vet, onVetAdd, specForCard, tabSlots, maxPacksReached, isPinned, onTogglePin }) {
  const t = BROWSER_TOKENS;
  const tabFull = tabSlots[unit.tab]?.used >= tabSlots[unit.tab]?.total;

  return (
    <div className="armory-card-frame" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <V2Card
          unit={cardUnit}
          avail={avail}
          vetIdx={vet}
          setVetIdx={onVetAdd}
          theme={sideOf(unit.nation)}
          deckMode
          maxPacksReached={maxPacksReached}
        />
      </div>
      {tabFull && (
        <div style={{
          padding: '4px 10px', textAlign: 'center',
          fontSize: 10, color: '#e55', letterSpacing: '0.12em',
          borderTop: `1px solid ${t.rule}`,
        }}>
          {unit.tab} TAB FULL
        </div>
      )}
      {onTogglePin && (
        <button onClick={onTogglePin} style={{
          ...BMono,
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          background: 'rgba(0,0,0,0.4)', color: t.dim,
          border: `1px solid ${t.rule}`,
          padding: '2px 6px', fontSize: 10, letterSpacing: '0.1em',
          cursor: 'pointer',
        }}>{isPinned ? 'UNPIN ✕' : 'PIN'}</button>
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
