# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A set of static, client-only tools for Wargame: Red Dragon (armory, deck builder, AP damage, optics, spreadsheets, community decks). It's deployed to GitHub Pages at `/wgrd-toolbox/` and has no backend. All unit data is precomputed JSON served from `public/`.

## Commands

```bash
npm install
npm run generate   # python scripts/enrich.py --out-dir public  → writes public/units.json + spreadsheet dumps
npm run dev        # vite dev server (needs `generate` first, or the apps fail to load data)
npm run build      # vite multi-page build → dist/
npm run preview
```

There are no tests, linter or type checker. To check a change, run `npm run build` and look at the page in `npm run dev`.

Deployment (`.github/workflows/deploy.yml`) runs on every push to `main`: it runs `enrich.py --out-dir public`, then `npm run build`, then publishes `dist/` to Pages. Generated `public/*.json` is gitignored and rebuilt in CI, so changes to `data/` or `enrich.py` go live on deploy.

## Data pipeline

```
everything.ndfbin (game, decompressed) ──extract.py──▶ data/master.json ──enrich.py──▶ public/units.json + public/<category>.json
```

- **`scripts/extract.py`** parses the game's NDF binary. You run it by hand and rarely need to. Use `--extract --dic unites.dic > master.json` for the full extract, `--inspect ALIAS` to debug one unit, and `--extract-deck --deck-file data/deck_indices.json` for the deck-code serialization indices.
- **`scripts/enrich.py`** never modifies `master.json`. It runs an ordered `HANDLERS` list, where each entry is `(name, fn, input_file_or_None)`. Input files in `data/` are matched by name (`.txt`/`.tsv` are parsed as rows, `.json` is loaded as-is). A handler whose input file is missing is skipped. Handlers:
  - patch values that can't be extracted (turrets, autoloaders, ships, ASM AP)
  - merge or split duplicate weapons
  - add weapon tags (`AC`, `MG`, `GL`, `ATGM`, …) and unit `ownTags`
  - stamp `deckIndex`/`deckCat`/`deckSide` from `deck_indices.json`
  - add spreadsheet category labels, and write one dump file per category (e.g. `tanks.json`, `spaags.json`) into the out dir

  Handler order matters, because later handlers read tags set by earlier ones. At the end, the script prints a summary of names in `data/*.txt|tsv` that didn't match any unit. Check it after editing those files.
- **Encoding gotcha:** `master.json`, `units.json`, the dump files and `deck_indices.json` are **UTF-16** JSON (`load_json`/`save_json` in enrich.py). Plain `json.load(open(...))` fails on them. The frontend detects the UTF-16 BOM on load (`units-core/data/loader.js`, `SpreadsheetApp.jsx`'s `fetchJson`).
- Running `enrich.py` without `--out-dir` writes into `data/`, which overwrites the tracked `data/units.json` and drops untracked dump files there. Use `npm run generate` unless that's what you want.

## Frontend architecture

- **Vite multi-page app, React 18, plain JS/JSX.** Each tool has an HTML entry at `<tool>/index.html` that loads `src/<tool>/main.jsx`. The entries are listed in `vite.config.js` under `rollupOptions.input`. Adding a tool means adding its HTML entry, its Vite input, its `src/<tool>/` directory and an entry in `MODULES` in `src/home/Home.jsx`.
- **`src/units-core/`** (alias `@units-core`) is the shared library. It covers data loading, URL unit selection, filter state, the virtualized unit list, the `V2Card` unit card, theme tokens, the nation/coalition/spec constants and the UI zoom store. Import it through `src/units-core/index.js`. `src/units-core/README.md` documents the API, including the `hide={{sections, fields}}` deny-list for trimming cards. It doesn't cover the zoom, theme and expert-mode exports that were added later. `UiControls` (zoom and theme buttons) goes right after each tool's logo.
- `loadData()` adds derived fields on the client. These are `nationName`, `era`, `trainingLabel` and the vehicle `roadSpeed`/`forestSpeed`/`swimSpeed` computed from `motionType`. Some stats therefore come from enrich.py and others from `loader.js`.
- The spreadsheet tool doesn't use `units.json`. Each dataset in `src/spreadsheet/datasets.js` fetches its own enrich dump file (`file: 'tanks.json'`, …), so adding a spreadsheet category needs a new enrich handler to produce that file.
- The deck builder's `deckCodec.js` encodes and decodes the game's binary deck codes (`@…` base64 bit-packed). It relies on the enrich-stamped `deckIndex` fields.
- Tools share state and link to each other through URL query params (`?unit=<id>`, `?tags=…`, `?deck=…`, links to `apdamage/?…` and `optics/?…`). Keep these param formats stable, because the README and the community link to them.
- **Styling:** mostly inline style objects built from `BROWSER_TOKENS`/`BMono`/`V2_THEMES` (`units-core/constants/theme.js`), plus per-tool `layout.css`/`styles.css`. The JS tokens (and the tier colors in `units-core/format/tiers.js`) are `var(--wrd-…)` references. Their dark values live in `src/index.css` under `:root`, and their light values under `:root[data-theme="light"]`. `themeStore.js` sets `data-theme` from localStorage, and an inline script in each HTML entry sets it early to avoid a flash. Use tokens rather than hex literals, or the light theme breaks. apdamage and spreadsheet have their own dark-only palettes. UI scale is a CSS `zoom` driven by the `--wrd-zoom` variable. `zoomStore.js` sets it from localStorage, and each tool's `main.jsx` imports it for that side effect.
- Build every asset and data URL from `import.meta.env.BASE_URL`. Don't hardcode `/`, because the site is served under `/wgrd-toolbox/`.
- `public/data/decks.json` (tracked, hand-edited) is the curated community deck list for the `decks` tool.
