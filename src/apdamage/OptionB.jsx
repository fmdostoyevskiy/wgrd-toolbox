import { useState, useMemo, useCallback } from 'react';
import {
  calcHeatDamage, calcKeDamage,
  tierColor, fmtDmg, shotsToKill,
  TIER_COLORS,
} from './damageLogic.js';

// Armor 0..23, AP ranges per mode
const B_ARMOR   = Array.from({ length: 24 }, (_, i) => i);
const B_AP_HEAT = Array.from({ length: 30 }, (_, i) => i + 1);
const B_AP_KE   = Array.from({ length: 24 }, (_, i) => i + 1);

export function OptionB() {
  const [mode, setMode] = useState('HEAT');
  const [maxRange, setMaxRange] = useState(2275);
  const [distance, setDistance] = useState(2275);
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [selectedAPs, setSelectedAPs] = useState(new Set());
  const [selectedArmors, setSelectedArmors] = useState(new Set());

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
  const active = pinned || hover || { ap: 18, armor: 8 };
  const dmg = calc(active.ap, active.armor);
  const shots = shotsToKill(dmg);
  const bonus = mode === 'KE' ? Math.floor((maxRange - distance) / 175) : 0;

  const handleModeSwitch = (m) => {
    setMode(m);
    setPinned(null);
    setHover(null);
    setSelectedAPs(new Set());
    setSelectedArmors(new Set());
  };

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
              <div className="optB-card-h">RANGE PARAMETERS</div>
              <BSlider label="DISTANCE"  min={175} max={2275} step={175} value={distance} onChange={setDistance} />
              <BSlider label="MAX RANGE" min={175} max={2275} step={175} value={maxRange} onChange={setMaxRange} />
              <div className="optB-bonus-row">
                <span>RANGE BONUS</span>
                <span className="optB-bonus-num">+{bonus}<em> AP</em></span>
              </div>
            </div>
          )}

          <div className="optB-card optB-readout">
            <div className="optB-card-h">
              {pinned ? 'PINNED' : (hover ? 'HOVER' : 'PREVIEW')}
              <span className="optB-coords">AP {active.ap} · ARMOR {active.armor}</span>
            </div>
            <div className="optB-bigdmg" style={{ color: tierColor(dmg, 'tactical') }}>
              <span className="optB-bigdmg-num">{fmtDmg(dmg)}</span>
              <span className="optB-bigdmg-label">DAMAGE</span>
            </div>
            <div className="optB-stats">
              {mode === 'KE' && (
                <div className="optB-stat">
                  <span>EFFECTIVE AP</span>
                  <span className="v">{Math.min(active.ap + bonus, 30)}</span>
                </div>
              )}
              <div className="optB-stat">
                <span>RESULT</span>
                <span className="v">{dmg <= 0 ? 'NO PENETRATION' : `${fmtDmg(dmg)} HP/SHOT`}</span>
              </div>
              <div className="optB-stat">
                <span>SHOTS · 10 HP</span>
                <span className="v">{Number.isFinite(shots) ? shots : '—'}</span>
              </div>
            </div>
            <ShotsBar dmg={dmg} />
          </div>

          <div className="optB-card optB-tip">
            <div className="optB-card-h">USAGE</div>
            <ul>
              <li>Hover any cell to inspect.</li>
              <li>Click to pin; click again to unpin.</li>
              <li>Row + column highlight on hover.</li>
              <li>Click AP/Armor header to filter columns/rows.</li>
            </ul>
          </div>
        </div>
      </div>
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
              className={`optB-h ${hover && hover.ap === ap ? 'hi' : ''} ${pinned && pinned.ap === ap ? 'pin' : ''} ${isSel ? 'sel' : ''} ${isDim ? 'dim' : ''}`}
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
                className={`optB-h optB-h-row ${hover && hover.armor === armor ? 'hi' : ''} ${pinned && pinned.armor === armor ? 'pin' : ''} ${isArmorSel ? 'sel' : ''} ${isArmorDim ? 'dim' : ''}`}
                onClick={() => toggleArmor(armor)}
              >
                {armor}
              </div>
              {cells.map(({ ap, dmg }) => {
                const a = pinned || hover;
                const hi = a && (a.ap === ap || a.armor === armor);
                const exact = a && a.ap === ap && a.armor === armor;
                const isDim = (hasAPSel && !selectedAPs.has(ap)) || (hasArmorSel && !selectedArmors.has(armor));
                return (
                  <div
                    key={ap}
                    className={`optB-cell ${hi ? 'hi' : ''} ${exact ? 'exact' : ''} ${isDim ? 'dim' : ''}`}
                    style={{ background: tierColor(dmg, 'tactical') }}
                    onMouseEnter={() => setHover({ ap, armor })}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => {
                      if (pinned && pinned.ap === ap && pinned.armor === armor) setPinned(null);
                      else setPinned({ ap, armor });
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
