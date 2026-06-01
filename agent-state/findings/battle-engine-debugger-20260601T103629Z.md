---
severity: P1
category: bug
anchor_symbol: startBattle
current_line_hint: ~17220
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 61d2b4386873
confidence: high
status: open
---

**Title**: Boss/raid mechanics state never reset; bleeds into next ordinary Story fight

**Evidence**:
```js
// startBattle() — the ONLY place these fields are written is inside this guard.
if (_cfg && Array.isArray(_cfg.mechanics) && _cfg.mechanics.length) {
    state._activeStoryBeatKey = _beatKey;
    state._bossMechanics = _cfg.mechanics.slice();
    state._bossMechanicsFired = {};
    state._bossPendingTelegraphs = [];
    state._bossSurgeTurns = 0;
    state._bossImmuneTurns = 0;   // <-- only set when THIS battle is a boss beat
}
```
`state` is the persistent module-level object (battle.html:14682 `let state = {...}`); startBattle() and launchBattle() MUTATE it, never replace it. The reset block at 17139-17189 clears weather/terrain/hazards/pSide/fSide/mega-dyna-tera but lists NONE of the `_boss*` fields. Unlike artifacts (which self-clear unconditionally in _storyApplyArtifacts, 54579+), the boss init is inside the `if (_cfg)` guard, so an ordinary (non-boss) beat never re-initialises or clears them. No `delete state._boss*` exists anywhere; onBattleEnd / afterBattleReturn / _handleCrucibleBattleEnd do not clear them either. The bled fields then arm the live damage hooks: surge +25% foe damage (24114) and immunity-round damage-to-0 (24375), and the turn-tick at 21168 re-runs because `state._bossMechanics.length` is still truthy.

**Repro**: `node scripts/debug/_repro/state-bleed.mjs` (boss fields survive into fight 2) and `node scripts/debug/_repro/boss-bleed-consequence.mjs` — CLEAN next fight: player Close Combat = 105 dmg; BLED next fight (`_activeStoryBeatKey`+`_bossImmuneTurns` left over): **0 dmg**, "braces — the attack does no damage!". Both jsdom, seed 0.

**Blast radius**: Any ordinary Story battle that immediately follows a boss/miniBoss/raid/miniRaid/Mystery-Figure fight (villain Road-6/7 climaxes, extra-track raids, mfBattle). Affects damage dealt by the player (immunity zeroes it) and by the foe (surge inflates it), plus stray boss banners re-firing. Persists across the whole rest of the run until another boss beat overwrites the fields (the next boss's init re-seeds them) — ordinary fights in between stay corrupted.

**Fix sketch**: In startBattle's reset block (alongside the weather/terrain reset at ~17148), unconditionally clear the boss fields before the `if (_cfg)` guard: set `state._activeStoryBeatKey = null; state._bossMechanics = []; state._bossMechanicsFired = {}; state._bossPendingTelegraphs = []; state._bossSurgeTurns = 0; state._bossImmuneTurns = 0; state._bossWeatherLocked = false; state._bossTerrainLocked = false;` — mirroring how _storyApplyArtifacts resets artifact flags every battle.

**Verification**: Re-run both repro scripts; bled fight must show 105 dmg (== clean) and no "braces" line. Add a jsdom regression: start a boss beat, end it, start an ordinary beat, assert all `state._boss*` are cleared.

---
severity: P1
category: bug
anchor_symbol: returnToHome
current_line_hint: ~15237
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 308066024fc5
confidence: high
status: open
---

**Title**: Battle log (#battle-log) only cleared on returnToHome, not at battle start; previous fight's lines bleed in

**Evidence**:
```js
// The ONLY site that clears the battle log, and it lives in returnToHome (forfeit/menu return):
document.getElementById('draft-grid').innerHTML = ''; document.getElementById('battle-log').innerHTML = '';
```
The log is a DOM element (`#battle-log`, cached as `battleEls.battleLog`); `logMsg` (14640) only ever `appendChild`s a `<div>` per line and never wipes. `startBattle()` appends "Battle started!" (17237) on top of whatever was already there — it does not clear the log. The normal between-battle flow (victory → afterBattleReturn → processNextEvent → enterBattleEvent → launchBattle → startBattle) never passes through returnToHome, so consecutive Story battles accumulate one continuous log.

**Repro**: `node scripts/debug/_repro/log-bleed.mjs` — seed 3 lines ("Foe Mewtwo used Psystrike!", "BOSS IS PREPARING") into #battle-log, call startBattle() for fight 2, assert log still contains them: result "BATTLE LOG BLEEDS: YES". jsdom.

**Blast radius**: Every consecutive battle in a Story run (and any mode that reuses the persistent `state`/DOM without a returnToHome between fights). Purely a UI/log-correctness issue — no mechanical effect — but it is the "battle logs may do the same" the maintainer reported. On mobile the landscape cap (battleLogMaxEntries) hides the overflow; on desktop (cap 0 = unbounded) the prior fight's lines are visible at the top of the new fight.

**Fix sketch**: Clear the log at the start of every fight — e.g. in startBattle near the screen-battle reveal (~17072) add `const _lg = document.getElementById('battle-log'); if (_lg) _lg.innerHTML = '';` (or call a shared clearBattleLog() also used by returnToHome).

**Verification**: Re-run the repro; after startBattle the log must contain only the new fight's lines. Manually: win a Story battle, enter the next — the log starts empty.

---
severity: P2
category: bug
anchor_symbol: selectPartyMember
current_line_hint: ~20672
file: battle.html
agents: [battle-engine-debugger]
fingerprint: bfdd6b8592a2
confidence: high
status: open
---

**Title**: Pending Healing Wish / Lunar Dance flags bleed into next battle and auto-heal its lead

**Evidence**:
```js
if (isP1 && state._healingWish) {
    state[activeTarget].currentHp = state[activeTarget].maxHp; state[activeTarget].status = null; state[activeTarget].statusTurns = 0;
    if (state._lunarDance) { state[activeTarget].moves.forEach(mv => { mv.pp = mv.maxPp || mv.pp; }); state._lunarDance = false; }
    state._healingWish = false; logMsg(`${state[activeTarget].name} was fully restored!`, 'heal');
}
```
`state._healingWish` / `_healingWishFoe` / `_lunarDance` / `_lunarDanceFoe` are set when the move resolves (26714/26716) and cleared ONLY when a replacement switches in (20672-20680). If the battle ends with the flag still pending (the Healing-Wish user faints as the last mon, or a forced/early battle end occurs before a replacement enters), the flag survives on the persistent `state` — startBattle's reset block does not list it. The next battle's first switch-in (incl. the lead via the same code path) then gets a free full HP + status clear (+ full PP for Lunar Dance).

**Repro**: `node scripts/debug/_repro/healingwish-bleed.mjs` — set `state._healingWish = state._lunarDance = true`, call startBattle() for fight 2, assert still true: "HEALING-WISH BLEED: YES". jsdom, seed 0.

**Blast radius**: Lower frequency than the boss bleed (requires a pending Healing Wish/Lunar Dance at battle end), but a concrete "mechanic continued in the next fight" — gives the next lead an undeserved full heal. `state._fTeraReserveLogged` (19981) bleeds the same way but is only a cosmetic log-once dedupe (suppresses one foe-tera-reserve log line next fight).

**Fix sketch**: In startBattle's reset block, clear `state._healingWish = state._healingWishFoe = state._lunarDance = state._lunarDanceFoe = false; state._fTeraReserveLogged = false;` (same place as the proposed boss-field reset).

**Verification**: Re-run the repro; flags must be false after startBattle. Manually: finish a battle on a Healing-Wish faint, enter the next — its lead must NOT be auto-restored.

