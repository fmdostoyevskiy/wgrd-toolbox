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


# ---------------------------------------------------------------------------
# Name normalisation  (runs before any handler, on every unit/weapon name)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# I/O utilities
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Name / label helpers
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Lookup helpers (all case-insensitive)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Auto-detect predicates
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Handler 1 — Fire Support  (weapons, firesupport.tsv)
# ---------------------------------------------------------------------------
# firesupport.tsv columns (0-indexed, header row skipped):
#   0:Name  1:Unit  2:HE  3:AP  4:Range  5:Acc.  6:Stab.
#   7:Salvo  8:Shot Reload  9:Salvo Reload  10:Turret

def handle_firesupport(units, rows, data_dir):
    label = 'firesupport'
    dump_dict = {}   # nameId -> weapon object (deduplication)
    unmatched = []

    for row in rows:
        if not row or not row[0].strip():
            continue

        raw_name   = row[0].strip()
        acc_raw    = row[5].strip().rstrip('%') if len(row) > 5 else ''
        stab_raw   = row[6].strip().rstrip('%') if len(row) > 6 else ''
        turret_col = row[-1].strip() if row else ''

        try:
            acc_csv = int(acc_raw) if acc_raw else None
        except ValueError:
            acc_csv = None
        try:
            stab_csv = int(stab_raw) if stab_raw else None
        except ValueError:
            stab_csv = None

        for base_name, variant in parse_names(raw_name):
            matches = find_weapons_across_units(units, base_name)
            if not matches:
                print(f'  [H1] WARNING: weapon "{base_name}" not found in JSON')
                unmatched.append(base_name)
                continue

            if variant:
                filtered = [
                    (u, w) for u, w in matches
                    if (acc_csv is None or w.get('acc') == acc_csv)
                    and (stab_csv is None or w.get('stab') == stab_csv)
                ]
                if not filtered:
                    print(f'  [H1] WARNING: weapon "{base_name}" — no match for '
                          f'acc={acc_csv}, stab={stab_csv} (variant {variant})')
                    unmatched.append(f'{base_name} {variant}')
                    # Fall back: apply labels to all same-name weapons but do NOT
                    # rename them — renaming would break subsequent lookups for
                    # other variants of the same base weapon name.
                    for _, w in matches:
                        add_to_spreadsheet(w, label)
                        if turret_col == 'Y':
                            w['turreted'] = True
                        elif turret_col == 'N':
                            w['turreted'] = False
                        key = w.get('nameId') or w.get('name')
                        if key not in dump_dict:
                            dump_dict[key] = w
                    continue
                for _, w in filtered:
                    w['name'] = f'{base_name} {variant}'
                matches = filtered

            for _, w in matches:
                add_to_spreadsheet(w, label)
                if turret_col == 'Y':
                    w['turreted'] = True
                elif turret_col == 'N':
                    w['turreted'] = False
                # Collect unique weapons by nameId (fall back to name if absent)
                key = w.get('nameId') or w.get('name')
                if key not in dump_dict:
                    dump_dict[key] = w

    save_json(os.path.join(data_dir, 'firesupport.json'), list(dump_dict.values()))
    print(f'  [H1] Fire Support: tagged {len(dump_dict)} unique weapons')
    return unmatched


# ---------------------------------------------------------------------------
# Handler 2 — SPAAG  (auto-detect: Vehicle + AA-capable gun weapon)
#
# Two weapon types qualify:
#   1. category == "Gun" with rng_a > 0  — basic non-radar AA guns (ZSU-23-4, etc.)
#   2. category == "Missile" with RAD tag, no GUID, no FnF, rng_a > 0
#      — radar-guided autocannons (Gepard, Marksman, Tunguska, etc.)
#      The game stores these under "Missile" because radar tracking is a
#      missile-engine feature, but they are physically gun systems.
#      Excluding GUID filters out SAMs; excluding FnF filters out NASAMS.
# ---------------------------------------------------------------------------

def _is_spaag_weapon(w):
    if not has_plane_range(w):
        return False
    if w.get('category') == 'Gun':
        return True
    tags = w.get('tag', [])
    return (w.get('category') == 'Missile'
            and 'RAD' in tags
            and 'GUID' not in tags
            and 'FnF' not in tags)


def handle_spaag(units, rows, data_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('type') != 'Vehicle':
            continue
        if not any(_is_spaag_weapon(w) for w in unit.get('weapons', [])):
            continue
        add_to_spreadsheet(unit, 'SPAAG')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'spaags.json'), dump)
    print(f'  [H2] SPAAG: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler 3 — HE MLRS  (hemlrs.txt + dmg >= 6 validation)
# ---------------------------------------------------------------------------

def handle_hemlrs(units, rows, data_dir):
    dump, seen, unmatched = [], set(), []
    for row in rows:
        if not row:
            continue
        for base_name, _ in parse_names(row[0]):
            matched = find_units_by_name(units, base_name)
            if not matched:
                print(f'  [H3] WARNING: unit "{base_name}" not found in JSON')
                unmatched.append(base_name)
                continue
            for unit in matched:
                # Must have at least one artillery weapon with dmg >= 6
                if not any(
                    w.get('category') == 'Artillery' and w.get('dmg', 0) >= 6
                    for w in unit.get('weapons', [])
                ):
                    continue
                add_to_spreadsheet(unit, 'HE MLRS')
                uid = unit['id']
                if uid not in seen:
                    dump.append(unit)
                    seen.add(uid)
    save_json(os.path.join(data_dir, 'hemlrs.json'), dump)
    print(f'  [H3] HE MLRS: tagged {len(dump)} units')
    return unmatched


# ---------------------------------------------------------------------------
# Handler 4 — Cluster MLRS  (auto-detect: Vehicle + weapon with CLUS tag)
# ---------------------------------------------------------------------------

def handle_clustermlrs(units, rows, data_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('type') != 'Vehicle':
            continue
        if not any('CLUS' in w.get('tag', [])
                   for w in unit.get('weapons', [])):
            continue
        add_to_spreadsheet(unit, 'Cluster MLRS')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'clustermlrs.json'), dump)
    print(f'  [H4] Cluster MLRS: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler 5 — Napalm MLRS  (auto-detect: Vehicle + Artillery with NPLM tag)
# ---------------------------------------------------------------------------

def handle_napalmmlrs(units, rows, data_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('type') != 'Vehicle':
            continue
        if not any(w.get('category') == 'Artillery' and has_napalm(w)
                   for w in unit.get('weapons', [])):
            continue
        add_to_spreadsheet(unit, 'Napalm MLRS')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'napalmmlrs.json'), dump)
    print(f'  [H5] Napalm MLRS: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler 6 — ATGM  (weapons, atgms.txt)
# ---------------------------------------------------------------------------

def handle_atgm(units, rows, data_dir):
    dump_dict = {}
    unmatched = []
    for row in rows:
        if not row:
            continue
        for base_name, _ in parse_names(row[0]):
            matches = find_weapons_across_units(units, base_name)
            if not matches:
                print(f'  [H6] WARNING: weapon "{base_name}" not found in JSON')
                unmatched.append(base_name)
                continue
            for _, w in matches:
                add_to_spreadsheet(w, 'ATGM')
                key = w.get('nameId') or w.get('name')
                if key not in dump_dict:
                    dump_dict[key] = w
    save_json(os.path.join(data_dir, 'atgm.json'), list(dump_dict.values()))
    print(f'  [H6] ATGM: tagged {len(dump_dict)} unique weapons')
    return unmatched


# ---------------------------------------------------------------------------
# Handler 7 — HE Bomber  (auto-detect: Plane + HE bomb-type weapon)
# ---------------------------------------------------------------------------

def handle_hebomber(units, rows, data_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('type') != 'Plane':
            continue
        if not any(has_he_bomb(w) for w in unit.get('weapons', [])):
            continue
        add_to_spreadsheet(unit, 'HE Bomber')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'hebomber.json'), dump)
    print(f'  [H7] HE Bomber: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler 8 — Tube Arty  (auto-detect; hemlrs.txt used as exclusion list)
# ---------------------------------------------------------------------------

def handle_tubearty(units, rows, data_dir):
    # Build HE MLRS name exclusion set from hemlrs.txt rows
    he_mlrs_names = set()
    for row in rows:
        if row:
            for name, _ in parse_names(row[0]):
                he_mlrs_names.add(name.lower())

    dump, seen = [], set()
    for unit in units:
        if unit.get('type') != 'Vehicle':
            continue
        if (unit.get('name') or '').lower() in he_mlrs_names:
            continue
        if not any(
            w.get('category') == 'Artillery'
            and not w.get('ap', 0)
            and not has_napalm(w)
            for w in unit.get('weapons', [])
        ):
            continue
        add_to_spreadsheet(unit, 'Tube Arty')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'tubearty.json'), dump)
    print(f'  [H8] Tube Arty: found {len(dump)} units '
          f'(excluded {len(he_mlrs_names)} HE MLRS names)')
    return []


# ---------------------------------------------------------------------------
# Handler 9 — AA Helo  (auto-detect: Helicopter + Missile with rng_a > 0)
# ---------------------------------------------------------------------------

def handle_aahelo(units, rows, data_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('type') != 'Helicopter':
            continue
        if not any(w.get('category') == 'Missile' and has_plane_range(w)
                   for w in unit.get('weapons', [])):
            continue
        add_to_spreadsheet(unit, 'AA Helo')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'aahelos.json'), dump)
    print(f'  [H9] AA Helo: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler 10 — Superheavy  (auto-detect: tab=TNK, cost >= 155)
# ---------------------------------------------------------------------------

def handle_superheavy(units, rows, data_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('tab') != 'TNK':
            continue
        if unit.get('cost', 0) < 155:
            continue
        add_to_spreadsheet(unit, 'Superheavy')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'superheavies.json'), dump)
    print(f'  [H10] Superheavy: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler 11 — Ship  (ships.tsv: Name, Sailing, CIWS)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Handler 12 — Easter Eggs  (eastereggs.txt: ID, target, new_name)
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Handler 13 — Cluster Bomber  (auto-detect: Plane + weapon with CLUS tag)
# ---------------------------------------------------------------------------

def handle_clusterbomber(units, rows, data_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('type') != 'Plane':
            continue
        if not any('CLUS' in w.get('tag', [])
                   for w in unit.get('weapons', [])):
            continue
        add_to_spreadsheet(unit, 'Cluster Bomber')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'clusterbombers.json'), dump)
    print(f'  [H13] Cluster Bomber: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler 14 — Manpad  (auto-detect: Infantry + Missile with rng_a > 0)
# ---------------------------------------------------------------------------

def handle_manpad(units, rows, data_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('type') != 'Infantry':
            continue
        if not any(w.get('category') == 'Missile' and has_plane_range(w)
                   for w in unit.get('weapons', [])):
            continue
        add_to_spreadsheet(unit, 'Manpad')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'manpads.json'), dump)
    print(f'  [H14] Manpad: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler 15 — Missile AA  (auto-detect: Vehicle + Missile; two labels)
#
# Plane Missile AA : any missile with rng_a >= 3150
# Helo Missile AA  : any missile with 0 < rng_a < 3150
#                    OR (is Plane AA AND any missile with rng_h >= 3150)
# A unit can receive both labels; both dump files may overlap.
# ---------------------------------------------------------------------------

def handle_missileaa(units, rows, data_dir):
    plane_dump, helo_dump = [], []
    plane_seen, helo_seen = set(), set()

    for unit in units:
        if unit.get('type') != 'Vehicle':
            continue
        # Exclude SPAAG weapons — radar autocannons are stored as category
        # "Missile" in the JSON but are not SAMs and should not count here.
        missiles = [w for w in unit.get('weapons', [])
                    if w.get('category') == 'Missile' and not _is_spaag_weapon(w)]
        if not missiles:
            continue

        is_plane_aa = any(w.get('rng_a', 0) >= 3150 for w in missiles)
        is_helo_aa  = (
            any(0 < w.get('rng_a', 0) < 3150 for w in missiles)
            or (is_plane_aa and any(w.get('rng_h', 0) >= 3150 for w in missiles))
        )

        uid = unit['id']
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


# ---------------------------------------------------------------------------
# Handler 16 — Rocket Pod Helo  (auto-detect: Helicopter + Gun, rng_g >= 2100)
# ---------------------------------------------------------------------------

def handle_rocketpodhelo(units, rows, data_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('type') != 'Helicopter':
            continue
        if not any(w.get('category') == 'Gun' and w.get('rng_g', 0) >= 2100
                   for w in unit.get('weapons', [])):
            continue
        add_to_spreadsheet(unit, 'Rocket Pod Helo')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(data_dir, 'rocketpodhelos.json'), dump)
    print(f'  [H16] Rocket Pod Helo: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler 17 — ASF  (asfs.txt)
# ---------------------------------------------------------------------------

def handle_asf(units, rows, data_dir):
    dump, seen, unmatched = [], set(), []
    for row in rows:
        if not row:
            continue
        for base_name, _ in parse_names(row[0]):
            matched = find_units_by_name(units, base_name)
            if not matched:
                print(f'  [H17] WARNING: unit "{base_name}" not found in JSON')
                unmatched.append(base_name)
                continue
            for unit in matched:
                add_to_spreadsheet(unit, 'ASF')
                uid = unit['id']
                if uid not in seen:
                    dump.append(unit)
                    seen.add(uid)
    save_json(os.path.join(data_dir, 'asfs.json'), dump)
    print(f'  [H17] ASF: tagged {len(dump)} units')
    return unmatched


# ---------------------------------------------------------------------------
# Handler 18 — ATGM Plane  (atgmplanes.txt)
# ---------------------------------------------------------------------------

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
                add_to_spreadsheet(unit, 'ATGM Plane')
                uid = unit['id']
                if uid not in seen:
                    dump.append(unit)
                    seen.add(uid)
    save_json(os.path.join(data_dir, 'atgmplanes.json'), dump)
    print(f'  [H18] ATGM Plane: tagged {len(dump)} units')
    return unmatched


# ---------------------------------------------------------------------------
# Handler 19 — SEAD  (auto-detect: Plane or Helicopter + Missile with SEAD tag)
# ---------------------------------------------------------------------------

def handle_sead(units, rows, out_dir):
    dump, seen = [], set()
    for unit in units:
        if unit.get('type') not in ('Plane', 'Helicopter'):
            continue
        if not any(w.get('category') == 'Missile' and 'SEAD' in w.get('tag', [])
                   for w in unit.get('weapons', [])):
            continue
        add_to_spreadsheet(unit, 'SEAD')
        uid = unit['id']
        if uid not in seen:
            dump.append(unit)
            seen.add(uid)
    save_json(os.path.join(out_dir, 'sead.json'), dump)
    print(f'  [H19] SEAD: found {len(dump)} units')
    return []


# ---------------------------------------------------------------------------
# Handler registry
# Each entry: (display_name, handler_fn, input_file_or_None)
#   input_file: filename relative to data_dir; None = auto-detect (no file needed)
# ---------------------------------------------------------------------------

HANDLERS = [
    ('Fire Support',    handle_firesupport,  'firesupport.tsv'),
    ('SPAAG',           handle_spaag,         None),
    ('HE MLRS',         handle_hemlrs,        'hemlrs.txt'),
    ('Cluster MLRS',    handle_clustermlrs,   None),
    ('Napalm MLRS',     handle_napalmmlrs,    None),
    ('ATGM',            handle_atgm,          'atgms.txt'),
    ('HE Bomber',       handle_hebomber,      None),
    ('Tube Arty',       handle_tubearty,      'hemlrs.txt'),   # used as exclusion list
    ('AA Helo',         handle_aahelo,        None),
    ('Superheavy',      handle_superheavy,    None),
    ('Ship',            handle_ship,          'ships.tsv'),
    ('Easter Eggs',     handle_easter_eggs,   'eastereggs.tsv'),
    ('Cluster Bomber',  handle_clusterbomber, None),
    ('Manpad',          handle_manpad,        None),
    ('Missile AA',      handle_missileaa,     None),
    ('Rocket Pod Helo', handle_rocketpodhelo, None),
    ('ASF',             handle_asf,           'asfs.txt'),
    ('ATGM Plane',      handle_atgmplane,     'atgmplanes.txt'),
    ('SEAD',            handle_sead,           None),
]


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

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
