# AGENTS.md

## Project Snapshot
- This repo is a static content workspace for a D&D character dashboard.
- The primary app is still `character-sheet/character-sheet.html`, but character content now lives in separate JSON files under `character-sheet/data/`.
- The live UI currently uses Google Fonts (`Noto Sans`, `Noto Serif`) from the HTML `<head>`; `font/` exists, but is not the active font source.

## Where Core Logic Lives
- `character-sheet/character-sheet.html` is the source of truth for structure, styling, and behavior.
- Character content is loaded at runtime from `character-sheet/data/*.json` via the `?data=` query parameter.
- Each JSON currently includes: identity/vitals (`ac`, `init`, `speed`, `size`), `spellcasting`, `hitDice`, `stats`, `savingThrows`, rank-based `skills`, `attacks`, `inspiration`, `spellSlots`, `coins`, `proficiencies`, `equipment`, `spells`, and array-based `features`.
- Runtime state now includes `tempHP`, `deathSaves`, `featureCounters`, `hitDiceSpent`, `rollHistory`, and the last-roll modal timer.

## Architecture and Data Flow
- Startup path: `window.onload = init` -> `fetchSheetData()` loads the JSON -> `render()` paints vitals, stats, skills, saves, attacks, spellcasting, features, spells, equipment, coins, proficiencies, and hit dice, then calls `load()`.
- Persistence path: `load()` restores state from `localStorage`; `save()` writes current HP/temp HP/AC/inspiration/coins/spell slots/feature checks/hit dice usage.
- Interaction path:
  - HP actions call `adjustHP('dmg'|'heal'|'temp')`.
  - Feature counters call `tglFeature(this)`.
  - Hit dice bubbles call `toggleHitDie(this, event)`; the hit-dice label rolls healing separately.
  - Dice rolling flows through `showRollResult()` and updates both the history modal and the temporary last-roll modal.
  - `shortRest()` partially refills counters using each row's `data-short-rest` value.
  - `longRest()` restores HP, resets AC to base AC, clears temp HP and inspiration, resets hit dice usage, and clears resource/feature counters.
- Storage key convention: `dnd_${STORAGE_VERSION}_${sheetData.id}`; the current storage version is `v8`.

## Project-Specific Conventions
- Prefer editing the JSON files in `character-sheet/data/` for content changes instead of hardcoding values in DOM markup.
- Preserve existing inline event wiring (`onclick`, `onchange`) unless you migrate all handlers consistently.
- `render()` and helpers append HTML (`innerHTML +=`) for stats/skills/saves/attacks/spells/features/equipment; avoid calling them repeatedly without clearing containers first.
- HP rules encoded in `adjustHP()` are gameplay-critical:
  - Damage consumes `tempHP` first.
  - Excess damage after temp HP reduces current HP.
  - Heal is capped at `sheetData.hpMax`.
- Current HP is clamped to `0`; dropping to `0` reveals the death save UI.
- Skill bonuses are derived from `skills[].statIndex`, `skills[].s` (0 / 0.5 / 1 / 2), and `sheetData.prof`.
- Spell cards are curated in `sheetData.spells`; they are not loaded from `hunbrew-ve-tools/hun-spell.json` at runtime.
- Pages entry links are generated from the JSON files by `scripts/build-pages.mjs`; keep CI logic minimal and move file-discovery logic into repo scripts.

## Developer Workflow (Current Repo)
- `npm run build:pages` creates `dist/` for GitHub Pages and generates the landing page from `character-sheet/data/*.json`.
- Typical validation is: run a local static server, open the generated or source `character-sheet/character-sheet.html?data=data/<file>.json`, and verify UI + `localStorage` behavior.
- Useful lightweight validation: extract the inline `<script>` and run `node --check` on it after non-trivial JS edits.
- Keep changes dependency-free unless explicitly requested; project intent in `character-sheet/character-sheet-ai.md` is vanilla single-file operation.

## Integration Points to Respect
- External dependency: Google Fonts URL in `character-sheet/character-sheet.html`.
- Browser API dependency: `localStorage` schema is currently `{ hp, thp, acCurrent, inspiration, coins, spellSlots, featureChecked, hitDiceSpent }`.
- `deathSaves`, roll history, and the last-roll / feedback modal timers are runtime-only and are not persisted.
- `hunbrew-ve-tools/hun-spell.json` is currently a reference source for spell metadata structure and terminology, not an active runtime dependency.
- Responsive behavior relies on specific breakpoints and sticky vitals CSS; verify mobile (`<1024px`) and desktop layouts after edits.

## High-Value Files for Fast Context
- `character-sheet/character-sheet.html` - implementation and behavior.
- `character-sheet/data/*.json` - character content source files.
- `scripts/build-pages.mjs` - GitHub Pages artifact builder and landing-page generator.
- `.github/workflows/pages.yml` - deployment workflow.
- `character-sheet/character-sheet-ai.md` - design goals, milestone history, and intended feature direction.
- `hunbrew-ve-tools/hun-spell.json` - Hungarian spell metadata reference for spell school/range/time/duration/components/ritual/concentration wording.
- `README.md` - local build and deployment notes.


