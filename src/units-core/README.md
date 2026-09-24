# units-core

Shared module for the WGRD armory and its companion tools. Provides:

- **Data**: load and parse `units.json`, read/write the selected unit in the URL.
- **Filter**: `useFilterState` hook with nation, spec, tab, era, tag, and search filters.
- **List**: virtualized unit list and row.
- **Card**: `V2Card` renderer with a deny-list API for hiding sections or fields.
- **Theme + constants**: shared color tokens, nations, coalitions, specs, tabs, veterancy tiers.

All consumer apps live in this same repo and import from the `@units-core` path alias (configured in `vite.config.js`). Each app is a separate Vite multi-page entry; the homepage lives at `/`, the armory at `/armory/`, and future tools at their own sub-paths.

## Import surface

```js
import {
  // data
  loadData, readUnitFromUrl, writeUnitToUrl,
  // filter
  useFilterState,
  // list
  UnitList, UnitListRow, ROW_HEIGHTS, FlagImg,
  // card
  V2Card, SECTION_IDS, FIELD_IDS, useHide,
  // theme + constants
  BROWSER_TOKENS, BMono, V2_THEMES,
  ALL_NATIONS, PACT_NATIONS, NATION_CODE_MAP, NATION_FLAG_MAP, sideOf,
  COALITIONS, COALITION_NATIONS, COALITION_FLAG_MAP,
  SPECS, SPEC_VET_BONUS, TABS,
  VET_TIERS, VET_TOOLTIPS,
} from '@units-core';
```

## Data

### `loadData(opts?) → Promise<{ roster, units, defaultId }>`

Fetches and parses `units.json`.

- `opts.url` (optional): override fetch URL. Defaults to `${import.meta.env.BASE_URL}units.json`, which works for any Vite app under the same project base.
- Handles both UTF-8 and UTF-16 LE (Excel-style) encodings transparently.

**Returns:**
- `roster`: array of light listing objects — `{ id, name, tab, nation, nationName, specs, cost, unitTags, era, transports }`. `transports` is resolved to small `{ id, name, nation, tab }` lookup objects.
- `units`: id-keyed map of full unit objects with these derived fields:
  - `nationName`, `era` (`'PRE-80'` | `'PRE-85'` | `null`)
  - `trainingLabel` (`'Militia' | 'Regular' | 'Shock' | 'Elite'`)
  - `roadSpeed`, `forestSpeed`, `swimSpeed` (vehicles only — derived from `motionType` and `speed`)
- `defaultId`: id of the first non-FOB unit in the file.

### `readUnitFromUrl(roster, units, fallbackId) → id`

Reads `?unit=<id>` or `?name=<display-name>` from `window.location.search`. Falls back to `fallbackId`.

### `writeUnitToUrl(id) → void`

`history.replaceState` to `?unit=<id>`. Used to keep the URL in sync with the selected unit.

## Filter

### `useFilterState(roster) → handle`

```ts
{
  f: { nation: string[], spec: string[], tab: string[], era: string[], tag: string[], q: string },
  setF: Setter,
  setQ: (q: string) => void,
  toggle: (key) => (val) => void,    // multi-select on/off; val=null clears the field
  select: (key) => (val) => void,    // single-select with deselect-on-reselect; val=null clears
  solo:   (key) => (val) => void,    // select only this value
  toggleCoalition: (name | null) => void,  // toggles all members of a coalition (or clears nations)
  toggleSide:      (nationCodes[]) => void, // toggles a NATO/PACT-style nation array
  filtered: rosterEntry[],           // memoized result of applying f to roster
}
```

Filtering rules: nation/spec/tab/tag are AND-combined when populated. Era selection of `PRE-80` matches only `PRE-80` units; `PRE-85` matches any unit with a non-null era. Search is case-insensitive substring match on `name`.

## List

### `<UnitList rows selectedId pinnedIds expandedIds onSelect onToggleTransports />`

Virtualized via `react-window`. Variable row heights — rows with expanded transports grow to fit. `pinnedIds` and `expandedIds` are arrays/Sets of unit ids.

### `<UnitListRow u active pinned transportsOpen selectedId onSelect onToggleTransports compact />`

The single-row component, exported for apps that want a custom virtualizer or non-list layout.

### `ROW_HEIGHTS`

```ts
{ compact: 25, default: 29, transportCompact: 23, transportDefault: 27 }
```

## Card

### `<V2Card unit avail vetIdx setVetIdx theme hide />`

Default render is full and pixel-identical to the previous monolithic card.

| prop | type | notes |
|---|---|---|
| `unit` | object | full unit (from `loadData().units[id]`) |
| `avail` | number[5]? | per-vet availability; falls back to `unit.avail` |
| `vetIdx` | 0..4 | index into `VET_TIERS` |
| `setVetIdx` | `(i) => void` | required when the vet selector is shown |
| `theme` | `'tactical' \| 'signal'` | usually `sideOf(unit.nation)` |
| `hide` | `{ sections?: string[], fields?: string[] }` | suppression deny-list |

### `hide.sections`

Listing a section id removes its entire block (header + rows). Valid ids — exported as `SECTION_IDS`:

| id | what it removes |
|---|---|
| `title` | Title block (DWG, name, flag, cost) |
| `vet` | Veterancy selector |
| `general` | General section |
| `mobility` | Mobility section |
| `optics` | Optics section |
| `armor` | Armor section |
| `armament` | Armament section |

Hiding `vet` is the supported way to render a static, vet-locked card.

### `hide.fields`

Removing a field id hides that single row (or armor cell). If hiding fields leaves a section empty, the section auto-collapses (no header rendered). Valid ids — exported as `FIELD_IDS`:

- **General**: `health`, `size`, `training`, `ecm`, `ciws`, `supply`, `transport`, `prototype`, `command`, `era`
- **Mobility**: `speed`, `forestSpeed`, `swimSpeed`, `roadSpeed`, `autonomy`, `fuel`, `refuelTime`, `altitude`, `turnRadius`, `accelDecel`, `sailing`
- **Optics**: `stealth`, `optics`, `seaOptics`, `airStealth`, `airOptics`
- **Armor**: `armorFront`, `armorSide`, `armorRear`, `armorTop`
- **Armament** (per-weapon row inside each weapon block): `weaponRange`, `weaponAccuracy`, `weaponStabilizer`, `weaponAp`, `weaponHe`, `weaponSuppress`, `weaponDispersion`, `weaponDmgRadius`, `weaponSuppRadius`, `weaponMissileSpeed`, `weaponAimTime`, `weaponRof`, `weaponSalvoSize`, `weaponNoise`, `weaponRearm`, `weaponSupply`

### Examples

```jsx
// Static card, no vet bar:
<V2Card unit={u} vetIdx={0} setVetIdx={() => {}} hide={{ sections: ['vet'] }} />

// Drop derived speeds (apps that don't want our motionType-derived rows):
<V2Card unit={u} vetIdx={v} setVetIdx={setV}
  hide={{ fields: ['roadSpeed', 'forestSpeed', 'swimSpeed'] }} />

// Combat-only summary:
<V2Card unit={u} vetIdx={v} setVetIdx={setV}
  hide={{ sections: ['mobility', 'optics'] }} />
```

### `useHide()`

Inside a custom card section/primitive, read the active suppression with:

```js
const hide = useHide();
if (!hide.field('mything')) return null;
```

`useHide()` outside a `V2Card` returns predicates that always permit rendering, so primitives are safe to use standalone.

## Theme

`V2_THEMES.tactical` and `V2_THEMES.signal` are the two card palettes. `BROWSER_TOKENS` and `BMono` are the chrome tokens used by the armory shell — reuse them in apps that want the same look. The CSS variables (`--wrd-mono`, `--wrd-bg`, etc.) are defined globally in `src/index.css` and mirror these JS objects.

## Sizing notes

`units-core` is sizing-agnostic. The card and list use raw `px` values that look correct at 100% browser zoom. If your app wants a larger UI, apply `zoom: <factor>` (or equivalent) on its root container — see `src/armory/layout.css` for an example. The card itself does not enforce any aspect ratio; if you want one (e.g. the armory's 8.5:10 cap), wrap the card in a sized container.

## Weapon block and accuracy math

`WeaponBlock` (one weapon's card block, as used inside `V2Card`'s armament section) is exported for tools that show a single weapon. Wrap it in `<HideContext.Provider value={makeHide({ fields })}>` to trim rows. Optional props for hit-chance tools:

| prop | notes |
|---|---|
| `activeRange` | label of the range row to mark with ▸ (`'Range'`, `'Range G'`, `'Range G AP'`, `'Range G HE'`, `'Range H'`, `'Range A'`, `'Range S'`); the other range values are greyed out |
| `onRange` | `(label) => void`; makes the range rows clickable |
| `activeDamage` | `'AP'` or `'HE'`, marks the damage and aim time rows in use and greys the others |
| `accMode` | `'acc'` or `'stab'`, marks the accuracy or stabilizer row |
| `onAccMode` | `(mode) => void`; makes the accuracy and stabilizer rows clickable |
| `vetAccuracyOnly` | show only the veterancy-adjusted accuracy and stabilizer, without the base value |
| `effectiveAp`, `apNote` | AP value to show instead of `w.ap` (e.g. KE AP at a distance), and its tooltip |
| `open`, `onToggle` | with `onToggle`, clicking the header shows or hides the rows (`open`, default true) |

`format/accuracy.js` holds the game's accuracy formula, `hit = erf(accMul * erfinv(base) * maxRange / range)`:

- `erf(x)`, `erfinv(y)`
- `scaledAccuracy(basePct, accMul, rangeMul = 1)` → hit fraction; `rangeMul` is `maxRange / distance`
- `vetAccuracy(basePct, accMul)` → the floored percentage the card shows at max range

## Combat

`combat/` is the shared engagement model for the accuracy and combat tools. Each step takes a weapon, a target unit and (where it applies) the firing conditions:

- `targeting.js`: `targetDomain(unit)` (GROUND / HELO / AIR / SHIP), `rangeAgainst(w, target)` → `{ range, label }`, `targetModifiers(unit)` → `{ size, ecm }`, `canEngage(w, target)` → `{ ok, reason, range, rangeLabel, domain }`. A weapon can't engage a domain it has no range for, and infantry can't be engaged without HE (`hasHE` in `format/weapon.js`).
- `hit.js`: `hitChance(w, target, { distance, vetIdx, morale, mode })` → `{ ok, reason, hit, frac, range, rangeLabel, steps }`. `steps` is the per-modifier breakdown.
- `conditions.js`: `MORALE` multipliers, `lowestVet(unit)`.
- `damage.js`: `calcKeDamage`, `calcHeatDamage`, `keEffectiveAP` (AP damage per hit against an armor value; also used by the AP damage tool). `FACINGS` (front, side, rear; top armor isn't hit by direct fire), `hasArmor(unit)` (vehicles and ships), `COVER` (open, forest, building: infantry takes ×1, ×0.6, ×0.3 damage) and `coverOf(target, key)` (open for anything but infantry), `damagePerHit(w, target, { facing, cover, distance, range })` → `{ ok, reason, kind: 'KE' | 'HEAT' | 'HE', dmg, ap, armor, cover, armorMul }`. Helicopters, planes and infantry take HE; against armor, weapons with AP use it and weapons without AP can only damage armor up to `HE_MAX_ARMOR` (2), doing `HE_ARMOR_MUL` (×0.6) at exactly 2. `isInfantryArms(w)` (infantry rifle and MG tags) marks weapons that can't damage any armor above 0.
- `fire.js`: `aimTime(w, kind)`, `shotTimes(w, seconds, kind)` → the times of the shots fired in the first `seconds` (aim time, then the card's RoF, capped at ammo).
- `outcome.js`: `damageOutcome({ shots, p, dmg, hp })` → binomial damage distribution capped at `hp`: `{ mean, worst, best (10th / 90th percentile), kill, … }`.
- `engagement.js`: `canDamage(w, target, facing)` (engage + armor check), `engagement(w, target, { ...hitConditions, facing, cover, seconds })` → `{ ok, reason, hit, damage, times, outcome }`.

## Compare UI

`compare/` holds the pieces the accuracy and combat tools share: `UnitPicker` (the selected unit, which turns into a search box with the unit list dropdown when clicked; `beside` puts e.g. the weapon tabs on the same row), `SeriesChart` (0–100% per series along an x axis, with optional dotted low/high lines, that doubles as the control for x; `aside` puts a node such as a `VerticalSlider` beside the plot) and its distance preset `DistanceChart`, `CompareHeader`, `CrewControls` (veterancy and morale gauges, built on `LevelMeter`), `SquarePicker` (a row of small squares, name over a colored value) and `ArmorPicker` (armor squares with pickable facings), `ControlRow`, `WeaponTabs` (`max` caps the tabs, the last one opening a menu of the rest), `CalcSteps` and helpers (`themeOf`, `distanceScale`, `effectiveWeapon`, …). Tools that use them import `@units-core/compare/compare.css` in their `main.jsx`.

