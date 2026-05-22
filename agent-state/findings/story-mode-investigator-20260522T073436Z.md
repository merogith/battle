---
severity: P1
category: bug
anchor_symbol: applyStoryLeagueFoeStatBoost
current_line_hint: ~30729
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7ce8a9ce8254
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: League foe stat boost stacks multiplicatively despite comment claiming additive merge

**Evidence**:
```js
// battle.html ~30729  applyStoryLeagueFoeStatBoost
const newMaxHp = Math.max(1, Math.floor(mon.maxHp * hpM));   // direct multiply
mon.maxHp = newMaxHp;                                         // mutates mon.maxHp directly
// no `mon._leagueStatBonus = { hp, bulk, spe }` write ANYWHERE

// battle.html ~13244  applyFoeDifficultyScaling (called AFTER the boost)
//  > League boost ... is stored as additive deltas on the mon by
//  > applyStoryLeagueFoeStatBoost so difficulty and boss boost stack
//  > ADDITIVELY (not multiplicatively).
const lb = mon._leagueStatBonus;          // always undefined
const hpMult = mult + (lb && lb.hp ? lb.hp : 0);  // hpMult = mult (no add)
const newMaxHp = Math.max(1, Math.floor(mon.maxHp * hpMult));  // hpM already applied above → MULTIPLIES AGAIN
```
`grep -nE "_leagueStatBonus" battle.html` returns exactly one hit (the read site). No writer exists.

**Repro**: Fight Champion on Hard mode. HP multiplier = `1.40` (league) × `1.15` (Hard) × `1.20` (`_stageGatedFoeStatMult` for Champion) = **×1.932**, not the documented "1.30 ×1.40 = 1.82 cliff" the additive shim was supposed to flatten. The "cliff" the comment claims was fixed is in fact still there, plus an extra ×1.20 stage-gate term.

**Blast radius**: Every story-mode E1-E4 / Champion / League Rival / post-HoF Mystery foe fight on Easy/Hard/Challenge. Crucible Hard Mode rematches stack a 4th multiplier (×1.30) on top, pushing Champion-rematch HP to base ×2.09+ on Hard+Hard, plausibly higher than playtested.

**Fix sketch**: Either (a) make the comment match reality (it's intentionally multiplicative — drop the additive narrative), or (b) implement the missing writer in `applyStoryLeagueFoeStatBoost`: store `mon._leagueStatBonus = { hp: hpM-1, bulk: bulkM-1, spe: speM-1 }` *instead of* mutating maxHp, and let `applyFoeDifficultyScaling` apply the merged multiplier. Option (b) is the harder fix but matches the intent encoded in the read site.

**Verification**: After (b): a Champion fight on Hard with league boost 1.40 + difficulty 1.15 should have foe HP ≈ `base * (1 + 0.40 + 0.15) = base * 1.55`, not `base * 1.40 * 1.15 = base * 1.61`. The Hard / Normal gap should be the bare 0.15 delta, not 0.21.

---
severity: P1
category: inconsistency
anchor_symbol: PC_BOX_CAP
current_line_hint: ~38560
file: battle.html
agents: [story-mode-investigator]
fingerprint: fad97b9dadac
confidence: high
status: open
---

**Title**: PC_BOX_CAP is 30 in code but the canonical spec says 10

**Evidence**:
```js
// battle.html ~38560
const PC_BOX_CAP = 30;

// STORY_MODE_FLOW.md §1 (canonical):
//   PC | Pure storage. Flat array, cap 10 (story is battle-focused,
//   not a collection layer)…
// STORY_MODE_FLOW.md §7:
//   PC Storage … Capacity 10 — intentionally tight, since the run is
//   battle-focused and the Underground is meant to drive sell decisions
// STORY_MODE_FLOW.md §14 — point A2: "Flat-array PC, cap 10 (revised down
//   from the prior audit's 60 — this is a battle-focused story mode, not
//   a collection roguelike)"
```

**Repro**: Open the Pokémon Center PC tab. The HUD reads "PC X/30". The Underground sell loop is therefore far less compelling than the spec calls for — players can hoard ~3× the intended count before pressure forces a sale.

**Blast radius**: Touches the Underground economy ratio (Safari → sell loop is the explicit spec'd self-balancing money sink). Also touches the "PC nearly full" warning threshold (`box.length >= PC_BOX_CAP - 3 = 27/30`, vs spec's "≥ 8/10"). Also touches the "10/10" PC-full error message at line 40487 (currently shows "30/30" — string is correct but the cap behind it is wrong by spec).

**Fix sketch**: Either (a) drop `PC_BOX_CAP = 10` to match the spec verbatim — players keep their current PC contents, but new deposits past 10 are rejected; or (b) update the spec to ratify the 30-slot implementation, since this likely landed deliberately to accommodate the Pokédex catch-everything achievement plus Safari pulls plus boss-arc keeper. Pick (b) if the cap was raised intentionally and just never propagated to the doc.

**Verification**: After (a), the existing low-slot warning at `>= 27/30` should be retuned to `>= 8/10` for parity. After (b), `STORY_MODE_FLOW.md` §§1/7/14 all need their "10" tokens swapped to "30".

---
severity: P1
category: bug
anchor_symbol: migrateStoryTrainerAssignmentsPreV14
current_line_hint: ~30939
file: battle.html
agents: [story-mode-investigator]
fingerprint: d1e01d9e6e3e
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: v14 trainer-assignment migration is bundled under `_loadedVer < 13`, so v13 saves skip it

**Evidence**:
```js
// battle.html ~30939
if (_loadedVer < 13) {
    try { migrateStoryArtifactShopPreV13(); } catch (e) { ... }
    try { migrateStoryTrainerAssignmentsPreV14(); } catch (e) { ... } // ← wrong guard
}
if (_loadedVer < 15) {
    try { migrateStoryPreV15(); } catch (e) { ... }
}
// no `_loadedVer < 14` block exists anywhere
```

**Repro**: Craft a save with `version: 13` (or replay any save that was last opened during v13's lifetime — those saves rewrite `sm.version = SAVE_VER` on the next load, so they'd skip the v14 fix forever afterward). The v14 fix remaps `'Blue Champion' / 'Red' (in Elite Trainer slots) / 'Blue 2' / 'Silver 2' / 'Gladion 2' / 'Lt. Surge 2'` → the appropriate canonical names. A v13 save with one of those legacy assignment names will keep it, breaking the trainer dispatch when the row's expected event type doesn't match.

**Blast radius**: Narrow — only saves that loaded once at exactly v13. Symptoms: an Elite Trainer slot might display "Blue Champion" or roll the Champion's roster on an E1 row. Already-current v14+ saves are unaffected (they ran the fix when they were v13).

**Fix sketch**: Move the v14 migration to its own block:
```js
if (_loadedVer < 13) { try { migrateStoryArtifactShopPreV13(); } catch (e) {} }
if (_loadedVer < 14) { try { migrateStoryTrainerAssignmentsPreV14(); } catch (e) {} }
```

**Verification**: After fix, hand-craft a `version:13` save with `trainerAssignments[34] = 'Blue Champion'`. Load it; the assignment should remap to the appropriate canonical name. Pre-fix, the migration is silently skipped.

---
severity: P2
category: inconsistency
anchor_symbol: _makePlayerLinkBuild
current_line_hint: ~42374
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4b6cce4cb746
confidence: high
status: open
---

**Title**: Cable Link gimmick gate contradicts CHANGELOG promise that Cable Link surfaces pre-unlock mechanics

**Evidence**:
```js
// battle.html ~10764 comment in _withStoryPlayerGimmickGate
// > Used by every player-side acquisition path EXCEPT Cable Link
// > (the premium "another trainer's mon" path is allowed to surface
// > pre-unlock gimmicks by design — see _makePlayerLinkBuild).

// CHANGELOG.md 2026-05-21 entry, lines 23-27:
// > Cable Link is deliberately left ungated — its premium "another
// > trainer's mon" vibe (high reroll cost, can surface pre-unlock
// > gimmicks) is the only sanctioned shortcut.

// battle.html ~42374 — actual implementation
function _makePlayerLinkBuild(name, tierTag) {
    try {
        window._pbsStoryUsePlayerGimmickGate = true;
        window._pbsStoryUnlockedGimmicks = sm.unlockedGimmicks || [];
        newBuild = makeBuild(name);
    } finally { ... }
}
```
The Cable Link builder applies the EXACT same gate that the CHANGELOG and the helper comment claim it bypasses. So a Gym-3 player paying for a Cable Link upgrade cannot, in practice, surface a Mega/Z/Tera/DMax build.

**Repro**: At Gym 3 (badges=3, `sm.unlockedGimmicks` empty), Cable Link upgrade a Charizard. The result will never carry a Charizardite Y, no matter how many rerolls.

**Blast radius**: Two parts: (1) the comment + CHANGELOG entries above are stale/lying about the gate; (2) if the *spec* intent was the documented "Cable Link is the premium pre-unlock shortcut" behaviour, the implementation regressed. `STORY_MODE_FLOW.md §15d` line 712-715 actually says Cable Link **IS** gated ("preserves the existing player gimmick gating … Cable Link only rolls gimmicks the player has unlocked"), so the spec is internally consistent with the code, but the CHANGELOG and `_withStoryPlayerGimmickGate` comment contradict it.

**Fix sketch**: Either (a) drop the gate from `_makePlayerLinkBuild` to match the CHANGELOG, or (b) rewrite the CHANGELOG entry and the `_withStoryPlayerGimmickGate` comment to match reality and the existing spec.

**Verification**: After (a), Cable Link rerolls / upgrades / rebuilds at pre-Gym-5 should occasionally roll Mega/Z/Tera/DMax mons; the `if (!Array.isArray(window._pbsStoryUnlockedGimmicks))` short-circuit in `_mechForGimmickRoll` (line 10751) handles "no gate" cleanly.

---
severity: P2
category: bug
anchor_symbol: renderCityActions
current_line_hint: ~35956
file: battle.html
agents: [story-mode-investigator]
fingerprint: 387fecfc77f7
confidence: high
status: open
---

**Title**: City-hub Mystery Figure NPC sprite is hard-coded to Cyrus, ignoring `sm.mysteryIdentity` rotation

**Evidence**:
```js
// battle.html ~35947 (renderCityActions, "swap mode" branch)
let spriteTrainerArg = { spriteFile: CITY_GUIDE_SPRITES[...] };
if (hasProf && !profUsedHere) {
    if (hasTeamRoom) {
        const hub = cityProfessorHubSlot(cityIdx);
        speakerLabel = hub.label;
        spriteTrainerArg = { spriteFile: hub.spriteFile };
    } else {
        speakerLabel = '???';
        spriteTrainerArg = 'Cyrus';     // ← hard-coded
    }
}
```
The Professor screen (battle.html ~36929) correctly uses `_storyEnsureMysteryIdentity()` for the sprite. The hub branch does not. So at City 8 + 8 badges, the hub NPC says ??? next to a Cyrus sprite even when `sm.mysteryIdentity === 'red'` and the upcoming Mystery Figure battle will show Red.

**Repro**: `?debugMystery=1` → seed legendary-gate state → enter City 8 hub. The hub sprite is Cyrus regardless of which identity was rolled at run start.

**Blast radius**: Cosmetic only — battle still works. Specifically affects 8 of 9 possible rolled identities (`ghetsis`/`cynthia`/`steven`/`n`/`red`/`lance`/`buried_alive`/`cartridge_self`) — the hub sprite is wrong for every variant except `cyrus`. Mild lore-coherence issue, since the Mystery Figure rotation was the explicit fix for the prior audit's "Mystery Figure sprite unconditionally Cyrus" finding (now fixed in the battle path, missed in the hub).

**Fix sketch**: Replace `spriteTrainerArg = 'Cyrus'` with `spriteTrainerArg = (_storyEnsureMysteryIdentity() || { sprite: 'Cyrus' }).sprite ?? 'Cyrus'` (mirror the Professor screen's hub picker exactly).

**Verification**: Force `sm.mysteryIdentity = 'red'` via DevTools, then re-render the City 8 swap hub. Sprite should be Red.

---
severity: P3
category: bug
anchor_symbol: renderTeamPanel
current_line_hint: ~36657
file: battle.html
agents: [story-mode-investigator]
fingerprint: c83c6453be8a
confidence: high
status: open
---

**Title**: Party count chip shows "(N/6)" regardless of the actual badge-driven cap

**Evidence**:
```js
// battle.html ~36657
if (countEl) countEl.textContent = sm.team.length ? `(${sm.team.length}/6)` : '';
```
`_storyMaxPartySize()` returns `Math.max(2, Math.min(6, 2 + badges))` — so a 0-badge player has a cap of **2**, not 6. The party count shows "1/6" at City 0 even though the player can only field 2.

**Repro**: Start a fresh story run, take a starter, look at the HUD's party count.

**Blast radius**: Cosmetic. The player who reads "1/6" might think they can hold 6 mons and be surprised when Catch Tutorial overflows to PC. Also subtly conveys the wrong difficulty signal.

**Fix sketch**: 
```js
const _capForDisplay = (typeof _storyMaxPartySize === 'function') ? _storyMaxPartySize() : 6;
countEl.textContent = sm.team.length ? `(${sm.team.length}/${_capForDisplay})` : '';
```
The PC overflow error message at line 40487 already does this correctly (`${maxParty}`), so this is the lone display lag.

**Verification**: At 0 badges with 1 mon, chip should read "1/2"; at 4 badges with 5 mons, chip should read "5/6".

---
severity: P3
category: refactor
anchor_symbol: shouldForceCityProfessor
current_line_hint: ~28822
file: battle.html
agents: [story-mode-investigator]
fingerprint: e8d8ed327813
confidence: medium
status: open
---

**Title**: `shouldForceCityProfessor` uses dead `sm.team.length < 6` floor that's shadowed by outer `hasTeamRoom` gate

**Evidence**:
```js
// battle.html ~28809
function shouldForceCityProfessor(cityIdx, actions) {
    if (c >= 9) return false;
    if (...) return false;
    if (isPreLeagueLegendaryMysteryGate(c)) return true;
    if (_isPostGymHubAtEventIdx(...)) return false;
    return sm.team.length < 6;   // ← uses hard-coded 6
}

// battle.html ~35931 (caller in renderCityActions)
const _partyCap = _storyMaxPartySize();   // 2..6
const hasTeamRoom = sm.team.length < _partyCap;
const hasProf = (hasBaseProf || shouldForceCityProfessor(cityIdx, actions))
              && (hasTeamRoom || _legendaryGateHere);
```
The `< 6` floor in `shouldForceCityProfessor` is functionally dead: any time it returns `true` with `team.length >= _partyCap`, the outer `&& hasTeamRoom` clause flips the result to `false` anyway. The two formulas should match for clarity, or the inner check should just be `return true;`.

**Repro**: Inspect `shouldForceCityProfessor` semantics. Any test where team.length >= partyCap but < 6 (e.g. badges=2, team=4) reaches the `team.length < 6 = true` branch, but the outer `hasTeamRoom = (4 < 4) = false` overrides it.

**Blast radius**: Logic-only smell, no user-visible bug today. Future contributors trying to reason about Professor visibility see two different cap formulas (`< 6` vs `< _partyCap`) and lose time triangulating.

**Fix sketch**: Replace the inner check with `return sm.team.length < _storyMaxPartySize();` — or just `return true;`, since the outer caller already gates on `hasTeamRoom`. Adds a small consistency win.

**Verification**: After fix, both call sites express the same cap formula.

---
severity: P2
category: balance
anchor_symbol: _storyEnemyPartySize
current_line_hint: ~37311
file: battle.html
agents: [story-mode-investigator]
fingerprint: aa41935a60b3
confidence: high
status: open
---

**Title**: Foe party size matches `team.length` with per-role floors instead of the spec'd `min(6, 2+badges)` badge curve

**Evidence**:
```js
// battle.html ~37311  (implementation)
function _storyEnemyPartySize(event, playerTeamLen, eventId) {
    if (... Champion / Victory Road / E1-4 / Mystery Figure) return 6;
    if (eventId === STORY_RIVAL_ROW_INTRO) return min(6, max(1, playerTeamLen)); // pure player-match
    let floor = 1;
    if (/Rival/i.test(e)) floor = 2;
    else { /* gym leader 1..2:2, 3..4:3, 5..6:4, 7:5, 8:6 */ }
    return Math.max(floor, min(6, playerTeamLen));   // ← team length + role floor
}

// STORY_MODE_FLOW.md §1 (canonical spec):
//   "Foe sizing | Badge curve: min(6, 2 + badges) for everyone except story
//    finales (always 6) and the intro rival (pure player-match for a 1v1
//    starter duel). So foes = 2 pre-Gym-1, 3 post-Gym-1, …, 6 from
//    post-Gym-4 on."
// STORY_MODE_FLOW.md §1, "Expected sequence" row:
//   "GL2 3v3 → (badge 2, cap 4)"  — but if a player at 1 badge with only
//    2 mons faces GL2, the code returns max(2, min(6, 2)) = 2, not 3.

// Confirming the spec read: the balance audit helper at battle.html:48055
// computes the spec-correct curve as the reference:
const partySize = Math.min(6, 2 + badgesAccum);
```

**Repro**: Start a run, decline every Professor (only the starter), don't catch any wild. Reach GL2 at 1 badge with team.length=1. Foe size = `max(2, min(6, 1)) = 2`, not the spec'd `min(6, 2+1) = 3`.

**Blast radius**: Affects every non-finale foe count for a "non-catcher" player who keeps their party lean. Most-impacted: GL1-GL4 (Stage 1/2) where players regularly skip catches. Sub-leader trainers (Basic Trainer / Gym Trainer / Elite Trainer have role-floor=1) skip the spec curve hardest — at 4 badges + 1 mon they're still 1v1, but spec says 5v5.

**Fix sketch**: Change `_storyEnemyPartySize` to ignore `playerTeamLen` for non-finale, non-intro-rival rows and return the badge curve directly:
```js
function _storyEnemyPartySize(event, _playerTeamLen, eventId) {
    if (... finale list) return 6;
    if (eventId === STORY_RIVAL_ROW_INTRO) return Math.max(1, Math.min(6, _playerTeamLen | 0));
    return Math.min(6, 2 + ((sm && sm.badges) | 0));
}
```
This matches the audit helper at line 48055 exactly. Or update `STORY_MODE_FLOW.md` to ratify the team-length match if that was the intentional balance change.

**Verification**: A no-catcher run at 1 badge facing GL2 should now field 3 foes. The "Expected sequence" table in `STORY_MODE_FLOW.md §1` should match observed behaviour.

---
severity: P2
category: dx
anchor_symbol: SAVE_VER
current_line_hint: ~29995
file: battle.html
agents: [story-mode-investigator]
fingerprint: 1877fb707d44
confidence: high
status: open
---

**Title**: SAVE_VER stays at 19 despite an implicit v20 schema cleanup that runs on every load

**Evidence**:
```js
// battle.html ~29995
const SAVE_VER = 19;

// battle.html ~30896 (inside load(), runs every load regardless of version)
// v20: casino runs on gold directly. Drop the legacy coin
// currency silently from old saves.
try { delete sm.casinoCoins; } catch (e) {}
if (!sm.casinoStats || typeof sm.casinoStats !== 'object') sm.casinoStats = {};
try { delete sm.casinoStats.cashier; } catch (e) {}
try { delete sm.profIntroThemePending; } catch (e) {}
// ...
// And around 30919:
try { delete sm.deferredEarlyRivalPos; } catch (e) {}
```

The "v20" cleanup runs unconditionally on every load — it's not gated by `_loadedVer < 20`, and `SAVE_VER` was never bumped. So:
- A pristine v20 schema doesn't exist (no version bump means new saves stamp version=19).
- The implicit migration runs forever on every load, wasting cycles (cheap, but unbounded).
- Any future v20 changes that require a real migration will have no clean way to identify "loaded from pre-v20 vs already-cleaned".

**Repro**: `localStorage.getItem('pbs_story_save')` → look for `casinoCoins` key. It's never persisted post-load. The cleanup is idempotent, so it doesn't break anything; it just makes "v20" a phantom version.

**Blast radius**: DX/maintainability. A future contributor adding a real v20 migration needs to retrofit a `_loadedVer < 20` block and bump SAVE_VER. Meanwhile, the unconditional `delete` calls are silent enough that nobody notices the absence of an explicit `_loadedVer < 20` block.

**Fix sketch**: Wrap the four delete calls in `if (_loadedVer < 20) { ... }`, bump `SAVE_VER = 20`, and add a one-line `migrateStoryPreV20()` (or rename the cleanup to be the canonical migration). Mirrors the explicit pattern used for v15-v19.

**Verification**: After fix, `_loadedVer === 20` saves skip the delete pass. Symbol-index lookup `--lookup migrateStoryPreV20` resolves cleanly.

---
severity: P2
category: bug
anchor_symbol: _storyPickMysteryIdentity
current_line_hint: ~28753
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9e0788d6bed7
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `_storyPickMysteryIdentity` uses bare `Math.random()` — Mystery Figure roll diverges across seeded replays

**Evidence**:
```js
// battle.html ~28753
function _storyPickMysteryIdentity() {
    const allKeys = Object.keys(MYSTERY_FIGURE_IDENTITIES);
    ...
    let r = Math.random() * total;   // ← bare Math.random in biased branch
    ...
    return allKeys[Math.floor(Math.random() * allKeys.length)];  // ← bare in fallback
}
```

The mystery identity is pinned to `sm.mysteryIdentity` after first roll — so a single run is consistent. But two players sharing the same `?seed=X` (or one player retrying via deleteSave + same seed) get different Mystery Figure identities, breaking seeded-replay parity.

**Repro**: `localStorage.removeItem('pbs_story_save')`, then start two runs with the same seed via dev tools (force `sm.runSeed = 12345`). The two runs will diverge on `sm.mysteryIdentity` ≥ 80% of the time (8 keys, near-uniform).

**Blast radius**: Daily-seed contests, replay-share videos, the prior audit's "1.1 rival's secondary intro line uses bare Math.random" finding class. Identity choice affects sprite, intros, and outros across many scenes, so the divergence is highly visible.

**Fix sketch**: Replace both `Math.random()` calls with `(sm && sm.active) ? storyRngNext() : Math.random()` — same idiom as the wild-build / rival picks. Identity-bias preset path also.

**Verification**: After fix, two fresh runs with the same seed pick the same `sm.mysteryIdentity`. Existing saves migrate trivially — `sm.mysteryIdentity` is already pinned, so they keep whatever they rolled.

---
severity: P3
category: dx
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~13244
file: battle.html
agents: [story-mode-investigator]
fingerprint: e02d0b455313
confidence: high
status: open
---

**Title**: `applyFoeDifficultyScaling`'s "additive league boost" comment narrates a fix that was never implemented

**Evidence**:
```js
// battle.html ~13244 (inside applyFoeDifficultyScaling)
// > League boost (E1-E4 / Champion / league Rival / post-HoF Mystery)
// > is stored as additive deltas on the mon by applyStoryLeagueFoeStatBoost
// > so difficulty and boss boost stack ADDITIVELY (not multiplicatively).
// > Stops the 1.30 × 1.40 = 1.82 cliff between Normal and Challenge.
const lb = mon._leagueStatBonus;        // always undefined
const hpMult = mult + (lb && lb.hp ? lb.hp : 0);  // collapses to: mult
```
The actual `applyStoryLeagueFoeStatBoost` (line 30729) mutates `mon.maxHp *= hpM` and **never** writes `mon._leagueStatBonus`. The two comments contradict each other:
- Line 13245: "stack additively"
- Line 30766: "applied BEFORE difficulty scaling, so hard/challenge mode stacks on top multiplicatively"

The code matches line 30766. The line 13244 comment is a description of an intended fix that was never landed.

**Repro**: `grep -nE "_leagueStatBonus" battle.html` returns exactly one hit (read site only).

**Blast radius**: Documentation-debt only — the stat code works, just not the way the comment describes. Any contributor reading the line-13244 block to understand how league boost interacts with difficulty will be misled.

**Fix sketch**: Pair with the P1 fingerprint above. Either (a) delete the additive comment & confirm the multiplicative behavior is intentional, or (b) finish implementing the additive merge by writing `_leagueStatBonus` in `applyStoryLeagueFoeStatBoost` instead of mutating `maxHp` directly.

**Verification**: After (a), the line-13244 comment matches the code reality. After (b), the P1 stack-multiplicatively bug is also resolved.

---
severity: P3
category: dx
anchor_symbol: enterProfessor
current_line_hint: ~36966
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6240f054e598
confidence: medium
status: open
---

**Title**: `enterProfessor` duplicates gimmick-gate logic inline instead of using `_withStoryPlayerGimmickGate`

**Evidence**:
```js
// battle.html ~36966  (enterProfessor choice loop)
try {
    window._pbsStoryUsePlayerGimmickGate = true;
    window._pbsStoryUnlockedGimmicks = sm.unlockedGimmicks || [];
    build = makeBuild(name);
} finally {
    window._pbsStoryUsePlayerGimmickGate = false;
    delete window._pbsStoryUnlockedGimmicks;
}

// battle.html ~10766 — the helper EXISTS:
function _withStoryPlayerGimmickGate(fn) {
    try {
        window._pbsStoryUsePlayerGimmickGate = true;
        window._pbsStoryUnlockedGimmicks = (typeof sm !== 'undefined' && sm && Array.isArray(sm.unlockedGimmicks)) ? sm.unlockedGimmicks : [];
        return fn();
    } finally { ... }
}
```
Same idiom also duplicated in `_makePlayerLinkBuild` (line 42374). Three identical copies of the gate logic; only `makeWildBuild` and `_bossArcRollLegendary` and the roaming-legendary prepare actually use the helper.

**Repro**: `grep -nE "_pbsStoryUsePlayerGimmickGate = true" battle.html` returns 3 sites (Professor, Link, plus implicit via the helper). The helper is two lines shorter at call sites and was added precisely to consolidate this pattern.

**Blast radius**: DX only. Every duplicated copy is a place where a future contributor might fix the gate at one site and miss the others.

**Fix sketch**: Replace the inline try/finally in `enterProfessor` and `_makePlayerLinkBuild` with `build = _withStoryPlayerGimmickGate(() => makeBuild(name));`. Identical semantics, three lines saved per site.

**Verification**: After consolidation, `grep -c "_pbsStoryUsePlayerGimmickGate = true" battle.html` returns 1 (the helper) instead of 3.

---
severity: P3
category: inconsistency
anchor_symbol: CHANGELOG
current_line_hint: ~22
file: CHANGELOG.md
agents: [story-mode-investigator]
fingerprint: f7bb006d3e94
confidence: high
status: open
---

**Title**: CHANGELOG 2026-05-21 entry claims Cable Link is ungated but the implementation in v18 explicitly gates it

**Evidence**:
```
CHANGELOG.md (lines 23-27):
> Cable Link is deliberately left ungated — its premium "another
> trainer's mon" vibe (high reroll cost, can surface pre-unlock
> gimmicks) is the only sanctioned shortcut.

STORY_MODE_FLOW.md §15d (line 712-715):
> The shared helper preserves the existing player gimmick gating
> (_pbsStoryUsePlayerGimmickGate) — Cable Link only rolls gimmicks
> the player has unlocked via gym victories.

battle.html ~42374 _makePlayerLinkBuild:
> [explicitly applies the gate; see fingerprint 4b6cce4cb746]
```
Three sources, two stories. CHANGELOG says ungated, spec says gated, code matches the spec. The CHANGELOG description of the unlock-gate-closed pass is wrong/stale.

**Repro**: Read CHANGELOG lines 23-27 alongside `STORY_MODE_FLOW.md §15d` and `_makePlayerLinkBuild` at line 42374.

**Blast radius**: Documentation only. A contributor following the CHANGELOG to understand Cable Link will be surprised when their pre-Gym-5 reroll never surfaces a Mega.

**Fix sketch**: Rewrite the CHANGELOG entry's "Cable Link is deliberately left ungated" paragraph to reflect actual code:
> Cable Link applies the same gimmick gate via `_makePlayerLinkBuild`
> (see `STORY_MODE_FLOW.md §15d`). The "premium another trainer's mon"
> vibe is preserved via the higher reroll cost + Tournament-tier
> build, not via mechanics surfacing pre-unlock.

**Verification**: After fix, CHANGELOG + spec + code all agree.

---
severity: P3
category: dx
anchor_symbol: catchUnlocked
current_line_hint: ~30597
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9facd1ec61ac
confidence: high
status: open
---

**Title**: `sm.catchUnlocked` is written by migration + newStoryRun but never read anywhere

**Evidence**:
```bash
$ grep -nE "catchUnlocked" battle.html
30597:            if (typeof sm.catchUnlocked !== 'boolean') sm.catchUnlocked = false;
30672:                   catchUnlocked: false,         # sm default
33704:                catchUnlocked: false,            # newStoryRun
```
Three writes, zero reads.

`STORY_MODE_FLOW.md §10` documents the field as:
> `catchUnlocked: false, // toggles wild-route prompts; flipped on after first wild route entry or starter`

So the spec promised the field would gate something. The implementation never wired the read.

**Repro**: After v15+ migration, `sm.catchUnlocked` is always `false`. No code path observes the flag.

**Blast radius**: 4 bytes of save bloat per slot. Future contributors may assume the field gates something and add a guard, only to find it never flips.

**Fix sketch**: Either (a) remove the field from `sm` defaults + newStoryRun + migration; or (b) actually gate the wild-route catch prompt on it (with the side-effect that pre-v15-then-restored saves never see the prompt fire). Option (a) is the cheap fix.

**Verification**: After (a), `grep -nE "catchUnlocked" battle.html` returns 0.

---
severity: P3
category: dx
anchor_symbol: wildSeenByEventIdx
current_line_hint: ~39699
file: battle.html
agents: [story-mode-investigator]
fingerprint: d7124798a455
confidence: medium
status: open
---

**Title**: `sm.wildSeenByEventIdx` and `sm.staticDrops` are lazily initialized instead of declared in the `sm` defaults block

**Evidence**:
```js
// battle.html ~30654   sm defaults block
let sm = { active:false, eventIndex:0, badges:0, gold:2000, casinoStats:{}, team:[], ... };
// (no wildSeenByEventIdx, no staticDrops in the literal)

// battle.html ~39699   lazy init
function _markWildSeen(battleIdx, delta) {
    if (!sm.wildSeenByEventIdx || typeof sm.wildSeenByEventIdx !== 'object') sm.wildSeenByEventIdx = {};
    ...
}

// battle.html ~38199   lazy init
if (!sm.staticDrops || typeof sm.staticDrops !== 'object') sm.staticDrops = {};

// battle.html ~38535   lazy init
if (!sm.staticDrops) sm.staticDrops = {};
```
Most save fields are declared in the `sm` literal (~30654) and `newStoryRun` (~33660). These three are not, which makes "what state does a fresh run actually have?" harder to reason about.

**Repro**: `JSON.stringify(sm)` on a brand-new run will have `pcBox` / `balls` / `pokedex` etc. but no `wildSeenByEventIdx` / `staticDrops` / `bossArc`. They get added incrementally as gameplay touches them.

**Blast radius**: DX only. Schema is shaped by code-flow rather than by data definition.

**Fix sketch**: Add `wildSeenByEventIdx: {}, staticDrops: {}, bossArc: null` to both the `sm` literal at ~30654 and the newStoryRun block at ~33660. The lazy-init guards can stay as defensive checks but become no-ops on new runs.

**Verification**: After fix, a fresh run's `Object.keys(sm)` shows the full schema up-front; no field appears mid-run.

---
severity: P2
category: inconsistency
anchor_symbol: _pcRefresh
current_line_hint: ~38678
file: battle.html
agents: [story-mode-investigator]
fingerprint: f7ba532510f0
confidence: medium
status: open
---

**Title**: "PC nearly full" warning threshold is `PC_BOX_CAP - 3` (27/30) but the spec calls for 80% (8/10)

**Evidence**:
```js
// battle.html ~38677
const boxFull = box.length >= PC_BOX_CAP;
const lowSlotWarn = box.length >= (PC_BOX_CAP - 3) && box.length < PC_BOX_CAP;
// PC_BOX_CAP === 30, so warning fires at 27/30 (90%).

// STORY_MODE_FLOW.md §7:
// > At ≥ 8/10 the screen shows a "PC nearly full" warning banner;
// > at 10/10 a new wild catch fails outright with a clear modal
```
80% of 10 = 8. The spec's ratio (8/10 = 80%) differs from the code's ratio (27/30 = 90%). Bound to the P1 PC_BOX_CAP discrepancy — if cap is realigned to 10, the warning at "cap-3" becomes 7/10, even further off-spec.

**Repro**: Deposit 26 mons in PC. No warning. Deposit 27th — warning fires. Per spec, the warning should have fired at 8.

**Blast radius**: Cosmetic warning UX. Becomes a real issue if the P1 PC_BOX_CAP discrepancy is resolved either direction.

**Fix sketch**: Replace `(PC_BOX_CAP - 3)` with `Math.floor(PC_BOX_CAP * 0.8)` so the warning ratio is parametric. At cap=10 → fires at 8; at cap=30 → fires at 24.

**Verification**: After fix, warning fires at 80% of whatever cap was. Spec text matches code at any cap.

---
severity: P3
category: data
anchor_symbol: STORY_MODE_FLOW.md
current_line_hint: 30
file: STORY_MODE_FLOW.md
agents: [story-mode-investigator]
fingerprint: 85733dc0b897
confidence: high
status: open
---

**Title**: STORY_MODE_FLOW.md PC cap of 10 contradicts shipped PC_BOX_CAP=30

**Evidence**:
```
STORY_MODE_FLOW.md §1 (line 30): "PC | Pure storage. Flat array, cap 10 …"
STORY_MODE_FLOW.md §7 (line 168): "PC Storage — Deposit, withdraw, release. Capacity 10 — intentionally tight …"
STORY_MODE_FLOW.md §14, A2 (line 414): "Flat-array PC, cap 10 (revised down from the prior audit's 60 …)"

battle.html:38560 → const PC_BOX_CAP = 30;
```
Three separate spec mentions all say 10. Code says 30. Sibling fingerprint `fad97b9dadac` files the same drift from the code direction.

**Repro**: `grep -nE "cap.?10|Capacity 10" STORY_MODE_FLOW.md` returns three hits; `grep -nE "PC_BOX_CAP" battle.html` returns one hit at 30.

**Blast radius**: Spec is the canonical source per `CODEBASE_MAP.md`. Any agent reading the spec to seed a fix lands on the wrong number.

**Fix sketch**: Either bump the spec from 10 → 30 (if 30 is intentional — likely, given the Pokédex collection arc that was added v17+), or drop code to 10. Pair with fingerprint `fad97b9dadac`.

**Verification**: After fix, spec and code agree on a single value.

---
severity: P3
category: bug
anchor_symbol: enterProfessor
current_line_hint: ~36935
file: battle.html
agents: [story-mode-investigator]
fingerprint: 11baf155adf0
confidence: medium
status: open
---

**Title**: `enterProfessor` reuses `_pendingProfChoices` across city visits at the same cityIdx — stale picks may persist past spec'd one-shot pool

**Evidence**:
```js
// battle.html ~36935
const shouldReuseChoices = Array.isArray(_pendingProfChoices)
    && _pendingProfChoices.length > 0
    && _pendingProfCityIdx === cityIdx
    && _pendingProfWasMystery === _profMysteryMode;
```
The reuse predicate keys only on cityIdx + mystery mode. If the player visits City 3's Professor (rolls 3 choices), backs out without picking, walks all the way to City 8 and back to City 3, the same 3 picks re-appear. Spec is silent on whether picks should be re-rolled on each visit, but the current behaviour also bypasses any later changes to the enabled gens / settings that affect the roll.

**Repro**: Visit City 3 Professor; note the 3 rolled species. Decline. Walk to City 8 and back. Visit City 3 Professor again. Same 3 species (assuming `sm.profUsed[3]` was never set, which happens on Decline, not just dismissal).

**Blast radius**: Mild. Players may be subtly trapped into the same first pick across a long road trip, even though they expected fresh picks. Combined with the city-tier-specific tier curve, this means a player who returns at higher badges still sees the lower-tier rolls.

**Fix sketch**: Either invalidate `_pendingProfChoices` whenever `sm.badges` changes since the last visit, or refresh on every entry (the cost is small — three `makeBuild` calls). Or document that the reuse is intentional ("picker is sticky until you accept or until a hub state change clears it").

**Verification**: After fix, returning to a Prof at higher badges shows fresh tier-curve-appropriate picks.

---
severity: P3
category: dx
anchor_symbol: migrateStoryPreV15
current_line_hint: ~30605
file: battle.html
agents: [story-mode-investigator]
fingerprint: 6aecb8bc20ed
confidence: medium
status: open
---

**Title**: v15 stable-ID migration only iterates `sm.team`, not `sm.pcBox` (harmless today but inconsistent with v17)

**Evidence**:
```js
// battle.html ~30605  migrateStoryPreV15
if (Array.isArray(sm.team)) {
    for (const slot of sm.team) {
        if (slot && typeof slot === 'object' && !slot.id) {
            slot.id = 'm_' + Math.random().toString(36).slice(2, 10);
        }
    }
}
// no sm.pcBox iteration

// battle.html ~30633  migrateStoryPreV17 (later fix)
for (const arr of [sm.team, sm.pcBox]) {
    if (!Array.isArray(arr)) continue;
    for (const slot of arr) {
        if (slot && typeof slot === 'object' && !slot.id) {
            slot.id = 'm_' + Math.random().toString(36).slice(2, 10);
        }
    }
}
```
The v15 migration was authored when `sm.pcBox` didn't yet exist (PC was introduced in v15), so the gap is moot in practice. But v17 had to follow up specifically because the v15 ID-stamping didn't cover pcBox. Today, on a pre-v15 save: v15 stamps team IDs → v17 stamps pcBox IDs (newly-created by `migrateStoryPreV15`'s `if (!Array.isArray(sm.pcBox)) sm.pcBox = []` — so pcBox is empty array, no IDs to stamp). Safe.

**Repro**: Trace a fresh v15 → v17 → v19 migration of a pre-v15 save. pcBox is empty after v15, so no IDs are missed.

**Blast radius**: None — purely a consistency note for clarity.

**Fix sketch**: Either accept the historical sequencing (no action), or backport the v17 pattern into v15 for cleaner reading: `for (const arr of [sm.team, sm.pcBox]) { ... }`. Behavior unchanged either way.

**Verification**: Round-trip a pre-v15 save through the chain; PCs all have IDs.

---
severity: P2
category: bug
anchor_symbol: load
current_line_hint: ~30943
file: battle.html
agents: [story-mode-investigator]
fingerprint: 157f95348987
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: `_loadedVer < 14` block missing — v14 trainer-name migration never runs for saves stamped at exactly v13

**Evidence**:
```js
// battle.html ~30923  load() migration chain
const _loadedVer = d.version | 0;
if (_loadedVer < 8)  { migrateStoryTimelineIndicesFromPreV8(); }
if (_loadedVer < 9)  { migrateStoryTimelineIndicesFromPreV9(); }
if (_loadedVer < 10) { migrateStoryTrainerDisplayNamesPreV10(); }
if (_loadedVer < 11) { migrateStoryTrainerLegacyNamesPreV11(); }
if (_loadedVer < 12) { migrateStoryTrainerAssignmentsPreV12(); }
if (_loadedVer < 13) {                        // ← bundles v13 AND v14 fixes
    migrateStoryArtifactShopPreV13();
    migrateStoryTrainerAssignmentsPreV14();  // ← should be < 14, not < 13
}
// NO `if (_loadedVer < 14)` block exists
if (_loadedVer < 15) { migrateStoryPreV15(); }
```

The v14 migration is what remaps legacy trainer keys like `'Blue Champion'` / `'Red'` in Elite Trainer slots / `'Blue 2'` etc. — see `migrateStoryTrainerAssignmentsPreV14` body. A save that was opened in the v13 window (after v13 shipped but before v14 shipped) saves itself as `version: 13`. On the next load, `_loadedVer=13` → `< 13 is false` → v14 fix is skipped forever.

**Repro**: Manually edit a story save to `version: 13`. Confirm via load() that no v14 migration runs. Set `sm.trainerAssignments['34'] = 'Blue Champion'` (or similar legacy name); the assignment stays, even though all post-v14 callers expect canonical names.

**Blast radius**: Narrow — only saves that touched the brief v13 window. Symptoms: an Elite Trainer slot keeps a legacy "Champion"-class name; battle dispatch routes to Champion-style roster on what should be E1; victory line lookup misses.

**Fix sketch**: Split the v13 block into two:
```js
if (_loadedVer < 13) { try { migrateStoryArtifactShopPreV13(); } catch (e) {} }
if (_loadedVer < 14) { try { migrateStoryTrainerAssignmentsPreV14(); } catch (e) {} }
```

**Verification**: A `version: 13` save with `trainerAssignments['34'] = 'Blue Champion'` should be remapped after fix; pre-fix, it stays.

---
severity: P3
category: dx
anchor_symbol: _storyEnemyMechKeys
current_line_hint: ~31328
file: battle.html
agents: [story-mode-investigator]
fingerprint: d5c6a99636ec
confidence: medium
status: open
---

**Title**: `_storyEnemyMechKeys` doesn't guard against missing `sm.settings` — could throw on a malformed save

**Evidence**:
```js
// battle.html ~31328
function _storyEnemyMechKeys() {
    const k = [];
    const unlocked = new Set(Array.isArray(sm.unlockedGimmicks) ? sm.unlockedGimmicks : []);
    if (sm.settings.dynaOn && unlocked.has('dmax')) k.push('gmax');    // ← throws if sm.settings undefined
    if (sm.settings.megaOn && unlocked.has('mega')) k.push('mega');
    ...
}
```
A corrupted save (deleted `sm.settings`, partial load) would throw `TypeError: Cannot read property 'dynaOn' of undefined`. The function is called from inside `_applyEnemyGimmickDistribution` → `rollTrainerTeam` — every battle entry. The `try/catch` at startBattle (`forEach` wrap at line 15319) catches the throw but the foe team won't have mechanics.

**Repro**: Construct a save with `version: SAVE_VER` but no `settings` key, load it. `_storyEnemyMechKeys()` throws.

**Blast radius**: Low — the load() function already enforces `sm.settings` exists (lines 30903-30917 add defaults). The throw is theoretically reachable via direct console mutation. Defensive coding only.

**Fix sketch**: Add the standard pre-guard:
```js
function _storyEnemyMechKeys() {
    const k = [];
    if (!sm || !sm.settings) return k;
    const unlocked = new Set(Array.isArray(sm.unlockedGimmicks) ? sm.unlockedGimmicks : []);
    ...
}
```

**Verification**: After fix, calling `_storyEnemyMechKeys()` with `sm = {}` returns `[]` instead of throwing.

---
severity: P3
category: dx
anchor_symbol: shouldForceCityProfessor
current_line_hint: ~28822
file: battle.html
agents: [story-mode-investigator]
fingerprint: 3db327ab351c
confidence: medium
status: open
---

**Title**: `shouldForceCityProfessor`'s `sm.team.length < 6` floor is dead-coded once the outer `hasTeamRoom` gate clamps to `_storyMaxPartySize()`

**Evidence**:
```js
// battle.html ~28809
function shouldForceCityProfessor(cityIdx, actions) {
    if (c >= 9) return false;
    if (Array.isArray(actions) && actions.includes('Professor')) return false;
    if (isPreLeagueLegendaryMysteryGate(c)) return true;
    if (_isPostGymHubAtEventIdx(...)) return false;
    return sm.team.length < 6;   // ← effectively dead
}

// battle.html ~35931 (caller in renderCityActions)
const _partyCap = _storyMaxPartySize();   // 2..6
const hasTeamRoom = sm.team.length < _partyCap;
const hasProf = (hasBaseProf || shouldForceCityProfessor(cityIdx, actions))
              && (hasTeamRoom || _legendaryGateHere);
```

Two cap formulas in the same flow: `< 6` (inner) and `< _partyCap` (outer). The outer one always shadows the inner when they disagree. Either condition is dead code or a maintainability hazard.

**Repro**: At 2 badges with team=4 (cap=4): `shouldForceCityProfessor` returns `4 < 6 = true`; but `hasTeamRoom = 4 < 4 = false`; so `hasProf = false`. The `< 6` branch did no work.

**Blast radius**: Code-clarity smell. Two formulas describing the same gate is a future-edit footgun.

**Fix sketch**: Either replace `sm.team.length < 6` with `sm.team.length < _storyMaxPartySize()`, or just `return true;` (since the outer caller does the cap check anyway). Pair with fingerprint `e8d8ed327813`.

**Verification**: After fix, both call sites express the same cap formula.

---
severity: P3
category: bug
anchor_symbol: load
current_line_hint: ~30896
file: battle.html
agents: [story-mode-investigator]
fingerprint: 35349ce088b7
confidence: medium
status: open
---

**Title**: `delete sm.casinoCoins` cleanup runs on every load, not gated by `_loadedVer`

**Evidence**:
```js
// battle.html ~30896
// v20: casino runs on gold directly. Drop the legacy coin
// currency silently from old saves.
try { delete sm.casinoCoins; } catch (e) {}
if (!sm.casinoStats || typeof sm.casinoStats !== 'object') sm.casinoStats = {};
try { delete sm.casinoStats.cashier; } catch (e) {}
try { delete sm.profIntroThemePending; } catch (e) {}
```
The pattern is "delete on every load whether or not the field exists". Works correctly because `delete` is idempotent, but is structurally different from the explicit `if (_loadedVer < N)` blocks below it. SAVE_VER is not bumped either (see related fingerprint `1877fb707d44`).

**Repro**: Inspect lines 30896-30901 vs lines 30943-30957. Same kind of operation, different style.

**Blast radius**: DX-only. The implicit `delete` calls are silent and bypass the visible migration ledger.

**Fix sketch**: Wrap in `if (_loadedVer < 20) { ... }` block + bump SAVE_VER. Or, if intentional eternal cleanup, add a comment explaining why these four fields don't follow the `_loadedVer < N` pattern.

**Verification**: After fix, the migration chain reads cleanly from v8 → v20 with no out-of-band deletes.

---
severity: P3
category: bug
anchor_symbol: rollMysteryFigureFinalBossTeam
current_line_hint: ~38014
file: battle.html
agents: [story-mode-investigator]
fingerprint: b99d78121766
confidence: high
status: open
---

**Title**: Mystery Figure intro pool fallback uses 2 lines but the identity's `intros` field has 4 — falls back silently if the identity object lacks `intros`

**Evidence**:
```js
// battle.html ~38016
let trainer = isMysteryFinal
    ? {
        role: 'Mystery Figure',
        ...
        introQuotes: (_mysteryFinalFace && _mysteryFinalFace.intros) || [
            'Your Hall of Fame crown means nothing here.',
            'Show me your strongest six.'
        ]
    }
```
The 2-line fallback would be used if the rolled `mysteryIdentity` somehow doesn't have an `intros` field. All currently-shipped identities (`cyrus`, `ghetsis`, `cynthia`, `steven`, `n`, `red`, `lance`, `buried_alive`, `cartridge_self`) DO have `intros: [...]` — so the fallback is dead in practice. But if a future identity is added without `intros`, the fight silently rolls 2 generic lines instead of catching the omission.

**Repro**: Add a test identity to MYSTERY_FIGURE_IDENTITIES with no `intros` field. The Mystery Figure final fight uses the 2-line fallback.

**Blast radius**: Future-proofing only. No current user impact.

**Fix sketch**: Either (a) move the fallback to be a console.warn + explicit asserter so missing `intros` is caught at the call site; or (b) tighten the type contract by adding a `_validateMysteryIdentity` assertion in `MYSTERY_FIGURE_IDENTITIES` boot block.

**Verification**: Add an identity without `intros`; expect a console warning instead of silent fallback.

---
severity: P3
category: dx
anchor_symbol: settings.megaOn
current_line_hint: ~38242
file: battle.html
agents: [story-mode-investigator]
fingerprint: 671336517e09
confidence: medium
status: open
---

**Title**: Player gimmick-unlock order shifts when a mechanic is disabled in settings — DMax unlocks at Gym 5 instead of Gym 6 if Mega is off

**Evidence**:
```js
// battle.html ~38240  (in onGymVictory handler)
const order = [];
if (sm.settings.megaOn) order.push('mega');
if (sm.settings.dynaOn) order.push('dmax');
if (sm.settings.teraOn) order.push('tera');
if (sm.settings.zOn) order.push('z');
const badges = sm.badges | 0;
const slotsUnlocked = badges < 5 ? 0 : Math.min(4, badges - 4);
sm.unlockedGimmicks = order.slice(0, Math.min(slotsUnlocked, order.length));
```
At badges=5 with all four mechanics enabled: unlock = `['mega']`. At badges=5 with only Dyna enabled: unlock = `['dmax']` (jumped DMax up to slot 1). The unlock schedule is condensed against the order array, so the "first unlock at GL5, full set at GL8" curve compresses or shifts when a setting is off.

**Repro**: New run with Mega disabled in Settings. Beat GL5. `sm.unlockedGimmicks = ['dmax']` (instead of empty). DMax is now available at GL5's first reveal fight, despite the spec/CHANGELOG framing GL5 as "the unlock-reveal fight" for Mega specifically.

**Blast radius**: Subtle balance / pacing issue. The CHANGELOG narrative ("from Gym 5 onwards the catches can only roll from the mechanics the player has actually earned") still holds — but the *which* mechanic players first encounter is wrong. A pure-DMax-only run gets DMax at GL5 instead of GL6.

**Fix sketch**: Either (a) accept the compression as intentional (no action), or (b) anchor the unlock by badges:
```js
const planned = ['mega', 'dmax', 'tera', 'z'];
const slot = Math.max(0, badges - 4);
const newlyUnlocked = planned.slice(0, slot).filter(k => settingForMech(k));
sm.unlockedGimmicks = newlyUnlocked;
```
So at badges=5 with only Dyna on, `unlockedGimmicks` is `[]` until GL6 (dmax's natural slot).

**Verification**: Disable Mega in Settings; after GL5, `sm.unlockedGimmicks` should be `[]` (option b) or `['dmax']` (option a). Match whichever behavior the design intends.

---
severity: P3
category: bug
anchor_symbol: seedDebugMysteryLegendGate
current_line_hint: ~35548
file: battle.html
agents: [story-mode-investigator]
fingerprint: 90afbb333f6a
confidence: low
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Several story-mode dev seeds use `Math.random` for build / sprite picks, breaking seeded replays when debug seeds are in play

**Evidence**:
```js
// battle.html ~35548 (seedDebugMysteryLegendGate)
const filler = ['Bulbasaur','Charmander','Squirtle','Caterpie','Weedle','Pidgey'];
// later: const pick = filler[Math.floor(Math.random() * filler.length)];

// Also lines 35774 / 35657 / 35651: testmega seeds also use Math.random / state.
```
Dev seeds are not exercised in shipped runs (they're gated by `?debugMystery=1` / localhost). But if a developer is hunting a story bug under `?seed=X&debugMystery=1`, the dev seed will fork the RNG state — they can't reproduce the seeded sequence after the dev seed runs.

**Repro**: Run `?seed=12345&debugMystery=1`, fire `seedDebugMysteryLegendGate`. The team it injects differs across reloads.

**Blast radius**: Dev-only ergonomic issue. No production-user impact.

**Fix sketch**: Route the picks through `storyRngNext` (or a `_storyDebugRng` if you want dev seeds isolated from the main RNG stream). Or document that dev seeds intentionally fork the RNG.

**Verification**: With the fix, `?seed=12345&debugMystery=1` produces the same injected team across reloads.

---
