import React from 'react';

// `active` marks the row with ▸ and a brighter label. `onClick` makes the whole
// row clickable (label gets a dotted underline, `clickTitle` is its tooltip).
export function DotRow({ label, value, accent, tooltip, href, s, dense = false, active = false, onClick, clickTitle }) {
  const valueContent = href
    ? <a href={href} target="_blank" rel="noopener" style={{
        color: accent || s.ink, textDecoration: 'none',
      }}>{value}</a>
    : value;

  return (
    <div className="dr" onClick={onClick} title={clickTitle} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, fontSize: dense ? 12 : 13, padding: dense ? '2px 0' : '3px 0',
      borderBottom: `1px solid ${s.rule}`,
      cursor: onClick ? 'pointer' : undefined,
      userSelect: onClick ? 'none' : undefined,
    }}>
      <span style={{
        color: active ? s.ink : s.dim, fontWeight: active ? 600 : undefined,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        fontSize: dense ? 10.5 : 11, whiteSpace: 'nowrap', flexShrink: 0,
        textDecoration: onClick ? 'underline dotted' : undefined,
        textUnderlineOffset: onClick ? 3 : undefined,
      }}>{active && '▸ '}{label}</span>
      <span title={tooltip} style={{
        color: accent || s.ink, fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap', flexShrink: 0,
        cursor: tooltip ? 'help' : href ? 'pointer' : undefined,
      }}>{valueContent}</span>
    </div>
  );
}
