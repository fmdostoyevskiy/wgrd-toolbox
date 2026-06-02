import React, {useState, useRef, useEffect} from 'react';
import ReactDOM from 'react-dom';
import {BROWSER_TOKENS, BMono} from '@units-core';
import {SORT_OPTIONS} from '@units-core/filter/sort';

function SortColumn({ selected, onToggle, t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {SORT_OPTIONS.map((option, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && <div style={{ borderTop: `1px solid ${t.rule}`, margin: '2px 8px' }} />}
          <button key={option} onClick={() => onToggle(option)} style={{
            ...BMono,
            background: 'transparent',
            color: selected === option ? t.accent : t.dim,
            border: 'none',
            padding: '5px 12px',
            fontSize: 10.5, letterSpacing: '0.14em',
            textAlign: 'left', cursor: 'pointer',
            borderLeft: `2px solid ${selected === option ? t.accent : 'transparent'}`,
            whiteSpace: 'nowrap',
          }}>{option}</button>
        </React.Fragment>
      ))}
    </div>
  );
}

export const SortDropdown = React.memo(function SortDropdown({sort, isAscending, onIsAscending, onSort}) {
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
  }

  const toggleIsAscending = () => {
    onIsAscending(!isAscending);
  }

  const label = `SORT: ${sort}`;
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
      <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex' }}>
          <SortColumn selected={sort} onToggle={onSort} t={t} />
          <div style={{ width: 1, background: t.rule, flexShrink: 0 }} />
          <button onClick={toggleIsAscending} style={{
            ...BMono,
            background: 'transparent',
            color: t.accent,
            border: 'none',
            borderLeft: `1px solid ${t.rule}`,
            padding: '5px 10px',
            fontSize: 10.5, letterSpacing: '0.14em',
            cursor: 'pointer',
          }}>{isAscending ? 'ASC' : 'DSC'}</button>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <div style={{alignSelf: 'stretch', display: 'flex', alignItems: 'stretch', flex: '0 0 88px', minWidth: 88}}>
      <button ref={btnRef} onClick={handleToggle} style={{
        ...BMono,
        background: 'transparent',
        color: t.dim,
        border: 'none',
        borderLeft: `1px solid ${t.rule}`,
        padding: '0 10px',
        width: '100%',
        fontSize: 10.5,
        letterSpacing: '0.14em',
        cursor: 'pointer',
        outline: 'none',
        alignSelf: 'stretch',
        borderBottom: `2px solid ${'transparent'}`,
        borderTop: '2px solid transparent',
        whiteSpace: 'nowrap',
      }}>{label}</button>
      {panel}
    </div>
  );
});
