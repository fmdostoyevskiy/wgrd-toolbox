import React, { useEffect, useState } from 'react';
import { BROWSER_TOKENS, BMono, sideOf, SPEC_VET_BONUS, V2Card } from '@units-core';

function shiftAvail(avail, shift) {
  if (!shift || !avail) return avail;
  const result = [0, 0, 0, 0, 0];
  for (let i = 0; i < 5; i++) {
    const target = Math.min(i + shift, 4);
    result[target] = Math.max(result[target], avail[i] ?? 0);
  }
  return result;
}

function effectiveAvail(unit, selectedSpec) {
  if (!unit?.avail || !selectedSpec) return unit?.avail;
  const shift = (SPEC_VET_BONUS[selectedSpec] ?? {})[unit.tab] ?? 0;
  return shift > 0 ? shiftAvail(unit.avail, shift) : unit.avail;
}

function lowestAvailVet(avail) {
  const idx = avail?.findIndex(a => a > 0) ?? -1;
  return idx >= 0 ? idx : 0;
}

export function CardSlot({ unitId, units, isPinned, onTogglePin, selectedSpec, noPins = false }) {
  const t = BROWSER_TOKENS;
  const unit  = units?.[unitId];
  const avail = effectiveAvail(unit, selectedSpec);
  const [vet, setVet] = useState(() => lowestAvailVet(avail));

  useEffect(() => {
    setVet(lowestAvailVet(effectiveAvail(units?.[unitId], selectedSpec)));
  }, [unitId, selectedSpec, units]);

  if (!unitId) {
    return (
      <div className="armory-card-frame" style={{
        ...BMono,
        border: `1px dashed ${t.rule}`,
        background: `color-mix(in srgb, ${t.surface} 50%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 6,
        color: t.dimmer, fontSize: 11, letterSpacing: '0.2em',
      }}>
        <span>◦ EMPTY SLOT</span>
        <span style={{ fontSize: 9, color: t.dimmer }}>pin a unit to fill</span>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="armory-card-frame" style={{ ...BMono, border: `1px dashed ${t.rule}`, padding: 18, color: t.dimmer }}>
        Unit data not found
      </div>
    );
  }

  return (
    <div className="armory-card-frame" style={{ position: 'relative' }}>
      <V2Card unit={unit} avail={avail} vetIdx={vet} setVetIdx={setVet} theme={sideOf(unit.nation)} />
      {onTogglePin && (
        <button onClick={onTogglePin} style={{
          ...BMono,
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          background: 'rgba(0,0,0,0.4)', color: t.dim,
          border: `1px solid ${t.rule}`,
          padding: '2px 6px', fontSize: 10, letterSpacing: '0.1em',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>{isPinned ? 'UNPIN ✕' : 'PIN'}</button>
      )}
    </div>
  );
}
