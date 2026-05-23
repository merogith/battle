---
severity: P2
category: test-gap
anchor_symbol: tests/moves/by-category
current_line_hint: ~30
file: tests/moves/by-category/status.test.js
agents: [test-coverage-filler]
fingerprint: fca6be0da22a
confidence: high
status: open
---

**Title**: 351 it.todo() stubs across 3 move-category test files — cluster enumeration

**Evidence**:

```
File counts (confirmed via grep -nE "^\s*it\.todo\("):
  tests/moves/by-category/status.test.js   = 210 TODOs
  tests/moves/by-category/special.test.js  =  74 TODOs
  tests/moves/by-category/physical.test.js =  67 TODOs
  TOTAL                                    = 351 TODOs

Cluster taxonomy (42 buckets; setup-shape, not move-category):

| cluster id | count | example moves (first 3) |
|---|---|---|
| noop-flavor | 2 | Celebrate, Splash |
| boost-self | 1 | Howl |
| self-boost | 1 | Clanging Scales |
| boost-target | 10 | Aromatic Mist, Captivate, Coaching |
| pure-status-target | 14 | Dark Void, Glare, Grass Whistle |
| pure-volatile-self | 16 | Aqua Ring, Destiny Bond, Focus Energy |
| pure-volatile-foe | 26 | Attract, Confuse Ray, Curse |
| heal | 23 | Floral Healing, Heal Order, Heal Pulse |
| field-side-condition | 15 | Aurora Veil, Crafty Shield, Light Screen |
| field-terrain | 4 | Electric Terrain, Grassy Terrain, Misty Terrain |
| weather-set | 6 | Chilly Reception, Hail, Rain Dance |
| field-pseudo-weather | 8 | Fairy Lock, Gravity, Ion Deluge |
| field-clear | 4 | Court Change, Defog, Haze |
| secondary-status | 13 | Blizzard, Discharge, Heat Wave |
| secondary-boost | 12 | Acid, Bleakwind Storm, Bubble |
| secondary-volatile | 7 | Fiery Wrath, Snore, Sparkling Aria |
| damage-plain | 14 | Burn Up, Doom Desire, Future Sight |
| drain | 2 | Matcha Gotcha, Parabolic Charge |
| fixed-damage | 5 | Dragon Rage, Night Shade, Psywave |
| fractional-hp-damage | 4 | Natures Madness, Ruination, Endeavor |
| variable-power | 22 | Electro Ball, Grass Knot, Pika Papow |
| signature-ohko | 4 | Sheer Cold, Fissure, Guillotine |
| protect-like | 11 | Baneful Bunker, Burning Bulwark, Detect |
| counter-like | 4 | Mirror Coat, Comeuppance, Counter |
| lock-on | 2 | Lock-On, Mind Reader |
| self-effect-special | 4 | Belly Drum, Refresh, Stuff Cheeks |
| pp-reduction | 1 | Spite |
| status-transfer | 1 | Psycho Shift |
| boost-copy-flip | 4 | Flower Shield, Psych Up, Rototiller |
| stat-swap-split | 7 | Guard Split, Guard Swap, Heart Swap |
| ability-manipulation | 6 | Doodle, Entrainment, Role Play |
| type-change | 8 | Camouflage, Conversion, Conversion 2 |
| force-switch-or-trap | 5 | Block, Mean Look, Roar |
| item-manipulation | 4 | Bestow, Recycle, Switcheroo |
| perish-song | 1 | Perish Song |
| final-gambit | 1 | Final Gambit |
| turn-order-helper | 4 | After You, Ally Switch, Quash |
| pivot-or-faint-helper | 3 | Baton Pass, Parting Shot, Teleport |
| meta-move | 10 | Assist, Copycat, Instruct |
| misc-truly-unclassified | 1 | Transform |
| charge | 17 | Electro Shot, Ice Burn, Meteor Beam |
| ally-or-spread-target | 44 | Air Cutter, Astral Barrage, Boomburst |
| SUM | 351 | (reconciled against grep count) |
```

```
NOTE: zero TODOs needed multihit/recoil bucketing — the auto-generator
already filled those. The TODO surface is dominated by:
  - Utility/status moves (volatile + side-condition + heal):  ~115
  - Spread/ally-target damage (skipped in singles harness):    44
  - Variable-power + condition-dependent damage:               36
  - Signature/transform/meta moves:                            ~50
  - Charge moves needing 2-turn runs:                          17
```

**Repro**: `/fix-todo-test <cluster-id>` per cluster (e.g. `/fix-todo-test pure-status-target`). Each invocation should write to `tests/moves/by-category/_drafts/<cluster-id>.test.js`.

**Blast radius**: tests/moves/by-category/* (do not edit existing files; orchestrator promotes drafts after review). The harness file `tests/helpers/load-engine.js` is consumed by every cluster; if it cannot satisfy doubles/spread targets, the `ally-or-spread-target` cluster (44 moves) should be deferred or skipped.

**Fix sketch**: Execute clusters in cheapest-setup order. Recommended order (cheapest to most expensive):

1. `noop-flavor` (2) — no precondition, assert no state change
2. `boost-self` (1), `boost-target` (10) — single-turn, assert stage delta
3. `pure-status-target` (14) — assert `defender.status === 'slp'|'par'|...`
4. `pure-volatile-self` (16), `pure-volatile-foe` (26) — assert volatile applied to user/foe
5. `heal` (23) — pre-damage user, assert HP restored
6. `weather-set` (6), `field-terrain` (4), `field-side-condition` (15), `field-pseudo-weather` (8), `field-clear` (4) — assert field/side state
7. `secondary-status` (13), `secondary-boost` (12), `secondary-volatile` (7) — assert damage dealt; secondary chance assertions should tolerate RNG (run many trials or pin seed)
8. `damage-plain` (14), `drain` (2), `fixed-damage` (5), `fractional-hp-damage` (4), `signature-ohko` (4) — assert HP threshold
9. `variable-power` (22) — set up scaling variable (HP%, weight, level, friendship, status), assert damage scales
10. `protect-like` (11), `counter-like` (4), `lock-on` (2), `self-effect-special` (4), `pp-reduction` (1), `status-transfer` (1) — two-turn setups
11. `boost-copy-flip` (4), `stat-swap-split` (7), `ability-manipulation` (6), `type-change` (8) — two-pokemon state changes
12. `force-switch-or-trap` (5), `item-manipulation` (4), `perish-song` (1), `final-gambit` (1), `turn-order-helper` (4), `pivot-or-faint-helper` (3), `meta-move` (10), `misc-truly-unclassified` (1) — special-case scaffolding (likely partial coverage)
13. `charge` (17) — two-turn runTurn, assert damage on turn 2
14. `ally-or-spread-target` (44) — **LAST**: singles harness almost certainly cannot drive these; expect to mark `it.skip()` or document as deferred

Batch limit per invocation: 25–40 TODOs. Split larger buckets (`ally-or-spread-target` 44 → 2 batches; `pure-volatile-foe` 26 fits in one; `heal` 23 fits in one; `variable-power` 22 fits in one).

**Verification**: Each `/fix-todo-test <cluster-id>` invocation writes `tests/moves/by-category/_drafts/<cluster-id>.test.js` and runs `node --test` on it. The agent emits a follow-up finding noting per-cluster status (passing / partially-failing / bug-discovered). Final reconciliation: `grep -c "it.todo" tests/moves/by-category/*.test.js` should approach zero after all drafts are promoted by the orchestrator.

