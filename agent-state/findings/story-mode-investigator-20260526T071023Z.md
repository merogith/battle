# Story Mode Investigation — Findings

Systems & Progression Designer pre-implementation review. Audit of CURRENT
shipped code in `battle.html` (54,266 lines, `SAVE_VER=20`). The prior
`docs/STORY_MODE_AUDIT.md` predates the M0–M6 catch/PC/Safari/boss-arc
implementation and the v15–v20 redesign — most of its findings are now FIXED
(verified inline below). `REDESIGN_PLAN.md` is a FORWARD plan; "not implemented
yet" is NOT filed as a defect — only real current bugs, current code vs its OWN
current specs, and plan-vs-current-code collisions.

---
severity: P1
category: dx
anchor_symbol: migrateStoryPreV15
current_line_hint: ~31873
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2ff4479d31a1
confidence: high
status: fixed-main
---

**Title**: Save-migration integration test never exercises the migrate chain (vacuous pass)

**Evidence**:
```js
// tests/integration/save-migration.test.js
test('migrateStoryPreV15 function exists OR migrations are not yet exposed', async () => {
  const { window } = await loadEngine();
  const fn = window.migrateStoryPreV15;
  if (typeof fn !== 'function') { return; }  // <-- always taken; not exported
  ...
// And the "pre-v15 save" fixture uses the WRONG key:
const preV15 = { saveVer: 14, ... };  // load() reads d.version, not d.saveVer
```

**Repro**: `grep -n "window.migrateStory" battle.html` returns nothing — migration fns live inside the `window.StoryMode = (function(){…})()` IIFE and are not exported. The test's guard `if (typeof fn !== 'function') return` is therefore always taken. The second test's fixture sets `saveVer: 14` but `load()` (battle.html:32228) keys on `d.version`; `version:undefined < 2` makes `load()` bail before any migration runs.

**Blast radius**: The pre-v15 → v20 round-trip (the single most safety-critical path for not bricking returning players) has ZERO real test coverage despite the test file's name. A regression in any `migrateStoryPreV<N>` would pass CI.

**Fix sketch**: Either expose the migration entry (or a test-only `__runStoryMigrations(saveObj)` hook) on `window.StoryMode`, then drive a real `{version:14,...}` fixture through it and assert post-state (pcBox array, balls default, hardcore→normal, stable ids, ivs grandfathered, daycare/pits seeded). At minimum, fix the fixture key `saveVer`→`version`.

**Verification**: New assertions on migrated `sm` fields; mutate one migration to break a field and confirm the test goes red.

---
severity: P2
category: dx
anchor_symbol: load
current_line_hint: ~32228
file: battle.html
agents: [story-mode-investigator]
fingerprint: 34a2703812f7
confidence: high
status: open
---

**Title**: Migration chain is sound but unobservable — no boot-time shadow validation

**Evidence**:
```js
if (!d || d.version < 2 || d.version > SAVE_VER) return false;   // forward saves rejected (good)
...
if (_loadedVer < 15) { try { migrateStoryPreV15(); } catch (e) { console.warn(...); } }
if (_loadedVer < 16) { try { migrateStoryPreV16(); } catch (e) { ... } }
// ... v17, v18, v19, v20, each version-gated, each try/caught
```

**Repro**: Static review of battle.html:32223–32390. The chain is correctly ordered (note: `migrateStoryPreV20` is DECLARED at 31735, BEFORE `migrateStoryPreV19` at 31754, but DISPATCHED in correct numeric order at 32325/32328 — safe). Each migration handles missing fields, coerces types, and is wrapped in try/catch with safety back-fills after the chain (32330–32352). v15 handles hardcore→normal, stable ids on team+pcBox, balls/pokedex/catchUnlocked defaults; v19 grandfathers IVs to 31 and refunds permBoosts; v20 seeds daycare/pits/bonus/tired.

**Blast radius**: A single migration silently no-op'ing (e.g. the documented `STORY_EVENTS_RAW` re-export trap in STORY_MODE_FLOW §8) would not surface until a player hit the affected feature.

**Fix sketch**: This is a positive confirmation (chain is correct) + a small hardening ask: add a dev-only post-migration assertion that the loaded `sm` matches the v20 shape (all required keys present, types correct), logged once on boot under `?debug`. Pairs with fixing the test gap above.

**Verification**: Load a v8/v11/v14/v19 fixture; confirm no console.warn fires and all fields resolve to v20 shape.

---
severity: P2
category: bug
anchor_symbol: renderCityActions
current_line_hint: ~38999
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4fc1e6825b2d
confidence: high
status: open
---

**Title**: Pokémon Center copy promises a "Heal" that no longer exists (full-heal is automatic)

**Evidence**:
```js
// renderCityActions — button comment + label
// Pokémon Center — full party heal, free, unlimited
_push('recover', makeActionBtn('🏥 Pokémon Center','center','window.StoryMode.enterPokemonCenter()','center', _facOpts('center', [{label:'Free',tone:'free'}])));
// city tip (line ~38717), shown when a rival is at the route gate:
const _healTipLabel = _willFireWildNext ? 'Heal — your rival waits at the end of the road' : 'Heal — your rival is at the route gate';
```

**Repro**: STORY_MODE_FLOW §7 states the Center has "No heal function — full-heal between battles is universal." The Center screen (battle.html:8486–8508) has exactly three tabs — PC Storage / Underground / Rivalry — and no heal action. Yet the button comment says "full party heal", the meta badge is "Free", and the rival-gate tip literally reads "Heal — …" and routes to `enterPokemonCenter()`. A player who clicks "Heal" lands on the PC screen with nothing to heal.

**Blast radius**: First-time-player confusion; contradicts the canonical spec's headline mechanic (attrition removed). Pure copy/comment drift — no functional bug, but actively misleading.

**Fix sketch**: Reword the rival-gate tip to "Manage party / PC — your rival waits…" (or drop the tip), and update the button comment. If a heal affordance is desired for UX comfort, it would be a no-op (already full HP) so better to remove the word "Heal".

**Verification**: Walk to a pre-rival hub; confirm the tip no longer says "Heal"; confirm the Center screen shows no heal control.

---
severity: P2
category: refactor
anchor_symbol: _pcRenderRivalJournalTab
current_line_hint: ~42866
file: battle.html
agents: [story-mode-investigator]
fingerprint: f642d84a30e0
confidence: medium
status: open
---

**Title**: Rivalry tab is mis-homed in the Pokémon Center — belongs in a progression/journal surface

**Evidence**:
```html
<!-- battle.html:8501 — 3rd tab of #screen-story-pokemoncenter -->
<button id="story-pc-tab-journal-btn" onclick="window.StoryMode.pcSwitchTab('journal')"
  title="Your rivalry — past encounters, their teams, win/loss record"> Rivalry</button>
```

**Repro**: `_pcRenderRivalJournalTab` (battle.html:42866) renders a read-only journal of `sm.rivalEncounterLog` — W/L standing, the rival's team per encounter (sprite chips), badge stage, and champion-claim status. It sits as the 3rd tab inside the Pokémon Center, whose other two tabs (PC Storage, Underground) are both mon-inventory management. The Rivalry journal is narrative/progression telemetry — orthogonal to mon storage/selling.

**Blast radius**: Discoverability — a player managing their box has no reason to expect rivalry history there; a player wanting to check the rivalry won't think "Pokémon Center". The maintainer's "a bit irrelevant" instinct is correct.

**Fix sketch**: RECOMMENDATION: move it. It is fully self-contained (reads only `sm.rivalEncounterLog` + `_rivalDisplayName`/`rivalPhaseTagline`), so relocation is low-risk. Best home is the cross-run Collection surface (alongside Pokédex / Achievements / Hall of Fame — `openCollection`) as a per-run "Rivalry" panel, OR a city-hub action gated on `sm.rivalEncounterLog.length >= 1` (mirrors the existing rival-cameo gate at 38598). Do NOT cut it — the data capture in `setRivalStanding` (32001–32016) is already wired and the journal is good fanservice. Just re-parent the render call and drop the PC tab button.

**Verification**: Confirm the journal renders identically under the new parent; confirm `pcSwitchTab` no longer references 'journal'.

---
severity: P2
category: inconsistency
anchor_symbol: PC_BOX_CAP
current_line_hint: ~10582
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5f7903cb05a5
confidence: high
status: open
---

**Title**: In-game help text still says "PC Storage (cap 10)" — actual PC_BOX_CAP is 30

**Evidence**:
```js
// battle.html:10582 (story-mode help overlay)
"<b>Pokémon Center</b> — <b>PC Storage</b> (cap 10) for the partners you can't carry, ..."
// vs
const PC_BOX_CAP = 30;  // battle.html:42740
```

**Repro**: `grep -n "cap 10" battle.html`. The PC cap was raised to 30 (v-playtest per STORY_MODE_FLOW §7), the overflow modal and warning banner correctly use `PC_BOX_CAP` (42924/42938), and the catch overflow message says "(30/30)" — but the static help prose still reads "cap 10". The `inspect-save` skill doc and CODEBASE_MAP also still say cap 10 / SAVE_VER=15 (stale, separate from code).

**Blast radius**: Player-facing help under-states their storage by 3×; could prompt premature releases. Cosmetic but directly contradicts the live cap.

**Fix sketch**: Replace the literal "cap 10" in the help string with "cap ${PC_BOX_CAP}" (or the literal 30). Sweep for other "cap 10" / "10/10" prose.

**Verification**: `grep -n "cap 10\|10/10" battle.html` returns no user-facing PC strings.

---
severity: P3
category: inconsistency
anchor_symbol: _safariGradeWeightsForBadges
current_line_hint: ~43154
file: battle.html
agents: [story-mode-investigator]
fingerprint: ecabacc5ef90
confidence: high
status: open
---

**Title**: Safari grade weights are now badge-keyed — spec/CODEBASE_MAP still cite the old static g1:3/g2:22/g3:50/g4:25

**Evidence**:
```js
// battle.html:43154 — v19 replaced the static weights with a badge curve
const _SAFARI_GRADE_CURVE_BY_BADGES = {
  3: { g1: 0, g2: 5,  g3: 60, g4: 35 },  // first unlock @ City 4
  ...
  8: { g1: 5, g2: 50, g3: 40, g4: 5  }
};
```

**Repro**: STORY_MODE_FLOW §4, CODEBASE_MAP, and the audit mandate all state Safari "weights g1:3/g2:22/g3:50/g4:25". Code comment at 43152 confirms "Pre-v19 was static {g1:3,g2:22,g3:50,g4:25}." The current curve scales with `sm.badges` so the FIRST (free, City-4) Safari visit yields ZERO G2 and zero G1 — a deliberate "real chance at a strong G3" tuning, not the documented haul.

**Blast radius**: Spec-vs-code drift only (code is the newer, intentional design). Anyone tuning Safari from the spec would regress it. 6-encounter loop (`SAFARI_MAX_ENCOUNTERS=6`), 15-ball session (`SAFARI_BALLS_PER_SESSION=15`), 1.35× mult all match spec.

**Fix sketch**: Update STORY_MODE_FLOW §4 + CODEBASE_MAP to reference `_SAFARI_GRADE_CURVE_BY_BADGES` as the source of truth. No code change.

**Verification**: Spec table matches the live constant.

---
severity: P3
category: inconsistency
anchor_symbol: applyStoryLeagueFoeStatBoost
current_line_hint: ~32108
file: battle.html
agents: [story-mode-investigator]
fingerprint: 25cb66b09cd0
confidence: high
status: open
---

**Title**: Spec §8 says league boost stacks MULTIPLICATIVELY with difficulty; code now stacks ADDITIVELY

**Evidence**:
```js
// battle.html:32108 — league boost stored as ADDITIVE delta
// "...so applyFoeDifficultyScaling can merge with the difficulty multiplier
//  additively (e.g., Challenge 1.30 + Champion 0.40 = 1.70, not the
//  multiplicative 1.30 × 1.40 = 1.82 cliff)."
mon._leagueStatBonus = { hp: hpM-1, bulk: bulkM-1, spe: speM-1 };
```

**Repro**: STORY_MODE_FLOW §8 still reads "applyStoryLeagueFoeStatBoost … is applied before applyFoeDifficultyScaling, so the two stack multiplicatively. Champion HP on Hard ≈ ×1.30 × ×1.15 = ×1.495." The code (32108–32122) was reworked to additive merging — this directly FIXES prior audit finding 2.5 (the +56% vs +20% cliff). The spec doc was not updated.

**Blast radius**: Spec-vs-code only; the code is the better behavior. STORY_MODE_FLOW §15c/15e also describe Crucible Hard Mode stacking that should be reconciled with §8.

**Fix sketch**: Update STORY_MODE_FLOW §8 to describe the additive merge and remove the "×1.495" example.

**Verification**: Spec matches code's additive model.

---
severity: P3
category: inconsistency
anchor_symbol: showBattleIntro
current_line_hint: ~42101
file: battle.html
agents: [story-mode-investigator]
fingerprint: 691dc8480b55
confidence: high
status: open
---

**Title**: Stale comment claims rival secondary intro "Uses Math.random" — it now uses seeded _storySideRng

**Evidence**:
```js
// battle.html:42101 (comment) — INCORRECT
// "...Uses Math.random for rival secondary line only — does not advance story battle RNG."
// but battle.html:42121 calls:
const extraLine = ... pickRivalSecondaryIntroLine(rivalPhase, badgesNow);
// which uses _storySideRng(seed, phase, badges) — deterministic (30755)
```

**Repro**: `pickRivalSecondaryIntroLine` (battle.html:30766) draws via `_storySideRng(...)` (30755), a "Deterministic per-(seed, phase, badges) sub-RNG … reproducible across shared seeds." This FIXES prior audit finding 1.1. The comment at 42101 was never updated and now mis-states the implementation.

**Blast radius**: Comment-only; misleads future maintainers into thinking shared-seed replays diverge on the rival line (they don't).

**Fix sketch**: Update the comment to "rival secondary line uses a deterministic seed-derived sub-RNG (`_storySideRng`); does not touch story battle RNG state."

**Verification**: Comment matches `pickRivalSecondaryIntroLine`.

---
severity: P2
category: refactor
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29008
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4c6af8ecc61c
confidence: high
status: open
---

**Title**: Story spine is a hardcoded linear array; narrative layer is data-driven but no structural side-story/random-pool slots

**Evidence**:
```js
const STORY_EVENTS_RAW = [   // battle.html:29008 — fixed literal, 67 rows
  [0,'City','City0',null,0,[...]],
  [68,'Battle','Rival',{...},2000,null],
  ...
];
// vs the EXTENSIBLE narrative layer (battle.html:35496):
// "To add a new pre-battle scene → append to STORY_BATTLE_INTERRUPTS.
//  To add a new cold-open → add a row to STORY_COLD_OPENS …
//  To add a new storyline → add an entry to STORYLINE_VARIANTS with beatOverrides …"
```

**Repro**: The timeline (`STORY_EVENTS_RAW`) is a static literal. Three clean extension layers exist OVER it: (1) `STORY_BEATS` — per-row metadata keyed on durable `storyRowId` (NOT array index, 35509–35511); (2) `STORY_COLD_OPENS` — fire-once narrative scenes, meta-tracked; (3) `STORY_BATTLE_INTERRUPTS` — a runtime pre-battle interrupt bus that ALREADY injects route nodes (wild/roaming/catch-tutorial) WITHOUT advancing `sm.eventIndex` (37942); (4) `STORYLINE_VARIANTS` — narrative reskins via `beatOverrides[rowId]`. Pokémon picks always flow through the existing rollers, so variants "CANNOT break the difficulty curve" (35506).

**Blast radius**: This directly informs the maintainer's architecture. Verdict: the NARRATIVE layer is genuinely pluggable ("bind and attach" via row-id-keyed overrides). The STRUCTURAL layer (adding new events / a random-draw pool of side-stories) has NO data-driven slot system yet — `STORY_EVENTS_RAW` would need editing, and 49 positional accesses + save-keyed `trainerAssignments` make naive row reordering unsafe (REDESIGN_PLAN §6 confirms; rows already use `eventId` col 0 as the durable key, e.g. row 68 sits at array index 1).

**Fix sketch**: For pluggable static side-stories + random-draw pool: extend the `STORY_BATTLE_INTERRUPTS` bus pattern — it is the proven mechanism for injecting beats between fixed rows without touching `eventIndex`. Add a `STORY_SIDE_STORIES` registry (each with a `fires(ctx)` predicate + `once` meta key) and a `STORY_RANDOM_POOL` drawn by `_storySideRng` at city entry. Bind via the same `prepare()/run()` contract. Avoid mutating `STORY_EVENTS_RAW`; always key on `eventId`/row-id, never array index.

**Verification**: Prototype one side-story as a new interrupt entry; confirm `eventIndex` is untouched and the main spine still advances.

---
severity: P3
category: balance
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29009
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6287bc4c5a37
confidence: high
status: open
---

**Title**: Service-timeline pacing — City1 post-gym hub is a dead zone (no new "thing to do")

**Evidence**:
```text
City0 pre-gym : Professor, Pokémart, Move Tutor, Nature Rater  (+ Center, Fan Club injected)
City1 pre-gym : Professor, Pokémart, Gym                       (NO new facility vs City0)
City1 post-gym: Pokémart, Leave City                          (DEAD — nothing new; Daycare unlocks here but only as egg-quest)
City2 pre-gym : Link Station, Stone Sage, Stone Shop, Move Tutor  (3 NEW facilities debut at once — clumped)
```

**Repro**: Extracted from `STORY_EVENTS_RAW` City rows + `FACILITY_DEBUT_CITY` (29085). First-appearance map: Center/Mart/Tutor/Nature/FanClub = C0; **C1 introduces nothing new**; Link+StoneShop+StoneSage all debut **together at C2**; Dojo+EVTrainer+Safari all debut **together at C4**; Colress C6; Dept Store C6. So the drip is: rich C0 → flat C1 → triple-debut C2 → C3 (Nature Rater returns) → quad-event C4 → Casino C5 → Colress+Dept C6.

**Blast radius**: The maintainer explicitly wants "a steady drip of new things to do." Current pacing is clumped (C2 triple, C4 quad) with a genuine dead zone at C1 (the first post-gym hub has only Pokémart). Daycare DOES unlock at C1's gym win but presents only as a one-time egg quest, and the redesign moves it to C2 anyway.

**Fix sketch**: Spread debuts: move ONE of {Link, Stone Shop, Stone Sage} earlier to C1 (post-gym), and stagger Dojo (C4) vs EV Trainer (keep C4) vs Safari (C4) so C3 or C5 gets a fresh facility instead of three landing at C4. REDESIGN_PLAN §8a already flags the GL4–5 "dead zone" on the enemy curve; this is the FACILITY-debut analog.

**Verification**: Re-extract per-city action lists; confirm every city 1–8 introduces ≥1 first-appearance service.

---
severity: P3
category: balance
anchor_symbol: renderCityActions
current_line_hint: ~38989
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4066d35d9141
confidence: high
status: open
---

**Title**: Nature Rater availability is gappy (C0, C3, C5–C9) — absent C1/C2/C4 with no unlock rationale

**Evidence**:
```text
Move Tutor   present at: C0, C2, C3, C4, C5, C6, C7, C8, C9   (skips C1 only)
Nature Rater present at: C0,     C3,     C5, C6, C7, C8, C9   (skips C1, C2, C4)
```

**Repro**: Per-city action extraction from `STORY_EVENTS_RAW`. Both Move Tutor and Nature Rater are "always-on RNG-negators" per REDESIGN_PLAN §2, but the actual literal omits Nature Rater at C1/C2/C4 and Move Tutor at C1. There is no `actions.includes('Nature Rater')` gate beyond the literal — the absence is just missing array entries, not a deliberate unlock condition. So a player who wants to fix a bad nature at C2/C4 simply can't.

**Blast radius**: Inconsistent service availability for two facilities the design treats as ubiquitous. A nature-locked mon caught/gifted at C2 waits until C3 for the Rater.

**Fix sketch**: Either (a) add 'Move Tutor'/'Nature Rater' to the missing City rows' action arrays for true always-on, or (b) if the omissions are intentional pacing (city-specialty per §14c), document them in `CITY_SPECIALTY_BLURBS` and STORY_MODE_FLOW. REDESIGN_PLAN §2 already proposes the "always-on" fix.

**Verification**: Re-extract action lists; confirm Nature Rater appears (or is documented-absent) at every city.

---
severity: P2
category: refactor
anchor_symbol: enterDaycare
current_line_hint: ~42313
file: battle.html
agents: [story-mode-investigator]
fingerprint: 145ee8564182
confidence: high
status: open
---

**Title**: PLAN COLLISION — Daycare unlock is keyed on the "Gym Leader 1" event name, not a city; redesign wants C2/C4/C6

**Evidence**:
```js
// battle.html:42313 — current unlock trigger
if (en === 'Gym Leader 1' && !sm.daycare.unlocked) {
    sm.daycare.unlocked = true;
    ...
}
// battle.html:39513
const STORY_EGG_HATCH_BADGE = 7;   // hatch gate is badge-based
```

**Repro**: Current code: Daycare unlocks on the Gym Leader 1 VICTORY (event-name match), appears from City1 post-gym onward, egg hatches after badge 7 (`STORY_EGG_HATCH_BADGE`), Fight Club secret at badges≥6. REDESIGN_PLAN §3/§6 wants: Daycare facility at C2/C4/C6, hatch at `pickupCity+2` (store `eggLaidAtCity`), and a SAVE_VER bump to re-key the unlock. The current event-name keying (`en === 'Gym Leader 1'`) and badge-7 hatch gate are exactly the spots the plan must rewrite.

**Blast radius**: Direct plan-vs-code collision flagged for the maintainer. The unlock predicate, the hatch gate (`STORY_EGG_HATCH_BADGE`, used at 5 sites incl. UI strings 39775/40474/42973/43010), and the Fight Club secret gate (badges≥6 at 39006) all need migration. `_daycareIsUnlocked()` reads `sm.daycare.unlocked` — a boolean that won't carry the new city-relative semantics without a v21 migration.

**Fix sketch**: When implementing the redesign: (1) gate Daycare visibility on `actions.includes('Daycare')` added to C2/C4/C6 rows (mirrors Safari's city-gating at 39026), NOT an event-name flag; (2) replace `STORY_EGG_HATCH_BADGE` with `eggLaidAtCity + 2` stored on the egg slot; (3) bump SAVE_VER and grandfather in-progress eggs (per §6). All five `STORY_EGG_HATCH_BADGE` references + the four UI strings must change together.

**Verification**: A v20 save mid-egg-quest loads cleanly post-bump; egg hatches at pickupCity+2.

---
severity: P3
category: bug
anchor_symbol: _withStoryPlayerGimmickGate
current_line_hint: ~11419
file: battle.html
agents: [story-mode-investigator]
fingerprint: fc7eab00919a
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — mechanics unlock gate has no leak on any player or enemy path

**Evidence**:
```js
// Player paths all wrap makeBuild with the gate:
//   37975 evolution/swap, 40794 Professor, 43721 boss arc (_bossArcRollLegendary),
//   44295 makeWildBuild, 47484 evolution, 37975 roamingLegendary prepare
build = _withStoryPlayerGimmickGate(() => makeBuild(name));
// Enemy side: _storyEnemyMechKeys filters by sm.unlockedGimmicks (32848)
if (S.megaOn && unlocked.has('mega')) k.push('mega');  // etc.
```

**Repro**: Audited every `makeBuild` caller. All six player-acquisition paths (Professor, wild catch incl. roaming-legendary `prepare` at 37975, boss-arc `_bossArcRollLegendary`, evolution, swap) wrap with `_withStoryPlayerGimmickGate`. The gate's consumer `_mechForGimmickRoll` (11400) ALSO requires `settings.mechanics.X` (synced from `sm.settings` by `applyMechanicsToSettings`), so a disabled mechanic never rolls even with the flag on. Enemy gimmicks gate via `_storyEnemyMechKeys`→`sm.unlockedGimmicks`. Cable Link (`_makePlayerLinkBuild` at 46970) is the SOLE deliberate exception (maintainer decision 2026-05-25, CHANGELOG-documented) — still bounded by `settings.mechanics`.

**Blast radius**: This is the most security-sensitive Tier-1 item and it is solid. No P0/P1 leak.

**Fix sketch**: None — positive confirmation. (The prior audit could not assess this because catch/boss-arc didn't exist yet.)

**Verification**: `grep -n "makeBuild" battle.html` cross-checked against gate wrapping — only Cable Link is intentionally ungated.

---
severity: P3
category: bug
anchor_symbol: _storyMaxPartySize
current_line_hint: ~41170
file: battle.html
agents: [story-mode-investigator]
fingerprint: 306eabc530b8
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — party-cap curve = min(6, 2+badges) with no off-by-one; foe sizing matches

**Evidence**:
```js
function _storyMaxPartySize() {
    const badges = (sm && sm.badges) | 0;
    return Math.max(2, Math.min(6, 2 + badges));   // 41172
}
// Foe size (41137): finales=6; intro rival=playerTeamLen; else max(roleFloor, 2+badges)
```

**Repro**: `_storyMaxPartySize` (41170) returns `max(2, min(6, 2+badges))`, used consistently at catch (44933), Professor (40707), daycare (39683), and the cap-teach overlay (42650). Foe sizing `_storyEnemyPartySize` (41137) mirrors it with finale=6 + intro-rival player-match special cases + a role-floor safety net. No off-by-one at catch time or Professor-offer time.

**Blast radius**: Tier-1 #3 — clean.

**Fix sketch**: None — positive confirmation.

**Verification**: badges 0→4 yields cap 2,3,4,5,6; intro rival is 1v1; finales always 6.

---
severity: P3
category: bug
anchor_symbol: _shouldFireCatchTutorialBeforeBattle
current_line_hint: ~44996
file: battle.html
agents: [story-mode-investigator]
fingerprint: df15067e7f6b
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — catch tutorial fires exactly once; mid-tutorial reload cannot refire or lock

**Evidence**:
```js
// Flag set ONLY on actual catch success (44996):
if (_catchState && _catchState.tutorialMode) { _markCatchTutorialDone(); }
// Gate (41454): if (!sm || sm.catchTutorialDone) return false;  + intro-rival-behind check
// Migration (31907): sm.catchTutorialDone = (sm.eventIndex|0) > 1;  for pre-v16 saves
```

**Repro**: `_shouldFireCatchTutorialBeforeBattle` (41453) gates on `!sm.catchTutorialDone`, intro-rival-behind, party<cap, ≥1 ball. `catchTutorialDone` is set by `_markCatchTutorialDone` ONLY inside the catch-success path under `tutorialMode` (44996–45001) — explicitly "so a mid-tutorial reload doesn't lock the once-per-save flag without the partner ever landing." v16 migration back-fills existing saves.

**Blast radius**: Tier-1 #4 — clean. No refire on save/load.

**Fix sketch**: None — positive confirmation.

**Verification**: Reload during the tutorial catch screen; confirm tutorial re-presents (flag not yet set) and does not double-fire after the catch lands.

---
severity: P3
category: bug
anchor_symbol: GYM_CITY_LEADER_EVENT
current_line_hint: ~29743
file: battle.html
agents: [story-mode-investigator]
fingerprint: da9a1c34d71e
confidence: high
status: open
---

**Title**: CONFIRMED FIXED — GYM_CITY_LEADER_EVENT is now derived from STORY_EVENTS_RAW at boot (prior audit 1.3)

**Evidence**:
```js
const GYM_CITY_LEADER_EVENT = (function buildGymCityLeaderMap() {
    const out = {};
    for (let i = 0; i < STORY_EVENTS_RAW.length; i++) {
        const row = STORY_EVENTS_RAW[i];
        if (!row || row[1] !== 'Battle') continue;
        const m = String(row[2] || '').match(/^Gym Leader (\d+)$/);
        if (m) out[parseInt(m[1], 10)] = i;
    }
    return out;
})();
```

**Repro**: Prior audit finding 1.3 flagged `GYM_CITY_LEADER_EVENT` as a hard-coded index map fragile to timeline shifts. It is now an IIFE that derives the map by scanning `STORY_EVENTS_RAW` for `Gym Leader N` rows (29743). Used at 38514 + 39330 for hub label/sprite. Timeline-shift-safe.

**Blast radius**: Tier-1 #6 — resolved. The hard-code is gone (not merely shadow-validated; fully derived).

**Fix sketch**: None — confirms the prior P1 is fixed.

**Verification**: Map indices match the array positions of the 8 `Gym Leader N` rows.

---
severity: P3
category: bug
anchor_symbol: _catchHandleSuccess
current_line_hint: ~44937
file: battle.html
agents: [story-mode-investigator]
fingerprint: 676d6b1d9871
confidence: high
status: open
---

**Title**: CONFIRMED CLEAN — PC overflow at party-cap + 30/30 shows explicit message; sell/release path exists

**Evidence**:
```js
const maxParty = _storyMaxPartySize();
const partyFull = (sm.team||[]).length >= maxParty;
const pcFull = (sm.pcBox||[]).length >= PC_BOX_CAP;
if (partyFull && pcFull) {
    _catchFinishWithMessage(`Your party (${(sm.team||[]).length}/${maxParty}) and PC (${PC_BOX_CAP}/${PC_BOX_CAP}) are full. Free a slot at the Pokémon Center, then try again.`);
    return;
}
```

**Repro**: `_catchHandleSuccess` (44937) handles party-full+PC-full with an explicit modal directing the player to the Center. Party-full + PC-room offers a swap prompt (`_renderPartySwapPrompt`, 44968). The Center's Underground tab (`pcSell`) and PC `pcRelease` both free slots. Spec §7 satisfied (modulo the help text saying "10/10" — see separate finding).

**Blast radius**: Tier-1 #5 — clean.

**Fix sketch**: None — positive confirmation.

**Verification**: Fill party to cap + PC to 30; throw a successful catch; confirm the modal and that a release/sell then allows the catch.

---
severity: P3
category: inconsistency
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~29759
file: battle.html
agents: [story-mode-investigator]
fingerprint: 91bb9bebbb7a
confidence: high
status: open
---

**Title**: CONFIRMED FIXED — Mystery Figure is now a rotating 10-identity cast (prior audit: hardcoded Cyrus)

**Evidence**:
```js
const MYSTERY_FIGURE_IDENTITIES = {
    cyrus:{...}, ghetsis:{...}, cynthia:{...}, steven:{...}, n:{...},
    red:{...}, lance:{...}, buried_alive:{...}, cartridge_self:{...}
};
function _storyEnsureMysteryIdentity() { if (!sm.mysteryIdentity || ...) sm.mysteryIdentity = _storyPickMysteryIdentity(); ... }
```

**Repro**: Prior audit flagged the Mystery Figure sprite as "unconditionally Cyrus". Now `sm.mysteryIdentity` is rolled once per run (`_storyPickMysteryIdentity`, 29807) from 10 identities, each with per-identity intro lines + outro. The city-hub tease (38613) and the post-HoF boss both read the same pinned identity. Two are storyline-exclusive (`buried_alive`, `cartridge_self`) with `mysteryBias` weighting. Tier-2 #8 resolved.

**Blast radius**: Fanservice — resolved. Minor residual: the fallback at 38614 is still `'Cyrus'` if `sm.mysteryIdentity` is somehow unset at render time, but `_storyEnsureMysteryIdentity` makes that path effectively dead.

**Fix sketch**: None required. Optionally drop the literal `'Cyrus'` fallback in favor of `_storyEnsureMysteryIdentity().sprite` for consistency.

**Verification**: Start two runs; confirm different pinned mystery identities and matching intro/outro voice.

---
severity: P3
category: data
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~29008
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1351f59a0b47
confidence: medium
status: open
---

**Title**: STORY_EVENTS_RAW has 67 array rows (incl. 2 'Hall of Fame' string matches) — mandate/spec cite "68 rows"

**Evidence**:
```text
STORY_EVENTS_RAW.length = 67 (array entries 29009..29078)
Row IDs (col 0) range 0..68 but are NON-contiguous and out of order:
  row 68 sits at array index 1 (intro Rival), row 12 (mid Rival) at index 19, etc.
```

**Repro**: `STORY_EVENTS_RAW` literal spans 29009–29078, 67 rows. The audit mandate and CODEBASE_MAP say "68 rows". The discrepancy is because event IDs (column 0) are durable keys assigned across history (max id 68) and are NOT array indices — migrations inserted/removed rows over time. This is a documentation-count drift, not a data bug: `GYM_CITY_LEADER_EVENT`, `STORY_BEATS`, and `trainerAssignments` all correctly key on the id or the array position as appropriate.

**Blast radius**: Doc-only. Reinforces finding #9: any tooling that assumes id == index will break (REDESIGN_PLAN §6 already warns).

**Fix sketch**: Update CODEBASE_MAP / mandate references to "67 rows; event IDs 0..68 non-contiguous, keyed by column 0".

**Verification**: `node -e` count of the literal == 67.

---
severity: P3
category: balance
anchor_symbol: storyDifficultyCoinMult
current_line_hint: ~29142
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2f91ba9853c9
confidence: high
status: open
---

**Title**: CONFIRMED FIXED — Hard coin mult floored to 1.00 (prior audit 2.1); Challenge 1.10

**Evidence**:
```js
if (diff === 'hard') return 1.00;       // was 0.92 — "floored at parity so the coin curve stops fighting the difficulty curve"
if (diff === 'challenge') return 1.10;
```

**Repro**: Prior audit 2.1 flagged Hard paying ×0.92 (punishing the hardest stretch). `storyDifficultyCoinMult` (29137) now returns 1.00 for Hard, 1.10 Challenge, 1.30 Normal, 1.50 Easy, 1.60 VeryEasy. Hardcore removed entirely. Resolved.

**Blast radius**: Tier-2 #14 — resolved. (Note: STORY_MODE_FLOW §8 coin table still lists "Normal 1.30 / Hard 1.00 (floored from 0.92)" — matches code.)

**Fix sketch**: None — confirmation.

**Verification**: Win a Hard fight; coin payout ≥ parity.

---
severity: P3
category: balance
anchor_symbol: RIVAL_ATTACK_TYPE_DECAY
current_line_hint: ~33108
file: battle.html
agents: [story-mode-investigator]
fingerprint: de6142450105
confidence: high
status: open
---

**Title**: CONFIRMED FIXED — RIVAL_ATTACK_TYPE_DECAY is now 10 (prior audit 1.2 had ÷30 too-aggressive)

**Evidence**:
```js
const RIVAL_ATTACK_TYPE_DECAY = 10;   // battle.html:33108 (was 30)
```

**Repro**: Prior audit 1.2 said `RIVAL_ATTACK_TYPE_DECAY = ÷30` neutralized the rival's counter-pick after 1–2 picks. It is now 10 (33108), used in `_rivalScoreAttackTypeVsParty` weighting (33155/33177). Rivals counter-pick more persistently against monotype parties. Reads live `sm.team` (does not filter `wild:true` per spec §3).

**Blast radius**: Tier-2 #10 — resolved.

**Fix sketch**: None — confirmation.

**Verification**: Face a rival with a monotype party; confirm sustained type counter-picking across slots.

---
severity: P3
category: data
anchor_symbol: FACILITY_DEBUT_CITY
current_line_hint: ~29085
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6c771c9b218f
confidence: high
status: open
---

**Title**: Service-availability timeline reference (Task 1 deliverable) — first-appearance / reappear / unlock map

**Evidence**:
```js
const FACILITY_DEBUT_CITY = {
    mart:0, tutor:0, nature:0, center:0, relic:0,
    link:2, stoneShop:2, evolab:2,
    dept:6, casino:5, dojo:4, evtrainer:4, safari:4, colress:6,
};  // fanclub omitted (opt-in, no debut gate)
```

**Repro**: Cross-referenced `FACILITY_DEBUT_CITY` (29085) + per-city action arrays in `STORY_EVENTS_RAW` + injection sites (Center 39000, Fan Club `_seedFanClubAcrossCities` 29097, Daycare 39008, Fight Club 39015, Safari 39026). Canonical service map:

| Service | First | Reappears? | Unlock |
|---|---|---|---|
| Pokémart | C0 | every city EXCEPT C6 (Dept substitutes, filtered 38561) | none |
| Move Tutor | C0 | C2–C9 (skips C1) | team≥1 |
| Nature Rater | C0 | C3,C5–C9 (skips C1,C2,C4) | team≥1 |
| Pokémon Center (PC+Underground+Rivalry) | C0 | every city (injected) | none |
| Pokémon Fan Club (IV) | C0 | every city (injected) | team≥1 |
| Relic Annex (Artifact buy) | C0 | nested under Dept (C6/C8/C9) | — |
| Link Station / Stone Shop / Stone Sage | C2 | every city after | none |
| Battle Dojo / EV Trainer / Safari | C4 | Dojo+EV every city after; Safari C4 ONLY | team≥1 (Safari city-gated) |
| Poké Casino | C5 | C5 + C9 only (cyclic) | none |
| Department Store | C6 | C6,C8,C9 (cyclic) | none |
| Colress ("Power Up") | C6 | every city after | team≥1 + a mech toggle on |
| Professor | C0 | C0–C5 pre-gym hubs; C6–C8 via shouldForceCityProfessor; hidden at party-cap (exc. C8 legendary gate); never C9 | party<cap |
| Daycare (egg) | C1 post-gym (Gym1 win) | until egg taken | sm.daycare.unlocked |
| Fight Club | C-where-6-badges | repeatable post-HoF | daycare secret @6 badges |
| The Crucible | post-HoF | every city | bossArc.available |

**Blast radius**: Reference artifact for Task 1 pacing decisions. Clumping at C2 (Link+StoneShop+StoneSage) and C4 (Dojo+EV+Safari); dead zone at C1 (see finding #10); gappy Nature Rater (#11).

**Fix sketch**: N/A — data reference. Use alongside findings #10/#11 for pacing.

**Verification**: Re-extract action lists per city; confirm against this table.

