import React from 'react';

export function SectionHeader({ title, s }) {
  return (
    <div style={{
      margin: '14px 0 2px', display: 'flex', alignItems: 'baseline', gap: 8,
      borderBottom: `1.5px solid ${s.ruleStrong}`, paddingBottom: 4,
    }}>
      <div style={{
        fontSize: 12, color: s.ink, letterSpacing: '0.16em',
        textTransform: 'uppercase', fontWeight: 600,
      }}>{title}</div>
    </div>
  );
}
