import React from 'react';
import { BROWSER_TOKENS, BMono } from '@units-core';

const BASE = import.meta.env.BASE_URL;

const LINKS = [
  { label: 'Armory',    href: `${BASE}armory/`, hint: 'unit reference' },
  // Future companion tools — add here when each is wired up:
  // { label: 'Decks',     href: `${BASE}decks/`,    hint: 'deck planner' },
  // { label: 'Compare',   href: `${BASE}compare/`,  hint: 'side-by-side' },
];

export function Home() {
  const t = BROWSER_TOKENS;
  return (
    <div style={{
      ...BMono,
      width: '100%', height: '100%',
      background: t.bg, color: t.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 28,
    }}>
      <div style={{
        fontSize: 18, letterSpacing: '0.32em', color: t.ink, fontWeight: 600,
      }}>
        WRD<span style={{ color: t.accent, marginLeft: 6 }}>TOOLBOX</span>
      </div>
      <ul style={{
        listStyle: 'none', padding: 0, margin: 0,
        display: 'flex', flexDirection: 'column', gap: 4,
        minWidth: 280,
      }}>
        {LINKS.map(l => (
          <li key={l.href}>
            <a href={l.href} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '10px 14px',
              border: `1px solid ${t.rule}`,
              background: t.surface,
              color: t.ink, textDecoration: 'none',
              fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>
              <span style={{ color: t.accent }}>▸ {l.label}</span>
              <span style={{ color: t.dimmer, fontSize: 10, letterSpacing: '0.18em' }}>{l.hint}</span>
            </a>
          </li>
        ))}
      </ul>
      <div style={{ fontSize: 9, color: t.dimmer, letterSpacing: '0.24em' }}>
        ◦ WARNO REFERENCE TOOLS
      </div>
    </div>
  );
}
