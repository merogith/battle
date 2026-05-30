---
severity: P2
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42027
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1598e26c657a
confidence: high
status: open
---

**Title**: Boss surge/immunity timers live on the active foe mon — lost on switch, stale on bench

**Evidence**:
```js
function _storyBossMechanicsTurnTick(stateRef, foeMon) {
    // foeMon is state.fActive — surge/immunity flags are written on THIS mon only
    if (foeMon._bossSurgeTurns > 0) foeMon._bossSurgeTurns--;
    if (foeMon._bossImmuneTurns > 0) foeMon._bossImmuneTurns--;
    ...
    _applyBossPhaseEffect(foeMon, pending.effect || 'surge', pending.magnitude); // sets foeMon._bossSurgeTurns = 3
```

**Repro**: `node scripts/debug/_repro/boss-edge.mjs` (EDGE 1). faintPhase surge activates on active mon A (`A._bossSurgeTurns=3`). A faints, B switches in; turn tick now runs on B → `B._bossSurgeTurns=0` (no surge), while A keeps a frozen `_bossSurgeTurns=3` on the bench that never decrements. The decrement only ever touches `state.fActive`.

**Blast radius**: All villain-boss faintPhase configs (rocket/magma/aqua/galactic/plasma/flare/skull/yell/macroCosmos/star). The surge phase is *defined* to fire when the team is KO'd — i.e. exactly when the active mon is about to be replaced — so the buffed turns frequently land on the wrong (or a dead) mon. Damage consumer at ~23846 reads `attacker._bossSurgeTurns`, so a freshly-sent mon attacks with no surge even though the phase "activated."

**Fix sketch**: Store surge/immunity on `stateRef` (battle-scoped) rather than per-mon, and have the damage clamp at ~23846/~24105 read `state._bossSurgeTurns`/`state._bossImmuneTurns`. Decrement once per turn in the tick regardless of which mon is active.

**Verification**: Re-run boss-edge.mjs EDGE 1; after A faints and B enters, B should attack with the surge active (or the surge should follow the boss-side, not the mon).

---
severity: P2
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42030
file: battle.html
agents: [battle-engine-debugger]
fingerprint: e3f00646f827
confidence: high
status: open
---

**Title**: Single `_bossPendingTelegraph` slot drops a phase when two mechanics telegraph on the same turn (mfBattle)

**Evidence**:
```js
// only one pending slot — last writer wins
stateRef._bossPendingTelegraph = { type: 'hpThresholdPhase', ... };   // surge phase
...
stateRef._bossPendingTelegraph = { type: 'immunityRound', ... };      // immunity round
// both set _bossMechanicsFired[firedKey]=true, but only one telegraph survives to activate
```

**Repro**: `node scripts/debug/_repro/boss-mf-clobber.mjs`. mfBattle config = `[hpThresholdPhase@0.50 surge, immunityRound everyN5]`. When the MF drops below 50% HP on a turn that is also `turnNumber % 5 === 4`, both mechanics queue a telegraph into the same slot. The loop processes hpThreshold first then immunityRound, so immunity overwrites surge; BUT both mark their `firedKey` true, so the clobbered phase (`hp_0.5`) is permanently consumed and its surge never activates.

**Blast radius**: `main.mfBattle` (the apex Mystery Figure fight) is the only shipped multi-mechanic config where a HP-threshold phase and a periodic immunity round coexist, so it is the concrete victim. Any future config mixing faintPhase + immunityRound has the same hole.

**Fix sketch**: Make `_bossPendingTelegraph` an array (queue) and drain all entries in the activation step; or guard `_bossMechanicsFired[firedKey]=true` so it is only set once the telegraph actually wins the slot. Prefer the queue.

**Verification**: boss-mf-clobber.mjs collision case should leave BOTH `surge` and `immunity` activating on their respective next turns.

---
severity: P3
category: bug
anchor_symbol: _storyBossMechanicsTurnTick
current_line_hint: ~42065
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 9d2a9248db19
confidence: medium
status: open
---

**Title**: faintPhase counts the active foe as "fainted" mid-tick if it is at 0 HP before the swap

**Evidence**:
```js
const fainted = Array.isArray(stateRef.foeParty)
    ? stateRef.foeParty.filter(x => x && (x.currentHp | 0) <= 0).length : 0;
if (fainted >= need) { ... } // counts state.fActive too when it's at 0 HP pre-replacement
```

**Repro**: `node scripts/debug/_repro/boss-edge.mjs` (EDGE 2). The count is a raw `currentHp<=0` filter over `foeParty`; it includes the active mon. Turn-tick runs at top-of-turn (`playTurn`, ~20932) and the foe-replacement loop runs later in `checkFaints` (~25232). If a tick observes `state.fActive.currentHp<=0` before the swap, the dying active mon is tallied, so `afterFaints:2` can fire after only 1 benched KO + the active's death. Whether this mis-times by a turn depends on tick-vs-swap ordering for simultaneous KOs and replacement-then-tick sequencing.

**Blast radius**: faintPhase escalation timing on all villain bosses. Effect is a phase firing ~1 KO early in edge sequences (double-KO turns, hazard chain-KOs at ~25232). Not game-breaking (it only shifts a telegraph) but contradicts the "every 2 KOs" design intent.

**Fix sketch**: Count only *benched* faints relative to the active: `foeParty.filter(x => x !== stateRef.fActive && x.currentHp<=0).length + (alreadyReplacedCount)`, or snapshot the faint count at the moment of replacement rather than re-deriving it each tick from live HP.

**Verification**: Force a double-KO turn in a faintPhase fight; the escalation should fire on the intended Nth distinct KO, not earlier.

---
severity: P3
category: inconsistency
anchor_symbol: _bossHpScaleForKind
current_line_hint: ~14886
file: battle.html
agents: [battle-engine-debugger]
fingerprint: df924face4ff
confidence: high
status: open
---

**Title**: Solo-raid HP is 6.5× base, not the documented (maxParty-1)=5× — stat-mult and HP-scale compound on HP

**Evidence**:
```js
// buildPokemon: _bossStatMult (1.3) multiplies maxHp...
mon.maxHp = Math.max(1, Math.floor(mon.maxHp * bm));     // ×1.3
// ...then _bossHpScale (5) multiplies the ALREADY-boosted maxHp
mon.maxHp = Math.max(1, Math.floor(mon.maxHp * build._bossHpScale)); // ×5  => net ×6.5
```

**Repro**: `node scripts/debug/_repro/raid-balance.mjs`. Mewtwo raid: plain HP 182 → 1180 (×6.5), atk 103→133, spa 206→267, spe 200→260. Comment at ~41912 states "real boss = (maxParty - 1) × base HP" (=5× for a 6-mon party); the shipped value is 6.5×. The boss-mechanics test (`story-boss-mechanics-v22.test.js:183`) explicitly asserts the compounding, so the *code* is internally consistent — the **doc/design intent** is what's stale.

**Blast radius**: All 8 extra-track solo raids (Marowak/Yamask/Hypno/Trevenant/Mimikyu/Drifblim/Parasect/Mewtwo), raid + miniRaid. This is the core balance question (below).

**Fix sketch**: Decide intent. If 5× is the target, apply `_bossHpScale` to the *base* maxHp before `_bossStatMult`, or exclude HP from `_bossStatMult` for boss builds. If 6.5× is intended, fix the comment + the design note in CSV prose. This is a balance-number decision — maintainer-owned.

**Verification**: raid-balance.mjs HP ratio should match whichever target is chosen; update the test's expected formula accordingly.

---
severity: P3
category: inconsistency
anchor_symbol: _applyBossPhaseEffect
current_line_hint: ~42003
file: battle.html
agents: [battle-engine-debugger]
fingerprint: f1a46e8493d6
confidence: medium
status: open
---

**Title**: Heal phase (+25% maxHp) can push a raid boss back ABOVE the HP threshold the player just crossed

**Evidence**:
```js
case 'heal': {
    const amt = Math.floor((foeMon.maxHp || 0) * (magnitude || 0.25));
    foeMon.currentHp = Math.min(foeMon.maxHp, (foeMon.currentHp | 0) + amt);
    break;
}
```

**Repro**: `node scripts/debug/_repro/boss-edge.mjs` (EDGE 4). Real raids use `[surge@0.75, heal@0.50, immunity@0.25]`. A boss at 40% HP gets +25% maxHp on the 50% phase → 65% HP, i.e. back above the 50% bar and above the 75% surge bar already consumed. The fired-flag prevents the *heal* re-triggering, so there is no infinite stall, but the player loses ~25% of a 6.5×-HP boss's bar in one telegraphed beat (≈1.6× a normal mon's entire HP), which can feel like a wall given the 1:1 action economy of a solo boss vs a 6-mon party.

**Blast radius**: All 8 extra-track real raids (the heal phase only exists on `*.raid`, not `*.miniRaid`). Combined with the 6.5× HP this is the slog risk.

**Fix sketch**: Balance decision — either reduce heal magnitude (e.g. 10–15%), cap healed HP to just under the threshold (`Math.min(threshold*maxHp - 1, ...)`), or replace heal with a defensive buff that doesn't re-open closed thresholds. Maintainer-owned number.

**Verification**: After a heal phase, the boss HP% should stay at/under the crossed threshold (if capped) or the heal should be small enough not to undo a full phase of player progress.

---
severity: P4
category: inconsistency
anchor_symbol: storyAwareRng
current_line_hint: ~26330
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 76b72a3f4763
confidence: high
status: open
---

**Title**: Three redundant RNG-routing mechanisms; confusion self-hit relies solely on the global Math.random patch while siblings use storyAwareRng()

**Evidence**:
```js
// confusion self-hit (26330): bare Math.random — covered ONLY by the global patch
else if (Math.random() < 0.3333) { ... }
// thaw (26301) and harvest (28604): use the helper
const _thawRng = storyAwareRng(); if (_thawRng() < 0.2) ...
```

**Repro**: `node scripts/debug/_repro/rng-override.mjs` proves the global `Math.random` override (~34948) routes ALL bare `Math.random()` to `storyRngNext` (byte-identical stream) whenever `sm.active && sm.runSeed != null`. So the prior audit's "bare Math.random drifts seeded replays" P1 is OBSOLETE — confusion/partial-trap/thaw/harvest/rival-intro are all deterministic in story runs. The remaining issue is purely maintainability: `storyRngNext` (direct), `storyAwareRng()` (helper), and the global monkeypatch all coexist, and the confusion site uses none of the explicit forms — a future refactor that narrows the global patch would silently desync confusion while thaw/harvest stay seeded.

**Blast radius**: Determinism is currently intact everywhere in story mode; this is a latent-fragility note, not a live bug. Outside story (`sm.active=false`) these sites are native-random by design (PvP/quick-play — out of scope).

**Fix sketch**: Pick ONE convention. Prefer routing every user-visible battle roll through `storyAwareRng()`/`storyRngNext` explicitly and treat the global `Math.random` patch as a belt-and-suspenders safety net, not the primary mechanism. Convert the confusion self-hit at ~26330 to `storyAwareRng()` for parity with thaw/harvest.

**Verification**: `grep -nE 'Math\.random\(\)' battle.html` inside battle-loop handlers should be ~0 for user-visible rolls; rng-override.mjs determinism still holds.

