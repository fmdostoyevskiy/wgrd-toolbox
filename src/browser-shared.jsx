import React, { useState, useMemo } from 'react';
import { BROWSER_TOKENS, BMono, V2_THEMES, VET_TIERS, sideOf, COALITION_NATIONS, SPEC_VET_BONUS, NATION_FLAG_MAP } from './constants.js';
import { V2Card } from './v2-blueprint.jsx';

export { BROWSER_TOKENS, BMono };

// ── Flag image ────────────────────────────────────────────────────────────────
// h = rendered height in px; width auto preserves the 99×28 native aspect ratio

export function FlagImg({ src, label, h = 14 }) {
  const t = BROWSER_TOKENS;
  if (!src) return <span style={{ fontSize: 9.5, color: t.dim }}>{label}</span>;
  return (
    <img src={src} alt={label} title={label}
         style={{ height: h, width: 'auto', display: 'block' }} />
  );
}

// ── Chip toggle ───────────────────────────────────────────────────────────────

export function Chip({ label, active, onClick, size = 'md', tone = 'default' }) {
  const t = BROWSER_TOKENS;
  const activeColor = tone === 'nato' ? t.natoTag : tone === 'pact' ? t.pactTag : t.accent;
  const fs = size === 'sm' ? 10 : 11;
  return (
    <button onClick={onClick} style={{
      ...BMono,
      background: active ? `color-mix(in srgb, ${activeColor} 14%, transparent)` : 'transparent',
      color:  active ? activeColor : t.dim,
      border: `1px solid ${active ? activeColor : 'transparent'}`,
      padding: size === 'sm' ? '2px 6px' : '3px 8px',
      fontSize: fs, letterSpacing: '0.12em', textTransform: 'uppercase',
      cursor: 'pointer', lineHeight: 1.2, fontFamily: 'inherit', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

// ── Unit list row ─────────────────────────────────────────────────────────────

export function UnitListRow({ u, active, pinned, onClick, onPin, onTransportClick, selectedId, compact = false }) {
  const t = BROWSER_TOKENS;
  const side = sideOf(u.nation);
  const sideColor = side === 'signal' ? t.pactTag : t.natoTag;
  const hasTransports = u.transports && u.transports.length > 0;
  const [trspOpen, setTrspOpen] = useState(false);

  return (
    <div style={{
      ...BMono,
      borderLeft: `2px solid ${active ? sideColor : 'transparent'}`,
      background: active
        ? `color-mix(in srgb, ${sideColor} 12%, transparent)`
        : pinned
        ? `color-mix(in srgb, ${t.accent} 6%, transparent)`
        : 'transparent',
      borderBottom: `1px solid ${t.rule}`,
    }}>
      <div onClick={onClick} style={{
        display: 'grid', gridTemplateColumns: '30px 1fr 46px 16px',
        alignItems: 'center', gap: 6,
        padding: compact ? '3px 10px' : '5px 10px',
        fontSize: 11.5,
        color: t.ink, cursor: 'pointer',
      }}>
        <span style={{ fontSize: 9.5, letterSpacing: '0.12em', color: active ? sideColor : t.dimmer, fontWeight: 500 }}>
          {u.tab}
        </span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {u.name}
        </span>
        <span style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <FlagImg src={NATION_FLAG_MAP[u.nation]} label={u.nation} h={13} />
        </span>
        {hasTransports ? (
          <span
            onClick={e => { e.stopPropagation(); setTrspOpen(o => !o); }}
            style={{ fontSize: 10, color: trspOpen ? t.accent : t.dimmer, cursor: 'pointer', textAlign: 'center', userSelect: 'none', lineHeight: 1 }}
          >
            {trspOpen ? '▴' : '▾'}
          </span>
        ) : (
          <span />
        )}
      </div>
      {trspOpen && hasTransports && (
        <div style={{ borderLeft: `2px solid ${t.rule}`, marginLeft: 14, marginBottom: 4 }}>
          {u.transports.map(tr => {
            const trSide = sideOf(tr.nation);
            const trColor = trSide === 'signal' ? t.pactTag : t.natoTag;
            const trActive = selectedId === tr.id;
            return (
              <div key={tr.id} onClick={e => { e.stopPropagation(); onTransportClick?.(tr.id); }} style={{
                display: 'grid', gridTemplateColumns: '24px 1fr 40px',
                alignItems: 'center', gap: 6,
                padding: compact ? '3px 8px' : '4px 8px',
                fontSize: 10.5,
                color: t.ink, cursor: 'pointer',
                borderBottom: `1px solid ${t.rule}`,
                borderLeft: `2px solid ${trActive ? trColor : 'transparent'}`,
                background: trActive
                  ? `color-mix(in srgb, ${trColor} 10%, transparent)`
                  : 'transparent',
              }}>
                <span style={{ fontSize: 8.5, letterSpacing: '0.1em', color: trActive ? trColor : t.dimmer, fontWeight: 500 }}>
                  {tr.tab}
                </span>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tr.name}
                </span>
                <span style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <FlagImg src={NATION_FLAG_MAP[tr.nation]} label={tr.nation} h={11} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Filter state ──────────────────────────────────────────────────────────────

export function useFilterState(roster) {
  const [f, setF] = useState({ nation: [], spec: [], tab: [], era: [], tag: [], q: '' });

  // Toggle a single value in one of the array filter fields (multi-select)
  const toggle = (key) => (val) => {
    setF(prev => {
      if (val == null) return { ...prev, [key]: [] };
      const has = prev[key].includes(val);
      return { ...prev, [key]: has ? prev[key].filter(x => x !== val) : [...prev[key], val] };
    });
  };

  // Solo: select only this value, deselecting all others in the field
  const solo = (key) => (val) => {
    if (val == null) return;
    setF(prev => ({ ...prev, [key]: [val] }));
  };

  // Select exactly one value, or clear if already selected (single-select)
  const select = (key) => (val) => {
    setF(prev => {
      if (val == null) return { ...prev, [key]: [] };
      const already = prev[key].length === 1 && prev[key][0] === val;
      return { ...prev, [key]: already ? [] : [val] };
    });
  };

  // Coalition shortcut — toggles all member nations of a coalition in f.nation
  const toggleCoalition = (coalitionName) => {
    if (coalitionName == null) { setF(prev => ({ ...prev, nation: [] })); return; }
    const members = COALITION_NATIONS[coalitionName] ?? [];
    setF(prev => {
      const allActive = members.every(n => prev.nation.includes(n));
      return {
        ...prev,
        nation: allActive
          ? prev.nation.filter(n => !members.includes(n))
          : [...new Set([...prev.nation, ...members])],
      };
    });
  };

  // Side shortcut — toggles all nations of a given side (arbitrary nation array)
  const toggleSide = (sideNations) => {
    setF(prev => {
      const allActive = sideNations.every(n => prev.nation.includes(n));
      return {
        ...prev,
        nation: allActive
          ? prev.nation.filter(n => !sideNations.includes(n))
          : [...new Set([...prev.nation, ...sideNations])],
      };
    });
  };

  const filtered = useMemo(() => roster.filter(u => {
    if (f.nation.length && !f.nation.includes(u.nation)) return false;
    if (f.spec.length  && !u.specs.some(s => f.spec.includes(s))) return false;
    if (f.tab.length   && !f.tab.includes(u.tab)) return false;
    if (f.era.length) {
      const sel = f.era[0];
      if (sel === 'PRE-80' && u.era !== 'PRE-80') return false;
      if (sel === 'PRE-85' && !u.era) return false;
    }
    if (f.tag.length   && !f.tag.some(t => u.unitTags.includes(t))) return false;
    if (f.q && !u.name.toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  }), [roster, f]);

  return { f, setF, toggle, select, solo, toggleCoalition, toggleSide, filtered };
}

// ── Card pane ─────────────────────────────────────────────────────────────────

// Shift avail array right by `shift` positions, clamping overflow to Elite (index 4).
// Collisions at Elite take the max, not the sum.
function shiftAvail(avail, shift) {
  if (!shift || !avail) return avail;
  const result = [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i++) {
    const target = Math.min(i + shift, 4);
    result[target] = Math.max(result[target], avail[i] ?? 0);
  }
  return result;
}

// Return the effective avail for a unit given the currently selected spec.
function effectiveAvail(unit, selectedSpec) {
  if (!unit?.avail || !selectedSpec) return unit?.avail;
  const shift = (SPEC_VET_BONUS[selectedSpec] ?? {})[unit.tab] ?? 0;
  return shift > 0 ? shiftAvail(unit.avail, shift) : unit.avail;
}

export function CardPane({ selectedId, pinnedIds, onTogglePin, units, slots = 2, selectedSpec = null }) {
  const pinned   = pinnedIds.filter(id => id !== selectedId);
  const hasPinned = pinned.length > 0;
  // Selected on right unless a pinned unit exists; then selected left, pinned right
  const slotsArr = hasPinned
    ? [selectedId, pinned[0]]
    : [null, selectedId];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${slots}, 1fr)`,
      gap: 14, height: '100%', minHeight: 0,
    }}>
      {slotsArr.map((id, i) => {
        const isPinned = id != null && pinnedIds.includes(id);
        return (
          <CardSlot key={i} unitId={id} units={units}
            isPinned={isPinned}
            selectedSpec={selectedSpec}
            onTogglePin={id ? () => onTogglePin(id) : null} />
        );
      })}
    </div>
  );
}

function lowestAvailVet(avail) {
  const idx = avail?.findIndex(a => a > 0) ?? -1;
  return idx >= 0 ? idx : 0;
}

function CardSlot({ unitId, units, isPinned, onTogglePin, selectedSpec }) {
  const t = BROWSER_TOKENS;
  const unit = units?.[unitId];
  const avail = effectiveAvail(unit, selectedSpec);
  const [vet, setVet] = useState(() => lowestAvailVet(avail));

  // Reset to lowest available vet when the unit or effective avail changes
  React.useEffect(() => {
    setVet(lowestAvailVet(effectiveAvail(units?.[unitId], selectedSpec)));
  }, [unitId, selectedSpec]);

  if (!unitId) {
    return (
      <div style={{
        ...BMono,
        border: `1px dashed ${t.rule}`,
        background: `color-mix(in srgb, ${t.surface} 50%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 6,
        color: t.dimmer, fontSize: 11, letterSpacing: '0.2em',
        minHeight: 0, height: '100%',
      }}>
        <span>◦ EMPTY SLOT</span>
        <span style={{ fontSize: 9, color: t.dimmer }}>pin a unit to fill</span>
      </div>
    );
  }

  if (!unit) {
    return (
      <div style={{ ...BMono, border: `1px dashed ${t.rule}`, padding: 18, color: t.dimmer, height: '100%' }}>
        Unit data not found
      </div>
    );
  }

  const theme = sideOf(unit.nation);
  return (
    <div style={{ position: 'relative', minHeight: 0, height: '100%' }}>
      <V2Card unit={unit} avail={avail} vetIdx={vet} setVetIdx={setVet} theme={theme} />
      {onTogglePin && (
        <button onClick={onTogglePin} style={{
          ...BMono,
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          background: 'rgba(0,0,0,0.4)', color: t.dim,
          border: `1px solid ${t.rule}`,
          padding: '2px 6px', fontSize: 10, letterSpacing: '0.1em',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{isPinned ? 'UNPIN ✕' : 'PIN'}</button>
      )}
    </div>
  );
}
