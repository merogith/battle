# Task 02 — Fix the broken moves surfaced by the TODO-fill pass

**Goal:** fix the engine bugs that prevent ~20 move todos from being asserted.

**Owner:** battle-engine-debugger. **Sign-off: REQUIRED.** Every item here changes
game behavior (damage/status/item logic) → propose a diff, get the maintainer's
approval, *then* commit (`CLAUDE.md` → Approval rules). The one exception is item
**0** (test-generator DX), which touches no game logic.

All items are already in `agent-state/ISSUE_LEDGER.md` (filed by agent
`test-coverage-filler`). Anchors are line *hints* — confirm with the `anchor` skill or
`grep`, the monolith drifts. Build a deterministic repro with `repro-battle` /
`run-engine-test` before and after each fix.

---

## 0. (DX, no sign-off) Test generator strips apostrophes + silent move fallback

**Where:** `tests/audit/generate-move-tests.js:18` (`safeName`) and `buildPokemon` in
`battle.html`.

**Bug:** `safeName(s){ return s.replace(/[\`"']/g,''); }` drops apostrophes, so todos
read `'Kings Shield'`, `'Lands Wrath'`, `'Natures Madness'` — not the engine's real
names. Worse, the engine runs an **unknown** move name as a ~187-dmg fallback instead
of erroring, so a mistyped fill silently "passes." Bit two tests this pass.

**Fix:** stop stripping apostrophes in `safeName` (only escape for the JS string
literal — `buildItBlock` already does `.replace(/'/g,"\\'")`); and/or make the move
lookup throw/warn on an unknown name. **Do this first** — it prevents future silent
test corruption.

**Verify:** generated todo titles equal canonical move names; an unknown move name
throws in the harness.

---

## P2 — real bugs (do these next)

### 1. Comeuppance reflects 0 damage
**Where:** `battle.html:~23412`. The working reflect path (`attacker.volatile.lastDmg`,
deals damage, returns) checks only `"Metal Burst"`. Comeuppance falls through to the
`~24379` block, which reads `defender.volatile.lastPhysicalDmg` (the target took no
damage) → "But it failed!" → 0.
**Fix:** add `|| move.name === "Comeuppance"` to the line-23412 condition (or fix the
24379 fallback to read `attacker.volatile`). Twin Metal Burst already works.
**Verify:** Comeuppance vs a foe that just hit physically/specially deals 1.5× that
damage; 0 with no prior hit. (Mirrors the Metal Burst case in
`manual/prior-context.test.js`.)

### 2. Crush Grip doesn't scale with target HP
**Where:** `battle.html:~23746`. HP-scaling power is set for Wring Out / Hard Press but
**omits Crush Grip**, despite the `~24367` comment claiming all three are handled.
Crush Grip's data basePower is 0 → it deals ~1–2 regardless of target HP.
**Fix:** add `"Crush Grip"` to the line-23746 condition (`120 * currentHp/maxHp`, or
its true gen formula — maintainer owns the number).
**Verify:** Crush Grip dmg vs full-HP > dmg vs 30%-HP target. Then replace the
"deals damage" placeholder in `manual/variable-damage.test.js`.

### 3. Trick / Switcheroo swap is one-directional (item destroyed)
**Where:** `battle.html:~27635`. The swap line *looks* correct
(`temp=attacker.item; attacker.item=defender.item; defender.item=temp`), yet observed
behavior (verified via direct state inspection): user receives the foe's item, but the
foe keeps its own — the user's item is destroyed. Likely a **post-swap overwrite** (an
end-of-turn item normalization, or an AI mon re-deriving its build item) or a reference
issue.
**Fix:** trace what re-reads/overwrites `defender.item` after the handler returns.
**Verify:** after Trick, `attacker.item === foe's old item` AND
`defender.item === user's old item`.

---

## P3 — niche bugs / no-ops (batch with maintainer)

### 4. Upper Hand / Shell Trap don't enforce their gate
`grep "Upper Hand"` → 0 hits (no handling at all); `Shell Trap` appears only in
banned-move sets. Both behave as generic damaging moves. Gate Upper Hand on the target
using a priority attack (+ priority + flinch); gate Shell Trap on having been hit by a
physical move this turn.

### 5. Grass Whistle never inflicts sleep
Listed only in sound-move sets (`battle.html:~19082`); no sleep application. Wire it
into the same path as Sing (it's sound-based → also check Soundproof). **Verify:**
seed-sweep lands SLP within ~10 seeds (mirror the Sing case in
`manual/status-infliction.test.js`).

### 6. Confirmed no-op status moves
Verified inert via direct state inspection (jsdom):
`Power Shift` (raw Atk/Def unchanged), `Corrosive Gas` (foe item not removed),
`Purify` (foe status not cured), `Venom Drench` (poisoned foe's stats not lowered),
`Ion Deluge` (`ionDeluge` stays false), `Crafty Shield` (doesn't block a status move),
`Mat Block` (doesn't block a damaging move turn 1). Triage + implement each.

### 7. To-verify (no effect under generic setup — confirm gap vs. precondition first)
`Nature Power`, `Copycat`, `Mirror Move`, `Parting Shot`, `Doodle` (ally-copy),
`Powder`, `Me First`, `Electrify`, `Fairy Lock`, `Nightmare`, `Disable`,
`Laser Focus`. Some may be doubles-only or need an exact prior-move/ally context; build
a targeted repro before deciding they're broken. (`Dark Void` is **correct** —
Darkrai-only — leave as-is; it just can't be asserted from a generic user.)

---

## After each fix

1. Add/confirm the deterministic regression test (see Task 03 — most have a
   ready "Verify" recipe and a placeholder draft).
2. Mark the finding `fixed-<branch>` in its
   `agent-state/findings/test-coverage-filler-*.md` block and run
   `node scripts/debug/issue-ledger.mjs`.
3. Hand the unblocked move to Task 03 so its `it.todo()` becomes a real test.
