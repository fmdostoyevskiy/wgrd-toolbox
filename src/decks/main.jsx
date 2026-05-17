import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import '@units-core/zoom/zoomStore.js';
import { BROWSER_TOKENS, BMono, ZoomControls } from '@units-core';
import { DecksApp } from './DecksApp.jsx';

const BASE = import.meta.env.BASE_URL;

function LoadingScreen({ message }) {
  const t = BROWSER_TOKENS;
  return (
    <div style={{
      ...BMono,
      width: '100%', height: '100%',
      background: t.bg, color: t.dimmer,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12,
      fontSize: 12, letterSpacing: '0.2em',
    }}>
      <div style={{ color: t.accent, fontSize: 13, letterSpacing: '0.24em', fontWeight: 600 }}>
        WRD<span style={{ color: t.accent2, marginLeft: 4 }}>DECKS</span>
      </div>
      <div>{message}</div>
    </div>
  );
}

async function init() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<LoadingScreen message="◦ LOADING DECK DATA…" />);

  let data;
  try {
    const res = await fetch(`${BASE}data/decks.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('Failed to load deck data:', err);
    root.render(<LoadingScreen message={`✕ FAILED TO LOAD DATA: ${err.message}`} />);
    return;
  }

  root.render(
    <div style={{ width: '100%', height: '100%' }}>
      <ZoomControls />
      <DecksApp data={data} />
    </div>
  );
}

init();
