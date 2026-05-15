# FINDINGS

Each finding follows the template in the lead-agent brief.

---

## [GDC][DSC] FINDING-001

**Status**: OPEN
**Severity**: MAJOR
**Location**: `/home/user/battle/STORY_MODE_FLOW.md` (file is 0 bytes)
**Issue**: The canonical story-flow document referenced by `README.md` and `docs/STORY_FEATURES_INTEGRATION.md` is an empty file. Anyone (player, contributor, or this audit) trying to understand the intended Story Mode sequence has no source of truth except reading 28k lines of `battle.html` and decoding `STORY_EVENTS_RAW`.
**Evidence**: `wc -l STORY_MODE_FLOW.md` → 0. `docs/STORY_FEATURES_INTEGRATION.md` opens with: *"This doc ties new systems to the existing timeline in `STORY_MODE_FLOW.md`..."* — but that timeline doc is empty.
**Proposed fix**: Generate `STORY_MODE_FLOW.md` from the story-map output (Phase 1 deliverable). Phase-1 STORY_MAP.md can be the authoring source and then committed as the human-readable version.
**Cross-axes**: ENG, CONS

---

## [ENG][REP][FAN] FINDING-003

**Status**: OPEN
**Severity**: MAJOR
**Location**: `battle.html:22527–22595` (TRAINER_QUOTES); spec at `docs/STORY_FEATURES_INTEGRATION.md`
**Issue**: Narrative layer is stubbed. Story Mode has zero true branches; all player choices are cosmetic. Dialogue is one-liner pre-battle barks indexed by trainer role — no scene text, no inter-battle beats, no villain-arc dialogue. Capacity gap vs. spec is ~2–3k lines per chapter arc.
**Evidence**: Story-mode discovery agent walked STORY_EVENTS_RAW + TRAINER_QUOTES; spec'd flags `blackMarketUnlocked`, `itineraryProgress`, `wagerPending`, `safariZoneType` are absent from save template at `battle.html:22953–22968`.
**Proposed fix**: Authoring task — write itinerary-beat scenes, villain arcs, NPC barks. Code task — add an `itinerary` data table + a scene runner. Defer authoring to a content pass after structural Phase-2 audits complete; track in BACKLOG as P1 once mechanics are green.
**Cross-axes**: DLG, MYS, ENG, CONS

---

## [GDC][DSC] FINDING-004

**Status**: OPEN
**Severity**: MINOR
**Location**: spec `docs/STORY_FEATURES_INTEGRATION.md` vs. `battle.html` save template `:22953–22968`
**Issue**: Spec describes features (Black Market, PC Box, Safari Zone, Wager battles, Pokémon Trader) gated by save flags that the save template does not declare. If they ever flip to implemented, partial-rollouts risk inconsistent state across saves.
**Evidence**: Missing keys: `blackMarketUnlocked`, `pcBox`, `traderOfferByCity`, `safariZoneType`, `wagerPending`, `itineraryProgress`.
**Proposed fix**: Either (a) document these as "planned, not in save" in a NEW `docs/STORY_FEATURES_INTEGRATION.md` status table, or (b) add the keys defaulted (false/[]) now so migration is a no-op when the features ship. Recommend (b).
**Cross-axes**: CONS, EOP

---

## [CODE][TEST] FINDING-002

**Status**: OPEN
**Severity**: MAJOR
**Location**: `/home/user/battle/package.json`
**Issue**: No test framework configured. `package.json` defines only `start`, `sync-showdown-data`, `mirror-category-icons` scripts — no `test`. Audit framework demands "every move/ability/item exercised" + "damage validator vs reference" + "every toggle has positive AND negative test." None of those are presently runnable.
**Evidence**: `cat package.json` shows three scripts, none test-related.
**Proposed fix**: Add a lightweight test runner (recommend `vitest` since the rest of the stack is plain JS). Create `test/` with a harness that can load `battle.html`'s pure-JS modules (extracted as needed) or runs scripted-browser cases via Playwright for the engine. Start with damage-calc + toggle-enforcement tests since those have the highest defect-per-LOC.
**Cross-axes**: BAL, DMG, TOG, MOV, ABI, ITM

---
