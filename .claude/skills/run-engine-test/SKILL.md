---
name: run-engine-test
description: Standard invocations for the jsdom test harness. The harness loads battle.html headlessly (~2.5s first boot, cached after), exposes `window.__engine`, and runs deterministic battles via mulberry32 seeded RNG.
---

# run-engine-test

## Test categories

| Category | Run | Notes |
|---|---|---|
| Full suite | `npm test` | ~70s; run for the live test count |
| Property tests (954 moves) | `npm run test:property` | 9 invariants, ~20s |
| Targeted suites | `npm run test:suites` | VGC damage formula |
| Per-move tests | `npm run test:moves` | 867 tests (516 real, 351 todo) |
| Audit / coverage report | `npm run audit` | Writes `tests/reports/coverage.{csv,md}` |
| Single file | `node --test tests/property/smoke.test.js` | |
| Single test by name | `node --test --test-name-pattern="STAB" tests/property/stab-applied.test.js` | |
| With verbose engine logs | `TEST_VERBOSE=1 node --test <file>` | |

## Integration tests (selected — see `tests/integration/` for the full set)

| File | Covers |
|---|---|
| `tests/integration/story-flow.test.js` | Story arc smoke: save/load, party-cap curve, gym unlocks |
| `tests/integration/save-migration.test.js` | Pre-v15 save round-trip through `migrateStoryPreV15` |
| `tests/integration/catch-system.test.js` | Ball math, PC overflow at 10/10, dex updates |
| `tests/integration/safari-zone.test.js` | 6-encounter cycle, ball depletion, weights |
| `tests/integration/pvp-stub.test.js` | online-pvp.js race conditions with mocked Supabase |

Run all integration tests: `npm run test:integration`

## Harness API (from `tests/helpers/load-engine.js`)

```js
const { loadEngine } = require('./helpers/load-engine.js');
const harness = await loadEngine();
// harness.engine — the live engine handle (parseMoveEffects, buildPokemon, ensureMoveData, state, baseStats, movesDB)
// harness.mkMon(speciesName, opts) — build a Pokémon
// harness.runTurn({ playerMon, foeMon, playerMove, foeMove }) — execute one turn
// harness.reset() — clear battle state
// harness.logs — captured battle log
// harness.seedRng(n) — set mulberry32 seed
// harness.nextFloat() — get next deterministic random
```

The harness gates on `window.__testHarness = true` set in `beforeParse`. The `window.__engine` / `__testReady` export sits near end-of-file; resolve via `grep -n '__testHarness' battle.html` (it gates several sites, not one — don't trust a hardcoded line).

## Common pitfalls

- **First boot is slow** (~2.5s). Subsequent tests in the same file reuse the cached engine. Don't write fresh-boot setup for every test — share one `loadEngine()` per file.
- **Anime.js and Supabase are stubbed** — visual timing and PvP paths are not exercised in tests. Use `tests/integration/pvp-stub.test.js` for PvP coverage.
- **Canvas is stubbed** — sprite-rendering branches are no-ops. Don't write tests asserting visual output.
- **`window.__engine` is undefined unless `__testHarness === true`** — set it before parsing or the hook short-circuits.
- **Don't change `tests/helpers/*`** — that's the harness contract. Other agents and tests depend on it.

## Troubleshooting

- `Cannot find module 'jsdom'` → `npm install` (or the SessionStart hook should have done it).
- Test hangs >30s → check if jsdom is actually loaded; first boot writes a load message to stderr.
- Unexpected failure → check `tests/reports/deviations.md` first; the move may be intentionally non-standard.
