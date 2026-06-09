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
| 2 | **Pokémon bonding** — 6 paths (+ temperament + titles), each masters into a small per-stat buff | [`BONDING_RELATIONSHIPS.md`](./BONDING_RELATIONSHIPS.md) | `buildPokemon` stat hook; save slot shape |
| 3 | **Bonding micro-games** — 6 actions × 3 random WarioWare-style micro-games (18) feed the 6 paths | [`CAMP_MINIGAMES.md`](./CAMP_MINIGAMES.md) | scene engine + casino minigame pattern |
| 4 | **Camp hub utility** — party sorting + return-to-previous-city | [`CAMP_FLOW.md`](./CAMP_FLOW.md) §4–6 | party UI; `lastStoryCityEventIndexAtOrBefore` |
| 5 | **Event cinematics** — richer animation/visual beats per event type | [`EVENT_CINEMATICS.md`](./EVENT_CINEMATICS.md) | `_renderNarrativeOverlay` / `_storyScene` |

Build order and dependencies are in [`IMPLEMENTATION_ROADMAP.md`](./IMPLEMENTATION_ROADMAP.md).

---

## 3. The bonding system in one breath

Six ways to relate to each Pokémon — **2 kind, 2 cruel, 1 weird, 1 romance** —
each built up by a **camp action** that rolls **one of 3 quick WarioWare-style
micro-games** (18 in all), playable on any party member, **unlimited per visit**. Because there are exactly **6 battle stats** and
**6 paths**, each path **masters into +5% of one stat** (small — ≈ one foe-curve
step). It takes **~10 successful actions** to master a stat, shifted **± by the
Pokémon's Temperament** (its Nature makes some paths easy, others a grind). Your
bond *shape* earns each Pokémon a **Title**, shown with a 6-spoke **bond
hexagon**. Full design in [`BONDING_RELATIONSHIPS.md`](./BONDING_RELATIONSHIPS.md).

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

## 5. Decisions — RESOLVED (maintainer review 2026-06-03)

These are locked; what remains are data-side tuning knobs (bottom row).

| ID | Decision | Resolution |
|----|----------|------------|
| D1 | Maxed buff magnitude | **+5%/path**, stays small (≈ one `FOE_POWER_CURVE` step) |
| D2 | Stat ↔ path mapping | **clean 6-stat bijection** (BONDING §2) |
| D2b | Creative depth | **all three layers** — Temperament + Titles + Bond-hexagon |
| D3 | Bond decay | **off** (reward, not chore) |
| D4 | Buff timing | **binary at-master** |
| D5 | Actions per camp | **unlimited** (the grind is total reps, not a per-visit cap) |
| D5b | Reps to master a stat | **flat 5 actions** per path, all natures (temperament neutralized to 1.0) |
| D6 | Camp cadence | **forced + 1-tap "Break camp"** skip |
| D7 | Return-to-city | **free round-trip** via a return-point stash |
| D8 | Which transitions | **all non-city→city** route transitions |
| D9 | Cinematics v1 | sighting fold (POC) + camp arrival + mastery/title reveals |
| D10 | Cruel/romance tone | **edgier** — maintainer signs off on the actual copy |

**Remaining tuning knobs (data, [MAINTAINER]):** `BASE_ACTIONS` (5) ·
temperament multipliers + source (currently flat 1.0; Nature-driven variance is
re-enableable) · title copy/rules · per-game difficulty · an aggregate buff cap
*if* +5%×6 proves too strong on the curve.
See each doc's Decisions section.

---

## 6. Glossary

- **Camp** — the recurring between-events hub/buffer screen.
- **Path** — one of 6 relationship tracks per Pokémon (Praise, Nurture,
  Discipline, Intimidate, Mimicry, Devotion).
- **Bond counter** — a path's action count on a Pokémon (`slot.bonds[path]`);
  masters at its threshold.
- **Master** — a path reaching its threshold; its +5% stat buff turns on.
- **Temperament** — a Pokémon's Nature-driven like/resist that *would* shift a
  path's threshold; **currently neutralized** (all 1.0 → flat 5 reps per path).
- **Title** — a cosmetic name from your bond *shape* (e.g. "the Hardened").
- **Transition** — the seam between event N and event N+1, keyed by `eventIndex`.
- **Interpose** — inserting camp into the flow without adding a timeline row.
- **`sm`** — the Story-mode save object (`pbs_story_save` in localStorage).

---

## 7. Provenance

Design from the maintainer's brief (2026-06-03). Integration anchors from three
read-only research sweeps over `battle.html`. This is a **living draft** — the
implementing agent should update these docs as reality diverges, and is expected
to re-resolve every anchor with `find-anchor` rather than trust the line numbers.
