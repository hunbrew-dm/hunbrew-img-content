# AGENTS.md

## Project Snapshot
- This repo is a static content workspace for a D&D character dashboard.
- The primary app is a single self-contained file: `character-sheet/character-sheet.html` (HTML + CSS + JS in one document).
- `font/` contains local font assets, but the current UI also loads Google Fonts in the HTML `<head>`.

## Where Core Logic Lives
- `character-sheet/character-sheet.html` is the source of truth for structure, styling, and behavior.
- Character content is centralized in `const sheetData` (name, stats, skills, attacks, resources, features).
- Runtime state is intentionally minimal: `tempHP` and checked resource bubbles.

## Architecture and Data Flow
- Startup path: `window.onload = render` -> `render()` paints static data and UI blocks.
- Persistence path: `load()` restores state from `localStorage`; `save()` writes current HP/temp HP/checked bubbles.
- Interaction path:
  - HP actions call `adjustHP('dmg'|'heal'|'temp')`.
  - Resource bubbles call `tgl(this)`.
  - `Long Rest` calls `longRest()` and resets transient combat state.
- Storage key convention: ``const KEY = `dnd_v6_${sheetData.id}`;``. Keep this stable to avoid breaking saved sessions.

## Project-Specific Conventions
- Prefer editing `sheetData` for content changes instead of hardcoding values in DOM markup.
- Preserve existing inline event wiring (`onclick`, `onchange`) unless you migrate all handlers consistently.
- `render()` appends HTML (`innerHTML +=`) for stats/skills/attacks/resources; avoid calling it repeatedly without clearing containers.
- HP rules encoded in `adjustHP()` are gameplay-critical:
  - Damage consumes `tempHP` first.
  - Heal is capped at `sheetData.hpMax`.

## Developer Workflow (Current Repo)
- No package manager, build step, or test runner is defined in the repository.
- Typical validation is manual: open `character-sheet/character-sheet.html` in a browser and verify UI + `localStorage` behavior.
- Keep changes dependency-free unless explicitly requested; project intent in `character-sheet/character-sheet-ai.md` is vanilla single-file operation.

## Integration Points to Respect
- External dependency: Google Fonts URL in `character-sheet/character-sheet.html`.
- Browser API dependency: `localStorage` schema `{ hp, thp, checked }` used by `save()`/`load()`.
- Responsive behavior relies on specific breakpoints and sticky vitals CSS; verify mobile (`<1024px`) and desktop layouts after edits.

## High-Value Files for Fast Context
- `character-sheet/character-sheet.html` - implementation and behavior.
- `character-sheet/character-sheet-ai.md` - design goals, milestone history, and intended feature direction.
- `README.md` - minimal project root descriptor (currently only project name).


