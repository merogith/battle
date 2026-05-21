# Move Verification System

Tools for verifying that all 954 moves in `data/moves.json` are correctly implemented
by the battle engine in `battle.html`. Three layers:

1. **Audit** — `npm run audit` classifies every move by handler coverage
2. **Property tests** — generic invariants over all 954 moves (e.g., every damaging move deals damage)
3. **Targeted suites** — focused tests for VGC mechanics (damage formula, STAB, type effectiveness)

## Quick start

```bash
npm install        # installs jsdom (only dev dependency)
npm run audit      # generates /tests/reports/coverage.{csv,md}
npm test           # runs all property + suite tests (~32s)
npm run test:property   # property tests only
npm run test:suites     # targeted suites only
```

Reports land in `/tests/reports/`:
- `coverage.csv` — one row per move with handler classification
- `coverage.md` — human-readable summary, per-gen breakdown, gap lists
- `deviations.md` — intentional non-VGC mechanics (story-mode artifacts, etc.)

## Architecture

### `/tests/helpers/`

- **load-engine.js** — boots `battle.html` in jsdom (~2.5s, cached). Returns
  `{ engine, mkMon, runTurn, reset, logs, seedRng, nextFloat }`. The engine
  exposes `parseMoveEffects`, `buildPokemon`, `ensureMoveData`, `state`,
  `baseStats`, `movesDB`.
- **seeded-rng.js** — mulberry32 PRNG installed as `Math.random` via jsdom
  `beforeParse`. All 282 random sites in the engine are deterministic.
- **load-moves.js** — pure Node loader for `data/moves.json` (no jsdom).

### `/tests/audit/`

- **coverage-report.js** — scans `battle.html` for `move.name === "X"` and
  `["X","Y",...].includes(move.name)` patterns; classifies every move as
  `named-branch | data-driven | damaging-only | partially-handled | unhandled`.

### `/tests/property/`

Nine planned invariants iterating over all 954 moves. Implemented:

| Test | What it checks | Status |
|---|---|---|
| `damaging-nonzero` | basePower>0 moves reduce defender HP | 524/524 pass |
| `status-no-damage` | basePower=0 moves leave defender HP unchanged | 258/258 pass |
| `boosts-target` | declared `boosts` apply to the correct target | 59/59 pass |
| `secondary-fires` | declared `secondary` fires with RNG=0 forced | 165/176 pass* |

\* The 11 secondary-fires failures are documented in `/tests/reports/deviations.md`:
naming mismatches between JSON `volatileStatus` and engine `volatile.X` key,
charge-move first-turn behavior, and Sceptile-immunity edge cases.

### `/tests/suites/`

- **damage-formula.test.js** — VGC Gen 8 Lv50 formula at `battle.html:21473`:
  Tackle range, STAB ×1.5, super-effective ×2, type immunity ×0.

### `/tests/fixtures/`

- **deviations.js** — programmatic skip lists consumed by property tests.
  Cross-references entries in `/tests/reports/deviations.md`.

## Adding a New Move

The data migration phase removed three hardcoded named-list fallbacks
(`multiHitConfig`, `_drainNamedFallback`, `_recoilNamedFallback`). Adding a
new multihit/drain/recoil move now requires only a JSON edit:

```json
// data/moves.json -> "9" -> "mynewmove":
{
  "inherit": true,
  "multihit": [2, 5],
  "drain": [1, 2],
  "recoil": [1, 4],
  "boosts": { "atk": -1 },
  "secondary": { "chance": 30, "status": "brn" }
}
```

If the move needs custom logic not covered by these fields (form changes,
counter-style damage, transform), add a named branch in `parseMoveEffects()`
at `battle.html:23775`.

## Engine Test Harness Hook

`battle.html` exposes engine internals on `window.__engine` when
`window.__testHarness === true` is set before jsdom parses the script. The
harness hook lives at the bottom of the `<script>` block in `battle.html`
(right before `</script>`). It is inert in normal play.

Two surgical edits to `battle.html` support the harness:

- `sleep` declaration (line 10690): short-circuits to `Promise.resolve()` when
  `__testHarness` is set. ~36× speedup (~35ms per turn vs 3.8s).
- End-of-script hook: publishes the engine handle on `window.__engine` and
  resolves `window.__testReady` once `loadGameData` populates `baseStats`
  and `movesDB`.

## Showdown Reference

The project uses Pokemon Showdown's vendored data via `@pkmn/dex` at
`battle.html:9675` (PKMN_DEX_VER=0.10.7). Property tests treat Showdown's
formula as ground truth. Intentional deviations from Showdown/VGC behavior
are listed in `/tests/reports/deviations.md`.

## Running Just One Test

```bash
node --test tests/property/damaging-nonzero.test.js
node --test tests/suites/damage-formula.test.js
TEST_VERBOSE=1 node --test tests/property/smoke.test.js  # show engine console output
```

## Troubleshooting

**Tests hang for >30s**: ensure jsdom is installed (`npm install`). The first
boot loads battle.html (~2.5s); subsequent tests in the same file reuse the
cached engine.

**`Cannot find module 'jsdom'`**: run `npm install` in the repo root.

**Test reports an unexpected failure**: check `/tests/reports/deviations.md`
first — the move may be intentionally non-standard or have preconditions the
property test cannot fabricate.

## Known Limitations

- jsdom doesn't render `<canvas>`; sprite-rendering code is stubbed and
  exercises only the no-op branches.
- Animations (`anime.js`) are stubbed; tests cannot assert visual timing.
- Online PvP (Supabase) is stubbed; multiplayer paths are not covered.
- Doubles/triples-only moves (`target: allAdjacentFoes`) are skipped in
  property tests since the harness runs singles.
