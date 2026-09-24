import React, { useEffect, useRef, useState } from 'react';
import { BROWSER_TOKENS } from '../constants/theme.js';
import { UiControls } from '../zoom/UiControls.jsx';
import { VET_TIERS, VET_TOOLTIPS } from '../constants/veterancy.js';
import { MORALE, lowestVet } from '../combat/conditions.js';
import {
  TEAL, GREEN, ORANGE, RED, armorColor, armorSideRearColor, armorTopColor,
} from '../format/tiers.js';

// Tool header: logo linking home, zoom/theme controls and a subtitle.
export function CompareHeader({ name, subtitle }) {
  const t = BROWSER_TOKENS;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
      borderBottom: `2px solid ${t.ruleStrong}`, paddingBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href={import.meta.env.BASE_URL} style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.18em', color: t.ink, textDecoration: 'none' }}>
          {name} <span style={{ color: t.dimmer, fontWeight: 300 }}>/</span> <span style={{ color: t.dim }}>WRD</span>
        </a>
        <UiControls />
      </div>
      <div style={{ fontSize: 12, letterSpacing: '0.12em', color: t.dimmer }}>{subtitle}</div>
    </div>
  );
}

const groupLabel = s => ({ fontSize: 11, letterSpacing: '0.14em', color: s.dim });
// Height of the gauges and armor squares, so the groups line up in a row.
const CONTROL_H = 38;

// A low-to-high gauge: one bar per level, each taller than the last, filled up
// to the chosen one in its color. levels: [{ name, color, title, disabled }],
// lowest first.
export function LevelMeter({ label, levels, value, onChange, s }) {
  const cur = levels[value];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={groupLabel(s)}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
        <div role="group" aria-label={label} style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
          {levels.map((lv, i) => {
            const filled = i <= value && !lv.disabled;
            return (
              <button key={i} onClick={() => onChange(i)} disabled={lv.disabled}
                title={lv.title ?? lv.name} aria-label={lv.name} aria-pressed={i === value} style={{
                width: 12, height: Math.round(CONTROL_H * (i + 1) / levels.length), padding: 0,
                cursor: lv.disabled ? 'not-allowed' : 'pointer', opacity: lv.disabled ? 0.5 : 1,
                background: filled ? cur.color : 'transparent',
                border: `1px ${lv.disabled ? 'dashed' : 'solid'} ${filled ? cur.color : s.ruleStrong}`,
              }} />
            );
          })}
        </div>
        <span style={{ fontSize: 11, letterSpacing: '0.04em', color: cur.color, minWidth: '8.4ch', lineHeight: 1 }}>{cur.name}</span>
      </div>
    </div>
  );
}

const VET_COLORS = [RED, ORANGE, `color-mix(in srgb, ${ORANGE}, ${GREEN})`, GREEN, TEAL];
const MORALE_COLORS = [TEAL, GREEN, ORANGE, RED];  // CALM → PANICKED

// Veterancy and morale gauges for a unit. Veterancies the unit can't be
// bought at are greyed out. Morale is shown worst first so both fill up
// towards the better state.
export function CrewControls({ unit, vet, morale, onVet, onMorale, s }) {
  const minVet = lowestVet(unit);
  const vets = VET_TIERS.map((v, i) => ({
    name: v.name, color: VET_COLORS[i], disabled: i < minVet,
    title: i < minVet
      ? `${unit.name} isn't available at this veterancy`
      : `${v.name}: accuracy ×${v.accMul.toFixed(2)} (applied to erfinv)\n${VET_TOOLTIPS[i]}`,
  }));
  const last = MORALE.length - 1;
  const morales = MORALE.map((m, i) => ({
    name: m.label, color: MORALE_COLORS[i], title: `${m.label}: hit chance ×${m.mul.toFixed(2)}`,
  })).reverse();
  return (
    <>
      <LevelMeter label="VETERANCY" levels={vets} value={vet} onChange={onVet} s={s} />
      <LevelMeter label="MORALE" levels={morales} value={last - morale} onChange={i => onMorale(last - i)} s={s} />
    </>
  );
}

// A labelled row of small squares, each a name over a colored value, like the
// armory card's armor. cells: [{ key, name, value, color, title, pickable }];
// cells with pickable false are shown for reference, dashed and faded.
export function SquarePicker({ label, cells, value, onChange, width = 46, s }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={groupLabel(s)}>{label}</div>
      <div role="group" aria-label={label} style={{ display: 'flex', gap: 6 }}>
        {cells.map(cell => {
          const c = cell.color ?? s.accent;
          const pickable = cell.pickable !== false;
          const on = cell.key === value;
          const box = {
            fontFamily: 'inherit', width, height: CONTROL_H, boxSizing: 'border-box', padding: '0 3px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
            background: on ? `color-mix(in srgb, ${c} 22%, transparent)` : 'transparent',
            border: `${on ? 2 : 1.5}px ${pickable ? 'solid' : 'dashed'} ${c}`,
            opacity: pickable ? (on ? 1 : 0.7) : 0.4,
          };
          const content = (
            <>
              <span style={{ fontSize: 9.5, letterSpacing: '0.04em', color: on ? s.ink : s.dim }}>{cell.name}</span>
              <span style={{ fontSize: 15, fontWeight: on ? 700 : 400, color: c, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{cell.value}</span>
            </>
          );
          return pickable
            ? <button key={cell.key} onClick={() => onChange(cell.key)} aria-pressed={on} title={cell.title} style={{ ...box, cursor: 'pointer' }}>{content}</button>
            : <div key={cell.key} title={cell.title} style={box}>{content}</div>;
        })}
      </div>
    </div>
  );
}

const ARMOR_CELLS = [
  ['F', 'FRONT', armorColor], ['S', 'SIDE', armorSideRearColor],
  ['R', 'REAR', armorSideRearColor], ['T', 'TOP', armorTopColor],
];

// The unit's four armor values as squares. The ones in `facings` can be
// picked; the rest (top) are shown for reference.
// titles: { [key]: tooltip } for the pickable ones.
export function ArmorPicker({ label, armor, facings, value, onChange, titles, s }) {
  const cells = ARMOR_CELLS.map(([key, name, colorFn]) => {
    const pickable = facings.includes(key);
    return {
      key, name, value: armor[key] ?? 0, color: colorFn(armor[key] ?? 0), pickable,
      title: pickable ? titles?.[key] : `${name} armor: only hit from above, which isn't modelled`,
    };
  });
  return <SquarePicker label={label} cells={cells} value={value} onChange={onChange} s={s} />;
}

// Lays out CrewControls / SquarePicker groups side by side, wrapping.
export function ControlRow({ children }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '14px 22px' }}>{children}</div>;
}

function WeaponTab({ w, i, st, usable, on, onClick, s, label, menuOpen }) {
  return (
    <button onClick={onClick} disabled={!usable && !label}
      aria-haspopup={label ? 'menu' : undefined} aria-expanded={label ? menuOpen : undefined}
      title={st.reason ? `${w.name} — ${st.reason}` : w.name} style={{
      fontFamily: 'inherit', textAlign: 'left', padding: '9px 11px', width: '100%', height: '100%',
      cursor: usable || label ? 'pointer' : 'not-allowed', opacity: usable ? 1 : 0.35,
      display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
      background: on ? `color-mix(in srgb, ${s.accent} 12%, transparent)` : 'transparent',
      border: `1px solid ${on || menuOpen ? s.accent : s.rule}`,
    }}>
      <span style={{ fontSize: 11, letterSpacing: '0.12em', color: on ? s.accent : s.dim, display: 'flex', gap: 6, whiteSpace: 'nowrap' }}>
        WPN {i + 1}{label && <span style={{ marginLeft: 'auto', color: s.dim }}>{label}</span>}
      </span>
      <span style={{
        fontSize: 13, color: on ? s.ink : s.dim, maxWidth: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{w.name}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: st.color }}>{st.text}</span>
    </button>
  );
}

// Weapon selector. stats[i]: { text, color, reason }; weapons that aren't
// usable are greyed out, with the reason in the tooltip. With more than `max`
// weapons, the last tab stands for the rest and opens a menu of them; it
// shows the selected one when that's among them.
export function WeaponTabs({ weapons, stats, usable, value, onChange, s, max = Infinity }) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef(null);
  useEffect(() => {
    if (!menu) return;
    const onDown = e => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    const onKey = e => { if (e.key === 'Escape') setMenu(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menu]);

  const split = weapons.length > max ? max - 1 : weapons.length;
  const rest = weapons.map((w, i) => i).slice(split);
  const shown = rest.includes(value) ? value : rest.find(i => usable[i]) ?? rest[0];
  const tab = i => (
    <WeaponTab key={i} w={weapons[i]} i={i} st={stats[i]} usable={usable[i]} on={i === value}
      onClick={() => onChange(i)} s={s} />
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, height: '100%' }}>
      {weapons.slice(0, split).map((w, i) => tab(i))}
      {rest.length > 0 && (
        <div ref={menuRef} style={{ position: 'relative', minWidth: 0 }}>
          <WeaponTab w={weapons[shown]} i={shown} st={stats[shown]} usable={usable[shown]} on={shown === value}
            onClick={() => setMenu(m => !m)} s={s} label={`+${rest.length - 1} ▾`} menuOpen={menu} />
          {menu && (
            <div role="menu" style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 20, minWidth: '100%', width: 260,
              maxHeight: 320, overflowY: 'auto', background: 'var(--wrd-surface)',
              border: `1px solid ${s.accent}`, boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }}>
              {rest.map(i => {
                const off = !usable[i];
                return (
                  <button key={i} role="menuitemradio" aria-checked={i === value} disabled={off}
                    title={stats[i].reason ? `${weapons[i].name} — ${stats[i].reason}` : weapons[i].name}
                    onClick={() => { onChange(i); setMenu(false); }} style={{
                    fontFamily: 'inherit', fontSize: 13, width: '100%', padding: '7px 10px', textAlign: 'left',
                    display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gap: 10, alignItems: 'baseline',
                    cursor: off ? 'not-allowed' : 'pointer', opacity: off ? 0.35 : 1, border: 'none',
                    borderBottom: `1px solid ${s.rule}`,
                    background: i === value ? `color-mix(in srgb, ${s.accent} 12%, transparent)` : 'transparent',
                  }}>
                    <span style={{ fontSize: 11, letterSpacing: '0.12em', color: i === value ? s.accent : s.dim }}>WPN {i + 1}</span>
                    <span style={{ color: i === value ? s.ink : s.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{weapons[i].name}</span>
                    <span style={{ fontWeight: 700, color: stats[i].color }}>{stats[i].text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// A titled calculation: rows of { label, val, res, title } and a total line
// { label, text, color }. children go between the rows and the total.
// With onToggle, the title collapses the rows (open = false), leaving the
// children and the total. With inline, the total sits on the title line
// instead (its label only shown when it isn't the title, e.g. a reason).
export function CalcSteps({ title, steps, total, s, children, open = true, onToggle, inline = false }) {
  const heading = { letterSpacing: '0.14em', color: s.accent, fontSize: 12 };
  const ruled = (open && steps.length > 0) || children;
  const inlineTotal = inline && total && (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0, marginLeft: 'auto' }}>
      {total.label !== title && (
        <span style={{ color: s.dim, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{total.label}</span>
      )}
      <span style={{ color: total.color, fontWeight: 700, fontSize: 13, letterSpacing: 0 }}>{total.text}</span>
    </span>
  );
  const toggle = onToggle && (
    <span style={{ color: s.dim, fontSize: 11, flexShrink: 0, marginLeft: inlineTotal ? 0 : 'auto' }}>{open ? '▾ HIDE' : '▸ DETAILS'}</span>
  );
  const headRow = { display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: open && steps.length ? 4 : 0 };
  return (
    <div style={{
      border: `1px solid ${s.rule}`, padding: '12px 20px',
      display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13,
    }}>
      {onToggle
        ? (
          <button onClick={onToggle} aria-expanded={open} title={open ? 'Hide the breakdown' : 'Show the breakdown'} style={{
            ...heading, ...headRow, fontFamily: 'inherit', background: 'transparent', border: 'none', padding: 0,
            paddingBottom: headRow.paddingBottom, cursor: 'pointer', textAlign: 'left', width: '100%',
          }}>
            <span style={{ flexShrink: 0 }}>{title}</span>{inlineTotal}{toggle}
          </button>
        )
        : <div style={{ ...heading, ...headRow }}><span style={{ flexShrink: 0 }}>{title}</span>{inlineTotal}</div>}
      {open && steps.map((st, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(64px, auto)', gap: 12, color: s.dim }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={st.title ?? st.label}>{st.label}</span>
          <span style={{ color: s.ink, fontVariantNumeric: 'tabular-nums' }}>{st.val}</span>
          <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{st.res}</span>
        </div>
      ))}
      {children}
      {total && !inline && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', gap: 12,
          borderTop: ruled ? `1px solid ${s.ruleStrong}` : 'none',
          paddingTop: ruled ? 8 : 0, marginTop: 2,
        }}>
          <span style={{ letterSpacing: '0.1em', color: s.ink }}>{total.label}</span>
          <span style={{ color: total.color, fontWeight: 700 }}>{total.text}</span>
        </div>
      )}
    </div>
  );
}
