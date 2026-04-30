import React, { useState, useRef, useEffect } from 'react';
import { BROWSER_TOKENS, BMono } from '@units-core';

export const TagDropdown = React.memo(function TagDropdown({ allTags, selected, onToggle }) {
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
  const label  = active ? `TAG: ${selected.length}` : 'TAG: ALL';

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
});
