import React, { useState } from 'react';

export function CaptureButton({ onCapture, s, style }) {
  const [justCopied, setJustCopied] = useState(false);
  if (!onCapture) return null;
  async function handleCapture() {
    await onCapture();
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  }
  return (
    <button data-capture-btn onClick={handleCapture} style={{
      background: 'transparent',
      border: `1px solid ${justCopied ? s.ok : s.rule}`,
      color: justCopied ? s.ok : s.dim,
      fontSize: 9, padding: '1px 6px', cursor: 'pointer',
      fontFamily: 'inherit', letterSpacing: '0.12em', lineHeight: 1.4,
      transition: 'color 120ms, border-color 120ms',
      ...style,
    }}>{justCopied ? '✓' : 'COPY'}</button>
  );
}
