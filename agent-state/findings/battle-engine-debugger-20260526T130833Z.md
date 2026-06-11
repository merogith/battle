---
severity: P1
category: bug
anchor_symbol: canMove
current_line_hint: ~25408
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 1a2a30d45840
confidence: high
status: fixed-main
---

**Title**: Sleep wake-check is off-by-one — ~1/3 of sleeps cost 0 turns (instant wake, mon acts same turn)

**Evidence**:
```js
// canMove() — battle.html:25406
if (mon.status === "SLP") {
    mon.statusTurns++;                       // pre-increment BEFORE the wake check
    let wakeThreshold = mon.sleepDuration || 2;
    if (mon.ability === "Early Bird") wakeThreshold = Math.ceil(wakeThreshold / 2);
    if (mon.statusTurns >= wakeThreshold) { mon.status = null; ...; return true; }  // wakes AND acts this turn
```
`applyStatus` sets `mon.sleepDuration = Math.floor(Math.random()*3)+1` → {1,2,3}. With the pre-increment + `>=`,
a roll of `sleepDuration===1` makes `statusTurns` 0→1, `1 >= 1` true → the mon wakes and acts on the SAME turn it
would first try to move = **0 turns truly asleep**. Effective lost-actions distribution is {0,1,2}, not Showdown's
{1,2,3}. ISSUE-006 (fixed) addressed only the RNG *determinism* of the roll and explicitly (and incorrectly)
asserted "1–3 spread matches Showdown" — the wake arithmetic, not the roll, is the deviation. Not in
tests/reports/deviations.md.

**Repro**: `node scripts/debug/_repro/sleep-real.mjs` — foe set to `status='SLP', sleepDuration=1` (a ~1/3 roll).
Output: `Gengar woke up! | Gengar used Shadow Ball!` on turn 1 — i.e. `woke===true && foeActed===true`, the sleep
cost zero actions. Showdown forces the sleeper to lose at least one action. Also `scripts/debug/_repro/sleep-duration.mjs`
prints lost-actions per duration: 1→0, 2→1, 3→2.

**Blast radius**: Every sleep-inducing move (Spore, Sleep Powder, Hypnosis, Lovely Kiss, Dark Void, Yawn, Rest-on-foe
via tricks). Spore/Hypnosis leads lose ~33% of their value; a "sleep then set up" line frequently gives the opponent a
free turn. Interacts with ISSUE-061 (Spore scored 100 by AI) — the AI over-values a status that under-delivers. Rest
(self-sleep, 2 turns) wakes after only 1 lost action instead of 2, so the user is vulnerable a turn early.

**Fix sketch**: Make the asleep duration count lost actions directly. Either (a) roll `sleepDuration = floor(rand*3)+1`
and use a strict `>` so `statusTurns > sleepDuration` wakes after exactly `sleepDuration` asleep turns; or (b) keep `>=`
but roll `floor(rand*3)+2` (={2,3,4}) so the minimum is 1 lost action — matching Showdown's `random(2,5)` internal
counter. Apply the same audit to `Early Bird` (currently `ceil(threshold/2)`: with threshold 1 it stays 1 → still
instant wake).

**Verification**: Re-run `sleep-real.mjs` with `sleepDuration` set to the minimum roll; the foe must log `is fast
asleep.` and NOT act on turn 1. Add a `status.test.js` case: put a mon to sleep with the minimum roll, assert it loses
≥1 action before waking.

