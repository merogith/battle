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
status: open
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

