---
severity: P1
category: inconsistency
anchor_symbol: catchMode
current_line_hint: ~44680
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 4592b2ea36ea
confidence: high
status: open
---

**Title**: Ball inventory + `catchMode` flag in STORY_FEATURES_INTEGRATION §1/§2/§5 do not match shipped code

**Evidence**:
```js
// SPEC (docs/STORY_FEATURES_INTEGRATION.md §1):
//   Inventory: sm.inventory.pokeball / greatBall / ultraBall / masterBall
//   Sold at Poke Mart only when `catchMode` is on
// CODE (battle.html ~44680, ball render loop):
ballRows = ['poke','great','ultra','master'].map(k => {
    const have = (sm.balls && (sm.balls[k] | 0)) || 0;   // sm.balls.poke, NOT sm.inventory.pokeball
    ...onclick="window.StoryMode.catchThrow('${k}')"
// grep 'catchMode' battle.html -> 0 hits; catching is gated by STORY_BATTLE_INTERRUPTS + _shouldFireWildBeforeBattle, not a setting.
```

**Repro**: `grep -nE "sm\.inventory\.(pokeball|greatBall)|catchMode" battle.html` → 0 hits. Catch UI is live (`#screen-story-catch`, `catchThrow`), balls live at `sm.balls.{poke,great,ultra,master}`. STORY_MODE_AUDIT already noted "catchMode undefined / mart forgets balls"; this finding pins the *exact field-path drift* still present in the canonical integration spec.

**Blast radius**: Anyone implementing the spec'd Mart ball-rows (§1), the PC auto-deposit gate (§2 keys on `catchMode || sm.pcBox.length>0`), or the `eventsOn off / catch still works if catchMode on` rule (§8) will code against fields that don't exist. The shipped design uses a different model (interrupt-driven wilds, `sm.balls`), so the integration spec mis-describes its own foundation.

**Fix sketch**: Update STORY_FEATURES_INTEGRATION §1/§2/§5/§8 to reference `sm.balls.{poke,great,ultra,master}` and the actual gate (`STORY_BATTLE_INTERRUPTS` / wild-route interrupt + `classicMode` for gimmick-restriction), or rename a real toggle to `catchMode` if one is intended. Read-only audit — do not edit the spec here; file is the doc-owner's call.

**Verification**: After reconciliation, `grep -nE "sm\.balls|STORY_BATTLE_INTERRUPTS" battle.html` matches the field names quoted in §1/§2; `catchMode` either exists in code or is struck from the spec.

---
severity: P2
category: inconsistency
anchor_symbol: SAFARI_ENTRY_COST
current_line_hint: ~43148
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 43572c0f06d7
confidence: high
status: open
---

**Title**: Safari unlock spec'd "after badge 3 OR City3" but code (and REDESIGN) fix it firmly at City4

**Evidence**:
```js
// SPEC (STORY_FEATURES_INTEGRATION §4): "From run itinerary ... e.g. after badge 3 or City3 segment"
// CODE (battle.html ~43148):
//   "// v19 stage-gated Safari curve. Safari unlocks at City 4 (badges 3),"
// STORY_EVENTS_RAW row 22 = City4 actions include 'Safari Zone'; no City3 row offers it.
```

**Repro**: `grep -niE "safari" battle.html | grep -iE "City 4|badges 3"` shows the City4 anchor; no City3 Safari action exists in STORY_EVENTS_RAW. The shipped spec's "or City3 segment" alternative is contradicted by code.

**Blast radius**: Small — single ambiguous clause. But it is the kind of "decision never made" wording (cf. §7 Trader "idx 26 OR 29") that misleads a reader about where the gate lives. REDESIGN_PLAN §2 correctly states C4; the *shipped* spec is the stale one.

**Fix sketch**: Strike "or City3 segment" from STORY_FEATURES_INTEGRATION §4; state City4 / 3-badge debut to match code and REDESIGN. (Doc owner's edit — read-only audit.)

**Verification**: §4 reads a single unambiguous trigger matching STORY_EVENTS_RAW row 22.

---
severity: P2
category: dx
anchor_symbol: DESIGN_CONSISTENCY_CHECKLIST.md
current_line_hint: n/a
file: docs/design-audit/DESIGN_CONSISTENCY_CHECKLIST.md
agents: [spec-drift-auditor]
fingerprint: d4d3b918cb44
confidence: high
status: open
---

**Title**: Design checklist's load-bearing "CSS block = battle.html lines 16-4156" guardrail is wrong by ~3700 lines

**Evidence**:
```
DESIGN_CONSISTENCY_CHECKLIST.md (guardrail #1, repeated in Steps 1, 13):
  "Inside the <style> ... </style> block in battle.html (lines 16-4156)."
ACTUAL: grep -nE "<style|</style>" battle.html
  16:   <style>
  7831: </style>
```

**Repro**: `grep -nE "<style|</style>" battle.html` → CSS spans 16-7831, not 16-4156. The checklist is the operating manual for a 20-step CSS-only agent worktree; it cites 16-4156 as the hard "allowed edits" boundary in the global guardrails AND in Step 1 (token inventory) and Step 13 (overflow audit) scopes.

**Blast radius**: A delegated agent obeying the guardrail literally would (a) treat valid CSS in lines 4157-7831 as forbidden/out-of-scope, leaving ~half the stylesheet unaudited, or (b) mistake 4157+ for JS and refuse edits there. Either silently defeats the checklist's purpose. This is a NEW drift (checklist not in prior spec-drift audit).

**Fix sketch**: Update the three "16-4156" occurrences to "16-7831" (or to a symbol-anchored phrasing: "the single `<style> ... </style>` block"). Doc owner's edit — read-only audit.

**Verification**: `grep -n "4156" docs/design-audit/DESIGN_CONSISTENCY_CHECKLIST.md` → 0 hits; range matches `grep -nE "</style>" battle.html`.

---
severity: P3
category: dx
anchor_symbol: STORY_MODE_CATCH_INTEGRATION_RISK.md
current_line_hint: n/a
file: docs/STORY_MODE_CATCH_INTEGRATION_RISK.md
agents: [spec-drift-auditor]
fingerprint: 29bf2f08d270
confidence: high
status: open
---

**Title**: Doc `battle.html:LINE` anchors still stale (50 refs, 18 drifted) despite PR #140 "fix"

**Evidence**:
```
Fresh node scripts/debug/spec-drift.mjs: 18/50 battle.html:LINE refs drifted.
Representative (claimed -> actual symbol location):
  STORY_MODE_FLOW.md:53        STORY_EVENTS_RAW     21273 -> 29008
  STORY_MODE_FLOW.md:123       getMonGrade          28560 -> 13809
  CATCH_INTEGRATION_RISK.md:47 _rivalScoreAttackTypeVsParty 22706 -> 33118
  NARRATIVE_VARIANTS.md:612    STORY_BEATS          30566 -> 35521
  NARRATIVE_VARIANTS.md:618    MYSTERY_FIGURE_IDENTITIES 26426 -> 29759
ref counts today: STORY_MODE_FLOW=10, CATCH_INTEGRATION_RISK=30, NARRATIVE_VARIANTS=10
```

**Repro**: `node scripts/debug/spec-drift.mjs && sed -n '1,90p' tests/reports/spec-drift.md`. Prior findings (2026-05-22) were marked `fixed-claude/sharp-keller-eZEDN`; `git log` shows PR #140 merged, yet 50 `battle.html:LINE` refs remain and battle.html has since grown to 54,266 lines, so they have re-drifted.

**Blast radius**: Readers following line jumps land in unrelated code (avg drift ~5-8k lines). CATCH_INTEGRATION_RISK.md (30 refs) is the densest offender — a "risk" doc meant to be read on every catch-pipeline change. Symbol *names* still resolve; only the line numbers mislead.

**Fix sketch**: Adopt the prior fix-sketch's own recommendation that was never applied: replace every `battle.html:LINE` with a symbol-only annotation (`` `SYMBOL` `` + "resolve via find-anchor"), and add the "never embed line numbers in design docs" rule to STORY_MODE_DESIGN_DECISIONS so it stops recurring. One clustered sweep, not 18 edits.

**Verification**: `grep -coE 'battle\.html:[0-9]+' STORY_MODE_FLOW.md docs/STORY_MODE_CATCH_INTEGRATION_RISK.md docs/STORY_NARRATIVE_VARIANTS.md` → 0; `node scripts/debug/spec-drift.mjs` reports 0 drift.

---
severity: P3
category: dx
anchor_symbol: README.md
current_line_hint: n/a
file: README.md
agents: [spec-drift-auditor]
fingerprint: 1f3b34879073
confidence: high
status: open
---

**Title**: README calls shipped catch / PC / Underground / Safari / boss-arc systems "upcoming"

**Evidence**:
```
README.md:44
  "See STORY_MODE_FLOW.md for the working spec of the upcoming
   catch / PC / Underground / Safari / boss-arc systems."
Reality (all shipped & reachable):
  catch  -> #screen-story-catch + StoryMode.catchThrow   Safari -> 236 hits, City4
  PC     -> sm.pcBox (44 hits), story-pc-tab-storage-btn  Underground -> story-pc-tab-underground-btn (sells mons for gold)
  boss-arc -> _bossArcRollLegendary (Caged God, 15 hits)
```

**Repro**: `grep -cniE "safari|pcBox|underground|_bossArcRollLegendary" battle.html` confirms each system is live in the UI. README still frames them as future work.

**Blast radius**: Low — README is a dev/testing doc, not user-facing feature copy. But it is the entry point the repo points new contributors to (and links STORY_MODE_FLOW.md as the "working spec of upcoming" systems), so it understates what is actually shipped. Required-check #6 (README claims reachable): all named systems ARE reachable; the staleness is the "upcoming" framing, not an unreachable claim.

**Fix sketch**: Reword README line 44 to "the shipped catch / PC / Underground / Safari / boss-arc systems" (or split shipped vs. still-deferred: Black Market / wager / trader / itinerary remain unshipped per the deferred ledger items). Doc owner's edit.

**Verification**: README no longer labels live systems "upcoming".

