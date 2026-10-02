import React from 'react';
import { DotRow } from './primitives/DotRow.jsx';
import { useHide } from './HideContext.js';
import { useExpertMode } from './ExpertModeContext.js';

// A field spec (see fields/*) declares one card row:
//
//   id       hide.fields id; several rows may share one
//   when     (subject, ctx) => bool; the row only shows when it's truthy
//   expert   true, or (subject, ctx) => bool: the row only shows in expert mode
//   label, value, accent, tooltip, href
//            a constant or (subject, ctx) => value
//   rows     (subject, ctx) => [{ label, value, … }]: expands into several rows
//            that inherit the rest of the spec
//   range    the row is a range row, keyed by its label (activeRange/onRange)
//   accMode  { mode, title }: the row is the accuracy row for that mode (accMode/onAccMode)
//   damage   'AP' | 'HE': the row belongs to that damage kind (activeDamage)
//
// `subject` is the unit or weapon; `ctx` carries the card theme `s` and any
// per-card overrides.

const get = (x, subject, ctx) => (typeof x === 'function' ? x(subject, ctx) : x);

// The rows that pass the hide list, expert mode and their own `when`, with
// every property resolved.
export function useVisibleRows(specs, subject, ctx = {}) {
  const hide = useHide();
  const { expert } = useExpertMode();

  const rows = [];
  for (const spec of specs) {
    if (!hide.field(spec.id)) continue;
    if (!expert && get(spec.expert, subject, ctx)) continue;
    if (spec.when && !spec.when(subject, ctx)) continue;
    for (const part of spec.rows ? spec.rows(subject, ctx) : [spec]) {
      const label = get(part.label ?? spec.label, subject, ctx);
      rows.push({
        id:      spec.id,
        key:     `${spec.id}:${label}`,
        label,
        value:   get(part.value   ?? spec.value,   subject, ctx),
        accent:  get(part.accent  ?? spec.accent,  subject, ctx),
        tooltip: get(part.tooltip ?? spec.tooltip, subject, ctx),
        href:    get(part.href    ?? spec.href,    subject, ctx),
        range:   spec.range,
        accMode: spec.accMode,
        damage:  spec.damage,
      });
    }
  }
  return rows;
}

// Tools that compute hit chance or damage pass `interaction`
// ({ activeRange, onRange, accMode, onAccMode, activeDamage }): it marks the
// rows in use with ▸, greys the alternatives and makes them clickable.
function interactionProps(row, s, ix) {
  const p = {};
  if (row.range) {
    const { activeRange, onRange } = ix;
    p.active     = row.label === activeRange;
    p.accent     = activeRange && row.label !== activeRange ? s.dim : row.accent;
    p.onClick    = onRange && (() => onRange(row.label));
    p.clickTitle = onRange && `Use ${row.label.toLowerCase()}`;
  }
  if (row.accMode && ix.onAccMode) {
    p.active     = ix.accMode === row.accMode.mode;
    p.onClick    = () => ix.onAccMode(row.accMode.mode);
    p.clickTitle = row.accMode.title;
  }
  if (row.damage && ix.activeDamage) {
    p.active = ix.activeDamage === row.damage;
    p.accent = p.active ? row.accent : s.dim;
  }
  return p;
}

export function FieldRow({ row, s, dense, interaction = {} }) {
  return (
    <DotRow label={row.label} value={row.value} accent={row.accent}
      tooltip={row.tooltip} href={row.href}
      {...interactionProps(row, s, interaction)}
      s={s} dense={dense} />
  );
}
