# Wave 5 — Data-driven inventory & extraction analysis

> **What this is**: An audit of what's already data-driven, what's hardcoded but shouldn't be, and what's hardcoded and *should stay* hardcoded. Drives the extraction plan for Wave 5.
>
> **Why**: User asked "investigate what can be added and what is already added. what is already data driven what can be what should be."

---

## A. What's ALREADY data-driven (do not re-extract)

### A.1 Engine data — full source-of-truth in `data/`

| File | Lines | Source | Notes |
|---|---|---|---|
| `data/species.json` | 1,380 species | @pkmn/dex via `sync-showdown-data.js` | Stats, types, abilities, learnsets |
| `data/moves.json` | 954 moves | @pkmn/dex | Power, accuracy, type, effects, descriptions |
| `data/abilities.json` | 314 abilities | @pkmn/dex | Effects + descriptions |
| `data/items.json` | 583 items | @pkmn/dex | Effects + descriptions |
| `data/natures.json` | 25 natures | @pkmn/dex | Stat multipliers |
| `data/op-abilities.json` | curated set | `scripts/gen-op-abilities.mjs` | Awakened ability rolls |
| `data/builds/gen{4..9}.json` | competitive sets | `scripts/generate_builds.js` | Smogon-style sets per gen |
| `data/builds.csv` | full snapshot | rebuild from JSON | 1,147 Pokémon, 748 illegal-flagged |
| `data/all_moves_from_builds.txt` | move usage | snapshot | Debug helper |

**Status**: Fully driven. Boot loads them. No extraction work needed here.

### A.2 Design-side CSVs in `design/MASTER_*.csv` (maxwell's curve canon)

11 files: city facilities, wild curve, professor curve, enemy trainer curve, trainer types & pools, grade profiles by type, signature/ace rules, rival counter, tutor/dojo, audit findings.

**Status**: Maxwell's source of truth. These ARE the curve/balance authoring layer.
**Do not touch** unless invited by maxwell lineage.

### A.3 Design-side CSVs in `docs/story-design/*.csv` (pasteur's flow canon)

14 files: story cities, core structure, facility debut, flow-optimized, intros, IV tiers, power curve, service availability, shops, timeline, tunables, plus 3 derived markdowns.

**Status**: Pasteur's source of truth. These ARE the timeline/flow authoring layer.
**Do not touch** unless invited by pasteur lineage. Cross-reference allowed.

### A.4 Existing CSV → code build pipelines

| Script | Reads | Writes | Owner |
|---|---|---|---|
| `scripts/build-dojo-dex.mjs` | @pkmn/data + op-abilities.json | `docs/dojo-dex/dex.json` + per-gen md | maxwell |
| `scripts/build-story-scenes.mjs` | story CSVs | `scripts/build/story-scenes.generated.js` | pasteur |
| `scripts/inject-story-scenes.mjs` | generated js | `battle.html` (in-place) | pasteur |
| `scripts/gen-op-abilities.mjs` | curated picks | `data/op-abilities.json` | shared |
| `scripts/generate-meta-analysis-csv.mjs` | code | meta CSVs | shared |
| `scripts/sync-showdown-data.js` | @pkmn/dex | `data/*.json` | shared (run on PS bump) |

**Pattern for me to follow**: `build-dojo-dex.mjs` is the cleanest CSV-driven build pattern. New pipelines should mirror its shape.

---

## B. What's INLINE in `battle.html` but SHOULD be data-driven (extraction targets for general session)

### B.1 Dialogue pools — high value, low risk ✅ EXTRACT

| Symbol | Line | Size | Used by |
|---|---|---|---|
| `LEADER_VICTORY_LINES` | 31918 | 8 leaders | Post-gym dialogue |
| `MYSTERY_FIGURE_IDENTITIES` | 32411 | 8 reveal blocks | MF reveal flow |
| `TRAINER_QUOTES` | 33307 | by type | Trainer intro lines |
| `TRAINER_QUOTES_BY_NAME` | 33321 | by name | Named-trainer intros (bosses, mini-bosses) |
| `CITY_GUIDE_QUOTES` | 33657 | wider pool | City-tile guide flavor |

**Recommendation**: Extract all 5 to `data/dialogue/*.json`. Loaded at boot via a small loader; on parse failure, surface the line + JSON path. No game-behavior change — same lines, different storage.

**Out of scope for me (pasteur owns)**: `STORY_BEATS` (38919), `STORY_COLD_OPENS` (38945), `STORYLINE_VARIANTS` (40286). These are story-flow structures, not flavor pools. Leave them.

### B.2 Type chart — small, high value ✅ EXTRACT

`typeChart` at line 11001 — single one-line literal containing all 18 types' effectiveness against all 18 types. Currently includes a `"???":{}` empty stub (already noted as a finding for the engine sweep).

**Recommendation**: Extract to `data/type-chart.json`. Add `???` row with the correct defenses (all 1× per Showdown spec). Boot-time load.

**Risk**: 1 site read — `getTypeEffectiveness`. Verify with deterministic seed test.

### B.3 Ball math constants — tiny, but currently UNDOCUMENTED ⚠️ EXTRACT WITH CARE

The ball math constants from `story-tunables.csv`:
```
catch_base_g1 = 0.12
catch_base_g2 = 0.22
catch_base_g3 = 0.35
catch_base_g4 = 0.50
ball_mult_poke/great/ultra = 1.0 / 1.5 / 2.0
master = guaranteed
safari_ball_mult = 1.35
```

**Currently**: These exist in `story-tunables.csv` as DOCUMENTATION but the actual values in battle.html are inline literals scattered through the catch math function. **The CSV is not enforced.** This is the most dangerous "data-driven looking" pattern in the repo.

**Recommendation**: Extract to `data/story/ball-math.json` and have battle.html load from it. Then `story-tunables.csv` becomes derived (or deleted) — single source of truth wins. **Coordinate with maxwell** — these values are balance, which means user owns them, but the *extraction* is mine.

### B.4 Shop catalogs — already CSV-mirrored, need real wiring ⚠️ EXTRACT WITH CARE

`POKEMART_ITEMS` (32542) and `DEPT_ITEMS` (32562) in battle.html are LITERALLY a copy of `docs/story-design/story-shops.csv` with no generation link.

Verified by diff — they currently match (one drift exception: `Poké Ball` is price 200 in the spec banner but price **300** in code and CSV. The spec banner is the outlier, not the CSV).

**Recommendation**: Generate `POKEMART_ITEMS` / `DEPT_ITEMS` / `STONE_SHOP_ITEMS` from `story-shops.csv` at build time (mirror `build-dojo-dex.mjs` pattern). CSV stays the editable file; battle.html gets generated arrays. Prevents future drift.

### B.5 UI / error strings — medium value, big sweep ⚠️ EXTRACT IF FUTURE i18n IS DESIRED

Found 11 `throw new Error('...')` and 1 `window.alert(...)` site in battle.html. These are sparse — much less than I feared.

Also: button labels, screen titles, modal copy. These are scattered through inline HTML and template literals.

**Recommendation**: ⚠️ NOT URGENT. Doing this only pays off if multi-language support is planned. If yes → `data/strings/en.json`. If no → skip; the value is low for a single-language project.

### B.6 Sprite + SFX maps — borderline, not urgent

- `BALL_SPRITE` (28554) — sprite paths, 4 keys
- `CITY_GUIDE_SPRITES` (33848) — 5 sprite names, 1 line
- `MOVE_SFX_MAP` (and similar) — present, with duplicate-spelling entries noted in hallucination audit

**Recommendation**: Defer. These are tiny, infrequently edited, low payoff.

---

## C. What's INLINE in `battle.html` and SHOULD STAY inline (do NOT extract)

| Symbol | Line | Why it stays |
|---|---|---|
| `STORY_EVENTS_RAW` | 29701 | pasteur's story timeline — touching it = stepping on toes |
| `STORY_BEATS` | 38919 | pasteur — narrative beat structure |
| `STORY_COLD_OPENS` | 38945 | pasteur — variant cold opens |
| `STORYLINE_VARIANTS` | 40286 | pasteur — 8 variant trees |
| Curve constants (`PRE_GYM1_FOE_STAT_MULT`, `_WILD_GRADE_CURVE_BY_BADGES`, etc.) | various | maxwell — difficulty pacing |
| IV tier ranges (`STORY_IV_TIER_RANGES`) | 38883 (approx.) | maxwell — IV gating |
| Battle damage formula constants (STAB, crit, type mult) | engine core | Game-mechanics, change only with user sign-off |
| `BALL_SPRITE` paths | 28554 | Trivial, no churn |

Reason: these aren't dialogue or strings. They're *mechanics*. Moving them to JSON adds a runtime dependency without buying editability — the structure encodes logic, not content.

---

## D. The "Pokemon" diacritic sweep — much smaller than I thought

| Location | Raw count | Real targets |
|---|---|---|
| `battle.html` CSS comments | ~10 | Trivial; can sweep |
| `battle.html` code identifiers (`buildPokemon`, `undraftPokemon`, `pokeball`) | ~70+ | **NO** — these are code, not text. Renaming = breakage |
| `battle.html` user-facing strings | **0 confirmed** | Already correct. Surprising! |
| `data/moves.json` descriptions | 414 | Imported from PS — re-import would un-fix |
| `data/abilities.json` descriptions | 714 | Imported from PS |
| `data/items.json` descriptions | 135 | Imported from PS |
| `data/species.json` | 2 | Imported from PS |
| Docs in `docs/`, `STORY_MODE_FLOW.md` | ~10 | Low impact |

**Original estimate (99 places) was wrong** — that count was naïve grep. True user-facing diacritic gaps in `battle.html` are **0**.

**Revised recommendation**:
- **a11y / quality**: data/*.json description sweep — 1,265 instances. Run via `scripts/sync-showdown-data.js` patch that adds the diacritic after import. Loses re-import idempotency unless the patch is re-applied. Worth it if descriptions are shown verbatim in the UI tooltip.
- **CSS comments**: trivial sweep, ~10 instances. No-op.
- **Skip the code identifier rename** entirely.

**Verdict**: NOT a top priority extraction. Defer until after dialogue/type-chart/balls land.

---

## E. Recommended Wave 5 sequence (revised after inventory)

The original plan said 4 extractions in parallel. After inventory, the right ordering is:

1. **5A — Dialogue pools** to `data/dialogue/*.json` (lowest risk, highest editability win)
   - Add `loadDialogue()` boot hook
   - Extract 5 constants to 5 JSON files (one per pool)
   - Pure read-side, no game-behavior change
   - Verify with autopilot run + screenshot regression

2. **5D — Type chart** to `data/type-chart.json` (small, isolated)
   - Single inline literal → 1 JSON file
   - Add `???` row at the same time (engine fix from Wave 1 batch)
   - Verify with seed test

3. **5C — Ball math** to `data/story/ball-math.json` (coordinate with you — these are tunables you own)
   - Extract catch rates, ball mults, safari mult to JSON
   - Replace inline literals with constant reads
   - **This is the one that needs user sign-off on direction** — even though values stay the same, you should know the catch math is now editable in one place
   - Update `story-tunables.csv` to mark "data-driven via `data/story/ball-math.json`"

4. **5B — Shop catalog wiring** (CSV → generated array)
   - Mirror `build-dojo-dex.mjs` pattern
   - `story-shops.csv` becomes source of truth
   - Build script emits a small JSON or generated JS
   - battle.html `POKEMART_ITEMS` / `DEPT_ITEMS` / `STONE_SHOP_ITEMS` populated from the file
   - **This catches the "Poké Ball price 200 in spec vs 300 in code" drift class going forward**

5. **5E — Validator extension** (data integrity)
   - Extend `scripts/debug/data-validator.mjs` to cover the new files
   - Catches typo'd JSON early
   - "Every species ID referenced in dialogue must exist", "ball-math.json must have all 4 grade rates", etc.

6. **DEFER — UI strings (i18n)** until you confirm multi-language is wanted
7. **DEFER — diacritic sweep on data/*.json** until tooltip flow is verified to use these descriptions verbatim

---

## F. Anti-pattern lessons (worth banking as future guidance)

1. **Two files of truth = drift inevitable.** `POKEMART_ITEMS` and `story-shops.csv` are in sync today by careful hand-maintenance. The next "small edit" breaks it. The fix is one of them generates the other.

2. **CSV-as-documentation lies about being data-driven.** `story-tunables.csv` looks like a tunables registry. It is actually a hand-edited markdown table that needs ongoing curation to track the code. If we want it to be enforced, it has to either (a) be the source the code reads, or (b) be validated by CI against the code. Today it is neither.

3. **Diacritic counts mislead without filtering.** A naïve grep counts code identifiers. Always sample-read before quoting an N.

4. **The "still inline because it's structure" rule.** Mechanics encoded as data (cold-open trees, story beat graphs) buy editability at the cost of expressiveness. The pasteur/maxwell domains keep these as code on purpose. The dialogue/type-chart/ball-math layer is genuinely tabular data — those are the right extraction targets.
