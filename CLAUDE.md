# CLAUDE.md — Pokemon Battle Arena (scope & rules for AI sessions)

> This file is loaded into every Claude session as project context. Read it before any work.

## What this codebase is

A single-page Pokémon-style battle simulator (`battle.html`, ~61k lines / 4 MB — HTML + CSS + JS in one file). Three play modes exist in the code:

- **Story** — single-player campaign with cities, gyms, rival, mystery figure, post-game.
- **Quick Play** — instant standalone battles (Player vs CPU).
- **Online PvP** — Supabase-mediated 1v1 (`online-pvp.js`).

Plus a **Battle Frontier / Gauntlet** ladder reachable from the Story flow.

## Active scope (mid-2026)

**Story mode (normal difficulty)** is the only active scope.

### Permanently OUT OF SCOPE — do not flag findings here as actionable

- `online-pvp.js` and all PvP UI / Supabase code
- Quick Play screens and code paths
- Battle Frontier / Gauntlet (post-game ladder)

Auditors may still scan these for awareness, but findings must be tagged **out-of-scope** in status and never proposed as work items in the main backlog.

### De-scoped permanently (cut, not retired)

Five spec systems were authored but never shipped. They are now **permanently cut**, not "deferred":

- Black Market shop
- Illegal Dealer NPC
- Battle for Pokémon (wager)
- Pokémon Trader (City4 swap)
- Full Itinerary scaffolding (`runItinerary`, `sm.itineraryProgress`, `STORY_SCRIPT`)

Verify before reviving: `grep -niE 'blackMarket|illegalDealer|pendingWager|traderOfferByCity|itineraryProgress' battle.html` → 0 hits today. Past spec text lives in git history.

### Excised vs retired (mid-2026 cleanup) — both distinct from "cut" above

- **Caged God boss arc** (the post-HoF boss: broker → 3 underground leads → "the Cage" → "Subject Zero" capture, with a dedicated Master-Ball sink) — **EXCISED**. The arc code is removed; `migrateStoryPreV24` strips the vestigial `sm.bossArc` from old saves, and `migrateStoryPreV15` first bridges `bossArc.available` → `postHofMysteryClimaxDone` so post-game access is preserved. The post-game is now the Mystery Figure climax → Crucible. A few *accurate* "now-removed" comments + that migration code legitimately still name `sm.bossArc` — **that is expected, not an incomplete excision.** Revival via git history.
  Verify the arc *code* is gone: `grep -niE '_bossArcRenderSection|bossCollectLead|_bossArcCheckCageUnlock' battle.html` → 0 hits. (`sm.bossArc` survives only in the two migrations above.)
- **8-storyline TONE layer** (`STORYLINE_VARIANTS` = `classic` + 7 tones: `second_sun` / `bone_keepers` / `project_mewtwo` / `hypnos_lullaby` / `dead_raticate` / `lavender_frequency` / `static`) — **RETIRED to `classic`, but KEPT in code (dormant, reversible)** — *not* cut. Every run is forced to `classic` (`_readStorylineFromUI` + the `load()` back-fill); run variety now comes from the 3-track system (`sm.tracks`). The tone scripts — per-variant cold-opens (`STORY_COLD_OPENS` non-`classic_*` keys), `_CHAMPION_DIALOGUE_BY_VARIANT`, the "Subject Zero" starter, and broker/cage prose (some naming the excised Caged God) — are **DORMANT, NOT live bugs; do not flag them.** Each carries a `⚠️ DORMANT` banner. Design spec: `docs/STORY_NARRATIVE_VARIANTS.md` (marked retired). To revive: restore the roll in `_readStorylineFromUI()`. Tests: `tests/suites/story-tone-retirement.test.js`.

## Workflow (solo developer, single branch → main)

This is a **solo project**. There are no parallel "session lineages" — work on the active
branch, get the maintainer's sign-off on behaviour changes, then merge to `main`. `main`
is the source of truth; feature branches are short-lived and should be deleted after merge.

**Sensitive areas — change carefully, never casually (but fine to touch when asked):**

- **Story flow & saves** — `STORY_EVENTS_RAW` timeline, beat ordering, intro queue, and the
  save schema (`SAVE_VER` + `migrateStoryPreV*`). A wrong edit here can corrupt a player's
  existing save. Read `STORY_MODE_FLOW.md` before touching it.
- **Difficulty curve / balance** — IV gating, EV caps, build tiers, foe stat multipliers,
  tutor staging. These are tuned *numbers the maintainer owns* (see Approval rules).
  Reference: `docs/PROGRESSION_CURVE_MASTER.md`.

## Approval rules

- **No game-behavior change ships without explicit user sign-off.** Diff is proposed; user approves; only then commit. This applies to: damage formula, status logic, AI move choice, ball math, type chart, RNG semantics, balance numbers, any move/ability implementation.
- **Balance numbers are user-owned.** HP curves, foe stat multipliers, ball %, gold values, retreat fees — I extract & expose them; user picks values.
- **Behavior-preserving refactors do not need diff-level approval** if they are strictly 1:1 (rename, extract helper, dead-code removal verified by grep). They still need approval for the *direction* before starting a sweep.
- **Doc deletion is OK without sign-off** for content marked as DE-SCOPED in this file.
- **Flow-ordering bugs MUST be flagged** even though the user "owns" the flow (e.g., "intro fires after gift is delivered"). User can't pre-spot ordering inconsistencies in 61k lines — that's the AI's job.

## Architecture preferences

- **Data-driven over code-driven**: dialogue pools, type chart, ball multipliers, UI strings → JSON under `data/`. Mechanics & curves stay in code.
- **Sustainable**: every refactor leaves behind a deterministic test (jsdom harness via `tests/helpers/load-engine.js`), so the next AI session can't silently regress it.
- **Helpers over duplicated logic**: the "vibecode" pattern of re-inlining a 3-line block 25 times is what we are trying to undo.
- **Use seeded RNG (`storyRngNext`) everywhere user-visible**, never bare `Math.random()`. Deterministic replays are part of the product.
- **Sloppy-mode hazard**: `battle.html` has no `'use strict'`. Bare reassignment to an undeclared identifier silently creates a window global — it does NOT update an already-declared `let`/`const` in scope. When loader code populates a module-level placeholder, always: (a) declare the `let`/`const` with `{}`/`[]` defaults near the consumer's enclosing scope, (b) mutate via `Object.assign(X, fetched)` or `X.push(...fetched)`, NEVER `X = fetched`, (c) optionally mirror to `window.X = X` at declaration for cross-script readers. The early-let block above `loadGameData()` is the canonical pattern.

## Audit infrastructure

- `agent-state/ISSUE_LEDGER.md` — single source of truth for known issues. Add findings via `agent-state/findings/<agent>-<timestamp>.md`, then run `node scripts/debug/issue-ledger.mjs`.
- `.claude/agents/*.md` — 10 specialist auditors fanned out by `/deep-debug`.
- `STORY_MODE_FLOW.md` — story-mode design canon (the shipped catch / PC / Safari / boss systems).
- `docs/PROGRESSION_CURVE_MASTER.md` — difficulty-curve reference (the flat-Lv50 / 3-axis model).
- `tests/helpers/load-engine.js` — jsdom harness; ~2.5s first boot, cached thereafter.

When in doubt, ask before acting.
