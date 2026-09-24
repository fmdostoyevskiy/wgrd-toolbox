import React, { useRef, useState } from 'react';
import { BROWSER_TOKENS } from '../constants/theme.js';

const W = 800, H = 200;
const PLOT_H = 220;
const Y_TICKS = [100, 75, 50, 25, 0];
const BAND_DASH = '2 3';

const px = (x, xMax) => (x / xMax * W).toFixed(1);
const py = f => (H - f * H).toFixed(1);

// Sample fn over 0..xMax into runs of consecutive points where it's ok.
function sampleRuns(fn, xMax, samples) {
  const runs = [];
  let run = null;
  for (let i = 0; i <= samples; i++) {
    const x = i / samples * xMax;
    const r = fn(x);
    if (!r.ok) { run = null; continue; }
    if (!run) runs.push(run = []);
    run.push({ x, r });
  }
  return runs;
}

const linePath = (runs, xMax, get) => runs
  .map(run => run.map((p, i) => `${i ? 'L' : 'M'}${px(p.x, xMax)} ${py(get(p.r))}`).join(' '))
  .join(' ');

// The area between lo and hi, one closed shape per run.
const bandPath = (runs, xMax) => runs
  .map(run => [
    ...run.map((p, i) => `${i ? 'L' : 'M'}${px(p.x, xMax)} ${py(p.r.hi)}`),
    ...run.slice().reverse().map(p => `L${px(p.x, xMax)} ${py(p.r.lo)}`),
    'Z',
  ].join(' '))
  .join(' ');

const LineKey = ({ color, dash, width = 16 }) => (
  <svg width={width} height="2" style={{ flexShrink: 0 }}>
    <line x1="0" y1="1" x2={width} y2="1" stroke={color} strokeWidth="2" strokeDasharray={dash} />
  </svg>
);

const hitPct = r => `${r.hit}%`;

// A 0–100% value per series along an x axis (distance, time), doubling as the
// control for x: click or drag on the plot, or use the arrow keys.
// series:    [{ key, name, color, dash, fn: x → { ok, frac, reason, lo?, hi?, … } }]
//            lo and/or hi (fractions) draw dotted lines around it, with the
//            range between them shaded when both are given.
// value:     the current x; onChange(x) snaps to `snap`, Shift+arrows and
//            PageUp/Down move by `bigStep`, x never goes below xMin.
// scale:     { ticks: [{ d, major }], labels: [{ d, text }] } along the axis.
// caption:   what's plotted; a string or a node (e.g. a view switch).
// valueText: r → the tooltip value when r.ok (default: the hit chance).
// aside:     a node drawn right of the plot at its height (e.g. a
//            VerticalSlider for a second input); readout replaces the
//            "value unit" text in the top right.
export function SeriesChart({
  label, unit, xMax, xMin = 0, value, onChange, snap, bigStep, scale, series,
  caption, valueText = hitPct, samples = 200, aside, readout,
}) {
  const t = BROWSER_TOKENS;
  const plotRef = useRef(null);
  const [hoverX, setHoverX] = useState(null);
  const [dragging, setDragging] = useState(false);

  const pct = x => `${x / xMax * 100}%`;
  const clamp = x => Math.min(xMax, Math.max(xMin, x));
  const toX = e => {
    const rect = plotRef.current.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    return clamp(Math.round(f * xMax / snap) * snap);
  };

  const onPointerDown = e => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    onChange(toX(e));
  };
  const onPointerMove = e => {
    const x = toX(e);
    setHoverX(x);
    if (dragging) onChange(x);
  };
  const onKeyDown = e => {
    const step = e.shiftKey ? bigStep : snap;
    const next = {
      ArrowLeft: value - step, ArrowDown: value - step,
      ArrowRight: value + step, ArrowUp: value + step,
      PageDown: value - bigStep, PageUp: value + bigStep,
      Home: xMin, End: xMax,
    }[e.key];
    if (next == null) return;
    e.preventDefault();
    onChange(clamp(next));
  };

  const drawn = series.map(sr => ({ ...sr, runs: sampleRuns(sr.fn, xMax, samples) }));
  const at = series.map(sr => ({ ...sr, r: sr.fn(value) }));
  const hover = hoverX != null && !dragging ? series.map(sr => ({ ...sr, r: sr.fn(hoverX) })) : null;
  const hoverPct = hoverX != null ? hoverX / xMax * 100 : 0;

  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.rule}`, padding: '16px 20px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', color: t.dim }}>{label}</div>
        <div style={{ fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{readout ?? `${value} ${unit}`}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', letterSpacing: '0.14em', color: t.dimmer, fontSize: 11 }}>
          {caption}<span>· CLICK OR DRAG TO SET</span>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {series.map(sr => (
            <span key={sr.key} style={{ display: 'flex', alignItems: 'center', gap: 6, color: t.dim }}>
              <LineKey color={sr.color} dash={sr.dash} />{sr.name}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `40px minmax(0,1fr)${aside ? ' auto' : ''}`, columnGap: aside ? 14 : 8 }}>
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          fontSize: 11, color: t.dimmer, textAlign: 'right', height: PLOT_H,
        }}>
          {Y_TICKS.map(v => <span key={v} style={{ lineHeight: 0 }}>{v}%</span>)}
        </div>

        <div
          ref={plotRef}
          role="slider" tabIndex={0}
          aria-label={label} aria-valuemin={xMin} aria-valuemax={xMax} aria-valuenow={value}
          aria-valuetext={`${value} ${unit}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          onPointerLeave={() => setHoverX(null)}
          onKeyDown={onKeyDown}
          className="cmp-plot"
          style={{
            position: 'relative', height: PLOT_H, minWidth: 0,
            cursor: dragging ? 'grabbing' : 'crosshair', touchAction: 'pan-y', userSelect: 'none',
          }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
               style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
            {Y_TICKS.map(v => (
              <line key={v} x1="0" x2={W} y1={H - v / 100 * H} y2={H - v / 100 * H}
                    stroke={v === 0 ? t.ruleStrong : t.rule} vectorEffect="non-scaling-stroke" />
            ))}
            {hover && (
              <line x1={px(hoverX, xMax)} x2={px(hoverX, xMax)} y1="0" y2={H}
                    stroke={t.ink} strokeOpacity="0.3" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
            )}
            <line x1={px(value, xMax)} x2={px(value, xMax)} y1="0" y2={H}
                  stroke={t.accent2} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {drawn.map(sr => {
              const first = sr.runs[0]?.[0].r ?? {};
              const bounds = ['lo', 'hi'].filter(k => first[k] != null);
              return bounds.length > 0 && (
                <g key={`${sr.key}-band`}>
                  {bounds.length === 2 && <path d={bandPath(sr.runs, xMax)} fill={sr.color} fillOpacity="0.1" stroke="none" />}
                  {bounds.map(k => (
                    <path key={k} d={linePath(sr.runs, xMax, r => r[k])} fill="none" stroke={sr.color}
                          strokeOpacity="0.8" strokeWidth="1" strokeDasharray={BAND_DASH}
                          vectorEffect="non-scaling-stroke" />
                  ))}
                </g>
              );
            })}
            {drawn.map(sr => (
              <path key={sr.key} d={linePath(sr.runs, xMax, r => r.frac)} fill="none" stroke={sr.color}
                    strokeWidth="2" strokeDasharray={sr.dash} strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke" />
            ))}
          </svg>

          {/* Markers where each line crosses the current value (HTML so they
              stay round in the stretched SVG). */}
          {at.filter(sr => sr.r.ok).map(sr => (
            <div key={sr.key} style={{
              position: 'absolute', left: pct(value), top: `${(1 - sr.r.frac) * 100}%`,
              width: 9, height: 9, marginLeft: -4.5, marginTop: -4.5, borderRadius: '50%',
              background: sr.color, boxShadow: `0 0 0 2px ${t.surface}`, pointerEvents: 'none',
            }} />
          ))}

          {/* Handle on the axis, like a slider thumb. */}
          <div style={{
            position: 'absolute', left: pct(value), bottom: -8, width: 12, height: 16, marginLeft: -6,
            background: t.accent2, pointerEvents: 'none',
          }} />

          {hover && (
            <div style={{
              position: 'absolute', top: 8, pointerEvents: 'none', zIndex: 2,
              ...(hoverPct > 60 ? { right: `calc(${100 - hoverPct}% + 10px)` } : { left: `calc(${hoverPct}% + 10px)` }),
              background: t.bg, border: `1px solid ${t.ruleStrong}`, padding: '6px 10px',
              fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4, whiteSpace: 'nowrap',
            }}>
              <div style={{ color: t.dim, fontSize: 11, letterSpacing: '0.1em' }}>{hoverX} {unit}</div>
              {hover.map(sr => (
                <div key={sr.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <LineKey color={sr.color} dash={sr.dash} width={12} />
                  <span style={{ color: t.ink, fontWeight: 600, minWidth: 34 }}>{sr.r.ok ? valueText(sr.r) : '—'}</span>
                  <span style={{ color: t.dim }}>{sr.r.ok ? sr.name : sr.r.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {aside && <div style={{ height: PLOT_H, gridRow: 'span 3' }}>{aside}</div>}

        {/* Axis scale */}
        <div />
        <div style={{ position: 'relative', height: 8, marginTop: 10 }}>
          {scale.ticks.map(tk => (
            <div key={tk.d} style={{
              position: 'absolute', top: 0, left: pct(tk.d),
              width: 1, height: tk.major ? 8 : 4, background: tk.major ? t.dim : t.ruleStrong,
            }} />
          ))}
        </div>
        <div />
        <div style={{ position: 'relative', height: 14, marginTop: 4, fontSize: 11, color: t.dimmer }}>
          {scale.labels.map(l => (
            <span key={l.d} style={{
              position: 'absolute', left: pct(l.d), whiteSpace: 'nowrap',
              transform: `translateX(${l.d === 0 ? '0' : l.d === xMax ? '-100%' : '-50%'})`,
            }}>{l.text}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// A vertical slider from min (bottom) to max (top) with a tick scale, for a
// second input next to a chart. Click or drag, or use the arrow keys (Shift
// and PageUp/Down for bigStep). scale: { ticks: [{ d, major }], labels: [{ d, text }] }.
export function VerticalSlider({ label, unit, min = 0, max, value, onChange, snap, bigStep, scale }) {
  const t = BROWSER_TOKENS;
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);
  const clamp = v => Math.min(max, Math.max(min, v));
  const pct = v => `${(v - min) / (max - min) * 100}%`;
  const toV = e => {
    const rect = ref.current.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, 1 - (e.clientY - rect.top) / rect.height));
    return clamp(Math.round((min + f * (max - min)) / snap) * snap);
  };
  const onKeyDown = e => {
    const step = e.shiftKey ? bigStep : snap;
    const next = {
      ArrowDown: value - step, ArrowLeft: value - step,
      ArrowUp: value + step, ArrowRight: value + step,
      PageDown: value - bigStep, PageUp: value + bigStep,
      Home: min, End: max,
    }[e.key];
    if (next == null) return;
    e.preventDefault();
    onChange(clamp(next));
  };

  return (
    <div
      ref={ref}
      role="slider" tabIndex={0} aria-orientation="vertical"
      aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value}
      aria-valuetext={`${value} ${unit}`}
      onPointerDown={e => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        onChange(toV(e));
      }}
      onPointerMove={e => { if (dragging) onChange(toV(e)); }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={onKeyDown}
      className="cmp-plot"
      title={`${label}: click or drag`}
      style={{
        position: 'relative', height: '100%', width: 64, fontSize: 11, color: t.dimmer,
        cursor: dragging ? 'grabbing' : 'ns-resize', touchAction: 'none', userSelect: 'none',
      }}>
      <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: t.ruleStrong }} />
      <div style={{ position: 'absolute', left: 7, bottom: 0, height: pct(value), width: 2, background: t.accent2 }} />
      {scale.ticks.map(tk => (
        <div key={tk.d} style={{
          position: 'absolute', left: 13, bottom: pct(tk.d), width: tk.major ? 8 : 4, height: 1,
          background: tk.major ? t.dim : t.ruleStrong,
        }} />
      ))}
      {scale.labels.map(l => (
        <span key={l.d} style={{
          position: 'absolute', left: 25, bottom: pct(l.d), whiteSpace: 'nowrap', lineHeight: 1,
          transform: `translateY(${l.d === min ? '0' : l.d === max ? '100%' : '50%'})`,
        }}>{l.text}</span>
      ))}
      <div style={{
        position: 'absolute', left: 0, bottom: pct(value), width: 16, height: 12, marginBottom: -6,
        background: t.accent2, pointerEvents: 'none',
      }} />
    </div>
  );
}

// Hit chance (or another 0–100% value) against distance, as the distance
// control: snaps to 25 m, Shift+arrows move one 175 m hex.
export function DistanceChart({ series, maxD, distance, scale, onChange, caption = 'HIT CHANCE BY DISTANCE', valueText }) {
  return (
    <SeriesChart label="DISTANCE" unit="m" xMax={maxD} value={distance} onChange={onChange}
      snap={25} bigStep={175} scale={scale} series={series} caption={caption} valueText={valueText} />
  );
}
