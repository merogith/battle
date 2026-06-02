---
severity: P1
category: inconsistency
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30583
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 2499e3087f11
confidence: high
status: open
---

**Title**: Three mutually-incompatible story-narrative designs coexist; no doc is the single canon

**Evidence**:
```text
STORY_MODE_FLOW.md:7  "It supersedes the project's earlier story-mode design notes where they conflict."
  → §17 describes the 8-variant STORYLINE_VARIANTS registry + 7 Mystery Figure identities + Caged God.
docs/STORY_NARRATIVE_VARIANTS.md:7  "canonical design for the 8-storyline system" (8 variants, buried_alive/cartridge_self).
docs/story-design/STORY_3TRACK_IMPL_PLAN.md  Main/Villain/Extra tracks, STORY_SCENES, "The First", deletes the 7 identities.
docs/story-design/STORY_FLOW_AUDIT.md:35-44  "two design eras running at the same time" — both fire in one run.
```

**Repro**: Read STORY_MODE_FLOW.md §17/§14d, docs/STORY_NARRATIVE_VARIANTS.md §1-§7, and docs/story-design/STORY_3TRACK_IMPL_PLAN.md PR-1..PR-7. Each presents a different narrative spine as authoritative. Then `grep -cF "sm.tracks" battle.html` (=21) and `grep -n the_first battle.html` — the 3-track + "The First" path is the one actually wired (`_tryFireRoadStoryBeats` called at battle.html ~42905).

**Blast radius**: This is the merge-overhaul's central blocker. Anyone reading STORY_MODE_FLOW.md as "canon" (its own claim + CLAUDE.md citing it) gets the 8-variant/7-identity/Caged-God model, which is NOT what runs. CANONICAL-vs-SUPERSEDED verdict for the merge: live engine = 3-track (STORY_3TRACK_IMPL_PLAN, mostly shipped) + classic spine; STORY_FLOW_AUDIT §6 records the maintainer decision "Cut the 8-variant concept entirely." STORY_NARRATIVE_VARIANTS.md is SUPERSEDED in full; STORY_MODE_FLOW.md §17/§14d is STALE on the narrative layer.

**Fix sketch**: Pick the 3-track + classic-spine model as canon (it is what ships). Rewrite STORY_MODE_FLOW.md §17/§14d to describe `MAIN/VILLAIN/EXTRA_STORY_BEATS` + `the_first`; demote docs/STORY_NARRATIVE_VARIANTS.md to a SUPERSEDED banner (or delete); fold STORY_3TRACK_IMPL_PLAN.md's shipped-vs-pending status into the canon doc.

**Verification**: One doc (STORY_MODE_FLOW.md) describes exactly the narrative engine that `grep`-resolves in battle.html (`sm.tracks`, `STORY_SCENES`, `the_first`); no surviving doc claims 8 selectable variants or 7 Mystery identities.

---
severity: P2
category: inconsistency
anchor_symbol: STORYLINE_VARIANTS
current_line_hint: ~40871
file: docs/STORY_NARRATIVE_VARIANTS.md
agents: [spec-drift-auditor]
fingerprint: e9e4c9139950
confidence: high
status: open
---

**Title**: STORY_NARRATIVE_VARIANTS.md presents a cut 8-variant design as "canonical" (future-prompt-rebuild trap)

**Evidence**:
```text
docs/STORY_NARRATIVE_VARIANTS.md:7  "This is the canonical design for the 8-storyline system layered over the existing 68-row story timeline"
:284  buried_alive (Lavender Frequency exclusive)   ← never added to code
:320  cartridge_self (STATIC exclusive)             ← never added to code
:78/105/129/...  Caged God per-variant epilogue    ← arc removed v24
```

**Repro**: STORY_FLOW_AUDIT.md §1a + §6 resolve the maintainer decision: "Cut the 8-variant concept entirely... delete the other 7 variants + their ~75 unreachable cold-opens." In code, the variant picker is gone, `sm.storyLine` is forced `'classic'` (battle.html:35258), and `MYSTERY_FIGURE_IDENTITIES` has only `the_first` — the two new identities this doc specifies were never built (`grep -c buried_alive battle.html` outside dead `_MYSTERY_OUTRO_BY_VARIANT` = data-only). Doc still reads as a live build plan with a phasing table (§12).

**Blast radius**: The doc is the exact "a future prompt rebuilds the cut design from this file" trap CLAUDE.md warns about. A maintainer or agent could re-implement the 8-variant picker + 2 pasta identities + Caged God epilogues straight from §1-§12, re-introducing the dead-code era STORY_FLOW_AUDIT just decided to delete.

**Fix sketch**: Add a top banner: "SUPERSEDED — the 8-variant system was cut (see STORY_FLOW_AUDIT §6); the live design is the 3-track Main/Villain/Extra model. Retained for prose salvage only." Or delete the doc and move salvageable prose into the 3-track scene tables.

**Verification**: The doc no longer claims "canonical"; any reader is routed to the 3-track canon before re-building anything.

---
severity: P2
category: inconsistency
anchor_symbol: VILLAIN_STORY_BEATS
current_line_hint: ~39700
file: docs/story-design/STORY_3TRACK_IMPL_PLAN.md
agents: [spec-drift-auditor]
fingerprint: da1f12f20b3b
confidence: high
status: open
---

**Title**: STORY_3TRACK_IMPL_PLAN reads as a forward plan but is mostly SHIPPED — only PR-1 marked done

**Evidence**:
```text
STORY_3TRACK_IMPL_PLAN.md:58  PR-1 ✓ ; PR-2..PR-7 unmarked (read as pending)
  but in battle.html: MAIN/VILLAIN/EXTRA_STORY_BEATS (5+5+5 hits), STORY_SCENES,
  BOSS_CONFIGS, ANOMALY_SEEDS, STORY_REWARD_TIERS, IntroQueue, the_first ALL present
  and _tryFireRoadStoryBeats is wired into enterBattleEvent (battle.html:~42905).
```

**Repro**: `for s in MAIN_STORY_BEATS VILLAIN_STORY_BEATS EXTRA_STORY_BEATS STORY_SCENES BOSS_CONFIGS ANOMALY_SEEDS IntroQueue; do grep -cF "$s" battle.html; done` — all non-zero. The dispatcher (`_resolveActiveRoadBeats`, `_activeBattleBeatForCurrentRow`, `_playStoryBeatScene`) exists and runs. PR-5's `applyExpShareVoucher` is the one named piece NOT shipped (`grep -c applyExpShareVoucher battle.html` = 0; ledger ISSUE-277).

**Blast radius**: Because the PR checklist shows only PR-1 ✓, a reader assumes the whole 3-track system is unbuilt and may re-implement it, or skip it in the merge. In reality this is the LIVE narrative engine and should be promoted to canon (with its known bugs from STORY_FLOW_AUDIT §3). The "stays alive but defaults to classic" note about STORYLINE_VARIANTS (line 25) is now the actual shipped state, not a future intention.

**Fix sketch**: Update the PR table to mark PR-2..PR-6 shipped (note PR-3b IntroQueue partial, PR-5 Exp Share Voucher unshipped), and re-point "source of truth for content" away from the deleted CITY_BY_CITY.md / PLAYTEST_REPORT.md (lines 726/728 — see ledger 7754-7755).

**Verification**: The plan's status reflects code; no shipped subsystem is listed as pending and vice-versa.

---
severity: P2
category: inconsistency
anchor_symbol: _showWanderScreen
current_line_hint: ~49782
file: docs/story-design/WANDER_AROUND_SPEC.md
agents: [spec-drift-auditor]
fingerprint: b7555fbd4e2c
confidence: high
status: open
---

**Title**: WANDER_AROUND_SPEC says "not yet implemented" but Wander Around shipped at SAVE_VER 23

**Evidence**:
```text
WANDER_AROUND_SPEC.md:2  "Status: Design spec — not yet implemented. No battle.html / save-schema code has been touched."
:222 "SAVE_VER is currently 22 ... Bump to 23."
battle.html: _showWanderScreen / _wanderState / _wanderRate / _wanderSimulate defined (~49729-49864),
  WANDER_MAX_TAPS / WANDER_BASE_RATE / WANDER_RATE_DECAY const, called at 43220
  (_showWanderScreen(_wkey, cidx, () => enterCity())). SAVE_VER = 24; v23 added sm.wanderByEventIdx.
```

**Repro**: `grep -n "function _showWanderScreen" battle.html` (defined) and `grep -n "_showWanderScreen(_wkey" battle.html` (called from the city-arrival path). SAVE_VER comment at battle.html:34521 documents "v23 (Wander Around) only ADDED the sm.wanderByEventIdx map." The "Search the Tall Grass"/"Move On" buttons from §2 are live.

**Blast radius**: A reader trusting the "not yet implemented" banner could re-implement Wander Around a second time, or sign off on shipping it not realizing it already runs. The spec's open decisions (O1-O6) read as undecided but were resolved in code (3 taps, 0.50 base, 0.5 decay).

**Fix sketch**: Re-stamp the header "Status: SHIPPED (v23)"; reconcile the SAVE_VER reference (22→23 is stale — chain is now at 24, and v23 has no dedicated migration by design). Note any code/spec parameter deltas (verify WANDER_BASE_RATE/decay match §9 defaults).

**Verification**: Header reflects shipped status; SAVE_VER references match battle.html:34527 (=24) and the documented v23 back-fill.

---
severity: P2
category: inconsistency
anchor_symbol: _storyEnsureMysteryIdentity
current_line_hint: ~33125
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 7fa907ba5071
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Caged God removal (v24) is incomplete — residual content/help-text/achievements still reference the cut arc

**Evidence**:
```text
battle.html:11337  help: "The Caged God in the post-game needs the Master Ball — saved for that one fight." (live tutorial text)
battle.html:11358  "Safari Zone (City 5) ... Your last party member and Subject Zero are not for sale."
battle.html:34767  achievement caged_god  "Capture Subject Zero in the post-game boss arc."  (now unreachable)
battle.html:34797  achievement r_caged_god "Complete the Caged God post-game boss arc."         (now unreachable)
battle.html:32944-32955  _CAGED_GOD_EPILOGUE_BY_VARIANT full prose table (8 variants)
```

**Repro**: STORY_MODE_FLOW.md §9 + CLAUDE.md say the arc is REMOVED (v24); migrateStoryPreV24 strips `sm.bossArc` and entry is neutralized (battle.html:43078 `sm.bossArc.available=false`). But `grep -ni "caged god\|subject zero" battle.html` = ~97 hits incl. live help text, two achievements, an epilogue table, STORY_BEATS row-67 tag `'cagedGod'` (39521), and a `_bossArcRollLegendary` path. The two achievements unlock only inside the now-dead `bossMode` branch (battle.html:50903), so they became permanently unobtainable on v24.

**Blast radius**: Players see help text promising a Caged God / Master Ball post-game that no longer exists, and two achievements they can never earn (dead milestone slots). This is the exact "cut, not deferred" residue CLAUDE.md flags — and it is NEW since the ledger was generated (18:49Z) before the v24 removal (20:56-21:03Z), so prior Caged-God ledger entries (006/028/029/076/...) describe the arc as live.

**Fix sketch**: Either (a) finish the cut — remove the live help-text Caged-God paragraphs, retire/hide `caged_god`+`r_caged_god` achievements, drop the row-67 `'cagedGod'` tag and `_CAGED_GOD_EPILOGUE_BY_VARIANT`; or (b) if the arc may return, gate the help text + achievements behind a feature flag rather than leaving them in prose.

**Verification**: `grep -ni "caged god\|subject zero" battle.html` returns only intentional history comments; no live UI string or earnable achievement references the cut arc; STORY_MODE_FLOW.md §9's "REMOVED" matches code reality.

---
severity: P2
category: inconsistency
anchor_symbol: FACILITY_DEBUT_CITY
current_line_hint: ~30660
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 0d3a51e62bd1
confidence: high
status: open
---

**Title**: Facility debut cities disagree 3 ways (code FACILITY_DEBUT_CITY vs both balance docs vs in-code comments)

**Evidence**:
```text
battle.html FACILITY_DEBUT_CITY: safari: 5, dept: 4, evtrainer: 7, dojo: 1
PROGRESSION_CURVE_MASTER.md §2i: Safari C4, Dept C6, EV Trainer C4(§3.3 R1 "evtrainer=4"), Dojo C4
STORY_MODE_FLOW.md §14c/§15f:   Safari C4, Dept Store C6, EV Trainer C4, Battle Dojo C4
battle.html:48763 (comment): "Safari unlocks at City 4 (badges 3)"  ← contradicts safari:5 above
battle.html:11358 (help):     "Safari Zone (City 5)"                ← matches code value, not docs
```

**Repro**: `grep -nE "safari:|dept:|evtrainer:|dojo:" battle.html` in the `FACILITY_DEBUT_CITY` block → `safari: 5, dept: 4, evtrainer: 7, dojo: 1`. Compare PROGRESSION_CURVE_MASTER.md §2i ("C4: Safari, Battle Dojo, EV Trainer") and STORY_MODE_FLOW.md §15f NPC-placement table ("EV Trainer ... City 4 first", "Battle Dojo ... City 4 first"). The doc table and the code constant disagree on safari (4 vs 5), dept (6 vs 4), evtrainer (4 vs 7), dojo (4 vs 1). Even the code's own §48763 comment contradicts its `safari:5` constant.

**Blast radius**: This is a real balance-staging conflict, not just doc drift — `FACILITY_DEBUT_CITY` gates the Stone Sage debut, force-visit gates, and the EVOLUTION_FLOW voucher schedule. The reward→facility alignment claims in PROGRESSION_CURVE_MASTER §2h/§3.3 R1 are computed against the wrong debut cities (it asserts `FACILITY_DEBUT_CITY.evtrainer=4` while code is 7), so the "Vitamin Pack drops before EV Trainer" defect analysis is itself miscalibrated. ledger ISSUE-279/9057 touch the Safari-city edge but not the full constant-vs-docs divergence.

**Fix sketch**: Treat `FACILITY_DEBUT_CITY` as source of truth, pick the intended schedule with the maintainer (balance number — user-owned), then update STORY_MODE_FLOW §14c/§15f + PROGRESSION_CURVE_MASTER §2i/§3.3-R1 and the contradicting in-code comments (battle.html:48763, 11358) to match.

**Verification**: All four cite the same per-facility debut city; the §3.3-R1 voucher-alignment analysis re-runs against the corrected `FACILITY_DEBUT_CITY`.

---
severity: P2
category: inconsistency
anchor_symbol: FOE_STAT_NERF_BY_CITY
current_line_hint: ~14943
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 02e46f6ff336
confidence: high
status: open
---

**Title**: Early-game softening is a per-CITY table in code, not the per-event named constants both balance docs describe

**Evidence**:
```js
const FOE_STAT_NERF_BY_CITY = [0.80, 0.85, 0.90]; // index = city; City >=3 -> 1.0
// vs STORY_MODE_FLOW.md §8/§15f + PROGRESSION_CURVE_MASTER.md §2d, which describe:
//   PRE_GYM1_FOE_STAT_MULT=0.82, EARLY_GL_FOE_STAT_MULT=0.95 (GL1/GL2),
//   EARLY_GAME_FOE_STAT_MULT=0.92 (routes), STAGE2_GL_FOE_STAT_MULT=0.97 (GL3)
```

**Repro**: `grep -nE "PRE_GYM1_FOE_STAT_MULT|EARLY_GL_FOE_STAT_MULT|EARLY_GAME_FOE_STAT_MULT|STAGE2_GL_FOE_STAT_MULT" battle.html` → 0 hits (the named constants do not exist). The live mechanism is `_earlyGameFoeStatMult()` (battle.html:14953) reading `FOE_STAT_NERF_BY_CITY` keyed on the current city: C0→0.80, C1→0.85, C2→0.90, C3+→1.0. So softening ends after City 2 (post-GL2), and the GL1/GL2-specific 0.95 and GL3 0.97 carve-outs both docs detail do not exist.

**Blast radius**: Both balance docs' §8/§15f/§2d softening tables (and the "softening extends through Gym 3", "GL3 0.97" claims) describe a model the code does not implement. Any retune that edits "the named constants" would touch nothing. The actual early curve (0.80/0.85/0.90 by city) is materially gentler at C0 and ends earlier than documented. Distinct from ledger ISSUE-095 (GL4=GL5 plateau, which is about `_stageGatedFoeStatMult`).

**Fix sketch**: Decide whether `FOE_STAT_NERF_BY_CITY` or the per-event constant model is intended (balance number — user-owned), then make code and docs agree. If keeping the city table, rewrite STORY_MODE_FLOW §8/§15f and PROGRESSION_CURVE_MASTER §2d to describe `FOE_STAT_NERF_BY_CITY` and delete the phantom constant names.

**Verification**: The softening table in both docs lists the same values/keys the code actually applies; `grep` for any constant name cited in a doc resolves in battle.html.

---
severity: P3
category: inconsistency
anchor_symbol: applyStoryLeagueFoeStatBoost
current_line_hint: ~35393
file: docs/PROGRESSION_CURVE_MASTER.md
agents: [spec-drift-auditor]
fingerprint: 775d00366828
confidence: high
status: open
---

**Title**: Mystery Figure HP boost is 1.35 in code but both docs' §15e/§1 retune tables say 1.50

**Evidence**:
```js
} else if (eventName === 'Mystery Figure' && rowIdx === STORY_POST_HOF_MYSTERY_ROW) {
    hpM = 1.35;            // battle.html:35443
// STORY_MODE_FLOW.md §15e: "Mystery Figure HP | 1.35 | 1.50" (claims new=1.50)
// PROGRESSION_CURVE_MASTER.md §1 row 66 / §2d: "Mystery ... x1.50L"
```

**Repro**: `sed -n '35442,35445p' battle.html` shows `hpM = 1.35` for Mystery Figure; Frontier round-1 also starts `1.50 + (round-1)*0.075` (35407), but the post-HoF Mystery boost itself is 1.35. STORY_MODE_FLOW.md §15e "Frontier & boss curve retune" and PROGRESSION_CURVE_MASTER §1/§2d both state Mystery HP = 1.50 as the shipped value. Champion 1.40 and E1-4 1.22 DO match.

**Blast radius**: Narrow — only the post-HoF Mystery Figure boss boost number. But it is cited as the anchor (round-1 Frontier "starts at the post-HoF Mystery boost", §14b) so the Frontier curve description inherits the wrong baseline. Not in the ledger (ledger 248/249/250 cover the additive-vs-multiplicative stacking, a different axis).

**Fix sketch**: Confirm the intended Mystery HP (balance number — user-owned), then align: set code to 1.50 or correct both docs' §15e/§1 rows to 1.35.

**Verification**: The Mystery Figure HP multiplier is identical in battle.html:35443 and in STORY_MODE_FLOW §15e + PROGRESSION_CURVE_MASTER §1/§2d.

---
severity: P3
category: inconsistency
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~33100
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 69883614a0e7
confidence: high
status: open
---

**Title**: STORY_MODE_FLOW §14d describes Mystery Figure's 7-identity flow + Caged God repurpose; code has only the_first

**Evidence**:
```text
STORY_MODE_FLOW.md §14d (~505-508):
  "Post-HoF Mystery Figure battle (row 67 ...) — final masked challenger, repurposed for the Caged God arc."
  context describes _profMysteryMode / multi-identity rotation.
battle.html:33100  const MYSTERY_FIGURE_IDENTITIES = { the_first: {...} };   // single entry
battle.html:33125  return MYSTERY_FIGURE_IDENTITIES.the_first;                 // _storyEnsureMysteryIdentity
```

**Repro**: `grep -n "the_first\|cyrus\|ghetsis" battle.html` near 33100 — the identity table collapsed to a single `the_first` (per STORY_3TRACK_IMPL_PLAN Decision 5 / PR-6; ledger ISSUE-308). STORY_MODE_FLOW §14d still frames Mystery Figure as a rotating multi-identity flow "repurposed for the Caged God arc" — both the 7-identity rotation and the Caged-God repurpose are gone.

**Blast radius**: Doc-only, but §14d is part of the file CLAUDE.md names as story canon, so it actively misdescribes the post-HoF climax (single "The First" identity, no Caged God). Compounds finding 2499e3087f11.

**Fix sketch**: Rewrite §14d: Mystery Figure is a single locked identity "The First" (battle.html:33101, sprite Red); drop the "repurposed for the Caged God arc" clause; keep the Professor-vs-Mystery split that is still accurate.

**Verification**: §14d names "The First" as the sole identity and references no Caged God; matches battle.html:33100-33125.

---
severity: P3
category: dx
anchor_symbol: STORY_NARRATIVE_VARIANTS
current_line_hint: n/a
file: docs/STORY_NARRATIVE_VARIANTS.md
agents: [spec-drift-auditor]
fingerprint: 15a2b3eb1024
confidence: high
status: open
---

**Title**: Doc line anchors stale across 4 specs (still drifting post-v24; cluster)

**Evidence**:
```text
spec-drift.mjs: 23/43 battle.html:LINE refs no longer match the named symbol. Representative:
  STORY_MODE_FLOW.md:52         claims battle.html:21273 STORY_EVENTS_RAW   → actual ~30583
  STORY_NARRATIVE_VARIANTS.md:612 claims :30566 STORY_BEATS               → actual 39503
  STORY_NARRATIVE_VARIANTS.md:616 claims :30916 roamingLegendary          → not a symbol (cold-open key)
  PROGRESSION_CURVE_MASTER.md:39  claims :29001 STORY_EVENTS_RAW          → actual 30583
  docs/EVOLUTION_FLOW_REBUILD.md:90 claims :37361 VOUCHER_KEYS            → actual 46469
```

**Repro**: `node scripts/debug/spec-drift.mjs` → tests/reports/spec-drift.md. Every NAMED symbol still resolves via `find-anchor`; only the line numbers rotted (battle.html is now ~61.8k lines). This overlaps ledger ISSUE-360 (STORY_NARRATIVE_VARIANTS anchors) but is re-surfaced here as the single cluster across all four surviving specs post-v24, and the spec-drift tool's DOCS list omits the docs/story-design/*.md files entirely (STORY_3TRACK / FLOW_AUDIT / WANDER anchors are never scanned).

**Blast radius**: Low — anchors are documented point-in-time and the symbol is the durable reference. Two non-anchor count survivors ride along: STORY_NARRATIVE_VARIANTS.md:8 "68-row" (actual 67; already ledger ISSUE-190/353/361) and PROGRESSION_CURVE_MASTER.md:52 "44 are Battle rows" (actual 48 Battle-type rows).

**Fix sketch**: Batch-refresh the cited lines via `find-anchor`, or (better) strip raw `battle.html:LINE` numbers from the docs and rely on symbol names + ANCHOR_INDEX.md. Add docs/story-design/*.md to the `DOCS` array in scripts/debug/spec-drift.mjs so those anchors are tracked too.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted refs (or the docs no longer carry line numbers); the story-design subdir is included in the scan.

