---
severity: P2
category: inconsistency
anchor_symbol: _storyEnemyStatMult
current_line_hint: ~39464
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 5d3db08bada3
confidence: high
status: open
---

**Title**: Curve doc's endgame league-boost layer no longer exists — shipped flat overrides are far below documented values

**Evidence**:
```js
// battle.html ~39472 (shipped, single layer, stamped at build time):
if (e === 'Mystery Figure') return 1.30;
if (e === 'Rival' && row === STORY_RIVAL_ROW_LEAGUE) return 1.26;
if (e === 'Champion') return 1.23;
if (e === 'E1') return 1.14;  // E2 1.16, E3 1.18, E4 1.20
// docs/PROGRESSION_CURVE_MASTER.md §1 rows 60–67: "1.15 ×1.22ᴸ" (E1–E4),
// "1.20 ×1.40ᴸ" (Champion/Rival), "1.20 ×1.50ᴸ" (Mystery Figure); footnote ᴸ:
// "applyStoryLeagueFoeStatBoost stacks multiplicatively on top of the stage-gated mult"
```

**Repro**: `grep -n "_stageGatedFoeStatMult" battle.html` → 0 definitions (doc §2 line 237 cites it at ~13199). `applyStoryLeagueFoeStatBoost` (battle.html:42811) is now gated on `sm.frontier.active` — a no-op for timeline fights. Compare docs/PROGRESSION_CURVE_MASTER.md lines 169–181/237/343 against `_storyEnemyStatMult` (battle.html:39464).

**Blast radius**: docs/PROGRESSION_CURVE_MASTER.md is the maintainer-owned balance canon (CLAUDE.md). Documented effective endgame difficulty (E4 1.15×1.22=1.40, Champion 1.68, MF 1.80) is 17–38% above shipped (1.20 / 1.23 / 1.30). Any balance retune reasoned from the doc's §1 Foe× column or §2 stack table will target the wrong numbers. The doc's 2026-06 banner discloses the §2d softening deletion and FOE_POWER_CURVE[5]=1.03, but NOT the league-boost removal — and the §1 table body still shows Foe× 1.00 for C5 rows (29–31) vs FOE_POWER_CURVE[5]=1.03. Supersedes the code side of ISSUE-002/ISSUE-020 (both measured against the now-deleted boost path). FLOW §8 (STORY_MODE_FLOW.md:233) correctly describes the new single-layer model, so the two canonical docs now disagree with each other as well.

**Fix sketch**: Re-synthesize the §0 stage table, §1 Foe× column, §2 stack table (line 237) and footnote ᴸ around `_storyEnemyStatMult`'s flat overrides, or extend the 2026-06 banner to mark those sections historical like §2d.

**Verification**: Every multiplier in the doc's endgame rows matches `_storyEnemyStatMult` return values; `grep -c "1\.22ᴸ\|×1\.40ᴸ\|×1\.50ᴸ" docs/PROGRESSION_CURVE_MASTER.md` → 0 or annotated-historical.

---
severity: P3
category: inconsistency
anchor_symbol: storyDifficultyCoinMult
current_line_hint: ~38697
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 89c9bc7ef111
confidence: high
status: open
---

**Title**: FLOW §8 post-retune residue — Challenge coin mult 1.10 vs shipped 0.90; Champion-on-Hard example uses 1.30 vs shipped 1.23

**Evidence**:
```js
// STORY_MODE_FLOW.md:231 → "| Challenge (Very Hard) | 1.30 | 1.10 |"
// STORY_MODE_FLOW.md:233 → "Champion HP on Hard ≈ ×1.30 × ×1.15 = ×1.495"
// battle.html ~38706 (shipped):
if (diff === 'challenge') return 0.90;   // coin mult — kaizo taxed BELOW Hard
// battle.html ~39477: if (e === 'Champion') return 1.23;  // not 1.30 (1.30 is MF)
```

**Repro**: Compare STORY_MODE_FLOW.md §8 table (lines 226–233) with `storyDifficultyCoinMult` (battle.html:38697) and `_storyEnemyStatMult` (battle.html:39464).

**Blast radius**: Doc-only, but §8 is the difficulty-mode reference. The 2026-06 coin retune (C 1.10→0.90, per PROGRESSION_CURVE_MASTER line 256) never reached FLOW; the worked Hard-Champion example borrows the Mystery Figure's 1.30. ISSUE-009 covers only the 1.30→1.40 stat-mult cell in the same table — these two cells are additional drift.

**Fix sketch**: Update the §8 coin-mult column (Challenge → 0.90) and recompute the worked example with Champion's shipped 1.23 (≈×1.41 on Hard).

**Verification**: FLOW §8 numbers match `storyDifficultyCoinMult` / `_foeDifficultyMult` / `_storyEnemyStatMult` returns.

---
severity: P3
category: inconsistency
anchor_symbol: STORYLINE_VARIANTS
current_line_hint: ~48142
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 220fc44e75a8
confidence: high
status: open
---

**Title**: FLOW contradicts itself on the tone layer — header says "kept dormant in code, reversible"; §16 says removed; §17 still teaches multi-variant workflow

**Evidence**:
```text
STORY_MODE_FLOW.md:15  "> - The 8-tone storyline layer was RETIRED to `classic`
                        (kept dormant in code, reversible)."
STORY_MODE_FLOW.md:1142 "was CUT (2026-06) — removed from code + docs; see git history"
STORY_MODE_FLOW.md:1209 "Add a storyline variant | Add an entry to STORYLINE_VARIANTS …
                        (the registry already supports it)"
STORY_MODE_FLOW.md:1224 "### Storyline variants — Pokémon adapt to the ruleset" (full section)
```

**Repro**: `grep -n "kept dormant in code" STORY_MODE_FLOW.md` vs `grep -n "removed from code" STORY_MODE_FLOW.md`. Code truth: `STORYLINE_VARIANTS` (battle.html:48142) is a single-`classic`-entry table; the 7 tone variants, `surprise_me` entry, and `_pickRandomStorylineVariant()` were deleted (Stage A/B, CLAUDE.md "Excised vs retired").

**Blast radius**: Doc-only, but the header banner is the doc's authoritative status block — "kept dormant in code, reversible" tells a future session a one-line restore is possible when revival now requires git archaeology. §17's "Add a storyline variant" recipe and the "adapt-to-ruleset" section (lines 1200–1266) describe an extension workflow for a registry that intentionally no longer carries variants. Related to ISSUE-053 (dangling doc refs) but this is the internal status contradiction, new since the 2026-06 cut.

**Fix sketch**: Align line 15 with §16's CUT wording; collapse §17's variant-authoring guidance to a "single classic entry; revive via git history" note.

**Verification**: FLOW contains one consistent status ("CUT, revive via git history") and no live-tense multi-variant authoring instructions.

---
severity: P3
category: dx
anchor_symbol: _readStorylineFromUI
current_line_hint: ~48182
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 07dd76b0e7a1
confidence: high
status: open
---

**Title**: Stale battle.html comments claim deleted tone scripts are "PRESERVED-BUT-DORMANT" and revivable by restoring one call

**Evidence**:
```js
// ~46820: "Tone scripts stay in STORYLINE_VARIANTS for a possible future fold-in."
// ~47636: "The tone-prefixed entries (secondsun_ / bonekeepers_ / … / static_) are
//          PRESERVED-BUT-DORMANT — not live bugs."
// ~48194: "Tone scripts + _pickRandomStorylineVariant() are preserved for a
//          future fold-in — to revive rolling, restore the call below."
if (_tcState.storyline === 'surprise_me') return 'classic'; // was: _pickRandomStorylineVariant()
```

**Repro**: `grep -nE "function _pickRandomStorylineVariant|secondsun_" battle.html` → no definitions/entries (comment mentions only). The Stage A/B cut (CLAUDE.md) deleted the 7 variant entries, ~56 tone cold-opens, and `_pickRandomStorylineVariant()`.

**Blast radius**: Comments only — zero runtime impact — but they directly contradict CLAUDE.md's "Revive via git history (no longer a one-line roll restore)". A future session following "restore the call below" ships a ReferenceError at run creation; `_tcState.storyline: 'surprise_me' // always random per spec` (~46709) similarly describes retired behavior.

**Fix sketch**: Rewrite the three comment blocks to say the tone data/code was deleted 2026-06 and revival is via git history; drop the "restore the call below" instruction.

**Verification**: `grep -n "PRESERVED-BUT-DORMANT\|preserved for a" battle.html` → 0 hits; comments match CLAUDE.md's cut description.

---
severity: P3
category: inconsistency
anchor_symbol: STORY_MODE_FLOW
current_line_hint: ~213
file: STORY_MODE_FLOW.md
agents: [spec-drift-auditor]
fingerprint: 9b3ef90aad20
confidence: high
status: open
---

**Title**: Three live FLOW sections (outside removed §9) still cite the excised "Subject Zero" as shipped behavior

**Evidence**:
```text
STORY_MODE_FLOW.md:213  (§7 Underground, live) "Unsellable: starter, current last
  party mon, the boss-arc capture (\"Subject Zero\")."
STORY_MODE_FLOW.md:646  (§15b enemy IVs, live) "Subject Zero (boss-arc catch) —
  overrides to perfect {31,31,31,31,31,31} before commit"
STORY_MODE_FLOW.md:1321 (Crucible Daycare tone, live) "Subject Zero is doing very
  well, apparently"
```

**Repro**: `grep -n "Subject Zero" STORY_MODE_FLOW.md battle.html` — 0 code hits (the Caged God arc was EXCISED v24; only `sm.bossArc` survives in two migrations). §9 is correctly banner-marked REMOVED, but these three references live in sections describing shipped systems with no removal marker.

**Blast radius**: Doc-only. Distinct from ISSUE-113 (§14d Caged God repurpose) and ISSUE-012 (Underground starter-sellable claim): these are the remaining Subject Zero leftovers in *live* sections, which read as current unsellable/IV/flavor rules that the code cannot exhibit.

**Fix sketch**: Strike or footnote the three references as removed-with-§9 (e.g. "(removed v24 with the boss arc)").

**Verification**: `grep -n "Subject Zero" STORY_MODE_FLOW.md` matches only §9's REMOVED block and explicit historical notes.

---
severity: P3
category: inconsistency
anchor_symbol: SAVE_VER
current_line_hint: ~41804
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 0aabdb291f2c
confidence: high
status: open
---

**Title**: FLOW's own 2026-06-17 reconciliation banner has drifted — cites SAVE_VER 27; shipped is 28, migrateStoryPreV28 undocumented

**Evidence**:
```text
STORY_MODE_FLOW.md:27-28 "Shipped value is **`SAVE_VER = 27`** (`battle.html:39874`).
  The migration chain runs through `migrateStoryPreV27`."
battle.html:41804  const SAVE_VER = 28;
battle.html:42441  function migrateStoryPreV28() {  // npcStageSeen.dojo back-fill +
                                                    // build.starter flag propagation
```

**Repro**: `grep -n "SAVE_VER = " battle.html` vs STORY_MODE_FLOW.md lines 27–28. The v28 migration (dojo NPC stage back-fill; `slot.build.starter = true` propagation, from the build-gen/early-ceiling branch) appears in no spec doc.

**Blast radius**: Doc-only, but this banner is the block ISSUE-044/129 were resolved INTO — the "code is authoritative, here is the shipped value" paragraph is now itself stale, which erodes trust in the whole reconciliation block. Save-schema documentation (CLAUDE.md sensitive area) lags the shipped chain by one version.

**Fix sketch**: Bump the banner to SAVE_VER 28 and add a one-line §10 note describing what migrateStoryPreV28 back-fills (and what pre-28 saves lack).

**Verification**: Banner value equals `window.__STORY_SAVE_VER`; each `migrateStoryPreV*` in code has a matching doc line.

---
severity: P3
category: dx
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~34178
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 23c3dc3dfa40
confidence: high
status: open
---

**Title**: Doc `battle.html:LINE` anchors still drifting — 21/37 stale in today's sweep (cluster; updates ISSUE-136)

**Evidence**:
```text
2026-07-03 spec-drift.mjs: 21/37 refs drifted. Representative:
  STORY_MODE_FLOW.md:28    migrateStoryPreV27  39874 → 42420
  STORY_MODE_FLOW.md:32    FOE_POWER_CURVE     38265 → 39463
  STORY_MODE_FLOW.md:92    STORY_EVENTS_RAW    21273 → 34178
  STORY_MODE_FLOW.md:38    _SAFARI_GRADE_CURVE_BY_BADGES 56506 → 59304
  docs/EVOLUTION_FLOW_REBUILD.md:184 enterEvolutionLab 42603 → 63514
```

**Repro**: `node scripts/debug/spec-drift.mjs` → tests/reports/spec-drift.md (scanned STORY_MODE_FLOW.md, docs/PROGRESSION_CURVE_MASTER.md, docs/EVOLUTION_FLOW_REBUILD.md).

**Blast radius**: All symbols still resolve (no dead references) — pure line-number rot, drift magnitude now ~2.5–21k lines since the docs were written. Same cluster as ISSUE-133/134/135/136; re-measured because two branches landed since the last count (24/44 → 21/37 after doc cleanup).

**Fix sketch**: Replace raw line numbers in docs with symbol-only references (the find-anchor convention), or regenerate them from agent-state/symbol-index.json in a doc pass.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted refs (or docs carry no bare line numbers).

