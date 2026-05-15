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

## [CODE][TEST] FINDING-002

**Status**: OPEN
**Severity**: MAJOR
**Location**: `/home/user/battle/package.json`
**Issue**: No test framework configured. `package.json` defines only `start`, `sync-showdown-data`, `mirror-category-icons` scripts — no `test`. Audit framework demands "every move/ability/item exercised" + "damage validator vs reference" + "every toggle has positive AND negative test." None of those are presently runnable.
**Evidence**: `cat package.json` shows three scripts, none test-related.
**Proposed fix**: Add a lightweight test runner (recommend `vitest` since the rest of the stack is plain JS). Create `test/` with a harness that can load `battle.html`'s pure-JS modules (extracted as needed) or runs scripted-browser cases via Playwright for the engine. Start with damage-calc + toggle-enforcement tests since those have the highest defect-per-LOC.
**Cross-axes**: BAL, DMG, TOG, MOV, ABI, ITM

---
