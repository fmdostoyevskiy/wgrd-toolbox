import React, { useState } from 'react';
import {
  BROWSER_TOKENS, BMono,
  ALL_NATIONS, PACT_NATIONS, NATION_FLAG_MAP, NATION_CODE_MAP,
  COALITIONS, COALITION_NATIONS, COALITION_FLAG_MAP,
} from '@units-core';
import { ERAS, DECK_SPECS } from './deckConstants.js';

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

export function DeckSetup({ onStart }) {
  const t = BROWSER_TOKENS;
  const [side, setSide]     = useState('nato');
  const [choice, setChoice] = useState(null);
  const [era, setEra]       = useState('A');
  const [spec, setSpec]     = useState(null);

  const nations = side === 'nato' ? NATO_NATIONS : PACT_NATIONS_LIST;
  const coals   = side === 'nato' ? NATO_COALS : PACT_COALS;
  const alliance = side === 'nato' ? 'NATO' : 'PACT';

  const canStart = choice != null;

  function handleStart() {
    if (!canStart) return;
    onStart(choice, spec, era);
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
    }}>
      <div style={{ fontSize: 16, letterSpacing: '0.28em', fontWeight: 600, marginBottom: 30 }}>
        DECK<span style={{ color: t.accent, marginLeft: 6 }}>BUILDER</span>
      </div>

      <div style={{ maxWidth: 700, width: '100%', padding: '0 24px' }}>
        {/* Side */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Side</div>
          <div style={{ display: 'flex', gap: 8 }}>
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
            label={`${alliance} (+0 AP, +0% avail)`}
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
                label={name}
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
                label={NATION_CODE_MAP[code] ?? code}
                flagSrc={NATION_FLAG_MAP[code]}
                active={choice === code}
              />
            ))}
          </div>
        </div>

        {/* Era */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Era</div>
          <div style={{ display: 'flex', gap: 6 }}>
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
                }}
              >
                {e.label} <span style={{ fontSize: 9, opacity: 0.7 }}>({e.desc})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Specialization */}
        <div style={sectionStyle}>
          <div style={labelStyle}>Specialization</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
        </div>

        {/* Start */}
        <div style={{ marginTop: 24, marginBottom: 40 }}>
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
        </div>
      </div>
    </div>
  );
}
