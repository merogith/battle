---
severity: P3
category: inconsistency
anchor_symbol: _showOrientationTipThenCity
current_line_hint: ~53520
file: battle.html
agents: [consistency-auditor]
fingerprint: 8bf7bfeb549b
confidence: high
status: open
---

**Title**: Post-HoF orientation tip frames the Mystery Figure as un-fought, but the row-67 climax already unmasked it

**Evidence**:
```js
// _showOrientationTipThenCity, fired AFTER the row-67 Mystery Figure climax resolves:
'🚪 The Mystery Figure — the Crucible\'s Mystery button summons one final masked
 challenger. The mask doesn\'t come off until you win.'
// But postHofMysteryClimaxDone gating (~53483) runs the Mystery Figure fight to
// completion BEFORE this tip shows; the Crucible button tooltip (~48112) correctly
// calls it "Replay the post-HoF masked trainer".
```

**Repro**: Reach Hall of Fame, beat the row-67 Mystery Figure climax, then read the post-HoF orientation tip (`_storyShowOneTimeTip('postHof', ...)`). The tip says the mask "doesn't come off until you win" though the player has already won and seen the reveal.

**Blast radius**: Copy only — no mechanics. But it contradicts the Crucible Mystery tooltip ("Replay…") and the Crucible enter-tip ("Replay the post-HoF masked trainer"), which correctly frame the button as a rematch. The inconsistency is between three strings describing the same button.

**Fix sketch**: Reword the orientation-tip Mystery line to match the rematch framing, e.g. "The Mystery Figure — the masked challenger you just unmasked returns on demand from the Crucible's Mystery button, as tough as ever." User owns story copy (pasteur) — propose wording, do not edit.

**Verification**: Grep the three Mystery-Figure button descriptions (orientation tip ~53520, Crucible enter-tip ~48074, Crucible button tooltip ~48112) and confirm all three describe a rematch, not a first encounter.

---
severity: P3
category: inconsistency
anchor_symbol: BOSS_CONFIGS
current_line_hint: ~41863
file: battle.html
agents: [consistency-auditor]
fingerprint: 68d5ed4fb32c
confidence: high
status: open
---

**Title**: Magma/Aqua bosses flash the same telegraph banner twice in the first two turns

**Evidence**:
```js
'villain.magma.boss': { mechanics: [
  { type: 'fieldLock', ..., banner: 'PRIMAL HEAT' },      // fires turn-0 (battle init)
  { type: 'faintPhase', afterFaints: 0, ..., banner: 'PRIMAL HEAT' }, // fires turn 1→2
  ... ] }
// villain.aqua.boss is identical with 'PRIMORDIAL RAIN' / 'PRIMORDIAL RAIN'.
```

**Repro**: Start the Team Magma (or Aqua) boss fight. `_storyBossMechanicsBattleInit` flashes "PRIMAL HEAT" on the weather lock at init, then the `afterFaints:0` surge phase telegraphs "PRIMAL HEAT" again one turn later — the same banner text twice in quick succession.

**Blast radius**: Cosmetic only (banner is a non-blocking fade via `_showBossBanner`). These are villain main-track bosses, so in-scope for Story polish; no other boss config repeats a banner.

**Fix sketch**: Give the `afterFaints:0` phase a distinct banner from the fieldLock banner (e.g. weather lock "PRIMAL HEAT", opening surge "ERUPTION BEGINS"), or suppress the turn-1 telegraph when its banner equals the just-shown init banner. Balance/boss-config is maxwell-adjacent — propose strings, do not edit.

**Verification**: Re-run the magma/aqua boss; confirm two different banners across init + first phase.

---
severity: P3
category: dx
anchor_symbol: _validateTrainerData
current_line_hint: ~37354
file: battle.html
agents: [consistency-auditor]
fingerprint: 70517df8e82b
confidence: high
status: open
---

**Title**: `_validateTrainerData` logs a success `console.log` on every boot (ungated)

**Evidence**:
```js
// _validateTrainerData() is called unconditionally at boot (~10446):
if (errs.length) console.warn(`[TRAINER_DATA] ${errs.length} hard error(s) — ...`);
else console.log('[TRAINER_DATA] validation: all signatures resolve to known species.');
```

**Repro**: Load `battle.html` in a browser; the console prints "[TRAINER_DATA] validation: all signatures resolve to known species." on every page load (and `console.info` lines for each soft issue at ~37355).

**Blast radius**: Shipped console noise only. Unlike the `__DEBUG_LOADS`/`__DEBUG_SPRITE_SCALE`-gated logs elsewhere in `loadGameData`, this success path is ungated. The `[SpriteScale]` and `[Data]`/`[CSV]`/`[Smogon]` logs are correctly gated; this one is the outlier.

**Fix sketch**: Gate the success `console.log` (and the per-issue `console.info` loop) behind `window.__DEBUG_LOADS`, matching the sibling load logs. Keep the `console.warn` hard-error path ungated.

**Verification**: Boot without debug flags → no `[TRAINER_DATA] validation:` line. Boot with `?...` debug flag → line present.

---
severity: P3
category: inconsistency
anchor_symbol: _bossArcCheckCageUnlock
current_line_hint: ~48507
file: battle.html
agents: [consistency-auditor]
fingerprint: 369bf4e2180e
confidence: medium
status: open
---

**Title**: Caged God uses three names for one entity (Specimen 0001 / Subject Zero / Subject 0001) without a stated rule

**Evidence**:
```js
// Cage-unlock alert + cage button fallback name:
const bossName = (sm.bossArc.boss && sm.bossArc.boss.name) ? sm.bossArc.boss.name : 'Specimen 0001';
// Post-catch nickname (~49814):
caught.nickname = 'Subject Zero';
// 'static' variant lead (~48475) introduces a THIRD form:
'... SPECIMEN ???? / SUBJECT 0001 / LOOP COUNT: ??? ...'
```

**Repro**: Read the Caged God flow end-to-end: brokers and the first-clear alert call it "Specimen 0001" (lore designation); the caught Pokémon is nicknamed "Subject Zero"; the `static` variant blends them into "Subject 0001". The cage button shows the rolled species name (e.g. "Mewtwo") in normal play, falling back to "Specimen 0001" only if the roll failed.

**Blast radius**: Copy only. The intent is plausibly deliberate ("Specimen 0001" = file/lore label, "Subject Zero" = the nickname you give it on capture), and the `static` glitch-corruption is in-character. But the rule is implicit; a player who hits the fallback path sees "Specimen 0001" in the button/alert but "Subject Zero" in their party — looks like two different captures.

**Fix sketch**: Document the naming rule in a comment near `_BOSS_LEAD_FLAVOR` (lore = "Specimen 0001", nickname = "Subject Zero"), and either rename the fallback boss name to "Subject Zero" to match the post-catch nickname or accept the lore label intentionally. Story copy is pasteur-owned — confirm intent before any change.

**Verification**: Trace every Caged-God string; confirm each "Specimen 0001"/"Subject Zero"/"Subject 0001" occurrence is justified by the documented rule.

