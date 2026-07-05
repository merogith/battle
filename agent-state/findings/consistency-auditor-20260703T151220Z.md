---
severity: P1
category: bug
anchor_symbol: storyRngNext
current_line_hint: ~42864
file: battle.html
agents: [consistency-auditor]
fingerprint: 53957c71e739
confidence: medium
status: fixed-claude/bug-performance-investigation-8snuw9
---

**Title**: Cosmetic animation RNG consumes the seeded story stream — replay drift vector

**Evidence**:
```js
14527:  if (typeof anime !== 'function') return;   // whole type-anim path skipped when anime.js absent
14680:  el.style.left = (30 + Math.random()*40) + '%';   // ~90 cosmetic Math.random calls per animated battle
42864:  Math.random = function () {
42865:      if (typeof sm !== 'undefined' && sm && sm.active === true && sm.runSeed != null) {
42866:          return storyRngNext();
```

**Repro**: Run a seeded story battle twice: once with vendor/anime.js loaded, once with it blocked (offline / vendor fetch failure). The type-anim generators (battle.html ~14670-15400, confetti 33005-33270, sparkles 41778) call Math.random ~5-90 times per move; the global patch at 42864 routes ALL of these through storyRngNext during an active seeded run, so the two replays consume different counts of the seeded stream and every subsequent gameplay roll (accuracy, crit, damage, catch) diverges.

**Blast radius**: Story replay determinism (scripts/debug/story-replay.mjs), transcript byte-identity promised by the comment at 42853-42862, any prefers-reduced-motion or animation-skip path that conditionally skips particle spawns.

**Fix sketch**: Make cosmetic/particle call sites use _nativeMathRandom (or a dedicated cosmetic RNG) so they never touch the seeded stream; alternatively expose a cosmeticRandom() helper and sweep the typeAnims/confetti/sparkle generators.

**Verification**: Seeded replay with anime.js stubbed out vs loaded produces byte-identical battle transcripts.

---
severity: P2
category: inconsistency
anchor_symbol: startPvpBattle
current_line_hint: ~18760
file: battle.html
agents: [consistency-auditor]
fingerprint: 43267bbe216b
confidence: high
status: open
---

**Title**: pSide/fSide side-state literal duplicated 20x in two divergent variants (6-key vs 13-key)

**Evidence**:
```js
18417: pSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0, auroraVeil: 0, wishHp: 0, wishTurns: 0, safeguard: 0, mist: 0, tailwind: 0, luckychant: 0 },
18760: state = { mode: 'pvp', ... pSide: { stealthRock: false, toxicSpikes: 0, spikes: 0, stickyWeb: false, reflect: 0, lightScreen: 0 }, ... };
```

**Repro**: grep -n "stealthRock: false, toxicSpikes: 0" battle.html → 20 hits. Lines 16776, 18389, 18760, 18820 (both PvP initializers) use the SHORT 6-key variant missing auroraVeil/wishHp/wishTurns/safeguard/mist/tailwind/luckychant; lines 18417/18418, 19717/19718, and the three quick-start initializers at 19763/19815/19873 use the FULL 13-key variant.

**Blast radius**: Online PvP battles start with side-state objects missing 7 keys the engine reads/writes (Aurora Veil, Wish, Safeguard, Mist, Tailwind, Lucky Chant). Works today only because undefined is falsy and assignment creates the key, but any arithmetic like pSide.wishTurns-- on the short variant yields NaN, and the duplication guarantees future drift.

**Fix sketch**: Extract a makeSideState() helper (and a makeFreshBattleState(mode) helper for the whole 15-line state literal, which is itself duplicated at 16776/18389/18760/18820/19717/19763/19815/19873) and use it at all 20 sites.

**Verification**: grep count for the literal drops to 1; tests/suites/online-pvp-security.test.js + quickplay-modes.test.js still pass; a PvP battle using Tailwind/Wish behaves identically.

---
severity: P2
category: dx
anchor_symbol: save
file: battle.html
agents: [consistency-auditor]
fingerprint: faf7b4c6b420
confidence: high
status: open
---

**Title**: 957 empty catch(e){} blocks swallow errors silently across battle.html

**Evidence**:
```js
grep -cE 'catch\s*\(\s*\w+\s*\)\s*\{\s*\}' battle.html → 957 ; example 51686/50731: } catch (e) {}
```

**Repro**: grep -nE 'catch\\s*\\(\\s*\\w+\\s*\\)\\s*\\{\\s*\\}' battle.html | wc -l → 957 (online-pvp.js → 0).

**Blast radius**: Every subsystem: story flow, save/load, catch flow, PC ops. Real regressions (e.g. a renamed function inside a try) fail silently instead of surfacing during development, which is how flow-ordering bugs hide in a 72k-line file.

**Fix sketch**: Not a sweep-fix candidate at this size. Adopt a _swallow(e, tag) helper that logs under a window.__DEBUG flag, use it for NEW code, and convert existing blocks opportunistically when a region is touched.

**Verification**: Lint rule / grep budget in CI: count must not grow.

---
severity: P3
category: refactor
anchor_symbol: _txAbilityCmp
current_line_hint: ~67721
file: battle.html
agents: [consistency-auditor]
fingerprint: 8bf21c3e8106
confidence: high
status: open
---

**Title**: Dead code: 13 unreferenced tutor/transformation/EV UI helpers (_tx*/_tutor*/_ev*)

**Evidence**:
```js
battle.html:66247 _tutorRefreshMoveDetailRow; 66267 _tutorEquippedDescHtml; 67721 _txAbilityCmp; 68006 _txNatureRecsByPurpose; 68071 _txEvPresetRecsByPurpose; 68121 _txStripPicks; 68139 _txStripHtml; 68155 _txMoveEffectShort; 68176 _tutorFillMoveSelect; 69510 _txApplyNatureFilters; 71304 _evTotal; 71350 _evTrainerTopSpreadKeys; 71493 _evSpreadShortLine — 0 call sites
```

**Repro**: For each name: grep -c "<name>" across battle.html, online-pvp.js, move-*-map.js, index.html, sw.js, tests/, scripts/ → exactly 1 hit (the declaration). No window.* export, no dynamic string lookup (grep for bracket-lookup patterns → 0).

**Blast radius**: None at runtime — pure dead weight (~500 lines) in the Move Tutor / Transformation / EV-trainer UI region, left behind by earlier redesigns of those panels.

**Fix sketch**: Behavior-preserving deletion (grep-verified). Per CLAUDE.md this class of refactor needs direction-level approval before the sweep, not diff-level.

**Verification**: grep for each name → 0 hits; jsdom harness boots; tutor/EV screens render in a story run.

---
severity: P3
category: refactor
anchor_symbol: getTrainerQuote
current_line_hint: ~39651
file: battle.html
agents: [consistency-auditor]
fingerprint: 35c6ab72ff61
confidence: high
status: open
---

**Title**: Dead code: 10 unreferenced story-mode helpers; getTrainerQuote survives only in a test

**Evidence**:
```js
battle.html:39583 storyFirstBattleIndexAfter; 39651 getTrainerQuote; 44165 _rivalScoreAttackTypeVsParty; 44637 _storyBuildTierLabel; 46714 _trainerPrettyName; 51821 _storyEventIsIconicFight; 55590 _storyDefaultMoveRanker; 59951 _wildSlotsRemainingForBattle; 61320 _storyShuffle; 65982 _hasHeartScale — 0 call sites in shipped code
```

**Repro**: Same grep protocol as the _tx* cluster: 1 hit each (the declaration). Exception: getTrainerQuote has 8 references in tests/smoke-dialogue-load.mjs — the smoke test exercises a function no shipped code path calls; the live path is getTrainerQuoteForBattle (39663, called from 57681).

**Blast radius**: None at runtime. The test coverage on getTrainerQuote gives false confidence — it can pass while the real dialogue path regresses.

**Fix sketch**: Delete the 10 helpers (grep-verified 1:1 removal, needs direction approval per CLAUDE.md); repoint smoke-dialogue-load.mjs at getTrainerQuoteForBattle.

**Verification**: grep → 0 hits each; smoke-dialogue-load.mjs green against getTrainerQuoteForBattle.

---
severity: P3
category: refactor
anchor_symbol: calculateTier
current_line_hint: ~16896
file: battle.html
agents: [consistency-auditor]
fingerprint: ac343772de7d
confidence: high
status: open
---

**Title**: Dead code: 5 misc data/UI helpers in battle.html + mergeData in online-pvp.js

**Evidence**:
```js
battle.html:10907 getTooltipKeysSorted; 14362 smogonKey; 16531 getStatColorClass; 16896 calculateTier; 16997 calculatePoolTiers; online-pvp.js:67 mergeData — 0 call sites
```

**Repro**: Same grep protocol: exactly 1 hit each across all shipped files, tests/ and scripts/. mergeData (online-pvp.js:67) is a 4-line deepClone+assign wrapper superseded by direct Object.assign at the pushData call sites.

**Blast radius**: None at runtime; calculateTier/calculatePoolTiers are leftovers from a pre-grade tiering system and can mislead readers hunting for the live grade logic (getMonGrade).

**Fix sketch**: Delete after direction approval; grep-verified 1:1.

**Verification**: grep → 0 hits each; engine harness boots; online PvP suite green.

---
severity: P3
category: refactor
anchor_symbol: story-tutor-move-slot
current_line_hint: ~810
file: battle.html
agents: [consistency-auditor]
fingerprint: 214045f153e7
confidence: medium
status: open
---

**Title**: Dead CSS: ~72 style-block classes with no static or template-built reference

**Evidence**:
```js
Verified-dead CSS classes (defined in <style>, zero references in markup/JS incl. template-built prefixes): title-text menu-gauntlet-row menu-gauntlet-main menu-gauntlet-lb prof-pick-header prof-full-summary-btn prof-summary-icon-btn move-btn-eff-bottom sum-note--info story-tutor-apply-move story-tutor-move-slot story-tutor-move-filter story-tutor-move-picker-footer story-tutor-current-equip story-tutor-afford-warn tx-chip--cat-Physical tx-chip-row--leading tx-slot-row--single tx-slot-label tx-slot-meta tx-slot-empty tx-stat-spe tx-card-price tx-pill--rec tx-pill--nature-up tx-icon-img tx-chips-row tx-chip-strip-end tx-stat-fill--down story-hof-plaque story-hof-team-slot story-link-mon-header badge-icon gimmick-mega move-tile-eff anim-attack anim-attack-foe anim-damage anim-shake anim-faint anim-switch-in anim-switch-out storyfx-stage-banner anim-lunge-player anim-lunge-foe anim-hit-overlay stat-arrow story-facility-grid--phone-1col move-btn menu-title menu-sub menu-pool-line menu-story-row menu-story-btn menu-collection-row menu-collection-btn menu-collection-icon menu-collection-text menu-collection-sub story-master-ball-glow story-master-ball-pulse badge-pulse story-tutorial-enter-1..4 story-settings-panel story-settings-heading story-settings-gen-row story-settings-gen-label story-settings-gen-btn gauntlet-score-display story-create-portrait-name
```

**Repro**: Scripted scan: extract .class selectors from <style> blocks, search remaining battle.html + online-pvp.js + move-*-map.js for delimited usage, then re-check every dash-prefix against template construction (e.g. battle-tint-${type}, ach-row--rank + rank, pdex-gen-tab${...} were correctly excluded as live).

**Blast radius**: None at runtime — CSS weight and reader confusion only. The anim-* block (5068-5074, 7053-7057) and menu-* / story-tutor-* / tx-* clusters mirror the dead JS helpers from the same removed redesigns.

**Fix sketch**: Delete selectors in cluster-sized sweeps after direction approval; keep the scan script as a guard.

**Verification**: Re-run the scan → 0; visual smoke of menu, battle, tutor, PC, settings screens.

---
severity: P3
category: refactor
anchor_symbol: crucibleGymPick
current_line_hint: ~50191
file: battle.html
agents: [consistency-auditor]
fingerprint: dc0057c364fe
confidence: medium
status: open
---

**Title**: Duplicated logic: dev-seed blocks, weather/terrain rollers, and inline mon-id generation

**Evidence**:
```js
50191/50358 + 50289/50414: duplicated dev-seed blocks (sm.badges = 8; if (sm.runSeed == null ...) sm.runSeed = 0xDEADBEEF; sm._strngState = null; if (!sm.settings) sm.settings = {...}; enabledGens backfill) ; 23796+23812: rollRandomWeather/rollRandomTerrain identical except table ; 8 sites: id: 'm_' + Math.random().toString(36).slice(2, 10)
```

**Repro**: Scripted 8-line duplicate-window scan over battle.html: 10 groups. Largest: the story debug seeders (devStoryJump / City8 / testmega, ~20 significant lines duplicated twice each around 50191/50358 and 50289/50414); rollRandomWeather vs rollRandomTerrain (23790-23820) differ only in the option table and message map; the mon-id literal appears 8x (40460, 42639, 42672, 48365, 53630, 54047, 54095, 54126, 59395, 63208, 63248).

**Blast radius**: Dev helpers drift apart silently (one seeder gets a new settings key, the twin does not); mon-id format changes would need an 11-site sweep.

**Fix sketch**: Extract _devSeedBaseline(), _rollRandomField(tableKind), and newMonId() helpers.

**Verification**: Duplicate-window scan groups drop; devStoryJump/testmega still seed identical state.

---
severity: P3
category: inconsistency
anchor_symbol: _pickWildSpeciesRandom
current_line_hint: ~60558
file: battle.html
agents: [consistency-auditor]
fingerprint: 378344130d79
confidence: high
status: open
---

**Title**: Stale RNG comments: wild-species pick is NOT freed from the seed; site count off by 55

**Evidence**:
```js
60556: * weights themselves still drive the tier mix; only the actual species pick is freed from the seeded sequence. */
60563: let r = Math.random() * total;   // but Math.random is globally patched to storyRngNext when sm.active && runSeed != null (42864)
42854: // Math.random() in the engine (262 sites across battle.html) routes   // actual count today: 207
```

**Repro**: _pickWildSpeciesRandom only runs during an active story run, where the global Math.random patch (42863-42869) makes every call seeded — so the header comment\u2019s claim that the species pick is "freed from the seeded sequence" is false. Also grep -c "Math.random()" battle.html → 207, not the 262 the determinism comment states.

**Blast radius**: Misleads the next session about replay semantics of wild encounters — exactly the class of doc drift the determinism comment exists to prevent.

**Fix sketch**: Either honor the stated intent (call _nativeMathRandom explicitly) or fix the comment to say the pick is seeded; refresh the 262 count or drop it.

**Verification**: Comment matches behavior; seeded story replay produces identical wild species (current actual behavior).

---
severity: P3
category: dx
anchor_symbol: enrichBaseStatsHeightsFromDex
current_line_hint: ~11210
file: battle.html
agents: [consistency-auditor]
fingerprint: b999bdcd6db9
confidence: high
status: open
---

**Title**: Ungated console.log: SpriteScale dex probe logs to every player console on enrich miss

**Evidence**:
```js
11210: console.log('[SpriteScale] dex probe Pikachu', { id, heightmOnClass: ..., weightkg: ... });
11211: } catch (e) { console.log('[SpriteScale] dex probe failed', e); }
```

**Repro**: Load with a dex whose species lack heightm (n === 0 branch in enrichBaseStatsHeightsFromDex) — the Pikachu probe logs unconditionally. All ~26 other console.log sites in battle.html are correctly gated behind window.__DEBUG_* flags or live inside explicit dev commands (devStoryJump, testmega, __devRevealFoeTeam).

**Blast radius**: Console noise only.

**Fix sketch**: Gate the probe behind window.__DEBUG_SPRITE_SCALE like its siblings at 11190/16595.

**Verification**: grep for ungated console.log in the SpriteScale region → 0.

---
severity: P3
category: dx
anchor_symbol: showVictoryOverlay
current_line_hint: ~58277
file: battle.html
agents: [consistency-auditor]
fingerprint: 739dc0f82834
confidence: low
status: open
---

**Title**: Magic numbers: uncommented ms delays and thresholds concentrated in overlay/anim timing

**Evidence**:
```js
75 setTimeout/setInterval sites with hardcoded 3-4 digit ms delays; ~300 uncommented numeric literals >= 1000 outside CSS/colors (sample: 42820 hpM = Math.min(3.00, 1.50 + (round - 1) * 0.075))
```

**Repro**: grep -nE '(setTimeout|setInterval)\\([^,]+,\\s*[0-9]{3,}\\)' battle.html | wc -l → 75. Worst offenders are overlay/animation timing chains (showVictoryOverlay region, type-anim generators 14670-15400, confetti 33260s) where sibling delays must stay in sync but nothing names them.

**Blast radius**: Timing tweaks require hunting paired literals; no functional bug.

**Fix sketch**: Summary finding only (per audit protocol). Introduce named timing consts opportunistically when a region is touched.

**Verification**: n/a — tracking item.

---
severity: P3
category: inconsistency
anchor_symbol: abilities.json
file: data/abilities.json
agents: [consistency-auditor]
fingerprint: 9ea1cf875766
confidence: high
status: open
---

**Title**: Diacritics: 1262 bare "Pokemon" in Showdown-derived desc strings shown in tooltips

**Evidence**:
```js
data/abilities.json: 714 bare "Pokemon"; data/moves.json: 413; data/items.json: 135 — all in UI-facing desc/shortDesc strings (e.g. "1/3 chance of infatuating Pokemon of the opposite gender...")
```

**Repro**: grep -c "\\bPokemon\\b" data/abilities.json data/moves.json data/items.json. battle.html itself is clean: its 20 remaining hits are comments plus the intentional bare→diacritic normalization map at 42336-42339; all dialogue JSON under data/dialogue/ is clean (0 hits).

**Blast radius**: Ability/move/item tooltips and info panels render "Pokemon" while every hand-written UI string says "Pokémon" — visible register mismatch on the same screen.

**Fix sketch**: One-time normalization pass over the three JSON files (or replace at display time in the tooltip renderer to survive future Showdown data refreshes).

**Verification**: grep → 0 in the three files (or renderer test asserting the display substitution).

---
severity: P3
category: inconsistency
anchor_symbol: rivalStandingPrimaryQuotePool
current_line_hint: ~39625
file: battle.html
agents: [consistency-auditor]
fingerprint: b1d501c75641
confidence: high
status: open
---

**Title**: Rival phase-4 standing pools have only 2 lines each (other variants have 3)

**Evidence**:
```js
39625: if (rivalChamp && phase === 4) return ['I took the crown last time...','The Hall can write both names...'];  // 2 lines
39631: if (phase === 4) return ['You took the crown off my head...','Champion or challenger, one win flips the story...'];  // 2 lines
```

**Repro**: Read rivalStandingPrimaryQuotePool (39615-39637): the streak and last-winner variants all carry 3 lines; the two phase-4 crown variants carry 2, so post-HoF rematches repeat rival openers ~1.5x sooner than any other phase.

**Blast radius**: Post-game rival rematches only; pure flavor. Everything else in the dialogue-pool audit is healthy: TRAINER_QUOTES_BY_NAME covers 105 names incl. all leaders/E4/champions with >=2 lines, LEADER_VICTORY_LINES is per-leader and wired into showVictoryOverlay (58328) — the prior-audit generic-badge-line issue is fixed.

**Fix sketch**: Add one line to each phase-4 variant (fanservice opportunity: reference the specific Hall of Fame team).

**Verification**: Each return array in rivalStandingPrimaryQuotePool has >=3 entries.

