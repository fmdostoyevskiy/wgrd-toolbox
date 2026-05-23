import React, { useMemo, useCallback, useState } from 'react';
import {
  BROWSER_TOKENS, BMono,
  COALITION_CODE_MAP, COALITION_NATIONS, COALITION_FLAG_MAP,
  ALL_NATIONS, PACT_NATIONS, NATION_FLAG_MAP, sideOf,
  SPECS,
} from '@units-core';
import { Seg } from '../armory/Seg.jsx';
import { useWindowWidth } from '../armory/useWindowWidth.js';

const BASE = import.meta.env.BASE_URL;
const SMALL_BREAKPOINT = 600;

const CODE_TO_COALITION = Object.fromEntries(
  Object.entries(COALITION_CODE_MAP).map(([name, code]) => [code, name]),
);

const COALITION_OPTIONS = [
  { label: 'NATO', value: 'NATO', flag: COALITION_FLAG_MAP['NATO'] },
  { label: 'PACT', value: 'PACT', flag: COALITION_FLAG_MAP['PACT'] },
  { separator: true },
  ...Object.keys(COALITION_NATIONS).map(name => ({
    label: name.toUpperCase(), value: name, flag: COALITION_FLAG_MAP[name],
  })),
];

const SPEC_OPTIONS = SPECS.map(s => ({ label: s.toUpperCase(), value: s }));

const NATION_OPTIONS = ALL_NATIONS.flatMap((code, i, arr) => {
  const item = { label: code, value: code, flag: NATION_FLAG_MAP[code] };
  const addSep = i > 0 && !PACT_NATIONS.has(arr[i - 1]) && PACT_NATIONS.has(code);
  return addSep ? [{ separator: true }, item] : [item];
});

function deckSide(nation) {
  if (nation === 'OTAN') return 'tactical';
  const coalitionName = CODE_TO_COALITION[nation];
  if (coalitionName) {
    const firstNation = COALITION_NATIONS[coalitionName]?.[0];
    if (firstNation) return sideOf(firstNation);
  }
  if (PACT_NATIONS.has(nation)) return 'signal';
  return 'tactical';
}

function matchesCoalition(deck, filters) {
  if (filters.length === 0) return true;
  const nation = deck.nation;
  for (const f of filters) {
    if (f === 'NATO' && deckSide(nation) === 'tactical') return true;
    if (f === 'PACT' && deckSide(nation) === 'signal') return true;
    const code = COALITION_CODE_MAP[f];
    if (code && code === nation) return true;
  }
  return false;
}

function matchesNation(deck, filters) {
  if (filters.length === 0) return true;
  const nation = deck.nation;
  if (NATION_FLAG_MAP[nation]) return filters.includes(nation);
  if (nation === 'OTAN') return filters.some(f => !PACT_NATIONS.has(f));
  const coalitionName = CODE_TO_COALITION[nation];
  if (coalitionName) {
    const members = COALITION_NATIONS[coalitionName] || [];
    return members.some(m => filters.includes(m));
  }
  return false;
}

function matchesSpec(deck, filters) {
  if (filters.length === 0) return true;
  return filters.includes(deck.specialization);
}

function useToggle() {
  const [selected, setSelected] = useState([]);
  const toggle = useCallback((value) => {
    if (value == null) { setSelected([]); return; }
    setSelected(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  }, []);
  const solo = useCallback((value) => {
    setSelected(prev => prev.length === 1 && prev[0] === value ? [] : [value]);
  }, []);
  return { selected, toggle, solo };
}

const RULE_THIN = 'rgba(120, 160, 210, 0.18)';

function deckFlag(nation) {
  if (NATION_FLAG_MAP[nation]) return NATION_FLAG_MAP[nation];
  const coalitionName = CODE_TO_COALITION[nation];
  if (coalitionName && COALITION_FLAG_MAP[coalitionName]) return COALITION_FLAG_MAP[coalitionName];
  if (nation === 'OTAN') return COALITION_FLAG_MAP['NATO'];
  return null;
}

export function DecksApp({ data }) {
  const t = BROWSER_TOKENS;
  const winWidth = useWindowWidth();
  const isSmall = winWidth < SMALL_BREAKPOINT;

  const coalition = useToggle();
  const nation = useToggle();
  const spec = useToggle();

  const authors = data.authors || [];
  const totalDecks = useMemo(() => authors.reduce((n, a) => n + (a.decks?.length || 0), 0), [authors]);

  const filteredAuthors = useMemo(() => {
    return authors.map(author => {
      const decks = (author.decks || []).filter(d =>
        matchesCoalition(d, coalition.selected) &&
        matchesNation(d, nation.selected) &&
        matchesSpec(d, spec.selected)
      );
      return { ...author, decks };
    }).filter(a => a.decks.length > 0);
  }, [authors, coalition.selected, nation.selected, spec.selected]);

  const now = new Date();
  const buildDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}`;

  const px = isSmall ? '20px' : '28px';

  return (
    <div style={{
      ...BMono, width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: t.bg, color: t.ink, overflow: 'hidden',
      fontSize: 13, letterSpacing: '0.08em',
    }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{
          padding: isSmall ? '24px 20px 14px' : '28px 28px 14px',
          borderBottom: `0.8px solid ${RULE_THIN}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 8,
        }}>
          <a href={BASE} style={{ display: 'flex', alignItems: 'baseline', gap: 6, textDecoration: 'none', color: 'inherit' }}>
            <span style={{ fontWeight: 700, letterSpacing: '0.12em' }}>WRD</span>
            <span style={{ color: t.accent2 }}>·</span>
            <span style={{ fontWeight: 700, letterSpacing: '0.12em' }}>DECKS</span>
          </a>
          <div style={{ fontSize: 11, letterSpacing: '0.18em', color: t.dim }}>
            // COMMUNITY ROSTER
          </div>
        </div>

        {/* ── Stats bar ── */}
        <div style={{
          padding: `6px ${px}`,
          borderBottom: `0.8px solid ${RULE_THIN}`,
          fontSize: 11, letterSpacing: '0.18em', color: t.dim,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>
            <span style={{ color: t.ink }}>{authors.length}</span> AUTHORS <span style={{ color: t.dimmer }}>·</span>{' '}
            <span style={{ color: t.ink }}>{totalDecks}</span> DECKS
          </span>
          <span>BUILD {buildDate}</span>
        </div>

        {/* ── Filters ── */}
        <Seg
          label="COAL"
          options={COALITION_OPTIONS}
          selected={coalition.selected}
          onToggle={coalition.toggle}
          onSolo={coalition.solo}
        />
        <Seg
          label="NATION"
          options={NATION_OPTIONS}
          selected={nation.selected}
          onToggle={nation.toggle}
          onSolo={nation.solo}
        />
        <Seg
          label="SPEC"
          options={SPEC_OPTIONS}
          selected={spec.selected}
          onToggle={spec.toggle}
          onSolo={spec.solo}
        />

        {/* ── Author + deck list ── */}
        {filteredAuthors.map((author, ai) => (
          <AuthorBlock
            key={author.name}
            author={author}
            index={ai}
            isSmall={isSmall}
            t={t}
            px={px}
          />
        ))}

        {filteredAuthors.length === 0 && (
          <div style={{
            padding: '48px 0', textAlign: 'center',
            fontSize: 11, letterSpacing: '0.2em', color: t.dimmer,
          }}>
            NO DECKS MATCH CURRENT FILTERS
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          padding: `12px ${px}`,
          fontSize: 10, letterSpacing: '0.2em', color: t.dimmer,
          borderTop: `0.8px solid ${RULE_THIN}`,
          marginTop: 24,
        }}>
          END OF ROSTER
        </div>
      </div>
      </div>
    </div>
  );
}

/* ── Author block ── */

function AuthorBlock({ author, index, isSmall, t, px }) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <div>
      {/* Author header */}
      <div style={{
        padding: `14px ${px}`,
        borderBottom: `0.8px solid ${RULE_THIN}`,
        background: t.surface,
        display: 'flex', alignItems: 'baseline',
        gap: 8, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 11, color: t.dimmer, letterSpacing: '0.14em' }}>USR/</span>
        <span style={{ fontSize: 11, color: t.accent2, fontWeight: 600 }}>{num}</span>

        <span style={{ fontSize: isSmall ? 14 : 16, fontWeight: 600, letterSpacing: '0.04em' }}>
          {author.name}
        </span>

        <span style={{ fontSize: 11, color: t.dimmer }}>·</span>
        <span style={{ fontSize: 11, color: t.dim, letterSpacing: '0.14em' }}>
          {author.decks.length} DECKS
        </span>
      </div>

      {/* Author bio */}
      {author.bio && (
        <div style={{
          padding: `6px ${px} 6px calc(${px} + 4px)`,
          borderBottom: `0.8px solid ${RULE_THIN}`,
          fontSize: 11, letterSpacing: '0.08em', color: t.dim,
          lineHeight: 1.6,
        }}>
          <span style={{ color: t.dimmer, marginRight: 8 }}>↳</span>
          {author.bio}
        </div>
      )}

      {/* Deck rows */}
      {author.decks.map((deck, di) => (
        <DeckRow
          key={`${deck.name}-${di}`}
          deck={deck}
          index={di}
          isSmall={isSmall}
          t={t}
          px={px}
        />
      ))}
    </div>
  );
}

/* ── Deck row ── */

function DeckRow({ deck, index, isSmall, t, px }) {
  const num = String(index + 1).padStart(3, '0');
  const side = deckSide(deck.nation);
  const nationColor = side === 'signal' ? t.pactTag : t.natoTag;
  const flag = deckFlag(deck.nation);
  const deckUrl = `${BASE}deckbuilder/?deck=${encodeURIComponent(deck.code)}`;

  const specLabel = deck.specialization !== 'General' ? deck.specialization.toUpperCase() : null;
  const eraLabel = deck.era !== 'None' ? deck.era : null;

  return (
    <a
      href={deckUrl}
      target="_blank"
      rel="noreferrer"
      style={{
        display: 'flex', alignItems: 'center',
        padding: `8px ${px}`,
        borderBottom: `0.8px solid ${RULE_THIN}`,
        textDecoration: 'none', color: t.ink,
        gap: isSmall ? 8 : 12,
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = t.surface}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Row number */}
      <span style={{
        fontSize: 10, color: t.dimmer, letterSpacing: '0.1em',
        width: 28, flexShrink: 0, textAlign: 'right',
      }}>
        {num}
      </span>

      {/* Nation flag */}
      {flag
        ? <img src={flag} alt={deck.nation} title={deck.nation} style={{
            height: 16, width: 'auto', flexShrink: 0, opacity: 0.9,
          }} />
        : <span style={{
            fontSize: 9, fontWeight: 600, letterSpacing: '0.12em',
            color: nationColor, flexShrink: 0,
          }}>
            {deck.nation}
          </span>
      }

      {/* Deck name */}
      <span style={{
        fontWeight: 500, letterSpacing: '0.04em',
        flex: 1, minWidth: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {deck.name}
      </span>

      {/* Spec tag */}
      {specLabel && !isSmall && (
        <span style={{
          fontSize: 9, letterSpacing: '0.14em',
          color: t.dim,
          padding: '2px 6px',
          background: t.surface2,
          borderRadius: 2, flexShrink: 0,
        }}>
          {specLabel}
        </span>
      )}

      {/* Era */}
      {eraLabel && !isSmall && (
        <span style={{
          fontSize: 10, letterSpacing: '0.1em', color: t.dimmer,
          flexShrink: 0, width: 40, textAlign: 'center',
        }}>
          {eraLabel}
        </span>
      )}

      {/* Format */}
      <span style={{
        fontSize: 10, letterSpacing: '0.1em', color: t.dim,
        flexShrink: 0, width: isSmall ? 34 : 40, textAlign: 'center',
      }}>
        {deck.format}
      </span>

      {/* Open link */}
      <span style={{
        fontSize: 10, letterSpacing: '0.12em', color: t.dimmer,
        flexShrink: 0,
      }}>
        OPEN&#x2009;↗
      </span>
    </a>
  );
}
