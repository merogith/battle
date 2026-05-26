---
severity: P1
category: inconsistency
anchor_symbol: renderCityActions
current_line_hint: ~29067
file: battle.html
agents: [consistency-auditor]
fingerprint: 3422a6976f0b
confidence: high
status: open
---

**Title**: Player-facing city actions read "Pokemon League" / "Pokemon Fan Club" (no diacritic)

**Evidence**:
```js
// 29067 — City9 action list (rendered verbatim as a button label)
[59,'City','City9',null,0,['Link Station',/*…*/,'Power Up','Enter Pokemon League']],
// 29101/29106 — Fan Club spliced into every city's action list
if (!Array.isArray(actions) || actions.includes('Pokemon Fan Club')) continue;
actions.splice(insertAt + 1, 0, 'Pokemon Fan Club');
// 38824 / 38984 — same bare labels consumed by the renderer
const hasLeague = actions.includes('Enter Pokemon League');
if (actions.includes('Pokemon Fan Club') && _tutorTeam) { … }
```

**Repro**: Start any story run; the City 9 hub renders an "Enter Pokemon League" button and every city renders a "Pokemon Fan Club" button — both without the é, while the rest of the UI (screen titles "💖 Pokémon Fan Club" @8472, "Pokémon League" blurb @30950, arrival lines) uses "Pokémon". The two strings are the only *player-visible* bare-"Pokemon" occurrences; the other ~20 hits in the file are all CSS/JS comments.

**Blast radius**: Two of the most-clicked buttons in the game. The mismatch is visible side-by-side with correctly-accented labels on the same hub screen. Low code risk, high polish cost.

**Fix sketch**: Change the two literals to "Enter Pokémon League" and "Pokémon Fan Club", then update the matching `.includes('Pokemon Fan Club')` / `.includes('Enter Pokemon League')` dispatch checks (29101, 38824, 38947-38993) in lockstep — these are string-equality dispatches, so label and check must change together.

**Verification**: `grep -nE "'(Pokemon Fan Club|Enter Pokemon League)'" battle.html` returns 0; both buttons still open their screens (Fan Club splice + League gate still match).

---
severity: P2
category: inconsistency
anchor_symbol: STORY_FACILITY_QUOTES
current_line_hint: ~39208
file: battle.html
agents: [consistency-auditor]
fingerprint: ede1c3a285f0
confidence: high
status: open
---

**Title**: Recurring facility-flavor pool covers 8 services; Safari / Stone Sage / Stone Shop / Dept Store have none

**Evidence**:
```js
// 39208 — STORY_FACILITY_QUOTES keys (the ambient one-liner shown on every re-visit):
//   moveTutor, natureRater, battleDojo, evTrainer, colress, link, casino, relicKeeper
const STORY_FACILITY_QUOTES = {
    moveTutor: [ /* 7 lines */ ], natureRater: [ /* 7 */ ], battleDojo: [ /* 7 */ ],
    evTrainer: [ /* 6 */ ], colress: [ /* 6 */ ], link: [ /* 5 */ ],
    casino: [ /* 5 */ ], relicKeeper: [ /* 5 */ ],
    // no: safari, stoneSage/evolab, stoneShop, dept
};
```

**Repro**: Each of the 8 keyed services calls `_storyShowFacilityQuote(...)` to print a rotating italic NPC line under the screen header on every visit. Safari Zone, Stone Sage, Stone Emporium, and Department Store render a one-time intro scene the first visit (STORY_TUTORIAL_SCENES) but have no recurring pool, so on every subsequent visit those four screens are silent where the other eight speak.

**Blast radius**: Cosmetic inconsistency in the ambient-voice layer the maintainer flagged for review. The REDESIGN_PLAN makes Safari "permanent after debut" and the Dept Store cyclic (C6/C8/C9) — both become high-re-visit screens, widening the silent gap exactly where the redesign adds traffic.

**Fix sketch**: Add `safari`, `stoneSage`, `stoneShop`, `dept` pools (5-7 lines each, matching the existing voice) to STORY_FACILITY_QUOTES and wire a `_storyShowFacilityQuote(screenId, key)` call into each facility's enter function (enterSafariZone, enterStoneShop, the Stone Sage screen, the Dept Store screen).

**Verification**: Visit each of the four facilities twice; an ambient italic line appears under the header on both visits and rotates.

---
severity: P3
category: inconsistency
anchor_symbol: enterArtifactShop
current_line_hint: ~45536
file: battle.html
agents: [consistency-auditor]
fingerprint: 6f0acce30a29
confidence: high
status: open
---

**Title**: Relic Annex intro uses plain-text `_storyShowOneTimeTip`; every other facility uses a sprite-backed scene

**Evidence**:
```js
// 45536 — Relic Annex first-visit intro (text-only tip, no NPC sprite/nameplate):
try { _storyShowOneTimeTip('relic',
  'The Relic Annex.\n\nThree relics on the shelf, one purchase per visit. …'); } catch (e) {}
// vs STORY_TUTORIAL_SCENES entries (firstSafari, firstStoneShop, firstMoveTutor, …)
// which render sprite + nameplate + Continue via _showStoryTutorialScene.
```

**Repro**: First visit to the Relic Annex shows a plain text tip box. First visit to Safari/Stone Shop/Move Tutor/Dept/etc. shows a character-portrait dialog scene (Safari Warden, Emporium Keeper, etc.). The relic intro is present and well-written — only the *delivery mechanism* is inconsistent with the other 19 facility intros.

**Blast radius**: Purely presentational. REDESIGN_PLAN §2 promotes the artifact store to an always-on top-level action with a "mandatory one-time intro (dark-mysterious tone)" — the relic intro should match the sprite-scene treatment the redesign expects, and a Relic Keeper sprite already exists (used by the recurring `relicKeeper` quote pool).

**Fix sketch**: Add a `firstRelic` entry to STORY_TUTORIAL_SCENES (sprite + "Relic Keeper" nameplate, reuse the existing copy) and call `playStoryTutorial('firstRelic')` from enterArtifactShop in place of the `_storyShowOneTimeTip('relic', …)` call.

**Verification**: First Relic Annex visit shows a portrait dialog matching the other facility intros; the dark-mysterious framing reads in the Relic Keeper's voice.

---
severity: P3
category: dx
anchor_symbol: storyAwareRng
current_line_hint: ~13921
file: battle.html
agents: [consistency-auditor]
fingerprint: 597bc36d66fb
confidence: medium
status: open
---

**Title**: `storyAwareRng()` helper exists but the combat engine still calls bare `Math.random()` at ~250 sites

**Evidence**:
```js
// 13921 — the seeded-RNG selector, referenced only 13× total:
function storyAwareRng() {
    const s = (window.StoryMode && window.StoryMode.state) || null;
    return (s && s.active && typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random;
}
// 22032 / 22537 / 22961 / 23328-23346 / 25243 / 25447 — combat math is all bare:
let crit = (!armorBlocksCrit && Math.random() < critRate) ? … : 1;       // crit
let rng = 0.85 + (Math.random() * 0.15);                                   // damage spread
if (Math.random() * 100 > finalAcc) { break; }                            // accuracy
if (defender.ability === "Static" && Math.random() < 0.3) applyStatus(…); // secondary
```

**Repro**: `grep -c 'Math.random()' battle.html` → 269; `grep -c storyAwareRng` → 13. The per-turn combat rolls (crit, damage 0.85-1.0 spread, accuracy, secondary-effect/status chances, confusion, multi-hit) never route through the seeded RNG. NOTE: this is currently consistent with the determinism *contract* — story-replay.mjs snapshots roster/catch/progression state + `sm._strngState`, not per-turn HP, and its own comment defers turn-level replay to integration tests. So this is **not** a live replay-drift bug today (unlike the prior, now-fixed scope-leak P1s).

**Blast radius**: Forward-looking. REDESIGN_PLAN adds the Fight Club draft gauntlet (5 rounds, counter-pick AI) and leans on "tests behind a SAVE_VER bump." If turn-level deterministic replay is ever wanted for Fight Club regression/save-scum protection, the engine has no seam — `storyAwareRng()` is the intended seam but is unused in the hot path. Flagging now so the redesign decides the determinism scope deliberately rather than discovering 250 unrouted sites mid-implementation.

**Fix sketch**: Decide explicitly whether combat is in the determinism contract. If yes, thread `storyAwareRng()` (or a battle-local seeded rng captured at battle start) through the damage/accuracy/secondary rolls and extend story-replay.mjs to snapshot turn outcomes. If no, document the boundary in a comment at storyAwareRng so future readers don't assume combat is seeded.

**Verification**: Either (a) replaying a seeded story battle twice yields identical HP traces, or (b) a comment at `storyAwareRng()` states combat RNG is intentionally non-deterministic and lists what IS seeded.

---
severity: P3
category: refactor
anchor_symbol: _VARIANT_RIVAL_QUOTES
current_line_hint: ~37458
file: battle.html
agents: [consistency-auditor]
fingerprint: 156f9f10653f
confidence: medium
status: open
---

**Title**: Variant rival quote pools are uneven — several phases have a single line; many phases absent

**Evidence**:
```js
// 37458 — _VARIANT_RIVAL_QUOTES: phase-keyed (0=intro … 4=league). Single-line phases:
bone_keepers:   { 0:[1 line], 2:[1 line], 4:[1 line] },   // no phase 1, 3
project_mewtwo: { 0:[1 line], 2:[1 line], 4:[1 line] },   // no phase 1, 3
lavender_frequency:{ 0:[1 line], 3:[1 line], 4:[1 line] },// no phase 1, 2
```

**Repro**: `getTrainerQuoteForBattle` draws the variant rival line at 50% when a pool exists for the phase; a single-line phase always returns that one line on every variant rival encounter in that phase. The base TRAINER_QUOTES['Rival'] (10 lines) + standing pools still cover the other 50%, so this is not a hard "repeats instantly" bug — but within the variant voice it is one-line-deep, and the comment ("Sparse on purpose") confirms intent.

**Blast radius**: Voice-depth consistency only. The pasta variants are the texture the design charter (REDESIGN_PLAN §1, "creepypasta/leaker texture") leans on; one-line phases thin that texture on repeat rival fights. Lower priority than the base pools, which are deep (TRAINER_QUOTES_BY_NAME, LEADER_VICTORY_LINES, etc. are all ≥2-3 lines and exhaustive across every Gym Leader / E4 / Champion).

**Fix sketch**: Optional — bring the thin variant phases (bone_keepers, project_mewtwo, lavender_frequency) to ≥2 lines each, or accept the sparseness and leave a one-line note that the base Rival pool is the depth backstop. No code change needed; data-only.

**Verification**: Each populated variant phase has ≥2 lines, or a comment documents the single-line-by-design decision.

