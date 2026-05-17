import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ZOOM_PRESETS, getZoom, setZoom } from './zoomStore.js';

const MOBILE = 900;

export function ZoomControls() {
  const [active, setActive] = useState(getZoom);
  const [wide, setWide] = useState(() => window.innerWidth >= MOBILE);

  useEffect(() => {
    const onResize = () => setWide(window.innerWidth >= MOBILE);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!wide) return null;

  function pick(v) {
    setZoom(v);
    setActive(v);
  }

  const pill = (
    <div style={{
      position: 'fixed', bottom: 12, right: 12, zIndex: 99999,
      display: 'flex', gap: 1, borderRadius: 6, overflow: 'hidden',
      background: 'rgba(15,17,21,0.85)', border: '1px solid #252b38',
      fontFamily: 'var(--wrd-mono)', fontSize: 12,
    }}>
      {ZOOM_PRESETS.map(v => (
        <button key={v} onClick={() => pick(v)} style={{
          border: 'none', cursor: 'pointer', padding: '6px 10px',
          background: v === active ? '#e8a852' : 'transparent',
          color: v === active ? '#0f1115' : '#7a8296',
          fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 600,
        }}>
          {Math.round(v * 100)}%
        </button>
      ))}
    </div>
  );

  return createPortal(pill, document.body);
}
