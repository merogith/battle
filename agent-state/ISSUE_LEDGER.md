# Issue Ledger — Pokemon Battle Arena

> **Generated**: 2026-05-28T22:37:42.928Z
> **Source**: `agent-state/findings/*.md` (23 unique findings after dedup)
> **Regenerate**: `node scripts/debug/issue-ledger.mjs`
> **Schema**: see `agent-state/LEDGER_SCHEMA.md`

This file is **regenerated**, not hand-edited. To add an issue, drop a
finding file into `agent-state/findings/` and re-run the ledger. To update
status, edit the corresponding finding file and re-run.

## Summary

| Severity | Count |
|---|---|
| P0 | 0 |
| P1 | 5 |
| P2 | 7 |
| P3 | 11 |
| **Total** | **23** |

| Category | Count |
|---|---|
| data | 5 |
| dx | 4 |
| inconsistency | 13 |
| refactor | 1 |

## TOC

- [ISSUE-001] [P1] League foe boost now stacks ADDITIVELY with difficulty; spec §8/§15c documents multiplicative — `applyFoeDifficultyScaling` (inconsistency)
- [ISSUE-002] [P1] Fresh story run starts with 0 Poké Balls; spec promises 5 in three places — `balls` (inconsistency)
- [ISSUE-003] [P1] canMove() paralysis + confusion self-hit rolls use bare Math.random() — seeded-replay drift — `canMove` (inconsistency)
- [ISSUE-004] [P1] parseMoveEffects() secondary-effect / Tri Attack / Stench rolls use bare Math.random() — RNG drift — `parseMoveEffects` (inconsistency)
- [ISSUE-005] [P1] Bare `sm` in startBattle is a ReferenceError — story boss/raid mechanics silently never init — `startBattle` (inconsistency)
- [ISSUE-006] [P2] STORY_FEATURES_INTEGRATION "shipped" sections gate balls/PC/wild on catchMode; no such setting exists — `catchMode` (inconsistency)
- [ISSUE-007] [P2] Fallback build mirror (gen*.json) carries 213 builds with illegal EV totals >510 absent from authoritative builds.csv — `convertSmogonSet` (data)
- [ISSUE-008] [P2] gen4.json mirror has a Gen-9-only `teratypes` field on a Gen-4 build (Quagsire/pu/Defensive) — `fetchSmogonSetsForGen` (data)
- [ISSUE-009] [P2] Early-game softening uses city-indexed [0.80,0.85,0.90]; spec §8/§15f names badge/event constants — `FOE_STAT_NERF_BY_CITY` (inconsistency)
- [ISSUE-010] [P2] online-pvp.js repeats the "fetch room data blob + error-check + extract prev" block 8× — `reportWinIfConfigured` (refactor)
- [ISSUE-011] [P2] Wild grade curve is city-keyed STORY_WILD_GRADE_BY_CITY; spec names badge-keyed _WILD_GRADE_CURVE_BY_BADGES — `STORY_WILD_GRADE_BY_CITY` (inconsistency)
- [ISSUE-012] [P2] G4-strip keys on party-size (partyEverReached2), not badges; contradicts spec's "most important refactor" — `storyStripGrade4IfPartyMature` (inconsistency)
- [ISSUE-013] [P3] CODEBASE_MAP guardrails grossly stale: claims 29,908 lines / CSS 16-4156; file is 60,040 lines — `CODEBASE_MAP` (dx)
- [ISSUE-014] [P3] 6 builds in the gen*.json mirror are missing the `nature` field; the authoritative builds.csv has zero blank-nature rows — `convertSmogonSet` (data)
- [ISSUE-015] [P3] 60 gym leaders (and Champion Hau) have per-name victory lines but no per-name intro pool — `LEADER_VICTORY_LINES` (inconsistency)
- [ISSUE-016] [P3] `No Item` held-slot sentinel is a code-only string; it has no entry in items.json (enum lives only in battle.html) — `loadBuildsCSV` (data)
- [ISSUE-017] [P3] Unguarded 'dex probe Pikachu' console.log left in the data-load path — `loadGameData` (dx)
- [ISSUE-018] [P3] Engine loads only the `"9"` gen key from each data JSON; ~2800 older-gen `inherit:true` delta entries are shipped but never read — `loadGameData` (data)
- [ISSUE-019] [P3] 'All Out Pummeling' SFX entry is dead; canonical 'All-Out Pummeling' plays Counter SFX — `MOVE_SFX_MAP` (inconsistency)
- [ISSUE-020] [P3] Mystery Figure roster collapsed to single 'the_first' (v22); STORY_NARRATIVE_VARIANTS still documents 9-identity cast — `MYSTERY_FIGURE_IDENTITIES` (inconsistency)
- [ISSUE-021] [P3] STORY_FEATURES_INTEGRATION §4 lists Safari fee ~500G; code + canonical flow say 10,000G — `SAFARI_ENTRY_COST` (inconsistency)
- [ISSUE-022] [P3] SAVE_VER is 22 with v21/v22 migrations; spec + ANCHOR_INDEX + CODEBASE_MAP stop at 15-20 — `SAVE_VER` (dx)
- [ISSUE-023] [P3] Doc battle.html:LINE anchors stale across specs (18/50 drifted) + several renamed symbols — `STORY_EVENTS_RAW` (dx)

---

## <a id="ISSUE-001"></a> ISSUE-001: League foe boost now stacks ADDITIVELY with difficulty; spec §8/§15c documents multiplicative

---
id: ISSUE-001
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

## <a id="ISSUE-002"></a> ISSUE-002: Fresh story run starts with 0 Poké Balls; spec promises 5 in three places

---
id: ISSUE-002
severity: P1
category: inconsistency
anchor_symbol: balls
current_line_hint: ~34902
file: battle.html
agents: [spec-drift-auditor]
fingerprint: 3a000383b7a4
confidence: high
status: open
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

## <a id="ISSUE-003"></a> ISSUE-003: canMove() paralysis + confusion self-hit rolls use bare Math.random() — seeded-replay drift

---
id: ISSUE-003
severity: P1
category: inconsistency
anchor_symbol: canMove
current_line_hint: ~26039
file: battle.html
agents: [consistency-auditor]
fingerprint: 4ac6708be8d3
confidence: high
status: open
---

**Title**: canMove() paralysis + confusion self-hit rolls use bare Math.random() — seeded-replay drift

**Evidence**:
```js
// canMove(mon, moveName) — per-turn move gate. Thaw (just above) uses storyAwareRng();
const _thawRng = storyAwareRng();
if (_thawRng() < 0.2) { mon.status = null; /* thawed */ }
...
if (mon.status === "PAR" && Math.random() < 0.25) { /* fully paralyzed */ return false; }  // bare
...
else if (Math.random() < 0.3333) { /* hurt itself in confusion */ }                          // bare
```

**Repro**: Load a story run with a fixed `?seed=`, get a mon paralyzed/confused, replay the same seed — paralysis-skip and confusion self-hit outcomes diverge between runs because they read `Math.random()` instead of the seeded `window.storyRngNext`. The adjacent thaw roll (26035) is already seeded, proving the migration was partial.

**Blast radius**: Any seeded story battle involving PAR or confusion; shared-seed replays; daily-seed determinism. These are turn-order-deciding rolls, so divergence cascades through the whole battle.

**Fix sketch**: Route both rolls through `storyAwareRng()` (the helper at line 14499 already used by thaw two lines above), e.g. `const _rng = storyAwareRng();` then `_rng() < 0.25` / `_rng() < 0.3333`.

**Verification**: `tests/integration` seeded-replay assertion — same seed must produce identical PAR-skip / confusion-self-hit sequence across two runs.

---

## <a id="ISSUE-004"></a> ISSUE-004: parseMoveEffects() secondary-effect / Tri Attack / Stench rolls use bare Math.random() — RNG drift

---
id: ISSUE-004
severity: P1
category: inconsistency
anchor_symbol: parseMoveEffects
current_line_hint: ~26833
file: battle.html
agents: [consistency-auditor]
fingerprint: f57279301c3b
confidence: high
status: open
---

**Title**: parseMoveEffects() secondary-effect / Tri Attack / Stench rolls use bare Math.random() — RNG drift

**Evidence**:
```js
// parseMoveEffects() — core move-effect resolver. Generic secondary-effect gate:
const _secChance = (_sec.chance != null) ? _sec.chance : 100;
if (Math.random() * 100 >= _sg(_secChance)) continue;   // bare — every secondary status/flinch
// also: Tri Attack burn/par/frz pick (26805/26806), Stench flinch (26852), Bounce-par (26157),
// status-secondary at 26268. ~27 bare Math.random() calls live in the 24400–28700 battle band.
```

**Repro**: Seeded story battle, use any move with a secondary effect (e.g. Flamethrower 10% burn, Tri Attack, an Air Slash flinch). Replay the same seed — proc/no-proc differs because the roll is unseeded. Sibling code in the same region (cursed-pick at 25014, thaw at 26035) correctly uses the seeded path, confirming an incomplete migration.

**Blast radius**: All seeded story battles with secondary-effect moves, Tri Attack, Stench, Bounce. Roughly 27 bare Math.random() sites in the battle-resolution band (lines ~24400–28700) bypass the seeded RNG; this finding anchors the parseMoveEffects cluster (secondary-effect gate is the highest-frequency one).

**Fix sketch**: Introduce one `storyAwareRng()`-backed `_rng` at the top of `parseMoveEffects` and replace the in-loop `Math.random()` calls; audit the full 24400–28700 band so no battle-deciding roll stays on bare Math.random.

**Verification**: Seeded-replay integration test that fires a fixed sequence of secondary-effect moves and asserts identical proc outcomes across two runs of the same seed.

---

## <a id="ISSUE-005"></a> ISSUE-005: Bare `sm` in startBattle is a ReferenceError — story boss/raid mechanics silently never init

---
id: ISSUE-005
severity: P1
category: inconsistency
anchor_symbol: startBattle
current_line_hint: ~16806
file: battle.html
agents: [consistency-auditor]
fingerprint: d9a014e94e28
confidence: high
status: open
---

**Title**: Bare `sm` in startBattle is a ReferenceError — story boss/raid mechanics silently never init

**Evidence**:
```js
// startBattle() at script-top scope (line 16663). 69 lines above this, the
// CORRECT _smRef was already created (line 16737). Then it regresses:
try {
    const _beatKey = sm && sm._activeBeatBattleKey;   // <-- bare 'sm': ReferenceError
    const _cfg = _beatKey && typeof BOSS_CONFIGS === 'object' && BOSS_CONFIGS[_beatKey];
    if (_cfg && Array.isArray(_cfg.mechanics) && _cfg.mechanics.length) { /* boss field locks, HP-threshold mechs */ }
} catch (e) { console.warn('[Story] BOSS_CONFIGS init failed:', e); }   // swallows the ReferenceError
```

**Repro**: `let sm` lives only inside the StoryMode IIFE (lines 29302–59694); `startBattle` is at script-top (16663). Reading bare `sm` at 16806 throws `ReferenceError: sm is not defined` on every story beat-boss battle. The enclosing try/catch (16805–16815) downgrades it to a single `console.warn`, so `_storyBossMechanicsBattleInit` never runs. This is the identical mistake the comment at line 16732 documents as already-fixed for `crucibleHardMode` — the same fix was not applied here.

**Blast radius**: Every BOSS_CONFIGS-driven story battle (beat bosses, raids, miniBosses). Field locks set move-1, HP-threshold mechanics, telegraphed immunity rounds — all skipped. `_activeBeatBattleKey` IS correctly set at line 46653 (inside the IIFE), so the feature is intended to fire; only the read site is broken.

**Fix sketch**: Replace bare `sm` at line 16806 with `_smRef` (already declared at 16737 in the same function), matching the documented script-top pattern.

**Verification**: Open any story beat-boss battle with a BOSS_CONFIGS entry; confirm `state._bossMechanics` is populated and the field-lock telegraph fires. A seeded story-flow test that enters a boss beat and asserts `_bossMechanics.length > 0` would catch the regression.

---

## <a id="ISSUE-006"></a> ISSUE-006: STORY_FEATURES_INTEGRATION "shipped" sections gate balls/PC/wild on catchMode; no such setting exists

---
id: ISSUE-006
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

## <a id="ISSUE-007"></a> ISSUE-007: Fallback build mirror (gen*.json) carries 213 builds with illegal EV totals >510 absent from authoritative builds.csv

---
id: ISSUE-007
severity: P2
category: data
anchor_symbol: convertSmogonSet
current_line_hint: ~12211
file: data/builds/gen8.json
agents: [data-integrity-auditor]
fingerprint: 364230245444
confidence: high
status: open
---

**Title**: Fallback build mirror (gen*.json) carries 213 builds with illegal EV totals >510 absent from authoritative builds.csv

**Evidence**:
```js
// data/builds/gen8.json — Mewtwo/balancedhackmons/Sheer Force
{"moves":["Nasty Plot","Psychic","Blue Flare",["Strength Sap","Ice Beam"]],
 "ability":"Sheer Force","item":"Life Orb","ivs":{"atk":0},
 "evs":{"hp":252,"def":252,"spa":252,"spd":252,"spe":252}}  // sum = 1260 (cap is 510)
// convertSmogonSet (battle.html:12245) passes evs straight through — no total clamp.
```

**Repro**: `node -e 'const d=require("./data/builds/gen8.json");const e=d.Mewtwo.balancedhackmons["Sheer Force"].evs;console.log(Object.values(e).reduce((a,b)=>a+b,0))'` → 1260. Authoritative source has none: scan of `data/builds.csv` yields 0 rows with EV total >510 (counts: gen5=1, gen6=3, gen7=47, gen8=125, gen9=37; total 213 in the mirror, 0 in CSV).

**Blast radius**: `data/builds/gen*.json` is the offline fallback consumed by `fetchSmogonSetsForGen` → `populateCsvBuildsFromAPI` when `builds.csv` can't be fetched (e.g. file:// protocol). On that path `convertSmogonSet` does not validate EV totals, so a Pokémon can be built with 1260 EVs, producing stats no legal Pokémon can reach. The CSV (primary path) is clean, so this only bites the fallback.

**Fix sketch**: Regenerate the gen*.json mirror from the same pipeline that produced builds.csv (they have drifted), or add a total-EV clamp/normalization in `convertSmogonSet`. Treat the CSV as the single source of truth and make the JSON a derived artifact.

**Verification**: After regeneration, `node` scan over all `data/builds/gen*.json` for `sum(evs) > 510` returns 0, matching the CSV.

---

## <a id="ISSUE-008"></a> ISSUE-008: gen4.json mirror has a Gen-9-only `teratypes` field on a Gen-4 build (Quagsire/pu/Defensive)

---
id: ISSUE-008
severity: P2
category: data
anchor_symbol: fetchSmogonSetsForGen
current_line_hint: ~12169
file: data/builds/gen4.json
agents: [data-integrity-auditor]
fingerprint: 51f176d8cb95
confidence: high
status: open
---

**Title**: gen4.json mirror has a Gen-9-only `teratypes` field on a Gen-4 build (Quagsire/pu/Defensive)

**Evidence**:
```js
// data/builds/gen4.json — Quagsire/pu/Defensive
{"moves":[["Toxic","Curse"],"Recover","Earthquake","Waterfall"],
 "ability":"Water Absorb","item":"Leftovers","nature":"Impish",
 "evs":{"hp":252,"def":200,"spd":56},"teratypes":"Water"}  // Tera is Gen 9 only
```

**Repro**: `node -e 'const d=require("./data/builds/gen4.json");console.log(d.Quagsire.pu.Defensive.teratypes)'` → `Water`. Terastallization did not exist before Gen 9. The authoritative CSV row `Quagsire,regular,4,pu,...` has an empty `teratypes` column (and a different tag), so the mirror entry does not even correspond to the CSV row.

**Blast radius**: Low/cosmetic. `convertSmogonSet` will pass the stray `teratypes` into `_teratypes`, so a Gen-4 Quagsire in the fallback path could be offered a Tera type, which is a mechanic that should not exist in a Gen-4 context. Symptom of the mirror being regenerated from a different/newer pass than the CSV.

**Fix sketch**: Regenerate the mirror from the CSV (single source of truth); the generator should drop `teratypes` for any build whose `gen < 9`.

**Verification**: `node` scan over `data/builds/gen[4-8].json` for any build carrying `teratypes`/`teraType` returns 0.

---

## <a id="ISSUE-009"></a> ISSUE-009: Early-game softening uses city-indexed [0.80,0.85,0.90]; spec §8/§15f names badge/event constants

---
id: ISSUE-009
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

## <a id="ISSUE-010"></a> ISSUE-010: online-pvp.js repeats the "fetch room data blob + error-check + extract prev" block 8×

---
id: ISSUE-010
severity: P2
category: refactor
anchor_symbol: reportWinIfConfigured
current_line_hint: ~585
file: online-pvp.js
agents: [consistency-auditor]
fingerprint: b45637efa253
confidence: medium
status: open
---

**Title**: online-pvp.js repeats the "fetch room data blob + error-check + extract prev" block 8×

**Evidence**:
```js
// Repeated near-verbatim at lines 585, 610, 661, 690, 723, 761 (and variants at 265, 417):
const { data: row, error: rowErr } = await sb.from('pvp_rooms').select('data').eq('id', roomId).single();
if (rowErr || !row || row.data == null) { console.warn('[OnlinePvP] <tag> fetch', rowErr); return; }
const prev = row.data;
```

**Repro**: `grep -nE "from\('pvp_rooms'\).select\('data'\).eq\('id', roomId\)" online-pvp.js` → 8+ structurally identical blocks differing only in the console.warn tag and single() vs maybeSingle().

**Blast radius**: Maintenance risk — any change to the room-fetch contract (column name, error shape, retry policy) must be edited in 8 places; easy to miss one and create inconsistent error handling across the PvP sync paths.

**Fix sketch**: Extract a single `async fetchRoomData(tag)` helper returning `{ prev }` or `null` (logging the tagged warn on failure), and call it from each site.

**Verification**: PvP smoke test (host + guest turn exchange) still completes; no behavioral change expected — pure consolidation.

---

## <a id="ISSUE-011"></a> ISSUE-011: Wild grade curve is city-keyed STORY_WILD_GRADE_BY_CITY; spec names badge-keyed _WILD_GRADE_CURVE_BY_BADGES

---
id: ISSUE-011
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

## <a id="ISSUE-012"></a> ISSUE-012: G4-strip keys on party-size (partyEverReached2), not badges; contradicts spec's "most important refactor"

---
id: ISSUE-012
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

## <a id="ISSUE-013"></a> ISSUE-013: CODEBASE_MAP guardrails grossly stale: claims 29,908 lines / CSS 16-4156; file is 60,040 lines

---
id: ISSUE-013
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

## <a id="ISSUE-014"></a> ISSUE-014: 6 builds in the gen*.json mirror are missing the `nature` field; the authoritative builds.csv has zero blank-nature rows

---
id: ISSUE-014
severity: P3
category: data
anchor_symbol: convertSmogonSet
current_line_hint: ~12238
file: data/builds/gen5.json
agents: [data-integrity-auditor]
fingerprint: d5fa11ffea9f
confidence: high
status: open
---

**Title**: 6 builds in the gen*.json mirror are missing the `nature` field; the authoritative builds.csv has zero blank-nature rows

**Evidence**:
```js
// data/builds/gen5.json — Aron/vgc2012/Level 1 Sturdy (no "nature" key)
{"moves":["Endeavor","Toxic","Sleep Talk","Protect"],"item":"Berry Juice"}
// also: Solosis/vgc2012/FEAR, gen8 Mewtwo/balancedhackmons/Sheer Force,
// gen9 Landorus/godlygift, Great Tusk/ubersuu, Iron Treads/ubersuu
```

**Repro**: `node -e 'const d=require("./data/builds/gen5.json");console.log("nature" in d.Aron.vgc2012["Level 1 Sturdy"])'` → false. CSV scan (`nature` is column 8) shows 0 blank-nature rows across 17397 rows.

**Blast radius**: Low. The fallback consumer `convertSmogonSet` (battle.html:12238) defaults a missing nature to `'Hardy'`, so the build still loads — but Hardy is neutral, silently dropping the intended nature (e.g. the Aron set is a Level-1 FEAR set whose nature is irrelevant, but Great Tusk/Iron Treads scarf sets lose their speed/offense nature). Only on the offline fallback path.

**Fix sketch**: Regenerate the mirror from the CSV pipeline (same root cause as the EV-total drift) so every build carries the CSV's nature, or have the generator emit the CSV default (`Hardy`) explicitly rather than omitting the key.

**Verification**: `node` scan over `data/builds/gen*.json` for builds lacking a `nature` key returns 0.

---

## <a id="ISSUE-015"></a> ISSUE-015: 60 gym leaders (and Champion Hau) have per-name victory lines but no per-name intro pool

---
id: ISSUE-015
severity: P3
category: inconsistency
anchor_symbol: LEADER_VICTORY_LINES
current_line_hint: ~32045
file: battle.html
agents: [consistency-auditor]
fingerprint: 81701f439dcc
confidence: medium
status: open
---

**Title**: 60 gym leaders (and Champion Hau) have per-name victory lines but no per-name intro pool

**Evidence**:
```js
// LEADER_VICTORY_LINES has 71 named leaders (+ LEADER_BADGE_REFLECTIONS, fully paired).
// TRAINER_QUOTES_BY_NAME only carries intro pools for ~11 of them (Brock, Misty, Lt. Surge,
// Erika, Koga, Sabrina, Blaine, Giovanni, Cynthia, Clair, Wallace…). The other 60
// (Falkner, Bugsy, Whitney, Roark, Milo, Nessa, Katy, Iono, Grusha, …) fall through to the
// generic 6-line TRAINER_QUOTES['Gym Leader'] pool. Hau has a CHAMPION_VICTORY_LINES entry
// but no TRAINER_QUOTES_BY_NAME intro pool.
```

**Repro**: Fight e.g. Leader "Iono" or "Grusha" in story mode — the badge-handover line is fully personalized, but the pre-battle intro is the generic "Enough talk. Show me the badge fight." class line. Asymmetric voicing within the same encounter.

**Blast radius**: Fanservice / polish only — not a bug (the role-pool fallback is intentional and correct). Elite Four are fully symmetric; this gap is leaders-only plus Hau.

**Fix sketch**: Add 2–3 per-name intro lines to TRAINER_QUOTES_BY_NAME for the 60 leaders that already have victory lines (and Hau), so intro and outro voicing match. Lower-priority content task, not a code fix.

**Verification**: Spot-check 3–4 of the previously-bare leaders in story mode and confirm a name-specific intro now appears.

---

## <a id="ISSUE-016"></a> ISSUE-016: `No Item` held-slot sentinel is a code-only string; it has no entry in items.json (enum lives only in battle.html)

---
id: ISSUE-016
severity: P3
category: data
anchor_symbol: loadBuildsCSV
current_line_hint: ~10454
file: data/items.json
agents: [data-integrity-auditor]
fingerprint: a937264b3e0e
confidence: medium
status: open
---

**Title**: `No Item` held-slot sentinel is a code-only string; it has no entry in items.json (enum lives only in battle.html)

**Evidence**:
```js
// battle.html:10454 (loadBuildsCSV) — the only declaration of the sentinel
i: !itemPicked ? '' : itemPicked === 'No Item' ? 'NO_ITEM' : itemPicked,
// data/items.json has no key "noitem" and no entry whose name === "No Item".
```

**Repro**: `node -e 'const i=require("./data/items.json")["9"];console.log(Object.keys(i).some(k=>k==="noitem")||Object.values(i).some(e=>e&&e.name==="No Item"))'` → false. The CSV uses the literal `No Item` in the `item` column; the engine special-cases it to `NO_ITEM` at load and the data-validator skips it. It works today, but the empty-held-item enum is defined implicitly in three places (CSV value `No Item`, runtime token `NO_ITEM`, display fallback) with no canonical declaration.

**Blast radius**: Low. No current bug — the string is handled. Risk is drift: a new code path that reads `mon.item` and looks it up in `items.json` (e.g. a new tooltip or shop screen) would miss the sentinel and either render nothing or crash, since `items.json` cannot resolve it. Same class of implicit-enum fragility as a missing reference.

**Fix sketch**: Document the empty-held-item sentinel contract in one place (constant + comment), or add a synthetic `No Item` / `NO_ITEM` entry to items.json (or a shared constants module) so every consumer resolves it identically. Read-only finding — no data edit performed.

**Verification**: Grep shows a single canonical definition of the empty-item sentinel; any `items.json` lookup of `mon.item` resolves for the empty slot without a special-case branch.

---

## <a id="ISSUE-017"></a> ISSUE-017: Unguarded 'dex probe Pikachu' console.log left in the data-load path

---
id: ISSUE-017
severity: P3
category: dx
anchor_symbol: loadGameData
current_line_hint: ~10153
file: battle.html
agents: [consistency-auditor]
fingerprint: 8ba77baaea7f
confidence: high
status: open
---

**Title**: Unguarded 'dex probe Pikachu' console.log left in the data-load path

**Evidence**:
```js
if (n === 0) {
    try {
        const probe = D.species.get('Pikachu');
        ...
        console.log('[SpriteScale] dex probe Pikachu', { id, heightmOnClass: ... });   // unguarded
    } catch (e) { console.log('[SpriteScale] dex probe failed', e); }
}
```

**Repro**: Load battle.html with a normal (non-debug) session and open the console — `[SpriteScale] dex probe Pikachu …` prints on every page load. Unlike the neighboring SpriteScale logs (10143, 10147) it is NOT gated behind `window.__DEBUG_SPRITE_SCALE` / `__DEBUG_LOADS`.

**Blast radius**: Console noise on every load; leftover developer probe shipped to production. No functional impact.

**Fix sketch**: Gate the probe behind `window.__DEBUG_SPRITE_SCALE` (matching the surrounding logs) or remove the `n === 0` probe block.

**Verification**: Reload without any `__DEBUG_*` flag set; confirm no `dex probe` line appears.

---

## <a id="ISSUE-018"></a> ISSUE-018: Engine loads only the `"9"` gen key from each data JSON; ~2800 older-gen `inherit:true` delta entries are shipped but never read

---
id: ISSUE-018
severity: P3
category: data
anchor_symbol: loadGameData
current_line_hint: ~10173
file: battle.html
agents: [data-integrity-auditor]
fingerprint: 0bb12c949196
confidence: high
status: open
---

**Title**: Engine loads only the `"9"` gen key from each data JSON; ~2800 older-gen `inherit:true` delta entries are shipped but never read

**Evidence**:
```js
const speciesJSON  = speciesJSONOrig['9'] || {};   // gens 1-8 discarded
const movesJSON    = movesJSONOrig['9']   || {};
const naturesJSON  = naturesJSONOrig['9'] || {};
const itemsJSON    = itemsJSONOrig['9']   || {};
const abilitiesJSON= abilitiesJSONOrig['9']|| {};
```

**Repro**: `node -e 'for(const f of ["moves","species","abilities","items"]){const o=require("./data/"+f+".json");const g9=new Set(Object.keys(o["9"]));let older=0;for(const g of Object.keys(o)){if(g==="9")continue;older+=Object.keys(o[g]).length;}console.log(f,older)}'` → moves 1253, species 504, abilities 463, items 606 older-gen entries. Every older-gen key also exists in gen 9, so these are Pokémon-Showdown per-gen override deltas (e.g. Bide `type:"???"` in gen 1/4), not distinct content — and the gen-9-only loader never applies them.

**Blast radius**: None functionally (the engine is intentionally a single-gen-9 dex), but ~2.8k dead delta entries inflate the four large JSON payloads (~1.9 MB combined) that load on every boot, and they invite future confusion ("why is my gen-4 Bide edit ignored?"). Pure dead-data / payload bloat.

**Fix sketch**: Either strip the non-`"9"` gen blocks from the shipped JSON (smaller boot payload) or, if multi-gen support is planned, wire a per-gen merge that actually applies `inherit:true` deltas. Document that the runtime is gen-9-only.

**Verification**: Boot-time payload shrinks; `Object.keys(JSON)` of each shipped data file is `["9"]` only (if stripped), or the loader demonstrably reads the chosen gen block (if multi-gen is added).

---

## <a id="ISSUE-019"></a> ISSUE-019: 'All Out Pummeling' SFX entry is dead; canonical 'All-Out Pummeling' plays Counter SFX

---
id: ISSUE-019
severity: P3
category: inconsistency
anchor_symbol: MOVE_SFX_MAP
current_line_hint: ~15
file: move-sfx-map.js
agents: [consistency-auditor]
fingerprint: 6d3450d7cd4d
confidence: high
status: open
---

**Title**: 'All Out Pummeling' SFX entry is dead; canonical 'All-Out Pummeling' plays Counter SFX

**Evidence**:
```js
// move-sfx-map.js line 15 — space form, NEVER matched (no move is named this):
'All Out Pummeling': ['…PRSFX- All Out Pummeling1.wav', '…2.wav', '…3.wav'],
// line 776 — hyphen form (the canonical name) points at generic Counter SFX:
'All-Out Pummeling': ['…PRSFX- Counter1.wav', '…PRSFX- Counter2.wav'],
```

**Repro**: Canonical move name is `'All-Out Pummeling'` (battle.html:14031, 15160; move-anim-map.js:17). `AudioSystem.playMoveSound` does a direct `MOVE_SFX_MAP[move.name]` lookup (battle.html:11788) with no hyphen normalization, so the space-form line-15 entry is unreachable dead data, and the move resolves to the line-776 entry — the dedicated Pummeling .wav files are orphaned and the Z-move plays Counter SFX.

**Blast radius**: Cosmetic audio only — the Fighting Z-move uses placeholder Counter SFX instead of its three dedicated clips. No gameplay effect.

**Fix sketch**: Delete the dead `'All Out Pummeling'` (space) key and point `'All-Out Pummeling'` at the three dedicated Pummeling .wav files. Audit other hyphen/space mismatches between the two map files while here (e.g. confirm 'Savage Spin-Out' matches).

**Verification**: Use the Fighting-type Z-move in battle; confirm the dedicated Pummeling SFX play rather than Counter.

---

## <a id="ISSUE-020"></a> ISSUE-020: Mystery Figure roster collapsed to single 'the_first' (v22); STORY_NARRATIVE_VARIANTS still documents 9-identity cast

---
id: ISSUE-020
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

## <a id="ISSUE-021"></a> ISSUE-021: STORY_FEATURES_INTEGRATION §4 lists Safari fee ~500G; code + canonical flow say 10,000G

---
id: ISSUE-021
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

## <a id="ISSUE-022"></a> ISSUE-022: SAVE_VER is 22 with v21/v22 migrations; spec + ANCHOR_INDEX + CODEBASE_MAP stop at 15-20

---
id: ISSUE-022
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

## <a id="ISSUE-023"></a> ISSUE-023: Doc battle.html:LINE anchors stale across specs (18/50 drifted) + several renamed symbols

---
id: ISSUE-023
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

---
