---
severity: P2
category: bug
anchor_symbol: startNewRun
current_line_hint: ~39514
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 03906b358d2f
confidence: high
status: open
---

**Title**: Fresh run starts with 0 Poké Balls; skipping the optional City-0 Mart silently no-ops the catch tutorial

**Evidence**:
```js
// startNewRun() fresh sm object literal (39462+): NO starter-ball grant.
balls: { poke: 0, great: 0, ultra: 0, master: 0 },   // 39514 — fresh run
// The ONLY fresh-run ball source is the OPTIONAL first-Mart visit:
firstMart.onContinue: _storyGrantBundle({ pokeBall: 5 });   // 40703
// Catch-tutorial gate hard-fails on 0 balls:
const totalBalls = (balls.poke|0)+(balls.great|0)+(balls.ultra|0)+(balls.master|0);
if (totalBalls <= 0) return false;   // 46943-46944 _shouldFireCatchTutorialBeforeBattle
```
The "starting kit gives 5 … which the starting kit guarantees" comments at 46924/46940 are FALSE for a fresh run — that 5-ball stock is granted only by `migrateStoryPreV15` (35260, pre-v15 *existing* saves) or the optional `firstMart` tutorial. `startNewRun` itself (39441) seeds `poke:0` (39514) with no unconditional grant. The City-0 Pokémart is a player-clicked city action (`enterShop('mart')`, 51416), not a forced beat, so a player can reach the post-intro-rival catch tutorial with `totalBalls === 0`. The interrupt's `prepare` (42028-42029) then returns `null` and the scripted tutorial wild (which is "wild #1 of the intro route node", 42023-42027) silently never fires.

**Repro**: `node scripts/debug/_repro/catch-tut-zeroballs.mjs` (jsdom). With fresh `balls.poke=0`: "Catch-tutorial ball gate (needs >0): BLOCKED (tutorial no-ops)". After the firstMart 5-ball gift: "gate PASSES". Manual: New Game → walk straight past the City-0 Mart → beat the intro rival → the catch tutorial does not play.

**Blast radius**: Story onboarding only (not a hard soft-lock). `_markCatchTutorialDone` is NOT called on the blocked path (mark-done fires only on actual catch success, 51111-51116), so `sm.catchTutorialDone` stays false and the gate re-tries on every later Battle row — it self-heals the moment the player acquires any ball (a later Mart visit, a reward bundle, etc.). The cost is (a) the player loses the scripted free Grade-4 partner catch and the guaranteed 2nd party mon for the early route/Gym-1 number-floor (the stated design goal at 46915-46917), and (b) the in-fiction "starting kit guarantees a ball" contract is violated. The scripted `chainAfter` wild #1 also doesn't fire, shifting the intro route's wild cadence.

**Fix sketch**: Either grant the starter balls unconditionally in `startNewRun` (seed `balls:{poke:5,…}` at 39514, matching the v15 migration and the comment's promise), OR make the City-0 first-Mart visit a forced beat before the first wild route. Option A is the smaller, lower-risk change and makes the 46924/46940 comments true. Coordinate the schema/balance touch with the maintainer (ball counts are user-owned per CLAUDE.md).

**Verification**: Re-run the repro after the fix — fresh-run total must be > 0 and the gate must PASS without a Mart visit. Manual: New Game → skip Mart → intro rival → catch tutorial fires.

---
severity: P3
category: bug
anchor_symbol: applyArtifactBattleEffects
current_line_hint: ~55003
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 672996ea646e
confidence: medium
status: open
---

**Title**: Latent state-bleed: artifact battle-flags reset is behind an empty-artifacts early-return (same init-inside-guard shape as the fixed boss-bleed)

**Evidence**:
```js
function applyArtifactBattleEffects() {
    if (!sm.artifacts || !sm.artifacts.length) return;   // 55003 — EARLY RETURN
    const off = sm.artifactsDisabled || [];
    const active = id => sm.artifacts.includes(id) && !off.includes(id);
    // …flag reset/reassign lives BELOW the guard:
    state._heavyGravityHazardMult = 1;                   // 55015
    state._vampiricFangsActive = active('vampiricFangs'); // 55016 … _glassCannonPact 55076, etc.
}
```
`state` is the persistent module-level battle object; this is the ONLY reset path for the artifact flags (`_vampiricFangsActive`, `_glassCannonPact`, `_berserkerSerumActive`, `_chaosAmuletActive`, `_stagnationCoreActive`, `_reapersTollActive`, `_evioliteBlessing`, `_heavyGravityHazardMult`, `_typeAmplifier/Nullifier/MagnetizerType`). The just-landed startBattle isolation reset (17317-17323) clears the `_boss*`/`_healingWish`/`_lunarDance` flags but does NOT list any of these artifact flags. The flags are read by live damage/stat hooks (e.g. `_vampiricFangsActive` 24453/24577/24666, `_glassCannonPact` 24277, `_stagnationCoreActive` ×7, `_evioliteBlessing` 23541), so a stale `true` would corrupt a follow-up fight's damage exactly like the (now-fixed) boss-immunity bleed (ISSUE-068).

**Repro**: Not currently reachable at runtime. Grep confirms `sm.artifacts` only ever GROWS (`.push` at 51643) or resets to `[]` on a fresh run (35332/39475) — there is NO mid-run removal (`grep -nE 'sm\.artifacts\.(pop|splice|shift|filter)'` → 0 hits), so once a player owns ≥1 artifact `sm.artifacts.length` stays ≥1 and the 55003 early-return never fires again. The disable path keeps the entry in `sm.artifacts` (only pushes to `artifactsDisabled`), so `active()` correctly drives the reassignment. This is a LATENT hazard, not a live bug.

**Blast radius**: None today. It becomes a live damage-corruption bleed the moment any future feature removes an artifact from `sm.artifacts` (a "sell/refund relic", an arc that strips relics, a migration that prunes the list) — the no-artifact battle would then keep the prior fight's relic flags armed.

**Fix sketch**: Hoist the flag DEFAULTS above the early-return so they reset unconditionally (mirror the startBattle boss-bleed fix): move the `state._heavyGravityHazardMult = 1; state._vampiricFangsActive = false; …` zeroing before `if (!sm.artifacts || !sm.artifacts.length) return;`, then let the `active(...)` reassignments below set the live values when artifacts exist. Cheap, behavior-preserving for today's flows, removes the foot-gun.

**Verification**: Add a jsdom regression — equip an artifact, run a battle (flag true), set `sm.artifacts = []`, call `window._storyApplyArtifacts()`, assert every `state._*Active` is false / `_heavyGravityHazardMult === 1`.

