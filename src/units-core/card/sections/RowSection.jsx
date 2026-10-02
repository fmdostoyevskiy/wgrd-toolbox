import React from 'react';
import { SectionHeader } from '../primitives/SectionHeader.jsx';
import { FieldRow, useVisibleRows } from '../FieldRows.jsx';

// A titled list of field rows. Renders nothing when no row (and no `lead`) is visible.
export function RowSection({ title, specs, unit, s, lead, onCapture }) {
  const rows = useVisibleRows(specs, unit, { s });
  if (rows.length === 0 && !lead) return null;
  return (
    <>
      <SectionHeader title={title} s={s} onCapture={onCapture} />
      <div className="sr">
        {lead}
        {rows.map(r => <FieldRow key={r.key} row={r} s={s} />)}
      </div>
    </>
  );
}
