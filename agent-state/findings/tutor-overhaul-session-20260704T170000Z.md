---
agent: tutor-overhaul-session
date: 2026-07-04T17:00:00Z
severity: P3
category: test-infra
fingerprint: tutor-overhaul-deferred-and-preexisting-20260704
anchors:
  - tests/suites/battle-hit-impact.test.js:32
  - tests/suites/camp-microgames-30.test.js:1
  - battle.html (tx-grid render, _tutorSpeciesKeysForLearnset)
status: open
---

# Move-tutor overhaul PR — deferred items + pre-existing failures found in the full-suite run

Filed at the end of the move-tutor overhaul PR (branch
`claude/move-tutor-overhaul-81mlyr`). Full suites battery: 1203 tests,
1202 pass. Everything below is **verified unrelated** to the overhaul
(reproduced identically at pre-overhaul commit b1d435f).

## 1. PRE-EXISTING test failure: battle-hit-impact.test.js #2 (P3)

`both damage paths route impact through _applyHitImpact (single + multi hit)`
fails on the branch base (current main): the source regex
`await _applyHitImpact\(\{ effectiveness: typeEff, crit: (?:crit > 1|_anyHitCrit) \}\)`
expects ≥2 matches in battle.html and finds fewer. Either a damage-path
telegraph changed shape (regex needs updating) or a call site was dropped —
needs a look at the single/multi-hit telegraph code, not the tutor.

## 2. PRE-EXISTING hang: camp-microgames-30.test.js without --test-force-exit (P3)

`node --test tests/suites/camp-microgames-30.test.js` never exits (leaked
timer/handle) — reproduced at b1d435f. The canonical `npm test` script masks
it via `--test-force-exit`, but `npm run test:suites` lacks the flag and hangs
forever. Fix: add `--test-force-exit` to test:suites (and test:moves /
test:integration for symmetry) or close the leaked handle in the camp suite.

## 3. DEFERRED by design from the overhaul (see docs/MOVE_TUTOR_OVERHAUL_PLAN.md)

- **P-3 grid virtualization**: "★ Show all" renders the full legal movepool
  (150–250 cards) in one pass per open mon. Memo caches keep it acceptable;
  revisit only if low-end phone profiling shows jank.
- **Per-form learnset resolution**: `_tutorSpeciesKeysForLearnset` unions a
  regional form's learnset with its base form's (can over-offer, never
  under-offers). Long-term fix is @pkmn/dex per-form resolution.
