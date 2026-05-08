#!/usr/bin/env python3
"""
enrich.py — Enrich data/master.json with role metadata.

Reads all handler inputs from the data directory by naming convention.
Writes data/units.json (enriched copy) and per-handler dump files.
data/master.json is NEVER modified.

Usage:
    python scripts/enrich.py
    python scripts/enrich.py --data-dir data
"""

import argparse
import csv
import json
import os
import re
import sys
import unicodedata


# ===========================================================================
# Constants
# ===========================================================================

# Range thresholds (game distance units)
MORTAR_MAX_RANGE = 9100
TANK_GUN_MIN_RANGE = 1925
AC_RANGE_MIN = 1400
AC_RANGE_MAX = 1925
MG_RANGE_MAX = 1225
GL_RANGE_MIN = 1225
GL_RANGE_MAX = 1750
ROCKET_POD_MIN_RANGE = 2100
PLANE_AA_RANGE = 3150

# Damage thresholds
MG_DMG_MIN = 0.5
MG_DMG_MAX = 1.0
AC_DMG_MIN = 1.0
AC_DMG_MAX = 1.5
GL_DMG = 2
HE_MLRS_MIN_DMG = 6
HE_BOMB_MIN_DMG = 10

# Tank detection thresholds
TANK_MIN_HEALTH = 5
TANK_MIN_SIDE_ARMOR = 2
TANK_MIN_AP = 6
TANK_MIN_DMG = 2

# Optics thresholds
RECON_OPTICS_MIN = 120
ASF_AIR_OPTICS_MIN = 300

# Weapons that represent the same gun but were assigned different nameIds in
# the source data.  Map each secondary ID to the canonical (KE) ID so that
# handle_merge_duplicate_weapons can merge them normally.
_SPLIT_ID_CANON = {
    # C1 ARIETE — OTO Breda 120mm L/44
    'd1034d580659d405': 'd2b74594342e5d05',
    # OF-40 Mk.2A — OTO Melara 105mm M52
    '9af3700e146edd04': 'dff8340db3381c03',
    # OF-40 Mk.2 — OTO Melara 105mm M52
    'd1f66c56d4601903': '4d177d5b38424c07',
}

_TYPE_TAG = {
    'Vehicle': 'VEH', 'Infantry': 'INF', 'FOB': 'FOB',
    'Helicopter': 'HEL', 'Plane': 'PLANE', 'Ship': 'SHIP',
}


# ===========================================================================
# Name normalisation  (runs before any handler, on every unit/weapon name)
# ===========================================================================

def _strip_diacritics(text):
    """
    Convert accented / special Latin characters to their plain ASCII base.

    Two-pass approach:
    1. Explicit substitution table for characters that NFKD cannot decompose
       (e.g. Ł → L, Ø → O, Đ → D, ß → ss).
    2. NFKD decomposition + strip combining marks for everything else
       (e.g. Š → S, Ū → U, Ì → I, À → A, ć → c).

    Characters with no ASCII equivalent (CJK, Cyrillic, etc.) are untouched.
    """
    _EXPLICIT = str.maketrans({
        'Ł': 'L', 'ł': 'l',
        'Ø': 'O', 'ø': 'o',
        'Đ': 'D', 'đ': 'd',
        'Ð': 'D', 'ð': 'd',
        'Þ': 'Th', 'þ': 'th',
        'Æ': 'Ae', 'æ': 'ae',
        'Œ': 'Oe', 'œ': 'oe',
        'ß': 'ss',
        'ı': 'i',
        '\xa0': ' ',   # non-breaking space → regular space
    })
    text = text.translate(_EXPLICIT)
    nfkd = unicodedata.normalize('NFKD', text)
    return ''.join(ch for ch in nfkd if unicodedata.category(ch) != 'Mn')


def normalise_names(units):
    """
    Strip diacritics and leading/trailing whitespace from every unit name and
    every weapon name in-place.
    Returns a list of (kind, original, normalised) triples for any name that
    changed, so the caller can log what was altered.
    """
    changes = []
    for unit in units:
        orig = unit.get('name') or ''
        norm = _strip_diacritics(orig).strip()
        if norm != orig:
            changes.append(('unit', orig, norm))
            unit['name'] = norm
        for w in unit.get('weapons', []):
            wo = w.get('name') or ''
            wn = _strip_diacritics(wo).strip()
            if wn != wo:
                changes.append(('weapon', wo, wn))
                w['name'] = wn
    return changes


# ===========================================================================
# I/O utilities
# ===========================================================================

def load_json(path):
    """Load a UTF-16 LE JSON file (BOM handled automatically)."""
    with open(path, encoding='utf-16') as f:
        return json.load(f)


def save_json(path, data):
    """Save data as UTF-16 LE JSON, creating directories as needed."""
    parent = os.path.dirname(os.path.abspath(path))
    os.makedirs(parent, exist_ok=True)
    with open(path, 'w', encoding='utf-16') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


def parse_file(path):
    """
    Parse a tab-delimited file (TSV or TXT) into a list of row lists.
    Blank rows are discarded.
    """
    with open(path, newline='', encoding='utf-8') as f:
        return [row for row in csv.reader(f, delimiter='\t')
                if any(cell.strip() for cell in row)]


# ===========================================================================
# Name / label helpers
# ===========================================================================

def parse_names(raw):
    """
    Parse a raw name cell into (base_name, variant_or_None) tuples,
    handling pipe-separated aliases and parenthesised variant suffixes.

      "BM-21|BM-21M"        -> [("BM-21", None), ("BM-21M", None)]
      "D-30 (Early)"        -> [("D-30", "(Early)")]
      "M109|M109A1 (Late)"  -> [("M109", None), ("M109A1", "(Late)")]
    """
    result = []
    for seg in raw.split('|'):
        seg = seg.strip()
        if not seg:
            continue
        m = re.match(r'^(.*?)\s*(\([^)]+\))\s*$', seg)
        if m:
            result.append((m.group(1).strip(), m.group(2)))
        else:
            result.append((seg, None))
    return result


def add_to_spreadsheet(obj, label):
    """Idempotently append label to obj['spreadsheet']."""
    if 'spreadsheet' not in obj:
        obj['spreadsheet'] = []
    if label not in obj['spreadsheet']:
        obj['spreadsheet'].append(label)


# ===========================================================================
# Lookup helpers (all case-insensitive)
# ===========================================================================

def find_units_by_name(units, name):
    """Return ALL units whose name matches case-insensitively.
    The search term is normalised so TSV entries with diacritics still match
    the already-normalised JSON names."""
    nl = _strip_diacritics(name).lower()
    return [u for u in units if (u.get('name') or '').lower() == nl]


def find_unit_by_id(units, uid):
    """Return the first unit with a matching id, or None."""
    return next((u for u in units if u.get('id') == uid), None)


def find_weapons_across_units(units, name):
    """Return list of (unit, weapon) pairs where weapon name matches case-insensitively.
    The search term is normalised so TSV entries with diacritics still match
    the already-normalised JSON names."""
    nl = _strip_diacritics(name).lower()
    return [
        (u, w)
        for u in units
        for w in u.get('weapons', [])
        if (w.get('name') or '').lower() == nl
    ]


# ===========================================================================
# Weapon predicates
# ===========================================================================

def is_bomb_type(w):
    """True if weapon is bomb-type: category Bomb, or has the LGB tag."""
    return w.get('category') == 'Bomb' or 'LGB' in w.get('tag', [])


def has_plane_range(w):
    """True if weapon can engage aircraft (rng_a > 0)."""
    return w.get('rng_a', 0) > 0


def has_he_bomb(w):
    """HE bomb: bomb-type weapon with no AP value."""
    return is_bomb_type(w) and not w.get('ap', 0)


def has_ap_bomb(w):
    """Cluster bomb: bomb-type weapon with AP > 0."""
    return is_bomb_type(w) and bool(w.get('ap', 0))


def has_napalm(w):
    """True if weapon carries napalm (NPLM tag)."""
    return 'NPLM' in w.get('tag', [])


def is_spaag_weapon(w):
    """True if weapon is a SPAAG-type AA weapon (gun or radar autocannon)."""
    if not has_plane_range(w):
        return False
    if w.get('category') == 'Gun':
        return True
    tags = w.get('tag', [])
    return (w.get('category') == 'Missile'
            and 'RAD' in tags
            and 'GUID' not in tags
            and 'FnF' not in tags)


def is_atgm_missile(w):
    """True if weapon is an ATGM-type missile: Missile with AP, not SHIP/RAD/SEAD."""
    if w.get('category') != 'Missile' or not w.get('ap', 0):
        return False
    wtags = w.get('tag', [])
    return 'SHIP' not in wtags and 'RAD' not in wtags and 'SEAD' not in wtags


# ===========================================================================
# Collection helpers
# ===========================================================================

def ensure_weapon_tag(weapon, tag):
    """Add tag to weapon's tag list if not already present. Returns 1 if added, 0 if not."""
    tags = weapon.setdefault('tag', [])
    if tag not in tags:
        tags.append(tag)
        return 1
    return 0


def collect_units(units, predicate, label, dump_file, data_dir,
                  weapon_tagger=None):
    """
    Iterate units, apply predicate, add spreadsheet label, dedup by id,
    save dump JSON.  Returns (dump_list, tag_count).

    weapon_tagger: optional callable(unit) -> int for side effects (e.g. tagging
                   weapons); return value is summed into tag_count.
    """
    dump, seen = [], set()
    tag_count = 0
    for unit in units:
        if not predicate(unit):
            continue
        add_to_spreadsheet(unit, label)
        if weapon_tagger:
            tag_count += weapon_tagger(unit)
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, dump_file), dump)
    return dump, tag_count


def collect_units_from_file(units, rows, label, dump_file, data_dir,
                            handler_tag, unit_pred=None, weapon_tagger=None):
    """
    For each row name, find matching units, optionally filter by unit_pred,
    add spreadsheet label, dedup by id, save dump file.
    Returns (dump_list, unmatched_list).
    """
    dump, seen, unmatched = [], set(), []
    for row in rows:
        if not row:
            continue
        for base_name, _ in parse_names(row[0]):
            matched = find_units_by_name(units, base_name)
            if not matched:
                print(f'  {handler_tag} WARNING: unit "{base_name}" not found in JSON')
                unmatched.append(base_name)
                continue
            for unit in matched:
                if unit_pred and not unit_pred(unit):
                    continue
                add_to_spreadsheet(unit, label)
                if weapon_tagger:
                    weapon_tagger(unit)
                uid = unit['id']
                if uid not in seen:
                    dump.append(unit)
                    seen.add(uid)
    save_json(os.path.join(data_dir, dump_file), dump)
    return dump, unmatched


def collect_weapons_from_file(units, rows, label, dump_file, data_dir,
                              handler_tag):
    """
    For each row name, find matching weapons, apply label, dedup by nameId,
    save dump file.  Returns (dump_dict, unmatched_list).
    """
    dump_dict = {}
    unmatched = []
    for row in rows:
        if not row:
            continue
        for base_name, _ in parse_names(row[0]):
            matches = find_weapons_across_units(units, base_name)
            if not matches:
                print(f'  {handler_tag} WARNING: weapon "{base_name}" not found in JSON')
                unmatched.append(base_name)
                continue
            for _, w in matches:
                add_to_spreadsheet(w, label)
                key = w.get('nameId') or w.get('name')
                if key not in dump_dict:
                    dump_dict[key] = w
    save_json(os.path.join(data_dir, dump_file), list(dump_dict.values()))
    return dump_dict, unmatched


# ===========================================================================
# Preprocessing handlers
# ===========================================================================

def handle_exclude(units, rows, data_dir):
    exclude_ids = {row[0].strip() for row in rows if row and row[0].strip()}
    original_ids = {u.get('id') for u in units}
    unmatched = [uid for uid in exclude_ids if uid not in original_ids]
    for uid in unmatched:
        print(f'  [H-1] WARNING: unit ID "{uid}" not found in JSON')
    units[:] = [u for u in units if u.get('id') not in exclude_ids]
    removed = len(exclude_ids) - len(unmatched)
    print(f'  [H-1] Exclude: removed {removed} unit(s)')
    return unmatched


def handle_trailing_spaces(units, rows, data_dir):
    count = 0
    for unit in units:
        orig = unit.get('name') or ''
        stripped = orig.rstrip(' ')
        if stripped != orig:
            unit['name'] = stripped
            count += 1
        for w in unit.get('weapons', []):
            wo = w.get('name') or ''
            ws = wo.rstrip(' ')
            if ws != wo:
                w['name'] = ws
                count += 1
    print(f'  [H0] Trailing Spaces: fixed {count} name(s)')
    return []


def handle_split_id_weapons(units, rows, data_dir):
    """
    Canonicalize nameIds for guns whose KE and AoE ammo variants were given
    different IDs in the source data, so handle_merge_duplicate_weapons can
    merge them correctly.
    """
    total_fixed = 0
    for unit in units:
        for w in unit.get('weapons', []):
            canon = _SPLIT_ID_CANON.get(w.get('nameId', ''))
            if canon:
                w['nameId'] = canon
                total_fixed += 1
    print(f'  [H21b] Split-ID Weapons: normalized {total_fixed} nameId(s)')
    return []


def handle_merge_duplicate_weapons(units, rows, data_dir):
    """
    Merge weapons on the same unit that share a nameId but differ in at least
    one of ap or any range field.  Weapons that are truly identical (e.g. two
    copies of the same MG) are left as separate entries.
    """
    RANGE_FIELDS = {"rng_g", "rng_h", "rng_a", "rng_s", "minRange", "maxRange"}
    MAX_FIELDS   = {"dmg", "suppress"}
    DIFF_FIELDS  = {"ap"} | RANGE_FIELDS

    def differs(a, b):
        for f in DIFF_FIELDS:
            if a.get(f) != b.get(f):
                return True
        if set(a.get('tag', [])) != set(b.get('tag', [])):
            return True
        return False

    total_merged = 0

    for unit in units:
        weapons = unit.get('weapons', [])
        seen  = {}  # key -> weapon dict (merge target)
        order = []  # keys in insertion order

        for w in weapons:
            nid = w.get('nameId', '')
            if nid not in seen:
                seen[nid] = w
                order.append(nid)
            else:
                base = seen[nid]
                if not differs(base, w) or base.get('category') != w.get('category'):
                    unique_key = f'{nid}_{id(w)}'
                    seen[unique_key] = w
                    order.append(unique_key)
                    continue

                # Merge w into base
                base_aim       = base.get('aimTime')
                w_aim          = w.get('aimTime')
                base_tags_orig = set(base.get('tag', []))
                w_tags_orig    = set(w.get('tag', []))

                for k, v in w.items():
                    if k == 'tag':
                        existing = base.get('tag', [])
                        for t in v:
                            if t not in existing:
                                existing.append(t)
                        base['tag'] = existing
                    elif k in RANGE_FIELDS:
                        if k not in base or base[k] is None:
                            base[k] = v
                    elif k in MAX_FIELDS:
                        if v is not None and (base.get(k) is None or v > base[k]):
                            base[k] = v
                    else:
                        if k not in base or base[k] is None:
                            base[k] = v

                # Split aim time into AP/HE variants when the two weapons differ in
                # both their AP value (one is AP ammo, the other HE) and aim time.
                if (base.get('ap') != w.get('ap')
                        and base_aim is not None and w_aim is not None
                        and base_aim != w_aim):
                    base_is_ap = bool(base_tags_orig & {'KE', 'HEAT'})
                    w_is_ap    = bool(w_tags_orig    & {'KE', 'HEAT'})
                    if base_is_ap and not w_is_ap:
                        base['aimTimeAP'] = base_aim
                        base['aimTimeHE'] = w_aim
                        base.pop('aimTime', None)
                    elif w_is_ap and not base_is_ap:
                        base['aimTimeAP'] = w_aim
                        base['aimTimeHE'] = base_aim
                        base.pop('aimTime', None)

                total_merged += 1

        unit['weapons'] = [seen[k] for k in order]

    print(f'  [H22] Merge Duplicate Weapons: merged {total_merged} weapon pair(s)')
    return []


# ===========================================================================
# Data-patch handlers (file-driven, unique logic)
# ===========================================================================

def handle_turreted_weapons(units, rows, data_dir):
    count = 0
    unmatched = []

    for row in rows:
        if not row or not row[0].strip():
            continue

        raw_name   = row[0].strip()
        turret_col = row[1].strip() if len(row) > 1 else ''

        for base_name, _ in parse_names(raw_name):
            matches = find_weapons_across_units(units, base_name)
            if not matches:
                print(f'  [H1] WARNING: weapon "{base_name}" not found in JSON')
                unmatched.append(base_name)
                continue

            for unit, w in matches:
                if unit.get('type') != 'Helicopter':
                    continue
                if turret_col == 'Y':
                    w['turreted'] = True
                    count += 1
                elif turret_col == 'N':
                    w['turreted'] = False
                    count += 1

    print(f'  [H1] Turreted Weapons: set turreted on {count} weapon(s)')
    return unmatched


def handle_ship(units, rows, data_dir):
    ships_map = {}
    for row in rows:
        if len(row) >= 3:
            ships_map[row[0].strip().lower()] = {
                'sailing': row[1].strip(),
                'ciws':    row[2].strip(),
            }

    unit_names_lower = {(u.get('name') or '').lower() for u in units}

    for unit in units:
        key = (unit.get('name') or '').lower()
        if key not in ships_map:
            continue
        vals = ships_map[key]
        add_to_spreadsheet(unit, 'Ship')
        unit['sailing'] = vals['sailing']
        unit['ciws']    = vals['ciws']

    unmatched = [name for name in ships_map if name not in unit_names_lower]
    for name in unmatched:
        print(f'  [H11] WARNING: ship "{name}" not found in JSON')

    matched = len(ships_map) - len(unmatched)
    print(f'  [H11] Ship: patched {matched}/{len(ships_map)} ships')
    return unmatched


def handle_easter_eggs(units, rows, data_dir):
    unmatched = []
    count = 0
    for row in rows:
        if len(row) < 3:
            continue
        uid, target, new_name = row[0].strip(), row[1].strip(), row[2].strip()

        unit = find_unit_by_id(units, uid)
        if not unit:
            print(f'  [H12] WARNING: unit ID "{uid}" not found')
            unmatched.append(uid)
            continue

        if target.lower() == 'unit':
            unit['name'] = new_name
            count += 1
        else:
            weapon = next(
                (w for w in unit.get('weapons', [])
                 if (w.get('name') or '').lower() == target.lower()),
                None,
            )
            if weapon:
                weapon['name'] = new_name
                count += 1
            else:
                print(f'  [H12] WARNING: weapon "{target}" not found '
                      f'on unit "{unit.get("name")}"')

    print(f'  [H12] Easter Eggs: applied {count} rename(s)')
    return unmatched


def handle_turret(units, rows, data_dir):
    unmatched = []
    count = 0
    for row in rows:
        if not row or len(row) < 3:
            continue
        unit_name = row[0].strip()
        turret_val = row[1].strip().lower() == 'true'
        try:
            weapon_num = int(row[2].strip())
        except ValueError:
            print(f'  [H21] WARNING: invalid weapon number "{row[2]}" for unit "{unit_name}"')
            continue

        matched = find_units_by_name(units, unit_name)
        if not matched:
            print(f'  [H21] WARNING: unit "{unit_name}" not found in JSON')
            unmatched.append(unit_name)
            continue

        for unit in matched:
            weapons = unit.get('weapons', [])
            idx = weapon_num - 1
            if idx < 0 or idx >= len(weapons):
                print(f'  [H21] WARNING: unit "{unit.get("name")}" has no weapon #{weapon_num}')
                continue
            weapons[idx]['turreted'] = turret_val
            count += 1

    print(f'  [H21] Turret: set turreted on {count} weapon(s)')
    return unmatched


def handle_asm(units, rows, data_dir):
    dump_dict = {}
    unmatched = []
    for row in rows:
        if not row or len(row) < 3:
            continue
        name = row[0].strip()
        try:
            ap = int(row[1].strip())
        except ValueError:
            print(f'  [H20] WARNING: invalid AP "{row[1]}" for weapon "{name}"')
            continue
        try:
            rng_s = int(row[2].strip())
        except ValueError:
            print(f'  [H20] WARNING: invalid range "{row[2]}" for weapon "{name}"')
            continue

        nl = _strip_diacritics(name).lower()
        matches = [
            (u, w)
            for u in units
            for w in u.get('weapons', [])
            if (w.get('name') or '').lower() == nl and w.get('rng_s') == rng_s
        ]

        if not matches:
            print(f'  [H20] WARNING: weapon "{name}" with rng_s={rng_s} not found in JSON')
            unmatched.append(f'{name} (rng_s={rng_s})')
            continue

        for _, w in matches:
            w['ap'] = ap
            ensure_weapon_tag(w, 'SHIP')
            key = w.get('nameId') or w.get('name')
            if key not in dump_dict:
                dump_dict[key] = w

    save_json(os.path.join(data_dir, 'asm.json'), list(dump_dict.values()))
    print(f'  [H20] ASM: patched {len(dump_dict)} unique weapons')
    return unmatched


# ===========================================================================
# Weapon-tag handlers
# ===========================================================================

def handle_ac(units, rows, data_dir):
    count = 0
    for unit in units:
        if unit.get('type') not in ('Vehicle', 'Helicopter'):
            continue
        for w in unit.get('weapons', []):
            if w.get('category') != 'Gun':
                continue
            if (w.get('ap') or 0) < 1:
                continue
            dmg = w.get('dmg') or 0
            if not (AC_DMG_MIN <= dmg <= AC_DMG_MAX):
                continue
            if not (w.get('rng_h') or 0):
                continue
            rng_g = w.get('rng_g') or 0
            if not (AC_RANGE_MIN <= rng_g <= AC_RANGE_MAX):
                continue
            count += ensure_weapon_tag(w, 'AC')
    ac_units = []
    for unit in units:
        if any('AC' in w.get('tag', []) for w in unit.get('weapons', [])):
            add_to_spreadsheet(unit, 'Autocannon')
            ac_units.append(unit)
    save_json(os.path.join(data_dir, 'ac.json'), ac_units)
    save_json(os.path.join(data_dir, 'autocannons.json'), ac_units)
    print(f'  [H23] AC: tagged {count} weapon(s), {len(ac_units)} unit(s)')
    return []


def handle_mg(units, rows, data_dir):
    count = 0
    for unit in units:
        if unit.get('type') == 'Infantry':
            continue
        for w in unit.get('weapons', []):
            if w.get('category') != 'Gun':
                continue
            if (w.get('ap') or 0) != 0:
                continue
            dmg = w.get('dmg') or 0
            if not (MG_DMG_MIN <= dmg <= MG_DMG_MAX):
                continue
            if (w.get('rng_g') or 0) > MG_RANGE_MAX:
                continue
            if (w.get('rng_a') or 0) > 0:
                continue
            count += ensure_weapon_tag(w, 'MG')
    save_json(os.path.join(data_dir, 'mg.json'),
              [u for u in units if any('MG' in w.get('tag', []) for w in u.get('weapons', []))])
    print(f'  [H24] MG: tagged {count} weapon(s)')
    return []


def handle_gl(units, rows, data_dir):
    count = 0
    for unit in units:
        for w in unit.get('weapons', []):
            if w.get('category') != 'Gun':
                continue
            if (w.get('dmg') or 0) != GL_DMG:
                continue
            if (w.get('ap') or 0) != 0:
                continue
            rng_g = w.get('rng_g') or 0
            if not (GL_RANGE_MIN <= rng_g <= GL_RANGE_MAX):
                continue
            if (w.get('rng_a') or 0) > 0:
                continue
            if (w.get('rng_h') or 0) > 0:
                continue
            count += ensure_weapon_tag(w, 'GL')
    save_json(os.path.join(data_dir, 'gl.json'),
              [u for u in units if any('GL' in w.get('tag', []) for w in u.get('weapons', []))])
    print(f'  [H25] GL: tagged {count} weapon(s)')
    return []


def handle_atgm(units, rows, data_dir):
    dump_dict, unmatched = collect_weapons_from_file(
        units, rows, 'ATGM', 'atgm.json', data_dir, '[H6]')
    print(f'  [H6] ATGM: tagged {len(dump_dict)} unique weapons')
    return unmatched


def handle_atgm_tag(units, rows, data_dir):
    count = 0
    for unit in units:
        for w in unit.get('weapons', []):
            if w.get('category') != 'Missile':
                continue
            if not w.get('ap', 0):
                continue
            wtags = w.get('tag', [])
            if 'SHIP' in wtags or 'SEAD' in wtags or is_spaag_weapon(w):
                continue
            count += ensure_weapon_tag(w, 'ATGM')
    print(f'  [H27] ATGM Tag: tagged {count} weapon(s)')
    return []


def handle_bomb_tag(units, rows, data_dir):
    count = 0
    for unit in units:
        for w in unit.get('weapons', []):
            if not is_bomb_type(w):
                continue
            count += ensure_weapon_tag(w, 'BOMB')
    print(f'  [H28] BOMB Tag: tagged {count} weapon(s)')
    return []


def handle_autoloader(units, rows, data_dir):
    auto_count = 0
    for unit in units:
        if unit.get('type') != 'Vehicle':
            continue
        for w in unit.get('weapons', []):
            if w.get('category') != 'Gun':
                continue
            salvo_len = w.get('salvoLen') or 1
            ammo = w.get('ammo') or 0
            if salvo_len > 1 and ammo <= salvo_len and not (w.get('rng_h') or 0):
                auto_count += ensure_weapon_tag(w, 'AL')

    unmatched = []
    tsv_count = 0
    for row in rows:
        if not row or not row[0].strip():
            continue
        unit_name = row[0].strip()
        matched = find_units_by_name(units, unit_name)
        if not matched:
            print(f'  [H24] WARNING: unit "{unit_name}" not found in JSON')
            unmatched.append(unit_name)
            continue
        for unit in matched:
            weapons = unit.get('weapons', [])
            if weapons:
                tsv_count += ensure_weapon_tag(weapons[0], 'AL')

    dump = [u for u in units if any('AL' in w.get('tag', []) for w in u.get('weapons', []))]
    save_json(os.path.join(data_dir, 'autoloaders.json'), dump)
    print(f'  [H24] Autoloader: {auto_count} auto-detected, {tsv_count} from TSV, {len(dump)} total units')
    return unmatched


# ===========================================================================
# Unit-role handlers (auto-detect)
# ===========================================================================

# --- SPAAG ---

def handle_spaag(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Vehicle'
                and any(is_spaag_weapon(w) for w in u.get('weapons', [])))

    def tagger(u):
        count = 0
        for w in u.get('weapons', []):
            if is_spaag_weapon(w):
                count += ensure_weapon_tag(w, 'SPAAG')
        return count

    dump, tag_count = collect_units(units, pred, 'SPAAG', 'spaags.json', data_dir,
                                    weapon_tagger=tagger)
    print(f'  [H2] SPAAG: found {len(dump)} units, tagged {tag_count} weapon(s)')
    return []


# --- MLRS variants ---

def handle_hemlrs(units, rows, data_dir):
    def unit_pred(u):
        return any(w.get('category') == 'Artillery' and w.get('dmg', 0) >= HE_MLRS_MIN_DMG
                   for w in u.get('weapons', []))

    def tagger(u):
        count = 0
        for w in u.get('weapons', []):
            if w.get('category') == 'Artillery' and w.get('dmg', 0) >= HE_MLRS_MIN_DMG:
                count += ensure_weapon_tag(w, 'MLRS')
        return count

    dump, unmatched = collect_units_from_file(
        units, rows, 'HE MLRS', 'hemlrs.json', data_dir, '[H3]',
        unit_pred=unit_pred, weapon_tagger=tagger)
    print(f'  [H3] HE MLRS: tagged {len(dump)} units')
    return unmatched


def handle_clustermlrs(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Vehicle'
                and any('CLUS' in w.get('tag', []) for w in u.get('weapons', [])))

    def tagger(u):
        count = 0
        for w in u.get('weapons', []):
            if 'CLUS' in w.get('tag', []):
                count += ensure_weapon_tag(w, 'MLRS')
        return count

    dump, _ = collect_units(units, pred, 'Cluster MLRS', 'clustermlrs.json', data_dir,
                            weapon_tagger=tagger)
    print(f'  [H4] Cluster MLRS: found {len(dump)} units')
    return []


def handle_napalmmlrs(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Vehicle'
                and any(w.get('category') == 'Artillery' and has_napalm(w)
                        for w in u.get('weapons', [])))

    def tagger(u):
        count = 0
        for w in u.get('weapons', []):
            if w.get('category') == 'Artillery' and has_napalm(w):
                count += ensure_weapon_tag(w, 'MLRS')
        return count

    dump, _ = collect_units(units, pred, 'Napalm MLRS', 'napalmmlrs.json', data_dir,
                            weapon_tagger=tagger)
    print(f'  [H5] Napalm MLRS: found {len(dump)} units')
    return []


# --- Tube artillery ---

def _build_he_mlrs_names(rows):
    names = set()
    for row in rows:
        if row:
            for name, _ in parse_names(row[0]):
                names.add(name.lower())
    return names


def _tube_arty_units(units, he_mlrs_names):
    """Yield (unit, max_art_rng_g) for all tube-arty vehicles."""
    for unit in units:
        if unit.get('type') != 'Vehicle':
            continue
        if (unit.get('name') or '').lower() in he_mlrs_names:
            continue
        art_weapons = [
            w for w in unit.get('weapons', [])
            if w.get('category') == 'Artillery'
            and not w.get('ap', 0)
            and not has_napalm(w)
        ]
        if not art_weapons:
            continue
        yield unit, max(w.get('rng_g', 0) for w in art_weapons)


def handle_mortar(units, rows, data_dir):
    he_mlrs_names = _build_he_mlrs_names(rows)
    dump, seen = [], set()
    for unit, max_rng in _tube_arty_units(units, he_mlrs_names):
        if max_rng > MORTAR_MAX_RANGE:
            continue
        add_to_spreadsheet(unit, 'Mortar')
        for w in unit.get('weapons', []):
            if w.get('category') == 'Artillery' and not w.get('ap', 0) and not has_napalm(w):
                ensure_weapon_tag(w, 'MOR')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'mortars.json'), dump)
    print(f'  [H8a] Mortar: found {len(dump)} units')
    return []


def handle_howitzer(units, rows, data_dir):
    he_mlrs_names = _build_he_mlrs_names(rows)
    dump, seen = [], set()
    for unit, max_rng in _tube_arty_units(units, he_mlrs_names):
        if max_rng <= MORTAR_MAX_RANGE:
            continue
        add_to_spreadsheet(unit, 'Howitzer')
        for w in unit.get('weapons', []):
            if w.get('category') == 'Artillery' and not w.get('ap', 0) and not has_napalm(w):
                ensure_weapon_tag(w, 'HOW')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'howitzers.json'), dump)
    print(f'  [H8b] Howitzer: found {len(dump)} units')
    return []


# --- Bombers ---

def handle_hebomber(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Plane'
                and any(has_he_bomb(w) and (w.get('dmg') or 0) >= HE_BOMB_MIN_DMG
                        for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'HE Bomber', 'hebomber.json', data_dir)
    print(f'  [H7] HE Bomber: found {len(dump)} units')
    return []


def handle_clusterbomber(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Plane'
                and any('CLUS' in w.get('tag', []) for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'Cluster Bomber', 'clusterbombers.json', data_dir)
    print(f'  [H13] Cluster Bomber: found {len(dump)} units')
    return []


def handle_naplmbomber(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Plane'
                and any(has_napalm(w) for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'Napalm Bomber', 'naplmbombers.json', data_dir)
    print(f'  [H13b] Napalm Bomber: found {len(dump)} units')
    return []


# --- Tank ---

def handle_tank(units, rows, data_dir):
    def pred(u):
        if u.get('type') != 'Vehicle' or u.get('command'):
            return False
        if (u.get('health') or 0) < TANK_MIN_HEALTH:
            return False
        if (u.get('armor', {}).get('S') or 0) < TANK_MIN_SIDE_ARMOR:
            return False
        return any(w.get('category') == 'Gun'
                   and (w.get('rng_g') or 0) >= TANK_GUN_MIN_RANGE
                   and not (w.get('rng_h') or 0)
                   and (w.get('dmg') or 0) >= TANK_MIN_DMG
                   and (w.get('ap') or 0) >= TANK_MIN_AP
                   for w in u.get('weapons', []))

    dump, _ = collect_units(units, pred, 'Tank', 'tanks.json', data_dir)
    print(f'  [H10] Tank: found {len(dump)} units')
    return []


# --- AA ---

def handle_aahelo(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Helicopter'
                and any(w.get('category') == 'Missile' and has_plane_range(w)
                        for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'AA Helo', 'aahelos.json', data_dir)
    print(f'  [H9] AA Helo: found {len(dump)} units')
    return []


def handle_missileaa(units, rows, data_dir):
    """Dual-classification: Plane Missile AA and/or Helo Missile AA."""
    plane_dump, helo_dump = [], []
    plane_seen, helo_seen = set(), set()

    for unit in units:
        if unit.get('type') != 'Vehicle':
            continue
        missiles = [w for w in unit.get('weapons', [])
                    if w.get('category') == 'Missile' and not is_spaag_weapon(w)]
        if not missiles:
            continue

        is_plane_aa = any(w.get('rng_a', 0) >= PLANE_AA_RANGE for w in missiles)
        is_helo_aa  = (
            any(0 < w.get('rng_a', 0) < PLANE_AA_RANGE for w in missiles)
            or (is_plane_aa and any(w.get('rng_h', 0) >= PLANE_AA_RANGE for w in missiles))
        )

        uid = unit['id']
        if is_plane_aa or is_helo_aa:
            for w in missiles:
                if w.get('rng_a', 0) > 0:
                    ensure_weapon_tag(w, 'SAM')
        if is_plane_aa:
            add_to_spreadsheet(unit, 'Plane Missile AA')
            if uid not in plane_seen:
                plane_dump.append(unit)
                plane_seen.add(uid)
        if is_helo_aa:
            add_to_spreadsheet(unit, 'Helo Missile AA')
            if uid not in helo_seen:
                helo_dump.append(unit)
                helo_seen.add(uid)

    save_json(os.path.join(data_dir, 'planemissileaa.json'), plane_dump)
    save_json(os.path.join(data_dir, 'helomissileaa.json'), helo_dump)
    print(f'  [H15] Missile AA: {len(plane_dump)} plane AA, {len(helo_dump)} helo AA')
    return []


def handle_manpad(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Infantry'
                and any(w.get('category') == 'Missile' and has_plane_range(w)
                        for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'Manpad', 'manpads.json', data_dir)
    print(f'  [H14] Manpad: found {len(dump)} units')
    return []


def handle_rocketpodhelo(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Helicopter'
                and any(w.get('category') == 'Gun' and w.get('rng_g', 0) >= ROCKET_POD_MIN_RANGE
                        for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'Rocket Pod Helo', 'rocketpodhelos.json', data_dir)
    print(f'  [H16] Rocket Pod Helo: found {len(dump)} units')
    return []


# --- ASF / SEAD ---

def _has_ship_weapon(weapons):
    return any('SHIP' in w.get('tag', []) for w in weapons)


def _has_plane_range_3150(weapons):
    return any(w.get('rng_a', 0) >= PLANE_AA_RANGE for w in weapons)


def handle_asf(units, rows, data_dir):
    def pred(u):
        if (u.get('airOptics') or 0) < ASF_AIR_OPTICS_MIN:
            return False
        weapons = u.get('weapons', [])
        return not _has_ship_weapon(weapons) and _has_plane_range_3150(weapons)

    dump, _ = collect_units(units, pred, 'ASF', 'asfs.json', data_dir)
    print(f'  [H17] ASF: tagged {len(dump)} units')
    return []


def handle_sead(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Plane'
                and any(w.get('category') == 'Missile' and 'SEAD' in w.get('tag', [])
                        for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'SEAD', 'sead.json', data_dir)
    print(f'  [H19] SEAD: found {len(dump)} units')
    return []


# --- ATGM variants ---

def handle_atgmplane(units, rows, data_dir):
    dump, seen, unmatched = [], set(), []
    for row in rows:
        if not row:
            continue
        for base_name, _ in parse_names(row[0]):
            matched = find_units_by_name(units, base_name)
            if not matched:
                print(f'  [H18] WARNING: unit "{base_name}" not found in JSON')
                unmatched.append(base_name)
                continue
            for unit in matched:
                has_atgm = any(
                    w.get('category') == 'Missile' and w.get('ap', 0)
                    for w in unit.get('weapons', [])
                )
                if not has_atgm:
                    print(f'  [H18] SKIP: "{unit.get("name")}" matched by name but has no AP missile')
                    continue
                add_to_spreadsheet(unit, 'ATGM Plane')
                uid = unit['id']
                if uid not in seen:
                    dump.append(unit)
                    seen.add(uid)
    save_json(os.path.join(data_dir, 'atgmplanes.json'), dump)
    print(f'  [H18] ATGM Plane: tagged {len(dump)} units')
    return unmatched


def handle_atgmvehicle(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Vehicle'
                and not u.get('command')
                and any(is_atgm_missile(w) for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'ATGM Vehicle', 'atgmvehicles.json', data_dir)
    print(f'  [H18a] ATGM Vehicle: found {len(dump)} units')
    return []


def handle_atgmhelo(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Helicopter'
                and not u.get('command')
                and any(is_atgm_missile(w) for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'ATGM Helo', 'atgmhelos.json', data_dir)
    print(f'  [H18b] ATGM Helo: found {len(dump)} units')
    return []


def handle_atgminfantry(units, rows, data_dir):
    def pred(u):
        return (u.get('type') == 'Infantry'
                and not u.get('command')
                and any(is_atgm_missile(w) for w in u.get('weapons', [])))

    dump, _ = collect_units(units, pred, 'ATGM Infantry', 'atgminfantry.json', data_dir)
    print(f'  [H18c] ATGM Infantry: found {len(dump)} units')
    return []


# ===========================================================================
# Post-processing handlers
# ===========================================================================

PACT_NATIONS = {'URSS', 'RDA', 'POL', 'FIN', 'YUG', 'TCH', 'CHI', 'NK'}


def handle_deck_indices(units, deck_data, data_dir):
    """
    Stamp deckIndex, deckCat, and deckSide onto units from deck_indices.json.

    deck_indices.json is produced by:
        python scripts/extract.py <ndfbin> --extract-deck --deck-file data/deck_indices.json

    Fields added to each matched unit:
        deckIndex  int         10-bit index used in binary deck codes
        deckCat    'A'|'B'|'C' transport category (A=naval inf, B=ground inf, C=standalone)
        deckSide   'BLUFOR'|'REDFOR'
    """
    if not isinstance(deck_data, dict):
        print('  [H30] Deck Indices: unexpected format — skipping')
        return []

    nation_by_id = {u['id']: u.get('nation', '') for u in units if 'id' in u}

    id_map = {}
    for entry in deck_data.get('blufor', []):
        uid = entry['id']
        if nation_by_id.get(uid, '') not in PACT_NATIONS:
            id_map[uid] = {
                'deckIndex': entry['index'],
                'deckCat':   entry['cat'],
                'deckSide':  'BLUFOR',
            }
    for entry in deck_data.get('redfor', []):
        uid = entry['id']
        if nation_by_id.get(uid, '') in PACT_NATIONS:
            id_map[uid] = {
                'deckIndex': entry['index'],
                'deckCat':   entry['cat'],
                'deckSide':  'REDFOR',
            }

    count = 0
    for unit in units:
        entry = id_map.get(unit.get('id', ''))
        if entry:
            unit.update(entry)
            count += 1

    print(f'  [H30] Deck Indices: stamped {count}/{len(units)} units '
          f'({len(id_map)} entries in deck_indices.json)')
    return []


def handle_unit_tags(units, rows, data_dir):
    for unit in units:
        utype = unit.get('type', '')
        tags = []

        t = _TYPE_TAG.get(utype)
        if t:
            tags.append(t)

        if unit.get('capacity') is not None and utype != 'FOB':
            tags.append('SUPPL')
        if (unit.get('optics') or 0) >= RECON_OPTICS_MIN and utype != 'Ship':
            tags.append('RECON')
        if utype == 'Vehicle' and unit.get('isTransport'):
            tags.append('TRANS')
        if unit.get('command'):
            tags.append('CMD')
        if unit.get('amphibious'):
            tags.append('AMPH')

        motion = unit.get('motionType', '')
        if motion == 'wheeled':
            tags.append('WHEEL')
        elif motion == 'tracked':
            tags.append('TRACK')
        elif motion == 'truck':
            tags.append('TRUCK')

        f = (unit.get('armor') or {}).get('F') or 0
        thresh = 1 if utype == 'Helicopter' else 2 if utype == 'Plane' else 4
        if f >= thresh and utype in ('Vehicle', 'Helicopter', 'Plane'):
            tags.append('ARMOR')

        training = unit.get('training')
        if utype == 'Infantry' and training is not None:
            tags.append(('RESRV', 'REG', 'SHOCK', 'ELITE')[min(training, 3)])

        unit['ownTags'] = tags

    print(f'  [H29] Unit Tags: computed ownTags for {len(units)} units')
    return []


# ===========================================================================
# Handler registry
# Each entry: (display_name, handler_fn, input_file_or_None)
#   input_file: filename relative to data_dir; None = auto-detect (no file needed)
# ===========================================================================

HANDLERS = [
    ('Exclude',         handle_exclude,          'exclude.txt'),
    ('Trailing Spaces', handle_trailing_spaces,  None),
    ('Split-ID Weapons',        handle_split_id_weapons,         None),
    ('Merge Duplicate Weapons', handle_merge_duplicate_weapons,  None),
    ('Turreted Weapons', handle_turreted_weapons, 'turreted_weapons.tsv'),
    ('Turret',           handle_turret,           'turrets.tsv'),
    ('SPAAG',           handle_spaag,         None),
    ('HE MLRS',         handle_hemlrs,        'hemlrs.txt'),
    ('Cluster MLRS',    handle_clustermlrs,   None),
    ('Napalm MLRS',     handle_napalmmlrs,    None),
    ('ATGM',            handle_atgm,          'atgms.txt'),
    ('HE Bomber',       handle_hebomber,      None),
    ('Mortar',          handle_mortar,        'hemlrs.txt'),   # hemlrs.txt used as exclusion list
    ('Howitzer',        handle_howitzer,      'hemlrs.txt'),   # hemlrs.txt used as exclusion list
    ('Autoloader',      handle_autoloader,     'autoloader.tsv'),
    ('AA Helo',         handle_aahelo,        None),
    ('Tank',            handle_tank,          None),
    ('Ship',            handle_ship,          'ships.tsv'),
    ('Easter Eggs',     handle_easter_eggs,   'eastereggs.tsv'),
    ('Cluster Bomber',  handle_clusterbomber, None),
    ('Napalm Bomber',   handle_naplmbomber,   None),
    ('Manpad',          handle_manpad,        None),
    ('Missile AA',      handle_missileaa,     None),
    ('Rocket Pod Helo', handle_rocketpodhelo, None),
    ('ASF',             handle_asf,           None),
    ('ATGM Plane',      handle_atgmplane,     'atgmplanes.txt'),
    ('SEAD',            handle_sead,           None),
    ('ASM',             handle_asm,            'asm.tsv'),
    ('ATGM Vehicle',    handle_atgmvehicle,   None),
    ('ATGM Infantry',   handle_atgminfantry,  None),
    ('ATGM Helo',       handle_atgmhelo,      None),
    ('AC',              handle_ac,             None),
    ('MG',              handle_mg,             None),
    ('GL',              handle_gl,             None),
    ('ATGM Tag',        handle_atgm_tag,       None),
    ('BOMB Tag',        handle_bomb_tag,       None),
    ('Deck Indices',    handle_deck_indices,   'deck_indices.json'),
    ('Unit Tags',       handle_unit_tags,      None),
]


# ===========================================================================
# Main
# ===========================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Enrich data/master.json with role metadata from spreadsheets '
                    'and auto-detection rules.')
    parser.add_argument(
        '--data-dir', '-d', default='data',
        metavar='DIR',
        help='Directory containing master.json and all input files (default: data)')
    parser.add_argument(
        '--out-dir', '-o', default=None,
        metavar='DIR',
        help='Directory to write units.json and per-handler dump files '
             '(default: same as --data-dir)')
    args = parser.parse_args()
    data_dir = args.data_dir
    out_dir  = args.out_dir if args.out_dir is not None else data_dir

    master_path = os.path.join(data_dir, 'master.json')
    output_path = os.path.join(out_dir,  'units.json')

    if not os.path.exists(master_path):
        print(f'ERROR: master.json not found at {master_path}', file=sys.stderr)
        sys.exit(1)

    # Safety: never let the output path overwrite master.json
    if os.path.abspath(output_path) == os.path.abspath(master_path):
        print('ERROR: output path collides with master.json — aborting.', file=sys.stderr)
        sys.exit(1)

    print(f'Loading {master_path} ...')
    units = load_json(master_path)
    print(f'Loaded {len(units)} units.')

    # Normalise names before any handler runs
    changes = normalise_names(units)
    if changes:
        print(f'Normalised {len(changes)} name(s):')
        for kind, before, after in changes:
            print(f'  [{kind}] {ascii(before)} -> {ascii(after)}')
    else:
        print('No name normalisation needed.')
    print()

    all_unmatched = {}  # handler_name -> list of unmatched entries

    for display_name, handler_fn, input_file in HANDLERS:
        print(f'--- {display_name} ---')
        rows = []

        if input_file is not None:
            file_path = os.path.join(data_dir, input_file)
            if not os.path.exists(file_path):
                print(f'  [SKIP] {input_file} not found — skipping {display_name}\n')
                continue
            if input_file.endswith('.json'):
                rows = load_json(file_path)  # parsed dict/list, not TSV rows
            else:
                rows = parse_file(file_path)
                # firesupport.tsv has a header row — detect and skip it
                if rows and rows[0][0].strip().lower() in ('name', 'weapon', 'unit name'):
                    rows = rows[1:]

        unmatched = handler_fn(units, rows, out_dir)
        if unmatched:
            all_unmatched[display_name] = unmatched
        print()

    # Write enriched copy (master.json is never touched)
    print(f'Saving enriched JSON to {output_path} ...')
    save_json(output_path, units)
    print('Done.\n')

    # End-of-run unmatched summary
    if all_unmatched:
        print('=' * 60)
        print('UNMATCHED ENTRIES SUMMARY')
        print('=' * 60)
        for handler_name, names in all_unmatched.items():
            print(f'\n{handler_name} ({len(names)} unmatched):')
            for n in names:
                print(f'  "{n}"')
        print()
    else:
        print('All entries matched successfully.')


if __name__ == '__main__':
    main()
