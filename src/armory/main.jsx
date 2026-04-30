import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import './layout.css';
import { loadData, readUnitFromUrl, BROWSER_TOKENS, BMono } from '@units-core';
import { BrowserD } from './BrowserD.jsx';

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
        ARMORY<span style={{ color: t.accent, marginLeft: 4 }}>/WRD</span>
      </div>
      <div>{message}</div>
    </div>
  );
}

async function init() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<LoadingScreen message="◦ LOADING UNIT DATA…" />);

  let data;
  try {
    data = await loadData();
  } catch (err) {
    console.error('Failed to load unit data:', err);
    root.render(<LoadingScreen message={`✕ FAILED TO LOAD DATA: ${err.message}`} />);
    return;
  }

  const { roster, units, defaultId } = data;
  const initialUnit = readUnitFromUrl(roster, units, defaultId);

  root.render(
    <div style={{ width: '100%', height: '100%' }}>
      <BrowserD roster={roster} units={units} initialUnit={initialUnit} />
    </div>
  );
}

init();
