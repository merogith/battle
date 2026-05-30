---
severity: P2
category: test-gap
anchor_symbol: describe('Status moves')
file: tests/moves/by-category/status.test.js
agents: [test-coverage-filler]
fingerprint: 187e8bbb9b4b
confidence: high
status: open
---

**Title**: 351 it.todo() move tests cluster into 31 setup-shapes; 9 clusters retire 70% of the gap

**Evidence**:
```text
status.test.js   210 todo   special.test.js  74 todo   physical.test.js  67 todo   TOTAL 351
Verified: grep -cE "it\.todo\(" on each file. Every TODO move resolved in data/moves.json (0 not-found).
Harness primitives confirmed live: mon.stages{atk..eva}, mon.status (slp/par/brn/psn/tox),
mon.currentHp/maxHp, mon.volatile{confusion,taunt,leechSeed,aquaRing,stockpile,perishCount,...},
state.weather, state.trickRoom, state.pSide/fSide{reflect,lightScreen,spikes,...}. Seed 0 forces
secondary effects (Power-Up Punch -> atk +1). Spread (allAdjacentFoes) moves hit the lone foe and drop HP.
```

**Repro**: `for f in tests/moves/by-category/{status,special,physical}.test.js; do grep -cE "it\.todo\(" $f; done` -> 210, 74, 67. Probe harness with `node --test` against `tests/helpers/load-engine.js` (mkMon/runTurn).

**Blast radius**: Move-coverage confidence. 516 of 867 generated tests already auto-assert; these 351 are the long tail of preconditioned mechanics. Clustering by setup-shape (not by file/category) lets one harness primitive retire a whole batch.

**Fix sketch**: Convert clusters in cheapest-first order. The full setup-shape taxonomy table (cluster id, count, representative moves, shared harness setup, effort/value) is below. Orchestrator drives `/fix-todo-test <cluster-id>` one cluster per invocation, writing to `tests/moves/by-category/_drafts/<id>.test.js` (never editing the generated files).

**Verification**: After each cluster draft, `node --test tests/moves/by-category/_drafts/<id>.test.js` must pass; a failing assertion is a candidate engine bug, not a bad test.


## Setup-shape cluster taxonomy (all 351 TODOs, 31 clusters)

Effort = harness work to build the precondition + assert. Value = TODOs retired per unit effort.

| Cluster id | Count | Files | Shared harness setup | Assert | Effort | Value |
|---|---|---|---|---|---|---|
| spread-damaging | 66 | sp:50 ph:17 (subset of spread-target) | none (spread move hits lone foe in singles); seed 0 for secondaries | defender.currentHp dropped; + secondary status/boost/volatile where declared | LOW | **HIGHEST** |
| status-volatile | 46 | st:46 | runTurn the move | target/self mon.volatile.<flag> set (confusion, taunt, leechSeed, protect, aquaRing, stockpile, perishCount, ingrain, magnetRise, encore, disable, focusEnergy, destinyBond...) | LOW | **HIGH** |
| variable-power-conditional | 28 | sp:5 ph:23 | build precondition (weight/speed ratio, user burned/asleep, prior turn, HP%) then compare BP/damage | damage scales with condition (Low Kick/Gyro Ball/Heavy Slam by weight; Facade x2 when brn; Reversal/Flail at low HP; Return/Frustration friendship; Fake Out/First Impression turn 1) | MED-HIGH | MED |
| self-heal | 18 | st:18 | pre-damage the user (set currentHp < maxHp), runTurn | user.currentHp increases toward maxHp (Recover/Roost/Wish/Synthesis weather-scaled/Rest -> slp+full) | LOW-MED | **HIGH** |
| charge | 17 | st:1 sp:5 ph:11 | run turn 1 (charge), assert mon.volatile.charging set; turn 2 deals damage (Power Herb / seed for skip) | turn1 no damage + charging flag; turn2 HP drop (Solar Beam, Fly, Dig, Phantom Force, Sky Drop...) | MED | MED |
| side-condition | 15 | st:15 | runTurn the move | state.pSide/fSide flag set (reflect, lightScreen, auroraVeil, safeguard, mist, tailwind, lightScreen turns; Quick/Wide/Crafty/Mat protect-side) | LOW | **HIGH** |
| field-effect | 14 | st:14 | runTurn the move | state.<field> set (trickRoom, magicRoom, wonderRoom, gravity; Haze clears stages; Perish Song sets perishCount on all; Mud/Water Sport) | LOW-MED | MED |
| ally-target | 12 | st:12 | SKIP in singles harness (target adjacentAlly/allies/adjacentAllyOrSelf) | leave as todo OR assert no-op/self path (Howl self atk+1; Helping Hand needs doubles) | (skip) | LOW |
| move-copy-call | 12 | st:12 | give user the copy move + a known move to copy; runTurn | called move's effect fires (Metronome/Assist/Copycat/Sleep Talk/Mirror Move/Mimic/Sketch); some need 2 actors | HIGH | LOW |
| status-infliction | 12 | st:12 | runTurn on healthy foe (seed 0 to land accuracy) | defender.status === expected (Toxic->TOX, Thunder Wave->par, Will-O-Wisp->brn, Spore/Sleep Powder/Hypnosis->slp, Poison Powder->psn) | LOW | **HIGH** |
| fixed-damage | 10 | sp:7 ph:3 | runTurn; compute expected | exact HP loss (Dragon Rage=40, Sonic Boom=20, Night Shade/Seismic Toss=level, Super Fang=half, Psywave var, Endeavor->match, Final Gambit->user HP) | LOW-MED | MED |
| stat-swap-copy | 9 | st:9 | pre-set attacker/defender stages, runTurn | stages/stats swapped or copied (Psych Up copies foe stages; Power/Guard Swap; Heart Swap; Speed Swap; Topsy-Turvy inverts; Pain Split averages HP) | MED | MED |
| type-change | 8 | st:8 | runTurn | mon.type1/type2 changed (Soak->Water, Conversion->move type, Camouflage->terrain, Forest's Curse/Trick-or-Treat add type, Reflect Type) | LOW-MED | MED |
| ability-manipulation | 8 | st:8 | give defender a known ability, runTurn | mon.ability changed (Skill Swap exchanges, Role Play copies, Worry Seed->Insomnia, Simple Beam->Simple, Entrainment, Gastro Acid suppresses, Doodle) | MED | LOW |
| item-manipulation | 8 | st:5 ph:2,sp | give items, runTurn | mon.item moved/removed (Trick/Switcheroo swap, Bestow gives, Recycle restores, Fling throws+effect, Natural Gift type from berry, Stuff Cheeks) | MED | LOW |
| weather-set | 6 | st:6 | runTurn | state.weather === expected + weatherTurns (Rain Dance, Sunny Day, Sandstorm, Hail, Snowscape, Chilly Reception switches) | LOW | **HIGH** |
| switch-pivot | 5 | st:5 | needs >1 party mon to observe switch | tricky in singles; Teleport/Parting Shot pivot, Baton Pass carries stages, Healing/Lunar/Revival need bench | HIGH | LOW |
| counter-like | 5 | sp:1 ph:4 | foe must hit user first (priority/order), then move returns damage | Counter=2x phys taken, Mirror Coat=2x spec, Metal Burst/Comeuppance=1.5x, Bide stores 2 turns | HIGH | LOW |
| terrain-set | 4 | st:4 | runTurn | state terrain field set (Electric/Grassy/Misty/Psychic Terrain) | LOW | MED |
| hazard-set | 4 | st:4 | runTurn | state.fSide flag/count (spikes, toxicSpikes layers, stealthRock, stickyWeb) | LOW | MED |
| signature-ohko | 4 | sp:1 ph:3 | runTurn with seed forcing accuracy roll | defender.currentHp === 0 (Sheer Cold, Fissure, Horn Drill, Guillotine) | LOW-MED | MED |
| trapping | 3 | st:3 | runTurn | defender.volatile.partialTrap/trapped set (Mean Look, Block, Spider Web) | LOW | MED |
| turn-order | 2 | st:2 | needs doubles to observe (After You, Quash) | skip in singles | (skip) | LOW |
| hazard-clear | 2 | st:2 | pre-set hazards on side, runTurn | hazards cleared (Defog also drops screens; Tidy Up clears+boosts) | LOW-MED | MED |
| transform-form | 2 | st:2 | runTurn (Transform copies foe; Psycho Shift moves user status to foe) | user stats/moves/type match foe (Transform); foe gains user's status (Psycho Shift) | MED | LOW |
| force-switch | 2 | st:2 | needs foe bench to observe forced switch (Roar, Whirlwind) | tricky in singles; assert log/fail-on-single | MED | LOW |
| self-type-removal | 2 | sp:1 ph:1 | user must be the move's type; runTurn | user loses that type after (Burn Up removes Fire, Double Shock removes Electric) + deals damage | MED | LOW |
| delayed-damage | 2 | sp:2 | runTurn turn 1 (no immediate dmg), advance 2 turns | damage lands turn 3 (Future Sight, Doom Desire) via state.fSide futureSight | MED | LOW |
| damaging-special-handling | 2 | ph:2 | set terrain then runTurn | Ice Spinner/Steel Roller remove terrain + deal damage | MED | LOW |
| status-boost-misc | 1 | st:1 | doubles ally-target (Decorate +2 atk/+2 spa to ally) | skip in singles | (skip) | LOW |
| secondary-volatile | 1 | sp:1 | Snore needs user asleep | user.status=slp, runTurn, foe HP drop + flinch chance | MED | LOW |

### Recommended execution order (cheapest setup -> most expensive)

1. **spread-damaging (66)** — zero precondition; reuse the existing damaging-move template.
2. **status-volatile (46)** — single runTurn, assert one `mon.volatile.<flag>`.
3. **status-infliction (12) + side-condition (15) + weather-set (6) + terrain-set (4) + hazard-set (4)** — all single-runTurn state assertions; batch as one "single-turn-state" pass (41) but split to respect the 25-40 limit (e.g. side+weather+terrain+hazard = 29; status-infliction separate).
4. **self-heal (18)** — one extra setup line (pre-damage user).
5. **fixed-damage (10) + signature-ohko (4) + trapping (3) + hazard-clear (2)** — exact-value / pre-state asserts.
6. **type-change (8) + stat-swap-copy (9) + field-effect (14)** — moderate state setup.
7. **charge (17)** — two-turn sequencing.
8. **variable-power-conditional (28)** — per-move precondition tuning; split into 2 batches.
9. **counter-like (5) + delayed-damage (2) + transform-form (2) + move-copy-call (12) + ability/item-manipulation (16)** — multi-actor / multi-turn; lowest value.
10. **SKIP clusters (doubles-only): ally-target (12), turn-order (2), force-switch (2), switch-pivot (5), status-boost-misc Decorate (1)** — singles harness cannot construct the precondition; leave as todo per the anti-pattern rule rather than write placeholder assertions.

Net: clusters 1-3 retire **143 TODOs (41%)** with near-zero new harness machinery. Adding self-heal + step-5 reaches **180 (51%)**. ~22 TODOs are honestly unbuildable in a singles harness and should stay todo.

---
severity: P3
category: test-gap
anchor_symbol: spread-damaging
file: tests/moves/by-category/special.test.js
agents: [test-coverage-filler]
fingerprint: adc6cc9a5517
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: 66 allAdjacentFoes damaging moves are it.todo but assertable as plain HP-drop in singles

**Evidence**:
```js
// generate-move-tests.js marks target:'allAdjacentFoes'/'allAdjacent' as todo (needs doubles),
// but the singles harness applies the move to the single foe and HP drops:
await runTurn({ playerMon: atk, foeMon: def }); // Earthquake: def.currentHp 145 -> 115
assert.ok(def.currentHp < before); // passes today
```

**Repro**: Probe harness ran Earthquake (spread Ground move) in singles: defender HP fell 145->115. 32 of these 66 also have a declared `secondary` (14 status, 12 boost, 4 volatile) that fires with seed 0.

**Blast radius**: Largest single cluster (66/351). Examples: Surf, Blizzard, Heat Wave, Hyper Voice, Rock Slide, Earthquake, Explosion, Discharge (par), Lava Plume (brn), Muddy Water, Sludge Wave (psn), Bulldoze (spe drop).

**Fix sketch**: `/fix-todo-test spread-damaging` -> draft asserting defender HP drop for all 66, plus secondary status/boost/volatile assertion (seed 0) for the 32 that declare one. Spread mechanics (0.75x in doubles) are NOT assertable in singles — note that limitation, don't fake it.

**Verification**: `node --test tests/moves/by-category/_drafts/spread-damaging.test.js` all green.

---
severity: P3
category: test-gap
anchor_symbol: status-volatile
file: tests/moves/by-category/status.test.js
agents: [test-coverage-filler]
fingerprint: 9ea53f271f71
confidence: high
status: open
---

**Title**: 46 volatile-status moves are it.todo but assert with one mon.volatile flag check

**Evidence**:
```js
// Confuse Ray probe:
await runTurn({ playerMon: atk, foeMon: def });
// def.volatile.confusion === 1  (and taunt, leechSeed, aquaRing, stockpile, protect,
// perishCount, ingrain, encore, disable, focusEnergy, destinyBond all live on mon.volatile)
```

**Repro**: Probe set Confuse Ray -> `def.volatile.confusion === 1`. `mon.volatile` exposes ~80 flags covering this entire cluster.

**Blast radius**: 46 status moves: Confuse Ray, Taunt, Leech Seed, Substitute, Protect/Detect/King's Shield/Spiky Shield/Baneful Bunker/Obstruct/Silk Trap/Burning Bulwark, Encore, Disable, Aqua Ring, Ingrain, Magnet Rise, Stockpile, Focus Energy, Destiny Bond, Yawn, Torment, Embargo, Foresight, Nightmare, Endure, Follow Me/Rage Powder/Spotlight, etc.

**Fix sketch**: `/fix-todo-test status-volatile` -> draft mapping each move to its expected `mon.volatile.<flag>` (target vs self). Protect-family: assert the volatile is set after use AND that a follow-up move is blocked. Yawn/Nightmare/Leech Seed: assert the flag; defer multi-turn tick to a separate pass.

**Verification**: `node --test tests/moves/by-category/_drafts/status-volatile.test.js` all green.

---
severity: P3
category: test-gap
anchor_symbol: variable-power-conditional
file: tests/moves/by-category/physical.test.js
agents: [test-coverage-filler]
fingerprint: 668afcfbc625
confidence: medium
status: fixed-claude/focused-cori-sGNzn (damage-dealing subset auto-asserted; OHKO + Endeavor/Final Gambit stay manual by design)
---

**Title**: 28 conditional-BP moves need per-move precondition tuning before damage assertion

**Evidence**:
```text
Low Kick/Grass Knot -> defender weight; Heat Crash/Heavy Slam -> weight ratio;
Gyro Ball/Electro Ball -> speed ratio; Facade -> 2x when user brn/par/psn;
Reversal/Flail -> user HP%; Return/Frustration -> friendship; Fake Out/First
Impression -> only turn 1; Sucker Punch/Upper Hand -> foe must attack.
```

**Repro**: data/moves.json declares no fixed basePower for these (`basePowerCallback`); damage must be compared against a constructed condition rather than asserted as a constant.

**Blast radius**: 28 moves split sp:5 / ph:23. Highest-effort damaging cluster; several preconditions (turn-1 Fake Out, foe-attacks Sucker Punch) overlap counter-like setup.

**Fix sketch**: Split into two `/fix-todo-test` batches (weight/speed-scaled vs status/HP/turn-scaled). For each, build two scenarios bracketing the condition and assert damage ordering (low vs high), not absolute BP. Leave any move whose condition can't be built in singles as todo.

**Verification**: `node --test tests/moves/by-category/_drafts/variable-power-conditional-*.test.js` green; assertions compare relative damage across the two bracketed scenarios.

