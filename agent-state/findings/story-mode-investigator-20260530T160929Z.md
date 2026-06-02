---
severity: P2
category: design
anchor_symbol: bossCollectLead
current_line_hint: ~48593
file: battle.html
agents: [story-mode-investigator]
fingerprint: 32544380f8c1
confidence: high
status: open
---

**Title**: Caged God "Key" lead has zero cost — spec says it should demand strongest mon or steep gold

**Evidence**:
```js
// _BOSS_LEAD_FLAVOR.key body: "I won't take gold. Only your strongest Pokémon — temporarily."
function bossCollectLead(key) {
    _bossArcEnsureState();
    if (!sm.bossArc.available) return;
    if (sm.bossArc.leads[key]) return;
    ...
    const finish = function () {
        sm.bossArc.leads[key] = true;   // <- key lead: no mon taken, no gold charged
        _bossArcCheckCageUnlock();
```
STORY_MODE_FLOW.md §9 lead 3: "The key — broker won't sell it; demands the player's strongest mon (or a steep gold price)." Code charges nothing — the "temporarily take your strongest mon" line is pure flavor; no mon is escrowed/returned, no gold deducted.

**Repro**: Post-HoF, open Crucible → Post-Game Quest → "Collect Lead — The Key". Watch team/gold: unchanged. Lead flips true immediately.

**Blast radius**: The entire "hunt" tension of the boss arc. Combined with hub-side instant collection (see sibling finding), the three leads are three free button-clicks. This is the single biggest "kills the hunt feel" item the maintainer asked about.

**Fix sketch**: Make the Key lead actually escrow the player's highest-BST party mon (returned post-cage) or charge a large gold price (e.g. 25,000G) via a confirm modal. Even a token cost restores the "I paid something for this" beat. Decide with pasteur (story flow owner).

**Verification**: After collecting Key, team count drops by 1 (or gold drops); after the cage resolves, the escrowed mon returns.

---
severity: P2
category: design
anchor_symbol: _bossArcRenderSection
current_line_hint: ~48566
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7de2a5226091
confidence: high
status: open
---

**Title**: Post-game lead "hunt" collapses to 3 buttons on one Crucible screen — no travel, no gating

**Evidence**:
```js
if (hubMode && !allLeads) {
    // Crucible hub = the post-game Underground: the whole broker network is
    // reachable here, so any uncollected lead can be pulled ...
    const _leadCity = { ledger: 2, recording: 5, key: 8 };
    for (const k of ['ledger', 'recording', 'key']) {
        if (L[k]) continue;
        ...<button onclick="bossCollectLead('${k}')">Collect Lead — ... · City ${_leadCity[k]}</button>
    }
}
```
hubMode=true (the Crucible path) surfaces all three uncollected leads in one place. The "City 2/5/8" labels are the only remaining lore of a 3-city hunt; there is no requirement to actually be in those cities, no ordering, no spacing.

**Repro**: Crucible → Post-Game Quest. All 3 "Collect Lead" buttons present simultaneously. Click 3× → "Enter the Cage" appears. Total elapsed: seconds.

**Blast radius**: Directly answers the maintainer's question "is collecting all 3 leads instantly from the hub too trivial / does it kill the hunt feel?" — yes. The non-hub path (`_bossArcRenderSection()` at ~47924, a real city's PC Underground) correctly shows only the *local* lead, but post-HoF the player is parked at City 9 and can't travel back, so that path is effectively dead and the hub path is the only one used.

**Fix sketch**: Options for maintainer: (a) gate each lead behind a Crucible-sourced micro-encounter (a corrupted-Center wild fight or a short scene with a cost) so collection takes 3 deliberate actions; (b) stagger: only reveal lead N+1 after lead N is collected, with a flavor beat between; (c) tie lead collection to Frontier rounds or gym rematches so the player engages the rest of the post-game hub. Any of these restores pacing without re-introducing the "can't reach City 2/5/8" reachability bug the hub-surfacing was meant to fix.

**Verification**: Leads cannot all be obtained in a single uninterrupted screen session.

---
severity: P1
category: bug
anchor_symbol: _bossArcCheckCageUnlock
current_line_hint: ~48494
file: battle.html
agents: [story-mode-investigator]
fingerprint: a319172728a4
confidence: high
status: fixed-main
---

**Title**: Boss arc soft-locks if enabled gens contain no legendary — cage unlocks but can never be entered

**Evidence**:
```js
function _bossArcCheckCageUnlock() {
    const all = !!(L.ledger && L.recording && L.key);
    if (all && !sm.bossArc.cageUnlocked) {
        sm.bossArc.cageUnlocked = true;          // set unconditionally
        if (!sm.bossArc.boss) sm.bossArc.boss = _bossArcRollLegendary();  // may return null
        ...
// bossEnterCage:
if (!sm.bossArc.boss) {
    sm.bossArc.boss = _bossArcRollLegendary();
    if (!sm.bossArc.boss) { showGameAlert('No legendary Pokémon available...'); return; }
}
```
`_bossArcRollLegendary()` returns null when no `speciesDexIsLegendaryTier` species exist in the enabled gens. `cageUnlocked` is still flipped true and `bossArc.cleared` never flips, so the post-game quest section stays rendered forever with an "Enter the Cage — ???" button that always bounces with an alert.

**Repro**: Start a run with an enabled-gen set that has no sub-legendary/restricted legendary (hard to hit with default gens 1-9, but reachable via a narrow custom gen selection), reach post-HoF, collect 3 leads. Cage unlocks; "Enter the Cage" alerts and refuses; the quest cannot be completed.

**Blast radius**: The boss-arc completion + the `caged_god`/`r_caged_god` achievements + the post-game "over" declaration. Narrow trigger, but a permanent dead quest with no recovery path.

**Fix sketch**: Guard the *post-HoF Master Ball grant* (continuePostGame) and/or `_bossArcCheckCageUnlock` so that if `_bossArcRollLegendary()` yields nothing, the arc is marked unavailable (or the leads are not offered) with an explanatory message ("The Caged God arc needs at least one Legendary in your enabled generations"). Do not flip `cageUnlocked` when no boss can be rolled.

**Verification**: With a legendary-free gen set, the Caged God section is suppressed or shows a clear "unavailable" note; with at least one legendary, the cage opens normally.

---
severity: P2
category: design
anchor_symbol: continuePostGame
current_line_hint: ~53501
file: battle.html
agents: [story-mode-investigator]
fingerprint: da289fe043c3
confidence: high
status: open
---

**Title**: Single Master Ball is a free consumable — spending it pre-cage leaves boss arc as a 1%-per-throw grind

**Evidence**:
```js
// continuePostGame, first post-HoF entry:
if (!sm.bossArc.available) {
    sm.bossArc.available = true;
    sm.balls.master = (sm.balls.master | 0) + 1;   // one Master Ball, ever
    showGameAlert('The Underground broker hands you a Master Ball...');
}
// throw path (any wild encounter):
sm.balls[ballKey] = (sm.balls[ballKey] | 0) - 1;   // master is decremented like any ball
```
The Master Ball lives in `sm.balls.master` and is throwable at any route wild, roaming legendary, or Crucible Wild Encounter. Nothing reserves it for the cage. The boss catch overrides catchRate to 0.01, so PokéBall=1%, Ultra=2% — a stubborn grind, but not a hard lock (flee chance is low for the boss).

**Repro**: Post-HoF, go to Crucible → Wild Encounter, throw the Master Ball at a random wild (guaranteed catch). Then collect the 3 leads and enter the cage with 0 Master Balls. The only path left is 1-2% PokéBall/Ultra throws.

**Blast radius**: Maintainer's explicit question "what happens if the player has no Master Ball? Can the arc soft-lock?" — answer: not a hard soft-lock (grind is possible), but a severe pacing failure and an obvious foot-gun. The orientation tip warns "The Caged God needs the Master Ball — saved for that one fight," but nothing enforces it.

**Fix sketch**: Either (a) reserve the boss-arc Master Ball as a separate non-throwable token granted only at cage entry (cleanest — removes the foot-gun entirely), or (b) re-grant a Master Ball when the cage unlocks if `sm.balls.master === 0`, or (c) make the boss forced-catch a guaranteed catch on any ball once HP hits 0 (the 0.01 rate becomes flavor). Decide with pasteur.

**Verification**: A player who spent the Master Ball earlier can still complete the cage without a multi-dozen-throw grind.

---
severity: P3
category: inconsistency
anchor_symbol: _BOSS_LEAD_CITIES
current_line_hint: ~48431
file: battle.html
agents: [story-mode-investigator]
fingerprint: 62f1b4b5cef8
confidence: high
status: open
---

**Title**: Lead→city mapping duplicated (`_BOSS_LEAD_CITIES` const vs inline `_leadCity` literal)

**Evidence**:
```js
const _BOSS_LEAD_CITIES = { 2: 'ledger', 5: 'recording', 8: 'key' };   // line ~48431
...
// inside _bossArcRenderSection hubMode branch (~48570):
const _leadCity = { ledger: 2, recording: 5, key: 8 };   // inverse map, re-declared inline
```
Two sources of truth for the same ledger/recording/key ↔ city-2/5/8 mapping. A future timeline shuffle that moves a lead to a different city must be edited in two places or the hub labels desync from the actual local-lead gating.

**Repro**: Static — grep both literals.

**Blast radius**: Boss-arc lead UI labels. Low severity (lore-only city numbers), but a latent inconsistency trap.

**Fix sketch**: Derive `_leadCity` by inverting `_BOSS_LEAD_CITIES` once (e.g. build an inverse map next to the const), or read city numbers from the single const in the render.

**Verification**: Changing `_BOSS_LEAD_CITIES` updates both the local-lead gating and the hub button labels.

---
severity: P3
category: dx
anchor_symbol: frontierSurrender
current_line_hint: ~48295
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2a1b8a63bc6e
confidence: high
status: open
---

**Title**: Crucible-reachable Frontier surrender uses raw window.confirm — drops fullscreen, breaks modal convention

**Evidence**:
```js
function frontierSurrender() {
    ...
    const ok = window.confirm('Surrender? Streak ' + cur + ' will be saved...');
    if (!ok) return;
```
The file header comment (line ~8644) states the codebase uses in-page messages "instead of native alert()/confirm() so fullscreen is not dropped by the browser." Most flows use `window.showGameConfirm`. `frontierSurrender` (and the Fight Club forfeit at ~44591) use raw `window.confirm` with no `showGameConfirm` path.

**Repro**: Enter fullscreen, Crucible → Battle Frontier → start run → Surrender. Browser exits fullscreen for the native dialog.

**Blast radius**: Battle Frontier is post-game (technically out of active scope), but it's surfaced directly in the Crucible the maintainer is actively editing, so the inconsistency is now in the priority surface. Low severity.

**Fix sketch**: Replace with `await window.showGameConfirm(...)` like the EV-wipe and new-adventure paths.

**Verification**: Surrender prompt renders as an in-page modal; fullscreen is preserved.

---
severity: P2
category: dx
anchor_symbol: catch-system.test
current_line_hint: tests/integration/catch-system.test.js:33
file: tests/integration/catch-system.test.js
agents: [story-mode-investigator]
fingerprint: 9466f74e1032
confidence: high
status: open
---

**Title**: PC-cap integration test asserts cap 10 (stale) and passes only via false-positive regex match

**Evidence**:
```js
test('catch-system: PC cap of 10 is documented in STORY_MODE_FLOW.md', async () => {
  ...
  assert.match(flow, /cap\s+10|10\s+(slots|max|cap|mons)/i, 'spec must mention PC cap of 10');
```
The real cap is `PC_BOX_CAP = 30` and STORY_MODE_FLOW.md §7 was deliberately raised to 30. The test still claims "cap of 10" and only passes because the regex `10\s+...cap` happens to match unrelated text ("Round 10 caps the Frontier curve"). It does NOT validate the actual cap, and would keep passing even if the spec/code diverged further.

**Repro**: `node --test --test-name-pattern="PC cap of 10" tests/integration/catch-system.test.js` → ok 1. Then grep the spec: the only match is the Frontier-curve line, not a PC statement.

**Blast radius**: Save/catch regression coverage. The test gives false confidence; the genuine PC-overflow path (party 6/6 + PC 30/30 → explicit modal in `_catchHandleSuccess`) is correct but untested. (The `tests/integration/save-migration.test.js` "Pre-v15 round-trip" coverage is also worth re-checking against the current v22 chain.)

**Fix sketch**: Rewrite the test to import the engine and assert `PC_BOX_CAP === 30`, plus drive a 6/6 + 30/30 catch and assert the failure modal text. Drop the brittle spec-regex form.

**Verification**: Test fails if `PC_BOX_CAP` changes without spec update; exercises the real overflow modal.

---
severity: P3
category: inconsistency
anchor_symbol: _SAFARI_GRADE_CURVE_BY_BADGES
current_line_hint: ~47953
file: battle.html
agents: [story-mode-investigator]
fingerprint: 191bc4dc63de
confidence: high
status: open
---

**Title**: Safari grade weights are a per-badge curve in code, but STORY_MODE_FLOW.md §4 still specs the old flat g1:3/g2:22/g3:50/g4:25

**Evidence**:
```js
const _SAFARI_GRADE_CURVE_BY_BADGES = {
    3: { g1: 0, g2: 5,  g3: 60, g4: 35 },  // first unlock @ City 4
    4: { g1: 0, g2: 15, g3: 60, g4: 25 },
    ...
    8: { g1: 5, g2: 50, g3: 40, g4: 5  }   // post-G8 / Crucible re-entry
};
// comment: "Pre-v19 was static {g1:3,g2:22,g3:50,g4:25}."
```
STORY_MODE_FLOW.md §4 line 103 still lists `SAFARI_GRADE_WEIGHTS g1:3 / g2:22 / g3:50 / g4:25` as the live value, and the prior audit's "verify code matches" expects the flat table. The code intentionally moved to a badge-gated curve (a maxwell change). 6-encounter / 15-ball / 10kG entry all still match spec.

**Repro**: Static — compare §4 to `_SAFARI_GRADE_CURVE_BY_BADGES`.

**Blast radius**: Doc accuracy only; the curve itself is a deliberate balance evolution. Flagging so the canonical spec doesn't keep claiming a flat table that no longer exists.

**Fix sketch**: Update STORY_MODE_FLOW.md §4 to describe the per-badge curve (pasteur/maxwell), or add a one-line "superseded by `_SAFARI_GRADE_CURVE_BY_BADGES`" note.

**Verification**: Spec §4 matches the shipped curve.

---
severity: P3
category: inconsistency
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~14733
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7e1cdcbb0b91
confidence: high
status: open
---

**Title**: Spec §8 says league boost stacks multiplicatively with difficulty; code now stacks additively (the cliff was fixed)

**Evidence**:
```js
// League boost ... stored as additive deltas on the mon ... so difficulty and
// boss boost stack ADDITIVELY (not multiplicatively).
// Stops the 1.30 × 1.40 = 1.82 cliff between Normal and Challenge.
const hpMult   = mult + (lb && lb.hp   ? lb.hp   : 0);
```
STORY_MODE_FLOW.md §8 line 195 still states "applied before applyFoeDifficultyScaling, so the two stack multiplicatively. Champion HP on Hard ≈ ×1.30 × ×1.15 = ×1.495." The code explicitly switched to additive to kill that cliff — resolving prior-audit balance item 2.5. Spec is now stale on this point.

**Repro**: Static — §8 vs the additive `mult + lb.hp` formula.

**Blast radius**: Doc accuracy; the additive behavior is the correct/intended one. Important because §8 is cited as canon for difficulty tuning.

**Fix sketch**: Update §8 to document additive stacking and the new effective multipliers (maxwell territory).

**Verification**: Spec §8 matches `applyFoeDifficultyScaling`.

---
severity: P3
category: design
anchor_symbol: _renderCrucible
current_line_hint: ~48135
file: battle.html
agents: [story-mode-investigator]
fingerprint: 0fa929cda809
confidence: medium
status: open
---

**Title**: Crucible "Pokémon Center" facility re-renders the Caged God section a second time (below the Underground sell list)

**Evidence**:
```js
// _renderCrucible top: Post-Game Quest section = _bossArcRenderSection(true)
const cagedGodHtml = _bossArcRenderSection(true);
// ...Facilities → "Pokémon Center" button → enterPokemonCenter() → _pcRenderUndergroundTab()
//    which ends with:  html += _bossArcRenderSection();   // (~47924, hubMode=false)
```
From inside the Crucible, opening the "Pokémon Center" facility renders the Underground tab, which appends `_bossArcRenderSection()` with hubMode=false. Since the player is parked at a non-2/5/8 city post-HoF, that path shows the dead "No lead here. Try City 2, 5, or 8." block — directly contradicting the Crucible's top-level Post-Game Quest section that lets you collect every lead from the same hub.

**Repro**: Post-HoF, Crucible → Facilities → Pokémon Center → Underground tab. Scroll past the sell list: a second Caged God box appears saying leads are elsewhere, even though the Crucible's own quest section above says otherwise.

**Blast radius**: Player wayfinding/confusion in the maintainer's freshly sub-sectioned Crucible. Two contradictory Caged God affordances in one navigation context.

**Fix sketch**: Suppress `_bossArcRenderSection()` in the Underground tab when `sm.atCrucible` is true (the Crucible's Post-Game Quest section already owns it), or pass hubMode through so it shows the same collectable buttons. Simplest: `if (!sm.atCrucible) html += _bossArcRenderSection();`.

**Verification**: Inside the Crucible, the Caged God appears exactly once (the top quest section), never as a "no lead here" dead block.

---
severity: P3
category: design
anchor_symbol: _bossArcRenderSection
current_line_hint: ~48579
file: battle.html
agents: [story-mode-investigator]
fingerprint: 90bad6000f2f
confidence: high
status: open
---

**Title**: Non-hub Caged God render path is effectively dead post-HoF (player can never be at City 2/5/8)

**Evidence**:
```js
} else if (localLeadKey && L[localLeadKey]) {
    html += `<div ...>Lead collected.</div>`;
} else if (!allLeads) {
    html += `<div ...>No lead here. Try City 2, 5, or 8.</div>`;
}
```
The non-hub branch (hubMode falsy, from a real city's PC Underground tab) keys the offered lead on `cityIndexFromEventIndex(sm.eventIndex)`. But the boss arc only becomes available post-HoF, and post-HoF the player is parked at the last visited city (City 9 region) with no backward city travel — exactly the reachability gap the maintainer surfaced the Crucible hub path to fix. So this branch only ever renders "No lead here. Try City 2, 5, or 8.", which is misleading (you literally cannot travel there).

**Repro**: Post-HoF, open any city's Pokémon Center → Underground tab. Always shows "No lead here."

**Blast radius**: Player confusion + dead code. The branch was written for an intra-run collection model that the post-game-only gating made unreachable.

**Fix sketch**: Either (a) drop the non-hub branch entirely and only render the Caged God in the Crucible (single source), or (b) if the maintainer ever wants intra-run lead collection, the boss arc would need to be available pre-HoF — a larger design change. Pairs with the Crucible-double-render finding (suppress when `sm.atCrucible`).

**Verification**: No "No lead here. Try City 2, 5, or 8." dead text is reachable in normal post-HoF flow.

---
severity: P3
category: design
anchor_symbol: crucibleGymPick
current_line_hint: ~48165
file: battle.html
agents: [story-mode-investigator]
fingerprint: f93740a17e98
confidence: medium
status: open
---

**Title**: Crucible rematch pickers use bare Math.random — breaks the seeded-replay contract for post-game

**Evidence**:
```js
function crucibleGymPick() {
    const row = _CRUCIBLE_GYM_ROWS[Math.floor(Math.random() * _CRUCIBLE_GYM_ROWS.length)];
    _crucibleBattleSetup(row, 'gym');
}
// also: _rollFrontierTeam / crucibleWildEncounter / _bossArcRollLegendary fall back to
// Math.random when sm.active is true-but-storyRngNext-path-not-taken
```
CLAUDE.md architecture rule: "Use seeded RNG (storyRngNext) everywhere user-visible, never bare Math.random()." Crucible gym selection picks the opponent via `Math.random`. Several post-game rolls (frontier team, wild encounter species) also use `Math.random` — some of those are *intentionally* unseeded (wild species, see `_pickWildSpeciesRandom` comment), but the gym pick and frontier team are user-visible battle setups that arguably should be seeded for shared-seed reproducibility.

**Repro**: Crucible → Random Gym Rematch repeatedly on the same seed → different leaders. (Likely acceptable for an endless rematch hub, but inconsistent with the stated determinism contract.)

**Blast radius**: Determinism/replay contract in the post-game. Low practical impact (post-game is freeform), but worth a maintainer decision on whether the Crucible is exempt from the seeded-RNG rule.

**Fix sketch**: Either route Crucible battle-setup rolls through `storyRngNext`, or add an explicit "post-game hub is intentionally unseeded" note next to `_CRUCIBLE_GYM_ROWS` so future audits stop flagging it.

**Verification**: Documented decision or seeded picks.

---
severity: P3
category: inconsistency
anchor_symbol: showVictoryOverlay
current_line_hint: ~49869
file: battle.html
agents: [story-mode-investigator]
fingerprint: fc1331e5a296
confidence: low
status: open
---

**Title**: Subject Zero stored to PC (party-full at cage) shows "Subject Zero" nickname but is never auto-fielded — easy to miss the capstone mon

**Evidence**:
```js
if (!partyFull) {
    sm.team.push(caught);
} else if (bossMode) {
    sm.pcBox.push(caught);   // capstone reward silently sent to PC, no swap prompt
}
```
The boss-arc catch deliberately skips the party-swap prompt ("the story beat needs the unique mon in your hand right now") — but if the party is already at the cap (6/6 post-HoF), Subject Zero goes to the PC with no prompt and the success message still reads as if it joined. A player at 6/6 finishes the climactic arc and the legendary is in storage, not their hand — undercutting the intended "in your hand right now" beat.

**Repro**: Post-HoF with a full 6/6 party, complete the cage. Subject Zero lands in PC, not party.

**Blast radius**: Endgame payoff framing. Narrow (only at 6/6), low severity.

**Fix sketch**: When party is full in bossMode, offer the same swap prompt as normal catches (or auto-swap the lowest-BST non-unsellable mon to PC and field Subject Zero), and adjust the success message to say where it went.

**Verification**: At 6/6, the player is told Subject Zero is in the PC, or is given a swap choice.

---
severity: P3
category: dx
anchor_symbol: STORY_MODE_AUDIT
current_line_hint: docs/STORY_MODE_AUDIT.md
file: docs/STORY_MODE_AUDIT.md
agents: [story-mode-investigator]
fingerprint: bd78781b71ff
confidence: high
status: open
---

**Title**: docs/STORY_MODE_AUDIT.md is stale — most of its flagged issues are now fixed (SAVE_VER 14→22)

**Evidence**:
Prior audit cites SAVE_VER=14, 68 rows, line numbers in the 21k–28k range, "Mystery Figure sprite unconditionally Cyrus", "GYM_CITY_LEADER_EVENT hard-coded map", "RIVAL_ATTACK_TYPE_DECAY ÷30", "Hard pays ×0.92", "league boost stacks multiplicatively", "mystery prof breaks if party < 6". Verified this session against current code (SAVE_VER=22):
- GYM_CITY_LEADER_EVENT is now DERIVED from STORY_EVENTS_RAW at boot (1.3 fixed).
- Mystery Figure is a deliberate single identity "The First" / Red sprite (4.x / 1.x fixed by design).
- RIVAL_ATTACK_TYPE_DECAY removed; rival uses a scored cycling counter-type pool (1.2 fixed).
- Hard coin mult floored at ×1.00, Challenge ×1.10 (2.1 fixed).
- League boost now stacks ADDITIVELY, killing the cliff (2.5 fixed).
- Professor "full" is cap-aware via `_storyMaxPartySize`, swap flow intact (1.9 fixed).
- Per-leader victory lines exist (LEADER_VICTORY_LINES, data-driven) (Fun #1 fixed).
- Post-HoF Mystery win now grants a real bundle, not a dead-end reward (2.6 fixed).

**Repro**: Compare doc claims to current anchors via find-anchor.

**Blast radius**: Audit hygiene — future agents re-flag fixed issues if they trust the doc. Several prior-audit items genuinely remain (e.g. casino still a coin-flip + slots/roulette only, signature-mon probability still per-trainer) and should be re-triaged separately.

**Fix sketch**: Add a "STATUS as of SAVE_VER 22 / branch endgame-crucible" header to the audit doc marking the resolved items, or migrate the still-open ones into ISSUE_LEDGER.md and archive the doc.

**Verification**: The doc no longer presents fixed issues as open.

---
severity: P0
category: bug
anchor_symbol: crucibleMysteryFight
current_line_hint: ~48159
file: battle.html
agents: [story-mode-investigator]
fingerprint: 691dcd5cb693
confidence: high
status: open
---

**Title**: Crucible "Mystery Figure" button is dead — STORY_POST_HOF_MYSTERY_ROW (67) is out of bounds as an array index

**Evidence**:
```js
const STORY_POST_HOF_MYSTERY_ROW = 67;           // this is a ROW ID
function crucibleMysteryFight() { _crucibleBattleSetup(STORY_POST_HOF_MYSTERY_ROW, 'mystery'); }
// _crucibleBattleSetup:  sm.eventIndex = targetEventIdx|0;  const ev = STORY_EVENTS_RAW[sm.eventIndex];
//                        if (!ev) { sm.crucibleBattleSource = null; enterCrucible(); return; }
```
`STORY_EVENTS_RAW` has 67 entries (array indices 0–66). The Mystery Figure row has **row id 67** but sits at **array index 66**. `_crucibleBattleSetup` assigns `sm.eventIndex = 67` then reads `STORY_EVENTS_RAW[67]` → `undefined` → bails straight back to `enterCrucible()`. The button does nothing.

**Repro** (jsdom): `StoryMode.crucibleMysteryFight()` with a post-HoF sm → `sm.eventIndex` becomes 67, `crucibleBattleSource` reset to null, screen returns to Crucible. Confirmed: `STORY_EVENTS_RAW[67] === undefined`; Mystery Figure is at index 66.

**Blast radius**: The Crucible Mystery Figure encore (the maintainer's named priority: "Mystery Figure post-HoF climax + rematch"). The *first* climax via `continuePostGame` works because it uses `findIndex` (resolves to 66); only the Crucible replay button is broken. `continuePostGame` and `_storyMilestoneKeyForEvent` compare `rowIdx === STORY_POST_HOF_MYSTERY_ROW` against `ev[0]` (the row id), so the constant value 67 is correct *there* — the bug is feeding a row-id into the array-index-expecting `_crucibleBattleSetup`.

**Fix sketch**: Resolve the array index by name/row-id inside the Crucible setup, e.g. `const idx = STORY_EVENTS_RAW.findIndex(r => r && (r[0]|0) === STORY_POST_HOF_MYSTERY_ROW);` and pass `idx`. Best: make `_crucibleBattleSetup` accept a row id and resolve internally, so all four callers are fixed at once (see sibling findings).

**Verification**: Crucible → Mystery Figure launches the masked-trainer fight; `crucibleBattleSource === 'mystery'` after entry.

---
severity: P0
category: bug
anchor_symbol: crucibleRivalFight
current_line_hint: ~48160
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9e4b435d44de
confidence: high
status: open
---

**Title**: Crucible "Rival Rematch" targets the Hall of Fame row — STORY_LEAGUE_RIVAL_ROW (65) is a row id, not the array index (64)

**Evidence**:
```js
const STORY_LEAGUE_RIVAL_ROW = 65;               // ROW ID
function crucibleRivalFight() { _crucibleBattleSetup(STORY_LEAGUE_RIVAL_ROW, 'rival'); }
// enterBattleEvent(ev,...):  if (ev[1] !== 'Battle') { ... if (ev[1]==='Hall of Fame'){ showHallOfFame(); return; } }
```
The league Rival has row id 65 but sits at **array index 64**. Array index 65 is the **Hall of Fame** row. `_crucibleBattleSetup(65)` sets `sm.eventIndex = 65`, reads the HoF row (which is truthy, so the `!ev` guard passes), and hands it to `enterBattleEvent`, whose non-Battle branch calls `showHallOfFame()`. The Rival Rematch button shows the Hall of Fame screen instead of a rival fight.

**Repro** (jsdom): `StoryMode.crucibleRivalFight()` → `sm.eventIndex = 65` → `STORY_EVENTS_RAW[65]` = `["Hall of Fame", ...]`. Confirmed the actual league Rival is at array index 64.

**Blast radius**: Crucible Rival Rematch (maintainer-named post-game feature). Same root cause as the Mystery and League findings.

**Fix sketch**: Resolve via row id: `STORY_EVENTS_RAW.findIndex(r => r && (r[0]|0) === STORY_LEAGUE_RIVAL_ROW)` (= 64) before passing to setup; or make `_crucibleBattleSetup` row-id-based.

**Verification**: Crucible → Rival Rematch launches the league rival 6v6, not the HoF screen.

---
severity: P0
category: bug
anchor_symbol: _CRUCIBLE_LEAGUE_ROWS
current_line_hint: ~48057
file: battle.html
agents: [story-mode-investigator]
fingerprint: 307c0fad776a
confidence: high
status: open
---

**Title**: Crucible League Run + Random Gym Rematch use row ids as array indices — wrong opponents (skips E1, runs into Rival; can launch City3)

**Evidence**:
```js
const _CRUCIBLE_GYM_ROWS   = [5, 11, 18, 24, 31, 38, 46, 53]; // labelled "GL1..GL8" — these are ROW IDS
const _CRUCIBLE_LEAGUE_ROWS = [60, 61, 62, 63, 64];          // labelled "E1..E4 + Champion" — ROW IDS
// consumed as array indices:  _crucibleBattleSetup(_CRUCIBLE_LEAGUE_ROWS[0]) -> sm.eventIndex = 60 -> STORY_EVENTS_RAW[60]
```
Resolved against the array (length 67):
- `_CRUCIBLE_LEAGUE_ROWS` as array indices = **E2, E3, E4, Champion, Rival** — the League Run starts at E2 (skips E1) and ends on the post-Champion *Rival* as a bogus 5th "league" stage. (E1 is at array index 59, Champion at 63.)
- `_CRUCIBLE_GYM_ROWS[2] = 18` → array index 18 = **City3** (a City row). A Random Gym Rematch that rolls Gym 3 (1/8 chance) hands a City row to `enterBattleEvent`, which calls `enterCity()` — dumping the player into City3's hub instead of a gym fight. (Gym Leader 3 is at array index 17.) Indices 5/11/24/31/38/46/53 happen to coincide with their rows, so 7 of 8 gyms work by luck; only GL3 is misrouted.

**Repro** (jsdom): `StoryMode.crucibleLeagueRun()` → `sm.eventIndex = 60` → `STORY_EVENTS_RAW[60][2] === 'E2'`. `_CRUCIBLE_GYM_ROWS[2] = 18` → `STORY_EVENTS_RAW[18][1] === 'City'`.

**Blast radius**: Crucible League Run and Random Gym Rematch (post-game hub the maintainer just sub-sectioned). The league-chain bug compounds via `_handleCrucibleBattleEnd` which advances `_CRUCIBLE_LEAGUE_ROWS[stage+1]` (also indices). Root cause is shared with the Mystery/Rival findings: row id ≠ array index after the Rival rows (ids 12/39/65) and City3 were spliced out of id-order in the literal.

**Fix sketch**: Derive all four constants from `STORY_EVENTS_RAW` by event name at boot, mirroring `GYM_CITY_LEADER_EVENT`'s `buildGymCityLeaderMap` pattern — e.g. build `{1: arrIdx, ...}` for `Gym Leader N`, and `[E1idx,E2idx,E3idx,E4idx,Champion idx]` for the league. This makes them shift-proof. Add a boot-time assertion that each resolved index's `row[2]` matches the expected event name.

**Verification**: League Run = E1→E2→E3→E4→Champion (5 stages, no Rival); every Random Gym Rematch launches a Gym Leader battle (never a City/HoF screen).

---
severity: P2
category: bug
anchor_symbol: continuePostGame
current_line_hint: ~53483
file: battle.html
agents: [story-mode-investigator]
fingerprint: 86b897ccf02f
confidence: low
status: open
---

**Title**: Pre-boss-arc post-HoF saves may never receive the Master Ball / boss arc if parked at a city row on load

**Evidence**:
```js
// migrateStoryPreV15: pre-boss-arc saves have no sm.bossArc -> climax flag = false
sm.postHofMysteryClimaxDone = !!(sm.bossArc && sm.bossArc.available);  // => false
// continuePostGame (the only place bossArc.available + Master Ball are granted) is
// reached ONLY from the HoF screen Continue button or after the climax battle.
// continueRun() -> processNextEvent(); if sm.eventIndex is parked on a City row,
// it just enterCity() — continuePostGame never fires.
```
A save made on a pre-boss-arc build that had already cleared the Champion and snapped `eventIndex` back to a city (the old post-HoF behavior) would migrate with `postHofMysteryClimaxDone = false`, but on load `processNextEvent` routes to `enterCity()` and never re-shows the HoF Continue button. The climax never fires → boss arc + Master Ball never granted → the Crucible button (gated on `sm.bossArc.available`) never appears → the player has no access to ANY post-game content.

**Repro**: Hard to construct without an archived pre-v15 post-HoF save; depends on exactly where the old champion-victory flow parked `eventIndex` (HoF row = recoverable via `showHallOfFame`; city row = stranded). Marked low confidence pending an old-save artifact.

**Blast radius**: Migration completeness for the oldest post-HoF saves. Population is likely small (boss arc shipped at v15), but the failure mode is total post-game lockout with no recovery path.

**Fix sketch**: In `load()` (or a vN migration), detect "league cleared but boss arc never granted" (e.g. `sm.badges >= 8` and a champion-clear marker true, `postHofMysteryClimaxDone` false, `bossArc` absent) and either route through `continuePostGame` once or grant the Master Ball + `bossArc.available` directly.

**Verification**: An archived pre-v15 post-HoF save loads into a state where the Crucible/Caged God are reachable.

---
severity: P3
category: design
anchor_symbol: enterCrucible
current_line_hint: ~48118
file: battle.html
agents: [story-mode-investigator]
fingerprint: 75a751b3f4d7
confidence: medium
status: open
---

**Title**: Crucible sub-sections improve wayfinding but the orientation tip + "Mystery vs Caged God" disambiguation still lean on long alert text

**Evidence**:
```js
<h4>Post-Game Quest</h4> ... <h4>Battles</h4> ... <h4>Facilities</h4>
//   Train & Evolve / Shop / Catch, Store & Trade sub-headers (good)
// but disambiguation is carried by button title= tooltips + a multi-paragraph
// _storyShowOneTimeTip('crucible', '...The Mystery Figure is a separate masked
//   trainer — not the Caged God...') and the orientation tip in continuePostGame.
```
The maintainer's sub-sectioning (Post-Game Quest / Battles / Facilities{Train&Evolve, Shop, Catch}) is a clear improvement. Remaining friction: (1) the Mystery-Figure-vs-Caged-God distinction is only explained in a one-time alert + a hover tooltip — on a touch device with the tip dismissed, the two purple "mystery"-flavored affordances (Caged God section + Mystery Figure button) read as the same thing; (2) there is no persistent inline caption under the Mystery Figure button repeating "separate from the Caged God hunt above."

**Repro**: Post-HoF on touch, dismiss the orientation tip, open Crucible → the Mystery Figure button and the Caged God quest box both use purple/🔮-🥷 styling with no persistent on-screen text linking/distinguishing them.

**Blast radius**: Post-game wayfinding (maintainer-named concern). Low severity; purely additive copy.

**Fix sketch**: Add a one-line persistent caption under the Mystery Figure button ("A masked 6-mon trainer rematch — not the Caged God quest above") and/or a small "?" affordance that re-opens the disambiguation tip on demand. Consider a different accent color for the Caged God section vs the Mystery button.

**Verification**: A player who never reads the alert can still tell the two purple affordances apart from on-screen text alone.

