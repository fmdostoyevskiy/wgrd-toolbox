import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { BROWSER_TOKENS, BMono } from '@units-core';

function TagColumn({ tags, selected, onToggle, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {tags.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <div style={{ borderTop: `1px solid ${t.rule}`, margin: '2px 8px' }} />}
          {group.map(tag => {
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
                whiteSpace: 'nowrap',
              }}>{tag}</button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

export const TagDropdown = React.memo(function TagDropdown({ weaponTags, unitTags, selected, onToggle, tagMode, onTagMode }) {
  const t = BROWSER_TOKENS;
  const [open, setOpen] = useState(false);
  const [btnRect, setBtnRect] = useState(null);
  const btnRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!panelRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleToggle = () => {
    if (!open) setBtnRect(btnRef.current?.getBoundingClientRect() ?? null);
    setOpen(o => !o);
  };

  const active = selected.length > 0;
  const label  = active ? `TAG: ${selected.length}` : 'TAG: ALL';

  const panel = open && btnRect && ReactDOM.createPortal(
    <div ref={panelRef} style={{
      position: 'fixed',
      top: btnRect.bottom,
      right: window.innerWidth - btnRect.right,
      background: t.surface,
      border: `1px solid ${t.rule}`,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      maxHeight: window.innerHeight - btnRect.bottom - 8,
    }}>
      <div style={{ display: 'flex', borderBottom: `1px solid ${t.rule}`, flexShrink: 0 }}>
        <button onClick={() => onToggle(null)} style={{
          ...BMono,
          background: 'transparent',
          color: selected.length === 0 ? t.accent : t.dim,
          border: 'none',
          padding: '5px 12px',
          fontSize: 10.5, letterSpacing: '0.14em',
          textAlign: 'left', cursor: 'pointer', flex: 1,
        }}>ALL</button>
        {selected.length > 1 && (
          <button onClick={onTagMode} style={{
            ...BMono,
            background: 'transparent',
            color: t.accent,
            border: 'none',
            borderLeft: `1px solid ${t.rule}`,
            padding: '5px 10px',
            fontSize: 10.5, letterSpacing: '0.14em',
            cursor: 'pointer',
          }}>{tagMode}</button>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex' }}>
          <TagColumn tags={weaponTags} selected={selected} onToggle={onToggle} t={t} />
          <div style={{ width: 1, background: t.rule, flexShrink: 0 }} />
          <TagColumn tags={unitTags}   selected={selected} onToggle={onToggle} t={t} />
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div style={{ alignSelf: 'stretch', display: 'flex', alignItems: 'stretch' }}>
      <button ref={btnRef} onClick={handleToggle} style={{
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
      {panel}
    </div>
  );
});
