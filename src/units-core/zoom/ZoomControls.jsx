import React, { useState, useEffect } from 'react';
import { ZOOM_PRESETS, getZoom, setZoom } from './zoomStore.js';
import { BROWSER_TOKENS, BMono } from '../constants/theme.js';

const MOBILE = 900;

// Small inline button that cycles through ZOOM_PRESETS. Place it right after
// a tool's logo. Hidden below the breakpoint where #root zoom is disabled.
export function ZoomControls({ style }) {
  const t = BROWSER_TOKENS;
  const [active, setActive] = useState(getZoom);
  const [wide, setWide] = useState(() => window.innerWidth >= MOBILE);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= MOBILE);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!wide) return null;

  function cycle() {
    const next = ZOOM_PRESETS[(ZOOM_PRESETS.indexOf(active) + 1) % ZOOM_PRESETS.length];
    setZoom(next);
    setActive(next);
  }

  return (
    <button onClick={cycle} title="UI scale — click to cycle" style={{
      ...BMono, flexShrink: 0, cursor: 'pointer',
      padding: '2px 5px', fontSize: 10, lineHeight: 1.2, fontWeight: 600,
      letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums',
      background: 'transparent', color: t.dim,
      border: `1px solid ${t.rule}`, borderRadius: 3,
      ...style,
    }}>
      {Math.round(active * 100)}%
    </button>
  );
}
