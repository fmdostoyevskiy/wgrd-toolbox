import React, { useState, useEffect, useRef } from 'react';
import { BROWSER_TOKENS, BMono } from '@units-core';
import { CATEGORIES } from '../spreadsheet/categories.js';
import { useWindowWidth } from '../armory/useWindowWidth.js';

const BASE = import.meta.env.BASE_URL;
const SMALL_BREAKPOINT = 600;

const MODULES = [
  { id: '01', name: 'ARMORY',       desc: 'UNIT DATABASE',    tag: 'EXTERNAL', href: 'armory/'      },
  { id: '02', name: 'DECKBUILDER',  desc: 'DECK COMPOSER',    tag: 'EXTERNAL', href: 'deckbuilder/' },
  { id: '03', name: 'AP DAMAGE',    desc: 'PENETRATION CALC',   tag: 'EXTERNAL', href: 'apdamage/'    },
  { id: '04', name: 'OPTICS',       desc: 'OPTICS VISUALIZER',  tag: 'EXTERNAL', href: 'optics/'      },
  { id: '05', name: 'SPREADSHEETS', desc: 'REFERENCE TABLES',   tag: 'ARCHIVE',  href: null           },
  { id: '06', name: 'DECKS',        desc: 'COMMUNITY ROSTER', tag: 'EXTERNAL', href: 'decks/'       },
];

export function Home() {
  const t = BROWSER_TOKENS;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const winWidth = useWindowWidth();
  const isSmall  = winWidth < SMALL_BREAKPOINT;

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const gridCols = isSmall ? '60px 1fr 36px' : '96px 1fr 48px';

  const moduleGrid = {
    display: 'grid',
    gridTemplateColumns: gridCols,
    borderBottom: `1px solid ${t.rule}`,
    cursor: 'pointer',
    textDecoration: 'none',
    color: t.ink,
  };

  const numCell = {
    background: t.surface,
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center',
    borderRight: `1px solid ${t.rule}`,
    padding: isSmall ? '14px 0' : '20px 0',
    gap: 0,
  };

  const arrowCell = {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    borderLeft: `1px solid ${t.rule}`,
    fontSize: isSmall ? 17 : 22, color: t.dimmer,
  };

  return (
    <div style={{ ...BMono, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, color: t.ink, overflow: 'hidden' }}>

      {/* Main scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: isSmall ? '24px 20px' : '40px 56px' }}>

        {/* Document header */}
        <div style={{ display: 'flex', flexDirection: isSmall ? 'column' : 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.3em', color: t.dim, marginBottom: 10 }}>
              DOC. № WRD-TLBX-2026-001
            </div>
            <div style={{ fontSize: isSmall ? 36 : 56, fontWeight: 600, lineHeight: 1, letterSpacing: '0.04em', marginBottom: 12 }}>
              WRD <span style={{ color: t.accent2 }}>/</span> TOOLS
            </div>
            <div style={{ fontSize: 13, letterSpacing: '0.22em', color: t.dim }}>
              WARGAME : RED DRAGON — OPERATOR TOOLBOX
            </div>
          </div>
          {!isSmall && (
            <div style={{ textAlign: 'right', fontSize: 11, letterSpacing: '0.18em', color: t.dim, lineHeight: 2.2, paddingBottom: 2 }}>
              <div>SECTOR: NATO</div>
              <div>ISSUE: 1.0</div>
              <div>STATUS: <span style={{ color: t.ok }}>● LIVE</span></div>
            </div>
          )}
        </div>

        {/* Module index */}
        <div style={{ fontSize: 11, letterSpacing: '0.22em', color: t.dim, padding: '10px 0', borderBottom: `1px solid ${t.rule}`, marginBottom: 0 }}>
          ▼ MODULE INDEX — 0{MODULES.length} ENTRIES
        </div>

        <div ref={wrapRef} style={{ borderTop: `1px solid ${t.rule}` }}>
          {MODULES.map((mod) => {
            const isSpreadsheets = mod.id === '05';
            const isOpen = isSpreadsheets && open;

            const inner = (
              <>
                {/* Number cell */}
                <div style={numCell}>
                  <span style={{ fontSize: 10, letterSpacing: '0.1em', color: t.dimmer, lineHeight: 1, marginBottom: 2 }}>M·</span>
                  <span style={{ fontSize: isSmall ? 26 : 38, fontWeight: 600, lineHeight: 1, color: t.accent2 }}>{mod.id}</span>
                </div>

                {/* Content cell */}
                <div style={{ padding: isSmall ? '14px 16px' : '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: isSmall ? 20 : 28, fontWeight: 500, letterSpacing: '0.05em', lineHeight: 1 }}>{mod.name}</div>
                  <div style={{ fontSize: 11, letterSpacing: '0.2em', color: t.dim, marginTop: 6 }}>
                    {mod.desc}
                    <span style={{ color: t.dimmer }}> · {mod.tag}</span>
                  </div>
                </div>

                {/* Arrow cell */}
                <div style={arrowCell}>
                  {isSpreadsheets ? (isOpen ? '▾' : '▸') : '↗'}
                </div>
              </>
            );

            if (isSpreadsheets) {
              return (
                <React.Fragment key={mod.id}>
                  <div
                    style={{ ...moduleGrid, cursor: 'pointer' }}
                    onClick={() => setOpen(o => !o)}
                  >
                    {inner}
                  </div>
                  {isOpen && (
                    <div>
                      {CATEGORIES.map((cat) => (
                        <React.Fragment key={cat.label}>
                          {/* Category header — same grid, accent label in content column */}
                          <div style={{
                            display: 'grid', gridTemplateColumns: gridCols,
                            borderBottom: `1px solid ${t.rule}`,
                            background: t.surface,
                          }}>
                            <div style={{ borderRight: `1px solid ${t.rule}` }} />
                            <div style={{
                              padding: isSmall ? '4px 16px 3px' : '5px 32px 4px',
                              fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase',
                              color: t.accent,
                            }}>
                              {cat.label}
                            </div>
                            <div style={{ borderLeft: `1px solid ${t.rule}` }} />
                          </div>
                          {/* Items */}
                          {cat.items.map(s => (
                            <a
                              key={s.key}
                              href={`${BASE}spreadsheet/?ds=${s.key}`}
                              style={{
                                display: 'grid', gridTemplateColumns: gridCols,
                                borderBottom: `1px solid ${t.rule}`,
                                textDecoration: 'none', color: t.ink,
                              }}
                            >
                              <div style={{ borderRight: `1px solid ${t.rule}` }} />
                              <div style={{
                                padding: isSmall ? '6px 16px' : '8px 32px',
                                fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
                                color: t.dim,
                              }}>
                                {s.label}
                              </div>
                              <div style={{
                                display: 'flex', justifyContent: 'center', alignItems: 'center',
                                borderLeft: `1px solid ${t.rule}`,
                                fontSize: 14, color: t.dimmer,
                              }}>↗</div>
                            </a>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              );
            }

            return (
              <a key={mod.id} href={`${BASE}${mod.href}`} style={moduleGrid}>
                {inner}
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', flexDirection: isSmall ? 'column' : 'row',
          justifyContent: 'space-between', alignItems: isSmall ? 'flex-start' : 'center',
          gap: isSmall ? 8 : 0,
          padding: '16px 0',
          fontSize: 11, letterSpacing: '0.2em',
          color: t.dimmer,
          borderTop: `1px solid ${t.rule}`,
        }}>
          <div style={{ display: 'flex', gap: isSmall ? 18 : 28 }}>
            <a href="https://github.com/fmdostoyevskiy/wgrd-toolbox" target="_blank" rel="noreferrer" style={{ color: t.dimmer, textDecoration: 'none' }}>⌗ GITHUB</a>
            <a href="https://github.com/fmdostoyevskiy/wgrd-toolbox" target="_blank" rel="noreferrer" style={{ color: t.dimmer, textDecoration: 'none' }}>⌗ CONTACT</a>
            <a href="https://github.com/fmdostoyevskiy/wgrd-toolbox/commits/main/" target="_blank" rel="noreferrer" style={{ color: t.dimmer, textDecoration: 'none' }}>⌗ CHANGELOG</a>
          </div>
          {!isSmall && <div>END OF DOCUMENT — PG. 01 / 01</div>}
        </div>

      </div>

    </div>
  );
}
