import React from 'react';
import ReactDOM from 'react-dom/client';
import { loadData } from './loader.js';
import { BrowserD } from './browser-d.jsx';
import { BROWSER_TOKENS, BMono } from './constants.js';

function LoadingScreen({ message }) {
  const t = BROWSER_TOKENS;
  return (
    <div style={{
      ...BMono,
      width: '100vw', height: '100vh',
      background: t.bg, color: t.dimmer,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 12,
      fontSize: 12, letterSpacing: '0.2em',
      fontFamily: 'var(--wrd-mono, "JetBrains Mono", ui-monospace)',
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

  // Resolve initial unit from URL params (?unit=<id> or ?name=<display-name>)
  const params     = new URLSearchParams(window.location.search);
  const linkedId   = params.get('unit');
  const linkedName = params.get('name');

  let initialUnit = defaultId;
  if (linkedId && units[linkedId]) {
    initialUnit = linkedId;
  } else if (linkedName) {
    const target = decodeURIComponent(linkedName).toLowerCase();
    const match  = roster.find(u => u.name.toLowerCase() === target);
    if (match) initialUnit = match.id;
  }

  root.render(
    <div style={{ width: '100vw', height: '100vh' }}>
      <BrowserD roster={roster} units={units} initialUnit={initialUnit} />
    </div>
  );
}

init();
