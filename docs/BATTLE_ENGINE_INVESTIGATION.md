# Battle Engine Investigation — Findings & Recommendation

> **Status:** Phase 0 (investigate) + Phase 1 (recommend) complete. **No engine code changed.**
> Awaiting approach approval before any Phase 2 implementation.
> **Date:** 2026-06-02 · **Branch:** `claude/ecstatic-cannon-MJTai`

This document answers the brief in `battle_engine_investigation_brief.md`: map the engine,
study Pokémon Showdown's `sim`, diff them, and recommend the path that fixes battle bugs
**for good** (Path A: adopt the proven sim as the core, vs Path B: port logic piecemeal).

---

## 0. Executive summary

1. **The Fly bug is a one-line fix, and its real symptom differs from the report.** It is *not*
   the Fly user's own attack missing. It is: while the **opponent** is mid-Fly
   (`volatile.invulnerable === true`), **your** self-targeting / field moves (Roost, Recover,
   Calm Mind, Swords Dance, Substitute, Trick Room…) wrongly print **"missed!"** and their
   effect is lost. Root cause: the invulnerability check at `battle.html:23087-23110` lacks the
   `move.cat !== "Status" || !SELF_TARGETING_STATUS.has(move.name)` guard that the **Protect**
   check at `battle.html:22900` already has. *(Verified live: Scizor's Roost healed 0 HP while
   the foe was airborne.)*

2. **The engine is already mostly correct.** The damage core matches Showdown Gen-5+ exactly
   (`battle.html:24318`), and ~20 mechanics were verified correct against repros (see §4). The
   bugs cluster in **untested corners** — **every two-turn move is an `it.todo()` stub** in the
   test suite, which is precisely why the Fly class of bugs went unnoticed.

3. **The bugs do not share one missing abstraction; they share a *shape*.** The engine is a
   per-move / per-ability / per-item **hardcoded-name-list machine**: two-turn detection is a
   hardcoded `Set` that ignores the `flags.charge:1` already in the data; abilities & items have
   **zero data-driven behavior** (every effect is an inline `if (ability === "…")`); the damage
   formula is **re-implemented twice** (live + AI estimator). Each gap is its own patch — there
   is no single abstraction whose absence explains them all. The unifying problem is
   **architecture**, not one bug.

4. **The core is deeply fused with rendering.** The resolution path
   (`performAction` → `parseMoveEffects`, ~7.3k lines) contains **859 `logMsg`, 146 `await sleep`,
   53 `updateUI`, 95 direct DOM/anime/AudioSystem calls**, interleaved line-by-line with state
   mutation. There is **no "resolve turn → events" boundary**; the engine renders *as* it resolves.

5. **The reference is `@pkmn/sim` (MIT).** It is the *actual* Showdown simulator, auto-synced
   from upstream, **all gens 1–9**, full move/ability/item effect coverage, browser-bundleable,
   with a **seeded, serializable PRNG**. The project **already ships its sibling `@pkmn/dex` data**.

6. **Recommendation:** **Adopt Showdown as the proven _authority_ via a permanent
   differential-test oracle, then fix the in-house engine to convergence by root-cause
   category.** This is *Path A, de-risked* — it takes A's "proven source of truth" and B's
   incrementalism while dropping both their fatal flaws. It is the **only** approach that
   delivers "resolved for good," because correctness-for-good is a property of *(proven oracle +
   continuous differential testing)* — which pure B cannot provide, and which pure A
   (sim-in-production) buys at disproportionate cost/risk for an engine that is already mostly
   right and is fused to a custom-RPG renderer. See §6.

---

## 1. Codebase map (Phase 0)

### 1.1 Shape of the project
- **`battle.html`** — single-file app, **62,053 lines / 4.1 MB** (HTML+CSS+JS, *no* `'use strict'`).
- **`data/*.json`** — **generation-keyed Showdown dexes** (gen-9 subtree: **954 moves, 1515
  species, 314 abilities, 583 items**). `package.json` has a `sync-showdown-data` script and
  depends on `@pkmn/data` / `@pkmn/dex`. **The data is already Showdown-derived; the divergence
  is entirely in the hand-written mechanics.**
- `data/op-abilities.json` is **species-keyed** (legal-ability table for team building), *not*
  ability logic. `data/abilities.json` is gen-keyed `{inherit:true}` stubs (names only).

### 1.2 The battle seam (what an integration must replace)
| Direction | Symbol | Location |
|---|---|---|
| Enter | `launchBattle(enemyTeam)` → `startBattle()` | `battle.html:48012`, `:17220` |
| Build a mon | `buildPokemon(species, build)` | `battle.html:15144` |
| **Exit (single result call site)** | `window.StoryMode.onBattleEnd(won, title, desc)` | `battle.html:18324` → handler `:48051` |

The **boundary is narrow** (one entry, one result call). The **interior is not** — see §1.4.

### 1.3 Combat pipeline (one turn, end-to-end)
| Stage | Function / location |
|---|---|
| Turn entry | `playTurn(pMoveIndex, pSwitchIndex)` — `battle.html:21238` |
| Two-turn charge continuation | `:21449-21451` (forces the charging move on turn 2) |
| Priority / turn order | `:21586-21632`; **speed tie = `Math.random()` `:21631`**; Trick Room invert `:21630` |
| Per-action dispatch | `performAction(isPlayer, move)` — `:22135` (~7k-line async fn) |
| Recharge / two-turn charge | `:22604-22609` / `:22611-22667` (hardcoded `_forcedTwoTurn` Set `:22612`) |
| Protect/Detect/etc. gates | `:22694-22873` (**correctly** self-target-guarded at `:22900`) |
| Accuracy / hit check | `:23000-23085` (`neverMiss` `:23010`; roll `:23063`) |
| **Invulnerability check** | **`:23087-23110` ← the Fly bug** |
| Type-immunity abilities | `:23178-23260` (Levitate / Volt Absorb / Flash Fire / …) |
| Crit | `:23484-23504` (ladder `1/24,1/8,1/2,1`; **fixed 1.5×** `:23504`) |
| Multi-hit | `:23783-23807`, loop `:24450` (2–5 dist `35/35/15/15`) |
| Type effectiveness | `getMoveEffectiveness` `:25864`; applied `:23940`; immunity → 0 `:24306` |
| STAB | `calcSTAB` `:19542` |
| **Damage core** | `:24318` — `floor((floor(floor(22*BP*(A/D))/50)+2)*modifier)`, A/D floored first |
| Burn | `:24175` (`modifier *= 0.5` on physical) |
| Secondary effects / status | `parseMoveEffects(...)` — `:26905` |
| Recoil / drain / contact | `:24503-24569` (Life Orb, Rocky Helmet, Static/Flame Body, King's Rock) |
| End-of-turn / status gate | `canMove` `:26850-26868` + EoT residual block |
| Faint / switch / win-loss | `checkFaints()`; volatile reset on switch `:26500-26580` (`charging`/`invulnerable` clear `:26545-26546`) |

### 1.4 Entanglement (decision-critical)
Within `performAction`→`parseMoveEffects` (`:22135-29400`, ~7.3k lines):
**859 `logMsg` · 146 `await sleep` · 53 `updateUI` · 95 DOM/`anime()`/`AudioSystem` calls**,
interleaved with state mutation. `state.pActive/fActive` is referenced **310×** across the file.
The headless test harness only works because it **no-ops `sleep`** and stubs canvas/audio/anime —
i.e. the UI calls are *tolerated*, not absent. **There is no pure engine to lift out.**

### 1.5 RNG
`storyRngNext()` (`:35538`) is a seeded LCG, and **`Math.random` is globally monkeypatched
during a story run** (`:35565-35570`) to route through it. Verified: two seeded runs produced
**byte-identical transcripts** (including speed-tie, crits, paralysis). The 272 bare
`Math.random()` sites are therefore **not** determinism bugs in story mode (the override catches
them), but the override is load-bearing and undocumented at call sites.

---

## 2. Reference engine summary — Pokémon Showdown / `@pkmn/sim` (Phase 0)

### 2.1 What to adopt
- **`@pkmn/sim`** (npm, `0.10.9`) — *"an automatically generated extraction of just the
  simulator portion of `smogon/pokemon-showdown`."* **All gens 1–9**, full effect coverage,
  browser-bundleable (pure-JS deps: `@pkmn/sets`, `@pkmn/streams`, `ts-chacha20`). This is the
  right reference target.
- **`@pkmn/engine`** (`0.1.0-dev`) — **wrong tool today**: Zig/WASM, only Gens 1–2 in progress,
  *not* a full simulator, no custom-format support. Revisit only for millions of old-gen AI rollouts.
- **`@pkmn/protocol` + `@pkmn/client`** — convert sim protocol output into structured UI state
  (the right tools for an adapter, regardless of which engine produces the protocol).

### 2.2 How a battle runs
Event-driven (`Battle` owns `runEvent`; mechanics are handlers like `onTryMove`,
`onInvulnerability`, `onModifyDamage`). Driven through a **`BattleStream`** with a line protocol
(`>start {...}`, `>player p1 {...}`, `>p1 move 1`); output is protocol lines (`|move|`,
`|-damage|`, `|-status|`, `|faint|`, `|win|`). **A format is required** — for custom sets use
`gen9customgame` (permissive; note sets are *not* auto-validated by the sim).

### 2.3 Determinism
First-class. Seed is a **serializable string** (`sodium,<hex>` default, or `gen5,<hex>`),
round-trips via `PRNG.getSeed()`; `Battle` keeps `prngSeed = startingSeed`. **Cleaner than the
current mulberry32 setup** — the seed is an explicit value the sim itself serializes/replays.

### 2.4 Licensing (clean to adopt)
**MIT** for the sim *code*, the *data* tables, and the `@pkmn/*` packages. Obligations: retain
the copyright + permission notice. A faithful notice keeps **both** lines:
`Copyright (c) 2011-2026 Guangcong Luo and other contributors (Pokémon Showdown)` and
`Copyright (c) 2020-2026 pkmn contributors (@pkmn/sim)`. Pokémon names/dex/sprites/audio are
Nintendo/Game Freak/TPC IP — **separate from MIT**, used on standard fan-project footing.
**Gap to fix regardless of path:** `ATTRIBUTION.md` currently credits Showdown *sprites/audio*
but **omits the Showdown data/code (MIT)** even though the project already ships its data.

### 2.5 Cost of full adoption
Must pick a format/ruleset; **multi-MB bundle** (data-dominated, eager all-gen load — partly
redundant with data already shipped); **bundle it, don't CDN-hot-load**; little public precedent
for running the *full* sim client-side.

### 2.6 Canonical Fly behavior (our verification target)
Charge turn adds a `twoturnmove` volatile + a per-move `condition.onInvulnerability` whitelist:

| Charging move | Moves that still HIT | Power ×2 | Status immunities |
|---|---|---|---|
| **Fly / Bounce** | Gust, Twister, Sky Uppercut, Thunder, Hurricane, Smack Down, Thousand Arrows | Gust/Twister (Fly) | — |
| **Dig** | Earthquake, Magnitude | — | sandstorm, hail |
| **Dive** | Surf, Whirlpool | Surf/Whirlpool | sandstorm, hail |
| **Phantom Force** | *(none)* | — | — |

Plus: **Gravity** prevents Fly/Bounce selection; **Smack Down / Thousand Arrows** ground the
target. The in-house allow-lists at `:23092-23100` already match this — the only Fly defect is
the missing self-target guard (§3).

---

## 3. The Fly bug — root cause

```js
// battle.html:23087  — fires for EVERY move, including self-targeting/field moves
if (defender.volatile.invulnerable) {
    let chargingMove = defender.volatile.charging;
    let canHitInvulnerable = false;
    ...                                   // allow-lists (correct)
    if (!canHitInvulnerable) {
        logMsg(`${attacker.name}'s attack missed!`);   // :23104 — wrong for Roost/Calm Mind/…
        AudioSystem.playMissSound();
        registerMoveConnectionFailure(attacker, move);
        await sleep(1000); return;                      // :23107 — returns BEFORE self-effect
    }
    ...
}
```

The correct idiom already exists 200 lines earlier (Protect):
```js
// battle.html:22900
if (defender.volatile.protect && (move.cat !== "Status" || !SELF_TARGETING_STATUS.has(move.name))) { ... }
```
**Minimal fix:** gate the invuln block the same way. Self/field moves carry `neverMiss`, so they
skip the accuracy roll at `:23063` and land on `:23088`; the early `return` at `:23107` then kills
their effect (resolved later in `parseMoveEffects`).

**All moves on this code path** (set `invulnerable`, so trigger the bug as a *defender*):
**Fly, Bounce, Dig, Dive, Phantom Force, Shadow Force, Sky Drop**. (Charge-but-not-invulnerable
moves — Solar Beam, Sky Attack, Skull Bash, Razor Wind, Geomancy, Meteor Beam, Electro Shot,
Freeze Shock, Ice Burn — share the two-turn block but not the invuln defect.)

---

## 4. Bug catalogue (Phase 0)

| # | Symptom | Cause | Location | Severity | Isolated vs systemic |
|---|---|---|---|---|---|
| 1 | **Self/field moves "miss" vs a semi-invuln foe; effect lost** (the Fly report) | invuln check lacks self-target guard | `:23087-23110` | **High** | Isolated patch (mirror `:22900`) |
| 2 | Fly/Bounce/Sky Attack don't fail under **Gravity** | two-turn block has no `state.gravity` check | `:22611-22667` | Medium | Isolated; symptom of "no precondition layer" |
| 3 | Two-turn detection **ignores `flags.charge`** data | hardcoded `_forcedTwoTurn` Set | `:22612` | Low now / Med latent | **Systemic** (no data-flag tags) — new charge moves break silently |
| 4 | **Burn** halves final modifier vs halving `A` elsewhere | duplicated burn logic | `:24175` vs `:25886` | Low | **Systemic** (no single Attack pipeline) |
| 5 | Crit **always 1.5×**, never gen-accurate | hardcoded multiplier | `:23504` | Low (design?) | Isolated |
| 6 | AI damage math is a **parallel re-implementation** | `aiEstimateDmg` duplicates ~40 mults | `:19766` | Low (latent) | **Systemic** (two formulas to sync) |
| 7 | Cosmetic "missed!" for no-op self moves (Splash) vs airborne foe | same as #1 | `:23104` | Trivial | Same fix as #1 |
| 8 | 272 bare `Math.random()`, only saved by a global monkeypatch | style/fragility | `:21631` +268 | Low (oos modes) | Systemic style |

**Verified CORRECT vs Showdown (do not re-investigate):** damage core & A/D flooring, 16-step
roll, STAB ×1.5-once, type immunity → 0, crit ladder, multi-hit 2–5 distribution, sleep counter
(1–3), freeze 20% thaw, paralysis 25%+½ speed, never-miss correctly missing airborne, Thunder/EQ/
Surf override-hitting their semi-invuln states, Power Herb instant-charge, two-turn PP (1/cycle),
volatile reset on switch, AI scoring immune moves as 0.

> **Read this catalogue as evidence:** the correctness *floor* is high. What's missing is
> **proof and coverage** — not broadly-wrong math.

---

## 5. Why "for good" needs an oracle (the crux)

"Battle bugs resolved for good" is not a state you reach by editing code once. It is a **property
maintained over time**, and it requires two things:

1. **A proven source of truth** to define "correct" (Pokémon Showdown).
2. **Continuous differential testing** against it, so a fixed bug can never silently regress and
   new content is auto-validated.

- **Path B (port piecemeal) provides neither.** Every ported formula is a fresh, unverified
  re-implementation — the brief's own warning ("inherits none of the reference's test coverage
  and risks re-introducing bugs"). This *is* the whack-a-mole the user wants to escape. ❌
- **Path A (sim runs in production) provides #1 maximally**, but at large cost here: the renderer
  is fused to resolution (§1.4) so it must be rebuilt to consume a protocol stream; the custom
  RPG layer (story artifacts like "Amulet of Chaos", owner-tuned balance multipliers, fixed-damage
  story moves, `op-abilities` constraints, documented *intentional* divergences in
  `tests/reports/deviations.md`) must be re-expressed as Showdown mods or it breaks; and every
  subtle Showdown-vs-current difference becomes a forced behavior change across save-bearing story
  battles. High ceiling, high risk/effort — and **largely unnecessary** given §4.
- **The dominant move is to add #1 + #2 as an _oracle_** and let it drive #1-grade correctness
  into the existing, already-integrated engine. That is the recommendation.

---

## 6. Recommendation (Phase 1): "Path A, de-risked" — Showdown as oracle, convergence by category

> **Adopt `@pkmn/sim` as the proven authority via a permanent differential-test harness, fix the
> in-house engine to convergence by root-cause category, and keep the oracle in CI forever.**
> This dominates both A and B: it takes A's proven source of truth and B's incrementalism, and
> drops B's "no oracle" and A's "rebuild the renderer + re-express the whole RPG layer." It is a
> **safe on-ramp that can graduate to full Path A per-subsystem** if (and only if) the oracle's
> divergence report shows a subsystem is too rotten to converge.

### Staged plan (each stage independently shippable; **gameplay code only changes from Stage 2**)

**Stage 0 — Build the oracle (no gameplay change).**
- Add `@pkmn/sim` as a **dev/test dependency** (bundled for the test harness, not the game).
- Wrap the in-house engine to emit a structured **event/HP trace** (we already drive it headless
  via `tests/helpers/load-engine.js`).
- Build `tests/differential/` : same seed + same team → run through **both** engines → diff
  per-event HP / status / hit-miss / faint. Output a ranked **divergence report**.
- **Deliverable:** a complete, evidence-backed map of *every* divergence (turning "assume there
  are more" into a finite list), and a CI gate. *This is the artifact that makes "for good" real.*

**Stage 1 — Fix the confirmed High/Medium bugs against the oracle.**
- Fly self-target guard (#1), Gravity gate (#2). Each lands green against `@pkmn/sim`, with a new
  regression test that replaces the `it.todo()` stubs for two-turn moves.

**Stage 2 — Fix by root-cause category, not symptom.** Drive divergences to zero in batches that
remove the *shape* of the bug class:
- Data-flag-driven move tags (kill the `_forcedTwoTurn`/`_hideOnCharge` name-lists → use
  `flags.charge` etc.) — fixes #3 and prevents the next one.
- Single Attack/damage modifier pipeline (fixes #4; lets the AI estimator reuse it → #6).
- (Optional, owner's call) gen-accurate crit (#5).

**Stage 3 — Decide the end-state with data in hand.** With the divergence count near zero and the
oracle in CI, choose per-subsystem:
- **Stay** (in-house engine, oracle-guarded) where convergence was cheap — likely most of it.
- **Graduate to full Path A** (let `@pkmn/sim` resolve in production behind the `launchBattle`/
  `onBattleEnd` seam, with a protocol→`logMsg`/animation adapter) for any subsystem the report
  proves is structurally hopeless. This is now a *measured* decision, not a leap.

### What each path delivers against the goal

| | "All bugs resolved for good" | Effort / risk | Keeps custom RPG layer | Renderer |
|---|---|---|---|---|
| **B — port piecemeal** | ❌ no oracle → regressions | low/inc | ✅ | unchanged |
| **A — sim in production** | ✅ (ceiling) | **high / big-bang** | ⚠️ must re-express as mods | **rebuild** |
| **Recommended — oracle-led** | ✅ (proof + CI, permanent) | **low / incremental** | ✅ | unchanged (until/unless §Stage 3) |

### Why not just "full A" now
The engine is already mostly correct (§4) and fused to a custom-RPG renderer (§1.4). Paying for a
full sim-in-production rewrite to fix what is, in evidence, a **coverage-and-proof** problem is
disproportionate — and it would force behavior changes across tuned, save-bearing story battles,
which `CLAUDE.md` says require explicit owner sign-off. The oracle gives the same *correctness
guarantee* incrementally, and the door to full A stays open per-subsystem.

---

## 7. Decision required before Phase 2
Per the brief and `CLAUDE.md` ("no game-behavior change without sign-off"), I will not touch
engine code until you approve. The concrete first commitment is small and reversible:

> **Approve Stage 0** (add `@pkmn/sim` as a test-only dep + build the differential oracle and
> divergence report — *no gameplay change*). Stage 0's report then informs the A-vs-stay decision
> at Stage 3 with real data.

Alternatives if you'd rather: **(i)** just fix the Fly bug now (one-line guard + test) and stop;
**(ii)** commit to full Path A immediately; **(iii)** Path B. My recommendation is the oracle-led
path above.
