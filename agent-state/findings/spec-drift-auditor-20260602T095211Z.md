---
severity: P2
category: inconsistency
anchor_symbol: STORY_ACHIEVEMENTS
current_line_hint: ~34815
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 84f5dd4f7ed4
confidence: high
status: open
---

**Title**: Caged God achievements (caged_god, r_caged_god) are permanently unearnable after v24 arc cut

**Evidence**:
```js
// battle.html:34815 / 34845 — still listed & rendered in the achievement screen:
{ id: 'caged_god',   cat:'milestone', name:'The Caged God', desc:'Capture Subject Zero in the post-game boss arc.', icon:'🔮' },
{ id: 'r_caged_god', cat:'replay',    name:'Caged God',     desc:'Complete the Caged God post-game boss arc.', icon:'🔮' },
// battle.html:50982 — the ONLY grant, gated on bossMode (boss-arc catch path):
try { if (bossMode) { _storyAchievementUnlock('caged_god'); _storyAchievementUnlock('r_caged_god'); } } catch (e) {}
// battle.html:43157 / 49428 — sm.bossArc.available is ONLY ever set false; never true anywhere:
if (sm.bossArc) sm.bossArc.available = false;
```

**Repro**: `grep -nE 'bossArc\.available\s*=\s*true|available:\s*true' battle.html` returns nothing — the only writes are `= false` (43157) and the `{ available:false }` default (49428). Every `_bossArc*` render/lead/enter fn early-returns on `!sm.bossArc.available`. STORY_MODE_FLOW.md §9 (line 221) marks the Caged God arc "❌ REMOVED (v24)" with "no Caged God hunt"; `migrateStoryPreV24` (35113) strips `sm.bossArc`. So the bossMode grant path can never execute. Both achievements stay visible in the achievement list but are impossible to obtain.

**Blast radius**: Achievement completion %, "collect them all" framing, the entire dead `_bossArc*` subsystem (~49426-49600, `_bossArcRenderSection`/`_bossArcCheckCageUnlock`/`_bossArcRollLegendary`/`bossCollectLead`) and the `bossMode` catch branch (50396, 50965, 50984) are all unreachable. Note: stale ISSUE_LEDGER entries (006, 028, 029, 068, 076, 077, 102, 114, 119, 123) describe this arc as a LIVE-but-buggy feature — they are obsolete post-v24; the current drift is the ghost achievements + dead code left behind by the cut.

**Fix sketch**: Either remove the two `caged_god`/`r_caged_god` achievement rows (and the dead `_bossArc*` subsystem) to match the §9 cut, or hide them from the achievement UI as retired. Decision needs maintainer sign-off (CLAUDE.md lists the arc as removed, so removal aligns with intent).

**Verification**: After removal, achievement screen total no longer counts two unobtainable entries; `grep -nE "caged_god|_bossArc" battle.html` returns only history/migration references.

---
severity: P3
category: dx
anchor_symbol: spec-drift-doc-anchors
current_line_hint: ~52
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 871a9024fe0b
confidence: high
status: open
---

**Title**: Doc battle.html:LINE anchors are stale (23/43 drifted across the spec docs)

**Evidence**:
```
STORY_MODE_FLOW.md:52       STORY_EVENTS_RAW   claims :21273  → now @30631
STORY_MODE_FLOW.md:588      makeWildBuild      claims :34883  → now @50253
docs/STORY_NARRATIVE_VARIANTS.md:612  STORY_BEATS         :30566  → now @39582
docs/STORY_NARRATIVE_VARIANTS.md:619  _showIntroRivalColdOpen :33069 → now @47259
docs/PROGRESSION_CURVE_MASTER.md:143  STORY_BUILD_TIER    :33298  → now @36884
docs/PROGRESSION_CURVE_MASTER.md:213  FACILITY_DEBUT_CITY :29085  → now @30708
```

**Repro**: `node scripts/debug/spec-drift.mjs` → tests/reports/spec-drift.md. 23 of 43 `battle.html:LINE` references no longer point at the symbol they name. The named SYMBOLS all still exist (resolve via find-anchor) — only the hard-coded line numbers drifted as battle.html grew. Representative sample above; not P1 because no feature is missing.

**Blast radius**: Doc-only. Any reader (or agent) who trusts the inline line numbers lands in the wrong region. Low risk because every doc already carries the symbol name alongside the number, and find-anchor resolves them.

**Fix sketch**: Drop hard-coded line numbers from the docs (keep symbol names only), or add a doc-lint step that rewrites `symbol (battle.html:N)` from the symbol index. Read-only for this auditor — flagging, not editing.

**Verification**: Re-run `node scripts/debug/spec-drift.mjs`; drifted count drops to 0 (or the numbers are removed entirely).

