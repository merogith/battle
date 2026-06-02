---
severity: P1
category: bug
anchor_symbol: startBattle
current_line_hint: ~16832
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 3fdf16d5ab31
confidence: high
status: fixed-claude/cagedgod-excision
---

**Title**: Boss-mechanic hookup reads window.StoryMode.{BOSS_CONFIGS,bossMechanics*} but those live on test-only __storyTest — boss arc still dead in prod

**Evidence**:
```js
const _SM = (typeof window !== 'undefined' && window.StoryMode) || null;
const _bossCfgs = _SM && _SM.BOSS_CONFIGS;               // undefined at runtime
const _beatKey = _smState && _smState._activeBeatBattleKey;
const _cfg = _beatKey && _bossCfgs && typeof _bossCfgs === 'object' && _bossCfgs[_beatKey]; // always falsy
if (_cfg && Array.isArray(_cfg.mechanics) ...) {          // never entered
  if (typeof _SM.bossMechanicsBattleInit === 'function') ... // undefined
```

**Repro**: `node scripts/debug/_repro/boss-mech.mjs` — prints `StoryMode.BOSS_CONFIGS: undefined`, `bossMechanicsBattleInit: undefined`, `bossMechanicsTurnTick: undefined`. The keys exist only on `window.__storyTest` (battle.html:37602-37611), which is gated behind `if (window.__testHarness === true)` (37530) and never created in production. The real `window.StoryMode` return object (battle.html:~59564) has none of these keys. So `_cfg` is always undefined at 16836; `state._bossMechanics` (set only at 16839) is never set; the turn-tick at 20775 is skipped. Every villain/raid boss + Mystery Figure (main.mfBattle) fights as a vanilla battle with zero HP-threshold/immunity/field-lock mechanics.

**Blast radius**: All 19 BOSS_CONFIGS entries (10 villain bosses, 8 extra raids, Mystery Figure apex). The "just rerouted to window.StoryMode.*" change is the regression — it points the live battle path at an object that doesn't carry the symbols. Also disables the damage clamp at 23879 (gated on state._activeStoryBeatKey, set only inside the dead block at 16838).

**Fix sketch**: Move `BOSS_CONFIGS`, `bossMechanicsBattleInit`, `bossMechanicsTurnTick`, `showBossBanner` out of the `window.__storyTest` literal (37602-37611) and into the real StoryMode return object (~59564), OR have startBattle/turn-tick read `window.__storyTest` as a fallback. Verify `window.StoryMode.BOSS_CONFIGS` is truthy before claiming the path is live.

**Verification**: After fix, `node scripts/debug/_repro/boss-mech.mjs` must show all three `StoryMode.*` as non-undefined; then drive a main.mfBattle and confirm `state._bossMechanics` is populated and the immunity banner fires.

---
severity: P1
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42115
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 30b6eaa39800
confidence: high
status: fixed-main
---

**Title**: Boss immunity-round off-by-one: activation sets _bossImmuneTurns then decrements it in the SAME tick, so turns:1 grants 0 immune turns

**Evidence**:
```js
if (pending.type === 'immunityRound') {
    foeMon._bossImmuneTurns = (pending.turns | 0) || 1;   // step 1: set (=1 for main.mfBattle)
}
// ...
if (foeMon._bossImmuneTurns > 0) foeMon._bossImmuneTurns--; // step 2: immediately decrement → 0
```

**Repro**: `node scripts/debug/_repro/boss-mech2.mjs` — with `turns:1` (the production main.mfBattle config), `_bossImmuneTurns` is 0 after every tick, so the damage clamp at battle.html:23879 (`defender._bossImmuneTurns > 0`) never fires. With `turns:2` it survives exactly one turn. The set (step 1) and decrement (step 2) run in the same tick invocation.

**Blast radius**: Mystery Figure (main.mfBattle) immunity round ("PAUSE", every 5 turns) — telegraphs the banner but never actually blocks damage. (Currently moot because Finding 1 means the tick never runs, but this is a second independent defect that would surface the moment Finding 1 is fixed.)

**Fix sketch**: Decrement BEFORE activating the pending telegraph, or skip the decrement on the activation tick (e.g. set `_bossImmuneTurns = turns + 1` to compensate, or move the timer-decrement block above the pending-activation block).

**Verification**: `node scripts/debug/_repro/boss-mech2.mjs` must show `_bossImmuneTurns > 0` after the activation tick for `turns:1`; then a damaging move on that turn must log "braces — the attack does no damage!".

---
severity: P1
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42114
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 7e37abfd6aab
confidence: high
status: fixed-main
---

**Title**: Boss HP-threshold "surge" (_bossSurgeTurns, +25% damage) has zero damage-path consumers — phase is banner-only

**Evidence**:
```js
foeMon._bossSurgeTurns = 3; // +25% damage flag for 3 turns   (only writer)
// ...
if (foeMon._bossSurgeTurns > 0) foeMon._bossSurgeTurns--;     // only reader (decrement)
```

**Repro**: `grep -nE '_bossSurgeTurns' battle.html` returns exactly two lines (42114 set, 42121 decrement) — no site in parseMoveEffects or the damage formula multiplies by it. `node scripts/debug/_repro/boss-mech.mjs` shows the counter set/ticking but it never alters damage. The HP-threshold phase (all 18 villain/raid bosses, at 0.25 HP; Mystery Figure at 0.50) shows a "PHASE INCOMING" banner and changes nothing mechanically.

**Blast radius**: Every BOSS_CONFIGS hpThresholdPhase mechanic (all 19 entries) — the headline "Phase 3 at 25% HP" boss design is purely cosmetic.

**Fix sketch**: In the main damage assembly (battle.html:~23671, after `modifier`), multiply by 1.25 when `attacker._bossSurgeTurns > 0` and the attacker is the boss (state.fActive). Mirror in aiEstimateDmg so AI KO math accounts for it.

**Verification**: Repro that drops boss to <=25% HP, advances one turn (telegraph→activate), then compares a fixed move's damage with vs without the surge flag; expect ~1.25x.

---
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~26058
file: battle.html
agents: [battle-engine-debugger]
fingerprint: e264dd705b7b
confidence: high
status: open
---

**Title**: Sleep off-by-one: sleepDuration=1 wakes and attacks on its first turn (0 turns lost); effective sleep is 0-2 turns not 1-3

**Evidence**:
```js
mon.statusTurns++;
let wakeThreshold = mon.sleepDuration || 2;     // sleepDuration rolled 1..3 at 27748
if (mon.ability === "Early Bird") wakeThreshold = Math.ceil(wakeThreshold / 2);
if (mon.statusTurns >= wakeThreshold) { mon.status = null; ...; return true; } // wakes AND moves
```

**Repro**: `node scripts/debug/_repro/status.mjs` — duration=1 ⇒ turn 1 "woke up", attack lands (foeDmg=155), zero turns asleep; duration=2 ⇒ 1 turn lost; duration=3 ⇒ 2 turns lost. Roll is `Math.floor(Math.random()*3)+1` (battle.html:27748) = 1/2/3, so the mon loses duration-1 turns. ~1/3 of sleeps (duration=1) are complete no-ops — the target acts the same turn it was put to sleep.

**Blast radius**: Every sleep move (Spore, Sleep Powder, Hypnosis, Yawn, etc.) in Story battles. Sleep is significantly weaker than Showdown (where a slept mon loses 1-3 turns). Player-favoring when foe sleeps the player; foe-favoring when player sleeps the foe — either way wrong-result vs spec.

**Fix sketch**: Either roll `sleepDuration` as 2-4 (`Math.floor(rng()*3)+2`) to match "loses 1-3 turns" with the increment-then-check pattern, or change the wake check so the mon stays asleep through `statusTurns < sleepDuration` and wakes (without moving) on the turn AFTER reaching duration. Rest (fixed sleepDuration=2 at 26343) should be audited together so it still costs the canonical turns.

**Verification**: `node scripts/debug/_repro/status.mjs` — duration=1 must show turn 1 "fast asleep" (no attack), turn 2 "woke up".

---
severity: P2
category: bug
anchor_symbol: __runLockedPvPTurnResolution
current_line_hint: ~21100
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 06c1239b57d5
confidence: medium
status: open
---

**Title**: Turn-resolution catch masks any in-loop throw as "[Error: …. Turn skipped.]" — both moves abandoned, real bugs hidden (PT-001)

**Evidence**:
```js
} catch(err) {
    console.error("Battle error:", err);
    try { logMsg(`[Error: ${err && err.message ? err.message : err}. Turn skipped.]`, 'dmg'); } catch (e) {}
    state.isLocked = false;
    ...
```

**Repro**: Scenario-level. The big try at battle.html:~20765 wraps the entire turn body (priority resolution, performAction, endOfTurnEffects, tickWeather, checkFaints) plus two unguarded `await anime({...}).finished` faint animations at 20897/20916 that only run when `settings.animations` is true (so the jsdom harness, which disables animations, can't reproduce). Any throw — a null-deref in a move handler, an anime promise rejection, a malformed move object — is swallowed and surfaced to the player as a benign-looking "Turn skipped", with the player's selected move and the foe's move both partially/fully discarded. Masks wrong-result and softlock-adjacent bugs as a one-line log.

**Blast radius**: Entire turn loop. This is a diagnosability hole more than a standalone bug; it converts real engine exceptions into silent mid-battle turn loss. Suspected home of intermittent "my move didn't go off" reports.

**Fix sketch**: Wrap the two `await anime(...).finished` faint calls (20897, 20916) in try/catch (they are the most likely in-loop throwers under live animations). Separately, on catch, surface a debug breadcrumb (err.stack to a ring buffer / `state._lastTurnError`) so QA can distinguish "intended skip" from "engine threw". Do not silently drop the turn without recording why.

**Verification**: Force a throw inside performAction under `settings.animations=true` and confirm the turn still completes (faint anim failure no longer aborts the turn) and that `state._lastTurnError` captures the stack.

---
severity: P2
category: inconsistency
anchor_symbol: _storyBossMechanicsBattleInit
current_line_hint: ~42092
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 4da1f1d412be
confidence: medium
status: open
---

**Title**: Boss field-lock sets _bossWeatherLocked/_bossTerrainLocked but nothing reads them; weather decay path (20611/20617) ignores the lock

**Evidence**:
```js
stateRef.weather = m.value;
stateRef.weatherTurns = (m.turns | 0) || 99;
stateRef._bossWeatherLocked = true;   // never read anywhere
```

**Repro**: `grep -nE '_bossWeatherLocked|_bossTerrainLocked' battle.html` returns only the two writer lines (42092, 42097). The weather tick at battle.html:20611 (`state.weatherTurns--`) and clear at 20617 (`state.weather = null`) don't check the lock, and moves that set weather (Rain Dance etc.) can overwrite it. The 99-turn fallback masks most of this in practice (battles end first), but a foe Rain Dance / Sunny Day / Snowscape overwrites the "locked" primal weather, breaking the Magma/Aqua boss intent (PRIMAL HEAT / PRIMORDIAL RAIN). Low impact today only because Finding 1 means field locks never apply at all.

**Blast radius**: villain.magma.boss and villain.aqua.boss fieldLock mechanics. Cosmetic-adjacent until Finding 1 is fixed.

**Fix sketch**: In the weather decay (20611) and any weather-set move handler, early-return / refuse the change when `state._bossWeatherLocked` (resp. terrain). Or simply document the 99-turn fallback as intended and drop the unused flags.

**Verification**: With a fix, set a boss weather lock then have the foe use Rain Dance; confirm the locked weather persists.

