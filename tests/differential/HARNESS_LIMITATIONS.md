# Harness Limitations — divergences that are NOT engine bugs

Sibling of `tests/reports/deviations.md`. Where `deviations.md` lists *intentional*
gameplay divergences from Showdown, this file lists divergences that exist **only in the
headless differential harness** — the engine is (or may be) correct in the real browser,
but the jsdom/forced-move harness can't observe or exercise the mechanic. The
comprehensive sweep (`sweep-all.mjs`) and the triage agent subtract these so the
"unexplained high-confidence divergence" count stays honest.

Add an entry when triage classifies a divergence as `harness-limitation`. Format: the
affected entity/class, why the harness can't judge it, and (if known) the engine anchor
that *does* implement it.

## Confirmed harness limitations

### Evolution-data-dependent items (Eviolite)
- **Symptom**: with/without the item is byte-identical headlessly → looks "not implemented."
- **Why**: the engine's NFE check reads `getPssDex().species.get(name).evos`, and the jsdom
  harness stubs `@pkmn/dex` (CDN blocked, `load-engine.js`), so `evos` is always empty →
  the item no-ops *in the harness only*. It works in the real browser.
- **Engine anchor**: Eviolite handling in `battle.html` (NFE def/spd boost).
- **Disposition**: routed `harness-untestable` by `generate-scenarios.mjs`; never filed.

### Trace-unobservable effects (volatiles / weather / terrain / side conditions)
- **Symptom**: a status/field move shows "no divergence" even if mis-implemented, OR a
  weather/terrain-setting ability shows "agree" despite doing nothing.
- **Why**: the normalized trace (`showdown-oracle.mjs` / `inhouse-oracle.mjs`) snapshots
  per-mon **hp / status / boosts / fainted** only. A volatile (Substitute, Leech Seed,
  Taunt, Encore…), a side condition (Reflect, Spikes), or field state (weather/terrain) is
  not in that snapshot, so a single-turn end-state diff can't see it.
- **Disposition**: such moves are tagged `observability: low` by the generator. They are
  *covered for crashes/throws* but their effect needs a multi-turn scenario or a direct
  assertion test, not the auto-sweep. Not a bug on its own.

### Input-layer move locks (recharge / choice-lock / Outrage / Encore / Disable / Sky Drop)
- **Symptom**: the lock appears "not enforced" in a forced-move scenario.
- **Why**: enforcement lives in the input layer (`battle.html` auto-submits the locked
  move), which the harness's forced-move path (`playTurn` with an explicit slot) bypasses.
  The engine *does* set the lock volatile; only the harness can't exercise it.
- **Disposition**: documented in `scenarios.mjs` (self-KO / lock note). Needs a direct
  input-layer test, not the differential. Not a bug.

### Move-order counts announcements, not resolutions
- **Symptom**: a `checkOrder` probe over-counts a mover that then fizzles (recharge,
  full-paralysis, flinch).
- **Why**: `"X used <move>!"` is logged *before* the fizzle guard, so the order parser
  counts an announcement that produced no action.
- **Disposition**: order checks are only applied to moves that resolve normally. Not a bug.

### Cross-engine PRNG independence (chance rolls)
- **Symptom**: a chance secondary, a sub-100% accuracy miss, a 2–5 multi-hit count, or a
  random-target/random-stat move (Acupressure, Metronome, etc.) differs between engines.
- **Why**: the two engines have **independent** PRNG streams; the same nominal probability
  rolls differently. The differ already discounts these (status→medium, HP→low), but a
  random *pick* can still surface. These are `rng-artifact`, not bugs — verify by sweeping
  several seeds: if the *set* of outcomes matches and only the *pick* differs, it's RNG.
- **Disposition**: `rng-artifact`; never filed.
