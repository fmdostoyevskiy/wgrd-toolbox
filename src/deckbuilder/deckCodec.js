/**
 * deckCodec.js — Game-compatible binary deck codec for Wargame: Red Dragon
 *
 * Format reverse-engineered from aqarius/FA_WG_Utilities/js/DeckDisAssembly.js
 *
 * Bit layout:
 *   [12 bits] nation/coalition code (see NATION_BITS)
 *   [ 3 bits] specialization (0=MOT,1=ARM,2=SUP,3=MAR,4=MECH,5=AIR,6=NAV,7=GEN)
 *   [ 2 bits] era (0=C,1=B,2=A)
 *   [ 4 bits] count of Cat-A units  (naval inf: unit+transport+craft)
 *   [ 5 bits] count of Cat-B units  (ground inf: unit+transport)
 *   Cat A: [3 vet][11 unit][11 transport][11 craft]  × count_A
 *   Cat B: [3 vet][11 unit][11 transport]            × count_B
 *   Cat C: [3 vet][11 unit]                          × rest
 *
 * Characters use the standard base64 alphabet (A-Za-z0-9+/), prefixed with '@'.
 * After all chars, append: A== (N%4==1), A= (N%4==2), A (N%4==3), nothing (N%4==0).
 *
 * Unit data comes from the units map (already loaded by loadData). Each unit must
 * have deckIndex, deckCat, and deckSide fields — stamped by enrich.py's
 * handle_deck_indices handler from data/deck_indices.json.
 */

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

// ---------------------------------------------------------------------------
// 12-bit nation/coalition binary strings, derived from aqarius.
// Bit 1 (second char) = '1' → REDFOR, '0' → BLUFOR.
// ---------------------------------------------------------------------------
const NATION_BITS = {
  // BLUFOR nations
  'US':   '000000001100',
  'UK':   '000000101100',
  'FR':   '000001001100',
  'RFA':  '000001101100',
  'CAN':  '000010001100',
  'DAN':  '000010101100',
  'SWE':  '000011001100',
  'NOR':  '000011101100',
  'ANZ':  '000100001100',
  'JAP':  '000100101100',
  'ROK':  '000101001100',
  'HOL':  '000101101100',
  'ISR':  '000110001100',
  'SA':   '000111101100',
  'ITA':  '001000001100',
  // BLUFOR coalitions
  'Eurocorps':    '001000100000',
  'Scandinavia':  '001000100001',
  'Commonwealth': '001000100010',
  'Blue Dragons': '001000100011',
  'Landjut':      '001000100110',
  'NORAD':        '001000101000',
  'Dutch-German': '001000101001',
  'NATO':         '001000101100',
  // REDFOR nations
  'RDA':  '010000001100',
  'URSS': '010000101100',
  'POL':  '010001001100',
  'TCH':  '010001101100',
  'CHI':  '010010001100',
  'NK':   '010010101100',
  'FIN':  '010011001100',
  'YUG':  '010011101100',
  // REDFOR coalitions
  'Red Dragons':  '010100100100',
  'Eastern Bloc': '010100100101',
  'Baltic Front': '010100101010',  // FINPL in aqarius
  'Entente':      '010100101011',  // YUCZE in aqarius
  'PACT':         '010100101100',
};

const BITS_TO_NATION = Object.fromEntries(
  Object.entries(NATION_BITS).map(([k, v]) => [v, k])
);

const SPEC_TO_INT = {
  'Motorized':  0,
  'Armored':    1,
  'Support':    2,
  'Marine':     3,
  'Mechanized': 4,
  'Airborne':   5,
  'Naval':      6,
  // null / General → 7
};
const INT_TO_SPEC = {
  0: 'Motorized', 1: 'Armored', 2: 'Support', 3: 'Marine',
  4: 'Mechanized', 5: 'Airborne', 6: 'Naval',
};

const ERA_TO_INT = { 'C': 0, 'B': 1, 'A': 2 };
const INT_TO_ERA = { 0: 'C', 1: 'B', 2: 'A' };

// Tab order matches SLOT_COSTS key order — the game encodes units in this sequence.
const TAB_ORDER = { LOG: 0, INF: 1, SUP: 2, TNK: 3, REC: 4, VHC: 5, HEL: 6, AIR: 7, NAV: 8 };

function sortCards(cards, units) {
  return [...cards].sort((a, b) => {
    const ua = units[a.unitId], ub = units[b.unitId];
    const ta = TAB_ORDER[ua?.tab] ?? 99;
    const tb = TAB_ORDER[ub?.tab] ?? 99;
    if (ta !== tb) return ta - tb;
    return (ua?.deckIndex ?? 0) - (ub?.deckIndex ?? 0);
  });
}

// ---------------------------------------------------------------------------
// Bit writer
// ---------------------------------------------------------------------------
class BitWriter {
  constructor() { this.bits = []; }

  write(value, numBits) {
    for (let i = numBits - 1; i >= 0; i--) {
      this.bits.push((value >> i) & 1);
    }
  }

  writeStr(s) {
    for (const c of s) this.bits.push(c === '1' ? 1 : 0);
  }

  toCode() {
    const { bits } = this;

    // Split into 6-bit groups, zero-pad the last group
    const groups = [];
    for (let i = 0; i < bits.length; i += 6) {
      let v = 0;
      for (let j = 0; j < 6; j++) v = (v << 1) | (bits[i + j] ?? 0);
      groups.push(v);
    }

    let out = '@';
    let padCounter = 4;
    for (const v of groups) {
      out += ALPHABET[v];
      if (--padCounter === 0) padCounter = 4;
    }

    // Trailing padding: always align to a multiple of 4 chars.
    // padCounter===3 (N%4==1): one char in last group — add A then ==
    // padCounter===2 (N%4==2): two chars in last group — add ==
    // padCounter===1 (N%4==3): three chars in last group — add =
    if      (padCounter === 3) out += 'A==';
    else if (padCounter === 2) out += '==';
    else if (padCounter === 1) out += '=';

    return out;
  }
}

// ---------------------------------------------------------------------------
// Bit reader
// ---------------------------------------------------------------------------
class BitReader {
  constructor(chars) {
    this.bits = [];
    for (const c of chars) {
      const v = ALPHABET.indexOf(c);
      if (v === -1) continue;   // skip '=' padding chars
      for (let i = 5; i >= 0; i--) this.bits.push((v >> i) & 1);
    }
    this.pos = 0;
  }

  read(n) {
    let v = 0;
    for (let i = 0; i < n; i++) v = (v << 1) | (this.bits[this.pos++] ?? 0);
    return v;
  }

  readStr(n) {
    let s = '';
    for (let i = 0; i < n; i++) s += String(this.bits[this.pos++] ?? 0);
    return s;
  }

  remaining() { return this.bits.length - this.pos; }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encode a deck into the game's binary format.
 * @param {object} config  { choice, spec, era }
 * @param {Array}  cards   [{ unitId, vet, transportId }]
 * @param {object} units   units map from loadData() — must have deckIndex/deckCat fields
 * @returns {string} deck code starting with '@', or '' on failure
 */
export function encodeDeck(config, cards, units) {
  const { choice, spec, era } = config;
  const nationBits = NATION_BITS[choice];
  if (!nationBits) {
    console.warn(`encodeDeck: unknown nation/coalition "${choice}"`);
    return '';
  }

  // Partition cards by transport category from unit data, then sort within each
  // category by (tab display order, deckIndex) — the order the game expects.
  const catsA = [], catsB = [], catsC = [];
  for (const card of sortCards(cards, units)) {
    const cat = units[card.unitId]?.deckCat ?? 'C';
    if (cat === 'A') catsA.push(card);
    else if (cat === 'B') catsB.push(card);
    else catsC.push(card);
  }

  const w = new BitWriter();

  // Header
  w.writeStr(nationBits);
  w.write(SPEC_TO_INT[spec] ?? 7, 3);
  w.write(ERA_TO_INT[era]   ?? 2, 2);
  w.write(catsA.length, 4);
  w.write(catsB.length, 5);

  // Cat A: vet(3) + unit(11) + transport(11) + craft(11)
  for (const card of catsA) {
    w.write(card.vet ?? 0, 3);
    w.write(units[card.unitId]?.deckIndex      ?? 0, 11);
    w.write(units[card.transportId]?.deckIndex ?? 0, 11);
    w.write(0, 11);  // craft index — not tracked; encode 0
  }

  // Cat B: vet(3) + unit(11) + transport(11)
  for (const card of catsB) {
    w.write(card.vet ?? 0, 3);
    w.write(units[card.unitId]?.deckIndex      ?? 0, 11);
    w.write(units[card.transportId]?.deckIndex ?? 0, 11);
  }

  // Cat C: vet(3) + unit(11)
  for (const card of catsC) {
    w.write(card.vet ?? 0, 3);
    w.write(units[card.unitId]?.deckIndex ?? 0, 11);
  }

  return w.toCode();
}

/**
 * Decode a game-format deck code back into config + cards.
 * @param {string} code   deck code starting with '@'
 * @param {object} units  units map from loadData() — must have deckIndex/deckSide fields
 * @returns {{ choice, spec, era, cards }} or null on failure
 */
export function decodeDeck(code, units) {
  if (!code || !code.startsWith('@')) return null;

  const r = new BitReader(code.slice(1));

  const nationStr = r.readStr(12);
  const choice    = BITS_TO_NATION[nationStr];
  if (!choice) {
    console.warn(`decodeDeck: unknown nation bits "${nationStr}"`);
    return null;
  }

  const specInt = r.read(3);
  const eraInt  = r.read(2);
  const countA  = r.read(4);
  const countB  = r.read(5);

  const spec = specInt === 7 ? null : (INT_TO_SPEC[specInt] ?? null);
  const era  = INT_TO_ERA[eraInt] ?? 'A';

  // Build reverse map: deckIndex → unitId, filtered to the correct side
  const isRed     = nationStr[1] === '1';
  const wantedSide = isRed ? 'REDFOR' : 'BLUFOR';
  const reverseMap = {};
  for (const [id, unit] of Object.entries(units)) {
    if (unit.deckIndex != null && unit.deckSide === wantedSide) {
      reverseMap[unit.deckIndex] = id;
    }
  }

  const cards = [];
  let key = 1;

  for (let i = 0; i < countA; i++) {
    const vet     = r.read(3);
    const unitIdx = r.read(11);
    const tIdx    = r.read(11);
    r.read(11);  // craft — discard
    cards.push({ key: key++, unitId: reverseMap[unitIdx] ?? null, vet,
                 transportId: reverseMap[tIdx] ?? null });
  }

  for (let i = 0; i < countB; i++) {
    const vet     = r.read(3);
    const unitIdx = r.read(11);
    const tIdx    = r.read(11);
    cards.push({ key: key++, unitId: reverseMap[unitIdx] ?? null, vet,
                 transportId: reverseMap[tIdx] ?? null });
  }

  // Cat C: continue while > 12 bits remain (matches aqarius threshold)
  while (r.remaining() > 12) {
    const vet     = r.read(3);
    const unitIdx = r.read(11);
    cards.push({ key: key++, unitId: reverseMap[unitIdx] ?? null, vet,
                 transportId: null });
  }

  return { choice, spec, era, cards };
}
