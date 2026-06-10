---
severity: P1
category: inconsistency
anchor_symbol: _storyEnemyStatMult
current_line_hint: ~33622
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 3fd8df38ef77
confidence: high
status: fixed-main
---

**Title**: Foe stats pass through FOUR stacking multipliers on the live path (band × early × stage-gated × diff+league); band & stage-gated & league each triple-special-case Champion/Mystery

**Evidence**:
```js
// startBattle live order: buildPokemon (applies _storyStatMult BAND) -> applyStoryLeagueFoeStatBoost -> applyFoeDifficultyScaling
// 47594 (enterBattleEvent): build._storyStatMult = _storyEnemyStatMult(event,city,row)  // BAND: C0 .80 -> C9 1.20, Champ 1.25, Myst 1.30
// 15163 (buildPokemon): mon.maxHp/stats *= _storyStatMult                                // stage A (applied ONCE here)
// 15032-41 (applyFoeDifficultyScaling): mult = diff * _earlyGameFoeStatMult() * _stageGatedFoeStatMult();
//   hpMult = mult + (lb.hp||0)   // league bonus is ADDITIVE here, not multiplicative
// _stageGatedFoeStatMult: Champ/Myst 1.20, E1-4 1.15 ; applyStoryLeagueFoeStatBoost: Champ +.40, Myst +.35, E1-4 +.22
```

**Repro**: `node scripts/debug/_repro/foe-scaling-map.mjs` (harness-verified deterministic). Measured compounded HP multiplier vs species base, Normal mode: Champion = band 1.25 × (stageGated 1.20 + league 0.40) = **1.99×**; Mystery = 1.30 × (1.20 + 0.35) = **2.01×**; E1-4 = 1.20 × (1.15 + 0.22) = **1.64×**. The three boss multipliers (`_STORY_FOE_STAT_BAND` "Phase 4.4", `_stageGatedFoeStatMult` "post-overhaul ramp", `applyStoryLeagueFoeStatBoost`) each special-case Champion+Mystery independently — a classic old-vs-new layering where the newer stage-gated ramp was meant to be the single source but the older band still runs on top.

**Blast radius**: Every story foe's effective power. Tuning any single function moves the curve unpredictably because three of them touch the same boss events. The canonical doc (`docs/PROGRESSION_CURVE_MASTER.md:135/179-181`) lists only Stage-gated + Difficulty + League and gives "Champion HP on Hard ≈ ×1.20 × ×1.40 × ×1.15" — it (a) never mentions the `_storyEnemyStatMult` band (`grep _STORY_FOE_STAT_BAND docs/` = 0 hits) and (b) states the league boost stacks *multiplicatively* when the code merges it *additively* (15039). So the documented Champion-Hard ≈1.495× understates the true ≈2.29× (1.25 × (1.20×1.15 + 0.40)).

**Fix sketch**: Collapse to ONE staging multiplier (the §4 "single source of truth" in STORY_OVERHAUL_PLAN). Either fold the per-city band into `_stageGatedFoeStatMult` and delete `_storyEnemyStatMult`'s boss overrides, or vice-versa — but no event should be scaled by two different boss constants. Then fix the doc's multiplicative-vs-additive league claim. (Balance numbers are maintainer-owned — propose, don't auto-change.)

**Verification**: After unifying, `node scripts/debug/_repro/foe-scaling-map.mjs` shows each event's HP multiplier traceable to exactly one function; doc formula matches measured.

---
severity: P1
category: balance
anchor_symbol: applyFoeDifficultyScaling
current_line_hint: ~15023
file: battle.html
agents: [battle-engine-debugger]
fingerprint: b49545b14054
confidence: high
status: open
---

**Title**: Measured curve violates the "regular<player, gym slightly-above, E4 EQUAL" intent — GL1-2 are 0.67-0.83× the player, gyms overshoot to 1.5×, E4 is ~1.70× (not equal)

**Evidence**:
```text
# Measured: per-mon avg effective power (HP+atk+def+spa+spd+spe), foe team vs same-city
# FULLY-TRAINED player team (31 IVs, city-band EVs), Normal mode, mean over 8 seeds:
#   GL1 0.67  GL2 0.83  GL3 0.98  GL4 1.10  GL5 1.19  GL6 1.29  GL7 1.47  GL8 1.57
#   E1 1.70  E2 1.70  E3 1.71  E4 1.73  Champion 1.99  Mystery 2.35
# Intent (FOE_STAT_NERF_BY_CITY comment ~14935 + STORY_OVERHAUL_PLAN §2.5):
#   regular < player ; gym slightly ABOVE player (~1.05-1.15) ; Elite Four EQUAL (~1.0)
```

**Repro**: `node scripts/debug/_repro/curve-multiseed.mjs` (8 seeds) and `headtohead.mjs` (single seed, with foe/player-floor too). Determinism confirmed by `determinism.mjs` (same seed -> byte-identical team+stats). Three deviations from the maintainer's stated target: (1) **GL1/GL2 sit BELOW the player** (0.67/0.83×) — the early-game softening (`FOE_STAT_NERF_BY_CITY=[.80,.85,.90]` × band .80/.85) overcorrects against a trained player, inverting "gym above player." (2) **E4 ≈ 1.70×, not EQUAL** — the single largest miss vs intent; the Elite Four is a 70% stat-wall, not a parity check. (3) **Mid-late gyms overshoot** "slightly above": GL7 1.47×, GL8 1.57×. The curve is otherwise monotonic and smooth (the GL3->GL4 dip in single-seed runs is sampling noise; the 8-seed mean rises cleanly).

**Blast radius**: The entire perceived difficulty arc and the maintainer's core design goal. Because the AI brain is identical at every stage (existing P1 fingerprint 1ebee7303e60), this stat curve IS the difficulty curve. The intended "early easy, gyms a notch up, E4 a fair mirror match" reads instead as "first two gyms are pushovers, then a steepening wall that peaks at a 2.35× Mystery." Note this SUPERSEDES the framing of ISSUE-095 (2f6b5645d86f) whose "GL4=GL5 dead zone / mult 1.0" is now partially fixed (stage-gated GL4->1.01, GL5->1.03), but the measured overshoot at the top end is the live problem.

**Fix sketch**: Maintainer-owned numbers. To hit intent: lift GL1-2 toward ~1.05-1.10× (raise the C0-1 softening floors), and pull E1-4 down toward ~1.0× (drop the E1-4 stage-gated 1.15 and/or league +0.22 so the Elite Four mirrors the player). Re-target gyms to a flat ~1.10× band. Best done jointly with the multiplier-unification finding above so one knob per event is tuned.

**Verification**: Re-run `curve-multiseed.mjs`; assert GL1..GL8 in [1.05,1.20], E1-4 in [0.95,1.10], monotonic non-decreasing.

---
severity: P2
category: inconsistency
anchor_symbol: applyStoryLeagueFoeStatBoost
current_line_hint: ~35443
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 775d00366828
confidence: high
status: open
---

**Title**: Mystery Figure HP boost is 1.35 in code but 1.50 in both balance docs (canonical-curve drift)

**Evidence**:
```js
// applyStoryLeagueFoeStatBoost (35442-35445): post-HoF Mystery
} else if (eventName === 'Mystery Figure' && rowIdx === STORY_POST_HOF_MYSTERY_ROW) {
    hpM = 1.35;   // docs say 1.50
    bulkM = 1.216;
    speM = 1.125;
}
// docs/PROGRESSION_CURVE_MASTER.md:131  "1.20 ×1.50ᴸ"   :181 "Mystery ×1.50"
```

**Repro**: `grep -n "Mystery.*1.50\|×1.50" docs/PROGRESSION_CURVE_MASTER.md` -> lines 131,181 say 1.50. Code `applyStoryLeagueFoeStatBoost` line 35443 = 1.35. Confirms STORY_OVERHAUL_PLAN §3 ("Mystery Figure HP boost = 1.35 (code) vs 1.50 (both docs)") with the exact live value. Measured net Mystery HP multiplier = 2.01× (band 1.30 × (stage 1.20 + 0.35)); at the doc's 1.50 it would be 1.30 × (1.20 + 0.50) = 2.21×.

**Blast radius**: Doc-vs-code only (no second code path). Misleads any future balance pass that trusts the doc as canon for the curve's gold-peak fight.

**Fix sketch**: Maintainer picks 1.35 or 1.50 (open decision §6.3 in the plan); then make the doc match the chosen code value (or vice-versa). Docs-only edit if 1.35 is kept.

**Verification**: `grep "Mystery" docs/PROGRESSION_CURVE_MASTER.md` matches the literal at battle.html:35443.

---
severity: P2
category: inconsistency
anchor_symbol: _bossHpScaleForKind
current_line_hint: ~42514
file: battle.html
agents: [battle-engine-debugger]
fingerprint: 4a47d6fb73d4
confidence: medium
status: open
---

**Title**: Extra-track raid HP comment says miniRaid=(party-2)×, raid=(party-1)× base HP, but a separate ×1.3 _bossStatMult also multiplies maxHp — true HP is ~5.2×/6.5× at party 6

**Evidence**:
```js
// _bossHpScaleForKind comment (42509-42517): "mini boss = (maxParty-2) × base HP, real boss = (maxParty-1) × base HP"
if (kind === 'miniRaid') return Math.max(1, p - 2);   // 4 at party 6
if (kind === 'raid')     return Math.max(1, p - 1);   // 5 at party 6
// _rollExtraRaidBossTeam (42540-41): build._bossStatMult = 1.3;  build._bossHpScale = _bossHpScaleForKind(...)
// buildPokemon (15183-15193): maxHp *= _bossStatMult (1.3) THEN maxHp *= _bossHpScale -> COMPOUND on HP
```

**Repro**: Static read of the two scaling blocks. `_bossStatMult=1.3` multiplies maxHp at 15185, then `_bossHpScale` (party-2 / party-1) multiplies it again at 15191. At maxParty 6: miniRaid HP ≈ 1.3 × 4 = **5.2× base** (comment implies 4×); raid ≈ 1.3 × 5 = **6.5× base** (comment implies 5×). The buildPokemon comment at 15176-15178 IS honest about the compounding, but the authority comment on `_bossHpScaleForKind` (42509) and the per-mon HP scale name are not — a tuning footgun.

**Blast radius**: Extra-track (raid/miniRaid) boss survivability only — a narrow, post-game-flavored subset. Low severity because these are 1-vs-party raids where high HP is intended, but the comment understates true bulk by 30% which will mislead a balance edit.

**Fix sketch**: Either fold the 1.3 into `_bossHpScaleForKind`'s returned value (and keep a separate stat-only mult for atk/def/spa/spd/spe), or amend the 42509 comment to "(maxParty-N) × 1.3 × base HP". Maintainer-owned number; recommend the comment fix at minimum.

**Verification**: Build a raid boss in the harness; assert maxHp == round(baseHpStat-derived maxHp × 1.3 × (maxParty-1)).

