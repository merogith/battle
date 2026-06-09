---
severity: P1
category: balance
anchor_symbol: _storyFillerGradeFloorForRow
current_line_hint: ~38335
file: battle.html
agents: [maintainer-session]
fingerprint: 6611865a3277
confidence: high
status: fixed
---

**Title**: Late-game enemy weak-mon floor + endgame gold over-accumulation (2026-06 balance pass) — IMPLEMENTED

**Evidence**:
```js
// rollTrainerTeam — no FLOOR existed; fallback pickers looped ceiling..G4, so weak
// G3/G4 mons leaked into late gyms / E1-E4 / Champion even when the row weights
// authorize none (live probe: E1 50% weak incl. 16 G4; Champion leaking Kakuna).
// FIX: _storyFillerGradeFloorForRow (G2 from city 6) + _capGradePoolsByGradeFloor
// + ceiling clamps + _evolveSigToGradeFloor for non-boss low sigs.
```

Three maintainer-approved changes shipped this session (Story mode, normal):

1. **Grade FLOOR (Concern 1).** `rollTrainerTeam` enforced a grade *ceiling* (strongest)
   but no *floor* (weakest); `pickThematic` spiral, `pickFromUnionExcluding`,
   `pickRandomInGenWindow` and `enforceTypeBalance`'s candidate pool could all pull G3/G4.
   Added `_storyFillerGradeFloorForRow` (G2 from city 6, else none) + `_capGradePoolsByGradeFloor`
   (empties G3/G4 buckets of the local filler pool, fail-open for narrow type+gen). The sig
   ceiling and `_fillerCeiling` are clamped no-weaker-than the floor. Signatures stay exempt,
   but **non-boss** trainers evolve low sigs up their line (`_evolveSigToGradeFloor`,
   Caterpie→Butterfree); **bosses** keep authored aces. Guard: `tests/suites/story-floor-parity.test.js`.

2. **Pools (Concern 2).** Reviewed; maintainer chose to **leave gen-locked** (narrow pools
   accepted). No code change — the floor's fail-open keeps narrow runs from breaking.

3. **Gold flatten (Concern 3).** Late `STORY_EVENTS_RAW` base coins re-baselined from Gym 5 on
   into a gentle monotonic plateau (GL5 3900 → GL8 4200; E1–E4 3900→4200; Champion 4400;
   Mystery 12000→5000). Peaks shaved hardest; main-path bank ≈ 235k → ~180k. Beat-gold and
   Fight Club derive from row[4] so they taper automatically.

**Verification**: `node --test tests/suites/story-floor-parity.test.js` (5/5); full grade/reward/
curve regression batch green (177 assertions across ceiling-parity, trainer-rolls, trainer-pools,
reward-delivery, build-curve, enemy-stat-mult, difficulty-matrix, evo-stage-gate, dept-pricing,
battle-injection, mf-team-builder, boss-mechanics). Headless `debugBalanceAudit` probe: GL6
84%→0% weak; Champion/E4/GL8 G4 leak closed; gen-1 catastrophic leak (Agatha 78%, GL6 100%) closed.

**Related (NOT addressed this pass — flagged for follow-up)**: late-foe difficulty was silently
flattened in the June `FOE_POWER_CURVE` refactor (maintainer chose flatten-gold-only); casino
still uses bare `Math.random` (ISSUE-008/013/034/035); doc `PROGRESSION_CURVE_MASTER.md` §2c/§2d
were stale (§2c + §2g now refreshed; §2d foe-mult model still historical).
