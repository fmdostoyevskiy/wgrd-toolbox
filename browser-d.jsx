// Variant D — "HUD"
// Full-width two-row filter bar using labeled segmented groups (no dropdowns),
// but packed tighter with a clear visual hierarchy: each category on its own
// line with a mini-header and the options flowing right. Unit list and cards
// share the rest of the viewport; cards get a framed "workspace" look with
// subtle crosshair corners. Leans more "HUD / fire control" than A/B/C.

function BrowserD({ initialUnit = 'mi24v' }) {
  const t = BROWSER_TOKENS;
  const { f, setF, toggle, filtered } = useFilterState(ROSTER);
  const [selected, setSelected] = React.useState(initialUnit);
  const [pinned, setPinned] = React.useState([]);
  const togglePin = (id) => setPinned(p =>
    p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  // Segmented button row — each option is a button with a tick underline when active.
  const Seg = ({ label, options, selected, onToggle }) => (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderTop: `1px solid ${t.rule}`,
      borderBottom: `1px solid ${t.rule}`,
      marginTop: -1,
    }}>
      <div style={{
        width: 76, flexShrink: 0, padding: '6px 12px',
        borderRight: `1px solid ${t.rule}`,
        background: `color-mix(in srgb, ${t.surface} 80%, black)`,
        display: 'flex', alignItems: 'center',
        fontSize: 9.5, color: t.dim, letterSpacing: '0.22em',
      }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap',
        padding: '2px 8px', gap: 0, alignItems: 'center' }}>
        {[['ALL', null], ...options.map(o => [o, o])].map(([o, val], i) => {
          const active = val == null
            ? selected.length === 0
            : selected.includes(val);
          return (
            <button key={o} onClick={() => onToggle(val)} style={{
              ...BMono,
              background: 'transparent',
              color: active ? t.accent : t.dim,
              border: 'none',
              padding: '4px 10px', fontSize: 10.5,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer',
              borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
              borderTop: '2px solid transparent', // balance spacing
            }}>{o}</button>
          );
        })}
      </div>
    </div>
  );

  // Crosshair corner overlay
  const CornerMarks = () => {
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
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: t.bg, color: t.ink,
      ...BMono, fontSize: 12, display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        flexShrink: 0, padding: '10px 18px',
        borderBottom: `1px solid ${t.rule}`,
        background: t.surface,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          fontSize: 13, letterSpacing: '0.24em', color: t.ink, fontWeight: 600,
        }}>
          ARMORY<span style={{ color: t.accent, marginLeft: 4 }}>/WRD</span>
        </div>
        <div style={{ width: 1, height: 20, background: t.rule }} />
        <div style={{
          fontSize: 10, color: t.dim, letterSpacing: '0.2em',
        }}>FIRE CTRL // v1.0</div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          border: `1px solid ${t.rule}`, padding: '3px 10px',
          background: t.bg,
        }}>
          <span style={{ color: t.dimmer, fontSize: 10 }}>⌕</span>
          <input value={f.q} onChange={e => setF({...f, q: e.target.value})}
            placeholder="search…"
            style={{
              ...BMono, background: 'transparent', color: t.ink,
              border: 'none', padding: '2px 0',
              fontSize: 11, outline: 'none', width: 200,
              letterSpacing: '0.04em',
            }} />
        </div>
      </div>

      {/* Filter bar: 5 segmented rows stacked */}
      <div style={{ flexShrink: 0, background: t.surface }}>
        <Seg label="COALITION" options={COALITIONS}
          selected={f.coalition} onToggle={toggle('coalition')} />
        <Seg label="NATION" options={ALL_NATIONS}
          selected={f.nation} onToggle={toggle('nation')} />
        <Seg label="SPEC" options={SPECS}
          selected={f.spec} onToggle={toggle('spec')} />
        <Seg label="TYPE" options={TABS}
          selected={f.tab} onToggle={toggle('tab')} />
        <Seg label="TAGS" options={TAGS}
          selected={f.tags} onToggle={toggle('tags')} />
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'grid',
        gridTemplateColumns: '290px 1fr', minHeight: 0 }}>

        <div style={{
          borderRight: `1px solid ${t.rule}`,
          display: 'flex', flexDirection: 'column', minHeight: 0,
          background: t.surface,
        }}>
          <div style={{ padding: '8px 12px', borderBottom: `1px solid ${t.rule}`,
            fontSize: 10, letterSpacing: '0.22em',
            color: t.dimmer, display: 'flex', justifyContent: 'space-between' }}>
            <span>▸ TARGETS</span>
            <span style={{ color: t.accent }}>{filtered.length} / {ROSTER.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {filtered.map(u => (
              <UnitListRow key={u.id} u={u}
                active={selected === u.id}
                pinned={pinned.includes(u.id)}
                onClick={() => setSelected(u.id)}
                onPin={() => togglePin(u.id)} compact />
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center',
                color: t.dimmer, fontSize: 10, letterSpacing: '0.2em' }}>
                ◦ NO RESULTS
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: 18, minHeight: 0, display: 'flex',
          flexDirection: 'column', gap: 10, position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 10, letterSpacing: '0.22em', color: t.dimmer,
            flexShrink: 0,
          }}>
            <span style={{ color: t.accent }}>◉</span>
            <span>WORKSPACE</span>
            <div style={{ flex: 1, borderTop: `1px solid ${t.rule}` }} />
            <span>{pinned.length} PINNED · 2/2 SLOTS</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, position: 'relative',
            padding: 6 }}>
            <CornerMarks />
            <CardPane selectedId={selected}
              pinnedIds={pinned} onRemovePin={togglePin} slots={2} />
          </div>
        </div>
      </div>
    </div>
  );
}

window.BrowserD = BrowserD;
