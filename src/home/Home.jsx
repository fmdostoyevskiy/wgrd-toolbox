import React, { useState, useEffect, useRef } from 'react';
import { BROWSER_TOKENS, BMono } from '@units-core';

const BASE = import.meta.env.BASE_URL;

const CATEGORIES = [
  {
    label: 'AA',
    items: [
      { key: 'planemissileaa', label: 'Plane Missile AA' },
      { key: 'spaags',         label: 'SPAAG'            },
      { key: 'manpads',        label: 'Manpad'           },
    ],
  },
  {
    label: 'Artillery',
    items: [
      { key: 'mortar',      label: 'Mortars'        },
      { key: 'howitzer',    label: 'Howitzers'      },
      { key: 'hemlrs',      label: 'HE MLRS'        },
      { key: 'clustermlrs', label: 'Cluster MLRS'   },
      { key: 'napalmmlrs',  label: 'Napalm MLRS'    },
    ],
  },
  {
    label: 'Plane',
    items: [
      { key: 'asfs',           label: 'ASF'            },
      { key: 'atgmplanes',     label: 'ATGM Plane'     },
      { key: 'hebomber',       label: 'HE Bomber'      },
      { key: 'clusterbombers', label: 'Cluster Bomber' },
      { key: 'naplmbombers',   label: 'Napalm Bomber'  },
      { key: 'sead',           label: 'SEAD'           },
    ],
  },
  {
    label: 'Helicopter',
    items: [
      { key: 'helomissileaa',  label: 'Helo Missile AA'              },
      { key: 'aahelos',        label: 'AA Helo'                      },
      { key: 'atgmhelos',      label: 'ATGM Helo'                    },
      { key: 'rocketpodhelos', label: 'Rocket Pod Helo' },
    ],
  },
  {
    label: 'Ground Attack',
    items: [
      { key: 'tanks',         label: 'Tank'          },
      { key: 'atgmvehicles',  label: 'ATGM Vehicle'  },
      { key: 'atgminfantry',  label: 'ATGM Infantry' },
      { key: 'autocannons',   label: 'Autocannons'   },
    ],
  },
];

const MODULES = [
  { id: '01', name: 'ARMORY',       desc: 'UNIT DATABASE',    tag: 'EXTERNAL', href: 'armory/'      },
  { id: '02', name: 'DECKBUILDER',  desc: 'DECK COMPOSER',    tag: 'EXTERNAL', href: 'deckbuilder/' },
  { id: '03', name: 'AP DAMAGE',    desc: 'PENETRATION CALC', tag: 'EXTERNAL', href: 'apdamage/'    },
  { id: '04', name: 'SPREADSHEETS', desc: 'REFERENCE TABLES', tag: 'ARCHIVE',  href: null           },
];

export function Home() {
  const t = BROWSER_TOKENS;
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const moduleGrid = {
    display: 'grid',
    gridTemplateColumns: '96px 1fr 48px',
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
    padding: '20px 0',
    gap: 0,
  };

  const arrowCell = {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    borderLeft: `1px solid ${t.rule}`,
    fontSize: 22, color: t.dimmer,
  };

  return (
    <div style={{ ...BMono, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: t.bg, color: t.ink, overflow: 'hidden' }}>

      {/* Main scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '40px 56px' }}>

        {/* Document header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.3em', color: t.dim, marginBottom: 10 }}>
              DOC. № WRD-TLBX-2026-001
            </div>
            <div style={{ fontSize: 56, fontWeight: 600, lineHeight: 1, letterSpacing: '0.04em', marginBottom: 12 }}>
              WRD <span style={{ color: t.accent2 }}>/</span> TOOLS
            </div>
            <div style={{ fontSize: 13, letterSpacing: '0.22em', color: t.dim }}>
              WARGAME : RED DRAGON — OPERATOR TOOLBOX
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, letterSpacing: '0.18em', color: t.dim, lineHeight: 2.2, paddingBottom: 2 }}>
            <div>SECTOR: NATO</div>
            <div>ISSUE: 1.0</div>
            <div>STATUS: <span style={{ color: t.ok }}>● LIVE</span></div>
          </div>
        </div>

        {/* Module index */}
        <div style={{ fontSize: 11, letterSpacing: '0.22em', color: t.dim, padding: '10px 0', borderBottom: `1px solid ${t.rule}`, marginBottom: 0 }}>
          ▼ MODULE INDEX — 0{MODULES.length} ENTRIES
        </div>

        <div ref={wrapRef} style={{ borderTop: `1px solid ${t.rule}` }}>
          {MODULES.map((mod) => {
            const isSpreadsheets = mod.id === '04';
            const isOpen = isSpreadsheets && open;

            const inner = (
              <>
                {/* Number cell */}
                <div style={numCell}>
                  <span style={{ fontSize: 10, letterSpacing: '0.1em', color: t.dimmer, lineHeight: 1, marginBottom: 2 }}>M·</span>
                  <span style={{ fontSize: 38, fontWeight: 600, lineHeight: 1, color: t.accent2 }}>{mod.id}</span>
                </div>

                {/* Content cell */}
                <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: '0.05em', lineHeight: 1 }}>{mod.name}</div>
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
                            display: 'grid', gridTemplateColumns: '96px 1fr 48px',
                            borderBottom: `1px solid ${t.rule}`,
                            background: t.surface,
                          }}>
                            <div style={{ borderRight: `1px solid ${t.rule}` }} />
                            <div style={{
                              padding: '5px 32px 4px',
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
                                display: 'grid', gridTemplateColumns: '96px 1fr 48px',
                                borderBottom: `1px solid ${t.rule}`,
                                textDecoration: 'none', color: t.ink,
                              }}
                            >
                              <div style={{ borderRight: `1px solid ${t.rule}` }} />
                              <div style={{
                                padding: '8px 32px',
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
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 0',
          fontSize: 11, letterSpacing: '0.2em',
          color: t.dimmer,
          borderTop: `1px solid ${t.rule}`,
        }}>
          <div style={{ display: 'flex', gap: 28 }}>
            <a href="https://github.com/fmdostoyevskiy/wgrd-toolbox" target="_blank" rel="noreferrer" style={{ color: t.dimmer, textDecoration: 'none' }}>⌗ GITHUB</a>
            <a href="https://github.com/fmdostoyevskiy/wgrd-toolbox" target="_blank" rel="noreferrer" style={{ color: t.dimmer, textDecoration: 'none' }}>⌗ CONTACT</a>
            <a href="https://github.com/fmdostoyevskiy/wgrd-toolbox/commits/main/" target="_blank" rel="noreferrer" style={{ color: t.dimmer, textDecoration: 'none' }}>⌗ CHANGELOG</a>
          </div>
          <div>END OF DOCUMENT — PG. 01 / 01</div>
        </div>

      </div>

    </div>
  );
}
