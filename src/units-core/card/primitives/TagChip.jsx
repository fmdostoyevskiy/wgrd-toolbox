import React from 'react';

export function TagChip({ tag, s }) {
  return (
    <span style={{
      fontSize: 9.5, color: s.ok, border: `1px solid ${s.ok}`,
      padding: '1px 5px', letterSpacing: '0.08em',
    }}>[{tag}]</span>
  );
}
