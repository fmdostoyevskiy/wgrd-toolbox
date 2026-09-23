import React from 'react';
import { BROWSER_TOKENS, BMono } from '@units-core';

// One cell of the list-pane filter bar. `stacked` puts a small label above the
// value so four cells fit side by side in the narrow list pane; otherwise the
// label and value share one line. Pass `select` to overlay an invisible native
// <select> (keeps the platform picker), or `onClick` for a custom dropdown.
export const FilterCell = React.forwardRef(function FilterCell(
  { label, value, active, stacked = false, first = false, onClick, select, title },
  ref,
) {
  const t = BROWSER_TOKENS;
  const valueColor = active ? t.accent : t.ink;

  const caret = <span style={{ color: active ? t.accent : t.dimmer, fontSize: 8, flexShrink: 0 }}>▾</span>;
  const valueText = (
    <span style={{
      color: valueColor, fontSize: 10.5, letterSpacing: '0.06em',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
    }}>{value}</span>
  );

  // Stacked: caret sits on the label row so the value gets the full cell width.
  const content = stacked ? (
    <>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, lineHeight: 1 }}>
        <span style={{ color: t.dimmer, fontSize: 8.5, letterSpacing: '0.18em' }}>{label}</span>
        {caret}
      </span>
      {valueText}
    </>
  ) : (
    <>
      <span style={{ color: t.dimmer, fontSize: 9, letterSpacing: '0.18em' }}>{label}</span>
      {valueText}
      {caret}
    </>
  );

  const style = {
    ...BMono,
    position: 'relative',
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderLeft: first ? 'none' : `1px solid ${t.rule}`,
    borderTop: '2px solid transparent',
    borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
    padding: stacked ? '4px 7px 3px' : '4px 10px',
    minWidth: 0,
    display: 'flex',
    flexDirection: stacked ? 'column' : 'row',
    alignItems: stacked ? 'stretch' : 'center',
    justifyContent: 'center',
    gap: stacked ? 3 : 6,
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
    color: t.dim,
  };

  if (select) {
    return (
      <label ref={ref} title={title ?? value} style={style}>
        {content}
        <select
          value={select.value}
          onChange={e => select.onChange(e.target.value)}
          aria-label={label}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', ...BMono, fontSize: 11,
          }}
        >
          {select.items.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
        </select>
      </label>
    );
  }

  return (
    <button ref={ref} onClick={onClick} title={title} style={style}>
      {content}
    </button>
  );
});
