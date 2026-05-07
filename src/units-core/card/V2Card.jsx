import React, { useEffect, useMemo, useState } from 'react';
import { VET_TIERS, VET_TOOLTIPS } from '../constants/veterancy.js';
import { V2_THEMES } from '../constants/theme.js';
import { NATION_FLAG_MAP } from '../constants/nations.js';
import { GeneralSection } from './sections/GeneralSection.jsx';
import { MobilitySection, hasMobility } from './sections/MobilitySection.jsx';
import { OpticsSection, hasOptics } from './sections/OpticsSection.jsx';
import { ArmorSection } from './sections/ArmorSection.jsx';
import { ArmamentSection } from './sections/ArmamentSection.jsx';
import { HideContext, makeHide } from './HideContext.js';
import { useExpertMode } from './ExpertModeContext.js';

const CARD_FONT = 'var(--wrd-mono, "JetBrains Mono", ui-monospace, Menlo, monospace)';

function VetSelector({ vetIdx, setVetIdx, avail, s, deckMode, maxPacksReached, hoveredVetIdx, onVetHover }) {
  const [pressing, setPressing] = useState(null);
  const displayIdx = hoveredVetIdx ?? vetIdx;

  return (
    <div style={{ margin: '10px 0 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 10, color: s.dim, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {deckMode ? 'Add' : 'Vet'}
      </span>
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        border: `1px solid ${s.rule}`,
      }}>
        {VET_TIERS.map((t, i) => {
          const active      = i === displayIdx;
          const unavailable = avail?.[i] === 0;
          const blocked     = deckMode && (unavailable || maxPacksReached);
          const isPressed   = deckMode && pressing === i && !blocked;
          const bg = isPressed
            ? `color-mix(in srgb, ${s.accent} 45%, transparent)`
            : active
            ? s.accent
            : 'transparent';
          return (
            <button
              key={t.id}
              title={VET_TOOLTIPS[i]}
              onClick={!blocked && deckMode ? () => setVetIdx(i) : undefined}
              onMouseDown={!blocked && deckMode ? () => setPressing(i) : undefined}
              onMouseUp={deckMode ? () => setPressing(null) : undefined}
              onMouseEnter={() => onVetHover(i)}
              onMouseLeave={() => { if (deckMode) setPressing(null); }}
              disabled={blocked}
              style={{
                background: bg,
                border: 'none',
                borderLeft: i === 0 ? 'none' : `1px solid ${s.rule}`,
                color: active ? s.bg : isPressed ? s.accent : s.dim,
                padding: '4px 0 3px', fontFamily: 'inherit',
                cursor: blocked ? 'not-allowed' : 'pointer',
                opacity: (unavailable || maxPacksReached) ? 0.35 : 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', lineHeight: 1.05,
                transition: 'background 80ms ease-out, color 80ms ease-out',
                transform: isPressed ? 'scale(0.94)' : 'scale(1)',
              }}>
              <span style={{ fontSize: 11, letterSpacing: '0.14em', fontWeight: active ? 600 : 400 }}>
                {t.label}
              </span>
              <span style={{
                fontSize: 9, opacity: active ? 0.85 : 0.65,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em', marginTop: 1,
              }}>
                ×{avail?.[i] ?? '—'}
              </span>
            </button>
          );
        })}
      </div>
      <span style={{ fontSize: 10, color: s.dim, fontVariantNumeric: 'tabular-nums', minWidth: 42, textAlign: 'right' }}>
        ×{VET_TIERS[displayIdx].accMul.toFixed(1)}
      </span>
    </div>
  );
}

function TitleBlock({ unit, s }) {
  return (
    <div style={{
      border: `1.5px solid ${s.ruleStrong}`, padding: '10px 14px',
      display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
      background: s.paper,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, color: s.dim, letterSpacing: '0.16em' }}>
          DWG. № {unit.tab}-{String(unit.id).slice(-8).toUpperCase()}
        </div>
        <div style={{
          fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em',
          marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{unit.name}</div>
        <div style={{ fontSize: 11, color: s.dim, marginTop: 3, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
          {unit.tab} ·
          <img src={NATION_FLAG_MAP[unit.nation]} alt={unit.nationName ?? unit.nation}
               style={{ height: 14, width: 'auto' }} />
          {unit.nation}
        </div>
      </div>
      <div style={{
        borderLeft: `1px solid ${s.ruleStrong}`, paddingLeft: 12,
        textAlign: 'right', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', minWidth: 60,
      }}>
        <div style={{ fontSize: 26, color: s.accent, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {unit.cost}<span style={{ fontSize: 12, marginLeft: 2 }}>pt</span>
        </div>
      </div>
    </div>
  );
}

function ExpertModeFooter({ s }) {
  const { expert, toggleExpert } = useExpertMode();
  return (
    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
      <button onClick={toggleExpert} style={{
        background: 'transparent',
        color: expert ? s.accent : s.dim,
        border: `1px solid ${expert ? s.accent : s.rule}`,
        fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.14em',
        padding: '2px 8px', cursor: 'pointer',
      }}>
        {expert ? 'EXPERT ✓' : 'EXPERT'}
      </button>
    </div>
  );
}

export function V2Card({ unit, avail: availProp, vetIdx, setVetIdx, theme = 'tactical', hide, deckMode, maxPacksReached }) {
  const avail = availProp ?? unit.avail;
  const s     = { ...(V2_THEMES[theme] ?? V2_THEMES.tactical), font: CARD_FONT };

  const [hoveredVet, setHoveredVet] = useState(null);
  useEffect(() => { setHoveredVet(null); }, [vetIdx]);
  const vet = VET_TIERS[hoveredVet ?? vetIdx];

  const hideCtx = useMemo(() => makeHide(hide), [hide]);

  const isFob       = unit.type === 'FOB';
  const showArmor   = unit.armor != null && unit.type !== 'Infantry' && !isFob;
  const showWeapons = unit.weapons?.length > 0 && !isFob;

  return (
    <HideContext.Provider value={hideCtx}>
      <div style={{
        background: s.bg, color: s.ink,
        fontFamily: s.font,
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        fontSize: 13, overflow: 'hidden',
      }}>
        {hideCtx.section('title') && (
          <div style={{ padding: '18px 18px 0', flexShrink: 0 }}>
            <TitleBlock unit={unit} s={s} />
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 18px' }}>
          {hideCtx.section('vet') && (
            <VetSelector vetIdx={vetIdx} setVetIdx={setVetIdx} avail={avail} s={s} deckMode={deckMode} maxPacksReached={maxPacksReached} hoveredVetIdx={hoveredVet} onVetHover={setHoveredVet} />
          )}

          {hideCtx.section('general')  && <GeneralSection unit={unit} s={s} />}
          {hideCtx.section('mobility') && !isFob && hasMobility(unit) && <MobilitySection unit={unit} s={s} />}
          {hideCtx.section('optics')   && !isFob && hasOptics(unit)   && <OpticsSection   unit={unit} s={s} />}
          {hideCtx.section('armor')    && showArmor   && <ArmorSection    armor={unit.armor} s={s} />}
          {hideCtx.section('armament') && showWeapons && <ArmamentSection weapons={unit.weapons} vet={vet} s={s} />}
          <ExpertModeFooter s={s} />
        </div>
      </div>
    </HideContext.Provider>
  );
}
