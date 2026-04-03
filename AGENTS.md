# AGENTS.md

## Project Snapshot
- This repo is a static content workspace for a D&D character dashboard.
- The primary app is a single self-contained file: `character-sheet/character-sheet.html` (HTML + CSS + JS in one document).
- The live UI currently uses Google Fonts (`Noto Sans`, `Noto Serif`) from the HTML `<head>`; `font/` exists, but is not the active font source.

## Where Core Logic Lives
- `character-sheet/character-sheet.html` is the source of truth for structure, styling, and behavior.
- Character content is centralized in `const sheetData`.
- `sheetData` currently includes: identity/vitals, `hitDice`, `stats`, `savingThrows`, rank-based `skills`, `attacks`, `resources`, `spells`, and array-based `features`.
- Runtime state now includes `tempHP`, `deathSaves`, `featureCounters`, `hitDiceSpent`, `rollHistory`, and the last-roll modal timer.

## Architecture and Data Flow
- Startup path: `window.onload = render` -> `render()` paints stats, skills, saves, attacks, resources, features, spells, and hit dice, then calls `load()`.
- Persistence path: `load()` restores state from `localStorage`; `save()` writes current HP/temp HP/resource checks/feature checks/hit dice usage.
- Interaction path:
  - HP actions call `adjustHP('dmg'|'heal'|'temp')`.
  - Resource bubbles call `tgl(this)`.
  - Feature counters call `tglFeature(this)`.
  - Hit dice bubbles call `toggleHitDie(this, event)`; the hit-dice label rolls healing separately.
  - Dice rolling flows through `showRollResult()` and updates both the history modal and the temporary last-roll modal.
  - `shortRest()` partially refills counters using each row's `data-short-rest` value.
  - `longRest()` restores HP, clears temp HP, resets hit dice usage, and clears resource/feature counters.
- Storage key convention: ``const KEY = `dnd_v6_${sheetData.id}`;``. Keep this stable to avoid breaking saved sessions.

## Project-Specific Conventions
- Prefer editing `sheetData` for content changes instead of hardcoding values in DOM markup.
- Preserve existing inline event wiring (`onclick`, `onchange`) unless you migrate all handlers consistently.
- `render()` and helpers append HTML (`innerHTML +=`) for stats/skills/saves/attacks/resources/spells/features; avoid calling them repeatedly without clearing containers first.
- HP rules encoded in `adjustHP()` are gameplay-critical:
  - Damage consumes `tempHP` first.
  - Excess damage after temp HP reduces current HP.
  - Heal is capped at `sheetData.hpMax`.
- Current HP is clamped to `0`; dropping to `0` reveals the death save UI.
- Skill bonuses are derived from `skills[].statIndex`, `skills[].s` (0 / 0.5 / 1 / 2), and `sheetData.prof`.
- Spell cards are curated in `sheetData.spells`; they are not loaded from `hunbrew-ve-tools/hun-spell.json` at runtime.

## Developer Workflow (Current Repo)
- No package manager, build step, or test runner is defined in the repository.
- Typical validation is manual: open `character-sheet/character-sheet.html` in a browser and verify UI + `localStorage` behavior.
- Useful lightweight validation: extract the inline `<script>` and run `node --check` on it after non-trivial JS edits.
- Keep changes dependency-free unless explicitly requested; project intent in `character-sheet/character-sheet-ai.md` is vanilla single-file operation.

## Integration Points to Respect
- External dependency: Google Fonts URL in `character-sheet/character-sheet.html`.
- Browser API dependency: `localStorage` schema is currently `{ hp, thp, checked, featureChecked, hitDiceSpent }`.
- `deathSaves`, roll history, and the temporary last-roll modal are runtime-only and are not persisted.
- `hunbrew-ve-tools/hun-spell.json` is currently a reference source for spell metadata structure and terminology, not an active runtime dependency.
- Responsive behavior relies on specific breakpoints and sticky vitals CSS; verify mobile (`<1024px`) and desktop layouts after edits.

## High-Value Files for Fast Context
- `character-sheet/character-sheet.html` - implementation and behavior.
- `character-sheet/character-sheet-ai.md` - design goals, milestone history, and intended feature direction.
- `hunbrew-ve-tools/hun-spell.json` - Hungarian spell metadata reference for spell school/range/time/duration/components/ritual/concentration wording.
- `README.md` - minimal project root descriptor (currently only project name).


