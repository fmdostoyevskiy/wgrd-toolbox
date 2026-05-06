import React from 'react';
import { BROWSER_TOKENS, BMono, TABS, FlagImg } from '@units-core';

export function OverviewTab({ tabSlots, units, onRemoveCard, onSelectTab }) {
  const t = BROWSER_TOKENS;

  return (
    <div className="overview-grid">
      {TABS.map(tab => {
        const slot = tabSlots[tab];
        if (!slot) return null;
        const { total, used, cards, costs } = slot;

        return (
          <div key={tab} style={{
            border: `1px solid ${t.rule}`,
            background: t.surface,
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Tab header */}
            <div
              onClick={() => onSelectTab(tab)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px',
                borderBottom: `1px solid ${t.rule}`,
                cursor: 'pointer',
              }}
            >
              <span style={{
                fontSize: 12, letterSpacing: '0.16em', fontWeight: 600,
                color: t.accent,
              }}>{tab}</span>
              <span style={{
                fontSize: 10, color: used >= total ? '#e55' : t.dimmer,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {used}/{total} slots
              </span>
            </div>

            {/* Filled slots */}
            <div style={{ padding: '4px 0' }}>
              {cards.map((card, i) => {
                const u = units?.[card.unitId];
                const transport = card.transportId ? units?.[card.transportId] : null;
                return (
                  <div key={card.key} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '3px 10px', fontSize: 11,
                  }}>
                    <span style={{
                      color: t.dimmer, fontSize: 9, fontVariantNumeric: 'tabular-nums',
                      minWidth: 16,
                    }}>{costs[i] ?? 0}ap</span>
                    {u && <FlagImg nation={u.nation} size={12} />}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u?.name ?? card.unitId}
                    </span>
                    {transport && (
                      <span style={{ color: t.dimmer, fontSize: 10 }}>
                        + {transport.name}
                      </span>
                    )}
                    <span style={{ color: t.dimmer, fontSize: 9 }}>
                      v{card.vet}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveCard(card.key); }}
                      style={{
                        ...BMono, background: 'transparent', color: t.dim,
                        border: 'none', padding: '0 4px', fontSize: 11,
                        cursor: 'pointer', lineHeight: 1,
                      }}
                    >✕</button>
                  </div>
                );
              })}

              {/* Empty slots */}
              {Array.from({ length: total - used }, (_, i) => (
                <div key={`empty-${i}`} style={{
                  padding: '3px 10px', fontSize: 10,
                  color: t.dimmer, fontStyle: 'italic',
                  display: 'flex', gap: 6,
                }}>
                  <span style={{ fontSize: 9, fontVariantNumeric: 'tabular-nums', minWidth: 16 }}>
                    {costs[used + i] ?? '?'}ap
                  </span>
                  <span>empty</span>
                </div>
              ))}

              {total === 0 && (
                <div style={{
                  padding: '6px 10px', fontSize: 10, color: t.dimmer,
                  fontStyle: 'italic', textAlign: 'center',
                }}>
                  no slots
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
