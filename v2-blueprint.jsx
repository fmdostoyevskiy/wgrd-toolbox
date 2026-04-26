// V2 — Dark Schematic (primary, themeable)
// Receives a `theme` prop so the same card can render in multiple palettes.
// Also owns all the spec fixes: availability pill on each vet button,
// four-number fire-rate (aim / salvo len / salvo reload / reload),
// accel/max with no units, HE hidden on ATGM, AP hidden on BOMB,
// weapon tags, no § numbers, no "per facing", no W1/W2 prefix.

const UNIT_TYPE_LABEL = {
  helicopter: 'HEL',
  vehicle: 'TNK',
  infantry: 'INF',
  plane: 'AIR',
};

const V2_THEMES = {
  signal: {
    name: 'Signal Red',
    bg: '#130608', grid: 'rgba(0,0,0,0)', paper: 'rgba(255,255,255,0.02)',
    ink: '#f0e6e6', dim: '#7d6a6a', rule: '#241c1e', ruleStrong: '#3d2e32',
    accent: '#ff3d48', blueprint: '#ff8a6b', ok: '#e8a852',
  },
  tactical: {
    name: 'Tactical Blue',
    bg: '#080e18', grid: 'rgba(0,0,0,0)', paper: 'rgba(255,255,255,0.02)',
    ink: '#d8e8f8', dim: '#5a7090', rule: '#101e30', ruleStrong: '#1e3450',
    accent: '#4d9fff', blueprint: '#7fd4ff', ok: '#72d6a8',
  },
};

function V2Card({ unit, vetIdx, setVetIdx, density = 'comfortable', theme = 'graphite' }) {
  const s = V2_THEMES[theme] || V2_THEMES.graphite;
  s.font = 'var(--wrd-mono, "JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace)';
  const pad = density === 'compact' ? 14 : 18;
  const rowPad = density === 'compact' ? 2 : 3;
  const vet = VET_TIERS[vetIdx];

  const DotRow = ({ label, value, accent }) => (
    <div className="dr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      fontSize: 13, padding: `${rowPad}px 0`, borderBottom: `1px solid ${s.rule}` }}>
      <span style={{ color: s.dim, letterSpacing: '0.04em',
        textTransform: 'uppercase', fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      <span style={{ color: accent || s.ink, fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap', flexShrink: 0 }}>{value}</span>
    </div>
  );

  const SectionHeader = ({ title, note }) => (
    <div style={{ margin: '14px 0 2px', display: 'flex', alignItems: 'baseline',
      gap: 8, borderBottom: `1.5px solid ${s.ruleStrong}`, paddingBottom: 4 }}>
      <div style={{ fontSize: 12, color: s.ink, letterSpacing: '0.16em',
        textTransform: 'uppercase', fontWeight: 600 }}>{title}</div>
      {note && <div style={{ flex: 1, textAlign: 'right', fontSize: 10,
        color: s.dim, letterSpacing: '0.06em' }}>{note}</div>}
    </div>
  );

  const mobRows = [
    unit.mobility?.speed != null && ['Speed', unit.mobility.speed + ' km/h'],
    unit.mobility?.forest != null && ['Forest', unit.mobility.forest + ' km/h'],
    unit.mobility?.road != null && ['Road', unit.mobility.road + ' km/h'],
    unit.mobility?.swim != null && ['Amphibious', unit.mobility.swim + ' km/h'],
    unit.mobility?.autonomy != null && ['Autonomy', unit.mobility.autonomy + ' s'],
    unit.mobility?.fuel != null && ['Fuel', unit.mobility.fuel + ' L'],
    unit.mobility?.altitude != null && ['Service', unit.mobility.altitude + ' m'],
    unit.mobility?.turnRadius != null && ['Turn radius', unit.mobility.turnRadius],
  ].filter(Boolean);

  const opticsRows = [
    unit.optics?.stealth != null && ['Stealth (ground)', unit.optics.stealth + ' / 4'],
    unit.optics?.optics != null && ['Optics (ground)', unit.optics.optics + ' / 4'],
    unit.optics?.airStealth != null && ['Stealth (air)', unit.optics.airStealth + ' / 4'],
    unit.optics?.airOptics != null && ['Optics (air)', unit.optics.airOptics + ' / 4'],
  ].filter(Boolean);

  const typeTag = UNIT_TYPE_LABEL[unit.type] || unit.type.toUpperCase();

  return (
    <div style={{
      background: s.bg, color: s.ink, fontFamily: s.font,
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      fontSize: 13, overflow: 'hidden',

    }}>
      {/* Title block */}
      <div style={{ padding: `${pad}px ${pad}px 0`, flexShrink: 0 }}>
        <div style={{ border: `1.5px solid ${s.ruleStrong}`, padding: '10px 14px',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
          background: s.paper }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: s.dim, letterSpacing: '0.16em' }}>
              DWG. № {typeTag}-{unit.id.toUpperCase()}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600,
              letterSpacing: '-0.01em', marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {unit.name}
            </div>
            <div style={{ fontSize: 11, color: s.dim, marginTop: 3,
              letterSpacing: '0.08em' }}>
              {typeTag} · {unit.nation}
              {unit.general.era && ` · ${unit.general.era}`}
            </div>
          </div>
          <div style={{ borderLeft: `1px solid ${s.ruleStrong}`, paddingLeft: 12,
            textAlign: 'right',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'center', minWidth: 60 }}>
            <div style={{ fontSize: 26, color: s.accent,
              fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {unit.cost}<span style={{ fontSize: 12, marginLeft: 2 }}>pt</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `4px ${pad}px ${pad}px` }}>
        {/* Vet row with per-tier availability on the bottom of each button */}
        <div style={{ margin: '10px 0 2px', display: 'flex',
          alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: s.dim, letterSpacing: '0.14em',
            textTransform: 'uppercase' }}>Vet</span>
          <div style={{ flex: 1, display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            border: `1px solid ${s.rule}` }}>
            {VET_TIERS.map((t, i) => {
              const active = i === vetIdx;
              return (
                <button key={t.id} onClick={() => setVetIdx(i)} style={{
                  background: active ? s.accent : 'transparent',
                  border: 'none',
                  borderLeft: i === 0 ? 'none' : `1px solid ${s.rule}`,
                  color: active ? s.bg : s.dim,
                  padding: '4px 0 3px', fontFamily: 'inherit',
                  cursor: 'pointer', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 0, lineHeight: 1.05,
                }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.14em',
                    fontWeight: active ? 600 : 400 }}>{t.label}</span>
                  <span style={{ fontSize: 9, opacity: active ? 0.85 : 0.65,
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '0.02em', marginTop: 1 }}>
                    ×{unit.general.avail[i]}
                  </span>
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 10, color: s.dim,
            fontVariantNumeric: 'tabular-nums', minWidth: 38,
            textAlign: 'right' }}>
            acc {vet.accMod >= 0 ? '+' : ''}{vet.accMod}%
          </span>
        </div>

        <SectionHeader title="General" />
        <div className="sr">
          <DotRow label="Availability" value={`×${unit.general.avail[vetIdx]}`} accent={s.accent} />
          <DotRow label="Health" value={unit.general.health} />
          <DotRow label="Size" value={unit.general.size} />
          {unit.general.training && <DotRow label="Training" value={unit.general.training} />}
          {unit.general.ecm != null && <DotRow label="ECM" value={unit.general.ecm + '%'} />}
        </div>

        {mobRows.length > 0 && (<>
          <SectionHeader title="Mobility" />
          <div className="sr">
            {mobRows.map(([l, v]) => <DotRow key={l} label={l} value={v} />)}
          </div>
        </>)}

        {opticsRows.length > 0 && (<>
          <SectionHeader title="Optics / Stealth" />
          <div className="sr">
            {opticsRows.map(([l, v]) => <DotRow key={l} label={l} value={v} />)}
          </div>
        </>)}

        {unit.armor && (<>
          <SectionHeader title="Armor" />
          <ArmorCells armor={unit.armor} s={s} />
        </>)}

        {unit.weapons?.length > 0 && (<>
          <SectionHeader title="Armament" />
          {unit.weapons.map((w, i) => (
            <WeaponBlock key={i} w={w} vet={vet} s={s} />
          ))}
        </>)}
      </div>
    </div>
  );
}

function ArmorCells({ armor, s }) {
  const Cell = ({ label, v }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 3 }}>
      <div style={{ fontSize: 9.5, color: s.dim, letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ border: `1.5px solid ${s.accent}`,
        background: `color-mix(in srgb, ${s.accent} 6%, transparent)`,
        padding: '4px 12px',
        minWidth: 40, textAlign: 'center', fontSize: 16,
        color: s.ink, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
    </div>
  );
  return (
    <div style={{ padding: '8px 0 4px', display: 'grid',
      gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Cell label="FRONT ↑" v={armor.front} />
      <Cell label="SIDE →" v={armor.side} />
      <Cell label="REAR ↓" v={armor.rear} />
      <Cell label="TOP ◉" v={armor.top} />
    </div>
  );
}

function WeaponBlock({ w, vet, s }) {
  const DotRow = ({ label, value, accent }) => (
    <div className="dr" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      fontSize: 12, padding: '2px 0', borderBottom: `1px solid ${s.rule}` }}>
      <span style={{ color: s.dim, letterSpacing: '0.04em',
        textTransform: 'uppercase', fontSize: 10.5, whiteSpace: 'nowrap', flexShrink: 0 }}>{label}</span>
      
      <span style={{ color: accent || s.ink, fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap', flexShrink: 0 }}>{value}</span>
    </div>
  );

  // Damage rules:
  //   - ATGM: HE is meaningless → only AP (with kind)
  //   - BOMB / HE: AP is meaningless → only HE
  //   - Otherwise: HE always, AP only when > 0
  const isATGM = w.type === 'ATGM';
  const isBomb = w.type === 'BOMB';
  let damage;
  const apTag = w.apKind ? ` ${w.apKind}` : '';
  if (isATGM) {
    damage = w.ap != null ? `${w.ap}${apTag}` : '—';
  } else if (isBomb) {
    damage = `${w.he} HE`;
  } else if (w.ap && w.ap > 0) {
    damage = `${w.he} HE · ${w.ap}${apTag}`;
  } else {
    damage = `${w.he} HE`;
  }

  const range = w.rngGround == null ? '—'
    : w.rngGroundMin
      ? `${w.rngGroundMin} – ${w.rngGround} m`
      : `${w.rngGround} m`;

  return (
    <div style={{ margin: '10px 0 12px',
      border: `1px solid ${s.rule}`, background: s.paper }}>
      <div style={{ padding: '8px 12px', display: 'flex',
        justifyContent: 'space-between', alignItems: 'baseline', gap: 8,
        borderBottom: `1px solid ${s.rule}`, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, minWidth: 0,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {w.name}
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {w.tags?.map(tag => (
            <span key={tag} style={{ fontSize: 9.5, color: s.ok,
              border: `1px solid ${s.ok}`, padding: '1px 5px',
              letterSpacing: '0.08em' }}>[{tag}]</span>
          ))}
          <span style={{ fontSize: 9.5, color: s.blueprint,
            border: `1px solid ${s.blueprint}`, padding: '1px 5px',
            letterSpacing: '0.08em' }}>[{w.type}]</span>
        </div>
      </div>
      <div className="sr" style={{ padding: '6px 12px 8px' }}>
        <DotRow label="Damage" value={damage} />
        <DotRow label="Suppression" value={w.supp} />
        <DotRow label="Accuracy" value={fmt.acc(w.acc, vet.accMod)} accent={s.ok} />
        {w.stab != null && <DotRow label="Stabilizer" value={w.stab + '%'} />}
        <DotRow label="Range" value={range} />
        {w.rngHeli && <DotRow label="Range (heli)" value={w.rngHeli + ' m'} />}
        <DotRow label="Ammo" value={w.ammo} />
        <DotRow label={`Salvo × ${w.salvo}`}
          value={w.salvoLen > 0 ? `${w.salvoLen}s burst` : '—'} />
        <DotRow label="Aim time" value={w.shot + ' s'} />
        {w.salvoRload > 0 &&
          <DotRow label="Shot reload" value={w.salvoRload + ' s'} />}
        {w.rload > 0 &&
          <DotRow label="Salvo reload" value={w.rload + ' s'} />}
        {w.accel != null && w.spd != null && (
          <DotRow label="Accel / Max"
            value={`${w.accel} / ${w.spd}`} accent={s.blueprint} />
        )}
      </div>
    </div>
  );
}

window.V2Card = V2Card;
window.V2_THEMES = V2_THEMES;
