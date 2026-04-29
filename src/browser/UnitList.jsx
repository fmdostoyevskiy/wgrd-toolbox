import React, { useCallback, useMemo } from 'react';
import { List } from 'react-window';
import { UnitListRow, ROW_HEIGHTS } from './UnitListRow.jsx';

const BASE_HEIGHT      = ROW_HEIGHTS.compact;
const TRANSPORT_HEIGHT = ROW_HEIGHTS.transportCompact;
const TRANSPORT_TRAY_PAD = 4; // matches the marginBottom on the transport tray

function rowHeight(index, props) {
  const u = props.rows[index];
  if (!u) return BASE_HEIGHT;
  const open = props.expandedSet.has(u.id);
  if (!open || !u.transports?.length) return BASE_HEIGHT;
  return BASE_HEIGHT + u.transports.length * TRANSPORT_HEIGHT + TRANSPORT_TRAY_PAD;
}

function Row({ index, style, rows, selectedId, pinnedSet, expandedSet, onSelect, onToggleTransports }) {
  const u = rows[index];
  if (!u) return null;
  return (
    <div style={style}>
      <UnitListRow
        u={u}
        active={selectedId === u.id}
        pinned={pinnedSet.has(u.id)}
        transportsOpen={expandedSet.has(u.id)}
        selectedId={selectedId}
        onSelect={onSelect}
        onToggleTransports={onToggleTransports}
        compact
      />
    </div>
  );
}

export function UnitList({
  rows, selectedId, pinnedIds, expandedIds,
  onSelect, onToggleTransports,
}) {
  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  const rowProps = useMemo(() => ({
    rows, selectedId, pinnedSet, expandedSet: expandedIds,
    onSelect, onToggleTransports,
  }), [rows, selectedId, pinnedSet, expandedIds, onSelect, onToggleTransports]);

  return (
    <List
      style={{ height: '100%', width: '100%' }}
      rowComponent={Row}
      rowCount={rows.length}
      rowHeight={rowHeight}
      rowProps={rowProps}
      overscanCount={6}
    />
  );
}
