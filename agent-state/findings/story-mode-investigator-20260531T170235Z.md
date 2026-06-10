---
severity: P2
category: bug
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~42126
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6a29587124a9
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
---

**Title**: `_storyGrantTrackEndReward` has no internal idempotency guard — re-call double-grants Master Ball

**Evidence**:
```js
function _storyGrantTrackEndReward(beat) {
    if (!beat || !beat.sceneKey) return null;
    const sk = beat.sceneKey;
    if (/^villain\.[a-zA-Z]+\.boss$/.test(sk)) {
        sm.balls.master = (sm.balls.master | 0) + 1;   // unconditional, every call
        ...
    if (/^extra\.[a-zA-Z]+\.raid$/.test(sk)) { /* 6 vitamins, every call */ }
```

**Repro**: jsdom — `T.grantTrackEndReward({sceneKey:'villain.rocket.boss',kind:'boss'})` twice → `sm.balls.master` goes 0→1→2. Same with `extra.cubone.raid` → +12 vitamins (two bundles). The fn never checks `sm.storyEventsFired[sk]`.

**Blast radius**: Today both call sites (scene-queue `~42012`, battle-victory `~47572`) gate on `sm.storyEventsFired[sceneKey]` BEFORE/with the call, so normal play is safe. But the function is also exposed publicly as `window.__storyTest.grantTrackEndReward` / `StoryMode` PR-5 surface (`~37772`), and the Master Ball is meant to be unique/tracked. Any future caller (or a victory-hook refactor) that forgets the external gate silently double-grants the game's only Master Ball.

**Fix sketch**: Add a guard inside the fn: `if (sm.storyEventsFired && sm.storyEventsFired[sk] && sm._trackRewardGranted && sm._trackRewardGranted[sk]) return null;` then stamp a dedicated `sm._trackRewardGranted[sk]=true` on grant. Defense-in-depth independent of the caller's `storyEventsFired` flag.

**Verification**: re-run the double-call probe; second call returns null and leaves `sm.balls.master` unchanged.

---
severity: P3
category: dx
anchor_symbol: _storyGrantTrackEndReward
current_line_hint: ~42120
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2ed72d9b81f5
confidence: high
status: fixed-main
---

**Title**: Stale comment on `_storyGrantTrackEndReward` — claims scene-queue piggy-back that is structurally impossible

**Evidence**:
```js
// Called from the beat-fired hook (currently piggy-backs on _playStoryBeatQueue's mark
// step; will fire from PR-5b's battle-injection victory hook once it lands)...
```
But `_playStoryBeatQueue` is fed only by `_resolveActiveRoadBeats`, whose `eligible()` predicate is `slot.kind === 'event'` (`~41913`). A `villain.*.boss` (`kind:'boss'`) / `extra.*.raid` (`kind:'raid'`) can NEVER enter that queue.

**Repro**: jsdom — `T.resolveActiveRoadBeats(road)` across all roads returns only `kind:"event"` beats (`roadBeatKinds:["event"]`). The boss/raid reward path runs solely from the onBattleEnd hook (`~47572`).

**Blast radius**: Documentation only. The comment misdescribes which path delivers the flagship rewards; it implies the scene-queue path is a live reward site (it is a no-op there). Misleads the next maintainer auditing for double-grant (the real single source of truth is the battle-victory hook).

**Fix sketch**: Rewrite the header comment: the reward fires ONLY from the battle-injection victory hook (`onBattleEnd`, `~47572`); the `_playStoryBeatQueue` call (`~42012`) is a guaranteed no-op for these regexes because the queue is event-kind-only.

**Verification**: comment matches the resolved call graph; no behavior change.

---
severity: P2
category: bug
anchor_symbol: _variantMysteryOutro
current_line_hint: ~32744
file: battle.html
agents: [story-mode-investigator]
fingerprint: b77e444a2cf6
confidence: high
status: fixed-main
---

**Title**: `_variantMysteryOutro` is dead — `_MYSTERY_OUTRO_BY_VARIANT` keyed only by retired identities, never matches `the_first`

**Evidence**:
```js
const _MYSTERY_OUTRO_BY_VARIANT = {
    second_sun: { red: '...', cynthia: '...' },
    bone_keepers: { cyrus:'...', ghetsis:'...', lance:'...', red:'...' },
    ... static: { cartridge_self:'...', cyrus:'...', red:'...' }
};
function _variantMysteryOutro(identityKey) { ...; return table[identityKey] || ''; }
```
Every inner key is a RETIRED identity (`red/cynthia/cyrus/ghetsis/lance/n/buried_alive/cartridge_self`). `the_first` is never a key in this table (grep: the only `the_first:` in the file is in `MYSTERY_FIGURE_IDENTITIES`). Since `sm.mysteryIdentity` is now always `'the_first'` (PR-6 collapse), the call at `~47924` always returns `''`.

**Repro**: static — `MYSTERY_FIGURE_IDENTITIES` has exactly one key `the_first`; `_storyPickMysteryIdentity()` returns `'the_first'` deterministically (probe: `mfPicks:["the_first"]`). `_variantMysteryOutro('the_first')` → table lookup miss → `''` for all 8 variants.

**Blast radius**: ~38 lines of crafted per-variant Mystery Figure outro prose are unreachable. The MF reveal at `showVictoryOverlay` (`~47924`) always falls back to the generic `the_first.outro`. Lost fanservice/narrative variety; the per-storyline MF reading the spec promised never appears.

**Fix sketch**: Either (a) re-key the variant outros under `the_first` per storyline, or (b) delete `_MYSTERY_OUTRO_BY_VARIANT` + `_variantMysteryOutro` and the `~47924` call as dead code. Pasteur-owned (narrative + MF dispatch) — flag, don't edit.

**Verification**: with (a), MF outro at HoF reflects the active `sm.storyLine`; with (b), grep shows no remaining reference.

---
severity: P3
category: data
anchor_symbol: MYSTERY_FIGURE_IDENTITIES
current_line_hint: ~40667
file: battle.html
agents: [story-mode-investigator]
fingerprint: e46f43a0e592
confidence: high
status: fixed-main
---

**Title**: `mysteryBias` per-variant config is orphaned — seeds weights for retired MF identities, never read

**Evidence**:
```js
mysteryBias: { cyrus: 3, ghetsis: 1, lance: 1, red: 1 },   // bone_keepers
mysteryBias: { buried_alive: 8, cyrus: 1, ghetsis: 1 },     // lavender_frequency
mysteryBias: { cartridge_self: 10 },                        // static
```
Defined in 8 variant entries (`~40667`–`~40838`). Grep for any READ of `.mysteryBias` / `mysteryBias` outside these definitions returns nothing. `_storyPickMysteryIdentity()` hardcodes `'the_first'`, so the weighting these fields were meant to drive is bypassed entirely.

**Repro**: `grep -nE "\.mysteryBias" battle.html` → only definition sites; no consumer.

**Blast radius**: Dead config data. Harmless at runtime but misleading — implies a per-variant MF identity weighting still exists. References species/identity keys that no longer have `MYSTERY_FIGURE_IDENTITIES` entries.

**Fix sketch**: Remove the `mysteryBias` field from all variant definitions (pasteur-owned data). Or, if per-variant MF identity is desired again, wire a real consumer.

**Verification**: grep shows zero `mysteryBias` references post-removal; variant table still parses.

---
severity: P2
category: bug
anchor_symbol: load
current_line_hint: ~35335
file: battle.html
agents: [story-mode-investigator]
fingerprint: 64fa9c188a86
confidence: medium
status: open
---

**Title**: No save migration coerces stale `sm.mysteryIdentity`; pre-v22 saves render degraded MF reveal until the fight

**Evidence**:
```js
// load() migration block (~35421-35486): touches tracks, daycare, pits, wander, stats —
// but never sm.mysteryIdentity. Coercion is lazy, only inside _storyEnsureMysteryIdentity():
function _storyEnsureMysteryIdentity() {
    if (sm.mysteryIdentity !== 'the_first') { sm.mysteryIdentity = 'the_first'; save(); }
    ...
}
```
`_storyEnsureMysteryIdentity()` runs only at the MF fight (`~47139`). The city-hub tease (`~43138`) and victory overlay (`~47918`) read `MYSTERY_FIGURE_IDENTITIES[sm.mysteryIdentity]` raw.

**Repro**: load a save with `sm.mysteryIdentity='cyrus'` (a retired key from a pre-v22 run). At the post-game city hub, `MYSTERY_FIGURE_IDENTITIES['cyrus']` is `undefined` → sprite falls to hardcoded `'Cyrus'` (`~43139`). At victory overlay before the fight, `face=null` → reveal shows "the figure dissolves before you can see who wore it" instead of "The First".

**Blast radius**: Cosmetic/narrative degradation for old saves, not a crash (guards prevent null-deref). Self-heals once `_storyEnsureMysteryIdentity` runs. Affects only saves carried across the PR-6 collapse.

**Fix sketch**: Add to the migration chain (or a generic back-fill near `~35484`): `if (sm.mysteryIdentity !== 'the_first') sm.mysteryIdentity = 'the_first';`. Pasteur-owned (save schema) — flag.

**Verification**: load old-identity save → `sm.mysteryIdentity === 'the_first'` immediately after `load()`, before any MF fight.

---
severity: P3
category: data
anchor_symbol: expShareVoucher
current_line_hint: ~39151
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5c179bd13408
confidence: high
status: fixed-main
---

**Title**: `expShareVoucher:0` inventory field is dead — no reader, no writer; extra-raid reward grants vitamins instead

**Evidence**:
```js
// sm.inventory defaults (~39151)
expShareVoucher:0,
```
Grep `expShareVoucher` over battle.html → exactly ONE hit (the declaration). No code reads or increments it. The extra-arc raid reward (`_storyGrantTrackEndReward`, `~42144`) writes a 6-vitamin bundle to `hpUp/protein/iron/calcium/zinc/carbos`, never to `expShareVoucher`. The "EXP SHARE" label is only in the alert text (`~42159`).

**Repro**: `grep -rnE "expShareVoucher" battle.html` → 1 line. Probe: raid grant adds 6 vitamins; `expShareVoucher` stays 0.

**Blast radius**: Orphaned scaffolding from the original ISSUE-243 EXP-Share design (cut because the game is flat-L100). Persisted into every save's inventory object. No functional impact, but it is exactly the kind of dead init that should be removed before reworking the EXP-Share reward to avoid confusion about which field is authoritative.

**Fix sketch**: Remove the `expShareVoucher:0` line from the `sm.inventory` defaults. No migration needed (nothing reads it). Note for the upcoming EXP-Share rework: the real currency is vitamins, not this voucher.

**Verification**: grep shows zero `expShareVoucher` references; fresh-run inventory has no such key; existing saves are unaffected (extra key is ignored).

---
severity: P3
category: refactor
anchor_symbol: BOSS_MECHANICS
current_line_hint: ~42172
file: battle.html
agents: [story-mode-investigator]
fingerprint: 148e841da76f
confidence: high
status: open
---

**Title**: `BOSS_MECHANICS` registry (`~42172`) is dead — pushes to `battle._mechanics`, which is never read

**Evidence**:
```js
const BOSS_MECHANICS = {
    hpThresholdPhase(battle, ...) { battle._mechanics.push({...}); ... },
    immunityRound(battle, ...)   { battle._mechanics.push({...}); ... },
    fieldLock(battle, ...)       { battle._mechanics.push({...}); ... },
};
```
Grep: `BOSS_MECHANICS` is referenced only at its definition + a getter export (`~37773`). `battle._mechanics` / `state._mechanics` is WRITTEN only inside these three methods and READ nowhere. The live implementation uses a different field, `state._bossMechanics` (init `~42357`, tick `~42410`, consumed at damage step `24096`/`24357`).

**Repro**: `grep -nE "\._mechanics\b" battle.html` → only the 3 push sites inside BOSS_MECHANICS. `grep -nE "BOSS_MECHANICS\b"` → def + export only.

**Blast radius**: Pure dead code + a misleading public-surface getter. Confirms the older PR-5 stub registry was superseded by the PR-A live wiring (`_storyBossMechanics*` / `BOSS_CONFIGS`) and never removed.

**Fix sketch**: Delete `BOSS_MECHANICS` and its `get BOSS_MECHANICS()` export (`~37773`). The live path (`BOSS_CONFIGS` + `_storyBossMechanicsBattleInit`/`TurnTick`) is the sole real impl.

**Verification**: grep shows no `BOSS_MECHANICS` / `._mechanics` references; boss-beat battles still apply surge/immunity/field-lock (state._bossMechanics path unaffected).

---
severity: P4
category: refactor
anchor_symbol: _storyBossMechanicsBattleInit
current_line_hint: ~42357
file: battle.html
agents: [story-mode-investigator]
fingerprint: bef46dafbbd5
confidence: high
status: open
---

**Title**: `_bossWeatherLocked` / `_bossTerrainLocked` flags are set but never read — field "lock" is opening-state only

**Evidence**:
```js
stateRef.weather = m.value; stateRef.weatherTurns = (m.turns|0)||99;
stateRef._bossWeatherLocked = true;   // written, never read
...
stateRef._bossTerrainLocked = true;   // written, never read
```
Grep: both flags appear ONLY at these write sites. No read gates any subsequent `state.weather = ...` assignment (there are ~20 of those for Sunny Day / abilities / orbs), so the boss weather is freely overwritten the moment the player uses a weather move.

**Repro**: `grep -nE "_bossWeatherLocked|_bossTerrainLocked" battle.html` → only the two writes.

**Blast radius**: Matches the design comment in BOSS_CONFIGS ("contestable — the player can still override it"), so this is intended behavior, NOT a balance bug. But the two flags are dead — they imply an enforced lock that does not exist, and could mislead someone adding "true lock" later. Cosmetic/data-hygiene.

**Fix sketch**: Either remove the two dead flags, or (if a true lock is wanted) read them in the `state.weather =`/`state.terrain =` setters to no-op player overrides. Maxwell-owned if it becomes a balance lever.

**Verification**: grep shows the flags removed (or, if kept, a reader exists that honors them).

---
severity: P3
category: inconsistency
anchor_symbol: buildPokemon
current_line_hint: ~15083
file: battle.html
agents: [story-mode-investigator]
fingerprint: 20628d0fad96
confidence: high
status: open
---

**Title**: Extra-raid stat scaling compounds `_storyStatMult` × `_bossStatMult` × `_bossHpScale`; the doc comment omits `_storyStatMult`

**Evidence**:
```js
// buildPokemon ~15086: "effective raid HP ≈ _bossStatMult × _bossHpScale × base
//  (at maxParty 6: 1.3 × 5 ≈ 6.5× base HP) ... Kept off _storyStatMult because
//  enterBattleEvent overwrites that field on every rolled team member."
```
But enterBattleEvent DOES stamp `_storyStatMult` on every `enemyTeam` member including the raid mon: `for (const s of enemyTeam) if (s && s.build) s.build._storyStatMult = _enemyMult;` (`~47230`). The raid team `[{name,build}]` from `_rollExtraRaidBossTeam` IS that `enemyTeam`. Both buildPokemon blocks (`~15072` storyStatMult, `~15092` bossStatMult) then run on the same mon.

**Repro**: static trace — `_rollExtraRaidBossTeam` sets `_bossStatMult=1.3`, `_bossHpScale=_bossHpScaleForKind('raid',6)=5`; `enterBattleEvent` (`~47230`) then sets `_storyStatMult=_storyEnemyStatMult(event,city,idx)` on the same build (no raid exclusion). buildPokemon applies all three.

**Blast radius**: A raid that fires on a late road carries the City +20% band, so real HP ≈ `1.2 × 1.3 × 5 ≈ 7.8× base` (not the documented 6.5×), and offensive stats ≈ `1.2 × 1.3 ≈ 1.56× base`. The number is user/maxwell-owned, but the in-code comment under-states actual difficulty — a reader tuning the raid from the comment would mis-estimate. Inconsistency between documented intent and behavior.

**Fix sketch**: Either (a) update the comment to state the true product (`_storyStatMult × _bossStatMult × _bossHpScale`), or (b) if the design wants the raid OFF the per-event band, exclude raid builds at `~47230` (`if (!s.build._bossStatMult)`). Maxwell sign-off on the number.

**Verification**: build a raid mon with all three flags and a city band; assert maxHp ratio matches whichever spec is chosen.

---
severity: P4
category: dx
anchor_symbol: SAVE_VER
current_line_hint: ~34302
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1e345769ae23
confidence: high
status: fixed-main
---

**Title**: `SAVE_VER = 23` but migration dispatch stops at `_loadedVer < 22` — no numbered v23 step

**Evidence**:
```js
const SAVE_VER = 23;
...
if (_loadedVer < 22) { migrateStoryPreV22(); }
// no `if (_loadedVer < 23)` block
```
v22→v23 added `sm.wanderByEventIdx:{}` (Wander Around). It is covered by a generic back-fill (`~35364`: `if (!sm.wanderByEventIdx ...) sm.wanderByEventIdx = {}`) plus defensive consumer init (`~49359`), so round-trip is functionally safe.

**Repro**: `grep -nE "< 23|PreV23" battle.html` → none. Track round-trip via `migratePreV22` preserves explicit picks (probe: `preserved:true`).

**Blast radius**: No data loss today — the back-fill saves it. But the codebase's established pattern is one numbered `migrateStoryPreV<N>` per SAVE_VER bump; v23 broke that pattern, so a future field added under "v23" has no obvious migration home and could be missed. DX/consistency only.

**Fix sketch**: Add a no-op-or-backfill `if (_loadedVer < 23) { /* wanderByEventIdx back-fill */ }` to keep the chain contiguous, OR document that v23 deliberately uses the generic back-fill. Pasteur-owned (save schema).

**Verification**: migration chain has a contiguous step per version; v22 save loads with `sm.wanderByEventIdx` present.

---
severity: P4
category: bug
anchor_symbol: enterCatchEncounter
current_line_hint: ~49923
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7ffd530ac252
confidence: high
status: verified-ok
---

**Title**: VERIFIED OK — extra-arc raid "laid to rest, no catch" lock is enforced structurally

**Evidence**:
```js
// _rollExtraRaidBossTeam returns [{name, build}] -> enemyTeam -> startFight(frozenTeam)
//   -> launchBattle(enemyTeam) -> state.mode = 'story'   (TRAINER-style battle, ~47192/47322)
// Catch UI lives ONLY in the dedicated screen: enterCatchEncounter / catchThrow (~49923/50363),
//   invoked exclusively by wild/safari/roaming/bossArc encounters (all tagged wild:true).
```
The raid never sets `wild:true`, never tags `safari`/`bossArc`, and never calls `enterCatchEncounter`. The trainer-battle screen exposes no ball/catch action — balls are thrown only via `window.StoryMode.catchThrow(k)` on the catch screen (`~50245`).

**Repro**: trace raid launch path (`~47214`→`~47239`→`launchBattle`); grep confirms `wild:true` sites are roaming/partner/safari/bossArc/wild only, none on the raid path.

**Blast radius**: None — this is a cleared concern. The no-catch lock is robust by codepath separation (raid = trainer battle), not by a suppressible UI flag. No fix needed.

**Fix sketch**: n/a (verified correct).

**Verification**: already verified by static trace; would only regress if a future raid path set `wild:true` or routed through `enterCatchEncounter`.

---
severity: P4
category: bug
anchor_symbol: _activeBattleBeatForCurrentRow
current_line_hint: ~42043
file: battle.html
agents: [story-mode-investigator]
fingerprint: cc2ffdbf7700
confidence: high
status: verified-ok
---

**Title**: VERIFIED OK — boss/raid reward double-grant across the two call sites is structurally prevented

**Evidence**:
```js
// Scene-queue path: _resolveActiveRoadBeats eligible() = slot.kind === 'event' (~41913)
//   -> boss/raid kinds CANNOT enter the queue -> _storyGrantTrackEndReward is a no-op there.
// Battle path: _activeBattleBeatForCurrentRow returns boss/raid, guarded by
//   !sm.storyEventsFired[s.sceneKey] (~42054); onBattleEnd sets storyEventsFired[key]=true
//   BEFORE granting (~47570) and deletes _activeBeatBattleKey on win and on loss (~47565/47609).
```
A single boss/raid victory flows through ONLY the battle path. `storyEventsFired` for boss/raid keys is set-once-never-cleared (clears only exist for online-PvP rematch, out of scope).

**Repro**: probe — `resolveActiveRoadBeats` over all roads yields only `kind:"event"` (`filterLeaksBossRaid:false`); loss branch deletes the in-flight key without marking fired, so retry re-attaches the SAME beat exactly once.

**Blast radius**: None for normal flow — cleared concern. The residual risk is ONLY the missing internal idempotency guard (see finding fingerprint 6a29587124a9 / the public `grantTrackEndReward` API footgun), not the two-call-site interaction.

**Fix sketch**: n/a for the two-path concern; see the idempotency-guard finding for defense-in-depth.

**Verification**: verified by probe + static trace.

