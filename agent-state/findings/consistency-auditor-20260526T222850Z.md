---
severity: P2
category: inconsistency
anchor_symbol: playStoryTutorial
current_line_hint: ~36972
file: battle.html
agents: [consistency-auditor]
fingerprint: 4b71628ae0f5
confidence: high
status: fixed-main
---

**Title**: Nurse Joy first-Center tutorial says PC has "ten slots" but PC_BOX_CAP is 30

**Evidence**:
```js
// firstPokemonCenter tutorial (line ~36972)
'"Upstairs is the PC: ten slots of cold storage for every partner you\'ve caught but can\'t field today. Deposit, withdraw, release — the usual courtesies."',
// but the actual cap (line ~43126):
const PC_BOX_CAP = 30;
// and the PC tab UI + main help both say 30:
//   line ~10651: "<b>PC Storage</b> (cap 30) ..."
//   line ~43331: <span>PC <strong>${box.length}/${PC_BOX_CAP}</strong></span>
```

**Repro**: Start a fresh story run, reach the first Pokémon Center; Nurse Joy's tutorial reads "ten slots." Open the PC tab on the same screen — header shows "/30," and the main help text says "(cap 30)."

**Blast radius**: Player-facing copy only (the tutorial is purely narrative; capacity logic uses `PC_BOX_CAP`). No gameplay effect, but the onboarding line actively misinforms about the storage limit — the same "10 vs 30" contradiction the prior ledger flagged for the help text, fixed everywhere except this tutorial string.

**Fix sketch**: Change "ten slots" to "thirty slots" (or a cap-agnostic phrasing like "a wall of cold storage") in the `firstPokemonCenter` tutorial line so it matches `PC_BOX_CAP` and the rest of the UI.

**Verification**: Grep `ten slots` returns no hits; load a fresh run and confirm the Nurse Joy line no longer says "ten." Optionally assert the tutorial string contains no hardcoded slot count.

---
severity: P3
category: inconsistency
anchor_symbol: CHAMPION_VICTORY_LINES
current_line_hint: ~29723
file: battle.html
agents: [consistency-auditor]
fingerprint: 743b2b45931a
confidence: high
status: open
---

**Title**: CHAMPION_VICTORY_LINES['Hau'] is dead — Hau is an Elite Trainer, never a Champion

**Evidence**:
```js
// CHAMPION_VICTORY_LINES (line ~29723):
'Hau':"Hau: \"Alola! You're a malasada-sweet Champion now!\"",
// but Hau's only TRAINER_DATA row (line ~29049) is role 'Elite Trainer':
{ role:'Elite Trainer', name:'Hau', type:'Normal', sigs:[...], spriteFile:'Hau' },
```

**Repro**: `node -e` cross-reference of CHAMPION_VICTORY_LINES keys vs. `role:'Champion'` names in TRAINER_DATA — "Hau" appears in the victory-line table but is not a Champion-role trainer. The Champion slot is filled only by `t.role === 'Champion'` (selectTrainerForRole / find-by-name guards), so showVictoryOverlay's Champion branch can never look up Hau.

**Blast radius**: Dead string only — no player will ever see it. Harmless, but it is misleading to future authors (implies Hau can be the Champion) and inflates the pool. Note the inverse is clean: every actual Champion (Blue, Lance, Steven Stone, Wallace, Cynthia, Alder, Iris, Diantha, Prof. Kukui, Leon, Geeta, Red) has both an intro pool and a victory line.

**Fix sketch**: Either remove the Hau entry from CHAMPION_VICTORY_LINES, or — if Hau is intended as a future Champion — add a `role:'Champion'` Hau row to TRAINER_DATA. Removing is the lower-risk option.

**Verification**: Re-run the keys-vs-roster cross-reference; CHAMPION_VICTORY_LINES should have no keys outside the Champion roster.

---
severity: P3
category: inconsistency
anchor_symbol: ELITE_VICTORY_LINES
current_line_hint: ~29703
file: battle.html
agents: [consistency-auditor]
fingerprint: a8e2044035af
confidence: high
status: open
---

**Title**: ELITE_VICTORY_LINES['Molayne'] is dead — Molayne is an Elite Trainer, not an E1–E4 boss

**Evidence**:
```js
// ELITE_VICTORY_LINES (line ~29703):
'Molayne':"Molayne: \"My circuits are humming. You earned the next gate.\"",
// but Molayne's only TRAINER_DATA row (line ~29100) is role 'Elite Trainer':
{ role:'Elite Trainer', name:'Molayne', type:'Steel', sigs:[...], spriteFile:'Molayne' },
// ELITE_VICTORY_LINES is only read on /^E[1-4]$/ events in showVictoryOverlay (~43047)
```

**Repro**: Cross-reference ELITE_VICTORY_LINES keys vs. the E1–E4 roster (`role:'E[1-4]'`). "Molayne" is in the table but is only an `Elite Trainer` (the generic ace class), which surfaces as the "Elite Trainer" / "Ace Trainer" event — never an `E1`–`E4` slot. showVictoryOverlay reads ELITE_VICTORY_LINES only inside the `/^E[1-4]$/` branch, so Molayne's line is unreachable.

**Blast radius**: Dead string only. All 31 actual E1–E4 names resolve to both an ELITE_VICTORY_LINES entry and a TRAINER_QUOTES_BY_NAME intro pool, so the live data is complete — this is just a stray key (mirrors the Hau case in the Champion table).

**Fix sketch**: Remove the Molayne entry from ELITE_VICTORY_LINES (he speaks via TRAINER_QUOTES_BY_NAME on intro as an Elite Trainer; there is no E1–E4 victory-card path for that class). Leave the rest of the table as-is.

**Verification**: Re-run the keys-vs-roster cross-reference; ELITE_VICTORY_LINES should have no keys outside the E1–E4 roster.
