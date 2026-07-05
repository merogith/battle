---
severity: P3
category: test-gap
anchor_symbol: generate-move-tests
current_line_hint: ~65
file: tests/audit/generate-move-tests.js
agents: [test-coverage-filler]
fingerprint: 288c20292150
confidence: high
status: open
---

**Title**: Wave-2 TODO re-enumeration: 35 stubs remain (not 351); 7 are obsolete duplicates of manual/ coverage

**Evidence**:
```text
grep -cE "^\s*it\.todo\(" tests/moves/by-category/*.test.js
  status.test.js: 35   special.test.js: 0   physical.test.js: 0
File headers still read "TODO (manual fill-in required): 210 / 75 / 67" (=352) but
those counts include the 175/75/67 moves now covered by pointer comments
("covered by a manual test (see by-category/manual/)") -> misleading header label.
```

**Repro**: `grep -nE "it\.todo\(" tests/moves/by-category/{status,special,physical}.test.js` on HEAD (6fd838d).

## Research: current TODO enumeration + setup-shape clusters

The "~351 todos" figure in the Wave-2 brief is the *generation-time* count baked into
the file headers. The Wave-1 fill pass (handoff docs 01–03) already converted the
physical/special todos and ~175 status todos into 26 promoted files under
`tests/moves/by-category/manual/` (306 tests). What remains on HEAD is exactly the
generator's `DEFERRED` set: **35 `it.todo` stubs, all in `status.test.js`**.

### Cluster breakdown (by setup shape, ordered cheapest -> most expensive)

| # | Cluster id | Setup shape | Count | Members | Effort |
|---|-----------|-------------|-------|---------|--------|
| 1 | `covered-elsewhere-obsolete` | none — real tests already exist in `manual/` | 7 | Crafty Shield, Mat Block, Powder, Electrify, Nightmare, Laser Focus (all in `manual/unimplemented-six.test.js`, implemented Wave-2 Batch-2), Decorate (`manual/fidelity-high-fixes.test.js`) | Trivial: move these 7 out of the generator's DEFERRED "unimplemented" comment block into manual-covered set + regenerate. No new tests. |
| 2 | `field-flag-single-turn` | use move, assert field/volatile flag in 1v1 harness (work on HEAD per ISSUE-139 re-verify) | 3 | Ion Deluge, Fairy Lock, Dark Void (assert species gate: correctly fails for non-Darkrai; optionally sleeps from Darkrai) | Low: 1 turn each, direct state assert |
| 3 | `item-swap-precondition` | give both mons held items, run turn, assert bidirectional swap (engine fix landed: ledger "Trick / Switcheroo swap one-directional" = fixed-main) | 2 | Trick, Switcheroo | Low |
| 4 | `prior-move-context` | foe uses a move turn 1, user's move turn 2 references it | 1 | Disable (assert foe's last move is disabled / unusable) | Low-medium: 2-turn `window.playTurn` choreography |
| 5 | `consumed-item-precondition` | user holds a berry, drops below trigger HP so it is eaten, later turn restores it | 1 | Recycle | Medium: multi-turn HP choreography (template: `manual/misc-status.test.js`) |
| 6 | `faint-switch-heal` | 2-mon party; user faints via own move; assert incoming switch-in fully healed (+PP for Lunar Dance); unblocked by the Parting Shot `state.pTeam`->`state.playerParty` fix | 2 | Healing Wish, Lunar Dance | Medium: party + forced-switch choreography (template: `manual/switch-pivot.test.js`) |
| 7 | `ally-target-doubles` | needs an ally slot — no observable effect in the 1v1 harness | 16 | Heal Pulse, Floral Healing, After You, Ally Switch, Aromatic Mist, Coaching, Dragon Cheer, Flower Shield, Follow Me, Gear Up, Helping Hand, Magnetic Flux, Quash, Rage Powder, Rototiller, Spotlight | Blocked: requires a doubles harness (out of active scope — Story is 1v1) or a maintainer decision to retitle as permanent `[doubles-only]` todos per handoff 03 Bucket C |
| 8 | `banned-unreachable` | moves banned / not story-reachable and intentionally unimplemented (ISSUE-139) | 3 | Corrosive Gas, Venom Drench, Doodle | Decision-only: leave as permanent todos or drop from the generated skeleton; no test value until implemented |

Totals: 35 stubs = 7 obsolete + 7 fillable-now (clusters 2–4) + 3 medium choreography (5–6) + 16 doubles-blocked + 3 banned. Realistic fill ceiling without a doubles harness or maintainer decisions: **10 stubs** (clusters 2–6), one fix-mode invocation.

### Obsolete / stale items (no test work needed)

1. The 7 `covered-elsewhere-obsolete` stubs above — behavior already asserted in `manual/`; the DEFERRED comment "unimplemented (no handler)" in `tests/audit/generate-move-tests.js:~66` is stale post-Batch-2.
2. Header comment "TODO (manual fill-in required): N" in all three generated files counts manual-covered moves too; relabel on next regeneration.
3. ISSUE-139's "STILL UNIMPLEMENTED (Tier 3)" list (Crafty Shield, Mat Block, Powder, Electrify, Nightmare, Laser Focus) is stale for the same reason — those six now have handlers + regression tests; the finding can be narrowed to the banned trio.

### Recommended execution order (fix mode)

1. Cluster 1 (generator hygiene, regenerate, -7 todos)
2. Clusters 2+3+4 in one draft file (-6)
3. Clusters 5+6 in one draft file (-3)
4. Clusters 7+8: present the Bucket-C decision to the maintainer (retitle vs doubles harness); encode outcome in the generator so the remaining todos are self-documenting.

**Blast radius**: test suite only; no game behavior. Stale DEFERRED/ISSUE-139 text risks a future agent re-investigating already-fixed moves.

**Fix sketch**: Update the generator's DEFERRED set + header label, regenerate the three files, then fill clusters 2–6 as drafts; put the doubles-only/banned decision to the maintainer.

**Verification**: `node --test --test-concurrency=4 'tests/moves/**/*.test.js'` -> 0 fail, and `# todo` reflects only the agreed doubles-only/banned set (~19) or fewer.
