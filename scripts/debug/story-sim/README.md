# Story Simulator

A headless, deterministic simulator that plays **complete Story-mode runs** — starter to Hall
of Fame to the post-HoF Mystery Figure — with the **real game AI and mechanics on both sides**,
then collects per-stage telemetry so you can measure difficulty, economy, and the player
experience across thousands of seeds. Design rationale: [`docs/STORY_MODE_TESTING_STRATEGY.md`](../../../docs/STORY_MODE_TESTING_STRATEGY.md).

It observes the shipped engine through the jsdom harness and **forks no engine logic** — foe
teams, stat multipliers, build tiers, evolution, and the coin curve all come from the real
`battle.html` internals (exposed read-only via `window.__storySim`, gated behind `__testHarness`).

## Modules

| File | Role |
|---|---|
| `resolve-battle.mjs` | Headless CPU-vs-CPU battle resolver. Real AI both sides (foe via the engine's own path; player via the in-repo perspective-swap), player pinned to `hard` skill, forced-switch-on-faint, per-battle item mode, turn cap + stall breaker. Suppresses the engine's victory UI so the run loop is the sole reward authority. |
| `agent.mjs` | The Player Agent: starter pick, team growth via coverage catching, **forward evolution** (the dominant Lv50 power lever), EV training toward the city band, evolve/train per policy, adapt-on-loss. Seeds its own RNG per prep phase for reproducibility. |
| `policies.mjs` | The three investment levels — `casual` / `recommended` / `optimal` — that bracket the "unknown player". Battle skill is constant; only PREP investment varies. |
| `story-run.mjs` | The full-run loop: init a run, walk `STORY_EVENTS_RAW`, faithfully roll+stamp each foe team, resolve, advance (coins/badges/eventIndex), collect telemetry. |
| `sweep.mjs` | Runs the `seed × difficulty × policy × itemMode` matrix, writes `runs.jsonl` + `stages.jsonl`, supports `--shard i/N`. |
| `analyze.mjs` | Aggregates JSONL → `report.json` + `dashboard.html` (difficulty heatmap, power curve, reach, item delta) + red-flag detectors. |
| `invariants.mjs` | `checkRun()` / `checkDeterminism()` — structural + determinism invariants; violations are `ISSUE_LEDGER` candidates. |
| `dom-shim.mjs` | Confirm/alert stubs so `StoryMode.*` economic actions run headlessly. |

Guard test: [`tests/suites/story-sim.test.js`](../../../tests/suites/story-sim.test.js) (invariants, determinism, no reward double-count, save round-trip).

## Running

```bash
# One quick full run (prints outcome + team) — sanity check
node -e "import('./scripts/debug/story-sim/story-run.mjs').then(async m => { \
  const {rec}=await m.runOneSeed({seed:1,policy:'recommended',difficulty:'normal',itemMode:'off'}); \
  console.log(rec.outcome, rec.wins+'/'+rec.battles+'W', rec.finalTeam.join('/')); process.exit(0); })"

# Smoke sweep (~6 runs, a couple minutes)
node scripts/debug/story-sim/sweep.mjs --seeds 2 --policy casual,recommended,optimal --out /tmp/ss

# Bounded real sweep (difficulty × policy grid; ~1h single-process)
node scripts/debug/story-sim/sweep.mjs --seeds 10 \
  --difficulty easy,normal,hard --policy casual,recommended,optimal --item off \
  --out agent-state/story-sim/sweep-main

# Full sweep, sharded 8-way in parallel (fastest for the big matrix)
for i in $(seq 0 7); do \
  node scripts/debug/story-sim/sweep.mjs --seeds 500 \
    --difficulty veryeasy,easy,normal,hard,challenge --policy casual,recommended,optimal \
    --item off,on --shard $i/8 --out agent-state/story-sim/full --quiet & \
done; wait

# Analyze whatever's in an output dir → report.json + dashboard.html
node scripts/debug/story-sim/analyze.mjs --in agent-state/story-sim/sweep-main --out agent-state/story-sim/sweep-main
```

## What it measures

- **Difficulty**: win-rate per stage × difficulty × policy (heatmap); where each policy walls (reach).
- **Power curve**: player vs foe `PowerIndex` per city — the gap *is* the difficulty; inversions are curve bugs.
- **Economy**: gold accumulation per stage; whether prep is affordable.
- **Item impact**: off-vs-on win-rate delta per stage (run with `--item off,on`).
- **Bugs**: invariant violations (flow/economy/determinism) surfaced during the sweep.

## Known limitations

- Player battle skill is a strong **1-ply heuristic** (the game's own AI at `hard`), not optimal play — read win-rates as a *relative* ordering ("competent-heuristic win-rate"), calibrated against the ~50% mirror baseline, not an absolute "is it beatable" verdict.
- The Player Agent's team-building is coverage-and-evolution driven from the real wild pool; it is a faithful *model* of a player, not a specific human. The three policies bracket the range.
- Safari/route wild *species* picks are seeded here (via the harness) for reproducibility; in the shipped game they are deliberately non-seeded.
