# Story-mode enemy ↔ expected-player balance analysis

`analyze.mjs` is a diagnostic (not a test) that quantifies the Story-mode difficulty curve:
it extracts every enemy team's **actually-fought** stats across the whole timeline, under four
generation-lock settings, over N seeds, then compares them against a **spec-driven model of the
average team a player is expected to field** at each stage.

## Run
```bash
node --max-old-space-size=4096 scripts/debug/balance/analyze.mjs [seeds]   # default 100
SEEDS=20 node --max-old-space-size=4096 scripts/debug/balance/analyze.mjs  # env override
```
Deterministic: seeds are `1000 .. 1000+N-1`. Difficulty fixed to `normal` (the headline mode);
gimmicks off (measures raw stat balance — flip `MECHANICS` to study Dynamax/Tera).

## Outputs (`agent-state/balance/`)
| file | contents |
|---|---|
| `BALANCE_REPORT.md` | headline report: per-gen-set curves, divergence flags, Gen-1 deep dive, data-quality flags, **proposed number diffs** |
| `stage-summary.csv` | every stage × gen-set, N-seed stats (mean/median/p10/p90/sd of the per-mon ratio, team ratio, per-axis ratios, avg grades) |
| `player-model.csv` | the expected player team per stage (grade mix, build tier, per-mon + team totals) |
| `enemy-mons.csv` | per-mon enemy detail (first seed only — full builds + fought stats) |

## How it measures
- **Enemy** = the real `assignTrainers → rollTrainerTeam` pipeline via `__storyTest.simulateStoryRunTeams`.
  Each mon's stats are `buildPokemon` with `build._storyStatMult = storyEnemyStatMult(event,city,row) ×
  foeDifficultyMult('normal')` — the FOE_POWER_CURVE / boss-override edge is baked in, exactly as the
  live engine stamps it at `enterBattleEvent`.
- **Player** = synthetic, from `docs/PROGRESSION_CURVE_MASTER.md §5c`. Party size `max(2,min(6,2+badges))`;
  per-stage grade mix; the "expected mon" is the pool-average Lv50 stat-total over all non-legendary
  species of each grade legal in the gen-set, built at a stage build tier (IV avg + EV total ramping
  with training facilities). Player mons are **exempt** from the foe multiplier (natural Lv50 line).
- **Primary metric** `ratioPerMon` = enemy mon stat-total ÷ expected player mon stat-total
  (size-independent). Design intent: `ratioPerMon ≈ intendedMult` assuming grade parity.
  `delta = ratioPerMon − intendedMult`; |delta| > 0.08 ⇒ `HARD` / `SOFT`.

## Tunable model assumptions (the subjective half)
All at the top of `analyze.mjs`, with comments:
- `PLAYER_GRADE_MIX_BY_CITY` / `PLAYER_GRADE_MIX_ENDGAME` — the grade composition the player is
  assumed to field per city / at the league.
- `playerBuildTier()` — IV avg, EV total, nature posture per stage (the "% trained" ramp).
- `isEndgameEvent()` — which events use the fully-kitted endgame player model (league carries
  `cityIndex = 9`, so endgame is keyed off the event, not `city < 0`).
- `PLAYER_TOL` — the ± band around the intended foe edge before a stage is flagged.

These are **maintainer-owned**: the report's "proposed number diffs" are computed suggestions only —
nothing is applied to `battle.html`.
