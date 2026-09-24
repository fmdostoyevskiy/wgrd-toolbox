import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UnitList } from '../list/UnitList.jsx';
import { ROW_HEIGHTS } from '../list/UnitListRow.jsx';
import { FlagImg } from '../list/FlagImg.jsx';
import { NATION_FLAG_MAP } from '../constants/nations.js';

const LIST_MAX_HEIGHT = 320;

const BOX_H = 42;

// The label row (meta, action) over the selected unit's box. Clicking the box,
// or typing while it's focused, turns it into a search field with the shared
// unit list dropdown under it; picking a unit, Escape or clicking elsewhere
// turns it back. beside goes on the same row as the box (see .cmp-unitrow).
export function UnitPicker({ roster, unit, onSelect, s, meta, action, beside }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const boxRef = useRef(null);
  const besideRef = useRef(null);
  // Clicks on `beside` count as outside the picker.
  const inside = el => wrapRef.current?.contains(el) && !besideRef.current?.contains(el);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? roster.filter(u => u.name.toLowerCase().includes(needle)) : roster;
  }, [roster, q]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onDown = e => { if (!inside(e.target)) close(); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const close = (refocus = false) => {
    setOpen(false);
    setQ('');
    if (refocus) requestAnimationFrame(() => boxRef.current?.focus());
  };

  const pick = useCallback(id => {
    onSelect(id);
    close(true);
  }, [onSelect]);

  const toggleTransports = useCallback(id => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const onKeyDown = e => {
    if (e.key === 'Escape') close(true);
    if (e.key === 'Enter' && rows.length > 0) pick(rows[0].id);
  };
  // Typing on the closed box starts a search with that character.
  const onBoxKeyDown = e => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setQ(e.key);
      setOpen(true);
    }
  };
  // Tabbing away closes it; clicks in the list don't move focus elsewhere.
  const onBlur = e => {
    if (e.relatedTarget && !inside(e.relatedTarget)) close();
  };

  const listHeight = Math.min(LIST_MAX_HEIGHT, Math.max(1, rows.length) * ROW_HEIGHTS.compact + 2);
  const box = {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%', boxSizing: 'border-box',
    height: beside ? '100%' : BOX_H, minHeight: BOX_H,
    fontFamily: 'inherit', fontSize: 14, padding: '0 12px', textAlign: 'left',
    background: s.paper, color: s.ink, border: `1px solid ${open ? s.accent : s.ruleStrong}`,
  };
  const tabLabel = unit && <span style={{ fontSize: 11, color: s.dim, letterSpacing: '0.12em' }}>{unit.tab}</span>;
  const caret = <span style={{ fontSize: 11, color: s.dim }}>▾</span>;

  return (
    <div ref={wrapRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, minHeight: 25 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.16em', lineHeight: 1.6, minWidth: 0, color: s.accent }}>
          {meta.label} <span style={{ color: s.dim }}>· {meta.text}</span>
        </div>
        {action}
      </div>

      {/* The unit box, with `beside` (e.g. weapon tabs) on the same row; the
          dropdown opens under the whole row. */}
      <div className={beside ? 'cmp-unitrow' : undefined} style={{ position: 'relative' }}>
        {open
          ? (
            <div style={{ ...box, cursor: 'text' }} onMouseDown={e => { if (e.target !== inputRef.current) e.preventDefault(); }}>
              <span style={{ fontSize: 14, color: s.dim }}>⌕</span>
              <input
                ref={inputRef}
                type="text"
                value={q}
                placeholder={unit?.name ?? 'Search units…'}
                aria-label="Search units"
                onChange={e => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={onBlur}
                style={{
                  flex: 1, minWidth: 0, fontFamily: 'inherit', fontSize: 14, padding: 0,
                  background: 'transparent', border: 'none', outline: 'none', color: s.ink,
                }}
              />
              <span style={{ fontSize: 11, color: s.dim }}>▴</span>
            </div>
          )
          : (
            <button ref={boxRef} onClick={() => setOpen(true)} onKeyDown={onBoxKeyDown}
              title={`${unit?.name ?? ''} — change unit`} aria-haspopup="listbox"
              style={{ ...box, cursor: 'pointer', ...(beside && { flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', gap: 6, padding: '9px 11px' }) }}>
              {beside
                ? (<>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {unit && <FlagImg src={NATION_FLAG_MAP[unit.nation]} label={unit.nation} h={12} />}
                    {tabLabel}<span style={{ marginLeft: 'auto' }}>{caret}</span>
                  </span>
                  <span style={{
                    fontSize: 14, lineHeight: 1.25, overflow: 'hidden', overflowWrap: 'anywhere',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>{unit?.name ?? '—'}</span>
                </>)
                : (<>
                  {unit && <FlagImg src={NATION_FLAG_MAP[unit.nation]} label={unit.nation} h={14} />}
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {unit?.name ?? '—'}
                  </span>
                  {tabLabel}{caret}
                </>)}
            </button>
          )}
        {beside && <div ref={besideRef} style={{ minWidth: 0 }}>{beside}</div>}

        {open && (
          <div style={{
            position: 'absolute', top: '100%', marginTop: -1, left: 0, right: 0, zIndex: 20,
            height: listHeight, background: 'var(--wrd-surface)',
            border: `1px solid ${s.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}>
            {rows.length > 0
              ? <UnitList rows={rows} selectedId={unit?.id} pinnedIds={[]} expandedIds={expanded}
                  onSelect={pick} onToggleTransports={toggleTransports} />
              : <div style={{ padding: '4px 10px', fontSize: 11.5, color: s.dim }}>No matching units</div>}
          </div>
        )}
      </div>
    </div>
  );
}
