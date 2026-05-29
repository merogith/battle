---
severity: P1
category: inconsistency
anchor_symbol: balls
current_line_hint: ~34902
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 3a000383b7a4
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Fresh story run starts with 0 Poké Balls; spec promises 5 in three places

**Evidence**:
```js
// fresh-state default block (~34902) AND _readStorylineFromUI fresh run (~38954):
balls: { poke: 0, great: 0, ultra: 0, master: 0 },
// only the v14->v15 migration grants 5 (so MIGRATED saves get 5, fresh runs get 0):
sm.balls = { poke: 5, great: 0, ultra: 0, master: 0 };   // line 34815
```

**Repro**: Start a brand-new story run (not a migrated save). `sm.balls.poke === 0`. Spec STORY_MODE_FLOW.md §1 ("Start the run with 5 PokéBalls"), §6 (PokéBall "+ 5 at run start"), and §10 (`balls: { poke: 5, ... }`) all promise 5.

**Blast radius**: Catch tutorial fires a guaranteed catch (no ball consumed), but the first real route wild after Gym 1 has no ball to throw until the player buys one at the Mart (300G) — a worse new-player experience than spec'd. Migrated saves vs. fresh runs diverge.

**Fix sketch**: Set `poke: 5` in both fresh-state default blocks (the `sm` defaults and the `_readStorylineFromUI` new-run path) to match the migration and the spec; or update the spec if 0 is intentional.

**Verification**: Open a fresh run, confirm `window.StoryMode.state.balls.poke === 5` before the first route encounter.

---
severity: P1
category: inconsistency
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~14584
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 264442eab1b8
confidence: high
status: open
---

**Title**: League foe boost now stacks ADDITIVELY with difficulty; spec §8/§15c documents multiplicative

**Evidence**:
```js
// code (~14584): league boost is additive delta on top of difficulty mult
const lb = mon._leagueStatBonus;
const hpMult   = mult + (lb && lb.hp   ? lb.hp   : 0);
// comment: "stack ADDITIVELY (not multiplicatively). Stops the 1.30 x 1.40 = 1.82 cliff"
```

**Repro**: Inspect Champion HP on Hard. STORY_MODE_FLOW.md §8 says "applied **before** applyFoeDifficultyScaling, so the two stack **multiplicatively**. Champion HP on Hard ~= x1.30 x x1.15 = x1.495." §15c repeats the multiplicative model ("base x 1.40 x 1.30 x 1.15 = base x 2.09"). Code is additive.

**Blast radius**: Every E1-E4 / Champion / league Rival / post-HoF Mystery / Crucible-Hard fight scales differently than the spec's worked examples; any balance reasoning or QA derived from the spec's numbers is wrong. The spec's headline Champion-HP figures are unreachable in code.

**Fix sketch**: Update STORY_MODE_FLOW.md §8 and §15c to describe the additive stacking model that ships (and the cliff it intentionally removes), or change the code back to multiplicative if the spec is authoritative on intent.

**Verification**: Pick one foe, log `mon.maxHp` before/after `applyFoeDifficultyScaling` on Hard for E1; confirm it matches whichever model is declared canonical.

---
severity: P2
category: inconsistency
anchor_symbol: FOE_STAT_NERF_BY_CITY
current_line_hint: ~14493
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 02e46f6ff336
confidence: high
status: open
---

**Title**: Early-game softening uses city-indexed [0.80,0.85,0.90]; spec §8/§15f names badge/event constants

**Evidence**:
```js
const FOE_STAT_NERF_BY_CITY = [0.80, 0.85, 0.90]; // index = city; City >=3 -> 1.0
// _earlyGameFoeStatMult() keys on nearest preceding City row index, returns this array.
```

**Repro**: STORY_MODE_FLOW.md §8/§15f describe `PRE_GYM1_FOE_STAT_MULT = 0.82`, `EARLY_GL_FOE_STAT_MULT = 0.95` (GL1/GL2), `EARLY_GAME_FOE_STAT_MULT = 0.92`, `STAGE2_GL_FOE_STAT_MULT = 0.97` (GL3) — keyed on badges + event type with a per-Gym-Leader exemption. None of those four constants exist (grep = 0). Shipped values and keying model (city index, no GL exemption, ends at City 3) differ entirely.

**Blast radius**: The spec's entire §8 "Early-game softening" table and §15f "Anti-bricking" table are fictional vs. code; GL1/GL2 are softened to 0.85/0.90 of their *city* (not the spec'd 0.95), and GL3 gets no special STAGE2 multiplier. Anyone tuning the early curve from the spec edits constants that do not exist.

**Fix sketch**: Rewrite STORY_MODE_FLOW.md §8 and §15f to document `FOE_STAT_NERF_BY_CITY` and the city-indexed model (and the separate `_stageGatedFoeStatMult` event-keyed curve), or refactor the code to the named-constant badge/event model the spec describes.

**Verification**: Confirm the doc's named constants resolve via find-anchor; or confirm the spec table matches `FOE_STAT_NERF_BY_CITY` + `_stageGatedFoeStatMult` output for GL1/GL2/GL3.

---
severity: P2
category: inconsistency
anchor_symbol: storyStripGrade4IfPartyMature
current_line_hint: ~35699
file: battle.html
agents: [spec-drift-auditor]
fingerprint: c199cd9db37a
confidence: high
status: open
---

**Title**: G4-strip keys on party-size (partyEverReached2), not badges; contradicts spec's "most important refactor"

**Evidence**:
```js
function storyStripGrade4IfPartyMature(gw) {
    if (!gw || !sm || !sm.active) return gw;
    const len = Array.isArray(sm.team) ? sm.team.length : 0;
    if (len >= 2) sm.partyEverReached2 = true;
    if (!sm.partyEverReached2) return gw;   // gate is party-size-ever, NOT badges
```

**Repro**: STORY_MODE_FLOW.md §12 ("keys the strip on `sm.badges < 1`") and §15f ("now gated on `badges < 2`") both say badges. §12/B2 calls moving difficulty signals off `sm.team.length` to `sm.badges` "the single most important refactor." Code still keys on team length (latched via `partyEverReached2`), never reads `sm.badges` here.

**Blast radius**: A player who beats the intro rival 1v1 but never reaches a 2-mon party (declines catch tutorial fill / immediately deposits) keeps the G4 ramp regardless of badge count; the latch fixes the PC-deposit exploit but the gate is still party-derived, not the monotonic badge clock the spec mandates. Wild/foe grade rolls diverge from the documented badge thresholds.

**Fix sketch**: Re-key the strip on `sm.badges` per spec (§12 says `< 1`, §15f says `< 2` — reconcile which), or update both spec sections to document the `partyEverReached2` latch model that ships.

**Verification**: Set `sm.badges = 0`, `sm.team.length = 2`; confirm whether the strip fires (badge model: no; current code: yes).

---
severity: P2
category: inconsistency
anchor_symbol: STORY_WILD_GRADE_BY_CITY
current_line_hint: ~48903
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 4b355ba97b85
confidence: high
status: open
---

**Title**: Wild grade curve is city-keyed STORY_WILD_GRADE_BY_CITY; spec names badge-keyed _WILD_GRADE_CURVE_BY_BADGES

**Evidence**:
```js
const STORY_WILD_GRADE_BY_CITY = [
    { g1:0,g2:0,g3:0,g4:100 }, // C0 ... keyed on arrived CITY index (0-7)
    ...
];
function _wildGradeWeightsForCity(city) { ... }
```

**Repro**: STORY_MODE_FLOW.md §3, §13(M2), §15f, §15g all reference `_WILD_GRADE_CURVE_BY_BADGES` "keyed on `sm.badges` (0-8)" as the wild grade source. grep = 0 matches; it does not exist. The shipped table is `STORY_WILD_GRADE_BY_CITY` keyed on city index. §15g's "G2 leak ramp" table (badges 6/7/8 -> g2 3/5/8) also does not match the city table (C5 g2:10, C6 g2:15, C7 g2:20).

**Blast radius**: Any reader trying to tune wild rarity from the spec edits a non-existent badge-keyed constant; the actual curve advances on city arrival, not badge count, so a player who is under-badged for their city sees richer wilds than the badge model implies. Spec's §3/§15f/§15g wild tables are all fictional.

**Fix sketch**: Update §3/§13/§15f/§15g to document `STORY_WILD_GRADE_BY_CITY` / `_wildGradeWeightsForCity` and the city-keyed model, or introduce the badge-keyed constant the spec describes.

**Verification**: find-anchor `_WILD_GRADE_CURVE_BY_BADGES` -> still missing; confirm `_wildGradeWeightsForCity` is the live path from `rollWildEncounter`.

---
severity: P2
category: inconsistency
anchor_symbol: catchMode
current_line_hint: n/a
file: battle.html
agents: [spec-drift-auditor]
fingerprint: c26048440b8d
confidence: high
status: open
---

**Title**: STORY_FEATURES_INTEGRATION "shipped" sections gate balls/PC/wild on catchMode; no such setting exists

**Evidence**:
```text
docs/STORY_FEATURES_INTEGRATION.md (sections marked "Shipped and live: §1, §2, §4"):
  §1 "Sold at Poké Mart only when catchMode is on"
  §2 "Button PC Box when catchMode or sm.pcBox.length > 0"
  §8 "catch + PC + balls still work if catchMode on"
grep catchMode battle.html -> 0 matches.
```

**Repro**: grep `catchMode` across battle.html returns nothing. Catching is gated by `sm.catchTutorialDone` (set after the intro rival), per STORY_MODE_FLOW.md §10 — there is no per-run catch toggle. The integration doc's live sections still describe a `catchMode` flag.

**Blast radius**: A reader following the integration doc looks for a non-existent setting to enable/disable catching; the de-scope status block at the top vouches §1/§2/§4 as "shipped and live" while their gating mechanism (`catchMode`) was never implemented. Prior audit (STORY_MODE_AUDIT.md §1) already noted "Catch mode is undefined in code" — still unreconciled in the integration doc.

**Fix sketch**: Update the §1/§2/§4 "shipped" copy in STORY_FEATURES_INTEGRATION.md to reference the real gate (`catchTutorialDone`, always-on catching), removing `catchMode` from the live sections.

**Verification**: grep `catchMode` -> 0; confirm PC button / mart ball rows gate on `catchTutorialDone` / `pcBox.length`.

---
severity: P3
category: inconsistency
anchor_symbol: SAFARI_ENTRY_COST
current_line_hint: ~47912
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 44622866c38b
confidence: high
status: open
---

**Title**: STORY_FEATURES_INTEGRATION §4 lists Safari fee ~500G; code + canonical flow say 10,000G

**Evidence**:
```js
const SAFARI_ENTRY_COST = 10000;   // battle.html:47912
```

**Repro**: docs/STORY_FEATURES_INTEGRATION.md §4 (a "Shipped and live" section): "Fee ~500G entry (tune)". STORY_MODE_FLOW.md §4 says `SAFARI_ENTRY_COST (10,000G)`, which matches code. The integration doc is 20x off. (Also note: the stale CODEBASE_MAP.md says "entry 2,500G" then "800G" — both also wrong.)

**Blast radius**: Cosmetic doc drift only; the canonical flow and code agree at 10,000G. Misleads anyone reading the integration doc for the live number.

**Fix sketch**: Update STORY_FEATURES_INTEGRATION.md §4 to 10,000G (or point it at STORY_MODE_FLOW.md §4 as canonical).

**Verification**: One-line grep diff: doc says 10,000G matching `SAFARI_ENTRY_COST`.

---
severity: P3
category: inconsistency
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~32538
file: battle.html
agents: [spec-drift-auditor]
fingerprint: e72599329786
confidence: medium
status: open
---

**Title**: Mystery Figure roster collapsed to single 'the_first' (v22); STORY_NARRATIVE_VARIANTS still documents 9-identity cast

**Evidence**:
```js
// v22 3-track collapse: the 7 trainer-cameo identities + 2 variant-exclusive
// identities (9 total: cyrus, ghetsis, ...) are retired in favor of The First.
const MYSTERY_FIGURE_IDENTITIES = { the_first: { sprite: 'Red', reveal: 'The First', ... } };
```

**Repro**: docs/STORY_NARRATIVE_VARIANTS.md (line ~618, `battle.html:26426`) and the prior design refer to `MYSTERY_FIGURE_IDENTITIES` as a rotating multi-identity cast. Code now has exactly one identity (`the_first`); the comment explicitly says the 9-identity cast was "retired" per STORY_3TRACK_IMPL_PLAN.md decision 5.

**Blast radius**: Narrative-variants doc describes mystery-figure rotation that no longer occurs; a writer extending the cast from that doc would re-introduce retired identities. Anchor `battle.html:26426` also stale (now ~32538).

**Fix sketch**: Add a note to STORY_NARRATIVE_VARIANTS.md that the multi-identity roster was collapsed to `the_first` in v22, or revive the roster if rotation is still intended.

**Verification**: Confirm `MYSTERY_FIGURE_IDENTITIES` has one key; cross-check STORY_3TRACK_IMPL_PLAN.md decision 5.

---
severity: P3
category: dx
anchor_symbol: SAVE_VER
current_line_hint: ~34133
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 5614d348ca6e
confidence: high
status: open
---

**Title**: SAVE_VER is 22 with v21/v22 migrations; spec + ANCHOR_INDEX + CODEBASE_MAP stop at 15-20

**Evidence**:
```js
const SAVE_VER = 22;   // battle.html:34133
// migrations present: PreV8, PreV15, PreV16, PreV17, (V18 = diacritic-only), PreV19, PreV20, PreV21, PreV22
```

**Repro**: `agent-state/ANCHOR_INDEX.md` lists only `migrateStoryPreV15` and implies `SAVE_VER = 15`; `agent-state/CODEBASE_MAP.md` says `SAVE_VER = 15`. STORY_MODE_FLOW.md's deepest migration sections describe v19/v20 (§15b, §15f-15h) and never mention v21 (`relative egg-hatch`) or v22 (`3-track`). No spec section documents the v21/v22 schema changes.

**Blast radius**: Migration-completeness audits (required check #3) cannot map v21/v22 to a documented pre-migration schema; an agent trusting the docs would think v15 is current and mis-handle 7 newer save versions. Note v18 is intentionally a diacritic-only content migration (`migrateStoryTrainerDiacriticsPreV18`), not a schema gap — that part is fine.

**Fix sketch**: Add v21 (relative egg-hatch) and v22 (3-track collapse) schema sections to STORY_MODE_FLOW.md; refresh CODEBASE_MAP.md's `SAVE_VER` line.

**Verification**: Spec lists a migration subsection for each of v15-v22; CODEBASE_MAP shows `SAVE_VER = 22`.

---
severity: P3
category: dx
anchor_symbol: CODEBASE_MAP
current_line_hint: n/a
file: agent-state/CODEBASE_MAP.md
agents: [spec-drift-auditor]
fingerprint: ae3dcf22fd06
confidence: high
status: open
---

**Title**: CODEBASE_MAP guardrails grossly stale: claims 29,908 lines / CSS 16-4156; file is 60,040 lines

**Evidence**:
```text
CODEBASE_MAP.md: "battle.html — 29,908 lines"; "CSS | 16 - 4156"; "SAVE_VER = 15";
"STORY_EVENTS_RAW (68 rows) | ~22638"; "Safari (entry 2,500G ...)" then "800G entry"
Actual: 60,040 lines; SAVE_VER 22; STORY_EVENTS_RAW @ 29828; SAFARI_ENTRY_COST 10000.
```

**Repro**: `wc -l battle.html` -> 60040 (CODEBASE_MAP says 29,908 — file has grown >100%). Every line number in its anchor table is ~2x low. The "CSS = lines 16-4156" load-bearing guardrail is wrong (file doubled). The header even warns the table is stale and points to ANCHOR_INDEX.md, but the prose body (line counts, Safari cost, SAVE_VER, implementation-status section) is also stale and unmarked.

**Blast radius**: Any agent that reads CODEBASE_MAP for orientation (it's the documented first-read in HANDOFF "Resume protocol") gets a wrong size, wrong CSS bounds, wrong SAVE_VER, and contradictory Safari numbers. ANCHOR_INDEX.md is the fresh source but is far less complete.

**Fix sketch**: Regenerate CODEBASE_MAP's line counts and prose (size, CSS bounds, SAVE_VER, Safari cost, M0-M6 status) from current code, or demote it to a pure prose/architecture doc and delete all numeric anchors in favor of ANCHOR_INDEX.md.

**Verification**: CODEBASE_MAP line-count matches `wc -l battle.html`; CSS bound and SAVE_VER match grep.

---
severity: P3
category: dx
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29828
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 6321f44e5d84
confidence: high
status: open
---

**Title**: Doc battle.html:LINE anchors stale across specs (18/50 drifted) + several renamed symbols

**Evidence**:
```text
STORY_MODE_FLOW.md:53  battle.html:21273  STORY_EVENTS_RAW  -> now 29828
STORY_MODE_FLOW.md:123 battle.html:28560  catchRate tables  -> _CATCH_RATE_BY_GRADE @ 48669
STORY_MODE_FLOW.md:584 battle.html:34883  makeWildBuild     -> now 49061
NARRATIVE_VARIANTS:612 battle.html:30566  STORY_BEATS       -> now 39046
NARRATIVE_VARIANTS:619 battle.html:33069  _showIntroRivalColdOpen -> now 46455
```

**Repro**: `node scripts/debug/spec-drift.mjs` -> "18/50 battle.html:LINE references appear to have drifted." All 50 refs were written against a ~21k-30k file; battle.html is now 60,040 lines so virtually every numeric anchor is wrong. Symbols still exist; only line numbers drifted (expected) — but the spec text presents them as current.

Separately, several spec function-name anchors are RENAMED in code (feature present, doc name wrong): `_WILD_GRADE_CURVE_BY_BADGES` -> `STORY_WILD_GRADE_BY_CITY`; `_storyMaxSigGradeForGw` -> `_storySigGradeCeiling`; `_daycareHatch` -> `_daycareRunSecret`/`_daycareRollHatchSpecies`; `enterStoneEmporium` -> `enterStoneShop`; `_seedFanClubAcrossCities` (no equivalent; Fan Club seeded inline in renderCityActions). Representative sample of 5 listed above.

**Blast radius**: Low individually (symbols resolve via find-anchor) but high in aggregate: the spec's "jump to battle.html:LINE" affordance (§intro) is non-functional, and the renamed-symbol cases can make a reader believe a feature is missing when it ships under a new name.

**Fix sketch**: Run `npm run debug:spec-drift` and bulk-update the docs' line numbers (or strip them in favor of symbol names per the spec's own anchor-drift note). Fix the 5 renamed-symbol anchors above so find-anchor resolves them.

**Verification**: `node scripts/debug/spec-drift.mjs` reports 0 drifted refs after update; the 5 renamed symbols resolve via `symbol-index.mjs --lookup`.

