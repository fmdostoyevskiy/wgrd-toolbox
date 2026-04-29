import React from 'react';
import { BROWSER_TOKENS } from '../constants/theme.js';

const SIZE = 10;

// Crosshair corner overlay for the card workspace
export function CornerMarks() {
  const t = BROWSER_TOKENS;
  const base = { position: 'absolute', width: SIZE, height: SIZE, borderColor: t.ruleStrong, pointerEvents: 'none' };
  const v = `1px solid ${t.ruleStrong}`;
  return (
    <>
      <div style={{ ...base, top: 0,    left: 0,  borderLeft:  v, borderTop:    v }} />
      <div style={{ ...base, top: 0,    right: 0, borderRight: v, borderTop:    v }} />
      <div style={{ ...base, bottom: 0, left: 0,  borderLeft:  v, borderBottom: v }} />
      <div style={{ ...base, bottom: 0, right: 0, borderRight: v, borderBottom: v }} />
    </>
  );
}
