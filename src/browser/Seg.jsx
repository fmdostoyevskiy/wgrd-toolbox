import React from 'react';
import { BROWSER_TOKENS, BMono } from '../constants/theme.js';

// Segmented filter row.
// options: string[] (raw values) or { label, value, flag?, separator? }[]
export const Seg = React.memo(function Seg({ label, options, selected, onToggle, onSolo, rightSlot }) {
  const t = BROWSER_TOKENS;
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderTop: `1px solid ${t.rule}`, borderBottom: `1px solid ${t.rule}`,
      marginTop: -1,
    }}>
      <div style={{
        width: 68, flexShrink: 0, padding: '6px 12px',
        borderRight: `1px solid ${t.rule}`,
        background: `color-mix(in srgb, ${t.surface} 80%, black)`,
        display: 'flex', alignItems: 'center',
        fontSize: 9.5, color: t.dim, letterSpacing: '0.22em',
      }}>{label}</div>
      <div style={{
        flex: 1, display: 'flex', flexWrap: 'nowrap', overflowX: 'auto',
        padding: '2px 8px', gap: 0, alignItems: 'center',
      }}>
        <SegItem item={{ label: 'ALL', value: null }} selected={selected} onToggle={onToggle} onSolo={onSolo} t={t} />
        {options.map((raw, i) => {
          const item = typeof raw === 'string' ? { label: raw, value: raw } : raw;
          if (item.separator) {
            return <div key={`sep-${i}`} style={{
              width: 1, alignSelf: 'stretch', background: t.rule, margin: '4px 6px',
            }} />;
          }
          return <SegItem key={item.label} item={item} selected={selected} onToggle={onToggle} onSolo={onSolo} t={t} />;
        })}
      </div>
      {rightSlot}
    </div>
  );
});

function SegItem({ item, selected, onToggle, onSolo, t }) {
  const { label, value, flag } = item;
  const active = value == null
    ? selected.length === 0
    : selected.includes(value);
  return (
    <button
      onClick={() => onToggle(value)}
      onDoubleClick={value != null ? (e) => { e.preventDefault(); onSolo(value); } : undefined}
      style={{
        ...BMono,
        background: 'transparent',
        color: active ? t.accent : t.dim,
        border: 'none',
        padding: flag ? '3px 6px' : '4px 10px',
        fontSize: 10.5,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        cursor: 'pointer',
        borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
        borderTop: '2px solid transparent',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      }}>
      {flag && <img src={flag} alt={label} style={{ height: 14, width: 'auto', opacity: active ? 1 : 0.55 }} />}
      <span>{label}</span>
    </button>
  );
}
