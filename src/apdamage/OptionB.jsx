import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  calcHeatDamage, calcKeDamage,
  tierColor, fmtDmg, shotsToKill,
  TIER_COLORS,
} from './damageLogic.js';

// Armor 0..23, AP ranges per mode
const B_ARMOR   = Array.from({ length: 24 }, (_, i) => i);
const B_AP_HEAT = Array.from({ length: 30 }, (_, i) => i + 1);
const B_AP_KE   = Array.from({ length: 24 }, (_, i) => i + 1);

function parseUrlParams() {
  const p = new URLSearchParams(window.location.search);
  const mode = p.get('mode') === 'KE' ? 'KE' : 'HEAT';
  const aps = p.get('aps')
    ? new Set(p.get('aps').split(',').map(Number).filter(n => !isNaN(n)))
    : new Set();
  const armors = p.get('armors')
    ? new Set(p.get('armors').split(',').map(Number).filter(n => !isNaN(n)))
    : new Set();
  return { mode, aps, armors };
}

const initial = parseUrlParams();

export function OptionB() {
  const [mode, setMode] = useState(initial.mode);
  const [maxRange, setMaxRange] = useState(2275);
  const [distance, setDistance] = useState(2275);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState([]);
  const [selectedAPs, setSelectedAPs] = useState(initial.aps);
  const [selectedArmors, setSelectedArmors] = useState(initial.armors);

  useEffect(() => {
    const p = new URLSearchParams();
    if (mode !== 'HEAT') p.set('mode', mode);
    if (selectedAPs.size)    p.set('aps',    [...selectedAPs].sort((a, b) => a - b).join(','));
    if (selectedArmors.size) p.set('armors', [...selectedArmors].sort((a, b) => a - b).join(','));
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }, [mode, selectedAPs, selectedArmors]);

  const calc = useCallback((ap, armor) => {
    if (mode === 'HEAT') return calcHeatDamage(ap, armor);
    return calcKeDamage(ap, armor, maxRange, distance);
  }, [mode, maxRange, distance]);

  const toggleAP = useCallback((ap) => setSelectedAPs(prev => {
    const next = new Set(prev);
    if (next.has(ap)) next.delete(ap); else next.add(ap);
    return next;
  }), []);

  const toggleArmor = useCallback((armor) => setSelectedArmors(prev => {
    const next = new Set(prev);
    if (next.has(armor)) next.delete(armor); else next.add(armor);
    return next;
  }), []);

  const apRange = mode === 'KE' ? B_AP_KE : B_AP_HEAT;
  const bonus = mode === 'KE' ? Math.floor((maxRange - distance) / 175) : 0;

  const handleModeSwitch = (m) => {
    setMode(m);
    setPinned([]);
    setHover(null);
    setSelectedAPs(new Set());
  };

  const hasTwoPins = pinned.length === 2;

  return (
    <div className="optB">
      <div className="optB-topbar">
        <div className="optB-title">
          <span className="optB-title-num">DMG</span>
          <span className="optB-title-name">DAMAGE INSPECTOR</span>
        </div>
        <div className="optB-modes">
          {['HEAT', 'KE'].map(m => (
            <button key={m} className={`optB-mode ${mode === m ? 'on' : ''}`} onClick={() => handleModeSwitch(m)}>
              <span className="optB-mode-dot" />{m}
            </button>
          ))}
        </div>
      </div>

      <div className="optB-body">
        <div className="optB-left">
          <BGrid
            calc={calc}
            apRange={apRange}
            hover={hover} setHover={setHover}
            pinned={pinned} setPinned={setPinned}
            selectedAPs={selectedAPs} toggleAP={toggleAP}
            selectedArmors={selectedArmors} toggleArmor={toggleArmor}
          />
          <BLegend />
        </div>

        <div className="optB-right">
          {mode === 'KE' && (
            <div className="optB-card optB-card-ke">
              <div className="optB-ke-sliders">
                <BSlider label="DISTANCE"  min={175} max={maxRange} step={175} value={distance} onChange={setDistance} />
                <BSlider label="MAX RANGE" min={1400} max={2275} step={175} value={maxRange} onChange={v => { setMaxRange(v); setDistance(prev => Math.min(prev, v)); }} />
              </div>
              <div className="optB-bonus-row">
                <span>RANGE BONUS</span>
                <span className="optB-bonus-num">+{bonus}<em> AP</em></span>
              </div>
            </div>
          )}

          {hasTwoPins ? (
            <>
              <ReadoutCard
                label="PINNED 1"
                active={pinned[0]}
                calc={calc}
                bonus={bonus}
                mode={mode}
              />
              <ComparisonBand
                dmg1={calc(pinned[0].ap, pinned[0].armor)}
                dmg2={calc(pinned[1].ap, pinned[1].armor)}
              />
              <ReadoutCard
                label="PINNED 2"
                active={pinned[1]}
                calc={calc}
                bonus={bonus}
                mode={mode}
              />
            </>
          ) : (
            <ReadoutCard
              label={pinned.length === 1 ? 'PINNED' : (hover ? 'HOVER' : 'PREVIEW')}
              active={pinned[0] || hover || { ap: 18, armor: 8 }}
              calc={calc}
              bonus={bonus}
              mode={mode}
            />
          )}

          <div className="optB-card optB-tip">
            <ul>
              <li>Hover any cell to inspect.</li>
              <li>Click to pin (up to 2).</li>
              <li>Row + column highlight on hover.</li>
              <li>Click header to filter columns/rows.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadoutCard({ label, active, calc, bonus, mode }) {
  const dmg = calc(active.ap, active.armor);
  const shots = shotsToKill(dmg);
  return (
    <div className="optB-card optB-readout">
      <div className="optB-card-h">
        {label}
        <span className="optB-coords">AP {active.ap} · ARMOR {active.armor}</span>
      </div>
      <div className="optB-dmg-row">
        <div className="optB-bigdmg" style={{ color: tierColor(dmg, 'tactical') }}>
          <span className="optB-bigdmg-num">{fmtDmg(dmg)}</span>
        </div>
        <div className="optB-stats">
          {mode === 'KE' && (
            <div className="optB-stat">
              <span>EFFECTIVE AP</span>
              <span className="v">{Math.min(active.ap + bonus, 30)}</span>
            </div>
          )}
          <div className="optB-stat">
            <span>SHOTS</span>
            <span className="v">{Number.isFinite(shots) ? shots : '—'}</span>
          </div>
        </div>
      </div>
      <ShotsBar dmg={dmg} />
    </div>
  );
}

function ComparisonBand({ dmg1, dmg2 }) {
  const pen1 = dmg1 > 0;
  const pen2 = dmg2 > 0;
  let text;
  if (!pen1 && !pen2) {
    text = 'BOTH: NO PENETRATION';
  } else if (!pen1) {
    text = 'PIN 2 PENETRATES · PIN 1 DOES NOT';
  } else if (!pen2) {
    text = 'PIN 1 PENETRATES · PIN 2 DOES NOT';
  } else {
    const s1 = shotsToKill(dmg1);
    const s2 = shotsToKill(dmg2);
    const diff = Math.abs(s1 - s2);
    if (s1 < s2) text = `PIN 1 KILLS ${diff} SHOT${diff !== 1 ? 'S' : ''} FASTER`;
    else if (s2 < s1) text = `PIN 2 KILLS ${diff} SHOT${diff !== 1 ? 'S' : ''} FASTER`;
    else text = 'EQUAL KILL SPEED';
  }
  return (
    <div className="optB-compare">
      {text}
    </div>
  );
}

function BSlider({ label, min, max, step, value, onChange }) {
  const v = Math.min(Math.max(value, min), max);
  const pct = ((v - min) / (max - min)) * 100;
  return (
    <div className="optB-slider">
      <div className="optB-slider-row">
        <span className="optB-slider-l">{label}</span>
        <span className="optB-slider-v">{v}<em>m</em></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ '--pct': `${pct}%` }} />
    </div>
  );
}

function BGrid({ calc, apRange, hover, setHover, pinned, setPinned, selectedAPs, toggleAP, selectedArmors, toggleArmor }) {
  const colCount = apRange.length;
  const hasAPSel = selectedAPs.size > 0;
  const hasArmorSel = selectedArmors.size > 0;

  const rows = useMemo(() =>
    B_ARMOR.map(armor => ({
      armor,
      cells: apRange.map(ap => ({ ap, dmg: calc(ap, armor) })),
    }))
  , [calc, apRange]);

  return (
    <div className="optB-grid" style={{ '--ap-cols': colCount }}>
      <div className="optB-axis-labels">
        <div className="optB-axis-y-label">ARMOR ↓</div>
        <div className="optB-axis-x-label">AP →</div>
      </div>
      <div className="optB-grid-header">
        <div className="optB-grid-corner"></div>
        {apRange.map(ap => {
          const isSel = selectedAPs.has(ap);
          const isDim = hasAPSel && !isSel;
          return (
            <div
              key={ap}
              className={`optB-h ${hover && hover.ap === ap ? 'hi' : ''} ${pinned.some(p => p.ap === ap) ? 'pin' : ''} ${isSel ? 'sel' : ''} ${isDim ? 'dim' : ''}`}
              onClick={() => toggleAP(ap)}
            >
              {ap}
            </div>
          );
        })}
      </div>
      <div className="optB-grid-body">
        {rows.map(({ armor, cells }) => {
          const isArmorSel = selectedArmors.has(armor);
          const isArmorDim = hasArmorSel && !isArmorSel;
          return (
            <div key={armor} className="optB-row">
              <div
                className={`optB-h optB-h-row ${hover && hover.armor === armor ? 'hi' : ''} ${pinned.some(p => p.armor === armor) ? 'pin' : ''} ${isArmorSel ? 'sel' : ''} ${isArmorDim ? 'dim' : ''}`}
                onClick={() => toggleArmor(armor)}
              >
                {armor}
              </div>
              {cells.map(({ ap, dmg }) => {
                const allActive = pinned.length > 0 ? pinned : (hover ? [hover] : []);
                const hi = allActive.some(p => p.ap === ap || p.armor === armor);
                const exact = allActive.some(p => p.ap === ap && p.armor === armor);
                const isDim = (hasAPSel && !selectedAPs.has(ap)) || (hasArmorSel && !selectedArmors.has(armor));
                return (
                  <div
                    key={ap}
                    className={`optB-cell ${hi ? 'hi' : ''} ${exact ? 'exact' : ''} ${isDim ? 'dim' : ''}`}
                    style={{ background: tierColor(dmg, 'tactical') }}
                    onMouseEnter={() => setHover({ ap, armor })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => {
                      const idx = pinned.findIndex(p => p.ap === ap && p.armor === armor);
                      if (idx !== -1) {
                        setPinned(prev => prev.filter((_, i) => i !== idx));
                      } else if (pinned.length < 2) {
                        setPinned(prev => [...prev, { ap, armor }]);
                      } else {
                        setPinned(prev => [prev[1], { ap, armor }]);
                      }
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShotsBar({ dmg }) {
  if (dmg <= 0) {
    return (
      <div className="optB-shotsbar optB-shotsbar-nopen">
        <span>NO PENETRATION</span>
      </div>
    );
  }
  const segs = [];
  let remaining = 10;
  let shot = 0;
  while (remaining > 0 && shot < 30) {
    const take = Math.min(dmg, remaining);
    segs.push({ pct: (take / 10) * 100, full: take >= dmg });
    remaining -= dmg;
    shot += 1;
  }
  return (
    <div className="optB-shotsbar">
      <div className="optB-shotsbar-track">
        {segs.map((s, i) => (
          <div key={i} className={`optB-shotsbar-seg ${s.full ? '' : 'partial'}`} style={{ width: `${s.pct}%` }}>
            <span className="optB-shotsbar-num">{i + 1}</span>
          </div>
        ))}
      </div>
      <div className="optB-shotsbar-foot">
        <span>10 HP TARGET</span>
        <span>{segs.length} {segs.length === 1 ? 'SHOT' : 'SHOTS'}</span>
      </div>
    </div>
  );
}

function BLegend() {
  const items = [
    { t: 8, l: '1 shot' },
    { t: 7, l: '2 shots' },
    { t: 6, l: '3 shots' },
    { t: 5, l: '4 shots' },
    { t: 4, l: '5 shots' },
    { t: 3, l: '7 shots' },
    { t: 2, l: '10 shots' },
    { t: 0, l: 'no pen' },
  ];
  return (
    <div className="optB-legend">
      <span className="optB-legend-l">SHOTS TO KILL · 10 HP</span>
      <div className="optB-legend-bar">
        {items.map(i => (
          <div key={i.t} className="optB-legend-item" style={{ background: TIER_COLORS.tactical[i.t] }}>
            {i.l}
          </div>
        ))}
      </div>
    </div>
  );
}
