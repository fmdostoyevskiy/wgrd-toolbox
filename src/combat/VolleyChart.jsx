import React from 'react';
import { BROWSER_TOKENS, useAxisControl, AxisScale } from '@units-core';

const W = 800, H = 300;
const MID = H / 2;
const PLOT_H = 300;
const GRID = [0.25, 0.5, 0.75, 1];
const BEST_DASH = '2 3';

// Fill opacity of each selected weapon's band, nearest the axis first; also
// used for its key on the weapon selector.
const SHADES = [0.55, 0.32, 0.18, 0.1];
export const shadeOf = rank => SHADES[Math.min(rank, SHADES.length - 1)];

const px = (x, xMax) => (x / xMax * W).toFixed(1);
// Side 0 grows up from the axis, side 1 down.
const py = (f, dir) => (MID - dir * Math.min(1, f) * MID).toFixed(1);

// A step function through the volley steps, as [x, value] corners up to xMax.
function corners(steps, get, xMax) {
  const out = [];
  steps.forEach((st, j) => {
    if (st.t > xMax) return;
    if (j) out.push([st.t, get(steps[j - 1])]);
    out.push([st.t, get(st)]);
  });
  out.push([xMax, get(steps[steps.length - 1])]);
  return out;
}
const pathOf = (pts, xMax, dir) => pts.map(([x, f], i) => `${i ? 'L' : 'M'}${px(x, xMax)} ${py(f, dir)}`).join(' ');

// Damage over time for two sides at once, one on each side of the time axis:
// side 0's damage to side 1 grows up from it, side 1's to side 0 down. Each
// side's selected weapons stack as shaded bands that add up to the average,
// with a dotted line for the best case and a marker where the kill chance
// reaches 50%. Doubles as the time control (click or drag, arrow keys).
// sides: [{ key, label, color, hp, v (volley result, or null), reason,
//           weapons: [{ i, name, shade }] (in the order of v's parts) }]
// controls go in the header, after the label.
export function VolleyChart({ label, xMax, xMin = 0, value, onChange, snap, bigStep, scale, sides, aside, readout, controls }) {
  const t = BROWSER_TOKENS;
  const { props: axis, dragging, hoverX } = useAxisControl({ xMin, xMax, value, onChange, snap, bigStep });
  const pct = x => `${x / xMax * 100}%`;
  const hoverPct = hoverX != null ? hoverX / xMax * 100 : 0;
  const dirOf = k => (k === 0 ? 1 : -1);

  const drawn = sides.map((sd, k) => {
    const dir = dirOf(k);
    if (!sd.v) return { ...sd, dir, bands: [] };
    const { steps } = sd.v;
    const cum = n => st => st.parts.slice(0, n).reduce((a, b) => a + b, 0) / sd.hp;
    const bands = sd.weapons.map((w, n) => {
      const hi = corners(steps, cum(n + 1), xMax), lo = corners(steps, cum(n), xMax);
      return { ...w, d: `${pathOf(hi, xMax, dir)} ${pathOf(lo.reverse(), xMax, dir).replace(/^M/, 'L')} Z` };
    });
    const kill = sd.v.killAt(0.5);
    return {
      ...sd, dir, bands,
      mean: pathOf(corners(steps, st => st.mean / sd.hp, xMax), xMax, dir),
      best: pathOf(corners(steps, st => st.best / sd.hp, xMax), xMax, dir),
      kill: kill != null && kill <= xMax ? kill : null,
      now: sd.v.at(value),
    };
  });
  const hover = hoverX != null ? drawn.map(sd => ({ ...sd, r: sd.v?.at(hoverX) })) : null;

  const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
  const keyStyle = { fontSize: 11, letterSpacing: '0.14em', color: t.dimmer };

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.rule}`, padding: '16px 20px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 16px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: t.dim }}>{label}</div>
        {controls}
        <div style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums', marginLeft: 'auto' }}>{readout}</div>
      </div>
      {/* Key: which half is which side, its weapons' bands and when it's 50% to kill. */}
      {drawn.map(sd => (
        <div key={sd.key} style={{ display: 'flex', gap: '4px 14px', flexWrap: 'wrap', alignItems: 'center', fontSize: 12, color: t.dim }}>
          <span style={{ color: sd.v ? sd.color : t.dimmer, letterSpacing: '0.1em' }}>{sd.dir === 1 ? '▲' : '▼'} {sd.label}</span>
          {sd.v
            ? sd.weapons.map(w => (
              <span key={w.i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, background: sd.color, opacity: w.shade + 0.1 }} />{w.name}
              </span>
            ))
            : <span style={{ color: t.dimmer }}>{sd.reason}</span>}
          {sd.v && (
            <span style={{ marginLeft: 'auto', color: sd.kill != null ? sd.color : t.dimmer, letterSpacing: '0.08em' }}>
              {sd.kill != null ? `50% KILL AT ${sd.kill} s` : `UNDER 50% KILL IN ${xMax} s`}
            </span>
          )}
        </div>
      ))}
      <div style={{ ...keyStyle, display: 'flex', gap: '4px 14px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span>AVG DAMAGE, % OF TARGET HEALTH, BY WEAPON</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="2"><line x1="0" y1="1" x2="16" y2="1" stroke={t.dim} strokeWidth="1.5" strokeDasharray={BEST_DASH} /></svg>BEST
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="8" height="12"><line x1="4" y1="0" x2="4" y2="12" stroke={t.dim} strokeWidth="1.5" strokeDasharray="3 2" /></svg>50% KILL
        </span>
        <span>· CLICK OR DRAG FOR TIME · RIGHT SLIDER: DISTANCE</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `40px minmax(0,1fr)${aside ? ' auto' : ''}`, columnGap: aside ? 14 : 8 }}>
        <div style={{ position: 'relative', height: PLOT_H, fontSize: 11, color: t.dimmer, textAlign: 'right' }}>
          {[1, 0.5, 0, -0.5, -1].map(f => (
            <span key={f} style={{ position: 'absolute', right: 0, top: `${(1 - f) * 50}%`, lineHeight: 0 }}>
              {f === 0 ? '0' : `${Math.abs(f) * 100}%`}
            </span>
          ))}
        </div>

        <div {...axis} aria-label={label} aria-valuetext={`${value} s`} className="cmp-plot" style={{
          position: 'relative', height: PLOT_H, minWidth: 0,
          cursor: dragging ? 'grabbing' : 'crosshair', touchAction: 'pan-y', userSelect: 'none',
        }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
               style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
            {GRID.flatMap(f => [1, -1].map(dir => (
              <line key={`${f}${dir}`} x1="0" x2={W} y1={py(f, dir)} y2={py(f, dir)}
                    stroke={t.rule} strokeOpacity={f === 1 ? 1 : 0.6} vectorEffect="non-scaling-stroke" />
            )))}
            {drawn.map(sd => sd.bands.map(b => (
              <path key={`${sd.key}${b.i}`} d={b.d} fill={sd.color} fillOpacity={b.shade}
                    stroke={sd.color} strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            )))}
            {drawn.filter(sd => sd.v).map(sd => (
              <g key={sd.key}>
                <path d={sd.best} fill="none" stroke={sd.color} strokeOpacity="0.8" strokeWidth="1"
                      strokeDasharray={BEST_DASH} vectorEffect="non-scaling-stroke" />
                <path d={sd.mean} fill="none" stroke={sd.color} strokeWidth="2" strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke" />
                {sd.kill != null && (
                  <line x1={px(sd.kill, xMax)} x2={px(sd.kill, xMax)} y1={MID} y2={py(1, sd.dir)}
                        stroke={sd.color} strokeWidth="1.5" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
                )}
              </g>
            ))}
            <line x1="0" x2={W} y1={MID} y2={MID} stroke={t.ruleStrong} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {hoverX != null && (
              <line x1={px(hoverX, xMax)} x2={px(hoverX, xMax)} y1="0" y2={H}
                    stroke={t.ink} strokeOpacity="0.3" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
            )}
            <line x1={px(value, xMax)} x2={px(value, xMax)} y1="0" y2={H}
                  stroke={t.accent2} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>

          {drawn.filter(sd => sd.kill != null).map(sd => (
            <div key={sd.key} style={{
              position: 'absolute', [sd.dir === 1 ? 'top' : 'bottom']: 2, pointerEvents: 'none',
              ...(sd.kill / xMax > 0.9 ? { right: `calc(${pct(xMax - sd.kill)} + 4px)` } : { left: `calc(${pct(sd.kill)} + 4px)` }),
              fontSize: 11, color: sd.color, whiteSpace: 'nowrap',
            }}>50%</div>
          ))}

          {/* Where the averages are at the chosen time (HTML so they stay round). */}
          {drawn.filter(sd => sd.now).map(sd => (
            <div key={sd.key} style={{
              position: 'absolute', left: pct(value), top: `${py(sd.now.mean / sd.hp, sd.dir) / H * 100}%`,
              width: 9, height: 9, marginLeft: -4.5, marginTop: -4.5, borderRadius: '50%',
              background: sd.color, boxShadow: `0 0 0 2px ${t.surface}`, pointerEvents: 'none',
            }} />
          ))}

          <div style={{
            position: 'absolute', left: pct(value), bottom: -8, width: 12, height: 16, marginLeft: -6,
            background: t.accent2, pointerEvents: 'none',
          }} />

          {hover && (
            <div style={{
              position: 'absolute', top: 30, pointerEvents: 'none', zIndex: 2,
              ...(hoverPct > 55 ? { right: `calc(${100 - hoverPct}% + 10px)` } : { left: `calc(${hoverPct}% + 10px)` }),
              background: t.bg, border: `1px solid ${t.ruleStrong}`, padding: '6px 10px',
              fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3, whiteSpace: 'nowrap',
            }}>
              <div style={{ color: t.dim, fontSize: 11, letterSpacing: '0.1em' }}>{hoverX} s</div>
              {hover.map(sd => (
                <React.Fragment key={sd.key}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', color: sd.color, marginTop: 3 }}>
                    <span style={{ fontSize: 11, letterSpacing: '0.1em' }}>{sd.dir === 1 ? '▲' : '▼'} {sd.label}</span>
                    {sd.r
                      ? <span style={{ marginLeft: 'auto', color: t.ink, fontWeight: 600 }}>
                          {f1(sd.r.mean)} / {sd.hp}
                          <span style={{ color: t.dim, fontWeight: 400 }}> · best {f1(sd.r.best)} · kill {Math.round(sd.r.kill * 100)}%</span>
                        </span>
                      : <span style={{ marginLeft: 'auto', color: t.dim }}>{sd.reason}</span>}
                  </div>
                  {sd.r && sd.weapons.length > 1 && sd.weapons.map((w, n) => (
                    <div key={w.i} style={{ display: 'flex', gap: 8, alignItems: 'center', color: t.dim, paddingLeft: 14 }}>
                      <span style={{ width: 10, height: 10, background: sd.color, opacity: w.shade + 0.1, flexShrink: 0 }} />
                      <span>{w.name}</span>
                      <span style={{ marginLeft: 'auto', paddingLeft: 12, color: t.ink }}>{f1(sd.r.parts[n])}</span>
                    </div>
                  ))}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {aside && <div style={{ height: PLOT_H, gridRow: 'span 3' }}>{aside}</div>}
        <AxisScale scale={scale} xMax={xMax} />
      </div>
    </div>
  );
}
