import React, { useState } from 'react';
import { getTheme, setTheme } from './themeStore.js';
import { BROWSER_TOKENS } from '../constants/theme.js';

const SUN = (
  <>
    <circle cx="8" cy="8" r="3" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" />
  </>
);
const MOON = <path d="M13.5 9.6A5.5 5.5 0 1 1 6.4 2.5a4.5 4.5 0 0 0 7.1 7.1z" />;

// Small inline button that flips between the dark and light palettes. The icon
// shows the theme a click switches to.
export function ThemeToggle({ style }) {
  const t = BROWSER_TOKENS;
  const [theme, setLocal] = useState(getTheme);
  const next = theme === 'dark' ? 'light' : 'dark';

  function toggle() {
    setTheme(next);
    setLocal(next);
  }

  return (
    <button onClick={toggle} title={`Switch to ${next} mode`} aria-label={`Switch to ${next} mode`} style={{
      flexShrink: 0, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '2px 4px', lineHeight: 0,
      background: 'transparent', color: t.dim,
      border: `1px solid ${t.rule}`, borderRadius: 3,
      ...style,
    }}>
      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor"
        strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {next === 'light' ? SUN : MOON}
      </svg>
    </button>
  );
}
