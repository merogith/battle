# Codebase Map

> **Orientation doc.** For exact `file:line` anchors use **`agent-state/ANCHOR_INDEX.md`**
> or the `find-anchor` / `anchor` skill — line numbers drift constantly in the monolith and
> are deliberately NOT duplicated here anymore (they were ~2× stale for a long time).

## Layout
- `battle.html` — **~60,130 lines**. Monolithic game (HTML + CSS + JS). All gameplay lives here.
  - CSS: `<style>` block, lines **16 – 8368**.
  - HTML body / screens, then one big `<script>` with the engine + Story Mode IIFE.
- `data/` — JSON keyed by generation; **the engine loads only the `"9"` key** of each
  (`species`/`moves`/`items`/`abilities`/`natures`). Older-gen keys are a vestigial
  Showdown-format mirror and are never read. `data/builds/gen[4-9].json` likewise mirror
  `data/builds.csv` (the authoritative build source).
- `move-anim-map.js`, `move-sfx-map.js`, `online-pvp.js`, `online-config.js` — sibling modules.
- `scripts/dev-server.cjs` — `npm start` → `:5173/battle.html`.
- `scripts/debug/` — the multi-agent debug system (`issue-ledger.mjs`, `spec-drift.mjs`,
  `perf-bench.mjs`, `symbol-index.mjs`).

## Tests / CI
- **There IS a test suite** (jsdom harness, `node --test`): ~1,280 tests across `tests/`,
  loaded via `tests/helpers/load-engine.js` (boots battle.html headlessly, exposes
  `window.__engine` / `window.__storyTest`, seeds mulberry32). Run with `npm test`.
- ~351 `it.todo()` move-test stubs remain (clustered by setup-shape).

## Save schema
- **`SAVE_VER = 22`.** Migrations present: `migrateStoryPreV8/15/16/17/19/20/21/22` plus
  `migrateStoryTrainerDiacriticsPreV18` (v18 is a diacritic-only content migration, not a
  schema gap). v21 = relative egg-hatch; v22 = 3-track narrative collapse (Mystery Figure
  roster reduced to a single `the_first`).

## Key facts that bite (verify against code, not memory)
- **Difficulty foe scaling is keyed by event ROW ID, not array index** (`applyStoryLeagueFoeStatBoost`
  stores an additive delta merged by `applyFoeDifficultyScaling`). League boost + difficulty
  stack **additively**; Crucible Hard Mode's ×1.30 is a separate multiplier.
- **Early-game softening** uses `FOE_STAT_NERF_BY_CITY = [0.80,0.85,0.90]` (city-indexed,
  City ≥3 → 1.0) plus a separate `_stageGatedFoeStatMult`. (The spec's named badge/event
  constants do not exist in code.)
- **Wild grade curve** is `STORY_WILD_GRADE_BY_CITY` (city-keyed), via `_wildGradeWeightsForCity`.
  (No `_WILD_GRADE_CURVE_BY_BADGES`.)
- **Catching** is gated by `sm.catchTutorialDone` (set after the intro rival) — there is no
  `catchMode` setting.
- **`SAFARI_ENTRY_COST = 10000`**. PC box cap is enforced in `pcSell`/`pcRelease`.
- Story RNG: `storyRngNext` (seeded LCG) via the `storyAwareRng()` helper, which returns
  `Math.random` outside an active story run.

## Coding conventions
- Match surrounding code; comment only non-obvious WHY. Don't reformat unrelated code.
- Function naming: camelCase. Module-style globals (`window.StoryMode.*`) where exposed.
- Per-feature commits, small reversible diffs. Every fix lands with a test where testable.
