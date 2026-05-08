import React, { useCallback } from 'react';
import { BROWSER_TOKENS, BMono } from '@units-core';

export function DeckBar({ deckCode, usedAP, totalAP, onClear, onReset }) {
  const t = BROWSER_TOKENS;
  const remaining = totalAP - usedAP;

  const copyCode = useCallback(() => {
    if (deckCode) navigator.clipboard?.writeText(deckCode);
  }, [deckCode]);

  return (
    <div className="deck-bar" style={{
      background: t.surface,
      borderTop: `1px solid ${t.rule}`,
      color: t.ink,
    }}>
      <div className="deck-bar-code-wide" style={{ display: 'contents' }}>
        <span style={{ fontSize: 10, letterSpacing: '0.16em', color: t.dimmer, flexShrink: 0 }}>
          DECK CODE
        </span>
        <input
          readOnly
          value={deckCode}
          onClick={e => e.target.select()}
          style={{
            ...BMono,
            background: t.bg,
            color: t.ink,
            borderColor: t.rule,
          }}
        />
        <button
          onClick={copyCode}
          style={{
            ...BMono, background: 'transparent', color: t.dim,
            border: `1px solid ${t.rule}`, padding: '4px 10px',
            fontSize: 10, cursor: 'pointer', flexShrink: 0,
          }}
        >COPY</button>
      </div>
      <button
        className="deck-bar-copy-narrow"
        onClick={copyCode}
        style={{
          ...BMono, background: 'transparent', color: t.dim,
          border: `1px solid ${t.rule}`, padding: '4px 10px',
          fontSize: 10, cursor: 'pointer', flexShrink: 0,
        }}
      >COPY DECK CODE</button>

      <div style={{ width: 1, alignSelf: 'stretch', background: t.rule, margin: '2px 4px', flexShrink: 0 }} />

      <div style={{
        flexShrink: 0, fontSize: 12, fontVariantNumeric: 'tabular-nums',
        display: 'flex', alignItems: 'baseline', gap: 4,
      }}>
        <span style={{ color: t.accent, fontWeight: 600 }}>AP</span>
        <span style={{ color: remaining < 0 ? '#e55' : t.ink }}>
          {usedAP}
        </span>
        <span style={{ color: t.dimmer }}>/</span>
        <span>{totalAP}</span>
      </div>

      <div style={{ width: 1, alignSelf: 'stretch', background: t.rule, margin: '2px 4px', flexShrink: 0 }} />

      <button
        onClick={onClear}
        style={{
          ...BMono, background: 'transparent', color: t.dim,
          border: `1px solid ${t.rule}`, padding: '4px 10px',
          fontSize: 10, cursor: 'pointer', flexShrink: 0,
        }}
      >CLEAR</button>
      <button
        onClick={onReset}
        style={{
          ...BMono, background: 'transparent', color: t.dim,
          border: `1px solid ${t.rule}`, padding: '4px 10px',
          fontSize: 10, cursor: 'pointer', flexShrink: 0,
        }}
      >NEW DECK</button>
    </div>
  );
}
