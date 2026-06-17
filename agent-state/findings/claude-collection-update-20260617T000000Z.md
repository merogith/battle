---
severity: P2
category: data
anchor_symbol: TRAINER_DATA
current_line_hint: ~32647
file: battle.html
agents: [claude]
fingerprint: 3288bd742c72
confidence: high
status: fixed-claude/collection-ui-achievements-update-4j31fc
---

**Title**: E4 Lance and Champion Lance shared a byte-identical signature roster (copy-paste dup)

**Evidence**:
```js
// before — both rows identical:
{ role:'E4',       name:'Lance', sigs:['Dragonite','Dragonite','Dragonite','Aerodactyl','Gyarados','Charizard'], charGen:1, pkmGens:[1,2] },
{ role:'Champion', name:'Lance', sigs:['Dragonite','Dragonite','Dragonite','Aerodactyl','Gyarados','Charizard'], charGen:2, pkmGens:[1,3,4] },
```

**Repro**: `grep -n "name:'Lance'" battle.html` showed two rows with the same
`sigs` array. The signature registry unions both Lance variants under the base
name "Lance" (`_storyBuildSignatureRegistry`, ~44835), so the duplicate added no
journal variety and was not canon-accurate for the gen-1 Kanto E4 Lance.

**Blast radius**: Signature journal (Collection → Signatures tab), foe roster
roll for E4 Lance battles.

**Fix sketch**: E4 Lance now fields the RBY Kanto-authentic ace line
`['Gyarados','Dragonair','Dragonair','Aerodactyl','Dragonite']` (`pkmGens:[1]`);
Champion Lance keeps the HGSS Dragonite×3 team. The two rosters now differ and
the merged Lance journal entry unions both.

**Verification**: `node --test tests/suites/story-signature-journal.test.js`
(new test: "E4 Lance and Champion Lance have distinct, non-duplicate rosters").

---
severity: P2
category: bug
anchor_symbol: STORY_ACHIEVEMENTS
current_line_hint: ~40089
file: battle.html
agents: [claude]
fingerprint: 32a0fd1f1b9b
confidence: high
status: fixed-claude/collection-ui-achievements-update-4j31fc
---

**Title**: 8 "Replayability" achievements were defined but never unlocked (dead trophies)

**Evidence**:
```js
// Defined in STORY_ACHIEVEMENTS but no unlock hook ever fired:
r_hall_of_fame, r_champion_twice, r_monotype, r_challenge_clr,
r_no_item, r_solo, r_perfect_rival, r_three_runs
```

**Repro**: `grep -nE "_storyAchievement(Unlock|BumpCount)\\('r_(hall_of_fame|champion_twice|monotype|challenge_clr|no_item|solo|perfect_rival|three_runs)'" battle.html`
returned 0 hits — the trophies were permanently unobtainable.

**Blast radius**: Collection → Achievements tab (8 trophies could never unlock).

**Fix sketch**: Wired all 8 in the `showHallOfFame` fresh-clear block
(completedRuns/difficulty/party-size/monotype/no-item/perfect-rival checks),
added a per-run `sm.stats.rivalBattlesLost` counter for `r_perfect_rival`, and a
pure `_storyPartyMonotype` helper for monotype detection. Also added a new
multi-tier "Endgame Grind" category (frontier_rounds, gold_spent, perfect_runs,
monotype_runs, mystery_defeats) and extended count tiers to 5 ranks.

**Verification**: `node --test tests/suites/achievements-unlock.test.js`
(source-level guard asserts every replay/grind achievement has a live hook).
