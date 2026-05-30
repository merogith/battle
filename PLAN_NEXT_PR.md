# Next PR Plan — Remaining work after PR #139

PR #139 fixed the critical scope bugs (BUG-001 / BUG-002), save-corruption recovery (BUG-005), and a handful of UX/contrast polish items. This document plans **the rest** — what to land next, in what order, with concrete file:line refs and risk notes.

## Branching

PR #139 is being merged into `main`. The work below is split across **three follow-up PRs** so each one is small enough to review carefully:

| PR | Scope | Estimated diff size | Estimated effort |
|----|-------|--------------------|------------------|
| **PR-A — RNG migration (BUG-003)** | Battle-engine bare `Math.random` → seeded `storyRngNext` when `sm.active`. ~86 hot sites. | ~150 LOC across battle.html | 1 focused day |
| **PR-B — AI stall heuristic (BUG-004)** | Inject KO-shot priority and anti-stall weighting in `getBestMove` + `aiDecision`. | ~60 LOC | Half day + tuning |
| **PR-C — UI / balance / narrative polish** | The ~17 remaining items from BUG_REPORT.md / DESIGN_FEEDBACK.md, picked by priority. | varies | 1–2 days |

Each PR can be reviewed independently. PR-A is a prerequisite for any future "deterministic replay" feature; PR-B unblocks long-form post-game (Crucible / Frontier); PR-C is reviewer-friendly polish.

---

## PR-A — RNG migration (BUG-003)

### Goal
Make story-mode battles deterministic from `runSeed`. Replay-from-seed today does NOT reproduce identical fights because 295 `Math.random()` calls live in the engine; only 48 use the seeded LCG.

### Site inventory (verified by grep, 2026-05-22)

| Range | Count | Category | Migration verdict |
|-------|-------|----------|-------------------|
| Inside `window.StoryMode` IIFE (lines 27449–48183) | 88 | Story-mode private helpers (encounter rolls, team rolls, dialogue picks) | Already lexical-scoped to `storyRngNext` — change only the bare `Math.random` ones |
| Lines < 16000 (UI / build factory / shop / setup) | 111 | Mostly **pre-battle** team / build generation, shuffles, casino, sprite flavor | Migrate when `sm.active && sm.runSeed`; leave pure-UI flavor (e.g. session BG type at line 7376) alone |
| Lines 16000–27000 (battle engine) | 86 | Damage roll, crit, accuracy, ability triggers, secondary effects, sleep/confusion durations, multi-hit count | **Highest priority — migrate all in story-mode active battles** |
| Lines 27000–27449 (border) | 10 | Mix of UI + engine helpers | Migrate alongside engine |
| Total outside-IIFE | **207** | | |
| **Total Math.random in battle.html** | **295** | | |

### Strategy

Introduce a **single rng accessor** at engine entry, passed down or stashed on the battle `state` object so every nested function uses the same source:

```js
// In startBattle / runTurn entry:
state.__rng = (sm && sm.active && typeof window.storyRngNext === 'function')
              ? window.storyRngNext
              : Math.random;
```

Then replace each in-engine `Math.random()` with `state.__rng()`. For helpers that don't get `state`, fall back to the BUG-002 pattern: `(sm && sm.active && typeof window.storyRngNext === 'function') ? window.storyRngNext() : Math.random()`.

### Phasing (smallest commits first — each independently green-tests)

**Phase 1 — Damage formula (the most-felt 6 sites)**
| File:line | Use |
|-----------|-----|
| `battle.html:21682` | Damage roll `0.85 + Math.random()*0.15` |
| `battle.html:21188` | Crit chance |
| `battle.html:20748` | Accuracy / miss check |
| `battle.html:19374` | Speed-tie coin flip |
| `battle.html:22016` | Psywave variance |
| `battle.html:21088` | Magnitude damage roll |
| `battle.html:21462` | 2–5 multi-hit pick |

Verification: `tests/story-combat.mjs` can be extended with a determinism test — run the same battle twice with the same seed, assert byte-equal battle logs.

**Phase 2 — Ability triggers (4 sites)**
| File:line | Use |
|-----------|-----|
| `battle.html:22467` | Static |
| `battle.html:22468` | Poison Point |
| `battle.html:22469` | Flame Body |
| `battle.html:22470` | Cute Charm |
| `battle.html:25044` | Stench |
| `battle.html:19359-:19360` | Quick Claw |
| `battle.html:22081` | Focus Band |

**Phase 3 — Move-internal RNG (~15 sites)**
| File:line | Use |
|-----------|-----|
| `battle.html:25025` | All secondary effects (flinch, status, stat-drops, confuse) — **biggest single site, branches ~50 moves** |
| `battle.html:20083` | Sleep Talk pick |
| `battle.html:20272` | Metronome pick |
| `battle.html:20312` | Confuse Ray (50/50 status check inside engine path) |
| `battle.html:20432-:20547` | Status moves' success rates (12 entries — Poison Powder, Sleep Powder, Stun Spore, Toxic, etc.) |

**Phase 4 — Build / team / loot rolls under `sm.active`**
| Lines | Use |
|-------|-----|
| 9669–9869 | `makeBuild` randomness — only seed when story mode active so quick-play stays varied |
| 10376–10377 | "Pick a random non-excluded index" — for trainer move picks |
| 10820 | Shuffle helpers |

**Phase 5 — Sweep remainder + add determinism test**
- Sweep any remaining hot-path bare `Math.random()` calls in the battle engine.
- Add `tests/determinism.mjs`: same `runSeed`, same starter, same first-Battle event → assert identical first-N battle log lines and HP outcomes.

### Sites to deliberately **leave** as bare `Math.random`
- Cosmetic UI flavor (`sessionBgType` at 7376, sprite jitter, particle/anime calls).
- AI's "tiny tie-breaker" at `battle.html:18517` (`score += Math.random() * 6;`) — if seeded, the AI becomes 100% predictable, which players exploit. Mark with a comment.
- Quick Play / PvP battles where `sm.active === false` — these should remain unseeded.

### Risks
- **Subtle behavior shift:** code that uses two consecutive `Math.random()` calls expecting independence — verify each call site still gets a fresh value (storyRngNext returns fresh per call, so this is fine, but worth a quick read).
- **AI becoming exploitable** if Phase 5 over-applies seeding to AI tie-breakers — see "Sites to leave" above.
- **Performance:** `storyRngNext` is one Math.imul + one division — negligible. No concern.
- **Save-game replay surprises:** if a player loaded a save with `_strngState` from a buggy old build, the new run continues that LCG state. Acceptable; document in CHANGELOG.

### Effort estimate
- Phase 1: 30 min (7 sites, mechanical)
- Phase 2: 30 min (7 sites)
- Phase 3: 1 hour (15 sites + verify secondary-effect categories)
- Phase 4: 1.5 hours (40+ sites in build/team code, needs context per call)
- Phase 5 + determinism test: 1.5 hours
- **Total: ~5 hours focused work** (vs. the original "8-hour mechanical pass" estimate — narrower scope once UI random is excluded).

---

## PR-B — AI stall heuristic (BUG-004)

### Goal
6v6 stress fights currently stall past 50 turns in 3 of 5 `tests/story-combat.mjs` cases. Players will see grinding mid-game battles. Fix the AI to break stalls.

### What I learned from re-reading `aiDecision` and `getBestMove`

The AI **already** has a KO check (`canKO = myBestDmg >= defender.currentHp` at `battle.html:18560`) and refuses to switch when it can KO. So "AI doesn't pick KO" is NOT the root cause. The actual problem is more interesting:

1. **`getBestMove` (line 18046)** scores all moves and picks the highest. Its weighting includes type effectiveness, raw damage, status setup, hazard value, and a `+Math.random()*6` tie-breaker.
2. When both mons have ~3× the HP of a single attack and no super-effective coverage, the highest-weighted move is consistently a **status or chip** move — because the damage score is low for everyone, and status moves score on board-control (sleep, paralyze, hazards). So the AI keeps setting up screens, hazards, or status onto a target it can't break.
3. The 50-turn stall is the result: AI A keeps using a chip + setup pattern, AI B does the same, neither pushes for the KO.

So the fix needs two things:
1. **Force-priority KO shots** when a damaging move is in range, even against the scoring system's preference for setup.
2. **Anti-stall escalation** when many turns pass without HP loss — push the highest-BP available move regardless of board state.

### Plan

**Change 1 — In `getBestMove` (battle.html:18046+), before final scoring:**
```js
// Anti-setup: if any move would KO the defender this turn, lock to it
// instead of feeding the scoring system. Saves 5-15 turns per battle.
if (move.cat !== "Status") {
  const dmgEst = aiEstimateDmg(attacker, defender, move);
  if (dmgEst >= defender.currentHp) score += 50;  // dominant bonus
}
```

**Change 2 — In `aiDecision` / state, add a stall counter:**
```js
// Battle-state counter, incremented per turn when neither side loses HP
state.aiStallTurns = state.aiStallTurns | 0;
const prevTotal = state.aiPrevHpTotal;
const curTotal = sumHp(state.fActive) + sumHp(state.pActive);
if (curTotal === prevTotal) state.aiStallTurns++;
else { state.aiStallTurns = 0; state.aiPrevHpTotal = curTotal; }
```

**Change 3 — In `getBestMove`, escalate when stalling:**
```js
if (state.aiStallTurns >= 3 && move.cat !== "Status") {
  score += Math.min(20, move.pow / 5);  // bias toward high-BP
}
```

### Test plan

- Re-run `tests/story-combat.mjs`. Expect Battles 3, 4, 5 to set `isOver=true` within 30–40 turns.
- Add a synthetic "stall" battle to the combat test: two `Snorlax` clones with `Tackle` + `Toxic` + `Recover` + `Substitute` only. Currently this would loop forever; with the patch it should resolve in <50 turns.
- Manually open `battle.html?testbattle=charge6` (an existing dev battle harness) and walk through a 6v6 to verify the AI doesn't become *too* aggressive (e.g., refuses to setup at low HP when setup is correct).

### Risks
- The +50 KO bonus is dominant; verify it doesn't suppress legitimate switch decisions (the existing `if (canKO && !willDieFirst) return null;` in `aiDecision` already handles "don't switch when you can KO" — the new bonus reinforces this in move-pick).
- "Sum HP unchanged" stall-detect misses Pain Split / Substitute states. Worth a comment but probably fine.
- A stall-aware AI might feel "different" to existing players — consider gating behind a config flag for one release: `sm.settings.aiAntiStall = true` default.

### Effort estimate
- Implementation: 2 hours
- Tuning (replay test battles, adjust the +50 / +20 constants): 2 hours
- **Total: ~4 hours.**

---

## PR-C — Remaining 17 findings (UI / balance / narrative)

Pulled from `BUG_REPORT.md` and `DESIGN_FEEDBACK.md`. Bucketed by what to do:

### Tier A — ship in PR-C (8 items, all P1)

| Item | Where | What | Effort |
|------|-------|------|--------|
| BUG-007 | npm test | Tighten STAB sub-test or document the Body Press / Salt Cure / Sizzly Slide / Vacuum Wave exceptions | 30 min |
| BUG-009 | tests/story-walkthrough.mjs | Tighten "localStorage not available" suppression to exact match | 5 min |
| BUG-011 | battle.html dialogue pools | Mystery Figure foreshadow lines (24 lines total, 3 per identity × 8) | 1 hour |
| BUG-016 | Battle Frontier UI | Persistent "Frontier N / Best M" overlay during a run + best-run record | 1.5 hours |
| BUG-017 | save toast | Show first-save confirmation toast regardless of `sm.active` | 15 min |
| BUG-020 | misc strings | "Pokemon" → "Pokémon" in player-visible user strings (curated allowlist) | 30 min |
| BUG-021 | Crucible button | First-visit tooltip explaining "post-HoF hub vs Battle Frontier sub-facility" — partially done via `_storyShowOneTimeTip('crucible', …)`, expand the line | 15 min |
| Design 2.3 | post-HoF returns | `POST_HOF_CITY_QUOTES` pool — one line per facility per city acknowledging the win | 1 hour |

### Tier B — defer to PR-D (4 items, P2 — needs scope decisions)

| Item | Why deferred |
|------|--------------|
| BUG-006 (currentTrainerData null-recovery on resumed save) | Needs the engine's resume path traced end-to-end; safer to do after PR-A so the RNG state is also restored cleanly |
| BUG-012 (mid-game pacing flat, GL4 → GL6) | Balance change — needs a tuning pass with telemetry, not a one-liner |
| BUG-013 (challenge mode multiplier widen) | Same — would re-tune live players' experience; needs explicit OK |
| BUG-014 (late-game economy tight) | Same — needs sim of typical run gold curve before changing prices |

### Tier C — close as not-a-bug (3 items)

| Item | Why closing |
|------|-------------|
| BUG-008 (`_storyTutorMode` double-decl) | Re-verified `grep -n "let _storyTutorMode" battle.html` → exactly one match (line 44199). The codebase-map note was stale. No actual double-decl. |
| BUG-019 (PC overflow at 10) | Walkthrough harness probe already passes (`edge.pc.overflow` never fires). Already enforced. |
| BUG-026 ("748 species reserved for end-game") | Design choice, not a bug. Document in a future content-rollout doc. |

### Tier D — long-tail (2 items, defer to its own PR-E)

| Item | Why standalone |
|------|---------------|
| BUG-024 (move-tutor delegation for late-added rows) | Needs a live browser-test to repro; hard to verify in jsdom |
| Design 5.2 (split battle.html into modules) | Multi-week engine modernization — separate roadmap doc |

### PR-C effort estimate
- Tier A items: ~5 hours total
- Tier B / D explicitly deferred; Tier C explicitly closed (changelog only)

---

## Verification gates for each PR

Each PR MUST pass before merge:

1. `npm install && npm test` — full damage / type / STAB suite (~2 min)
2. `node tests/story-walkthrough.mjs` — 0 errors expected
3. `node tests/story-combat.mjs` — 0 errors expected (stalls allowed in PR-A, must be 0 in PR-B)
4. `node tests/story-variants.mjs` — 0 errors across all 9 variants
5. `node --check` on extracted inline script — clean
6. Smoke: `npm start` + manual open of `http://localhost:5173/battle.html`, start a story run, beat one battle, save+reload, confirm continuity.

PR-A additionally requires the new `tests/determinism.mjs` to pass.

PR-B additionally requires the synthetic 2× Snorlax stall battle to resolve in <50 turns.

---

## Suggested order

1. **PR-A first.** RNG hygiene is foundational; without it, determinism tests are noise.
2. **PR-B second.** Stall heuristic is the most-noticeable gameplay improvement.
3. **PR-C in parallel** with PR-A/B — independent files mostly, won't conflict.
4. **PR-D / PR-E** after.

Total estimated time across A+B+C: **~14 hours of focused work**, comfortably one week part-time.

---

## Open questions for the maintainer

- **Q1:** Should `runSeed` cover all build / team randomness (Phase 4 of PR-A), or only mid-battle dice? Answering "all" gives you reproducible-from-seed runs (good for streamers / leaderboards / bug repros); answering "battle dice only" lets each new run feel fresh even with a fixed seed.
- **Q2:** Should the AI anti-stall heuristic be on by default, or gated behind a `sm.settings.aiAntiStall` toggle for one release?
- **Q3:** OK to widen `challenge` difficulty stat-mult from 1.30 → 1.40 in PR-D (BUG-013)? This would buff existing challenge runs mid-stream — only do if you're OK with that.

Reply on PR-A / PR-B / PR-C draft with answers and I'll proceed.
