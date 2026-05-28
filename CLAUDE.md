# CLAUDE.md — Pokemon Battle Arena (scope & rules for AI sessions)

> This file is loaded into every Claude session as project context. Read it before any work.

## What this codebase is

A single-page Pokémon-style battle simulator (`battle.html`, ~48k LOC). Three play modes exist in the code:

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

## Role boundaries

The repo has three AI session lines working in parallel:

| Branch line | Owner | Domain |
|---|---|---|
| `claude/*-pasteur-*` | "pasteur" | Story flow — timeline, beats, intro queue, save schema versions, MF dispatch, canon trainer overrides, 3-track system |
| `claude/*-maxwell-*` | "maxwell" | Difficulty pacing — IV gating, EV caps, tier curves, foe stat multipliers, tutor staging, move-tag index |
| `claude/optimistic-ptolemy-*` and other ad-hoc | "general" (this session) | Engine correctness, code hygiene, perf, a11y, data-driven sustainability, polish |

**Hard rule**: general-session does NOT modify story timeline / save schema (pasteur) or difficulty curve / IV tiers / stat multipliers (maxwell) without written hand-off from the relevant lineage.

## Approval rules

- **No game-behavior change ships without explicit user sign-off.** Diff is proposed; user approves; only then commit. This applies to: damage formula, status logic, AI move choice, ball math, type chart, RNG semantics, balance numbers, any move/ability implementation.
- **Balance numbers are user-owned.** HP curves, foe stat multipliers, ball %, gold values, retreat fees — I extract & expose them; user picks values.
- **Behavior-preserving refactors do not need diff-level approval** if they are strictly 1:1 (rename, extract helper, dead-code removal verified by grep). They still need approval for the *direction* before starting a sweep.
- **Doc deletion is OK without sign-off** for content marked as DE-SCOPED in this file.
- **Flow-ordering bugs MUST be flagged** even though the user "owns" the flow (e.g., "intro fires after gift is delivered"). User can't pre-spot ordering inconsistencies in 48k LOC — that's the AI's job.

## Architecture preferences

- **Data-driven over code-driven**: dialogue pools, type chart, ball multipliers, UI strings → JSON under `data/`. Mechanics & curves stay in code (pasteur/maxwell territory).
- **Sustainable**: every refactor leaves behind a deterministic test (jsdom harness via `tests/helpers/load-engine.js`), so the next AI session can't silently regress it.
- **Helpers over duplicated logic**: the "vibecode" pattern of re-inlining a 3-line block 25 times is what we are trying to undo.
- **Use seeded RNG (`storyRngNext`) everywhere user-visible**, never bare `Math.random()`. Deterministic replays are part of the product.

## Audit infrastructure

- `agent-state/ISSUE_LEDGER.md` — single source of truth for known issues. Add findings via `agent-state/findings/<agent>-<timestamp>.md`, then run `node scripts/debug/issue-ledger.mjs`.
- `.claude/agents/*.md` — 10 specialist auditors fanned out by `/deep-debug`.
- `STORY_MODE_FLOW.md` — pasteur's design canon.
- `docs/PROGRESSION_CURVE_MASTER.md` — maxwell's curve canon (if present).
- `tests/helpers/load-engine.js` — jsdom harness; ~2.5s first boot, cached thereafter.

When in doubt, ask before acting.
