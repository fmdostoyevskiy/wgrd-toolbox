import React from 'react';
import { BROWSER_TOKENS, BMono, TABS, SPEC_VET_BONUS } from '@units-core';

function shiftAvail(avail, shift) {
  if (!shift || !avail) return avail;
  const result = [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i++) {
    const target = Math.min(i + shift, 4);
    result[target] = Math.max(result[target], avail[i] ?? 0);
  }
  return result;
}

function computeAvail(unit, spec, availBonus) {
  let avail = unit?.avail;
  if (!avail) return avail;
  if (spec) {
    const shift = (SPEC_VET_BONUS[spec] ?? {})[unit.tab] ?? 0;
    if (shift > 0) avail = shiftAvail(avail, shift);
  }
  if (availBonus) avail = avail.map(a => a > 0 ? Math.max(1, Math.round(a * (100 + availBonus) / 100)) : 0);
  return avail;
}

const TAB_FULL_NAMES = {
  LOG: 'Logistics', INF: 'Infantry', SUP: 'Support',
  TNK: 'Tank', REC: 'Recon', VHC: 'Vehicle',
  HEL: 'Helicopter', AIR: 'Air', NAV: 'Naval',
};

function VetChevrons({ vet }) {
  return (
    <span style={{ display: 'inline-flex', gap: 0 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{
          color: i <= vet ? '#ffd166' : 'rgba(255,209,102,0.18)',
          fontSize: 8, lineHeight: 1, width: 5,
          textAlign: 'center',
        }}>›</span>
      ))}
    </span>
  );
}

function UnitCard({ card, index, cost, units, onRemoveCard, spec, availBonus }) {
  const t = BROWSER_TOKENS;
  const u = units?.[card.unitId];
  const transport = card.transportId ? units?.[card.transportId] : null;
  const avail = computeAvail(u, spec, availBonus);

  return (
    <div
      className={`ov-card${transport ? ' ov-card--has-transport' : ''}`}
      style={{
        display: 'grid',
        gridTemplateRows: transport ? '10px 1fr auto' : '10px 1fr',
        padding: '3px 6px 0',
        gap: '1px',
        cursor: 'default',
        position: 'relative',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 8, color: t.dim, fontVariantNumeric: 'tabular-nums' }}>
          {u?.cost ?? ''}{avail?.[card.vet] != null && <span style={{ color: t.dimmer }}> ×{avail[card.vet]}</span>}
        </span>
        <VetChevrons vet={card.vet} />
      </div>

      <div
        title={u?.name ?? card.unitId}
        style={{
          fontSize: 9, color: t.ink, alignSelf: 'center',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}
      >
        {u?.name ?? card.unitId}
      </div>

      {transport && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          borderTop: `1px solid ${t.rule}`,
          margin: '0 -6px', padding: '1px 6px',
          fontSize: 8, color: t.dimmer,
          overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{transport.cost}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{transport.name}</span>
        </div>
      )}

      {/* Remove button (appears on hover via CSS) */}
      <button
        className="ov-card-remove"
        onClick={(e) => { e.stopPropagation(); onRemoveCard(card.key); }}
        style={{
          ...BMono,
          position: 'absolute', top: 2, right: 4,
          background: 'transparent', color: t.dimmer,
          border: 'none', padding: '2px 4px', fontSize: 9,
          cursor: 'pointer', lineHeight: 1,
          opacity: 0, transition: 'opacity 0.15s',
        }}
      >✕</button>
    </div>
  );
}

function EmptyCard({ index, cost, onSelectTab, tab }) {
  const t = BROWSER_TOKENS;
  return (
    <div
      className="ov-card ov-card--empty"
      onClick={() => onSelectTab(tab)}
      style={{
        display: 'grid',
        gridTemplateRows: '12px 1fr',
        padding: '5px 8px',
        gap: '2px',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 10, color: t.dimmer, fontVariantNumeric: 'tabular-nums' }}>
        {index + 1}<span style={{ opacity: 0.6 }}> · </span>{cost}<span style={{ fontSize: 8, opacity: 0.6 }}>AP</span>
      </span>
      <span style={{
        fontSize: 10, color: t.dimmer, alignSelf: 'center',
        letterSpacing: '0.06em',
      }}>+ ADD UNIT</span>
    </div>
  );
}

export function OverviewTab({ tabSlots, units, onRemoveCard, onSelectTab, config, availBonus }) {
  const t = BROWSER_TOKENS;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Tab rows */}
      <div style={{
        flex: 1, overflowY: 'auto', minHeight: 0,
        '--ov-rule': t.rule, '--ov-surface': t.surface, '--ov-accent': t.accent,
      }}>
        {TABS.map(tab => {
          const slot = tabSlots[tab];
          if (!slot) return null;
          const { total, used, cards, costs } = slot;
          if (total === 0) return null;

          return (
            <div key={tab} className="ov-tab-row">
              {/* Sidebar label */}
              <div
                onClick={() => onSelectTab(tab)}
                style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  padding: '4px 12px',
                  cursor: 'pointer',
                  borderRight: `1px solid ${t.rule}`,
                }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                }}>
                  <span style={{
                    fontSize: 14, fontWeight: 700, letterSpacing: '0.04em',
                    color: t.accent,
                  }}>{tab}</span>
                  <span style={{
                    fontSize: 12, fontVariantNumeric: 'tabular-nums', color: t.ink,
                  }}>
                    {used}<span style={{ color: t.dimmer }}>/</span>{total}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: t.dim, marginTop: 2 }}>
                  {TAB_FULL_NAMES[tab]}
                </div>
                {/* Progress bar */}
                <div style={{
                  height: 2, background: t.rule, marginTop: 4, borderRadius: 1,
                }}>
                  <div style={{
                    height: '100%', borderRadius: 1,
                    width: total > 0 ? `${(used / total) * 100}%` : '0%',
                    background: used >= total ? '#d27474' : t.accent,
                    transition: 'width 0.2s',
                  }} />
                </div>
              </div>

              {/* Cards area */}
              <div style={{
                display: 'flex', flexWrap: 'nowrap',
                padding: '6px 6px', gap: 3, minWidth: 0,
              }}>
                {cards.map((card, i) => (
                  <UnitCard
                    key={card.key}
                    card={card}
                    index={i}
                    cost={costs[i] ?? 0}
                    units={units}
                    onRemoveCard={onRemoveCard}
                    spec={config?.spec}
                    availBonus={availBonus}
                  />
                ))}
                {Array.from({ length: total - used }, (_, i) => (
                  <EmptyCard
                    key={`empty-${i}`}
                    index={used + i}
                    cost={costs[used + i] ?? '?'}
                    onSelectTab={onSelectTab}
                    tab={tab}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
