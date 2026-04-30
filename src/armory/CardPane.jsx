import React from 'react';
import { CardSlot } from './CardSlot.jsx';

export function CardPane({ selectedId, pinnedIds, onTogglePin, units, slots = 2, selectedSpec = null, noPins = false }) {
  const otherPinned = pinnedIds.find(id => id !== selectedId);
  const slotsArr = noPins
    ? [selectedId]
    : otherPinned
      ? [selectedId, otherPinned]
      : [null, selectedId];
  const colCount = noPins ? 1 : slots;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`,
      gap: 14, height: '100%', minHeight: 0,
    }}>
      {slotsArr.map((id, i) => {
        const isPinned = id != null && pinnedIds.includes(id);
        return (
          <CardSlot
            key={i}
            unitId={id}
            units={units}
            isPinned={isPinned}
            selectedSpec={selectedSpec}
            noPins={noPins}
            onTogglePin={!noPins && id ? () => onTogglePin(id) : null}
          />
        );
      })}
    </div>
  );
}
