# Differential battle harness (Showdown oracle)

**Stage 0 of the oracle-led plan** (`docs/BATTLE_ENGINE_INVESTIGATION.md`).

This harness runs the **same** scripted battle through two engines and diffs the
results turn-by-turn:

- **Reference / oracle:** [`@pkmn/sim`](https://github.com/pkmn/ps) — the MIT-licensed,
  auto-synced port of **Pokémon Showdown's** battle simulator (all gens, full
  move/ability/item effect coverage). Test-only dependency; it does **not** ship in the game.
- **Subject:** the in-house engine in `battle.html`, driven headless through the
  existing jsdom harness (`tests/helpers/load-engine.js`).

The point: make "battle bugs resolved for good" a *measurable, continuously-checked*
property instead of a whack-a-mole. The oracle finds divergences automatically and,
kept in CI, stops fixed bugs from silently regressing.

> **Comprehensive sweep (all moves/abilities/items).** The hand-authored battery below
> (`scenarios.mjs` + `damage-sweep.mjs`, ~117 probes) is now complemented by an
> **enumerated** sweep that probes *every* entity from `@pkmn/dex`:
> `generate-scenarios.mjs` (Stage 1) → `sweep-all.mjs` (Stage 2) → the
> `differential-triage-auditor` agent (Stage 3, via `/differential-sweep`).
> Run it with `npm run test:differential:all`. The full methodology — including the
> six-bucket triage taxonomy and the FIDELITY scorecard — is in
> **[`METHODOLOGY.md`](./METHODOLOGY.md)**.

**See [`FINDINGS.md`](./FINDINGS.md)** for the consolidated conclusions (what
diverges, what's confirmed correct, and the harness-fidelity fixes made along the way).

## Run it

```bash
# Categorical battery → writes DIVERGENCE_REPORT.md
node tests/differential/run-report.mjs

# Damage-modifier sweep → writes DAMAGE_SWEEP_REPORT.md
node tests/differential/damage-sweep.mjs

# Both of the above
npm run test:differential

# CI gate (also runs under `npm test`)
node --test tests/differential/oracle.test.js
```

## Files

| File | Role |
|---|---|
| `showdown-oracle.mjs` | Drives a scripted singles battle in `@pkmn/sim`; parses the sim protocol into a normalized per-turn trace. |
| `inhouse-oracle.mjs` | Drives the **same** script through `battle.html` (via the jsdom harness); emits the same trace shape. |
| `diff.mjs` | Compares two traces; emits divergences tagged by confidence. |
| `scenarios.mjs` | Engine-neutral categorical scenario battery (teams + scripted choices). |
| `run-report.mjs` | Runs the categorical battery, writes `DIVERGENCE_REPORT.md`. |
| `damage-sweep.mjs` | Multi-seed damage-range probe of the multiplier layer (items / abilities / stat calc); writes `DAMAGE_SWEEP_REPORT.md`. |
| `oracle.test.js` | CI gate: sanity scenarios must agree; known bugs are marked. |
| `DIVERGENCE_REPORT.md` · `DAMAGE_SWEEP_REPORT.md` | Generated artifacts — the current divergence snapshots. |

### The damage-modifier sweep

A single-roll damage comparison can't separate a 1.3× item bug from the 85-100%
roll band. `damage-sweep.mjs` runs each matchup over many seeds **per engine** and
compares the damage **ranges**: overlapping = the multiplier layer agrees; disjoint
= a real items/abilities/stat-calc divergence. (Showdown's wider max often reflects
occasional crits; matching minimums confirm the base formula.)

## Confidence model

Two engines have **independent PRNG streams**, so exact damage rolls and chance
secondaries can't be compared across them. Divergences are tagged:

- **high** — boosts, faint state, winner, or a damage gap >2.2× (type/effectiveness/
  formula). RNG-independent → real divergences. *These drive the verdicts.*
- **medium** — status presence (could be a chance-secondary that simply rolled
  differently; promoted to high when the scenario sets `guaranteedStatus`).
- **low** — raw HP beyond the 85-100% roll band, or a hit-vs-miss from accuracy RNG.

## Scenario types (`expect`)

- `diverge` — a known/suspected bug; the oracle **should** flag it (`high > 0`).
- `match` — sanity/regression; the oracle **must not** flag it (`high === 0`). A
  failure here is a false positive *or* a real regression — either way, a red build.
- `probe` — exploratory; any result is informational (used for cases the
  forced-identical-choice model can't cleanly adjudicate).

## Scope / limitations

- **Singles only.** Doubles/triples are out of scope here (Story is singles).
- **Forced-identical choices.** This catches *state* divergences given the same
  moves. It is the wrong tool for **move-legality / precondition** bugs (e.g.
  "Gravity should forbid Fly") — Showdown rejects the illegal choice and the two
  battles diverge in *choices*, not comparable state. Those need a direct
  assertion test. (`gravity-blocks-fly` is kept as a `probe` to document this.)
- **Custom RPG layer not modeled.** The oracle judges *standard* Pokémon mechanics.
  Intentional in-house divergences (story artifacts, owner-tuned balance, fixed-damage
  story moves — see `tests/reports/deviations.md`) are expected to differ and should
  be encoded as `probe`/excluded, not "bugs".

## Add a scenario

Append to `SCENARIOS` in `scenarios.mjs`:

```js
{
  id: 'unique-id',
  category: 'free text',
  desc: 'what this checks',
  expect: 'match',            // or 'diverge' / 'probe'
  guaranteedStatus: true,     // optional: promote status diffs to high
  team1: [{ species:'Jolteon', ability:'Volt Absorb', moves:['Thunderbolt','Quick Attack'],
            nature:'Modest', evs:{spa:252,spe:252}, ivs:{spe:31} }],
  team2: [{ species:'Snorlax', moves:['Splash','Splash'], nature:'Brave', evs:{spe:0}, ivs:{spe:0} }],
  choices1: ['move 1'],       // 1-indexed; 'move N' or 'switch N'
  choices2: ['move 1'],
}
```

Move/ability/item legality is **not** validated (Showdown uses `gen9customgame`;
the in-house `mkMon` builds arbitrary sets), so you can use off-learnset movesets
to isolate one mechanic.
