---
severity: P1
category: inconsistency
anchor_symbol: startNewRun
current_line_hint: ~39514
file: battle.html
agents: [spec-drift-auditor]
fingerprint: c634b39bd109
confidence: high
status: open
---

**Title**: Fresh run starts with 0 PokéBalls (spec says 5 at run start); 5 are gifted at first Mart instead

**Evidence**:
```js
// battle.html ~39514 — startNewRun() (the production New-Adventure path, via confirmTrainerAndStart)
balls: { poke: 0, great: 0, ultra: 0, master: 0 },
// battle.html ~40701 — the 5 balls are granted by the FIRST-MART tutorial onContinue, not at run start:
onContinue: function () { try { _storyGrantBundle({ pokeBall: 5 }); } catch (e) {} ... }
```

**Repro**: Read `confirmTrainerAndStart` (~38931) → `startNewRun` (~39441): a brand-new run's `sm.balls` is `{poke:0}`. The "+5 PokéBalls" comes only from the `firstMart` cold-open (~40698-40702) on first Pokémart visit. But STORY_MODE_FLOW.md §1 (line 30) "Start the run with 5 PokéBalls" and §10 (line 270) `balls: { poke: 5 } // starting balls` both describe a run-START grant. The only `poke:5` in code is `migrateStoryPreV15` (~35260), which fires for `_loadedVer < 15` saves only — never for a fresh run. NOTE: distinct from ledger ISSUE-287 (that is the pre-v15 *migration* shadowing case; this is the *fresh-run* + spec-mismatch case, and the migration code it cites has since been changed to set balls unconditionally).

**Blast radius**: (1) Spec drift hazard: an agent implementing FLOW §10 verbatim would seed `poke:5` in `startNewRun`'s defaults AND keep the Mart gift → 10 balls, double-granting. (2) Two in-code comments now lie: `_shouldFireCatchTutorialBeforeBattle` (~46940 "starting kit gives 5, so this is just a safety net") and `migrateStoryPreV15` (~35256 "defaults block pre-populates balls:{poke:0}"). (3) Latent gameplay edge: the post-intro catch-tutorial gate requires `totalBalls > 0` (~46943); the Pokémart at City0 is an *optional* hub action, so a player who reaches the intro rival without tapping the Mart has 0 balls and the catch tutorial silently no-ops.

**Fix sketch**: Pick the canonical model and align the other side. Either (a) update FLOW §1/§10 to "5 PokéBalls are gifted on first Pokémart visit (City 0), not at run start", and fix the two stale "starting kit gives 5" comments; or (b) move the 5-ball grant into `startNewRun` and drop the Mart `_storyGrantBundle({pokeBall:5})`. Balls are user-owned economy — flag for sign-off before changing the grant point.

**Verification**: A fresh run's `sm.balls.poke` and the spec agree on count and grant timing; the catch-tutorial gate cannot be reached with 0 balls (or the doc documents the Mart dependency).

---
severity: P2
category: inconsistency
anchor_symbol: VOUCHER_KEYS
current_line_hint: ~46650
file: docs/EVOLUTION_FLOW_REBUILD.md
agents: [spec-drift-auditor]
fingerprint: 70efe53e89e9
confidence: high
status: open
---

**Title**: EVOLUTION_FLOW_REBUILD.md header says "Status: Plan — review before implementation" but the system fully shipped

**Evidence**:
```
docs/EVOLUTION_FLOW_REBUILD.md:3  > **Status:** Plan — review before implementation
```
Yet the plan's deliverables are all live in battle.html:
```js
// VOUCHER_KEYS (~46650) matches the doc's proposed array §3 verbatim:
const VOUCHER_KEYS = ['rareCandy','vitamin','heartScale','mint','abilityCapsule',
                      'emblemHonor','wishingPiece','linkDiscount50','stoneToken','casinoChip500'];
// STONE_SHOP_ITEMS exists; linkDiscount50/stoneToken/casinoChip500 wired; Bill/Stonewise-Granny cold-opens present.
// City0 action list no longer has 'Link Station'/'Evolution Tutor' — the doc's §2 "strict removals" were applied.
```

**Repro**: `grep -c STONE_SHOP_ITEMS battle.html` → 11; `grep -cE 'linkDiscount50|stoneToken|casinoChip500' battle.html` → 29; `grep -ciE 'Stonewise|Granny' battle.html` → present. STORY_EVENTS_RAW City0 (~30630) = `['Professor','Pokemart','Move Tutor','Leave City']` (Link Station + Evolution Tutor removed exactly as §2 specifies). The doc describes the shipped facility as if unbuilt.

**Blast radius**: A new session reading this "Plan — review before implementation" doc would conclude the Stone Shop, the 3 new vouchers, and the Bill/Granny intros are unimplemented and rebuild them — duplicate facility, duplicate `VOUCHER_KEYS` entries, conflicting City-2 gates. This is the exact "old design → wrong build" hazard the sweep targets. The doc also carries the worst anchor drift (see the stale-anchor cluster: `battle.html:27975-28043` for STORY_EVENTS_RAW, now ~30629).

**Fix sketch**: Flip the header to "Status: SHIPPED (2026-05/06)" (or move the doc to an archived/implemented section) so it reads as a record, not a backlog item. Strip or refresh the point-in-time `battle.html:LINE` anchors throughout.

**Verification**: The doc's status line reflects shipped reality; no reader would re-implement Stone Shop / vouchers from it.

---
severity: P2
category: inconsistency
anchor_symbol: _wildGradeWeightsForCity
current_line_hint: ~50174
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 5702133c4aaf
confidence: high
status: open
---

**Title**: FLOW §3 says wild grade is "keyed on sm.badges" via `_WILD_GRADE_CURVE_BY_BADGES`; shipped code keys it on city

**Evidence**:
```
STORY_MODE_FLOW.md:81  "Driven by a dedicated wild grade curve keyed on `sm.badges`
                        (0–8, see `_WILD_GRADE_CURVE_BY_BADGES`)."
```
```js
// battle.html ~50164 — shipped wild grade is a per-CITY table, not a per-badge curve:
const STORY_WILD_GRADE_BY_CITY = [ {g4:100}/*C0*/, ..., {g2:20,g3:50,g4:30}/*C7*/ ];
function _wildGradeWeightsForCity(city) { ... return STORY_WILD_GRADE_BY_CITY[c]; }
```

**Repro**: `node scripts/debug/symbol-index.mjs --lookup _WILD_GRADE_CURVE_BY_BADGES` → "not in index"; `grep -n _WILD_GRADE_CURVE_BY_BADGES battle.html` → 0 hits. The live wild roll resolves grade via `_wildGradeWeightsForCity(_wgCity)` (~50464) keyed on the arrived city index, not `sm.badges`. The catch-tutorial comment (~45972) also documents the city-keyed model (`STORY_WILD_GRADE_BY_CITY[0] = {g4:100}`).

**Blast radius**: Anyone tuning the wild curve from FLOW §3 would look for a non-existent `_WILD_GRADE_CURVE_BY_BADGES` keyed on badges (0–8) and, in sloppy-mode, branch on an undefined global. The keying axis itself differs (badges vs city) — these diverge whenever a city's pre/post-gym hubs share a city index but differ in badge count, so the doc predicts the wrong tier. (One stale ledger note at ~6613 even lists `_WILD_GRADE_CURVE_BY_BADGES` as if it exists.)

**Fix sketch**: Update FLOW §3 to: wild grade is a per-city table `STORY_WILD_GRADE_BY_CITY` resolved by `_wildGradeWeightsForCity(cityIdx)` (8 cities, C0–C7); drop the `sm.badges`/`_WILD_GRADE_CURVE_BY_BADGES` framing.

**Verification**: FLOW §3 names `STORY_WILD_GRADE_BY_CITY` / `_wildGradeWeightsForCity`; no doc references `_WILD_GRADE_CURVE_BY_BADGES`.

---
severity: P2
category: inconsistency
anchor_symbol: STORY_MODE_FLOW
current_line_hint: ~62
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 1b3b3cab3ba7
confidence: high
status: open
---

**Title**: Surviving canonical specs + code link to docs deleted in the cleanup (dangling references)

**Evidence**:
```
STORY_MODE_FLOW.md:62   "Implementation strategy = strategy A from
                         `docs/STORY_MODE_CATCH_INTEGRATION_RISK.md §5`"        [DELETED]
STORY_MODE_FLOW.md:334  "Per the prior audit's 'single most important rule'
                         (`docs/STORY_MODE_CATCH_INTEGRATION_RISK.md §8`)"       [DELETED]
docs/story-design/STORY_3TRACK_IMPL_PLAN.md:601,728  "(per PLAYTEST_REPORT.md mention)" / "PLAYTEST_REPORT.md — confirms ..."  [DELETED]
docs/story-design/STORY_3TRACK_IMPL_PLAN.md:726      "docs/story-design/CITY_BY_CITY.md — shipped facility ladder"            [DELETED]
battle.html:35528       "... a G-Max status branch). See BUG_REPORT.md."                                                      [DELETED]
scripts/debug/autopilot-player.mjs:14  "(anime.js is CDN-only — PLAYTEST_REPORT P1-3)."                                       [DELETED]
```

**Repro**: The cleanup commit `ea68891` ("chore: prune stale design docs") deleted `docs/STORY_MODE_CATCH_INTEGRATION_RISK.md`, `docs/story-design/CITY_BY_CITY.md`, `PLAYTEST_REPORT.md`, `BUG_REPORT.md` (et al). Confirm absent: `ls docs/STORY_MODE_CATCH_INTEGRATION_RISK.md` → not found. The two FLOW references are load-bearing: §2 cites "strategy A" from the deleted risk doc as the *rationale* for the route-node save/restore model, and §12 cites its §8 as the *source* of the badge-vs-`sm.team.length` difficulty rule.

**Blast radius**: A reader following FLOW §2/§12 to the cited doc for the design rationale hits a 404 — the "why" behind the route-interrupt and party-size-difficulty decisions is now unciteable. The 3TRACK plan cites a deleted playtest report as its *evidence* that `rollMysteryFigureFinalBossTeam` already works, and a deleted CITY_BY_CITY.md as its facility-ladder anchor. The `battle.html`/autopilot references are low-stakes (comments) but equally dangling.

**Fix sketch**: For each surviving reference, either (a) inline the one-line takeaway the deleted doc supplied (e.g. FLOW §2: "strategy A = save/restore-wrapped wild interrupt, no new timeline rows"; §12: "key difficulty off `sm.badges`, not `sm.team.length`") and drop the dead path, or (b) point at git history. Same for the 3TRACK source list and the two code comments.

**Verification**: `grep -rnE 'STORY_MODE_CATCH_INTEGRATION_RISK|CITY_BY_CITY|PLAYTEST_REPORT|BUG_REPORT\.md' STORY_MODE_FLOW.md docs/ battle.html scripts/` returns no references to deleted files.

---
severity: P3
category: dx
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30629
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: b46ddfa8984f
confidence: high
status: open
---

**Title**: Doc `battle.html:LINE` anchors stale in surviving specs — 24/44 drifted (post-cleanup cluster; updates ISSUE-330)

**Evidence**:
```
STORY_MODE_FLOW.md:52            claims battle.html:21273  for STORY_EVENTS_RAW  → now ~30629
docs/EVOLUTION_FLOW_REBUILD.md:33 claims battle.html:27975 for STORY_EVENTS_RAW  → now ~30629
docs/STORY_NARRATIVE_VARIANTS.md:612 claims battle.html:30566 for STORY_BEATS    → now ~39606
docs/PROGRESSION_CURVE_MASTER.md:143 claims battle.html:33298 for STORY_BUILD_TIER → now ~36882
docs/EVOLUTION_FLOW_REBUILD.md:88 claims battle.html:37361 for VOUCHER_KEYS       → now ~46650
```

**Repro**: `node scripts/debug/spec-drift.mjs` → `tests/reports/spec-drift.md`: 24 of 44 inline `battle.html:LINE` refs across the 4 surviving specs + README no longer point at the named symbol (battle.html is now ~61.8k lines; most refs predate that). Every named symbol still resolves via `find-anchor` — only the line numbers rotted. EVOLUTION_FLOW_REBUILD.md carries the worst drift (anchors ~28k vs reality ~30–53k). Two non-anchor count survivors ride along: STORY_NARRATIVE_VARIANTS.md:8 still says "68-row" timeline (actual 67; FLOW/CURVE were fixed by commit 3929088 — this is the last "68" survivor) and PROGRESSION_CURVE_MASTER.md:52 says "44 are Battle rows" (actual 48 Battle-type rows).

**Blast radius**: Low — `find-anchor` already resolves symbols, so this is doc hygiene, not correctness. This is the post-cleanup refresh of ISSUE-330/337/338 (which referenced now-deleted docs); the surviving-doc count is 24/44.

**Fix sketch**: Strip the `:LINE` suffixes from doc references (keep the durable symbol names — `find-anchor` resolves them), since line numbers re-rot on the next insertion. While there, fix the two count survivors (NARRATIVE_VARIANTS "68-row"→67, CURVE "44 Battle rows"→48).

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted refs (or the surviving docs carry no literal line numbers); no surviving doc says "68 rows".

