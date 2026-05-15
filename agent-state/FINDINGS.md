# FINDINGS

Each finding follows the template in the lead-agent brief.

---

## [GDC][DSC] FINDING-001
**Status**: OPEN · **Severity**: MAJOR
**Location**: `/home/user/battle/STORY_MODE_FLOW.md` (0 bytes)
**Issue**: Canonical story-flow document is an empty file despite being referenced as authoritative by `README.md` and `docs/STORY_FEATURES_INTEGRATION.md`.
**Evidence**: `wc -l STORY_MODE_FLOW.md` → 0.
**Proposed fix**: Generate from `agent-state/STORY_MAP.md` content and commit.
**Cross-axes**: ENG, CONS

---

## [CODE][TEST] FINDING-002
**Status**: OPEN · **Severity**: MAJOR
**Location**: `/home/user/battle/package.json`
**Issue**: No test framework configured. DoD requires positive+negative test for every toggle + damage validator + coverage suite. None are runnable.
**Evidence**: package.json scripts: `start`, `sync-showdown-data`, `mirror-category-icons`.
**Proposed fix**: Add vitest + a battle-engine harness. Start with damage-calc and clause-enforcement tests.
**Cross-axes**: BAL, DMG, TOG, MOV, ABI, ITM

---

## [ENG][REP][FAN][DLG] FINDING-003
**Status**: OPEN · **Severity**: MAJOR
**Location**: `battle.html:22527–22595` (TRAINER_QUOTES); spec at `docs/STORY_FEATURES_INTEGRATION.md`
**Issue**: Narrative layer stubbed — zero true branches, all choices cosmetic, dialogue is one-liner pre-battle barks indexed by trainer role.
**Evidence**: STORY_MAP audit; spec'd flags `blackMarketUnlocked` etc. absent from save template (battle.html:22953–22968).
**Proposed fix**: Authoring + a scene-runner over an `itinerary` data table.
**Cross-axes**: DLG, MYS, ENG, CONS

---

## [CONS][EOP] FINDING-004
**Status**: OPEN · **Severity**: MINOR
**Location**: spec vs `battle.html:22953–22968`
**Issue**: Spec describes save flags (`blackMarketUnlocked`, `pcBox`, `traderOfferByCity`, `safariZoneType`, `wagerPending`, `itineraryProgress`) that don't exist in the save template — partial-rollout risk.
**Proposed fix**: Pre-add keys defaulted to false/[] so migration is a no-op when features ship.

---

## [VGC][TOG] FINDING-005
**Status**: OPEN · **Severity**: BLOCKER (for VGC compliance only)
**Location**: `battle.html` — entire file
**Issue**: **Sleep Clause is not implemented or enforced anywhere.** Grep for `sleep.{0,3}clause` returns zero hits. VGC requires only one opposing mon may be asleep at a time.
**Evidence**: `grep -i -E "sleep.{0,3}clause|sleepClause" battle.html` → empty.
**Proposed fix**: Add a clause-enforcement layer at move-resolution time. When a sleep move is about to apply `SLP` to an opponent and that side already has any non-fainted mon with `SLP`, fail the move (Showdown behavior: "It can't be used the way it was!"). Toggle: ON by default, exposed in settings.
**Cross-axes**: STA, CMP

---

## [VGC] FINDING-006
**Status**: OPEN · **Severity**: MAJOR
**Location**: `battle.html:9878`
**Issue**: Species Clause is implemented as `new Set(eligible)` — string-dedup by species name. Forme handling (e.g., `Charizard` vs `Charizard-Mega-X`, or two `Urshifu` formes) is ambiguous. Showdown's official Species Clause uses `num` (national-dex number) to dedup across formes.
**Proposed fix**: Dedup by Pokédex `num` via `getPssDex().species.get(name).num` instead of by string name. Add a unit test once Finding-002 is resolved.
**Cross-axes**: SPC, TOG

---

## [VGC][TOG] FINDING-007
**Status**: OPEN · **Severity**: MAJOR
**Location**: `battle.html:9731`, applied @ 9888–9889 and 21556
**Issue**: Item Clause has no user-facing on/off; it's always-on, with no toggle exposed in settings. Spec calls for "every toggle has positive AND negative test." If Item Clause is intentionally non-togglable, document that decision.
**Proposed fix**: Either (a) add a toggle, OR (b) document non-togglability in COMPLIANCE.md as an intentional simplification.
**Cross-axes**: ITM

---

## [STA][VGC] FINDING-008
**Status**: OPEN · **Severity**: MAJOR
**Location**: `battle.html:15987–16014`
**Issue**: OHKO moves (Fissure, Horn Drill, Guillotine, Sheer Cold) are implemented but not banned by clause. Showdown's official OHKO Clause bans them. No Evasion Clause (Double Team / Minimize), no Endless Battle Clause (Recycle+Leppa), no Moody Clause either.
**Proposed fix**: Add OHKO/Evasion/Endless/Moody clauses behind togglable flags, default ON for VGC mode, OFF for free-play.
**Cross-axes**: VGC, MOV

---

## [EVL][TOG] FINDING-009 — RESOLVED ON STATIC CHECK
**Status**: RESOLVED-PENDING-RUNTIME-TEST · **Severity**: NICE-TO-HAVE
**Location**: `battle.html:8653–8689` (canonical-item display) and `:16161–16172` (damage calc)
**Issue**: Audit verified Eviolite Late-Evo rule is implemented as a live `@pkmn/dex` lookup (`sp.evos && sp.evos.length > 0`), not a build-metadata flag. `getPssDex()` returns the modern @pkmn/dex which has cross-gen evolution data. So a Chansey at gen-1 toggle still gets Eviolite (since Blissey exists in @pkmn/dex regardless of toggle).
**Evidence**: Both code paths share the same logic. No data-flow that filters `sp.evos` by current `enabledGens` was found.
**Proposed fix**: Once test framework lands (Finding-002), add the Phase-5 test matrix (Chansey gen-1, Scyther gen-1, Gligar gen-2, Tauros baseline, Blissey/Ditto baseline) to lock against regression.
**Cross-axes**: GEN, ITM

---

## [GEN] FINDING-010
**Status**: OPEN · **Severity**: MINOR
**Location**: `battle.html:5860` `getDraftPool`; `:22247` `pickStoryLegendaryFromGens`
**Issue**: Generation-toggle consumers identified, but a confirmation sweep is needed: search every `enabledGens`/`minGen`/`maxGen` read to verify none alters type chart, damage formula, status durations, ability descriptions, or learnsets. Currently 26+ matches found; a Phase-4 dedicated pass should walk each.
**Proposed fix**: Phase-4 deliverable. Note in COMPLIANCE.md when complete.
**Cross-axes**: TYP, DMG, STA, MOV, ABI, ITM

---

## [GRD][CONS] FINDING-011
**Status**: OPEN · **Severity**: MINOR
**Location**: `battle.html:8830–8881`
**Issue**: Grade definitions documented inconsistently between in-code comments and audit-agent summaries. Authoritative rules (from code):
- Legendary → G1; `PSEUDO_LEGEND` set → G1.
- stage0: bst≥350 → G3, else G4.
- stage1-mid → G3.
- stage1-final: bst≥500 → G2, else G3.
- stage2-final: bst≥570 → G1, else G2.
- basic-final: ≥570 → G1, ≥480 → G2, ≥380 → G3, else G4.
- Fallback (no dex stage info): ≥530 → G1, ≥480 → G2, ≥350 → G3, else G4.
**Proposed fix**: Add a comment block at `:8830` documenting the table; mirror in `STORY_MODE_FLOW.md` once that doc is written (Finding-001).
**Cross-axes**: GDC, GRD

---
