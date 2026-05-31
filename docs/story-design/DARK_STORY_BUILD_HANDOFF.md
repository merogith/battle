# Dark 3-Track Story — Build Hand-off Pack

> **Status:** design FROZEN, build NOT started. This pack hands a fully-specced feature to a fresh
> build session. Produced by the *general* session (design interview, 2026-05-31). No game-behavior
> shipped from the planning session.

## 0. What this is

A single-player **3-track Story** layer for `battle.html`: every run = the **main spine** + one rolled
**villain arc** (canon team, retold dark/satiric) + one rolled **extra arc** (creepypasta victim, satirical
deconstruction), culminating in **The First** reveal (future-you, looping to outrun an unseen apocalypse).
The rosters, MF reveal, and reward grants are **partly scaffolded already**; this pack closes the gap.

## 1. Read first (canon — do not re-derive)

| Doc | Role |
|---|---|
| `docs/story-design/SENIOR_DESIGN_REVIEW.md` **Part IV** | **The design canon.** Every locked decision, with rationale + code anchors. |
| `design/MASTER_11_dark_story_decisions.csv` | The same locks as workbook data (quick-scan table). |
| `design/MASTER_12_dark_story_build.csv` | **The task tracker** — phased, dependency-ordered, owner + sign-off per task. Drive the build from here. |
| `docs/story-design/STORY_3TRACK_IMPL_PLAN.md` | Prior PR-1..PR-7 breakdown (boss configs, MF dispatcher, anomaly seeds). Still largely valid; reconcile PR-5/PR-7 as you ship. |
| `CLAUDE.md` | Scope + lineage rules + the sloppy-mode hazard. Non-negotiable. |

## 2. Hard rules (from CLAUDE.md — enforced)

1. **No game-behavior change ships without explicit maintainer sign-off.** Every `SignOff=Y` task in
   MASTER_12 stops at a proposed diff until approved. This covers: damage/status/AI/ball/type/RNG,
   balance numbers, any move/ability, **and new mechanics** (the EXP-Share gift, boss gimmicks).
2. **Lineage boundaries.** `general` does NOT modify story timeline / save schema (**pasteur**) or
   difficulty curve / IV tiers / stat multipliers / gift magnitude (**maxwell**) without written
   hand-off. MASTER_12 marks the owner per task — route accordingly.
3. **Sloppy-mode hazard.** `battle.html` has no `'use strict'`. Never `X = fetched` into a module-level
   placeholder; declare the `let`/`const` and mutate via `Object.assign` / `push`. See CLAUDE.md.
4. **Seeded RNG everywhere user-visible** (`storyRngNext`), never bare `Math.random()`.
5. **Data-driven** dialogue/pools/strings → `data/`; mechanics/curves stay in code (pasteur/maxwell).
6. **Every change leaves a deterministic jsdom test** (`tests/helpers/load-engine.js`).
7. **Attach beats by KEY, never by array index** (INTERRUPTS bus). Index coupling is the bug class
   we are retiring.

## 3. Current-state delta (shipped vs to-build)

| Area | Shipped today | Gap |
|---|---|---|
| Track rosters | `VILLAIN_TRACKS` (10) + `EXTRA_TRACKS` (8) at `battle.html:30496` | content beats per track |
| Villain reward | Master Ball on `villain.*.boss` — `_storyGrantTrackEndReward` `battle.html:42105` | none (keep; this is the "salvaged villain tech") |
| Extra reward | **6-vitamin stand-in** at `battle.html:42112` | replace with the real **EXP-Share gift**, delivered by a grateful NPC |
| EXP-Share gift | dead init `expShareVoucher:0` (`battle.html:39126`) — ledger **ISSUE-243** | build the permBoost-based mechanic + Bag UI + SAVE_VER bump |
| MF identity | multi-identity dispatcher | collapse to `the_first` only (PR-6) |
| MF reveal/ending | specced, not wired | `main.mfReveal` → `main.ending` → post-game door |
| Loop seeds | none | PR-7 deniable anomaly seeds |
| Boss gimmicks | `BOSS_CONFIGS` data stub (`~42141`) | engine wiring (onTurnStart/onDamageTaken) |

## 4. Build sequence (vertical-slice-first)

Drive from `design/MASTER_12_dark_story_build.csv`. Phase summary:

- **Phase 0 — Baseline.** Harness green + perf baseline; plan SAVE_VER 23→24; inventory the delta. *(B00–B02)*
- **Phase 1 — Villain vertical slice (Rocket).** One arc end-to-end: 3 beats via INTERRUPTS, 5-part
  framing, chaining hooks, eligibility gate + spread pacing, 1 boss gimmick, Master Ball reward, dark
  loss line, **deterministic e2e test**. *This proves the entire pipeline before any scaling.* *(B10–B16)*
- **Phase 2 — Framework.** Extract the slot/registry resolver + generalize gate/hook plumbing so all 10
  villain ids ride one engine, attach-by-key. *(B20–B22)*
- **Phase 3 — EXP-Share gift.** The one genuinely new system: permBoost-based, 6 units, ≤3/mon,
  party+PC, refund over cap (reuse permBoost `~34777` + Fight-Club +stat `~44839`); wallet persistence +
  SAVE_VER migration; Bag modal; NPC-thank-you delivery hook (replaces the vitamin stand-in); close
  ISSUE-243. **maxwell owns magnitude; pasteur owns the save bump.** *(B30–B34)*
- **Phase 4 — Extra vertical slice (cubone).** Victim arc end-to-end: deconstructed Lavender/orphan
  lore, raid mechanic, **laid-to-rest (no catch)**, NPC-thank-you gift, e2e test. *(B40–B43)*
- **Phase 5 — Scale content.** Remaining 9 villain + 7 extra arcs against the two locked templates;
  curated flavor-vignette pool; per-arc voice/humor matched to canon source. *(B50–B53)*
- **Phase 6 — The First (PR-6).** Identity dispatcher → `the_first`; party + stronger-starter team;
  **hard-wall** battle tuning; reveal/ending scenes + post-game door. *(B60–B63)*
- **Phase 7 — Loop seeds (PR-7).** Deniable anomaly seeds (rows 7/14/30/49); autopilot per
  villain/extra; aggregate `tests/suites/story-3track/`. *(B70–B72)*
- **Phase 8 — Polish.** Perf, a11y (new Bag modal + scenes), doc/ledger reconciliation. *(B80–B82)*

**Definition of done (per task):** diff approved where `SignOff=Y`; the named test passes; no new
sloppy-mode globals; flow beats attach by key; user-visible RNG seeded.

## 5. The non-negotiable creative locks (digest)

Full detail + rationale in SDR Part IV / MASTER_11. The ones a build session most often gets wrong:

- **No tracker UI** — legibility lives entirely in the **chaining hooks**. Write them so "what's next &
  why" is obvious in-fiction.
- **Clean-then-gut-punch** main spine; the dark lives in the **extra** track and the **deniable** loop
  seeds — do not let dread bleed into the main surface.
- **Villain = canon-faithful retelling** (premise tracks canon, tone is ours), **per-arc voice**.
  **Extra = satirical deconstruction** of known lore, uniformly **bleak**.
- **Raids are victims** — fought to mourn, **laid to rest, never caught**. No loot drops off a victim;
  the EXP-Share comes from a **grateful NPC**.
- **Same pool reshuffled** — no Run#-gated content; only **The First**'s line is loop-aware.
- **Gift is bounded** (6 units, ≤3/mon) — a curated spike, NOT a return of level grind.
- **Always-on, no toggle.** **Apocalypse never shown.** **Professor gray, not evil.**

## 6. Copy-paste prompt for the build session

```
You are continuing the Pokemon Battle Arena project (battle.html). Your job: BUILD the dark 3-track
Story feature whose design is FROZEN.

Read, in order:
  1. CLAUDE.md  (scope, lineage rules, sloppy-mode hazard — non-negotiable)
  2. docs/story-design/SENIOR_DESIGN_REVIEW.md  Part IV  (design canon)
  3. docs/story-design/DARK_STORY_BUILD_HANDOFF.md  (this pack)
  4. design/MASTER_12_dark_story_build.csv  (your task tracker — drive from it)

Rules:
  - Work vertical-slice-first: complete Phase 1 (the Rocket arc, tasks B10-B16) end-to-end with a
    passing deterministic jsdom test BEFORE touching Phase 2+.
  - STOP at a proposed diff for every task marked SignOff=Y and get maintainer approval before merging.
  - Do NOT modify save schema / story timeline (pasteur) or difficulty curve / gift magnitude (maxwell)
    without a written hand-off — flag and pause instead.
  - Every change leaves a deterministic test (tests/helpers/load-engine.js). Attach beats by key, never
    by array index. Seed all user-visible RNG with storyRngNext.

Start by confirming the harness is green (B00), then propose the Phase-1 plan for approval.
```

## 7. Open items the build session must escalate (not decide)

- **Gift magnitude** (stats per unit) — maxwell + sign-off.
- **Boss-gimmick numbers** and which 3 archetypes — maxwell + sign-off.
- **SAVE_VER migration shape** for the new fields — pasteur.
- **Per-arc canon mapping** of the 4 satire targets — content sign-off as each arc lands.
