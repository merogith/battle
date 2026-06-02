# Documentation Health Audit & Remediation Brief

> **Generated**: 2026-06-02 · **Auditor**: doc-health pass (read-only) · **Method**: every prose claim cross-checked against `battle.html` (61,830 lines), `package.json`, `data/*.json`, and the ledger via `grep`/`node`. Two sub-agents swept the design docs in parallel; the agent-infra (`.claude/`, `agent-state/`) was read directly.
>
> **This document is a HANDOFF for the agent that will do the fixes.** It is not itself a doc that ships to players. It documents *every* documentation-health issue found, with exact locations, current-vs-correct values, severity, fix-type, and the decisions a human must make first.
>
> **Scope audited**: `CLAUDE.md`, `.claude/agents/*.md` (10), `.claude/commands/*.md` (8), `.claude/skills/*/SKILL.md` (6), `agent-state/{ANCHOR_INDEX,LEDGER_SCHEMA}.md`, `STORY_MODE_FLOW.md`, `docs/PROGRESSION_CURVE_MASTER.md`, `docs/EVOLUTION_FLOW_REBUILD.md`, `docs/DOJO_TUTOR_RECOMMENDER_DESIGN.md`, `docs/STORY_NARRATIVE_VARIANTS.md`, `docs/story-design/*.md` (3), `README.md`, `tests/README.md`, `tests/reports/deviations.md`, `CHANGELOG.md`, `.cursor/rules/*.mdc`, `.claude/settings.json`, `.claude/hooks/session-start.sh`. Reference data dumps (`docs/dojo-dex/gen*.md`, `sprites/*.md`, `ATTRIBUTION.md`) were inventoried but not deep-audited — they are generated/static and low disinformation-risk.

---

## 0. How to use this report (instructions for the fixing agent)

1. **Re-verify before you edit.** Every line number in this report is *as-of 2026-06-02*; `battle.html` drifts on every insertion. For any fix, resolve the symbol fresh (`node scripts/debug/symbol-index.mjs --lookup <SYM>` or `/anchor <SYM>`) and confirm the current text with `grep -n` before applying an `Edit`. Treat my `~NNNNN` as a hint, never as the edit target.
2. **Severity in *this* report is doc-impact, not game-impact.** There are **no P0s** — no documentation issue here corrupts a save or crashes the game. Scale used:
   - **P1** = actively causes an agent to take a wrong action or emit a wrong finding (e.g. validate saves against the wrong `SAVE_VER`, name a dead constant as a live tuning lever, a "not yet implemented" banner on shipped code).
   - **P2** = misleads or wastes effort but is recoverable (stale counts, conflicting targets, broken cross-refs, structural corruption).
   - **P3** = cosmetic / polish / historical-bloat.
3. **Respect the project's own rule:** balance numbers and curve values are maintainer-owned (see `CLAUDE.md` → Approval rules). Several issues below (Stone-Shop debut city, perf targets, row counts) are **DECISIONS**, not mechanical fixes — do not "correct" them to match code without sign-off; surface them.
4. **Do the §5 mechanical batch first** (safe, 1:1), then §6 (rewrites), then §8 (generator/code). Leave §7 (decisions) for the maintainer.
5. **Don't churn the §2 "verified-correct" list.** Those numbers look stale but are *right* — changing them re-introduces error.

---

## 1. Headline assessment

- **The most-loaded agent doc — `CLAUDE.md` — is healthy.** Its line count (`~61k / 4 MB`), the de-scope grep (all 7 cut-system tokens return **0 hits**), and every referenced path (`scripts/debug/issue-ledger.mjs`, `tests/helpers/load-engine.js`, the 10 agent files) verify. It does **not** need a rewrite — only a one-line count-phrasing polish (DOC-014).
- **The rot is concentrated in two places:** (a) **hardcoded `battle.html:LINE` / size / version numbers** scattered through the skills, agents, and design docs — the file has grown ~13k lines past many of them; and (b) **design docs written as forward plans that shipped but were never flipped to "as-built"** (Wander, Evolution, 3-Track, Narrative-Variants).
- **The single best-practice exemplar in the repo is `docs/DOJO_TUTOR_RECOMMENDER_DESIGN.md`** — it anchors on *symbol names only*, every symbol resolves, and its one cited test exists. It did not rot because it never embedded a line number. **Make it the template** (see §9).
- **Clean infra:** `session-start.sh`, `settings.json`, `LEDGER_SCHEMA.md`, and the `.cursor` layout rule are all healthy. The session hook regenerates the symbol index + anchor map every boot, so `ANCHOR_INDEX.md` is always freshly dated — the fix for its bad entries is in the *generator*, not the file (DOC-007).

---

## 2. Verified-CORRECT — DO NOT "fix" these (anti-churn list)

These were checked and are accurate as of today. An earlier pass nearly "corrected" the first one and would have introduced a bug — leave them alone.

| Claim | Where | Verified |
|---|---|---|
| **351 `it.todo()`** = status **210** + special **74** + physical **67** | `test-coverage-filler.md:3,13`, `debug-orchestrator.md:38`, `deep-debug.md:33` | `grep -c it.todo` per file → exactly 210/74/67. (A repo-wide `grep` shows 355 only because `tests/README.md` + `tests/audit/generate-move-tests.js` mention the token — not real stubs.) |
| **867 per-move tests = 516 real + 351 todo** | `run-engine-test.md:15` | real `it(` = 59+177+280 = 516; +351 = 867. ✓ |
| `battle.html` **~61k / 4 MB** | `CLAUDE.md:7` | `wc`: 61,830 lines / 4,188,051 B. ✓ |
| De-scope grep → **0 hits** (Black Market/Illegal Dealer/wager/Trader/Itinerary) | `CLAUDE.md:37` | all 7 tokens 0 hits. ✓ |
| `data/moves.json` **~954 moves** | `data-integrity-auditor.md:21`, `data-check.md:18` | 954 distinct moves. ✓ |
| DOJO stage clock `NPC_STAGE_CITY.dojo = [2,5,8]` | `DOJO_…DESIGN.md:44` | matches `battle.html` exactly. ✓ |
| `PC_BOX_CAP = 30` | `STORY_MODE_FLOW.md` | ✓ |
| `session-start.sh`, `settings.json` | `.claude/` | healthy, no action. |

---

## 3. DECISIONS required from maintainer (block the dependent fixes)

The fixing agent **cannot** resolve these — they are design/balance calls the maintainer owns. Each blocks one or more issues below.

| # | Decision | Why it can't be auto-fixed | Blocks |
|---|---|---|---|
| D1 | **Caged God / boss-arc: officially CUT or LIVE?** | `STORY_MODE_FLOW.md §9` says "❌ REMOVED (v24)" but §10/11/13/14 + all of `STORY_NARRATIVE_VARIANTS.md` describe it live; code is vestigial (`sm.bossArc` still init'd, `cageUnlocked` path + `caged_god` achievements still registered). Doc, doc, and code all disagree. | DOC-031, DOC-034, + code cleanup |
| D2 | **`STORY_NARRATIVE_VARIANTS.md`: cut the doc, or banner it "dormant/superseded"?** | The 8-variant system is dead code (`sm.storyLine` hard-pinned `'classic'`; `STORY_FLOW_AUDIT.md §6` records the maintainer "resolved to cut the 8-variant concept"). The doc still reads as live canon. | DOC-033 |
| D3 | **Stone Shop debut city: 2 or 3?** | `EVOLUTION_FLOW_REBUILD.md` says City 2 (5+ places); code `FACILITY_DEBUT_CITY.stoneShop = 3`. This is a curve/balance number the maintainer owns — don't silently match doc→code. | DOC-019 |
| D4 | **Turn-loop perf target: <5 ms or <50 ms?** | `performance-profiler.md:18` says <5 ms; `perf-check.md:18` says <50 ms. Pick one. | DOC-012 |
| D5 | **`@pkmn/dex` pin: 0.10.7 or 0.10.9?** | `tests/README.md:137` + the in-code `PKMN_DEX_VER` const say 0.10.7; `package.json` pins `^0.10.9`. One is stale. | DOC-025 |
| D6 | **`STORY_EVENTS_RAW` row count: 67 or 68?** | `STORY_MODE_FLOW`/`3TRACK` say "67 rows / idx 0–66"; `STORY_NARRATIVE_VARIANTS` says "68"; code has a live `[67,…]` row. Ledger ISSUE-351 also flags this. Settle empirically, then make every doc cite the one number. | DOC-008, DOC-035, DOC-044 |
| D7 | **Specialist count phrasing: "9" or "10"?** | `CLAUDE.md` says "10 specialist auditors"; README/orchestrator/deep-debug say "9". Reality: 9 fan-out workers + 1 orchestrator = 10 files. Pick one phrasing and standardize. | DOC-014, DOC-022 |

---

## 4. Master issue register (46 issues)

Fix-type legend: **M** = mechanical 1:1 replace · **R** = rewrite/restructure (judgment) · **G** = generator/code change · **D** = needs a §3 decision first · **V** = verify-against-code before editing.

| ID | Sev | Type | File | One-line |
|---|---|---|---|---|
| DOC-001 | P2 | M | `.claude/skills/read-monolith-section/SKILL.md` | "48,416-line / 3.2 MB" ×3 — actual ~61.8k / ~4 MB |
| DOC-002 | **P1** | M | `.claude/skills/inspect-save/SKILL.md` | frontmatter "validates against `SAVE_VER=15`" — actual 24 |
| DOC-003 | **P1** | R | `.claude/skills/run-engine-test/SKILL.md` | "hook lives at `battle.html:~48385`" — actual `__engine` export ~61784 |
| DOC-004 | P3 | R | `.claude/skills/run-engine-test/SKILL.md` | "Integration tests (new this session)" lists 5 of 13; "new this session" rotted |
| DOC-005 | P2 | V | `.claude/skills/run-engine-test/SKILL.md` | "884 tests" / "954 moves" unverified (884 likely stale; cf. DOC-023) |
| DOC-006 | P3 | M | `.claude/agents/debug-orchestrator.md` | "battle.html (3.2 MB)" — actual ~4 MB |
| DOC-007 | P2 | G | `scripts/debug/anchor-map.mjs` → `ANCHOR_INDEX.md` | 7 anchors show "_not found_": 3 truly dead, 4 false-negatives |
| DOC-008 | P3 | R | `.claude/agents/story-mode-investigator.md` | stale "~line 10766 fresh", pre-v15 framing, "68 rows" (see D6) |
| DOC-009 | P3 | R | `.claude/agents/battle-engine-debugger.md` | 7 stale example line refs (self-flagged "stale" — low risk) |
| DOC-010 | P3 | M | emit-finding, find-anchor, read-monolith, `commands/anchor.md` | `rollTrainerTeam ~32290`→37609; `STORY_EVENTS_RAW 27969`→30620 (examples) |
| DOC-011 | P2 | M | `.claude/commands/deep-debug.md` | line 69 hardcodes dead branch `claude/sharp-keller-eZEDN` |
| DOC-012 | P2 | D | `perf-check.md` vs `performance-profiler.md` | turn-loop target 50 ms vs 5 ms (D4) |
| DOC-013 | P3 | M | `.claude/agents/pvp-concurrency-hunter.md` | "819 LOC" ×2 — actual 880 (out-of-scope, low) |
| DOC-014 | P3 | M | `CLAUDE.md` | "10 specialist auditors fanned out" — 9 fan out + 1 orchestrator (D7) |
| DOC-015 | **P1** | V | `docs/PROGRESSION_CURVE_MASTER.md` | names 4 dead `*_FOE_STAT_MULT` + `_WILD_GRADE_CURVE_BY_BADGES` as live levers |
| DOC-016 | P2 | R | `docs/PROGRESSION_CURVE_MASTER.md` | actionable layer keyed on retired `BUG-012/013/014/004` (0 ledger hits) |
| DOC-017 | P2 | M | `docs/PROGRESSION_CURVE_MASTER.md` | header "now ~54,035 lines" → ~61.8k; orphan "post-v19" tag |
| DOC-018 | P3 | R | `docs/PROGRESSION_CURVE_MASTER.md` | ~40% is retired-decision/closed-finding history; split as-built vs archive |
| DOC-019 | **P1** | D | `docs/EVOLUTION_FLOW_REBUILD.md` | Stone Shop "City 2" (5+ places) vs code `stoneShop:3` (D3) |
| DOC-020 | P2 | R | `docs/EVOLUTION_FLOW_REBUILD.md` | ~140 lines of unshipped-plan framing on SHIPPED doc; stale §12 anchors; dead branch L704; `_withRequired`/`buyStone` never shipped |
| DOC-021 | P3 | R | `docs/DOJO_TUTOR_RECOMMENDER_DESIGN.md` | tense: IMPLEMENTED header but "for your approval" voice remains (else: TEMPLATE) |
| DOC-022 | P3 | M | `README.md` | "9 specialists" (D7); "npm start … online/PvP" note vs out-of-scope |
| DOC-023 | P2 | V | `tests/README.md` | "884 tests" (actual ~1,126 `it/test` blocks); "Nine invariants" (10 property files) |
| DOC-024 | P3 | M | `tests/README.md` | `parseMoveEffects` @23775→26851; `sleep` @10690→12706; VGC formula @21473 |
| DOC-025 | P2 | D | `tests/README.md` | `@pkmn/dex 0.10.7` vs `package.json ^0.10.9` (D5) |
| DOC-026 | P3 | M | `tests/README.md` | duplicated "Reports written to /tests/reports/" block (L21-25 ≈ L26-30) |
| DOC-027 | P3 | R | `tests/reports/deviations.md` | ~13 engine line citations all ~2,800 lines stale (21476→24268 region) |
| DOC-028 | P2 | R | `STORY_MODE_FLOW.md` | section-number corruption: §15e×2, §15f×2, §15g×3, §14b-e out of order |
| DOC-029 | **P1** | R | `STORY_MODE_FLOW.md` | 3 dead symbols quoted verbatim (see detail) |
| DOC-030 | P2 | R | `STORY_MODE_FLOW.md` | whole spec written as forward plan bumping SAVE_VER 14→15; reality 24 |
| DOC-031 | **P1** | D | `STORY_MODE_FLOW.md` | Caged God: §9 "REMOVED" but §10/11/13/14 live (D1) |
| DOC-032 | P3 | R | `STORY_MODE_FLOW.md` | no TOC for a 1,407-line canon file |
| DOC-033 | **P1** | D | `docs/STORY_NARRATIVE_VARIANTS.md` | no "superseded/dormant" banner on cut 8-variant system (D2) |
| DOC-034 | **P1** | D | `docs/STORY_NARRATIVE_VARIANTS.md` | Caged God live per-variant beat, unflagged (D1) |
| DOC-035 | P3 | R | `docs/STORY_NARRATIVE_VARIANTS.md` | stale anchors; "68-row"/row-68 intro beat (D6) |
| DOC-036 | P2 | R | `docs/story-design/STORY_3TRACK_IMPL_PLAN.md` | broken cross-refs: `CITY_BY_CITY.md` + `PLAYTEST_REPORT.md` missing |
| DOC-037 | P3 | M | `docs/story-design/STORY_3TRACK_IMPL_PLAN.md` | duplicated beat-resolver code block (L300-320 ≈ L327-350) |
| DOC-038 | P2 | R | `docs/story-design/STORY_3TRACK_IMPL_PLAN.md` | "PR-1 v21→v22 done" (reality v24); PR-6 "delete 7 MF identities" never happened |
| DOC-039 | **P1** | R | `docs/story-design/WANDER_AROUND_SPEC.md` | banner "not yet implemented / no code touched" — feature SHIPPED at v23 |
| DOC-040 | P3 | R | `docs/story-design/WANDER_AROUND_SPEC.md` | SAVE_VER target "22→23" stale; proposed symbols not shipped; §13 anchors |
| DOC-041 | P2 | R | `CHANGELOG.md` | ~1 week unrecorded; `## Unreleased` blocks sit *below* dated releases |
| DOC-042 | P2 | R | *all docs* | universal `battle.html:LINE` anchor rot — adopt symbol-only convention (§9) |
| DOC-043 | P3 | R | *all docs* | no freshness markers — adopt standard "as-built" header (§9) |
| DOC-044 | P2 | D | *cross-doc* | single-source-of-truth violations (row count, stone city, counts, versions) — see §3 |
| DOC-045 | P3 | — | `design/MASTER_*.csv` | parallel curve source vs `PROGRESSION_CURVE_MASTER.md` — confirm which is canonical |
| DOC-046 | P3 | — | `.cursor/rules/pokemon-battle-layout.mdc` | healthy; optionally cross-link `CLAUDE.md` scope rules |

---

## 5. Mechanical replacements (safe 1:1 — do these first, after re-grepping)

Apply with `Edit`. **Confirm the current string with `grep -n` first** (line numbers drift). Where a *new* number would just reset the rot clock, I recommend the rot-resistant phrasing instead.

| ID | File | Current text | Replace with (recommended) |
|---|---|---|---|
| DOC-001a | `read-monolith-section/SKILL.md` (frontmatter) | `the 48,416-line / 3.2 MB monolith` | `the ~62k-line / ~4 MB monolith` |
| DOC-001b | same, body | `it's 48,416 lines and will exhaust` | `it's ~62,000 lines and will exhaust` |
| DOC-001c | same, anti-pattern | `slow on a 3.2 MB file` | `slow on a ~4 MB file` |
| DOC-001d | same, good-pattern | `rollTrainerTeam` … `resolves to ~32290` … `offset=32285` | use a placeholder: `resolves to ~<line>` … `offset=<line>-5` (don't hardcode) |
| DOC-002 | `inspect-save/SKILL.md` (frontmatter) | `validates against `SAVE_VER=15`` | `validates against the current `SAVE_VER` (24 as of 2026-06; resolve via `find-anchor SAVE_VER`)` |
| DOC-003 | `run-engine-test/SKILL.md:47` | `The hook lives at `battle.html:~48385`.` | `The `window.__engine` / `__testReady` export lives near end-of-file; resolve via `grep -n '__testHarness' battle.html` (it appears at several gate sites, not one).` |
| DOC-006 | `debug-orchestrator.md:24` | `re-reading `battle.html` (3.2 MB)` | `re-reading `battle.html` (~4 MB)` |
| DOC-010a | `emit-finding/SKILL.md:31` | `current_line_hint: ~32290` | `current_line_hint: ~37609` (or `~<line>` placeholder) |
| DOC-010b | `emit-finding/SKILL.md:69` | `sed -n '32290,32295p'` | `sed -n '37609,37614p'` |
| DOC-010c | `commands/anchor.md:22` | `battle.html:32290 … rollTrainerTeam` | `battle.html:37609 … rollTrainerTeam` |
| DOC-010d | `commands/anchor.md:25` | `battle.html:27969 … STORY_EVENTS_RAW` | `battle.html:30620 … STORY_EVENTS_RAW` |
| DOC-011 | `commands/deep-debug.md:69` | `- Branch: `claude/sharp-keller-eZEDN` (commits go here).` | **delete the line** (branches are short-lived per CLAUDE.md; never hardcode) |
| DOC-013 | `pvp-concurrency-hunter.md:11,47` | `819 LOC` / `819-line file` | `880 LOC` (or `~880`) |
| DOC-017 | `PROGRESSION_CURVE_MASTER.md:5` | `now ~54,035 lines` | `now ~61.8k lines` + remove/annotate the "post-v19" tag |
| DOC-024a | `tests/README.md:117` | `parseMoveEffects()` at `battle.html:23775` | `…at `battle.html:26851`` (or drop the line, cite the symbol) |
| DOC-024b | `tests/README.md:122` | `sleep` declaration (line 10690) | `sleep` declaration (line 12706) |
| DOC-026 | `tests/README.md:~21-30` | two near-identical "Reports written to /tests/reports/" lists | collapse to one |
| DOC-037 | `STORY_3TRACK_IMPL_PLAN.md:~327-350` | duplicated "### Beat resolver" block | delete the second copy |

> **Note on DOC-001/017 (size numbers):** rounding to `~62k / ~4 MB` is deliberate — an exact `61,830` rots on the next commit. Pair every size/count claim with "verify: `wc -l battle.html`" rather than re-pinning an exact figure (see §9).

---

## 6. Rewrite / structural issues (judgment required)

### Agent infra

**DOC-004 — `run-engine-test/SKILL.md` integration table is stale & incomplete.** It's headed "Integration tests (new this session)" and lists 5 files; `tests/integration/` now holds **13** (`catch-system, cry-fallback, game-confirm-modal-contract, league-stat-boost-additive, pvp-stub, rng-determinism, safari-zone, sanitize-battle-log, save-migration, status-flow…, story-flow, turn-skip-guards, type-chart-coverage`). Fix: drop "(new this session)" (rots), and either regenerate the list or replace the table with "see `tests/integration/` — run `npm run test:integration`." *Best practice: never enumerate a volatile file list in a skill; point at the directory.*

**DOC-005 / DOC-023 — test counts.** `run-engine-test.md` ("884 tests", "954 moves") and `tests/README.md` ("884 tests", "Nine invariants") hardcode totals. `954 moves` and `867/516/351` verify; **`884` does not** (sub-agent counted ~1,126 `it()/test()` blocks; property files = 10, not 9). Don't just bump 884→1126 (it'll rot again) — replace the absolute with "run `npm test` for the live count" or generate it from the audit report. **V: re-derive before changing.**

**DOC-007 — `ANCHOR_INDEX.md` "_not found_" entries (fix the GENERATOR, not the .md).** The file is regenerated every session by `scripts/debug/anchor-map.mjs`, so editing the `.md` is pointless. Root cause is the hardcoded `ANCHORS` list in `anchor-map.mjs:10-28`:
  - **Truly dead (remove or rename in the list):** `newStoryRun` (→ `startNewRun` @~39376 / `confirmTrainerAndStart` @~38866), `storyRngState` (0 hits), `getCurrentCityDisplayName` (0 hits). All return 0 grep hits.
  - **False-negatives (exist, but not declaration-form, so `symbol-index.mjs` misses them):** `__testHarness`, `__engine`, `__testReady` (they're `window.X = …` at ~61784-61822), and `_pbsStoryUsePlayerGimmickGate` (3 hits, a call/property). This directly contradicts `run-engine-test.md`, which correctly says these exist.
  - **Fix options:** (a) prune/rename the dead three in the `ANCHORS` list; (b) broaden `symbol-index.mjs` patterns to capture `window.\w+ =` and bare-call forms, or add a "known property-ref" allow-list so they resolve instead of printing "_not found_". This is an infra/code change — behavior-preserving, but run `npm run debug:anchors` after and eyeball the diff.

**DOC-008 — `story-mode-investigator.md`.** Drop the hardcoded "`_withStoryPlayerGimmickGate` (~line 10766 fresh)" (actual 12381; and "fresh" is ironic) — the doc already says "Locate via find-anchor," so just delete the number. Generalize "pre-v15"/`migrateStoryPreV15` to "the `migrateStoryPreV<N>` chain (currently through V24)." Soften "STORY_EVENTS_RAW … 68 rows" pending D6 (the ledger says 67).

**DOC-009 — `battle-engine-debugger.md`.** Seven example line refs (confusion ~18105, partial-trap ~17703, thaw ~17673, harvest ~20538, rival ~21852, aiEstimateDmg ~12808, aiThreatScore ~12869) are stale — but the doc *explicitly says* "These line numbers are stale — resolve via find-anchor," so risk is low. Optional: refresh, or replace with "(resolve fresh)". Low priority.

**DOC-010 — illustrative `rollTrainerTeam ~32290` examples.** Across emit-finding/find-anchor/read-monolith/anchor.md the *teaching example for "resolve fresh"* is itself stale (actual 37609). Either refresh to 37609 (§5) or — better for a workflow example — use a `<line>` placeholder so no number can rot. Ironic but cosmetic.

### Design canon

**DOC-015 — `PROGRESSION_CURVE_MASTER.md` names dead tuning levers (P1).** This is the difficulty canon `CLAUDE.md` points maintainers to. Its §2d/§2j lever tables cite constants that no longer exist (0 hits each): `PRE_GYM1_FOE_STAT_MULT`, `EARLY_GL_FOE_STAT_MULT`, `EARLY_GAME_FOE_STAT_MULT`, `STAGE2_GL_FOE_STAT_MULT`, and `_WILD_GRADE_CURVE_BY_BADGES`. The live equivalents include `_stageGatedFoeStatMult`, `applyStoryLeagueFoeStatBoost`, `_WILD_GRADE_BY_CITY` (note the **badge→city** semantic shift). **V**: map each dead name to its live successor before rewriting the lever tables; this touches balance vocabulary, so confirm the mapping with the maintainer. The architecture narrative is sound — only the symbol names rotted.

**DOC-016 — `PROGRESSION` actionable layer cites retired tracker IDs.** §3/§5/§6 are keyed on `BUG-012/013/014/004` — **0 hits in `agent-state/ISSUE_LEDGER.md`**. `ISSUE-003/005/018/035` still resolve but are marked fixed. Fix: move the closed-finding apparatus into a clearly-labeled "Historical / resolved" appendix (or cut), so the doc's current surface isn't a list of dead IDs.

**DOC-018 — `PROGRESSION` is ~40% historical.** Split into "As-built (current)" vs "Decision log (archive)". Don't delete the history — relabel it so an agent doesn't read a shipped/closed decision as an open lever.

**DOC-020 — `EVOLUTION_FLOW_REBUILD.md` reads like a plan but shipped.** Header says SHIPPED and the symbols resolve (`STONE_SHOP_ITEMS`, `enterStoneShop`, `redeemStoneToken`, `facilityIntros`, …). Cleanup: (a) convert §13-16 (~140 lines of "Agent A runs first / when you approve, fan out") to past-tense or cut; (b) the §12 anchor table is entirely stale (written vs a ~48k tree) — replace with symbol names; (c) delete dead branch ref `claude/gracious-mayer-H31zi` (L704); (d) note `_withRequired` (§11.1) and `buyStone` (§13) never shipped under those names. Pair with **DOC-019/D3** (stone city).

**DOC-021 — `DOJO_…DESIGN.md` is the healthiest doc.** Only nit: header says IMPLEMENTED but some §4-§8 prose still says "proposals for your approval." Flip the tense. **Then adopt its structure as the template (§9).**

**DOC-027 — `tests/reports/deviations.md` line anchors.** ~13 "Engine: battle.html:21476…" pointers are ~2,800 lines stale (real code at ~24268+: `_glassCannonPact`, `_typeAmplifierType`, the fixed-damage block). Mechanics verify; only pointers rotted. Fix: replace each `battle.html:NNNNN` with the symbol name (the deviation entries already name the mechanic).

**DOC-028 — `STORY_MODE_FLOW.md` section numbering is corrupted by append-drift (P2).** `§15e` appears twice (L731, L1200), `§15f` twice (L749, L1228), `§15g` **three times** (L912, L1273, L1374); `§14b-14e` are out of numeric order. In a 1,407-line canon this breaks every cross-reference. Renumber sequentially; add a TOC (DOC-032).

**DOC-029 — `STORY_MODE_FLOW.md` quotes 3 dead symbols verbatim (P1).** `_WILD_GRADE_CURVE_BY_BADGES` → `_WILD_GRADE_BY_CITY` (badge→city semantic shift; appears §3/§13/§15f), `_storyMaxSigGradeForGw` → `_storySigGradeCeiling` (§15g code block at L932-940 quotes the old name), `_seedFanClubAcrossCities` → gone (Fan Club ships via inline `_push('train', …)`). Update the names in the quoted blocks.

**DOC-030 — `STORY_MODE_FLOW.md` version baseline.** The whole doc is a forward M0–M6 plan bumping `SAVE_VER 14→15`; reality is 24. Add an "as-built (SAVE_VER 24)" reconciliation note at the top, or annotate §10/§13 as historical.

**DOC-036 — `STORY_3TRACK_IMPL_PLAN.md` broken cross-refs (P2).** §8 cites `docs/story-design/CITY_BY_CITY.md` and `PLAYTEST_REPORT.md` as content/evidence sources — **neither exists** anywhere in the repo. Either restore the files, fix the paths, or remove the citations (they're load-bearing — `PLAYTEST_REPORT.md` is cited as the evidence for `rollMysteryFigureFinalBossTeam`).

**DOC-038 — `STORY_3TRACK_IMPL_PLAN.md` plan-vs-reality.** "PR-1 v21→v22 ✓" is two versions behind (v24). PR-6's "delete the 7 old Mystery Figure identities, keep only `the_first`" **did not happen** — `cyrus`/`buried_alive`/`cartridge_self` still coexist with `the_first`. Mark PR-6 as not-done (or do it, pending D1/D2). The 3-track core genuinely shipped.

**DOC-039 — `WANDER_AROUND_SPEC.md` headline is false (P1).** Banner: "Status: Design spec — **not yet implemented.** No `battle.html` / save-schema code has been touched." But it shipped at v23: `WANDER_MAX_TAPS=3`, `WANDER_BASE_RATE=0.50`, `sm.wanderByEventIdx` (save default + v23 migration comment) are all live. Flip the banner to "SHIPPED v23" with as-built notes, or move the doc to an `archive/`. Highest-confidence factual error in the set.

**DOC-041 — `CHANGELOG.md` (P2).** Top entry is `1.2.2 … 2026-05-26`; today is 2026-06-02, so ~1 week of work (SAVE_VER 22→24, Wander, 3-Track, Evolution) is unrecorded. Worse, three `## Unreleased` blocks (dated 2026-05-22/05-23) sit **below** the dated `1.2.x` releases — backwards. Agents are told "CHANGELOG top = most recent landings"; this misleads them. Fix: fold/relabel the stale `Unreleased` blocks, put a single fresh `## Unreleased` at the top, and add the missing week.

---

## 7. (reserved — see §3 Decisions; do not action DOC-012/019/025/031/033/034/044 until answered)

---

## 8. Generator / code changes (infra, behavior-preserving)

- **DOC-007** → `scripts/debug/anchor-map.mjs` (`ANCHORS` list) and/or `scripts/debug/symbol-index.mjs` (matching patterns). See §6 detail. Run `npm run debug:anchors` after; the `.md` regenerates itself.
- **No game-code edits** are implied by any issue in this report. Vestigial Caged-God code (`sm.bossArc`, `cageUnlocked`, `caged_god` achievements) is noted only as evidence for D1 — its removal is a separate, maintainer-approved task, not a doc fix.

---

## 9. Best-practice standards going forward (so docs stop rotting)

These are the conventions that would have prevented ~70% of the issues above. Recommend adding them to `CLAUDE.md` (a short "Docs discipline" subsection) so every future agent follows them.

1. **Anchor on symbol names, never line numbers.** Every `battle.html:NNNNN` in the repo is stale; every symbol-only reference (the DOJO doc) survived. If a line is genuinely needed, write `~NNNNN (resolve via find-anchor)` so the tilde + note flags it as approximate. **`docs/DOJO_TUTOR_RECOMMENDER_DESIGN.md` is the template** — copy its referencing style.
2. **Don't hardcode volatile counts/sizes.** `battle.html` line count, file sizes, total test counts, LOC — these rot every commit. Round (`~62k`), or replace with the command that derives them (`wc -l battle.html`, `npm test`). Reserve exact numbers for things that genuinely don't move.
3. **Pin `SAVE_VER` in exactly one place** (the code constant). Docs should say "the current `SAVE_VER` (resolve via `find-anchor`)" — never a literal that silently ages (this is what bit `inspect-save`).
4. **Every design doc carries an as-built header**, e.g.:
   `> As-built: SAVE_VER 24 · battle.html ~61.8k · verified 2026-06-02 · status: SHIPPED|PLAN|AUDIT|SUPERSEDED`
   The `status` field is the single most valuable signal — `WANDER`/`EVOLUTION`/`NARRATIVE_VARIANTS` each broke because a reader couldn't tell plan from record.
5. **One fact, one source.** Pick an authority per cross-doc fact (row count, stone-shop city, specialist count, perf target, dex version) and have other docs *link* to it, not restate it. The §3 decisions feed this.
6. **Never hardcode a branch name** in a command/skill/doc (deep-debug.md, evolution doc both did). Branches are short-lived per `CLAUDE.md`.
7. **Drop session-relative language** ("new this session", "prior audit", "for your approval" on shipped work). It's true at write-time and false forever after.
8. **When a plan ships, flip it** — change the status header to SHIPPED and convert imperative voice to past tense, or move it to `docs/archive/`. A shipped doc in future tense reads as an open TODO.
9. **Generated files: fix the generator.** `ANCHOR_INDEX.md` and the `dojo-dex/gen*.md` regenerate from scripts — edits to the output are lost on next `session-start`. Trace to the source.

---

## 10. Appendix — per-file verdict

| File | Verdict | Worst issue |
|---|---|---|
| `CLAUDE.md` | **HEALTHY** | DOC-014 (count phrasing, P3). No rewrite needed. |
| `.claude/agents/debug-orchestrator.md` | MINOR-DRIFT | 3.2 MB (DOC-006) |
| `.claude/agents/story-mode-investigator.md` | MINOR-DRIFT | stale anchor + 68-row (DOC-008) |
| `.claude/agents/test-coverage-filler.md` | **HEALTHY** | 351 count verified correct |
| `.claude/agents/battle-engine-debugger.md` | MINOR-DRIFT | self-flagged stale lines (DOC-009) |
| `.claude/agents/{consistency,data-integrity,spec-drift,performance,accessibility}-…md` | HEALTHY | minor (perf target conflict lives in command, DOC-012) |
| `.claude/agents/pvp-concurrency-hunter.md` | MINOR-DRIFT (out-of-scope) | 819 LOC (DOC-013); good "DORMANT" dated banner |
| `.claude/commands/deep-debug.md` | MINOR-DRIFT | hardcoded branch (DOC-011) |
| `.claude/commands/perf-check.md` | MINOR-DRIFT | turn-loop 50 ms vs 5 ms (DOC-012) |
| `.claude/commands/{anchor,story-audit,fix-todo-test,ledger-show,triage-issues,data-check}.md` | HEALTHY | anchor.md stale example (DOC-010) |
| `.claude/skills/read-monolith-section/SKILL.md` | **STALE** | 48,416/3.2 MB ×3 (DOC-001) |
| `.claude/skills/inspect-save/SKILL.md` | **STALE** | SAVE_VER=15 (DOC-002, P1) |
| `.claude/skills/run-engine-test/SKILL.md` | MINOR-DRIFT | hook ~48385 (DOC-003, P1) |
| `.claude/skills/{find-anchor,repro-battle,emit-finding}/SKILL.md` | HEALTHY | stale example line (DOC-010) |
| `agent-state/ANCHOR_INDEX.md` | DRIFT (generator) | 7 bad anchors (DOC-007) |
| `agent-state/LEDGER_SCHEMA.md` | **HEALTHY** | none |
| `STORY_MODE_FLOW.md` | **STALE** | §-number corruption + dead symbols + Caged God (DOC-028/029/031) |
| `docs/PROGRESSION_CURVE_MASTER.md` | **STALE** | dead tuning levers (DOC-015, P1) |
| `docs/EVOLUTION_FLOW_REBUILD.md` | MINOR-DRIFT | stone-city contradiction (DOC-019, P1) |
| `docs/DOJO_TUTOR_RECOMMENDER_DESIGN.md` | **HEALTHY — TEMPLATE** | tense nit (DOC-021) |
| `docs/STORY_NARRATIVE_VARIANTS.md` | **STALE** | no superseded banner (DOC-033, P1) |
| `docs/story-design/STORY_3TRACK_IMPL_PLAN.md` | MINOR-DRIFT | broken cross-refs (DOC-036) |
| `docs/story-design/STORY_FLOW_AUDIT.md` | **HEALTHY** | honest point-in-time banner; DONE claims verify |
| `docs/story-design/WANDER_AROUND_SPEC.md` | **STALE** | false "not implemented" banner (DOC-039, P1) |
| `README.md` | MINOR-DRIFT | specialist count (DOC-022) |
| `tests/README.md` | MINOR-DRIFT | test counts + dex version (DOC-023/025) |
| `tests/reports/deviations.md` | STALE (anchors) | ~13 stale line refs (DOC-027) |
| `CHANGELOG.md` | STALE/STRUCTURAL | Unreleased-below-releases (DOC-041) |
| `.cursor/rules/pokemon-battle-layout.mdc` | **HEALTHY** | uses durable anchors; good example |
| `.claude/settings.json`, `.claude/hooks/session-start.sh` | **HEALTHY** | none |

---

### One-paragraph summary for the human

`CLAUDE.md` is in good shape and does **not** need a rewrite — its facts check out. The real disinformation risk is (1) a handful of **hardcoded numbers** in the skills/agents that have aged (`SAVE_VER=15`, the `~48385` harness line, `48,416 lines / 3.2 MB`, a dead branch name) — all cheap mechanical fixes; (2) **design docs that shipped but still read as plans** (`WANDER` says "not implemented" but it's live; `EVOLUTION`/`3-TRACK`/`NARRATIVE_VARIANTS` are stuck in future tense) — these need status banners and a few factual corrections; and (3) **the difficulty canon `PROGRESSION_CURVE_MASTER.md` naming tuning levers that no longer exist** — the highest-value rewrite. Seven cross-doc facts need a maintainer decision (§3) before the dependent edits. Adopting the nine "docs discipline" conventions in §9 — chiefly *anchor on symbol names, not line numbers* and *put an as-built status header on every doc* — would stop the recurrence. The `DOJO` doc already does this and is the template.
