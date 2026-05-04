import React, { useCallback } from 'react';
import { BROWSER_TOKENS, BMono } from '../constants/theme.js';
import { sideOf, NATION_FLAG_MAP } from '../constants/nations.js';
import { FlagImg } from './FlagImg.jsx';

const ROW_HEIGHT_COMPACT = 25;
const ROW_HEIGHT_DEFAULT = 29;
const TRANSPORT_HEIGHT_COMPACT = 23;
const TRANSPORT_HEIGHT_DEFAULT = 27;

export const ROW_HEIGHTS = {
  compact:        ROW_HEIGHT_COMPACT,
  default:        ROW_HEIGHT_DEFAULT,
  transportCompact: TRANSPORT_HEIGHT_COMPACT,
  transportDefault: TRANSPORT_HEIGHT_DEFAULT,
};

export const UnitListRow = React.memo(function UnitListRow({
  u, active, pinned, transportsOpen, selectedId,
  onSelect, onToggleTransports, compact = false,
}) {
  const t = BROWSER_TOKENS;
  const side = sideOf(u.nation);
  const sideColor = side === 'signal' ? t.pactTag : t.natoTag;
  const hasTransports = u.transports?.length > 0;

  const handleClick    = useCallback(() => onSelect(u.id), [onSelect, u.id]);
  const handleChevron  = useCallback((e) => { e.stopPropagation(); onToggleTransports(u.id); }, [onToggleTransports, u.id]);

  const rowBackground = active
    ? `color-mix(in srgb, ${sideColor} 12%, transparent)`
    : pinned
    ? `color-mix(in srgb, ${t.accent} 6%, transparent)`
    : 'transparent';

  return (
    <div style={{
      ...BMono,
      borderLeft: `2px solid ${active ? sideColor : 'transparent'}`,
      background: rowBackground,
      borderBottom: `1px solid ${t.rule}`,
    }}>
      <div onClick={handleClick} style={{
        display: 'grid', gridTemplateColumns: '30px 1fr 46px 42px',
        alignItems: 'center', gap: 6,
        padding: compact ? '3px 10px' : '5px 10px',
        fontSize: 11.5,
        color: t.ink, cursor: 'pointer',
      }}>
        <span style={{ fontSize: 9.5, letterSpacing: '0.12em', color: active ? sideColor : t.dimmer, fontWeight: 500 }}>
          {u.tab}
        </span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {u.name}
        </span>
        <span style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <FlagImg src={NATION_FLAG_MAP[u.nation]} label={u.nation} h={13} />
        </span>
        <span
          onClick={hasTransports ? handleChevron : undefined}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, userSelect: 'none', cursor: hasTransports ? 'pointer' : 'default' }}
        >
          {hasTransports && (
            <span style={{ fontSize: 10, color: transportsOpen ? t.accent : t.dimmer, lineHeight: 1 }}>
              {transportsOpen ? '▴' : '▾'}
            </span>
          )}
          <span style={{ fontSize: 9.5, color: t.accent, display: 'inline-block', width: 24, textAlign: 'right' }}>{u.cost}</span>
        </span>
      </div>
      {transportsOpen && hasTransports && (
        <div style={{ borderLeft: `2px solid ${t.rule}`, marginLeft: 14, marginBottom: 4 }}>
          {u.transports.map(tr => (
            <TransportRow
              key={tr.id}
              tr={tr}
              active={selectedId === tr.id}
              compact={compact}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
});

function TransportRow({ tr, active, compact, onSelect }) {
  const t = BROWSER_TOKENS;
  const side = sideOf(tr.nation);
  const color = side === 'signal' ? t.pactTag : t.natoTag;
  const handleClick = useCallback((e) => { e.stopPropagation(); onSelect(tr.id); }, [onSelect, tr.id]);

  return (
    <div onClick={handleClick} style={{
      display: 'grid', gridTemplateColumns: '24px 1fr 40px 24px',
      alignItems: 'center', gap: 6,
      padding: compact ? '3px 8px' : '4px 8px',
      fontSize: 10.5,
      color: t.ink, cursor: 'pointer',
      borderBottom: `1px solid ${t.rule}`,
      borderLeft: `2px solid ${active ? color : 'transparent'}`,
      background: active ? `color-mix(in srgb, ${color} 10%, transparent)` : 'transparent',
    }}>
      <span style={{ fontSize: 8.5, letterSpacing: '0.1em', color: active ? color : t.dimmer, fontWeight: 500 }}>
        {tr.tab}
      </span>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {tr.name}
      </span>
      <span style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <FlagImg src={NATION_FLAG_MAP[tr.nation]} label={tr.nation} h={11} />
      </span>
      <span style={{ fontSize: 8.5, color: t.accent, textAlign: 'right' }}>{tr.cost}</span>
    </div>
  );
}
