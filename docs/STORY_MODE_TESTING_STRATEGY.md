# Story Mode Testing Strategy — full-run simulation & data-driven balance

> Purpose: a concrete, end-to-end plan for (1) exercising the **entire** Story-mode
> player journey headlessly, (2) simulating **thousands** of full playthroughs to
> measure difficulty/economy/experience, and (3) surfacing bugs, leaks, dead-ends,
> and polish/optimization targets — all deterministic and data-driven.
>
> This document is grounded in the live code (symbols, not line numbers — the
> monolith drifts). Anchor everything on the named symbols below.

---

## 0. TL;DR — the recommendation

There is no single "run the story" test today. What exists is **three disconnected halves**:

- **jsdom harness** (`tests/helpers/load-engine.js`) resolves a *single* battle headlessly and deterministically, but has **no story loop**.
- **`__storyTest.simulateStoryRunTeams`** (`_simulateStoryRunTeams`) walks the *whole* `STORY_EVENTS_RAW` timeline and rolls every foe team via `rollTrainerTeam` — but **never fights** and never models a growing player team.
- **Playwright autopilots** (`scripts/debug/story-playthrough.mjs`, `autopilot-fullrun.mjs`) drive the *real* story UI to Hall of Fame — but **force-win every battle** (`__devAutoWinBattle` / `onBattleEnd(true)`), so they measure flow, not difficulty, and are too slow for mass runs.

**The one thing to build is the missing glue: a headless, seeded, CPU-vs-CPU
_Story Simulator_** that walks the timeline *and actually resolves each battle*,
while a **player-policy layer** models starter choice, party growth, evolutions,
tutor moves, and gold spend. Every building block already exists and is exposed on
`window.__engine` / `window.StoryMode` / `window.__storyTest`; only the loop that
ties combat resolution into the timeline walk is absent.

Then run it as a **sharded seed sweep** (copy the `sweep-sharded.mjs` fan-out
pattern), record **per-stage telemetry as JSONL**, and aggregate into balance
dashboards + automatic red-flag detectors. Bracket the "unknown player" with
**three policies** (casual / recommended / optimal) so every difficulty statement
has a floor and a ceiling.

---

## 0.5. Feasibility findings & locked decisions

A second verification pass (battle-state model + AI competence) settled the load-bearing
unknowns. These are now constraints on the build, not open questions.

**Findings that simplify the model**
- **No HP/status attrition between battles.** `buildPokemon` unconditionally resets
  `currentHp=maxHp`; `launchBattle` passes only the build, not runtime HP; the Pokémon
  Center is storage, *not* a heal. Combat is therefore **per-battle-independent given team
  composition** — no heal economy, no potion budget, no limp-into-the-gym state. Each
  battle is a pure function of `(playerTeam, foeTeam, seed)`.
- **Starter + economic actions are reachable headless.** `confirmTrainerAndStart`,
  `enterProfessor → profSelectChoice → profAccept` (normal branch), and the economic
  actions (`evoLabEvolve`, `buyItem`, `tutorChangeMove`/`colressApply*`,
  `evTrainerApplyPreset`) are all exported on `window.StoryMode` and mutate `sm` — no new
  hooks required, but each is wrapped in async confirm dialogs + trailing re-renders (see
  the shim requirement below).

**Findings that constrain fidelity (must be handled)**
- **The player AI is a 1-ply greedy heuristic, not a planner.** `getBestMove` has
  engine-accurate KO math (`aiEstimateDmg`), rich status/hazard/setup rules, proactive
  competent switching (`aiBestSwitch`, called at the top of every turn via `aiDecision`),
  and sensible gimmick timing (`aiChooseGimmick`) — but **no lookahead**. There is **zero
  prior AI-strength calibration** in the repo. ⇒ Sim win-rates are a **relative difficulty
  ordering labeled "competent-heuristic win-rate," not an absolute "is it beatable" verdict**,
  and must be anchored by baselines before trust (new **Phase 0**, §8).
- **Player skill anchor = `hard` (T=0.15, predict 0.85), not `challenge` (T=0).**
  `challenge` is a robotic deterministic argmax that flatters mirror matchups and represents
  no real human. Drive the *player* side at `hard`; let `sm.storyDifficulty` scale only the
  *foe*, so player skill is a controlled constant.
- **Foe uses battle items mid-fight (`tryFoeStoryBattleItem`); the AI player side won't**
  unless driven via `applyBagItem`. Left unmodeled, the sim overstates difficulty.
- **Team composition is load-bearing.** Rival rows build a *live counter-team* against
  `sm.team` at roll time (`_rivalBuildCounterTypePool`), and 3-track beats overlay real
  Battle rows with canon-boss identities (`_activeBattleBeatForCurrentRow` →
  `BEAT_CANON_TRAINER`) that are *harder* than the generic trainer they replace. ⇒ The
  player team must be real & populated before those rows, and the beat dispatcher must be
  allowed to run (don't bypass it). Track beats add **no extra battle count** — they reskin
  existing rows.

**Locked decisions (maintainer sign-off)**
1. **Items — run BOTH modes.** Primary sweep = symmetric OFF (`settings.storyBattleItems=false`,
   no player bag) for the cleanest signal; secondary sweep = faithful ON (foe items + a modeled
   player heal/X-item policy via `applyBagItem`). **Report the off-vs-on delta per stage** as a
   first-class finding. Adds an `itemMode` axis to the matrix (§4).
2. **Model catching.** The player team grows via wild/Safari catches, so each policy carries a
   **catch policy** (casual: rarely; recommended: opportunistic; optimal: chases strong wilds +
   the villain-track Master-Ball legendary). Because Safari/route *species* picks use bare
   `Math.random`, seed `Math.random` at the harness level (`seedRng`) per shard for
   reproducibility and keep those sites on the determinism allow-list (§6). Catch *success*
   (ball math) is already seeded.
3. **DOM-shim adapter.** Build one thin, tested adapter wrapping the `StoryMode.*` economic
   actions: stub `window.showGameConfirm`/`showGameAlert` → true, tolerate trailing `render*`
   calls, and warm `enterEVTrainer()` before `evTrainerApplyPreset`. No engine forks.

---

## 1. What "test the whole story" actually means — five layers

Testing this game is not one activity. Separate the concerns so each has the right tool:

| Layer | Question it answers | Tool | Status |
|---|---|---|---|
| **L0 — Engine fidelity** | Does each move/ability/item match Showdown? | `tests/differential/sweep-all.mjs` (`@pkmn/sim` oracle) | **exists** |
| **L1 — Flow correctness** | Does the machine advance without breaking? (gates, saves, eventIndex) | jsdom `node:test` suites (`tests/suites`, `tests/integration`) | **exists, extend** |
| **L2 — Full-run difficulty & economy** | Is the *journey* fair, solvable, fun? | **Story Simulator (build this)** | **MISSING — the centerpiece** |
| **L3 — Team-composition balance** | Are foe teams the right grade/tier per stage? | `?balanceAudit=1` / `story-team-sweep.mjs` | **exists, fold into L2** |
| **L4 — Real-DOM smoke & content** | Does it render, and read well, in a browser? | Playwright autopilots + consistency/a11y auditors | **exists, keep thin** |

L2 is where "see nearly every aspect of the story-mode player experience" lives. The
rest already have homes. This doc is mostly about L2.

---

## 2. The centerpiece — the headless Story Simulator (L2)

### 2.1 What it is

A jsdom-hosted loop that plays a **complete** story run — starter to Hall of Fame to
the Mystery Figure climax — with **both sides driven by the real AI**, deterministic
under a single `runSeed`, fast enough to run thousands of times in parallel.

It is `_simulateStoryRunTeams` (which already walks `STORY_EVENTS_RAW`, computes
pre-fight badges, and calls `rollTrainerTeam`) **plus** two new pieces:

1. a **battle resolver** that fights the rolled foe team instead of discarding it, and
2. a **player-policy layer** that grows/equips the player team across the run.

### 2.2 Core loop (pseudocode)

```
bootEngine()                              // reuse loadEngine(); cache across runs in a shard
for run in matrix:                        // (seed, difficulty, aiProfile, gens, policy, partySizePref)
  sm = initStoryRun(run)                  // sm.active, sm.runSeed=seed, sm.storyDifficulty, sm.settings, roll sm.tracks
  policy = makePolicy(run.policy)         // casual | recommended | optimal
  player = policy.pickStarter(sm)         // reuse professor pool: weightedPickFromGrades + _storyBuildTierForProfessor
  team = [player]

  for (idx = sm.eventIndex; idx < STORY_EVENTS_RAW.length; idx++):
     row = STORY_EVENTS_RAW[idx]
     switch (row.type):
       case 'City':
          policy.doCity(sm, team, row)     // spend gold, evolve, learn tutor moves, EV-train, Safari-catch, box mgmt
       case 'Battle':
          foe = rollTrainerTeam(...)        // exactly as _simulateStoryRunTeams does today
          res = resolveBattle(team, foe, sm) // <-- NEW: CPU-vs-CPU via playTurn + getBestMove for BOTH sides
          record(stageTelemetry(sm, team, foe, res))
          if res.win:
             applyVictory(sm)               // advance eventIndex/badges/gold via the real onBattleEnd reward path
             policy.postWin(sm, team)        // accept catch-tutorial partner, party-cap growth, etc.
          else:
             if !policy.onLoss(sm, run): break run as FAILED@idx   // retry N / retreat / give up
       case 'Hall of Fame':
          record(hofTelemetry(sm, team)); // _storyRecordHallOfFame path
     resolveWildInterrupts(sm, team, idx)   // STORY_BATTLE_INTERRUPTS / catch tutorial / route wilds
  emit(runRecord)
```

### 2.3 Reused seams (all already exposed — do not reinvent)

| Need | Symbol | Notes |
|---|---|---|
| Boot headless | `loadEngine()` / `window.__testReady` → `window.__engine` | `tests/helpers/load-engine.js` |
| Timeline | `window.STORY_EVENTS_RAW` (67 rows) | idx≠rowId; use `_resolveRowIndexById` |
| Timeline walk template | `__storyTest.simulateStoryRunTeams` → `_simulateStoryRunTeams` | snapshots/restores `sm`; **stops at team-gen — extend it** |
| Foe teams | `rollTrainerTeam(trainer, size, gw, gens, type, rowIdx, avoid)` | full grade/tier/sig pipeline |
| Player starter | `weightedPickFromGrades`, `_storyBuildTierForProfessor`, `_profSeedKey` | seeded 3-card pick |
| Build engine | `makeDesignedBuild` / `makeBuild` (`data/build-archetypes.json`) | archetype-driven |
| Turn executor | `window.playTurn(pMoveIdx, pSwitchIdx)` | one turn; loop to completion |
| AI (both sides) | `__engine.getBestMove`, `aiDecision`, `aiBestSwitch`, `aiChooseGimmick` | **unstub the player side** (the differential harness stubs it — we want it live) |
| Victory rewards | the `onBattleEnd(true)` reward path (eventIndex++, badges++, gold, `_storyGrantTrackEndReward`) | drive it, don't force-win |
| Seeded RNG | `window.storyRngNext` (LCG off `sm.runSeed`) | 262 `Math.random` sites route through it when `sm.active && sm.runSeed!=null` |
| Wild encounters | `rollWildEncounter`, `STORY_BATTLE_INTERRUPTS`, `_wildSeedKey` | ⚠ species pick is *deliberately* bare `Math.random` — see §6 |
| HoF record | `_storyRecordHallOfFame`, `sm.hofPartySnapshot` | |
| Existing team-audit path | `?balanceAudit=1&auditTrials=N` | seeded per-row grade/tier/sig dump — telemetry precedent |

### 2.4 The hard part — simulating "the player"

You cannot simulate *one* true player, so **bracket the spectrum** with three policies.
Every difficulty claim then comes with a floor and a ceiling:

- **`casual`** — *lower bound on investment.* Keeps the starter + catch-tutorial partner,
  never EV-trains, buys only healing items, evolves only when free/automatic, teaches no
  tutor moves, no Safari, minimal switching in battle. Answers: *"can a low-effort player
  clear this?"* If `casual` **sweeps** the Champion, the game is too easy.
- **`recommended`** — *the intended path.* Follows the game's own guidance: the
  recommended-build "preset chips", the tutor/Colress recommender, evolves on schedule,
  spends gold roughly as the economy expects. Answers: *"is the designed path smooth?"*
  This is the primary balance signal.
- **`optimal`** — *upper bound on investment.* Buys the best available, evolves ASAP,
  teaches the strongest legal moves per city cap, maxes EV/IV within the city band,
  plays greedy-optimal AI with switching. If `optimal` **loses** before it should
  (e.g. <50% win-rate at Gym 5), the game is too hard even for a tryhard.

Each policy also carries a **catch policy** (decision 2, §0.5): `casual` rarely catches;
`recommended` catches opportunistically; `optimal` chases strong wilds + the villain-track
Master-Ball legendary. Caught mons feed the team (and therefore the Rival counter-team and
party-cap curve), so catching is modeled, not cosmetic.

The three policies share the same battle resolver and telemetry; only their `doCity` /
`pickStarter` / `postWin` / `catchPolicy` / in-battle choice functions differ. Building
`recommended` first (it mirrors real UI recommenders) gives the highest-signal single number.

### 2.4a The Player Agent — modeling real play, including training

The three policies are *investment levels* of one shared **Player Agent** that runs a real
**prep → fight → adapt** loop at every node — the actual thing a human does, not a fixed
script. This is what "simulate the full player experience" means.

**Prep loop (the city / training phase).** On arriving at a city, the agent:
1. **Assesses the team** — per mon: EV total vs the city band (`STORY_EV_CITY_TOTAL`), move
   quality vs the BP cap (`_storyMoveBpCapForCity`), evolution stage, nature/ability fit; and
   team-level **type coverage** — offensive gaps (types nothing hits hard) and defensive holes
   (types nothing resists). This produces a ranked "shopping list" of upgrades.
2. **Trains & builds against a gold budget.** Priority order (policy-weighted, with a reserve
   buffer): **evolve** (`evoLabEvolve` — biggest single power jump) → **EV-train** toward the
   city band (`evTrainerApplyPreset`, seeded by `_evTrainerRecPreset` for the `recommended`
   policy) → **tutor better moves** as caps lift (`tutorChangeMove`) → **vitamins** → stock
   **heal items / balls** (`buyItem`) → **Colress gimmicks** at C7 (`colressApply*`) →
   nature/ability fixes. Each policy sets different weights and reserve %; `casual` does almost
   none of this, `optimal` maxes it, `recommended` follows the game's own recommenders.
3. **Catches for coverage** — if a type gap exists and a suitable wild/Safari mon is catchable,
   spends balls / a Safari trip to fill it (per catch policy). Not random — coverage-driven.
4. **Box management** — keeps the best `_storyMaxPartySize(badges)`, boxes the rest.

**Fight** — the battle resolver (§2.5), player AI at `hard` skill, using the *trained* team.

**Adapt (on loss)** — re-prep against the *specific* foe that won: buy/teach a targeted
coverage move, shift EVs (bulk vs speed), or swap in a caught counter; then retry up to N. If
still losing, mark the stage a **wall** and record why (out-sped / walled / out-teamed). This
models the real "I lost — let me adjust and try again" loop, and its intensity is a key output
(§7): stages that force many adapt cycles are the game's genuine difficulty spikes.

**Training is first-class, not a footnote.** Because the game is flat-Lv50, "training" *is*
the EV/IV/move/evolution investment loop — the primary way a player grows power between badges.
Modeling it faithfully is what makes the player-power curve (and therefore every difficulty
number) real rather than a lower bound of "starter with default moves."

### 2.5 Battle resolver detail

Reuse the `inhouse-oracle.mjs` battle-driving loop, with **one change**: instead of
stubbing the player's move to a forced slot, call `__engine.getBestMove(playerActive,
foeActive, ...)` each turn so the *player* side is AI-driven too. Both sides then use the
same competence model that `AI_DIFFICULTY_PARAMS` scales — set the player side to a fixed
'hard'/'optimal' skill and let `sm.storyDifficulty` scale only the foe, so player skill is
a controlled variable, not a confound. Loop `playTurn` until `state.isOver`; read the
result (winner, turns, each side's surviving HP %, faints, gimmick usage) off `state`.

Guard against non-termination: cap at N turns (e.g. 300) and record a `stall` outcome —
a battle that never ends is itself a bug (PP-stall / recover loops / infinite-switch).

---

## 3. Telemetry — "see nearly every aspect"

Record one **JSONL** line per stage plus one summary line per run. This is the raw
material every dashboard and red-flag detector consumes. Suggested schema:

**Per run (summary):**
```
{ seed, difficulty, aiProfile, gens, policy, partySizePref,
  outcome: "hof" | "failed@<rowId>" | "stall@<rowId>",
  reachedRowId, badges, totalTurns, totalGoldEarned, totalGoldSpent,
  finalParty: [{species, grade, tier, evTotal, ivMean, statTotal, moves:[{name,bp}]}],
  tracks: {villain, extra}, wallClockMs }
```

**Per stage (one per Battle / City / wild):**
```
{ seed, rowId, idx, eventName, type, cityIdx, badgesBefore,
  // player side
  pTeam: [{species, grade, tier, evTotal, ivMean, statTotalScaled, moveBpMean, item, ability}],
  pPartySize, pTeamPowerIndex,
  // foe side
  fTeam: [ ...same... ], fPartySize, fTeamPowerIndex,
  fStatMult,                          // FOE_POWER_CURVE[city] * _foeDifficultyMult * league boost
  // battle outcome
  result: "win"|"loss"|"stall", retries, turns,
  pHpRemainingPct, pFaints, fFaints, gimmickUsedByPlayer, gimmickUsedByFoe,
  // economy
  goldBefore, goldAfter, goldReward, itemsUsed,
  // catch (wild rows)
  wildSpecies, wildGrade, catchAttempted, caught, ballUsed }
```

Derive `PowerIndex` from the same `getBST` / grade / tier / EV-IV inputs the engine uses,
so player-vs-foe power is an apples-to-apples curve.

**Instrument these knobs explicitly** (all in-code consts, all deterministic under seed):
`FOE_POWER_CURVE`, `_storyEnemyStatMult`, `_foeDifficultyMult`, `applyStoryLeagueFoeStatBoost`,
`STORY_IV_CITY_TRAINER`, `STORY_EV_CITY_TOTAL`, `STORY_WILD_GRADE_BY_CITY`,
`STORY_MOVE_BP_CAP_BY_CITY`, `storyDifficultyCoinMult`, `_storyStartingGoldBonus`,
`EVOLVE_COST_BY_TARGET`, `COLRESS_COST`, `EVTRAINER_COST`, `SAFARI_ENTRY_COST`,
`_storyEnemyPartySize` / `_storyMaxPartySize`.

---

## 4. Scale — the run matrix & sharding

Deterministic seeds make this embarrassingly parallel. Copy the existing
`tests/differential/sweep-sharded.mjs` fan-out (`--shards N --seeds M`, worker + merge).

**Suggested matrix (per full sweep):**

| Axis | Values | Count |
|---|---|---|
| `seed` | 0 … S-1 | e.g. 500–2000 |
| `difficulty` | veryeasy, easy, normal, hard, challenge | 5 |
| `aiProfile` | aggro, balanced, stall | fix to balanced for main sweep; sweep separately |
| `policy` | casual, recommended, optimal (each carries a catch policy) | 3 |
| `itemMode` | off (primary signal), on (faithful) | 2 |
| `gens` lock | e.g. all / gen1-only / gen9-only | 1–3 |

The player side always runs at `hard` skill (§0.5); `difficulty` scales only the foe.

A focused nightly sweep = `500 seeds × 5 difficulty × 3 policy × 2 itemMode = 15,000 full
runs` (≈ 60 battles each ⇒ ~900k battles). Shard 8–16 ways. Each run is jsdom (no browser),
`window.sleep` is stubbed to `Promise.resolve()`, so a run is battles-bound, not
wall-clock-bound — target well under a second per run after boot amortization.

Two sweep sizes:
- **Smoke** (`--seeds 25 --difficulty normal --policy recommended`): ~1 min, gate for CI / every change to balance numbers.
- **Full nightly**: the matrix above; feeds the dashboards and the ledger.

**Determinism caveat (§6):** Safari and route-wild *species* picks use bare `Math.random`
on purpose. For reproducible sweeps, either (a) seed `Math.random` via the harness's
`mulberry32` (`seedRng`) so even those are fixed per shard, or (b) treat catch-dependent
metrics as distributions, not point values. Prefer (a) for the sweep, and separately
**assert** that the only non-seeded sites are the known-intentional ones (a determinism
leak elsewhere is a bug — see §5).

---

## 5. Bug / leak / issue detection — invariants asserted *during* the sim

The simulator is also the best bug-finder in the codebase, because it exercises the real
`onBattleEnd` / gate / save code across 67 rows × thousands of seeds. Assert these
invariants on every stage; any violation is a filed finding (via the `emit-finding` skill →
`ISSUE_LEDGER.md`):

**Flow / state invariants**
- `eventIndex` is monotonic non-decreasing and never skips a Battle row.
- `sm.badges` monotonic in [0,8]; increments only on `/^Gym Leader [1-8]$/` wins.
- Party never exceeds `_storyMaxPartySize(badges)`; overflow lands in PC (`pcBox`), never dropped.
- Battle mechanics (`slotsUnlocked`) are 0 while `badges<6` and 4 once `badges>=6` — never before.
- Catch tutorial fires **exactly once**, after the intro-rival win (`catchTutorialDone`).
- Facility intros are one-shot (`facilityIntros[key]`); Safari gated to C4; daycare unlocks at GL1; roaming legendary queues at GL8.
- Foe party size == `_storyEnemyPartySize` (finales forced 6).

**Economy invariants**
- Gold never negative; inventory counts never negative; a purchase never completes without debit.
- `recommended` policy can **afford** the debut-city offering of EV Trainer / Colress / first evolution when the economy expects it (flag "insolvent@city").

**Balance invariants (soft — red flags, not hard fails)**
- No **difficulty regression**: stage N should not be materially harder than N+1 (win-rate should not dip then recover).
- No **power inversion**: foe `PowerIndex` should be non-decreasing city-to-city; a city where foe power drops is a curve bug.
- No **spike/plateau**: flag any adjacent-stage win-rate drop > threshold (the known GL5 plateau lives here), and any run of ≥3 stages with ~identical foe power (stagnation).

**Determinism / save invariants**
- Same `seed` run twice ⇒ byte-identical stage telemetry (catches stray `Math.random` in seeded paths, iteration-order nondeterminism, `Date.now` leaks).
- **Save round-trip**: serialize `sm` mid-run (the `SAVE_KEY='pbs_story_save'` shape), run every `migrateStoryPre*` up to `SAVE_VER=28`, reload, and continue — the continued run must match the uninterrupted one. This fuzzes the migration chain against *real* mid-run states, not just fixtures.

**Content / dead-end invariants**
- Every reachable City exposes at least one way to advance (no soft-lock: e.g. a facility intro that blocks "Leave City" but is unreachable).
- No run ends in an unhandled state (`outcome` is always one of the known terminals).

**Perf invariants (fold in the existing profiler)**
- `rollTrainerTeam` ms, `playTurn` ms, and heap growth stay bounded across a full 60-battle run (no per-turn leak). Reuse `performance-profiler` thresholds.

---

## 6. Known determinism seams (must handle explicitly)

- **Seeded (reproducible):** professor 3-card pick (`_profSeedKey` = 900000+…), route-wild
  *slot* firing (`_wildSeedKey` = 800000+…), `rollTrainerTeam` (event-seeded), all 262
  in-engine `Math.random` sites while `sm.active && sm.runSeed!=null`.
- **Intentionally NOT seeded:** Safari species pick and route-wild *species* pick use bare
  `Math.random` by design (so reloads vary). For sweeps, seed `Math.random` at the harness
  level (`seedRng`) to make them reproducible per shard, and keep an allow-list of these
  known sites so the determinism invariant (§5) doesn't false-positive.

---

## 7. Data-driven outputs — what the sweep produces

Aggregate the JSONL into a small report bundle (mirror `differential/` which writes
`results.json` + `SWEEP_REPORT.md` + `FIDELITY.md`):

1. **Difficulty heatmap** — `stage (rowId) × difficulty × policy` → win-rate. The single
   most useful artifact: reads the whole curve at a glance; spikes/plateaus are visible bands.
2. **Power-curve chart** — per city: player `PowerIndex` (per policy) vs foe `PowerIndex`.
   The gap *is* the difficulty; crossing/inversion points are bugs.
3. **Economy solvency** — net gold curve per policy; % of `recommended` runs that can afford
   each major sink (Colress, EV Trainer, evolutions) at its debut city.
4. **Grind index** — mean turns-per-battle and retries-per-stage; flags slog sections.
5. **Grade/tier progression** — foe grade mix (G4→G1) and build tier (T1→T4) per stage vs
   the intended curve (`_storyBuildTierForEvent`, `_applyTrainerGradeMatrix`).
6. **Content coverage** — which `sm.tracks` villain/extra combos, cold-opens, and facility
   intros actually fired across the sweep (unfired content = untested content).
7. **Red-flag ledger** — every §5 violation, deduped by fingerprint into `ISSUE_LEDGER.md`
   via the existing `scripts/debug/issue-ledger.mjs` pipeline.

**Player-experience metrics (from the Player Agent, §2.4a) — the "is it *fun*" signal:**
8. **Training-intensity index** — gold + facility actions the agent had to spend on training to
   clear each stage. High values = grindy walls; a flat-then-spike shape is a pacing problem.
9. **Readiness gap & necessity** — player power *after training* vs foe power per stage, plus
   whether training was **necessary** to pass (did `recommended` clear on default builds, or
   only after investment?). Distinguishes "engaging prep" from "mandatory grind."
10. **Economy stress** — stages where the agent *wanted* an upgrade (evolution/EV/tutor) but
    **couldn't afford it**; the count and which upgrade was blocked. Surfaces gold starvation.
11. **Adaptation load** — retries + re-prep cycles per stage, and the failure reason
    (out-sped / walled / out-teamed). The map of where players get genuinely stuck.
12. **Team trajectory** — the actual party composition + build completeness + type-coverage
    health at each city. Answers "what does a real player's team look like at Gym 5?" and shows
    whether the game *lets* players build a coherent team or forces incoherent scrambling.
13. **First-try vs after-training clear rate** per stage — the cleanest single "difficulty
    texture" number: stages high on one but low on the other are where prep is the real gate.

Render the heatmap + curves as an HTML/SVG dashboard (self-contained) for eyeballing;
keep the JSON as the source of truth so numbers are diffable across commits (catch balance
regressions in review).

---

## 8. Build plan — phases (each independently useful)

0. **Calibration & baselines** — before trusting any win-rate: (a) **flow-parity** — the
   headless walk hits the same 67 rows in the same order as the Playwright autopilot;
   (b) **AI-vs-random floor** and (c) **mirror AI-vs-AI ~50% sanity**. Establishes that
   "competent-heuristic win-rate" means something. *(Unlocks: trust.)*
1. **Battle resolver** — headless CPU-vs-CPU: take `inhouse-oracle`'s `playTurn` loop, drive
   the player side with `__engine.getBestMove` at `hard` skill; add the DOM-shim adapter
   (§0.5 decision 3). Return `{winner, turns, hpLeft, faints, gimmicks, itemsUsed}`. Verify
   against a hand-checked battle. *(Unlocks: any auto-battle.)*
2. **Player policy layer** — `pickStarter` / `doCity` / `postWin` / `chooseMove` +
   **`catchPolicy`** (decision 2) + **item policy** for `itemMode:on` (decision 1) across the
   three policies. Start with `recommended`. *(Unlocks: modelling the player.)*
3. **Full-run loop (vertical slice)** — extend `_simulateStoryRunTeams` to fight (resolver),
   grow the team (policy + catching), and let the beat dispatcher run so canon-boss/rival rows
   resolve faithfully. **Reach Hall of Fame headlessly for ONE seed, `normal`, `recommended`,
   `itemMode:off`, with sane telemetry + verified determinism — the proof-of-life gate before
   any scale.** *(Unlocks: the actual end-to-end run.)*
4. **Telemetry** — emit the §3 JSONL (including per-stage `itemMode` and catch records).
   *(Unlocks: data.)*
5. **Sharded runner** — clone `sweep-sharded.mjs`; add the §4 matrix (incl. `itemMode` axis) +
   merge; seed `Math.random` per shard for catch reproducibility. *(Unlocks: scale.)*
6. **Analysis + dashboards** — §7 report bundle + red-flag detectors + the **item off-vs-on
   delta** per stage. Thresholds exposed as config for the maintainer. *(Unlocks: insight.)*
7. **Invariant assertions + save round-trip + determinism check** — §5, wired to
   `emit-finding` → ledger. *(Unlocks: bug-finding.)*

Phases 1–3 are the real work (the resolver + policy + loop); 4–7 are mostly plumbing over
patterns that already exist in `tests/differential/`. Land a smoke sweep (one seed, one
policy, one difficulty, reaching HoF) at the end of phase 3 as the proof-of-life gate.

## 9. What NOT to build

- **Not Playwright for mass sim** — real-browser autopilots stay as a *thin* final smoke
  (render + one screenshot pass + a11y/consistency auditors), not the data engine. jsdom is
  ~orders faster and parallelizes.
- **Not a new RNG or battle engine** — drive the real `playTurn`/`getBestMove`/`storyRngNext`
  so the sim measures the *shipped* game, not a reimplementation. The moment the sim forks
  engine logic, its balance numbers stop being trustworthy.
- **Not force-win** — the existing `__devAutoWinBattle` path measures flow, which L4 already
  covers. L2's entire value is that battles are *fought*.
