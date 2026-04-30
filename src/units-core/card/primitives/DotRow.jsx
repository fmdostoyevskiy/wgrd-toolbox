import React from 'react';

export function DotRow({ label, value, accent, tooltip, s, dense = false }) {
  return (
    <div className="dr" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, fontSize: dense ? 12 : 13, padding: dense ? '2px 0' : '3px 0',
      borderBottom: `1px solid ${s.rule}`,
    }}>
      <span style={{
        color: s.dim, letterSpacing: '0.04em', textTransform: 'uppercase',
        fontSize: dense ? 10.5 : 11, whiteSpace: 'nowrap', flexShrink: 0,
      }}>{label}</span>
      <span title={tooltip} style={{
        color: accent || s.ink, fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap', flexShrink: 0,
        cursor: tooltip ? 'help' : undefined,
      }}>{value}</span>
    </div>
  );
}
