---
name: repro-battle
description: Boots the jsdom engine, seeds the mulberry32 RNG, and runs a deterministic battle scenario. Use to construct a minimal repro for a battle-engine finding before quoting it in the ledger.
---

# repro-battle

## When to use

- You found a suspect code path in `battle.html` and want to confirm it actually misbehaves at runtime.
- You're filing a P0/P1 finding and need a concrete repro recipe.
- You're verifying that a fix didn't regress an adjacent move/ability/status.

## Pattern: minimal repro script

Drop a one-off script under `scripts/debug/_repro/` (gitignored — these are throwaways). Example skeleton:

```js
// scripts/debug/_repro/confusion-rng-drift.mjs
import { loadEngine } from '../../../tests/helpers/load-engine.js';

const harness = await loadEngine();
harness.seedRng(12345);

const player = harness.mkMon('Pikachu', { level: 50, moves: ['thunderbolt'] });
const foe = harness.mkMon('Snorlax', { level: 50, moves: ['confuseray', 'tackle'] });

// Force foe to confuse player
const turn1 = harness.runTurn({ playerMon: player, foeMon: foe, playerMove: 'thunderbolt', foeMove: 'confuseray' });
console.log('Turn 1 logs:', harness.logs.slice(-5));

// Now hit confusion check — this is where Math.random() drifts from the seeded RNG
const turn2 = harness.runTurn({ playerMon: player, foeMon: foe, playerMove: 'thunderbolt', foeMove: 'tackle' });
console.log('Turn 2 confusion outcome:', turn2);
console.log('Same seed, second run should match — drift indicates a bare Math.random site.');
```

Run with `node scripts/debug/_repro/<file>.mjs` from the repo root.

## Pattern: assert determinism

Run the same scenario twice; logs must match. If they don't, an unsynced `Math.random()` is in the codepath.

```js
async function runOnce(seed) {
  const h = await loadEngine();
  h.seedRng(seed);
  const p = h.mkMon('Pikachu', { level: 50, moves: ['thunderbolt'] });
  const f = h.mkMon('Snorlax', { level: 50, moves: ['confuseray'] });
  for (let i = 0; i < 5; i++) h.runTurn({ playerMon: p, foeMon: f, playerMove: 'thunderbolt', foeMove: 'confuseray' });
  return h.logs.join('\n');
}

const a = await runOnce(12345);
const b = await runOnce(12345);
console.log('Deterministic:', a === b);
```

## Output contract

In the `Repro` field of a finding, paste either:
- A one-line `node scripts/debug/_repro/<file>.mjs` command + a 2-line summary of what to look for in output
- Or a scenario spec: species, moves, seed, expected behavior, observed behavior

Do not commit `scripts/debug/_repro/` scripts — those are session-scoped scratch space.
