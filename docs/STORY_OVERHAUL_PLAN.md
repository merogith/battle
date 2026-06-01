# Story-Mode Overhaul — Investigation, Canonical Decisions & Plan

> **North-star doc** for the story-flow + balance + design-merge overhaul.
> Branch: `claude/story-flow-balance-overhaul` (off PR #212). Created 2026-06-01.
> Supersedes scattered design notes for the areas it covers — see §1 for the canon verdict.

## 0. Status

- **Deep investigation launched** (5 specialist auditors). An Anthropic **usage cap** (resets ~22:30 UTC) interrupted the run: only **spec-drift** and **consistency** returned partial findings (captured in `agent-state/findings/*-2026060 1T2140*.md`). The **story-flow sequencing**, **data-integrity (pools/staging)**, and **balance/AI-curve** auditors produced nothing usable and **must be re-run after the reset**.
- **One critical fix already shipped to PR #212:** post-HoF **Crucible unreachable** regression (see §3).

## 1. ⭐ CANONICAL DECISION — which design is the source of truth

The repo carries **three mutually-incompatible narrative designs**. Verdict (from spec-drift P1, high confidence):

| Design | Status | Where |
|---|---|---|
| **3-track Main/Villain/Extra + classic spine** | ✅ **CANON (live)** | `STORY_3TRACK_IMPL_PLAN.md`; code: `sm.tracks`, `MAIN/VILLAIN/EXTRA_STORY_BEATS`, `STORY_SCENES`, `the_first`, `_tryFireRoadStoryBeats` |
| 8-variant `STORYLINE_VARIANTS` + 7 Mystery identities + Caged God | ❌ **CUT** | `STORY_NARRATIVE_VARIANTS.md` (still self-labels "canonical"!), `STORY_MODE_FLOW §17/§14d` |
| The decision record (which was cut, why) | 📋 **meta-doc** | `STORY_FLOW_AUDIT.md §6` ("Cut the 8-variant concept entirely") |

**Action:** promote the 3-track model to canon; SUPERSEDE-banner or delete `STORY_NARRATIVE_VARIANTS.md`; rewrite `STORY_MODE_FLOW §14d/§17` to describe `the_first` + 3-track; demote `STORY_3TRACK_IMPL_PLAN` from "plan" to "shipped status record".

## 2. Requirements (the overhaul target — maintainer's vision)

1. **One consistent story flow in every aspect** — sequencing, ordering, event types/styles, **notifications**, dialogue. Multiple untested systems from multiple sessions get unified + tested.
2. **Data-driven, modular, screen-by-screen** — each component (city, road, battle, encounter, beat, notification) easily updatable in isolation and easily understood by code agents (optimize / polish / add / remove / modify).
3. **Full sequencing**: starter city → road → city → … → League (E1–E4) → Champion → HoF → Mystery Figure → open-ended endgame loop (Crucible / Frontier / farm).
4. **3 variants** (main/villain/extra) with proper **enemy/trainer/event pools**. A villain-arc battle must launch the **themed villain trainer** (correct sprite + signature Pokémon); only if none fits, a random trainer from the appropriate pool.
5. **Balance staging**: enemy builds staged **city-by-city to match the player** — regular trainers slightly **below**, Elite Four **equal**, gym leaders slightly **above**. Every build component (grade ceiling, moveset, ability, item, nature, EV, IV) gated by what's unlocked/locked at that city.
6. **Kill the "screen says X but Y fires" desync** — preview/label vs actual dispatch; beat-type vs actual trainer (see §4).
7. **Merge all old/new/conflicting designs into one masterpiece** — code + data + file structure.

## 3. Conflict ledger (partial — expand after the auditor re-run)

### Critical / player-facing
- **[✅ FIXED in #212]** Crucible unreachable — city button gated on dead `sm.bossArc.available`; re-gated on `sm.postHofMysteryClimaxDone`.
- **Caged God excision is INCOMPLETE and player-facing** (consistency P1/P2/P2, spec-drift P2):
  - Live **help text** advertises the cut arc + "save the Master Ball" quest (`battle.html ~11337/11358/11360`).
  - **Two permanently-unobtainable achievements** `caged_god` / `r_caged_god` (only grant site is the dead `bossMode` branch ~50903).
  - **~250 lines of dead** `bossArc` code (`_bossArcRenderSection`, `bossEnterCage`, `bossCollectLead`, `bossAttack`, `bossRetreatToCity`, `_bossArcRollLegendary`, `_BOSS_LEAD_FLAVOR*`, `_CAGED_GOD_EPILOGUE_BY_VARIANT`, `_SUBJECT_ZERO_EPILOGUE_BY_VARIANT`).
  - **Variant Champion / post-HoF dialogue** routes the player to the dead broker + cage (`~32848/33000/39758/41625`).
  - **~35 `bossMode` refs woven into the live catch screen** (50317–51011) — the deferred excision from PR #212.

### Balance-staging conflicts (the maintainer's balance concern)
- **`FACILITY_DEBUT_CITY` disagrees 3 ways** — code `{safari:5,dept:4,evtrainer:7,dojo:1}` vs both balance docs vs in-code comments. Gates facility debut + the voucher schedule, so the reward-alignment analysis is miscalibrated. *(balance numbers — maintainer-owned)*
- **Early-game softening model mismatch** — code is a per-**city** table `FOE_STAT_NERF_BY_CITY=[0.80,0.85,0.90]`; both docs describe per-**event** constants (`PRE_GYM1_FOE_STAT_MULT`, …) that **don't exist**.
- **Mystery Figure HP boost** = `1.35` (code) vs `1.50` (both docs).
- **Dead `STORY_IV_TIER_RANGES`** superseded by `STORY_IV_TIER_CENTER` (tuning footgun — two IV tables, one live).
- **`_storyBuildTierForEvent`** has redundant tier branches (dead duplicate conditions — half-applied curve edit).

### Doc drift
- `STORY_3TRACK_IMPL_PLAN` reads as forward-plan but is mostly **shipped** (only PR-1 ✓). One piece genuinely unshipped: `applyExpShareVoucher` (PR-5).
- `WANDER_AROUND_SPEC` says "not implemented" but **shipped** (v23/24).
- `STORY_MODE_FLOW §14d` describes the 7-identity Mystery + Caged God repurpose; code has only `the_first`.
- 23/43 doc `battle.html:LINE` anchors drifted (symbol names still resolve).

## 4. Target architecture (recommendation — the "single consistent flow")

- **ONE canonical event model.** Every "thing that happens" (city stop, road encounter, battle, beat, notification) is a uniform declarative entry: `{ id, type, style, road/city anchor, track, trainer/encounter ref, requires }`. **ONE dispatcher** resolves them in order — no dual paths.
- **Preview computed from the SAME model the dispatcher runs.** This structurally eliminates the "screen says *wild rival* but it's wild→event→rival→event-fight" desync — the up-next label and the actual next event come from one source.
- **Beat→trainer mapping is deterministic & themed.** A `villain`/`boss`/`raid` beat resolves to the arc's themed trainer (sprite + signature) by data, with random-from-pool only as an explicit fallback — never an accidental generic trainer.
- **ONE city-by-city build-staging config** (single source of truth): grade ceiling / EV total / IV center / ability / nature / item / move opt-chance per city, consumed by ONE staging function. Delete the duplicate/conflicting tables (dead IV-range table, phantom foe-mult constants).
- **ONE notification / event-style registry** — each event type → its screen presentation (label, icon, tone, transition). Consistent everywhere.
- **File structure:** lift the data-heavy pools (trainers, beats, dialogue, staging tables, notification styles) into `data/*.json` where they're pure data (per CLAUDE.md's data-driven preference); keep mechanics/curves in code. Goal: a code agent can add/remove/modify a city, road, beat, or trainer by editing **one data entry**, with a deterministic test guarding it.

## 5. Roadmap (rest of the project)

- **Phase A — Re-run the deep investigation** (after the usage reset): story-flow sequencing map, data-integrity (pools/staging), balance/AI curve, plus the focused **preview-vs-dispatch + beat-vs-trainer desync** pass. Expand §3.
- **Phase B — Finish the Caged God excision** (the deferred #212 follow-up): scrub help text, variant dialogue, the 2 achievements, the ~250 lines of dead `bossArc` code + `_CAGED_GOD_*`/`_SUBJECT_ZERO_*` pools, and the ~35 catch-screen `bossMode` refs. *(player-facing → high priority)*
- **Phase C — Canonicalize the docs**: promote 3-track, supersede 8-variant, fix `STORY_MODE_FLOW §14d/§17`, re-stamp `WANDER`/`3TRACK` status, refresh anchors.
- **Phase D — Resolve balance-staging conflicts** *(maintainer-owned numbers)*: `FACILITY_DEBUT_CITY`, foe-softening model, Mystery HP, dead IV table, tier branches → build the ONE staging source-of-truth (§4).
- **Phase E — Unify sequencing/pacing/desync**: the single event model + dispatcher + preview; fix beat→trainer mapping; smooth pacing (clumping/gaps).
- **Phase F — Data-driven refactor**: extract pools to `data/`, modularize, leave deterministic tests.

Each phase: behavior changes get a proposed diff + maintainer sign-off + regression tests; full suite green at every gate.

## 6. Open decisions for the maintainer (balance — user-owned)

1. `FACILITY_DEBUT_CITY` canonical schedule (which city each facility debuts).
2. Foe-softening model — keep the per-city `FOE_STAT_NERF_BY_CITY` table, or the per-event constants the docs describe?
3. Mystery Figure HP multiplier — `1.35` or `1.50`?
4. The exact "regular &lt; player &lt; gym, Elite = player" target power ratios per city (the §2.5 staging targets).
