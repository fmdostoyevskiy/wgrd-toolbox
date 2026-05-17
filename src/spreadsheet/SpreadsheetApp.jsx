import { useState, useMemo, useEffect, useCallback, Fragment } from 'react';
import { NATION_CODE_MAP, NATION_FLAG_MAP, sideOf } from '@units-core';
import { CATEGORIES } from './categories.js';

const BASE = import.meta.env.BASE_URL;

// Column type sets for repeated type checks
const BOOL_TYPES        = new Set(['bool', 'bool-good', 'bool-plain']);
const TEXT_FILTER_TYPES  = new Set(['text', 'nation', 'bool', 'bool-good', 'bool-plain']);

async function fetchJson(url) {
  const buf  = await fetch(url).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); });
  const head = new Uint8Array(buf, 0, 2);
  const utf16 = head[0] === 0xFF && head[1] === 0xFE;
  const text  = utf16
    ? new TextDecoder('utf-16le').decode(buf).replace(/^﻿/, '')
    : new TextDecoder('utf-8').decode(buf);
  return JSON.parse(text);
}

// ---------- presets ----------
function isPresetActive(preset, filters) {
  return Object.entries(preset.filters).every(([key, val]) => {
    const f = filters[key];
    if (!f) return false;
    if (val.text !== undefined) return f.text === val.text;
    if (val.min !== undefined && f.min !== val.min) return false;
    if (val.max !== undefined && f.max !== val.max) return false;
    return true;
  });
}

// ---------- heatmap ----------
function buildHeatmap(rows, columns) {
  const map = {};
  columns.forEach(col => {
    if (!col.heat) return;
    const vals = rows.map(r => r[col.key]).filter(v => v !== null && v !== undefined);
    if (!vals.length) return;
    const min = Math.min(...vals), max = Math.max(...vals);
    map[col.key] = { min, max, dir: col.heat };
  });
  return map;
}

function heatColor(val, stats, intensity) {
  if (val === null || val === undefined || !stats) return null;
  const { min, max, dir } = stats;
  if (min === max) return null;
  let t = (val - min) / (max - min);
  if (dir === 'low') t = 1 - t;
  const alpha = 0.22 * intensity;
  if (t < 0.5) {
    const k = t * 2;
    return `rgba(${180},${Math.round(80 + k * 70)},${Math.round(80 - k * 20)},${alpha})`;
  } else {
    const k = (t - 0.5) * 2;
    return `rgba(${Math.round(180 - k * 70)},${Math.round(150 + k * 40)},${Math.round(60 + k * 40)},${alpha})`;
  }
}

// ---------- fmt ----------
function fmt(val, col) {
  if (val === null || val === undefined || val === '') return <span className="muted">–</span>;
  if (BOOL_TYPES.has(col.type)) {
    return val ? 'Y' : 'N';
  }
  if (col.type === 'pct') return `${val}%`;
  if (col.type === 'num') return Number.isInteger(val) ? val.toLocaleString() : String(val);
  return val;
}

// ---------- TopBar ----------
function TopBar({ label, search, setSearch, total, shown, coalFilter, setCoalFilter, variant, setVariant, isWeapon, presets, filters, onPreset }) {
  return (
    <div className="topbar">
      <a href={BASE} className="brand">{label} <span className="slash">/</span><span className="sub">WRD</span></a>
      {!isWeapon && (
        <>
          <button className={'topbar-btn' + (coalFilter === 'all' ? ' active' : '')} onClick={() => setCoalFilter('all')}>ALL</button>
          <button
            className={'topbar-btn' + (coalFilter === 'tactical' ? ' active' : '')}
            onClick={() => setCoalFilter('tactical')}
            style={coalFilter === 'tactical' ? { color: 'var(--accent-nato)' } : {}}
          >NATO</button>
          <button
            className={'topbar-btn' + (coalFilter === 'signal' ? ' active' : '')}
            onClick={() => setCoalFilter('signal')}
            style={coalFilter === 'signal' ? { color: 'var(--accent-pact)' } : {}}
          >PACT</button>
        </>
      )}
      {(presets ?? []).length > 0 && (
        <div className="topbar-presets">
          {presets.map(p => (
            <button
              key={p.label}
              className={'preset-btn' + (isPresetActive(p, filters) ? ' active' : '')}
              onClick={() => onPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      <div className="topbar-search">
        <input
          type="text"
          placeholder="search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="topbar-count"><span className="num">{shown}</span> / <span>{total}</span></div>
      <button
        className={'topbar-btn' + (variant === 'heatmap' ? ' active' : '')}
        onClick={() => setVariant(v => v === 'heatmap' ? 'minimal' : 'heatmap')}
        style={{ borderLeft: '1px solid var(--line)', borderRight: 'none', marginLeft: 0 }}
        title="Toggle heatmap / minimal"
      >
        {variant === 'heatmap' ? '◼ HEATMAP' : '◻ MINIMAL'}
      </button>
    </div>
  );
}

// ---------- Spreadsheet ----------
function Spreadsheet({ columns, rows, sorts, onSort, heatStats, variant, filters, setFilter }) {
  return (
    <div className="spreadsheet">
      <table>
        <thead>
          {/* Sort header row */}
          <tr>
            {columns.map((col, i) => {
              const isNum       = col.type === 'num' || col.type === 'pct';
              const isSticky    = i === 0;
              const sortIdx     = sorts.findIndex(s => s.key === col.key);
              const isPrimary   = sortIdx === 0;
              const isSecondary = sortIdx === 1;
              const sortDir     = sorts[sortIdx]?.dir;
              return (
                <th
                  key={col.key}
                  className={[isNum ? 'num-col' : '', isSticky ? 'sticky' : '', isPrimary ? 'sorted' : isSecondary ? 'sorted-secondary' : ''].join(' ')}
                  style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
                  onClick={() => onSort(col.key)}
                >
                  {col.label}
                  <span className="sort-indicator">
                    {isPrimary
                      ? (sortDir === 'asc' ? '1↑' : '1↓')
                      : isSecondary
                        ? (sortDir === 'asc' ? '2↑' : '2↓')
                        : '↕'}
                  </span>
                </th>
              );
            })}
          </tr>
          {/* Filter row — scrolls with table */}
          <tr className="filter-row">
            {columns.map((col, i) => {
              const isSticky = i === 0;
              const style = { width: col.width, minWidth: col.width, maxWidth: col.width };
              if (TEXT_FILTER_TYPES.has(col.type)) {
                return (
                  <th key={col.key} className={isSticky ? 'sticky' : ''} style={style}>
                    <input
                      type="text"
                      placeholder="filter…"
                      value={filters[col.key]?.text ?? ''}
                      onChange={e => setFilter(col.key, { text: e.target.value })}
                    />
                  </th>
                );
              }
              return (
                <th key={col.key} style={style}>
                  <div className="range-input">
                    <input
                      type="text"
                      placeholder="min"
                      value={filters[col.key]?.min ?? ''}
                      onChange={e => setFilter(col.key, { ...filters[col.key], min: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="max"
                      value={filters[col.key]?.max ?? ''}
                      onChange={e => setFilter(col.key, { ...filters[col.key], max: e.target.value })}
                    />
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const side     = row.nation ? sideOf(row.nation) : null;
            const rowClass = side === 'tactical' ? 'row-nato' : side === 'signal' ? 'row-pact' : 'row-neutral';
            return (
              <tr key={ri} className={rowClass}>
                {columns.map((col, ci) => {
                  const val   = row[col.key];
                  const isNum = col.type === 'num' || col.type === 'pct';
                  const isBool = BOOL_TYPES.has(col.type);
                  const style = { width: col.width, minWidth: col.width, maxWidth: col.width };
                  if (ci > 0) style.textAlign = 'center';

                  const showHeat  = variant !== 'minimal' && heatStats[col.key];
                  const intensity = variant === 'heatmap' ? 1.4 : 0.55;
                  const bg = showHeat ? heatColor(val, heatStats[col.key], intensity) : null;
                  if (bg) style.background = bg;

                  if (col.type === 'bool' && val != null) {
                    style.color = val ? 'var(--accent-pact)' : 'var(--accent-green)';
                    style.fontWeight = 600;
                  }
                  if (col.type === 'bool-good' && val != null) {
                    style.color = val ? 'var(--accent-green)' : 'var(--accent-pact)';
                    style.fontWeight = 600;
                  }

                  if (ci === 0) {
                    const nameDiv = <div className="unit-name">{row.name}</div>;
                    return (
                      <td key={col.key} className="sticky-col" style={style}>
                        {row.id
                          ? <a href={`${BASE}armory/?unit=${row.id}`} style={{ textDecoration: 'none', display: 'block' }}>{nameDiv}</a>
                          : nameDiv
                        }
                      </td>
                    );
                  }
                  if (col.key === 'nation') {
                    const flagSrc = NATION_FLAG_MAP[row.nation];
                    return (
                      <td key={col.key} style={style}>
                        {flagSrc
                          ? <img src={flagSrc} alt={row.nation} title={NATION_CODE_MAP[row.nation] ?? row.nation} className="flag-img" />
                          : <span className="muted">{row.nation}</span>
                        }
                      </td>
                    );
                  }
                  return (
                    <td key={col.key} style={style} className={'heat ' + (isNum ? 'num-col' : '')}>
                      {fmt(val, col)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------- CategoryTabBar ----------
function CategoryTabBar({ dsKey }) {
  return (
    <div className="tab-bar">
      {CATEGORIES.map(cat => (
        <Fragment key={cat.label}>
          <span className="tab-category-label">{cat.label}</span>
          {cat.items.map(item => (
            <a
              key={item.key}
              href={`${BASE}spreadsheet/?ds=${item.key}`}
              className={'tab-item' + (item.key === dsKey ? ' active' : '')}
            >
              {item.label}
            </a>
          ))}
        </Fragment>
      ))}
    </div>
  );
}

// ---------- PlaceholderTopBar (error/loading states) ----------
function PlaceholderTopBar({ label, isWeapon }) {
  return (
    <TopBar label={label} search="" setSearch={() => {}} total={0} shown={0}
      coalFilter="all" setCoalFilter={() => {}} variant="heatmap" setVariant={() => {}}
      isWeapon={isWeapon} presets={[]} filters={{}} onPreset={() => {}} />
  );
}

// ---------- App ----------
export function SpreadsheetApp({ dataset, dsKey }) {
  const [rows,       setRows]       = useState(null);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [coalFilter, setCoalFilter] = useState('all');
  const [filters,    setFilters]    = useState({});
  const [variant,    setVariant]    = useState('heatmap');

  const initCol = dataset.columns.find(c => c.key === dataset.defaultSort);
  const initDir = initCol?.heat === 'low' ? 'asc' : 'desc';
  const [sorts, setSorts] = useState(
    dataset.defaultSort ? [{ key: dataset.defaultSort, dir: initDir }] : []
  );

  useEffect(() => {
    document.body.setAttribute('data-variant', variant);
  }, [variant]);

  useEffect(() => {
    fetchJson(`${BASE}${dataset.file}`)
      .then(raw => setRows(raw.map(dataset.transform)))
      .catch(e  => setError(e.message));
  }, [dataset]);

  const setFilter = useCallback((key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
  }, []);

  const applyPreset = useCallback((preset) => {
    setFilters(f => {
      if (isPresetActive(preset, f)) {
        const next = { ...f };
        Object.keys(preset.filters).forEach(key => delete next[key]);
        return next;
      }
      return { ...f, ...preset.filters };
    });
  }, []);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    let r = rows;

    if (!dataset.isWeapon && coalFilter !== 'all') {
      r = r.filter(row => row.nation && sideOf(row.nation) === coalFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(row =>
        row.name?.toLowerCase().includes(q) ||
        (row.nation && row.nation.toLowerCase().includes(q))
      );
    }

    Object.entries(filters).forEach(([key, f]) => {
      if (!f) return;
      const col = dataset.columns.find(c => c.key === key);
      if (!col) return;
      if (TEXT_FILTER_TYPES.has(col.type)) {
        if (f.text?.trim()) {
          const q = f.text.toLowerCase();
          const isBoolCol = BOOL_TYPES.has(col.type);
          r = r.filter(row => {
            const raw = row[key];
            const v = isBoolCol
              ? (raw == null ? '–' : (raw ? 'y' : 'n'))
              : String(raw ?? '').toLowerCase();
            return v.includes(q);
          });
        }
      } else {
        if (f.min !== undefined && f.min !== '' && !isNaN(parseFloat(f.min))) {
          const m = parseFloat(f.min);
          r = r.filter(row => row[key] !== null && row[key] !== undefined && row[key] >= m);
        }
        if (f.max !== undefined && f.max !== '' && !isNaN(parseFloat(f.max))) {
          const m = parseFloat(f.max);
          r = r.filter(row => row[key] !== null && row[key] !== undefined && row[key] <= m);
        }
      }
    });

    if (sorts.length > 0) {
      r = [...r].sort((a, b) => {
        for (const { key, dir } of sorts) {
          const col = dataset.columns.find(c => c.key === key);
          const av = a[key], bv = b[key];
          if (av === null && bv === null) continue;
          if (av === null) return 1;
          if (bv === null) return -1;
          let cmp;
          if (col && (col.type === 'num' || col.type === 'pct')) {
            cmp = dir === 'asc' ? av - bv : bv - av;
          } else {
            cmp = dir === 'asc'
              ? String(av).localeCompare(String(bv))
              : String(bv).localeCompare(String(av));
          }
          if (cmp !== 0) return cmp;
        }
        return 0;
      });
    }
    return r;
  }, [rows, coalFilter, search, filters, sorts, dataset]);

  const heatStats = useMemo(() => rows ? buildHeatmap(rows, dataset.columns) : {}, [rows, dataset]);

  function handleSort(key) {
    setSorts(prev => {
      if (prev[0]?.key === key) {
        return [{ key, dir: prev[0].dir === 'asc' ? 'desc' : 'asc' }, ...prev.slice(1)];
      }
      if (prev[1]?.key === key) {
        return [prev[1], prev[0]];
      }
      const col = dataset.columns.find(c => c.key === key);
      const dir = col?.heat === 'low' ? 'asc' : 'desc';
      return prev[0] ? [prev[0], { key, dir }] : [{ key, dir }];
    });
  }

  if (error) {
    return (
      <>
        <PlaceholderTopBar label={dataset.label} isWeapon={dataset.isWeapon} />
        <div className="main">
          <div className="spreadsheet-wrap">
            <div className="state-screen">
              <span className="glyph">◇ ✕ ◇</span>
              <span>failed to load {dataset.file}</span>
              <span style={{ color: 'var(--text-mute)', fontSize: 10 }}>{error}</span>
            </div>
            <CategoryTabBar dsKey={dsKey} />
          </div>
        </div>
      </>
    );
  }

  if (!rows) {
    return (
      <>
        <PlaceholderTopBar label={dataset.label} isWeapon={dataset.isWeapon} />
        <div className="main">
          <div className="spreadsheet-wrap">
            <div className="state-screen">
              <span className="glyph">◇ ◆ ◇</span>
              loading…
            </div>
            <CategoryTabBar dsKey={dsKey} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        label={dataset.label}
        search={search} setSearch={setSearch}
        total={rows.length} shown={filteredRows.length}
        coalFilter={coalFilter} setCoalFilter={setCoalFilter}
        variant={variant} setVariant={setVariant}
        isWeapon={dataset.isWeapon}
        presets={dataset.presets ?? []} filters={filters} onPreset={applyPreset}
      />
      <div className="main">
        <div className="spreadsheet-wrap">
          <Spreadsheet
            columns={dataset.columns}
            rows={filteredRows}
            sorts={sorts}
            onSort={handleSort}
            heatStats={heatStats}
            variant={variant}
            filters={filters}
            setFilter={setFilter}
          />
          <CategoryTabBar dsKey={dsKey} />
        </div>
      </div>
    </>
  );
}
