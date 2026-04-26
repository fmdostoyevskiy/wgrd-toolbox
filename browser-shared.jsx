// Shared browser shell primitives.
// Each variant uses these to render its own filter/list/main layout.
//
// Color system for the browser chrome: cool dark graphite that doesn't
// compete with red OR blue card backgrounds. Accents from oklch.
const BROWSER_TOKENS = {
  bg:       '#0f1115',          // deep graphite
  surface:  '#151922',          // panels
  surface2: '#1c2230',          // hover / nested
  rule:     '#252b38',          // hairline
  ruleStrong: '#343c4e',
  ink:      '#d8dde6',
  dim:      '#7a8296',
  dimmer:   '#525a6c',
  accent:   '#e8a852',          // amber — neutral vs both red & blue
  accent2:  '#8fb4d8',          // cool steel
  ok:       '#72d6a8',
  natoTag:  '#7fb4d8',
  pactTag:  '#e07a6c',
};

// Tiny helpers -------------------------------------------------
const BMono = { fontFamily: 'var(--wrd-mono)' };

// Label for unit tab column — 3-letter code
const TAB_CODES = {
  TNK: 'TNK', INF: 'INF', HEL: 'HEL', AIR: 'AIR',
  AA: 'AA',  ART: 'ART', REC: 'REC', SUP: 'SUP',
  LOG: 'LOG', NAV: 'NAV',
};

// Small chip toggle — reused everywhere
function Chip({ label, active, onClick, size='md', tone='default' }) {
  const t = BROWSER_TOKENS;
  const activeColor = tone === 'nato' ? t.natoTag
                    : tone === 'pact' ? t.pactTag
                    : t.accent;
  const fs = size === 'sm' ? 10 : 11;
  return (
    <button onClick={onClick} style={{
      ...BMono,
      background: active
        ? `color-mix(in srgb, ${activeColor} 14%, transparent)`
        : 'transparent',
      color: active ? activeColor : t.dim,
      border: `1px solid ${active ? activeColor : 'transparent'}`,
      padding: size === 'sm' ? '2px 6px' : '3px 8px',
      fontSize: fs,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      lineHeight: 1.2,
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

// A generic row of chips + label prefix
function ChipRow({ label, options, selected, onToggle, allKey='ALL', tone='default' }) {
  const t = BROWSER_TOKENS;
  const all = !selected || selected.length === 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
      <span style={{
        ...BMono, color: t.dimmer, fontSize: 10,
        letterSpacing: '0.22em', width: 60, flexShrink: 0,
        textTransform: 'uppercase'
      }}>{label}</span>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip label={allKey} active={all} onClick={() => onToggle(null)} tone={tone} />
        {options.map(o => (
          <Chip key={o} label={o}
            active={!all && selected.includes(o)}
            onClick={() => onToggle(o)}
            tone={tone} />
        ))}
      </div>
    </div>
  );
}

// ---- Unit list row ------------------------------------------------
function UnitListRow({ u, active, pinned, onClick, onPin, compact=false }) {
  const t = BROWSER_TOKENS;
  const isPact = sideOf(u.nation) === 'signal';
  const sideColor = isPact ? t.pactTag : t.natoTag;
  return (
    <div onClick={onClick} style={{
      ...BMono,
      display: 'grid',
      gridTemplateColumns: '30px 1fr 46px 20px',
      alignItems: 'center',
      gap: 6,
      padding: compact ? '3px 10px' : '5px 10px',
      fontSize: 11.5,
      borderLeft: `2px solid ${active ? sideColor : 'transparent'}`,
      background: active
        ? `color-mix(in srgb, ${sideColor} 12%, transparent)`
        : pinned
        ? `color-mix(in srgb, ${t.accent} 6%, transparent)`
        : 'transparent',
      color: active ? t.ink : t.ink,
      cursor: 'pointer',
      borderBottom: `1px solid ${t.rule}`,
    }}>
      <span style={{
        fontSize: 9.5, letterSpacing: '0.12em',
        color: active ? sideColor : t.dimmer,
        fontWeight: 500,
      }}>{u.tab}</span>
      <span style={{
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        color: active ? t.ink : t.ink,
      }}>{u.name}</span>
      <span style={{
        fontSize: 9.5, color: t.dim, letterSpacing: '0.08em',
        textAlign: 'right',
      }}>{u.nation}</span>
      <span onClick={(e) => { e.stopPropagation(); onPin && onPin(); }}
        style={{
          fontSize: 12, color: pinned ? t.accent : t.dimmer,
          cursor: 'pointer', textAlign: 'center', userSelect: 'none',
          lineHeight: 1,
        }}>
        {pinned ? '●' : '◦'}
      </span>
    </div>
  );
}

// ---- Filter logic -----------------------------------------------
function useFilterState(roster) {
  const [f, setF] = React.useState({
    coalition: [], nation: [], spec: [], tab: [], tags: [], q: '',
  });
  const toggle = (k) => (v) => {
    setF(prev => {
      if (v == null) return { ...prev, [k]: [] };
      const has = prev[k].includes(v);
      return { ...prev, [k]: has ? prev[k].filter(x => x !== v) : [...prev[k], v] };
    });
  };
  const filtered = React.useMemo(() => roster.filter(u => {
    if (f.coalition.length && !f.coalition.includes(u.coalition)) return false;
    if (f.nation.length && !f.nation.includes(u.nation)) return false;
    if (f.spec.length && !f.spec.includes(u.spec)) return false;
    if (f.tab.length && !f.tab.includes(u.tab)) return false;
    if (f.tags.length && !u.tags.some(tag => f.tags.includes(tag))) return false;
    if (f.q && !u.name.toLowerCase().includes(f.q.toLowerCase())) return false;
    return true;
  }), [roster, f]);
  return { f, setF, toggle, filtered };
}

// ---- Card pane with pinned cards -------------------------------
function CardPane({ selectedId, pinnedIds, onRemovePin, slots=2 }) {
  const t = BROWSER_TOKENS;
  // Build display list: selected first, then pinned (excluding selected)
  const ids = [selectedId, ...pinnedIds.filter(id => id !== selectedId)];
  const shown = ids.slice(0, slots);
  // Pad to fixed count so layout stays stable
  const slotsArr = Array.from({length: slots}, (_, i) => shown[i] || null);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${slots}, 1fr)`,
      gap: 14, height: '100%', minHeight: 0,
    }}>
      {slotsArr.map((id, i) => (
        <CardSlot key={i} unitId={id}
          onRemove={id && i > 0 ? () => onRemovePin(id) : null} />
      ))}
    </div>
  );
}

function CardSlot({ unitId, onRemove }) {
  const t = BROWSER_TOKENS;
  const [vet, setVet] = React.useState(1);
  React.useEffect(() => { setVet(1); }, [unitId]);

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

  // Look up unit: prefer UNITS (full card data), else degrade to roster stub
  const unit = UNITS[unitId];
  const rosterU = ROSTER.find(r => r.id === unitId);

  // When we have a full-data unit, use V2Card with its native theme.
  if (unit) {
    const theme = sideOf(unit.nation);
    return (
      <div style={{ position: 'relative', minHeight: 0, height: '100%' }}>
        <V2Card unit={unit} vetIdx={vet} setVetIdx={setVet}
          density="comfortable" theme={theme} />
        {onRemove && (
          <button onClick={onRemove} style={{
            ...BMono,
            position: 'absolute', top: 8, right: 8, zIndex: 2,
            background: 'rgba(0,0,0,0.4)', color: t.dim,
            border: `1px solid ${t.rule}`,
            padding: '2px 6px', fontSize: 10, letterSpacing: '0.1em',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>UNPIN ✕</button>
        )}
      </div>
    );
  }

  // Stub for units that don't have full data yet — show a minimal
  // card-like frame so the browser isn't broken.
  const theme = rosterU ? sideOf(rosterU.nation) : 'tactical';
  const s = V2_THEMES[theme];
  return (
    <div style={{
      ...BMono, background: s.bg, color: s.ink,
      border: `1px solid ${s.rule}`, padding: 18,
      display: 'flex', flexDirection: 'column', gap: 8,
      height: '100%', minHeight: 0,
    }}>
      <div style={{ border: `1.5px solid ${s.ruleStrong}`, padding: '10px 14px' }}>
        <div style={{ fontSize: 10, color: s.dim, letterSpacing: '0.16em' }}>
          DWG. № {rosterU ? rosterU.tab : '???'}-{unitId.toUpperCase()}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
          {rosterU ? rosterU.name : unitId}
        </div>
        <div style={{ fontSize: 11, color: s.dim, marginTop: 3, letterSpacing: '0.08em' }}>
          {rosterU ? `${rosterU.tab} · ${rosterU.nation}` : ''}
        </div>
      </div>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: s.dim, fontSize: 11, letterSpacing: '0.18em',
        border: `1px dashed ${s.rule}`,
      }}>
        ◦ CARD DATA PENDING
      </div>
      {onRemove && (
        <button onClick={onRemove} style={{
          ...BMono,
          alignSelf: 'flex-end',
          background: 'rgba(0,0,0,0.4)', color: s.dim,
          border: `1px solid ${s.rule}`,
          padding: '2px 6px', fontSize: 10, letterSpacing: '0.1em',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>UNPIN ✕</button>
      )}
    </div>
  );
}

Object.assign(window, {
  BROWSER_TOKENS, Chip, ChipRow, UnitListRow,
  useFilterState, CardPane, CardSlot, BMono,
});
