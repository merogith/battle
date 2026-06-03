# Camp System — Design Spec (master index)

> **Status: DRAFT SPEC — nothing implemented yet.** This folder is the design
> canon for a new Story-mode feature ("Camp"). It is written for the *next* AI
> session / developer to implement against. Every number that touches balance is
> flagged **[MAINTAINER]** and must be signed off by the user before it ships
> (see `CLAUDE.md` → Approval rules). No code in `battle.html` has been changed
> for this feature.
>
> Author pass grounded the integration points against the live monolith
> (`battle.html`, ~61k lines) via three read-only research sweeps; anchors below
> are **symbol-first** (resolve with the `find-anchor` / `anchor` skill — line
> numbers drift).

---

## 1. The problem this solves

Story mode currently marches the player through a flat timeline of events
(`STORY_EVENTS_RAW`): city → battle → battle → city → … One event ends and the
next begins with no connective tissue. The maintainer's words:

> *"it confuses me what is happening. [Camp] will give each event stronger
> boundaries… a buffer between concepts."*

**Camp is a deliberate low-stakes beat inserted *between* route events.** It is
both a **narrative buffer** (a breath that frames "that event is over; the next
is coming") and a **hub** (party care, bonding minigames, backtracking). The
target route rhythm becomes:

```
City ──▶ wild/catch ──▶ [CAMP] ──▶ Event 1 ──▶ [CAMP] ──▶ Event 2
     ──▶ [CAMP] ──▶ Trainer battle ──▶ [CAMP] ──▶ tall grass ──▶ City
```

The camp is the same recognizable place each time, so it reads as the seam
between distinct happenings — exactly the cognitive boundary the maintainer
wants.

---

## 2. The five pillars

| # | Pillar | Doc | Depends on code |
|---|--------|-----|-----------------|
| 1 | **Event buffering** — interpose a camp beat between route events | [`CAMP_FLOW.md`](./CAMP_FLOW.md) | `processNextEvent` / `proceedToNextBattle` seam |
| 2 | **Pokémon bonding** — 6 relationship paths, each maxes into a small per-stat buff | [`BONDING_RELATIONSHIPS.md`](./BONDING_RELATIONSHIPS.md) | `buildPokemon` stat hook; save slot shape |
| 3 | **Bonding minigames** — Tamagotchi-style interactions that feed the 6 paths | [`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md) | scene engine + casino minigame pattern |
| 4 | **Camp hub utility** — party sorting + return-to-previous-city | [`CAMP_FLOW.md`](./CAMP_FLOW.md) §4–6 | party UI; `lastStoryCityEventIndexAtOrBefore` |
| 5 | **Event cinematics** — richer animation/visual beats per event type | [`EVENT_CINEMATICS.md`](./EVENT_CINEMATICS.md) | `_renderNarrativeOverlay` / `_storyScene` |

Build order and dependencies are in [`IMPLEMENTATION_ROADMAP.md`](./IMPLEMENTATION_ROADMAP.md).

---

## 3. The bonding system in one breath

Six ways to relate to each of your Pokémon — **2 kind, 2 cruel, 1 romance, 1
weird** — each advanced by Tamagotchi-ish camp interactions. Because there are
exactly **6 battle stats** (`hp/atk/def/spa/spd/spe`) and **6 paths**, each path
maxes into **+5% of one stat [MAINTAINER]**. The vibe is a pet sim bolted onto
the journey; the buff is a *small* mechanical reason to engage, not a power
spike. Full design + the stat mapping (and a reconciliation of two slightly
different stat lists the maintainer gave) is in
[`BONDING_RELATIONSHIPS.md`](./BONDING_RELATIONSHIPS.md).

---

## 4. Cross-cutting engineering rules (apply to every pillar)

These come straight from `CLAUDE.md` and the research sweeps — the implementing
agent **must** honour them:

- **One `SAVE_VER` bump for the whole feature.** All new persistent state lands
  under a single **`SAVE_VER` 24 → 25** migration (`migrateStoryPreV25`). Do not
  ship pillars on separate version bumps. The per-field defaults + the migration
  body are specified per-doc and collated in the roadmap. Story saves are a
  **sensitive area** — read `STORY_MODE_FLOW.md` first, mirror the existing
  `migrateStoryPreV21` / `migrateStoryPreV24` shape.
- **Never renumber `STORY_EVENTS_RAW`.** `sm.eventIndex` indexes into it; adding
  or removing rows silently re-points every in-flight save. Camp is interposed
  in the *flow*, gated by a new `sm` field — see `CAMP_FLOW.md` §3.
- **Seeded RNG only.** Anything random + user-visible (minigame outcomes, camp
  flavour, which interaction the Pokémon "prefers") uses `storyRngNext`, never
  bare `Math.random()`. Deterministic replays are part of the product.
- **Data-driven.** Relationship-path definitions, interaction copy, minigame
  tuning, camp dialogue → JSON under `data/`. Mechanics, curves, and the stat
  hook stay in code. (See each doc's "Data" section.)
- **Sloppy-mode hazard.** `battle.html` has no `'use strict'`. When a loader
  populates a module-level table, declare the `let`/`const` near its consumer
  and mutate via `Object.assign` / `.push`, never bare `X = fetched` (it creates
  a window global instead of updating the `let`). See `CLAUDE.md`.
- **Balance is the maintainer's.** Every **[MAINTAINER]** tag (buff %, decay
  rate, interactions-per-camp, whether camp is forced or skippable, backtrack
  cost) is exposed as a knob; the user picks the value. The implementing agent
  proposes a diff and waits for sign-off before any behaviour ships.
- **Leave a test behind.** Each pillar ships a deterministic jsdom test
  (`tests/helpers/load-engine.js`) so the next session can't silently regress it.

---

## 5. Decisions for the maintainer (rollup)

Each is explained in context in the linked doc; collected here so they can be
answered in one pass. **None are blocking for reading the spec** — they're the
knobs to set before implementation.

| ID | Decision | Where | Author's recommendation |
|----|----------|-------|--------------------------|
| D1 | Per-path maxed buff magnitude (default **+5%/stat**) | BONDING §5 | +5% — ≈ one `FOE_POWER_CURVE` step; small per-stat |
| D2 | Stat ↔ path mapping (reconcile the two stat lists) | BONDING §3 | 6-stat bijection (table in §2) |
| D3 | Do bonds **decay** between visits? | BONDING §8 | Off (or very slow) for v1 — reward, not chore |
| D4 | Buff at **max only**, or gradual as the bar fills? | BONDING §5 | Max-only (matches "when maxed") |
| D5 | Interactions allowed **per camp visit** (pacing) | BONDING §4 | 3 — maxing spans many camps across the route |
| D6 | Is camp **forced** (true buffer) or **skippable**? | CAMP_FLOW §8 | Forced first time per transition, 1-tap skip after |
| D7 | Return-to-previous-city: free visit, or costs progress/turn? | CAMP_FLOW §5 | Free round-trip via a return-point stash |
| D8 | Which event transitions get a camp (all? only some)? | CAMP_FLOW §2 | All non-city→city route transitions |
| D9 | Cinematics scope for v1 (which event types) | EVENT_CINEMATICS §3 | Legendary-sighting fold first (POC) |

---

## 6. Glossary

- **Camp** — the recurring between-events hub/buffer screen.
- **Path** — one of 6 relationship tracks per Pokémon (Praise, Nurture,
  Discipline, Intimidate, Mimicry, Devotion).
- **Bond bar** — a path's 0→max progress on a given Pokémon (`slot.bonds[path]`).
- **Transition** — the seam between event N and event N+1, keyed by `eventIndex`.
- **Interpose** — inserting camp into the flow without adding a timeline row.
- **`sm`** — the Story-mode save object (`pbs_story_save` in localStorage).

---

## 7. Provenance

Design from the maintainer's brief (2026-06-03). Integration anchors from three
read-only research sweeps over `battle.html`. This is a **living draft** — the
implementing agent should update these docs as reality diverges, and is expected
to re-resolve every anchor with `find-anchor` rather than trust the line numbers.
