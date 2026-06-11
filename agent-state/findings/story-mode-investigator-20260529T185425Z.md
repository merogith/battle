---
severity: P1
category: bug
anchor_symbol: isPreLeagueLegendaryMysteryGate
current_line_hint: ~42530
file: battle.html
agents: [story-mode-investigator]
fingerprint: 659dab26287d
confidence: high
status: fixed-main
---

**Title**: City-8 legendary Mystery gate is bypassed if party has < 6 members

**Evidence**:
```js
// enterProfessor: mystery (legendary) mode only when party is AT the badge cap
const isFull = sm.team.length >= _storyMaxPartySize(); // 6 at 8 badges
_profMysteryMode = isFull;
_profLegendaryMysteryMode = _profMysteryMode && isPreLeagueLegendaryMysteryGate(cityIdx);
// renderCityActions:
const swapMode = hasProf && !hasTeamRoom && !profUsedHere;   // needs party==6
const legendMysteryGate = swapMode && _legendaryGateHere;    // false when party<6
```

**Repro**: Reach the City-8 post-gym hub (row 55, 8 badges) with a party of 5 or fewer. The hub forces a *normal* G2 Professor pick (PROF_ROLLS[8] = {g2:100}) instead of the legendary Mystery Figure gate. Accepting it fills slot 6 and sets profUsed[8], opening Leave City — the player never receives the legendary nor sees the gate. seedDebugMysteryLegendGate itself only ever builds a 6-mon filler team, confirming the gate was designed for the at-cap case exclusively.

**Blast radius**: Victory Road framing ("no challenger walks the final gate without a legendary in hand") is broken for lean runs; the legendary reward and the one-time 'legendary-gate' tip never fire. Related to prior audit item 1.9 (post-HoF variant), but this is the live pre-League gate.

**Fix sketch**: Treat the City-8 legendary gate as legendary-mode whenever isPreLeagueLegendaryMysteryGate(cityIdx) is true regardless of isFull — when party<6, append the legendary to the team (free add) instead of forcing a swap; keep the swap/send-to-PC flow only at 6/6.

**Verification**: Set up sm at City8 row 55, badges=8, team of 4; call enterProfessor; assert _profLegendaryMysteryMode is true and the offered species is legendary-tier.

---
severity: P2
category: balance
anchor_symbol: PROF_ROLLS
current_line_hint: ~32137
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1ac1fa493205
confidence: high
status: open
---

**Title**: City-0 starter pick is drawn from a pure-G4 (weakest tier) pool

**Evidence**:
```js
const PROF_ROLLS = [
  {g1:0, g2:0, g3:0, g4:100}, // C0 — pure G4 basic
  ...
];
// First professor pick at City0 -> isStarterPick:true (starter:true badge),
// all 3 choices are guaranteed grade-4 (weakest band).
```

**Repro**: New game -> City0 Professor -> all three starter cards are G4. The player's flagged "★ STARTER" is always a weakest-grade species, carried through the first several battles.

**Blast radius**: First-impression balance + early-game difficulty feel. NOTE: difficulty-curve numbers are maxwell-owned (CLAUDE.md) — flag only, do not edit. Prior audit §2.4 recommended flooring City0 at G3; still unaddressed.

**Fix sketch**: (maxwell) Floor the City0 starter pool at G3, e.g. {g3:30,g4:70}, or weight a regional-starter homage trio higher.

**Verification**: Confirm PROF_ROLLS[0] includes a non-zero g3 share and the starter cards reflect it.

---
severity: P3
category: bug
anchor_symbol: enterProfessor
current_line_hint: ~45024
file: battle.html
agents: [story-mode-investigator]
fingerprint: d0f5b2e6c31c
confidence: high
status: open
---

**Title**: Professor flavor quote uses bare Math.random(), breaking seeded replay determinism

**Evidence**:
```js
_profQuote = PROF_QUOTES[Math.floor(Math.random() * PROF_QUOTES.length)];
// chosen BEFORE the storyRngNext seed-override block (~45050) and never seeded
```

**Repro**: Re-enter the same Professor visit on the same run seed after a refresh; the flavor quote differs run-to-run. Same class as prior audit 1.1 (rival intro line).

**Blast radius**: Cosmetic only; violates the "seed determines everything user-visible" contract in CLAUDE.md. Choices themselves are correctly seeded.

**Fix sketch**: Route the quote pick through storyRngNext (or the prof seed key) so the visit reproduces.

**Verification**: Two enterProfessor calls with identical sm/runSeed produce identical story-prof-quote text.

---
severity: P3
category: bug
anchor_symbol: enterProfessor
current_line_hint: ~45149
file: battle.html
agents: [story-mode-investigator]
fingerprint: c0b555664db0
confidence: medium
status: fixed-claude/gifted-fermat-yfnqq5
---

**Title**: Empty-choices Professor path shows status but renders no body buttons

**Evidence**:
```js
if (!choices.length) {
    statusEl.textContent = 'No Pokémon available for your enabled generations.';
    showScreen('screen-story-professor');
    return; // returns BEFORE _renderProfChoices(); btnsEl left as-is
}
```

**Repro**: Force an empty enabled-gen pool at a Professor city. The body shows the error text with no Back/Accept buttons; the player must use the small header back arrow. Not a hard softlock (header back exists) but the in-body action area is empty/stale.

**Blast radius**: UX dead-end feel; relies entirely on header chrome. Realistically only reachable via aggressive gen toggles.

**Fix sketch**: Before the early return, render a single "← Back to City" button into story-prof-buttons (or clear btnsEl and add it).

**Verification**: Trigger the empty pool; confirm a Back button appears in the body.

---
severity: P3
category: dx
anchor_symbol: migrateStoryPreV16
current_line_hint: ~34628
file: battle.html
agents: [story-mode-investigator]
fingerprint: 0f033b3c2f01
confidence: medium
status: open
---

**Title**: catchTutorialDone migration hardcodes eventIndex>1 instead of deriving the intro-rival row

**Evidence**:
```js
function migrateStoryPreV16() {
    if (typeof sm.catchTutorialDone !== 'boolean') {
        sm.catchTutorialDone = (sm.eventIndex | 0) > 1; // magic '1'
    }
}
```

**Repro**: Round-trips fine today (intro rival sits at row index ~1), but the runtime gate _shouldFireCatchTutorialBeforeBattle derives introIdx dynamically via STORY_RIVAL_ROW_INTRO. If the timeline ever shifts the intro rival's array index, the migration would mis-mark old saves (tutorial fires mid-run or is wrongly suppressed).

**Blast radius**: Save migration fragility tied to timeline ordering (pasteur-owned). Latent, not currently breaking.

**Fix sketch**: Derive the threshold from STORY_EVENTS_RAW.findIndex(intro-rival) like the runtime gate does, instead of the literal 1.

**Verification**: Shift STORY_RIVAL_ROW_INTRO row position in a test fixture; confirm migration still marks pre-tutorial saves correctly.

---
severity: P2
category: inconsistency
anchor_symbol: profAccept
current_line_hint: ~45292
file: battle.html
agents: []
fingerprint: aea4e9950e8b
confidence: high
status: fixed-main
---

**Title**: Mystery swap picker mislabels BST grade as "Power tier (1-4)"

**Evidence**:
```js
const g = t.name ? getMonGrade(t.name, getBST(t.name)) : 4;   // BST GRADE
slot.innerHTML = ... <span class="tier-badge bg-tier-" title="Power tier (1–4)">T</span> ...
```

**Repro**: Reach an at-cap Professor (swap mode) or the City-8 legendary gate; the team slots show "T1..T4" badges whose tooltip reads "Power tier (1-4)". The value is getMonGrade (BST band), NOT the build powerTier (UNTRAINED/NOVICE/COMPETENT/TOURNAMENT). The normal pick card deliberately *removed* the training-tier chip "per the opening-flow spec" because it confused players, yet this surface reintroduces the confusion with a wrong label.

**Blast radius**: Player-facing mislabel; conflates two distinct internal concepts (species grade vs build power tier).

**Fix sketch**: Relabel the swap-slot badge tooltip to "Grade (1-4)" (or drop the chip to match the pick-card decision).

**Verification**: Open the swap picker; confirm the badge tooltip no longer says "Power tier".

---
severity: P3
category: inconsistency
anchor_symbol: _renderProfChoices
current_line_hint: ~45179
file: battle.html
agents: []
fingerprint: 6f7d78ccc064
confidence: high
status: fixed-main
---

**Title**: Grade badge prefix differs between prof pick cards (G#) and swap slots (T#)

**Evidence**:
```js
// pick card:  <span class="tier-badge bg-tier-">G</span>   (tier = ch.g = getMonGrade)
// swap slot:  <span class="tier-badge bg-tier-">T</span>          (g = getMonGrade)
```

**Repro**: Same Professor screen, two card styles. Both render getMonGrade but one prefixes "G" and the other "T", for the same underlying number.

**Blast radius**: Cosmetic consistency within one screen.

**Fix sketch**: Use one prefix (G for grade) in both renderers.

**Verification**: Visual diff of pick card vs swap slot badge prefixes.

---
severity: P3
category: bug
anchor_symbol: profAccept
current_line_hint: ~45274
file: battle.html
agents: []
fingerprint: 78f8cae7d0de
confidence: medium
status: open
---

**Title**: Mystery-mode Accept has no double-submit guard (re-renders swap picker on repeat clicks)

**Evidence**:
```js
function profAccept() {
    if (_profSelectedIdx === null || !_pendingProfChoices) return; // guards normal path
    ...
    if (_profMysteryMode) {
        // builds swap picker; does NOT null _pendingProfChoices here
        return;
    }
    _pendingProfChoices = null; // only the NORMAL path clears state
```

**Repro**: In mystery / legendary-gate mode, clicking "Take <mon>" repeatedly re-renders the swap picker each time (state not cleared until _mysteryDoSwap/_mysterySendToPc run). Idempotent re-render so no corruption, but distinct from the normal path which is guarded. Low risk.

**Blast radius**: Cosmetic flicker; the actual mutation (_mysteryDoSwap/_mysterySendToPc) is single-shot via its own pending-null checks.

**Fix sketch**: Optional: set a transient busy flag while the swap picker is shown, or no-op Accept once the picker is already rendered.

**Verification**: Rapid double-click Accept in mystery mode; confirm no duplicate/desynced swap state.

---
severity: P3
category: data
anchor_symbol: STORY_EVENTS_RAW
current_line_hint: ~30037
file: battle.html
agents: []
fingerprint: d62e9395acd6
confidence: low
status: fixed-main
---

**Title**: STORY_EVENTS_RAW resolves to 67 rows in harness vs 68 stated in spec/mandate

**Evidence**:
```js
// jsdom harness: STORY_EVENTS_RAW.length === 67
// Mandate / STORY_MODE_FLOW reference 68 rows.
```

**Repro**: loadEngine() then read window.STORY_EVENTS_RAW.length -> 67. May be gen-filter at boot in the harness (default gens) or a genuine off-by-one vs the spec's row count. Worth a quick reconcile since GYM_CITY_LEADER_EVENT and intro-rival index logic key off this array.

**Blast radius**: Timeline-index-derived logic (catch tutorial gate, legendary gate row 55, GYM_CITY_LEADER_EVENT). pasteur-owned timeline.

**Fix sketch**: Reconcile spec's "68 rows" against the live array; update whichever is stale (likely the doc).

**Verification**: Count STORY_EVENTS_RAW rows at boot with default settings and compare to STORY_MODE_FLOW.

