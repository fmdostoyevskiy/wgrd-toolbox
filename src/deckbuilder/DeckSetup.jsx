import React, { useState } from 'react';

const BASE = import.meta.env.BASE_URL;
import {
  BROWSER_TOKENS, BMono,
  ALL_NATIONS, PACT_NATIONS, NATION_FLAG_MAP, NATION_CODE_MAP,
  COALITIONS, COALITION_NATIONS, COALITION_FLAG_MAP, COALITION_CODE_MAP,
  SPEC_VET_BONUS,
} from '@units-core';
import { ERAS, DECK_SPECS, SLOT_COSTS, ERA_AP, DECK_TYPE_AP, CHOICE_AVAIL, classifyDeckChoice } from './deckConstants.js';

const TAB_FULL = {
  LOG: 'Logistics', INF: 'Infantry', SUP: 'Support',
  TNK: 'Tank', REC: 'Recon', VHC: 'Vehicle',
  HEL: 'Helicopter', AIR: 'Air', NAV: 'Naval',
};

const TAB_ORDER = ['LOG', 'INF', 'SUP', 'TNK', 'REC', 'VHC', 'HEL', 'AIR', 'NAV'];

function BonusPanel({ spec, era, choice }) {
  const t = BROWSER_TOKENS;

  const specCosts   = spec ? (SLOT_COSTS[spec] ?? {}) : {};
  const baseCosts   = SLOT_COSTS.General;
  const vetBonuses  = spec ? (SPEC_VET_BONUS[spec] ?? {}) : {};
  const eraAP       = ERA_AP[era] ?? 0;
  const deckType    = choice ? classifyDeckChoice(choice) : null;
  const choiceAP    = deckType ? (DECK_TYPE_AP[deckType] ?? 0) : 0;
  const choiceAvail = choice ? (CHOICE_AVAIL[choice] ?? 0) : 0;
  const prototypes  = deckType === 'nation' || deckType === 'coalition';

  const rows = !spec ? [] : TAB_ORDER.flatMap(tab => {
    const len     = specCosts[tab]?.length ?? 0;
    const baseLen = baseCosts[tab]?.length ?? 0;
    const restricted = len === 0 && baseLen > 0;
    const slotBonus  = len > baseLen ? len - baseLen : 0;
    const vetBonus   = vetBonuses[tab] ?? 0;
    if (!restricted && !slotBonus && !vetBonus) return [];
    return [{ tab, restricted, slotBonus, slotTotal: len, vetBonus }];
  });

  const totalAP = choiceAP + eraAP;
  const allRows = [
    ...(totalAP > 0     ? [{ key: 'ap',     label: 'AP budget',    value: <span style={{ color: t.accent }}>+{totalAP} AP</span> }] : []),
    ...(choiceAvail > 0 ? [{ key: 'avail',  label: 'Availability', value: <span style={{ color: t.accent }}>+{choiceAvail}%</span> }] : []),
    ...(prototypes      ? [{ key: 'proto',  label: 'Prototypes',   value: <span style={{ color: t.accent }}>unlocked</span> }] : []),
    ...rows.map(({ tab, restricted, slotBonus, slotTotal, vetBonus }) => ({
      key: tab,
      label: (
        <span style={{ color: restricted ? t.dimmer : t.ink }}>
          {restricted && <span style={{ marginRight: 5, opacity: 0.5 }}>✕</span>}
          {TAB_FULL[tab] ?? tab}
        </span>
      ),
      value: (
        <div style={{ display: 'flex', gap: 16 }}>
          {restricted && <span style={{ color: t.dimmer, letterSpacing: '0.08em', fontSize: 10 }}>NO SLOTS</span>}
          {slotBonus > 0 && <span><span style={{ color: t.accent }}>+{slotBonus} slots</span><span style={{ color: t.dimmer }}> · {slotTotal} total</span></span>}
          {vetBonus > 0 && <span style={{ color: '#ffd166' }}>+{vetBonus} vet</span>}
        </div>
      ),
    })),
  ];

  if (allRows.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {allRows.map(({ key, label, value }, i) => (
        <div key={key} style={{
          display: 'grid', gridTemplateColumns: '100px 1fr',
          alignItems: 'center', padding: '5px 14px', fontSize: 11,
          borderBottom: i < allRows.length - 1 ? `1px solid ${t.rule}` : 'none',
        }}>
          <span style={{ color: t.dim, letterSpacing: '0.04em' }}>{label}</span>
          {value}
        </div>
      ))}
    </div>
  );
}

const NATO_NATIONS = ALL_NATIONS.filter(n => !PACT_NATIONS.has(n));
const PACT_NATIONS_LIST = ALL_NATIONS.filter(n => PACT_NATIONS.has(n));
const NATO_COALS = COALITIONS.filter(name => {
  const members = COALITION_NATIONS[name];
  return members.every(n => !PACT_NATIONS.has(n));
});
const PACT_COALS = COALITIONS.filter(name => {
  const members = COALITION_NATIONS[name];
  return members.some(n => PACT_NATIONS.has(n));
});

export function DeckSetup({ onStart, onImport }) {
  const t = BROWSER_TOKENS;
  const [side, setSide]         = useState('nato');
  const [choice, setChoice]     = useState(null);
  const [era, setEra]           = useState('A');
  const [spec, setSpec]         = useState(null);
  const [importCode, setImportCode] = useState('');
  const [importError, setImportError] = useState(false);

  const nations = side === 'nato' ? NATO_NATIONS : PACT_NATIONS_LIST;
  const coals   = side === 'nato' ? NATO_COALS : PACT_COALS;
  const alliance = side === 'nato' ? 'NATO' : 'PACT';

  const canStart = choice != null;

  function handleStart() {
    if (!canStart) return;
    onStart(choice, spec, era);
  }

  function handleImport() {
    if (!importCode.trim()) return;
    const ok = onImport(importCode);
    if (!ok) {
      setImportError(true);
      setTimeout(() => setImportError(false), 1200);
    }
  }

  const sectionStyle = {
    marginBottom: 16,
  };

  const labelStyle = {
    fontSize: 10, letterSpacing: '0.2em', color: t.dimmer,
    textTransform: 'uppercase', marginBottom: 6,
  };

  function ChoiceBtn({ value, label, flagSrc, active }) {
    return (
      <button
        onClick={() => setChoice(value)}
        style={{
          ...BMono,
          background: active ? t.accent : 'transparent',
          color: active ? t.bg : t.dim,
          border: `1px solid ${active ? t.accent : t.rule}`,
          padding: '6px 10px', fontSize: 11, letterSpacing: '0.1em',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          minWidth: 80,
        }}
      >
        {flagSrc && <img src={flagSrc} alt="" style={{ height: 14, opacity: active ? 1 : 0.6 }} />}
        {label}
      </button>
    );
  }

  return (
    <div style={{
      ...BMono,
      width: '100%', height: '100%',
      background: t.bg, color: t.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
      flexDirection: 'column', paddingTop: 40,
      overflow: 'hidden auto',
      boxSizing: 'border-box',
    }}>
      <a href={BASE} style={{ fontSize: 16, letterSpacing: '0.28em', fontWeight: 600, marginBottom: 30, textDecoration: 'none', color: 'inherit', display: 'block' }}>
        DECK<span style={{ color: t.accent, marginLeft: 6 }}>BUILDER</span>
      </a>

      <div style={{ maxWidth: 700, width: '100%', padding: '0 24px', boxSizing: 'border-box' }}>
        {/* Side */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Side</div>
          <div className="ds-side-row">
            {[['nato', 'NATO', COALITION_FLAG_MAP['NATO']], ['pact', 'PACT', COALITION_FLAG_MAP['PACT']]].map(([val, label, flag]) => (
              <button
                key={val}
                onClick={() => { setSide(val); setChoice(null); }}
                style={{
                  ...BMono,
                  background: side === val ? t.accent : 'transparent',
                  color: side === val ? t.bg : t.dim,
                  border: `1px solid ${side === val ? t.accent : t.rule}`,
                  padding: '8px 20px', fontSize: 12, letterSpacing: '0.14em',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                {flag && <img src={flag} alt="" style={{ height: 18 }} />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Alliance */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Alliance</div>
          <ChoiceBtn
            value={alliance}
            label={alliance}
            flagSrc={COALITION_FLAG_MAP[alliance]}
            active={choice === alliance}
          />
        </div>

        {/* Coalitions */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Coalitions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {coals.map(name => (
              <ChoiceBtn
                key={name}
                value={name}
                label={COALITION_CODE_MAP[name] ?? name}
                flagSrc={COALITION_FLAG_MAP[name]}
                active={choice === name}
              />
            ))}
          </div>
        </div>

        {/* Nations */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Nations</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {nations.map(code => (
              <ChoiceBtn
                key={code}
                value={code}
                label={code}
                flagSrc={NATION_FLAG_MAP[code]}
                active={choice === code}
              />
            ))}
          </div>
        </div>

        {/* Era + Specialization table */}
        <div style={sectionStyle}>
          <div className="ds-era-spec-grid" style={{ border: `1px solid ${t.rule}` }}>
            {/* Headers */}
            <div className="ds-era-header" style={{ ...labelStyle, marginBottom: 0, padding: '5px 14px', borderBottom: `1px solid ${t.rule}`, borderRight: `1px solid ${t.rule}` }}>Era</div>
            <div className="ds-spec-header" style={{ ...labelStyle, marginBottom: 0, padding: '5px 14px', borderBottom: `1px solid ${t.rule}`, borderRight: `1px solid ${t.rule}` }}>Specialization</div>
            <div className="ds-bonus-header" style={{ ...labelStyle, marginBottom: 0, padding: '5px 14px', borderBottom: `1px solid ${t.rule}` }}>Bonuses</div>

            {/* Era buttons */}
            <div className="ds-era-body" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', borderRight: `1px solid ${t.rule}` }}>
              {ERAS.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEra(e.id)}
                  style={{
                    ...BMono,
                    background: era === e.id ? t.accent : 'transparent',
                    color: era === e.id ? t.bg : t.dim,
                    border: `1px solid ${era === e.id ? t.accent : t.rule}`,
                    padding: '6px 14px', fontSize: 11, cursor: 'pointer',
                    textAlign: 'left', whiteSpace: 'nowrap',
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>

            {/* Spec buttons */}
            <div className="ds-spec-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignContent: 'start', gap: 6, padding: '10px 12px', borderRight: `1px solid ${t.rule}` }}>
              {DECK_SPECS.map(s => (
                <button
                  key={s.label}
                  onClick={() => setSpec(s.id)}
                  style={{
                    ...BMono,
                    background: spec === s.id ? t.accent : 'transparent',
                    color: spec === s.id ? t.bg : t.dim,
                    border: `1px solid ${spec === s.id ? t.accent : t.rule}`,
                    padding: '6px 14px', fontSize: 11, cursor: 'pointer',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Bonus panel */}
            <div className="ds-bonus-body" style={{ padding: '4px 0' }}>
              <BonusPanel spec={spec} era={era} choice={choice} />
            </div>
          </div>
        </div>

        {/* Start */}
        <div style={{ marginTop: 24, marginBottom: 40 }}>
          <div className="ds-import-row">
            <button
              onClick={handleStart}
              disabled={!canStart}
              style={{
                ...BMono,
                background: canStart ? t.accent : t.rule,
                color: canStart ? t.bg : t.dimmer,
                border: 'none',
                padding: '10px 32px', fontSize: 13, letterSpacing: '0.2em',
                cursor: canStart ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              BUILD DECK
            </button>
            <input
              className="ds-import-input"
              value={importCode}
              onChange={e => { setImportCode(e.target.value); setImportError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
              placeholder="or paste deck code…"
              style={{
                ...BMono,
                background: t.bg,
                color: t.text,
                border: `1px solid ${importError ? '#e05' : t.rule}`,
                padding: '10px 12px', fontSize: 12,
                outline: 'none',
              }}
            />
            <button
              onClick={handleImport}
              disabled={!importCode.trim()}
              style={{
                ...BMono,
                background: importCode.trim() ? t.accent : t.rule,
                color: importCode.trim() ? t.bg : t.dimmer,
                border: 'none',
                padding: '10px 18px', fontSize: 13, letterSpacing: '0.2em',
                cursor: importCode.trim() ? 'pointer' : 'not-allowed',
                fontWeight: 600,
              }}
            >
              IMPORT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
