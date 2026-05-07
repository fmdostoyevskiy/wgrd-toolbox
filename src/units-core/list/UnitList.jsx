import React, { useMemo } from 'react';
import { List } from 'react-window';
import { UnitListRow, ROW_HEIGHTS } from './UnitListRow.jsx';

const BASE_HEIGHT      = ROW_HEIGHTS.compact;
const TRANSPORT_HEIGHT = ROW_HEIGHTS.transportCompact;
const TRANSPORT_TRAY_PAD = 4;

function rowHeight(index, props) {
  const u = props.rows[index];
  if (!u) return BASE_HEIGHT;
  const open = props.expandedSet.has(u.id);
  if (!open || !u.transports?.length) return BASE_HEIGHT;
  return BASE_HEIGHT + u.transports.length * TRANSPORT_HEIGHT + TRANSPORT_TRAY_PAD;
}

function Row({ index, style, rows, selectedId, selectedTransportId, pinnedSet, expandedSet, onSelect, onToggleTransports, packCounts, transportPackCounts }) {
  const u = rows[index];
  if (!u) return null;
  return (
    <div style={style}>
      <UnitListRow
        u={u}
        active={selectedId === u.id}
        pinned={pinnedSet.has(u.id)}
        transportsOpen={expandedSet.has(u.id)}
        selectedTransportId={selectedTransportId}
        onSelect={onSelect}
        onToggleTransports={onToggleTransports}
        packCount={packCounts ? (packCounts[u.id] ?? 0) : null}
        transportPackCounts={transportPackCounts}
        compact
      />
    </div>
  );
}

export function UnitList({
  rows, selectedId, selectedTransportId, pinnedIds, expandedIds,
  onSelect, onToggleTransports, packCounts, transportPackCounts,
}) {
  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);

  const rowProps = useMemo(() => ({
    rows, selectedId, selectedTransportId, pinnedSet, expandedSet: expandedIds,
    onSelect, onToggleTransports, packCounts, transportPackCounts,
  }), [rows, selectedId, selectedTransportId, pinnedSet, expandedIds, onSelect, onToggleTransports, packCounts, transportPackCounts]);

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
