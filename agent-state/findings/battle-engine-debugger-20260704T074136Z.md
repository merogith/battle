---
severity: P2
category: bug
anchor_symbol: storyRngNext
current_line_hint: ~42864
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 6d267eec0d3f
confidence: high
status: open
---

**Title**: Quick Battle/Gauntlet played mid-story-run drains the persisted story RNG stream — replay drift

**Evidence**:
```js
// battle.html ~42864 — the global patch gates ONLY on sm.active + runSeed, not on battle mode:
Math.random = function () {
    if (typeof sm !== 'undefined' && sm && sm.active === true && sm.runSeed != null) {
        return storyRngNext();   // advances sm._strngState — which is PERSISTED in the save
    }
    return _nativeMathRandom.call(Math);
};
```

**Repro**: `node scripts/debug/_repro/story-rng-crossmode-leak.mjs` — with `sm.active=true, sm.runSeed=12345`, one harness `runTurn()` in `state.mode='pve'` advanced `sm._strngState` 2047258335 → 763103371. In production: load a story save (sits at home screen with `sm.active=true`), start a Quick Battle — every engine RNG roll in that battle (damage rolls, crits, secondaries, AI) consumes the story run's seeded stream; the drained `_strngState` is then persisted by the next story `save()`.

**Blast radius**: Story replay determinism (`scripts/debug/story-replay.mjs`, "deterministic replays are part of the product" per CLAUDE.md). Distinct from ISSUE-007 (cosmetic animations inside story battles) — fixing that does not fix this: this vector is entire *non-story* battles consuming the stream, so a replay of a run whose player ever detoured into Quick Battle/Gauntlet diverges.

**Fix sketch**: Gate the patch on being inside a story battle (`state.mode === 'story'` or an explicit "story battle live" flag) rather than `sm.active`, or snapshot/restore `sm._strngState` around non-story battles.

**Verification**: Re-run the repro; `sm._strngState` must be unchanged after a `mode='pve'` turn with `sm.active=true`.

---
severity: P3
category: bug
anchor_symbol: aiSelectScoredMove
current_line_hint: ~22774
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 53800916f440
confidence: high
status: open
---

**Title**: aiSelectScoredMove picks window.storyRngNext unconditionally — consumes story stream even when sm.active=false

**Evidence**:
```js
// battle.html ~22774 — existence check only, unlike storyAwareRng() (which gates on s.active):
const rng = (typeof window.storyRngNext === 'function') ? window.storyRngNext : Math.random;
// storyRngNext's own guard is only `sm.runSeed == null` — sm.active is NOT checked inside.
```

**Repro**: `node scripts/debug/_repro/story-rng-crossmode-leak.mjs` (Case 2) — with `sm.active=false` but `sm.runSeed` set (abandoned/backgrounded run), calling `aiSelectScoredMove([...], {temp:0})` advanced `sm._strngState` 763103371 → 3434464366.

**Blast radius**: Every AI move selection in Quick Battle/Gauntlet while any `runSeed` lingers in `sm`; sibling of the P2 global-patch finding but needs its own fix because it bypasses even the `sm.active` gate.

**Fix sketch**: Use the existing `storyAwareRng()` selector (already the pattern at the confusion/thaw/trap/Harvest sites) instead of raw `window.storyRngNext`.

**Verification**: With `sm.active=false, runSeed!=null`, `aiSelectScoredMove` must not mutate `sm._strngState`.

---
severity: P4
category: bug
anchor_symbol: startBattle
current_line_hint: ~19519
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 3ecfde3cc984
confidence: high
status: open
---

**Title**: VERIFIED OK — 6-key pSide/fSide in online-PvP initializers (18760/18820) is latent-only, no in-battle bug

**Evidence**:
```js
// battle.html:18760/18820 (PvP create/join) init pSide/fSide with only 6 keys, BUT:
// battle.html:19519 — startBattle() (host path, fired at draft-complete ~18874) resets to 13 keys:
state.pSide = { stealthRock:false, toxicSpikes:0, spikes:0, reflect:0, lightScreen:0, auroraVeil:0, wishHp:0, wishTurns:0, safeguard:0, mist:0, stickyWeb:false, tailwind:0, luckychant:0 };
// online-pvp.js:200 — guest replaces its sides with the host's 13-key clone before any combat:
state.pSide = o.pSide; state.fSide = o.fSide;
```

**Repro**: Traced both PvP battle entries: host draft-complete → `await startBattle()` (13-key reset before first turn); guest → `guestApplyBattleStart` → `applyBattleSnapshot` (host's 13-key `deepClone`). Additionally, every read of the 7 missing keys (auroraVeil/wishHp/wishTurns/safeguard/mist/tailwind/luckychant) is guarded (`> 0` comparisons or `|0` coercion — e.g. 20558-20560, 23729, 23752, 28549), so `undefined` behaves as 0 even if a 6-key object ever reached combat. tests/helpers/load-engine.js reset() uses the 6-key literal for all harness battles and the full suite passes.

**Blast radius**: None today. Risk is future drift only: a new side-key consumer doing unguarded arithmetic (`side.x--` then `=== 0`) would NaN on the 6-key objects during the draft phase. Consolidation is already tracked as ISSUE-054.

**Fix sketch**: None needed behaviorally; the ISSUE-054 single-factory refactor removes the latent divergence.

**Verification**: n/a (documents Wave-2 investigation requested for ISSUE-054's behavioral consequences).

---
severity: P4
category: bug
anchor_symbol: storyAwareRng
current_line_hint: ~29900
file: battle.html
agents: [battle-engine-debugger]
fingerprint: cd63a87a82dc
confidence: high
status: open
---

**Title**: VERIFIED OK — all 5 previously-flagged bare-Math.random battle sites now route through seeded RNG

**Evidence**:
```js
// ice thaw ~29914:      const _thawRng = storyAwareRng(); if (_thawRng() < 0.2) ...
// confusion ~29943:     const _confSelfRng = storyAwareRng(); ... (_confSelfRng() < 0.3333)
// partial trap ~30841:  const _trapRng = storyAwareRng(); defender.volatile.partialTrap = 4 + Math.floor(_trapRng() * 2);
//   (+ G-Max Centiferno sibling ~28598 uses storyAwareRng() too)
// harvest ~32393:       const _harvestRng = storyAwareRng(); if (_harvestRng() < _harvestChance ...)
// rival intro secondary: uses seeded _storySideRng (already recorded as ISSUE-149)
```

**Repro**: `node scripts/debug/_repro/p3-order-determinism.mjs` — 5-turn Thunderbolt-vs-Confuse-Ray transcript (confusion checks, secondaries, damage rolls) is byte-identical across two runs at seed 777; speed-tie order is seeded and stable. Also spot-verified: burn halves physical only (66→33) and not special (22→22), Guts negates (100), STAB exactly 1.5× once (75/50), immunity → 0 damage, Trick Room inverts within-bracket order, `aiEstimateDmg` returns 0 for type-immune targets (EQ vs Flying, Tbolt vs Ground).

**Blast radius**: Closes the Wave-1 RNG-seeding checklist for the battle loop; remaining known residue is ISSUE-178 (three routing mechanisms coexist) and the two NEW cross-mode findings above.

**Fix sketch**: None — verification record.

**Verification**: n/a.

