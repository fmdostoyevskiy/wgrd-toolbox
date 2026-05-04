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
      { key: 'tubearty',    label: 'Tube Artillery' },
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
      { key: 'helomissileaa',  label: 'Helo Missile AA'            },
      { key: 'aahelos',        label: 'AA Helo'                    },
      { key: 'atgmhelos',      label: 'ATGM Helo'                  },
      { key: 'rocketpodhelos', label: 'Rocket Pod Helo - INCOMPLETE' },
    ],
  },
  {
    label: 'Ground Attack',
    items: [
      { key: 'tanks',         label: 'Tank'          },
      { key: 'atgmvehicles',  label: 'ATGM Vehicle'  },
      { key: 'atgminfantry',  label: 'ATGM Infantry' },
    ],
  },
  {
    label: 'Ground Attack - INCOMPLETE',
    items: [
      { key: 'firesupport',    label: 'Fire Support - INCOMPLETE' },
    ],
  },
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

  const rowBase = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    padding: '10px 14px',
    border: `1px solid ${t.rule}`,
    background: t.surface,
    color: t.ink, textDecoration: 'none',
    fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase',
    cursor: 'pointer',
  };

  const rowSmall = {
    display: 'flex', justifyContent: 'center', alignItems: 'baseline',
    padding: '6px 14px',
    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
    borderBottom: `1px solid ${t.rule}`,
    background: t.bg,
    color: t.dimmer, textDecoration: 'none',
    fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
    cursor: 'pointer',
  };

  return (
    <div style={{
      ...BMono,
      width: '100%', height: '100%',
      background: t.bg, color: t.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
      flexDirection: 'column', gap: 4,
      paddingTop: 40,
    }}>
      <div style={{ fontSize: 18, letterSpacing: '0.32em', color: t.ink, fontWeight: 600, marginBottom: 24 }}>
        WRD<span style={{ color: t.accent, marginLeft: 6 }}>TOOLBOX</span>
      </div>

      {/* Armory */}
      <a href={`${BASE}armory/`} style={{ ...rowBase, minWidth: 280 }}>
        <span style={{ color: t.accent }}>Armory</span>
        <span style={{ color: t.dimmer, fontSize: 10, letterSpacing: '0.18em' }}>unit reference</span>
      </a>

      {/* AP Damage Calculator */}
      <a href={`${BASE}apdamage/`} style={{ ...rowBase, minWidth: 280 }}>
        <span style={{ color: t.accent }}>AP Damage</span>
        <span style={{ color: t.dimmer, fontSize: 10, letterSpacing: '0.18em' }}>damage calculator</span>
      </a>

      {/* Spreadsheets dropdown */}
      <div ref={wrapRef} style={{ position: 'relative', minWidth: 280 }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{ ...rowBase }}
        >
          <span style={{ color: open ? t.accent : t.ink }}>Spreadsheets</span>
          <span style={{ color: t.dimmer, fontSize: 10, letterSpacing: '0.18em' }}>
            {open ? '▲' : '▼'}
          </span>
        </div>

        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: t.bg, border: `1px solid ${t.rule}`, borderTop: 'none',
            zIndex: 10, maxHeight: 420, overflowY: 'auto',
          }}>
            {CATEGORIES.map((cat, ci) => (
              <React.Fragment key={cat.label}>
                <div style={{
                  padding: '5px 14px 3px',
                  fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                  color: t.accent,
                  borderBottom: `1px solid ${t.rule}`,
                  borderTop: ci === 0 ? 'none' : `1px solid ${t.rule}`,
                  background: t.surface,
                }}>
                  {cat.label}
                </div>
                {cat.items.map(s => (
                  <a
                    key={s.key}
                    href={`${BASE}spreadsheet/?ds=${s.key}`}
                    style={rowSmall}
                  >
                    <span>{s.label}</span>
                  </a>
                ))}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div style={{ fontSize: 9, color: t.dimmer, letterSpacing: '0.24em', marginTop: 20 }}>
        ◦ WARGAME: RED DRAGON REFERENCE TOOLS
      </div>
    </div>
  );
}
