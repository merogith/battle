---
agent: tutor-overhaul-session
date: 2026-07-04T17:00:00Z
severity: P3
category: test-infra
fingerprint: tutor-overhaul-deferred-and-preexisting-20260704
anchors:
  - tests/suites/battle-hit-impact.test.js:32
  - tests/suites/camp-microgames-30.test.js:1
  - tests/helpers/load-engine.js:148
status: fixed
---

# Move-tutor overhaul PR — deferred items + pre-existing failures found in the full-suite run

Filed at the end of the move-tutor overhaul PR (branch
`claude/move-tutor-overhaul-81mlyr`); items 1–2 **FIXED in the same PR**
(follow-up commit). Post-fix battery: 1203/1203 pass with a clean exit and
NO --test-force-exit needed.

## 1. FIXED — battle-hit-impact.test.js #2 stale regex (was P3, pre-existing)

The guard's regex demanded the exact two-field call shape
`_applyHitImpact({ effectiveness: typeEff, crit: … })`, but both call sites
later grew `isPlayerTarget`/`type` fields for the FX layer, so the regex
matched zero call sites. The guard's INTENT (both damage paths route through
the shared dispatcher) was never violated — regex loosened to tolerate extra
fields after `crit:`. 8/8 green.

## 2. FIXED — camp-microgames-30 hang without --test-force-exit (was P3, pre-existing)

Root cause: the jsdom harness shimmed `requestAnimationFrame` onto **Node's**
global `setTimeout` (tests/helpers/load-engine.js:148), so a self-rescheduling
RAF loop (the countdown test chains into a live microgame render loop that
never receives input) survived `window.close()` and kept `node --test` alive
forever. Fixes:
- load-engine RAF shim now routes through `window.setTimeout` (jsdom-owned,
  torn down on close) — the root fix, protects every suite;
- camp-microgames-30 got an `after(() => W.close())` hook (defense-in-depth);
- `--test-force-exit` added to test:suites / test:moves / test:integration /
  test:property npm scripts (parity with the canonical `npm test`).

## 3. DEFERRED by design from the overhaul (still open; see docs/MOVE_TUTOR_OVERHAUL_PLAN.md)

- **P-3 grid virtualization**: "★ Show all" renders the full legal movepool
  (150–250 cards) in one pass per open mon. Memo caches keep it acceptable;
  revisit only if low-end phone profiling shows jank.
- **Per-form learnset resolution**: `_tutorSpeciesKeysForLearnset` unions a
  regional form's learnset with its base form's (can over-offer, never
  under-offers). Long-term fix is @pkmn/dex per-form resolution.
