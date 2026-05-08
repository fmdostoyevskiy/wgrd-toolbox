#!/usr/bin/env python3
"""
extract_wrd.py — Wargame: Red Dragon full unit data extractor

All property paths and conversion factors sourced from:
  - pvutov/armory  Armory/src/UnitDatabase.cs
  - ResidentMario/wargame  Wargame_Internal_Values_Manual.tex

Modes:
  --inspect ALIAS     Dump all module properties for a unit by AliasName
  --classes           List all class names
  --extract           Output schema-conforming JSON to stdout
  --extract-raw       Dump raw unit objects for debugging
  --extract-deck      Extract deck code serialization indices (TShowRoomDeckSerializer)
  --inspect-deck-serializer  Dump TShowRoomDeckSerializer for debugging

Usage (Windows PowerShell):
  python extract_wrd.py everythingdecompressed.ndfbin --inspect DRAGONER > out.txt
  python extract_wrd.py everythingdecompressed.ndfbin --classes | Select-String -Pattern "unite|descriptor" -CaseSensitive:$false
  python extract_wrd.py everythingdecompressed.ndfbin --extract > units.json
"""

import struct
import json
import sys
import argparse
from typing import Optional

# Force UTF-8 output on Windows (default cp1252 can't handle e.g. Polish characters)
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# ---------------------------------------------------------------------------
# Parsing primitives
# ---------------------------------------------------------------------------

def read_u32(data, offset):
    return struct.unpack_from('<I', data, offset)[0], offset + 4

def read_i32(data, offset):
    return struct.unpack_from('<i', data, offset)[0], offset + 4

def read_string(data, offset):
    length, offset = read_i32(data, offset)
    s = data[offset:offset + length].decode('iso-8859-1')
    return s, offset + length

NDF_BOOLEAN         = 0x00000000
NDF_INT8            = 0x00000001
NDF_INT32           = 0x00000002
NDF_UINT32          = 0x00000003
NDF_FLOAT32         = 0x00000005
NDF_FLOAT64         = 0x00000006
NDF_TABLE_STRING    = 0x00000007
NDF_WIDE_STRING     = 0x00000008
NDF_REFERENCE       = 0x00000009
NDF_VECTOR          = 0x0000000b
NDF_COLOR128        = 0x0000000c
NDF_COLOR32         = 0x0000000d
NDF_LIST            = 0x00000011
NDF_MAPLIST         = 0x00000012
NDF_MAP             = 0x00000022
NDF_INT16           = 25
NDF_GUID            = 26
NDF_LOCALISATION    = 29
NDF_FLOAT64_2       = 33
NDF_TABLE_STR_FILE  = 0x0000001C
NDF_OBJ_REF         = 0xBBBBBBBB
NDF_TRAN_REF        = 0xAAAAAAAA
NDF_UNKNOWN         = 0xFFFFFFFF
NDF_UNSET           = 0xEEEEEEEE

TYPE_SIZES = {
    NDF_BOOLEAN: 1, NDF_INT8: 1, NDF_INT16: 2,
    NDF_INT32: 4, NDF_UINT32: 4, NDF_FLOAT32: 4,
    NDF_FLOAT64: 8, NDF_FLOAT64_2: 8,
    NDF_TABLE_STRING: 4, NDF_TABLE_STR_FILE: 4,
    NDF_WIDE_STRING: 4, NDF_COLOR32: 4, NDF_COLOR128: 16,
    NDF_VECTOR: 12, NDF_OBJ_REF: 8, NDF_TRAN_REF: 4,
    NDF_LOCALISATION: 8, NDF_GUID: 16, NDF_MAP: 0,
}


def read_footer(data):
    footer_data = data[-224:]
    offset = 8
    entries = {}
    while offset < len(footer_data):
        name = footer_data[offset:offset + 4].decode('ascii')
        offset += 4
        offset += 4
        entry_offset = struct.unpack_from('<q', footer_data, offset)[0]
        offset += 8
        entry_size = struct.unpack_from('<q', footer_data, offset)[0]
        offset += 8
        entries[name] = (entry_offset, entry_size)
    return entries


def read_block(content, entries, name):
    entry_offset, size = entries[name]
    start = entry_offset - 40
    return content[start:start + size]


def read_clas(content, entries):
    block = read_block(content, entries, 'CLAS')
    classes = {}
    offset = 0
    i = 0
    while offset < len(block):
        name, offset = read_string(block, offset)
        classes[i] = name
        i += 1
    return classes


def read_prop(content, entries):
    block = read_block(content, entries, 'PROP')
    props = {}
    offset = 0
    i = 0
    while offset < len(block):
        name, offset = read_string(block, offset)
        class_id, offset = read_i32(block, offset)
        props[i] = (name, class_id)
        i += 1
    return props


def read_strg(content, entries):
    block = read_block(content, entries, 'STRG')
    strings = []
    offset = 0
    while offset < len(block):
        s, offset = read_string(block, offset)
        strings.append(s)
    return strings


def read_tran(content, entries):
    block = read_block(content, entries, 'TRAN')
    trans = []
    offset = 0
    while offset < len(block):
        s, offset = read_string(block, offset)
        trans.append(s)
    return trans


def read_value(block, offset, strings, trans, depth=0):
    type_val, offset = read_u32(block, offset)
    if type_val == NDF_REFERENCE:
        type_val, offset = read_u32(block, offset)
    if type_val in (NDF_UNKNOWN, NDF_UNSET):
        return None, offset, True
    if type_val in (NDF_LIST, NDF_MAPLIST, NDF_WIDE_STRING):
        count, offset = read_u32(block, offset)
    else:
        count = TYPE_SIZES.get(type_val, 0)

    if type_val == NDF_LIST:
        items = []
        for _ in range(count):
            val, offset, brk = read_value(block, offset, strings, trans, depth + 1)
            items.append(val)
            if brk:
                break
        return items, offset, False
    elif type_val == NDF_MAPLIST:
        items = []
        for _ in range(count):
            k, offset, brk = read_value(block, offset, strings, trans, depth + 1)
            v, offset, brk2 = read_value(block, offset, strings, trans, depth + 1)
            items.append({"key": k, "value": v})
            if brk or brk2:
                break
        return items, offset, False
    elif type_val == NDF_MAP:
        k, offset, _ = read_value(block, offset, strings, trans, depth + 1)
        v, offset, _ = read_value(block, offset, strings, trans, depth + 1)
        return {"key": k, "value": v}, offset, False
    else:
        raw = block[offset:offset + count]
        offset += count
        try:
            if type_val == NDF_BOOLEAN:
                return bool(raw[0]), offset, False
            elif type_val == NDF_INT8:
                return raw[0], offset, False
            elif type_val == NDF_INT16:
                return struct.unpack_from('<h', raw)[0], offset, False
            elif type_val == NDF_INT32:
                return struct.unpack_from('<i', raw)[0], offset, False
            elif type_val == NDF_UINT32:
                return struct.unpack_from('<I', raw)[0], offset, False
            elif type_val == NDF_FLOAT32:
                return struct.unpack_from('<f', raw)[0], offset, False
            elif type_val in (NDF_FLOAT64, NDF_FLOAT64_2):
                return struct.unpack_from('<d', raw)[0], offset, False
            elif type_val in (NDF_TABLE_STRING, NDF_TABLE_STR_FILE):
                idx = struct.unpack_from('<i', raw)[0]
                return strings[idx] if idx < len(strings) else f"str[{idx}]", offset, False
            elif type_val == NDF_WIDE_STRING:
                return raw.decode('utf-16-le', errors='replace'), offset, False
            elif type_val == NDF_COLOR32:
                return {"a": raw[0], "r": raw[1], "g": raw[2], "b": raw[3]}, offset, False
            elif type_val == NDF_COLOR128:
                return raw.hex(), offset, False
            elif type_val == NDF_VECTOR:
                x, y, z = struct.unpack_from('<fff', raw)
                return {"x": x, "y": y, "z": z}, offset, False
            elif type_val == NDF_OBJ_REF:
                inst_id = struct.unpack_from('<I', raw, 0)[0]
                cls_id  = struct.unpack_from('<I', raw, 4)[0]
                return {"obj_ref": {"instance": inst_id, "class": cls_id}}, offset, False
            elif type_val == NDF_TRAN_REF:
                idx = struct.unpack_from('<i', raw)[0]
                return trans[idx] if idx < len(trans) else f"tran[{idx}]", offset, False
            elif type_val in (NDF_LOCALISATION, NDF_GUID):
                return raw.hex(), offset, False
            else:
                return f"unknown_type_0x{type_val:08X}:{raw.hex()}", offset, False
        except Exception as e:
            return f"parse_error:{e}", offset, False


# ---------------------------------------------------------------------------
# Parse ALL objects
# ---------------------------------------------------------------------------

def parse_all_objects(content, entries, classes, props, strings, trans):
    block = read_block(content, entries, 'OBJE')
    separator = b'\xAB\xAB\xAB\xAB'
    boundaries = [0]
    pos = 0
    while True:
        idx = block.find(separator, pos)
        if idx == -1:
            break
        boundaries.append(idx + 4)
        pos = idx + 4

    print(f"Total object boundaries: {len(boundaries)}", file=sys.stderr)

    instances = {}
    for i, start in enumerate(boundaries):
        end = boundaries[i + 1] - 4 if i + 1 < len(boundaries) else len(block)
        obj_data = block[start:end]
        if len(obj_data) < 4:
            continue
        class_id = struct.unpack_from('<i', obj_data, 0)[0]
        obj = {
            "_class":     classes.get(class_id, f"class_{class_id}"),
            "_class_id":  class_id,
            "_index":     i,
            "properties": {}
        }
        offset = 4
        while offset < len(obj_data) - 3:
            if offset + 4 > len(obj_data):
                break
            prop_id = struct.unpack_from('<i', obj_data, offset)[0]
            offset += 4
            if prop_id not in props:
                break
            prop_name = props[prop_id][0]
            val, offset, brk = read_value(obj_data, offset, strings, trans)
            obj["properties"][prop_name] = val
            if brk:
                break
        instances[i] = obj

    return instances


# ---------------------------------------------------------------------------
# Reference resolution helpers
# ---------------------------------------------------------------------------

def resolve_ref(instances: dict, ref) -> Optional[dict]:
    if ref is None:
        return None
    if isinstance(ref, dict) and "obj_ref" in ref:
        return instances.get(ref["obj_ref"]["instance"])
    return None


def get_module(unit_obj: dict, instances: dict, key: str) -> Optional[dict]:
    """
    Resolve a module from the Modules MapList by key.
    The MapList value is a wrapper object; the actual module is at wrapper.Default.
    Source: armory query paths e.g. "Modules.Damage.Default.MaxDamages"
    """
    for entry in unit_obj["properties"].get("Modules", []):
        if isinstance(entry, dict) and entry.get("key") == key:
            wrapper = resolve_ref(instances, entry.get("value"))
            if wrapper is None:
                return None
            default_ref = wrapper["properties"].get("Default")
            if default_ref is not None:
                return resolve_ref(instances, default_ref)
            return wrapper  # fallback if no Default property
    return None


def get_module_by_class(unit_obj: dict, instances: dict, class_name: str) -> Optional[dict]:
    """
    Return the first module whose resolved class (after following .Default) matches class_name.
    Checks both the wrapper class and the Default-resolved class.
    """
    for entry in unit_obj["properties"].get("Modules", []):
        if not isinstance(entry, dict):
            continue
        wrapper = resolve_ref(instances, entry.get("value"))
        if wrapper is None:
            continue
        # Check wrapper itself
        if wrapper["_class"] == class_name:
            return wrapper
        # Check Default-resolved object
        default_ref = wrapper["properties"].get("Default")
        if default_ref is not None:
            obj = resolve_ref(instances, default_ref)
            if obj and obj["_class"] == class_name:
                return obj
    return None


def has_module_class(unit_obj: dict, instances: dict, class_name: str) -> bool:
    return get_module_by_class(unit_obj, instances, class_name) is not None


def prop(obj: Optional[dict], name: str, default=None):
    if obj is None:
        return default
    return obj["properties"].get(name, default)


def get_list_item(lst, idx, default=None):
    if lst is None or not isinstance(lst, list):
        return default
    return lst[idx] if idx < len(lst) else default


def load_dic(path: str) -> dict:
    """
    Parse a Wargame .dic file into a hash->string lookup table.
    Format: 8-byte header, then N × 16-byte entries (u64 hash, u32 str_offset, u32 str_len),
    followed by UTF-16-LE string data. str_len is in characters (read str_len*2 bytes).
    """
    with open(path, 'rb') as f:
        data = f.read()

    HEADER = 8
    ENTRY  = 16

    first_offset = struct.unpack_from('<I', data, HEADER + 8)[0]
    num_entries  = (first_offset - HEADER) // ENTRY

    table = {}
    for i in range(num_entries):
        base = HEADER + i * ENTRY
        h    = struct.unpack_from('<Q', data, base)[0]
        soff = struct.unpack_from('<I', data, base + 8)[0]
        slen = struct.unpack_from('<I', data, base + 12)[0]
        s    = data[soff:soff + slen * 2].decode('utf-16-le', errors='replace')
        table[h] = s

    return table


def dic_lookup(table: dict, name_id_hex: str) -> str:
    """
    Convert a nameId hex string (e.g. 'd8624d1700000000') to a display name.
    The hex string is 8 raw bytes stored as hex; interpret as little-endian u64.
    """
    if not name_id_hex or len(name_id_hex) != 16:
        return ""
    try:
        h = struct.unpack('<Q', bytes.fromhex(name_id_hex))[0]
        return table.get(h, "")
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# Lookup tables
# ---------------------------------------------------------------------------

# Factory integer -> tab string
# Source: Wargame_Internal_Values_Manual §Factory
# NOTE: Category is unreliable (inaccurate after balance patches). Factory is canonical.
FACTORY_TO_TAB = {
    3:  "LOG",
    6:  "INF",
    7:  "AIR",
    8:  "VHC",
    9:  "TNK",
    10: "REC",
    11: "HEL",
    12: "NAV",
    13: "SUP",
}

# UnitMovingType integer -> (motionType, amphibious, is_infantry)
# Source: Wargame_Internal_Values_Manual §UnitMovingType
UNIT_MOVING_TYPE = {
    1: ("foot",    False, True),
    2: ("truck",   False, False),
    3: ("wheeled", False, False),
    5: ("tracked", False, False),
    6: ("air",     False, False),
    7: ("wheeled", True,  False),
    8: ("tracked", True,  False),
    9: ("ship",    False, False),
}

# HitRollSizeModifier float -> size integer 0-4
# Source: Wargame_Internal_Values_Manual §HitRollSizeModifier
# Very Small=0, Small=1, Medium=2, Big=3, Very Big=4
SIZE_MODIFIER_TABLE = [
    (-0.20, 0),
    (-0.15, 0),
    (-0.10, 0),
    (-0.05, 1),
    (0.05,  3),
    (0.10,  4),
]

def size_modifier_to_int(raw) -> int:
    if raw is None:
        return 2  # Medium (null = medium per manual)
    for threshold, size in SIZE_MODIFIER_TABLE:
        if abs(raw - threshold) < 0.01:
            return size
    return 2


# Training localisation hash -> integer (0=Militia, 1=Regular, 2=Shock, 3=Elite)
# Source: Wargame_Internal_Values_Manual §TTypeUnitModuleDescriptor/Training
TRAINING_HASH_TO_INT = {
    "de644d5719619c07": 0,
    "d6173d5c19619c07": 1,
    "5593495d19619c07": 2,
    "8f37594f19619c07": 3,
}

# UnitTypeTokens localisation hash -> spec code
# Source: Wargame_Internal_Values_Manual §UnitTypeTokens
SPEC_HASH_TO_CODE = {
    "8bd43c9757360e00": "MECH",
    "5c76718b57360e00": "ARM",
    "23b8605ed9380000": "MAR",
    "0bb7685ed9380000": "AIR",
    "5e767965e3000000": "MOT",
    "dad77965e3000000": "SUP",
}

# Unit class names confirmed from --classes output
UNIT_CLASS_NAMES = {
    "TUniteAuSolDescriptor",
    "TUniteDescriptor",
    "TModularUnitDescriptor",
}

# Movement handler class -> base unit type
MOUV_CLASS_TO_TYPE = {
    "TMouvementHandlerLandVehicleDescriptor": "Vehicle",
    "TMouvementHandlerHelicopterDescriptor":  "Helicopter",
    "TMouvementHandlerAirplaneDescriptor":    "Plane",
}

# AP weapon constants
HE_VALUE_ARME  = 3
KE_THRESHOLD   = 4
HEAT_THRESHOLD = 34

# Conversion factors (from armory source)
RANGE_FACTOR = 175 / 13000  # raw range units -> meters
DIST_FACTOR  = 1 / 52       # raw engine units -> meters or km/h

# Sea optics (SpecializedOpticalStrengths key 6) threshold for planes.
# Values at or below this are not emitted — only meaningful maritime patrol optics.
# Ships always emit seaOptics regardless of value.
SEA_OPTICS_PLANE_THRESHOLD = 60


# ---------------------------------------------------------------------------
# Conversion helpers
# ---------------------------------------------------------------------------

def to_meters_range(raw) -> Optional[int]:
    return round(raw * RANGE_FACTOR) if raw is not None else None


def to_meters_dist(raw) -> Optional[int]:
    return round(raw * DIST_FACTOR) if raw is not None else None


def transform_base_blindage(raw) -> int:
    """
    Raw BaseBlindage -> displayed armor value.
    Source: armory transformArmor() + manual §TBlindageProperties
      null/0 -> 0
      1-4    -> 0 (splash resistance variant, display as 0 armor)
      5+     -> raw - 4
    """
    if raw is None or raw == 0:
        return 0
    if raw <= 4:
        return 0
    return raw - 4


def extract_ap_and_arme_tags(arme_val):
    """Return (ap_or_None, list_of_tags). Source: armory getAP() / getTags()"""
    if arme_val is None:
        return None, []
    if arme_val == HE_VALUE_ARME:
        return None, ["AoE"]
    if arme_val > HEAT_THRESHOLD:
        return arme_val - HEAT_THRESHOLD, ["HEAT"]
    if arme_val > KE_THRESHOLD:
        return arme_val - KE_THRESHOLD, ["KE"]
    return None, []


# ---------------------------------------------------------------------------
# Unit type inference
# ---------------------------------------------------------------------------

def infer_unit_type(unit_obj: dict, instances: dict) -> str:
    if unit_obj["_class"] == "TModularUnitDescriptor":
        return "FOB"

    mouv_mod = get_module(unit_obj, instances, "MouvementHandler")
    if mouv_mod is not None:
        base_type = MOUV_CLASS_TO_TYPE.get(mouv_mod["_class"], "Vehicle")
        if base_type == "Vehicle":
            moving_type = prop(mouv_mod, "UnitMovingType")
            if moving_type == 1:
                return "Infantry"
            if moving_type == 9:
                return "Ship"
        return base_type

    return "Vehicle"


# ---------------------------------------------------------------------------
# Weapon extraction
# ---------------------------------------------------------------------------

def get_weapon_tags(ammo_obj: dict, mw_obj: dict) -> list:
    """
    Derive weapon tag list.
    TirEnMouvement is on MountedWeaponDescriptor (mw_obj), NOT on TAmmunition.
    Source: armory getTags()
    """
    tags = []
    p    = ammo_obj["properties"]
    mw_p = mw_obj["properties"]

    arme = p.get("Arme")
    _, arme_tags = extract_ap_and_arme_tags(arme)
    tags.extend(arme_tags)

    guidance = p.get("Guidance")
    if guidance == 1:
        tags.append("RAD")
    elif guidance == 2:
        tags.append("SEAD")

    # F&F / SA / GUID
    # TirEnMouvement on MountedWeaponDescriptor; IsFireAndForget on TAmmunition
    tir_en_mouvement = mw_p.get("TirEnMouvement")
    is_fnf           = p.get("IsFireAndForget")

    if is_fnf:
        tags.append("FnF")
    elif tir_en_mouvement:
        # Moving + guided + not F&F = semi-active
        if p.get("MissileDescriptor") is not None:
            tags.append("SA")
    else:
        # Not fire-and-forget, not moveable: guided stationary missile
        if p.get("MissileDescriptor") is not None:
            tags.append("GUID")

    # STAT: TirEnMouvement is null (cannot fire while moving)
    if tir_en_mouvement is None and p.get("MissileDescriptor") is None:
        tags.append("STAT")

    # INDIR
    if p.get("TirIndirect"):
        tags.append("INDIR")

    # CLUS
    if p.get("IsSubAmmunition"):
        tags.append("CLUS")

    # SMK
    if p.get("SmokeDescriptor") is not None:
        tags.append("SMK")

    # NAPALM
    if p.get("IgnoreInflammabilityConditions"):
        tags.append("NPLM")

    # DEF
    if p.get("PorteeMaximaleProjectile") is not None:
        tags.append("DEF")

    return tags


def classify_weapon(ammo_obj: dict, turret_class: str) -> str:
    """
    TTurretBombardierDescriptor is the definitive Bomb marker.
    Source: armory + manual §TWeaponManagerModuleDescriptor
    """
    p = ammo_obj["properties"]
    if turret_class == "TTurretBombardierDescriptor":
        return "Bomb"
    if p.get("TirIndirect"):
        return "Artillery"
    if p.get("Guidance") or p.get("MissileDescriptor") is not None:
        return "Missile"
    return "Gun"


def _extract_weapon_damage(p: dict, mw_p: dict, weapon: dict, dic: dict):
    """Populate damage, suppress, supply cost, AP, and ammo-resolution indices."""
    weapon["dmg"]      = p.get("PhysicalDamages")
    weapon["suppress"] = p.get("SuppressDamages")

    # supplyPerShot = SupplyCost / NbTirParSalves
    # Source: armory getSupplyCost()
    nb_tirs     = p.get("NbTirParSalves", 1) or 1
    supply_cost = p.get("SupplyCost")
    if supply_cost is not None:
        weapon["supplyPerShot"] = supply_cost / nb_tirs

    # Store indices so extract_weapons can resolve ammo count from WeaponManager.Salves
    weapon["_salvo_stock_index"] = mw_p.get("SalvoStockIndex") or 0
    weapon["_nb_tirs"]           = nb_tirs

    # AP
    arme = p.get("Arme")
    ap, _ = extract_ap_and_arme_tags(arme)
    if ap is not None:
        weapon["ap"] = ap


def _extract_weapon_accuracy(p: dict, mw_p: dict, instances: dict, weapon: dict):
    """Populate accuracy and stabilizer from HitRollRule."""
    # HitRollRule may be an inline object or an obj_ref — handle both
    hit_rule_raw = p.get("HitRollRule")
    hit_rule_obj = resolve_ref(instances, hit_rule_raw) if isinstance(hit_rule_raw, dict) and "obj_ref" in hit_rule_raw else None
    hr           = hit_rule_obj["properties"] if hit_rule_obj else {}

    hit_prob = hr.get("HitProbability")
    if hit_prob is not None:
        weapon["acc"] = round(hit_prob * 100)

    # stab: TirEnMouvement is on MountedWeaponDescriptor
    # Source: armory getStabilizer()
    tir_en_mouvement = mw_p.get("TirEnMouvement")
    if tir_en_mouvement:
        move_prob = hr.get("HitProbabilityWhileMoving")
        weapon["stab"] = round(move_prob * 100) if move_prob is not None else 0
    else:
        weapon["stab"] = 0


def _set_range(weapon: dict, key: str, raw):
    """Convert a raw range value to meters and store it if positive."""
    if raw:
        v = to_meters_range(raw)
        if v and v > 0:
            weapon[key] = v


def _extract_weapon_ranges(p: dict, weapon: dict):
    """Populate ground/helo/air/ship ranges, minRange, maxRange, blast radii, dispersion."""
    # Source: armory getGroundRange/getHeloRange/getPlaneRange
    _set_range(weapon, "rng_g", p.get("PorteeMaximale"))
    _set_range(weapon, "rng_h", p.get("PorteeMaximaleTBA"))
    _set_range(weapon, "rng_a", p.get("PorteeMaximaleHA"))

    # Ship range: only write if it differs from ground range or there is no ground range
    rng_s = p.get("PorteeMaximaleBateaux")
    if rng_s:
        v = to_meters_range(rng_s)
        if v and v > 0:
            ground_v = weapon.get("rng_g")
            if ground_v is None or v != ground_v:
                weapon["rng_s"] = v

    min_raw = (p.get("PorteeMinimale") or p.get("PorteeMinimaleTBA")
               or p.get("PorteeMinimaleHA") or p.get("PorteeMinimaleBateaux"))
    if min_raw:
        weapon["minRange"] = to_meters_range(min_raw)

    if weapon.get("category") == "Artillery" and p.get("PorteeMaximale"):
        weapon["maxRange"] = to_meters_range(p.get("PorteeMaximale"))

    # Blast radii
    dmg_radius  = p.get("RadiusSplashPhysicalDamages")
    supp_radius = p.get("RadiusSplashSuppressDamages")
    if dmg_radius  is not None: weapon["dmgRadius"]  = to_meters_dist(dmg_radius)
    if supp_radius is not None: weapon["suppRadius"] = to_meters_dist(supp_radius)

    # Dispersion (artillery)
    disp_max = p.get("DispersionAtMaxRange")
    disp_min = p.get("DispersionAtMinRange")
    if disp_max is not None: weapon["dispersion"]    = to_meters_dist(disp_max)
    if disp_min is not None: weapon["dispersionMin"] = to_meters_dist(disp_min)


def _extract_weapon_fire_rate(p: dict, weapon: dict):
    """Populate salvo length, reload timings, and aim time."""
    salvo_len    = p.get("NbTirParSalves")
    shot_reload  = p.get("TempsEntreDeuxTirs")
    salvo_reload = p.get("TempsEntreDeuxSalves")
    aim_time     = p.get("TempsDeVisee")

    if salvo_len   is not None: weapon["salvoLen"]    = salvo_len
    if salvo_reload is not None: weapon["salvoReload"] = salvo_reload
    if shot_reload  is not None and salvo_len and salvo_len > 1:
        weapon["shotReload"] = shot_reload
    if aim_time is not None:
        weapon["aimTime"] = aim_time


def _extract_weapon_missile(p: dict, instances: dict, weapon: dict):
    """Populate missile speed and acceleration (Missile category only).

    Path: TAmmunition.MissileDescriptor -> TUniteDescriptor ->
          Modules.MouvementHandler.Default.Maxspeed / MaxAcceleration (both / 52)
    Source: armory getMissileMaxSpeed / getMissileMaxAcceleration
    """
    missile_desc = resolve_ref(instances, p.get("MissileDescriptor"))
    if missile_desc:
        missile_mouv = get_module(missile_desc, instances, "MouvementHandler")
        if missile_mouv:
            ms_raw = prop(missile_mouv, "Maxspeed")
            ma_raw = prop(missile_mouv, "MaxAcceleration")
            if ms_raw is not None: weapon["missileSpeed"] = to_meters_dist(ms_raw)
            if ma_raw is not None: weapon["missileAccel"] = to_meters_dist(ma_raw)


def _apply_plane_weapon_transforms(weapon: dict):
    """Apply plane-specific post-processing: strip INDIR, reclassify Artillery as LGB Bomb,
    convert supplyPerShot to rearmTime."""
    tags = weapon.get("tag", [])

    # Strip INDIR — planes never fire indirect
    if "INDIR" in tags:
        tags.remove("INDIR")

    # Plane artillery = LGB: strip AL tag, add LGB tag, reclassify as Bomb
    if weapon.get("category") == "Artillery":
        weapon["category"] = "Bomb"
        if "AL"  in tags: tags.remove("AL")
        if "LGB" not in tags: tags.append("LGB")

    # Planes use rearmTime instead of supplyPerShot
    # rearmTime = supplyPerShot / 35
    if "supplyPerShot" in weapon:
        weapon["rearmTime"] = round(weapon.pop("supplyPerShot") / 35, 2)


def extract_weapon(mw_obj: dict, instances: dict, turret_class: str,
                   dic: Optional[dict] = None, is_plane: bool = False) -> Optional[dict]:
    """Extract weapon data from a TMountedWeaponDescriptor + its TAmmunition.

    Returns a dict with _salvo_stock_index and _nb_tirs fields that the caller
    must resolve against WeaponManager.Salves for the final ammo count.
    """
    if dic is None:
        dic = {}

    mw_p = mw_obj["properties"]
    ammo_obj = resolve_ref(instances, mw_p.get("Ammunition"))
    if ammo_obj is None:
        return None

    p = ammo_obj["properties"]

    weapon = {
        "nameId":   p.get("Name", ""),   # localisation hash hex — needs unites.dic lookup
        "name":     "",                   # display name placeholder; populate from dic
        "caliber":  dic_lookup(dic, p.get("Caliber", "")) if dic else "",
        "category": classify_weapon(ammo_obj, turret_class),
        "tag":      get_weapon_tags(ammo_obj, mw_obj),
    }

    _extract_weapon_damage(p, mw_p, weapon, dic)
    _extract_weapon_accuracy(p, mw_p, instances, weapon)
    _extract_weapon_ranges(p, weapon)
    _extract_weapon_fire_rate(p, weapon)
    if weapon["category"] == "Missile":
        _extract_weapon_missile(p, instances, weapon)

    # Noise
    noise = p.get("NoiseDissimulationMalus")
    if noise is not None:
        weapon["noise"] = noise

    if is_plane:
        _apply_plane_weapon_transforms(weapon)

    return weapon



def extract_weapons(unit_obj: dict, instances: dict, dic: Optional[dict] = None,
                    is_plane: bool = False) -> list:
    """Traverse WeaponManager -> TurretDescriptorList -> MountedWeaponDescriptorList -> Ammunition.

    Resolves ammo count from WeaponManager.Salves[SalvoStockIndex].
    """
    if dic is None:
        dic = {}
    weapons = []
    wm = get_module(unit_obj, instances, "WeaponManager")
    if wm is None:
        return weapons

    wm_p   = wm["properties"]
    salves = wm_p.get("Salves", [])

    turret_list = wm_p.get("TurretDescriptorList", [])
    if not isinstance(turret_list, list):
        return weapons

    for turret_idx, turret_ref in enumerate(turret_list):
        turret = resolve_ref(instances, turret_ref)
        if turret is None:
            continue
        turret_class = turret["_class"]
        mounted_list = prop(turret, "MountedWeaponDescriptorList", [])
        if not isinstance(mounted_list, list):
            continue

        for mw_ref in mounted_list:
            mw = resolve_ref(instances, mw_ref)
            if mw is None:
                continue
            weapon = extract_weapon(mw, instances, turret_class, dic, is_plane)
            if weapon is None:
                continue

            weapon["turret_index"] = turret_idx

            # Resolve ammo count: WeaponManager.Salves[SalvoStockIndex] * NbTirParSalves
            # Source: armory getAmmo()
            salvo_idx = weapon.pop("_salvo_stock_index", 0)
            nb_tirs   = weapon.pop("_nb_tirs", 1)
            if isinstance(salves, list) and salvo_idx < len(salves):
                salvo_count = salves[salvo_idx]
                if isinstance(salvo_count, (int, float)) and salvo_count >= 0:
                    weapon["ammo"] = int(salvo_count) * nb_tirs

            # Populate display name from dic
            weapon["name"] = dic_lookup(dic, weapon.get("nameId", ""))

            weapons.append(weapon)

    return weapons


# ---------------------------------------------------------------------------
# Unit extraction
# ---------------------------------------------------------------------------

def build_upgrade_chains(instances: dict) -> dict:
    """
    Build a map of instance_index -> list of descendant instance indices
    by following UpgradeRequired links.
    UpgradeRequired on unit B pointing to unit A means B is an upgrade of A,
    so A's transport list implicitly includes B.
    Returns: { root_index: [child_index, grandchild_index, ...] }
    """
    # Build parent -> children map
    children = {}  # instance_index -> [child instance indices]
    for idx, obj in instances.items():
        if obj["_class"] not in UNIT_CLASS_NAMES:
            continue
        upgrade_ref = obj["properties"].get("UpgradeRequire") or obj["properties"].get("UpgradeRequired")
        parent = resolve_ref(instances, upgrade_ref)
        if parent is not None:
            children.setdefault(parent["_index"], []).append(idx)

    # For each node, collect all descendants recursively
    def get_descendants(idx):
        result = []
        for child_idx in children.get(idx, []):
            result.append(child_idx)
            result.extend(get_descendants(child_idx))
        return result

    return {idx: get_descendants(idx) for idx in instances if idx in children or children.get(idx)}


def round_floats(obj):
    """Recursively round all floats in a nested structure to 2 decimal places."""
    if isinstance(obj, float):
        return round(obj, 2)
    if isinstance(obj, dict):
        return {k: round_floats(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [round_floats(v) for v in obj]
    return obj


def _extract_unit_identity(p: dict, unit_obj: dict, instances: dict, dic: dict) -> dict:
    """Extract core identity fields: id, name, nation, year, cost, avail, tab, specs, type, command.

    Source: armory getUnitName() + manual §NameInMenuToken, §Factory, §UnitTypeTokens
    """
    unit = {}
    unit["id"] = p.get("DescriptorId")

    # Display name: NameInMenuToken is a localisation hash -> dic lookup
    # AliasName is unreliable for helicopters/planes (contains debug class name)
    # For TUniteDescriptor (air units), NameInMenuToken may only exist on the
    # TypeUnit submodule, not at the top level.
    name_token = p.get("NameInMenuToken")
    if not name_token:
        type_unit_mod_for_name = get_module(unit_obj, instances, "TypeUnit")
        name_token = prop(type_unit_mod_for_name, "NameInMenuToken")
    name_from_dic = dic_lookup(dic, name_token) if name_token else ""
    raw_name = name_from_dic or p.get("AliasName") or p.get("ClassNameForDebug", "Unknown")
    unit["name"] = " ".join(w for w in raw_name.split() if not w.startswith("#")).strip()

    unit["nation"]    = p.get("MotherCountry")
    unit["year"]      = p.get("ProductionYear", 0)
    unit["prototype"] = bool(p.get("IsPrototype"))

    prod_price = p.get("ProductionPrice")
    unit["cost"] = get_list_item(prod_price, 0) if isinstance(prod_price, list) else prod_price

    unit["maxPacks"] = p.get("MaxPacks")
    unit["avail"] = p.get("MaxDeployableAmount", [0, 0, 0, 0, 0])

    # Tab from Factory (NOT Category — Category is unreliable per manual)
    factory = p.get("Factory")
    unit["tab"] = FACTORY_TO_TAB.get(factory, f"unknown_factory_{factory}")

    # Specs from UnitTypeTokens (list of localisation hashes on unit directly)
    tokens = p.get("UnitTypeTokens") or []
    unit["specs"] = [
        SPEC_HASH_TO_CODE[tok.lower()]
        for tok in tokens
        if isinstance(tok, str) and tok.lower() in SPEC_HASH_TO_CODE
    ]

    unit["type"]    = infer_unit_type(unit_obj, instances)
    unit["command"] = has_module_class(unit_obj, instances, "TCommandManagerModuleDescriptor")

    return unit


def _extract_unit_survivability(unit_obj: dict, instances: dict, p: dict, unit: dict):
    """Extract health, armor, size, ECM, and stealth.

    Source: armory getHealth(), get*Armor(), getECM(), getStealth()
    """
    # Health: Modules.Damage.Default.MaxDamages
    damage_mod = get_module(unit_obj, instances, "Damage")
    unit["health"] = prop(damage_mod, "MaxDamages")

    # Size: raw HitRollSizeModifier float
    unit["size"] = p.get("HitRollSizeModifier")

    # Armor: deep path through Damage module
    #   Modules.Damage.Default.CommonDamageDescriptor.BlindageProperties
    #     .ArmorDescriptor{Front/Sides/Rear/Top}.BaseBlindage
    if damage_mod:
        common_dmg = resolve_ref(instances, prop(damage_mod, "CommonDamageDescriptor"))
        if common_dmg:
            blindage = resolve_ref(instances, prop(common_dmg, "BlindageProperties"))
            if blindage:
                bp = blindage["properties"]
                def get_armor(face_key):
                    return transform_base_blindage(
                        prop(resolve_ref(instances, bp.get(face_key)), "BaseBlindage")
                    )
                unit["armor"] = {
                    "F": get_armor("ArmorDescriptorFront"),
                    "S": get_armor("ArmorDescriptorSides"),
                    "R": get_armor("ArmorDescriptorRear"),
                    "T": get_armor("ArmorDescriptorTop"),
                }

    # ECM: top-level HitRollECMModifier (NOT a module)
    ecm = p.get("HitRollECMModifier")
    if ecm is not None:
        unit["ecm"] = round(abs(ecm) * 100)

    # Stealth: Modules.Visibility.Default.UnitStealthBonus
    vis_mod = get_module(unit_obj, instances, "Visibility")
    stealth = prop(vis_mod, "UnitStealthBonus")
    if stealth is not None:
        if unit.get("type") == "Plane":
            unit["airStealth"] = stealth
        else:
            unit["stealth"] = stealth


def _extract_unit_mobility(unit_obj: dict, instances: dict, unit: dict):
    """Extract speed, motionType, amphibious, fuel/autonomy, acceleration, altitude, turnRadius.

    Source: armory getSpeed(), getFuel(), getAutonomy(), getFlyingAltitude()
           manual §UnitMovingType, §TMouvementHandlerAirplaneDescriptor
    """
    mouv_mod = get_module(unit_obj, instances, "MouvementHandler")
    unit_type = unit.get("type")

    # Speed
    maxspeed_raw = prop(mouv_mod, "Maxspeed")
    if maxspeed_raw is not None:
        unit["speed"] = to_meters_dist(maxspeed_raw)

    # MotionType and amphibious from UnitMovingType
    moving_type_int = prop(mouv_mod, "UnitMovingType")
    if moving_type_int in UNIT_MOVING_TYPE:
        motion_str, amphibious, _ = UNIT_MOVING_TYPE[moving_type_int]
        if motion_str not in ("foot", "air", "ship"):
            unit["motionType"] = motion_str
        if amphibious:
            unit["amphibious"] = True

    # Fuel and autonomy
    fuel_mod = get_module(unit_obj, instances, "Fuel")
    fuel_cap  = prop(fuel_mod, "FuelCapacity")
    fuel_move = prop(fuel_mod, "FuelMoveDuration")
    if fuel_cap is not None:
        if unit_type == "Plane":
            # Planes show refuel time instead of fuel capacity (~81 liters/second)
            unit["refuelTime"] = round(fuel_cap / 81, 2)
        else:
            unit["fuel"] = fuel_cap
    if fuel_move is not None:
        unit["autonomy"] = fuel_move

    # Vehicle transport flag
    if unit_type == "Vehicle":
        unit["isTransport"] = has_module_class(unit_obj, instances, "TTransporterModuleDescriptor")

    # Turning time (all unit types)
    turning_time = prop(mouv_mod, "TempsDemiTour")
    if turning_time is not None:
        unit["turningTime"] = turning_time

    # Acceleration/deceleration (all unit types)
    max_accel = prop(mouv_mod, "MaxAcceleration")
    max_decel = prop(mouv_mod, "MaxDeceleration")
    if max_accel is not None: unit["maxAcceleration"] = to_meters_dist(max_accel)
    if max_decel is not None: unit["maxDeceleration"] = to_meters_dist(max_decel)

    # Plane: altitude and turning radius
    if unit_type == "Plane":
        flying_alt = prop(mouv_mod, "FlyingAltitude")
        if flying_alt is not None:
            unit["altitude"] = to_meters_dist(flying_alt)
        giration_raw = prop(mouv_mod, "GirationRadius")
        if giration_raw is not None:
            unit["turnRadius"] = to_meters_dist(giration_raw)


def _extract_unit_sensors(unit_obj: dict, instances: dict, unit: dict):
    """Extract optics, airOptics, and seaOptics.

    Source: armory getGroundOptics() / getAirOptics()
           manual §TScannerConfigurationDescriptor
    """
    scanner_mod = get_module(unit_obj, instances, "ScannerConfiguration")
    optics     = prop(scanner_mod, "OpticalStrength")
    air_optics = prop(scanner_mod, "OpticalStrengthAltitude")  # NOT OpticalStrengthAlt
    if optics     is not None: unit["optics"]    = optics
    if air_optics is not None: unit["airOptics"] = air_optics

    # Sea optics: SpecializedOpticalStrengths MapList, key 6 = ships.
    # Ships always emit; planes only emit if value > SEA_OPTICS_PLANE_THRESHOLD (60).
    # Key may be stored as int 6 or string "6" — check both.
    if unit.get("type") in ("Ship", "Plane"):
        specialized_optical = prop(scanner_mod, "SpecializedOpticalStrengths", [])
        if isinstance(specialized_optical, list):
            for entry in specialized_optical:
                if isinstance(entry, dict) and entry.get("key") in (6, "6"):
                    val = entry.get("value")
                    if val is not None:
                        is_plane = unit.get("type") == "Plane"
                        if not is_plane or val > SEA_OPTICS_PLANE_THRESHOLD:
                            unit["seaOptics"] = val
                    break


def _extract_unit_misc(unit_obj: dict, instances: dict, p: dict, dic: dict,
                       upgrade_chains: dict, unit: dict):
    """Extract training, transports, supply capacity, and ship-specific fields (CIWS, sailing).

    Source: manual §TTypeUnitModuleDescriptor, §TTransportableModuleDescriptor
           armory getSupplyCapacity()
    """
    unit_type = unit.get("type")

    # Training: TypeUnit module -> Training localisation hash
    type_unit_mod = get_module(unit_obj, instances, "TypeUnit")
    training_hash = prop(type_unit_mod, "Training")
    if training_hash is not None:
        training_int = TRAINING_HASH_TO_INT.get(str(training_hash).lower())
        if training_int is not None:
            unit["training"] = training_int

    # Transports: infantry only
    # TransportListAvailableForSpawn lists root transports only;
    # descendants via UpgradeRequired are implicitly available too.
    if unit_type == "Infantry":
        transport_mod = get_module(unit_obj, instances, "Transportable")
        transport_refs = prop(transport_mod, "TransportListAvailableForSpawn", [])
        if isinstance(transport_refs, list):
            transport_ids = []
            seen_indices = set()

            def add_transport(obj):
                if obj is None or obj["_index"] in seen_indices:
                    return
                seen_indices.add(obj["_index"])
                t_id = obj["properties"].get("DescriptorId")
                if t_id:
                    transport_ids.append(t_id)
                for desc_idx in upgrade_chains.get(obj["_index"], []):
                    add_transport(instances.get(desc_idx))

            for ref in transport_refs:
                add_transport(resolve_ref(instances, ref))

            if transport_ids:
                unit["transports"] = transport_ids

    # Supply capacity
    supply_mod = get_module(unit_obj, instances, "Supply")
    supply_cap = prop(supply_mod, "SupplyCapacity")
    if supply_cap is not None:
        unit["capacity"] = supply_cap

    # Ship-specific: CIWS and Sailing (display-only values from dic)
    if unit_type == "Ship":
        type_unit_mod_ship = get_module(unit_obj, instances, "TypeUnit")
        ciws_hash    = prop(type_unit_mod_ship, "CIWS")
        sailing_hash = prop(type_unit_mod_ship, "Sailing")
        if ciws_hash:
            ciws_str = dic_lookup(dic, ciws_hash)
            if ciws_str: unit["ciws"] = ciws_str
        if sailing_hash:
            sailing_str = dic_lookup(dic, sailing_hash)
            if sailing_str: unit["sailing"] = sailing_str


def _cleanup_unit(unit: dict) -> dict:
    """Remove empty/None fields and strip type-inappropriate fields."""
    unit = {k: v for k, v in unit.items() if v is not None and v != [] and v != {}}

    unit_type = unit.get("type")
    if unit_type == "Plane":
        unit.pop("size", None)
    elif unit_type == "Infantry":
        unit.pop("armor", None)
    elif unit_type == "FOB":
        for f in ("weapons", "specs", "prototype"):
            unit.pop(f, None)
    elif unit_type == "Ship":
        for f in ("motionType", "amphibious", "training", "size", "transports", "isTransport"):
            unit.pop(f, None)

    return unit


def extract_unit(unit_obj: dict, instances: dict, dic: Optional[dict] = None,
                 upgrade_chains: Optional[dict] = None) -> Optional[dict]:
    """Extract a complete unit record from a parsed NDF unit object."""
    if dic is None:
        dic = {}
    if upgrade_chains is None:
        upgrade_chains = {}

    p    = unit_obj["properties"]
    unit = _extract_unit_identity(p, unit_obj, instances, dic)

    _extract_unit_survivability(unit_obj, instances, p, unit)
    _extract_unit_mobility(unit_obj, instances, unit)
    _extract_unit_sensors(unit_obj, instances, unit)
    _extract_unit_misc(unit_obj, instances, p, dic, upgrade_chains, unit)

    # Weapons
    unit["weapons"] = extract_weapons(unit_obj, instances, dic, unit.get("type") == "Plane")

    return round_floats(_cleanup_unit(unit))


# ---------------------------------------------------------------------------
# Inspect mode
# ---------------------------------------------------------------------------

def cmd_inspect(instances: dict, alias: str):
    target = None
    for obj in instances.values():
        props = obj["properties"]
        if props.get("AliasName") == alias or props.get("ClassNameForDebug") == alias:
            target = obj
            break
    if target is None:
        print(f"Unit '{alias}' not found.", file=sys.stderr)
        return

    print(f"\n{'='*60}")
    print(f"Unit: {alias}  class={target['_class']}  index={target['_index']}")
    print(f"{'='*60}\n")

    print("--- Direct properties ---")
    for k, v in target["properties"].items():
        if k == "Modules":
            continue
        print(f"  {k:40s}  {json.dumps(v)}")

    print("\n--- Modules ---")
    for entry in target["properties"].get("Modules", []):
        if not isinstance(entry, dict):
            continue
        mod_key = entry.get("key", "?")
        wrapper = resolve_ref(instances, entry.get("value"))
        if wrapper is None:
            print(f"\n  [{mod_key}] (unresolved: {entry.get('value')})")
            continue

        default_ref = wrapper["properties"].get("Default")
        mod_obj = resolve_ref(instances, default_ref) if default_ref else wrapper
        wrapper_class = wrapper["_class"]

        if mod_obj and mod_obj is not wrapper:
            print(f"\n  [{mod_key}]  wrapper={wrapper_class}  module={mod_obj['_class']}  index={mod_obj['_index']}")
        else:
            print(f"\n  [{mod_key}]  class={wrapper_class}  index={wrapper['_index']}")
            mod_obj = wrapper

        if mod_obj:
            for pk, pv in mod_obj["properties"].items():
                if isinstance(pv, list) and len(pv) > 4:
                    first = json.dumps(pv[0]) if pv else "empty"
                    print(f"    {pk:40s}  [list len={len(pv)} first={first}]")
                else:
                    print(f"    {pk:40s}  {json.dumps(pv)}")

    print("\n--- Weapon chain ---")
    wm = get_module(target, instances, "WeaponManager")
    if wm is None:
        print("  No WeaponManager.")
        return

    salves = wm["properties"].get("Salves", [])
    print(f"  Salves: {salves}\n")

    turret_list = wm["properties"].get("TurretDescriptorList", [])
    for ti, tref in enumerate(turret_list):
        turret = resolve_ref(instances, tref)
        if turret is None:
            continue
        print(f"  Turret[{ti}]  class={turret['_class']}")
        for wi, mw_ref in enumerate(prop(turret, "MountedWeaponDescriptorList", [])):
            mw = resolve_ref(instances, mw_ref)
            if mw is None:
                continue
            ammo = resolve_ref(instances, prop(mw, "Ammunition"))
            print(f"    Weapon[{wi}]  MountedWeapon class={mw['_class']}")
            for pk, pv in mw["properties"].items():
                if pk != "Ammunition":
                    print(f"      mw.{pk:36s}  {json.dumps(pv)}")
            if ammo:
                print(f"    Weapon[{wi}]  Ammo class={ammo['_class']}")
                for pk, pv in ammo["properties"].items():
                    print(f"      ammo.{pk:34s}  {json.dumps(pv)}")


# ---------------------------------------------------------------------------
# Classes / extract modes
# ---------------------------------------------------------------------------

def cmd_classes(classes: dict):
    for cid in sorted(classes.keys()):
        print(f"{cid:6d}  {classes[cid]}")


def cmd_extract(instances: dict, dic: dict):
    print("Building upgrade chains...", file=sys.stderr)
    upgrade_chains = build_upgrade_chains(instances)
    results = []
    for obj in instances.values():
        if obj["_class"] not in UNIT_CLASS_NAMES:
            continue
        unit = extract_unit(obj, instances, dic, upgrade_chains)
        if not unit:
            continue
        # Skip cut/internal units: must have a recognised tab
        if str(unit.get("tab", "")).startswith("unknown_factory"):
            continue
        # Skip cut/internal units: must have at least one non-zero availability slot
        avail = unit.get("avail", [])
        if not isinstance(avail, list) or not any(isinstance(v, (int, float)) and v > 0 for v in avail):
            continue
        # Skip deprecated units
        if "deprec" in (unit.get("name") or "").lower():
            continue
        results.append(unit)
    print(json.dumps(results, indent=2, ensure_ascii=True))
    print(f"Extracted {len(results)} units.", file=sys.stderr)


def cmd_extract_deck(instances: dict):
    """Extract deck serialization indices from TShowRoomDeckSerializer.

    Outputs a JSON object with:
      - blufor/redfor: ordered lists of {index, descriptorId, transportCategory}
      - transportCategory: "A" (naval: unit+transport+craft), "B" (ground: unit+transport), "C" (standalone)
    The index is the 10-bit value used in the binary deck code.
    """
    # Nation codes (9-bit values) — fixed constants per the game format
    NATION_CODES = {
        "US": 6, "UK": 14, "FR": 22, "RFA": 30, "CAN": 38,
        "DAN": 46, "SWE": 54, "NOR": 62, "ANZ": 70, "JAP": 78, "ROK": 86,
        "Eurocorps": 88, "Scandinavia": 89, "Commonwealth": 90,
        "Blue Dragons": 91, "BLUFOR Mixed": 94,
        "RDA": 134, "URSS": 142, "POL": 150, "TCH": 158,
        "CHI": 166, "NK": 174,
        "Red Dragons": 180, "Eastern Bloc": 181, "REDFOR Mixed": 182,
    }

    # Find the TShowRoomDeckSerializer instance
    serializer = None
    for obj in instances.values():
        if obj["_class"] == "TShowRoomDeckSerializer":
            serializer = obj
            break

    if serializer is None:
        print("ERROR: TShowRoomDeckSerializer not found in ndfbin.", file=sys.stderr)
        sys.exit(1)

    ser_props = serializer["properties"]

    otan_ids = ser_props.get("OtanUnitIds")
    pact_ids = ser_props.get("PactUnitIds")

    if otan_ids is None or pact_ids is None:
        print(f"TShowRoomDeckSerializer properties: {list(ser_props.keys())}", file=sys.stderr)
        print("ERROR: OtanUnitIds or PactUnitIds not found.", file=sys.stderr)
        sys.exit(1)

    # Build transport category lookup
    # For each unit that has transports, check if any transport has Sailing set (= naval = Category A)
    # Units with transports but no sailing = Category B
    # Units without transports = Category C
    def get_transport_category(unit_obj):
        unit_type = infer_unit_type(unit_obj, instances)
        if unit_type != "Infantry":
            return "C"

        transport_mod = get_module(unit_obj, instances, "Transportable")
        transport_refs = prop(transport_mod, "TransportListAvailableForSpawn", [])
        if not isinstance(transport_refs, list) or len(transport_refs) == 0:
            return "C"

        # Check if any transport is a naval vessel (has Sailing property set)
        has_sailing_transport = False
        for ref in transport_refs:
            t_obj = resolve_ref(instances, ref)
            if t_obj is None:
                continue
            type_unit_mod = get_module(t_obj, instances, "TypeUnit")
            sailing = prop(type_unit_mod, "Sailing")
            if sailing:
                has_sailing_transport = True
                break

        return "A" if has_sailing_transport else "B"

    def process_side(id_list):
        """Process a list of unit references into deck index entries.

        Entries may be bare ints/strings/obj_refs, or MapList-style dicts
        {'key': deck_index, 'value': unit_ref} where key IS the 10-bit index.
        """
        results = []
        for i, entry in enumerate(id_list):
            unit_obj = None
            deck_index = i  # fallback when the list is a plain ordered list

            # Unwrap MapList entry: {key: actual_deck_index, value: unit_ref}
            actual_entry = entry
            if isinstance(entry, dict) and "key" in entry and "value" in entry:
                deck_index = entry["key"]
                actual_entry = entry["value"]

            if isinstance(actual_entry, int):
                desc_id = actual_entry
                for obj in instances.values():
                    if obj["_class"] in UNIT_CLASS_NAMES:
                        if obj["properties"].get("DescriptorId") == actual_entry:
                            unit_obj = obj
                            break
            elif isinstance(actual_entry, dict) and "obj_ref" in actual_entry:
                unit_obj = resolve_ref(instances, actual_entry)
                if unit_obj:
                    desc_id = unit_obj["properties"].get("DescriptorId")
                else:
                    continue
            elif isinstance(actual_entry, str):
                desc_id = actual_entry
                for obj in instances.values():
                    if obj["_class"] in UNIT_CLASS_NAMES:
                        if obj["properties"].get("DescriptorId") == actual_entry:
                            unit_obj = obj
                            break
            else:
                print(f"  Skipping unknown entry type at index {i}: {type(actual_entry).__name__} = {repr(entry)[:100]}", file=sys.stderr)
                continue

            cat = get_transport_category(unit_obj) if unit_obj else "C"
            results.append({"index": deck_index, "id": desc_id, "cat": cat})
        return results

    print(f"OtanUnitIds: {len(otan_ids)} entries, PactUnitIds: {len(pact_ids)} entries", file=sys.stderr)

    # Show first few entries for debugging
    if otan_ids:
        print(f"  First OTAN entry type: {type(otan_ids[0]).__name__} = {repr(otan_ids[0])[:100]}", file=sys.stderr)
    if pact_ids:
        print(f"  First PACT entry type: {type(pact_ids[0]).__name__} = {repr(pact_ids[0])[:100]}", file=sys.stderr)

    blufor = process_side(otan_ids)
    redfor = process_side(pact_ids)

    # Also extract Nationalities and Coalitions if present (for reference/validation)
    extra = {}
    for key in ("Nationalities", "CountriesNATO", "CountriesPACT", "Coalitions",
                "UnitTypes", "Categories", "MaxNbSuperTransports", "MaxNbTransports"):
        val = ser_props.get(key)
        if val is not None:
            extra[key] = val

    result = {
        "nationCodes": NATION_CODES,
        "blufor": blufor,
        "redfor": redfor,
        "serializer": extra,
    }
    print(json.dumps(result, indent=2, ensure_ascii=True))
    print(f"Deck indices extracted: {len(blufor)} BLUFOR, {len(redfor)} REDFOR.", file=sys.stderr)


def cmd_inspect_deck_serializer(instances: dict):
    """Dump TShowRoomDeckSerializer properties for debugging."""
    for obj in instances.values():
        if obj["_class"] == "TShowRoomDeckSerializer":
            print(f"Found TShowRoomDeckSerializer at index {obj['_index']}")
            print(f"Properties: {list(obj['properties'].keys())}")
            for k, v in obj["properties"].items():
                if isinstance(v, list):
                    print(f"\n  {k}: list with {len(v)} entries")
                    for item in v[:5]:
                        print(f"    {json.dumps(item)}")
                    if len(v) > 5:
                        print(f"    ... ({len(v) - 5} more)")
                else:
                    print(f"\n  {k}: {json.dumps(v)}")
            return
    print("TShowRoomDeckSerializer not found.", file=sys.stderr)


def cmd_extract_raw(instances: dict):
    results = [obj for obj in instances.values() if obj["_class"] in UNIT_CLASS_NAMES]
    print(json.dumps(results, indent=2, ensure_ascii=True))
    print(f"Dumped {len(results)} raw unit objects.", file=sys.stderr)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def load_file(path: str):
    print(f"Reading {path}...", file=sys.stderr)
    with open(path, 'rb') as f:
        data = f.read()
    if data[:4] == b'EUG0':
        print("Stripping 40-byte file header...", file=sys.stderr)
        content = data[40:]
    else:
        content = data
    print(f"Content size: {len(content)} bytes", file=sys.stderr)
    entries = read_footer(content)
    print(f"Footer blocks: {list(entries.keys())}", file=sys.stderr)
    classes = read_clas(content, entries)
    props   = read_prop(content, entries)
    strings = read_strg(content, entries)
    trans   = read_tran(content, entries)
    print(f"Classes: {len(classes)}  Props: {len(props)}  Strings: {len(strings)}  Trans: {len(trans)}", file=sys.stderr)
    print("Parsing all objects...", file=sys.stderr)
    instances = parse_all_objects(content, entries, classes, props, strings, trans)
    print(f"Total instances parsed: {len(instances)}", file=sys.stderr)
    return instances, classes


def main():
    parser = argparse.ArgumentParser(description="WRD data extractor")
    parser.add_argument("ndfbin")
    parser.add_argument("--dic", metavar="PATH",
                        help="Path to unites.dic for weapon/unit display name lookup")
    parser.add_argument("--deck-file", metavar="PATH",
                        help="Write --extract-deck output to this file (UTF-16 LE) "
                             "instead of stdout. Example: data/deck_indices.json")
    grp = parser.add_mutually_exclusive_group(required=True)
    grp.add_argument("--inspect",     metavar="ALIAS")
    grp.add_argument("--classes",     action="store_true")
    grp.add_argument("--extract",     action="store_true")
    grp.add_argument("--extract-raw", action="store_true")
    grp.add_argument("--extract-deck", action="store_true",
                     help="Extract deck serialization indices (unit ordering for deck codes)")
    grp.add_argument("--inspect-deck-serializer", action="store_true",
                     help="Dump TShowRoomDeckSerializer properties for debugging")
    args = parser.parse_args()
    instances, classes = load_file(args.ndfbin)

    dic = {}
    if args.dic:
        print(f"Loading dic from {args.dic}...", file=sys.stderr)
        dic = load_dic(args.dic)
        print(f"Loaded {len(dic)} dic entries.", file=sys.stderr)
    elif args.extract or args.extract_raw:
        print("WARNING: --dic not provided. Unit and weapon display names will be missing.", file=sys.stderr)
        print("         Pass --dic unites.dic for human-readable names.", file=sys.stderr)

    if args.classes:
        cmd_classes(classes)
    elif args.inspect:
        cmd_inspect(instances, args.inspect)
    elif args.extract:
        cmd_extract(instances, dic)
    elif args.extract_raw:
        cmd_extract_raw(instances)
    elif args.extract_deck:
        if args.deck_file:
            import os
            os.makedirs(os.path.dirname(os.path.abspath(args.deck_file)), exist_ok=True)
            result_str = None
            # Temporarily capture stdout so we can write to file instead
            import io
            _old_stdout = sys.stdout
            sys.stdout = io.StringIO()
            try:
                cmd_extract_deck(instances)
                result_str = sys.stdout.getvalue()
            finally:
                sys.stdout = _old_stdout
            with open(args.deck_file, 'w', encoding='utf-16') as f:
                f.write(result_str)
            print(f"Deck indices written to {args.deck_file}", file=sys.stderr)
        else:
            cmd_extract_deck(instances)
    elif args.inspect_deck_serializer:
        cmd_inspect_deck_serializer(instances)


if __name__ == '__main__':
    main()
