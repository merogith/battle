---
severity: P1
category: bug
anchor_symbol: activateMega
file: battle.html
agents: [codex-codebase-review]
fingerprint: c9ade7a4da3f
confidence: high
status: fixed-approved
---

**Title**: Form changes discard persistent progression stat modifiers

**Evidence**: Scaled Charizard Mega X Attack becomes 150 instead of 195; EXP-Share +3 gives 150 instead of 159. Castform loses scaled HP 188 to 145 in _setMonForm.

**Repro**: `node scripts/debug/review-september-2026.mjs`

**Blast radius**: Player upgrades, boss scaling, form summaries.

**Fix sketch**: Share the stat pipeline and specify persistent modifiers and HP semantics for each form mechanic.

**Verification**: Assert scaled and upgraded stats across transformations and reversions.

Full context: `docs/STORY_MODE_REVIEW_2026-09-12.md`.

---
severity: P1
category: bug
anchor_symbol: buildPokemon
file: battle.html
agents: [codex-codebase-review]
fingerprint: c58c4b300e50
confidence: high
status: fixed-approved
---

**Title**: Species construction assigns incorrect genders

**Evidence**: Latias, Latios, Cresselia and Tornadus are constructed genderless; fixed-gender and form metadata comparisons reproduce additional mismatches.

**Repro**: `node scripts/debug/review-september-2026.mjs`

**Blast radius**: Attract, Captivate, Cute Charm, Rivalry, generated parties and saves.

**Fix sketch**: Use canonical species gender and ratios with seeded RNG; preserve valid saved genders and migrate impossible assignments explicitly.

**Verification**: Test fixed genders, genderless species, regional forms and ratio sampling.

Full context: `docs/STORY_MODE_REVIEW_2026-09-12.md`.

---
severity: P1
category: test-gap
anchor_symbol: runStory
file: scripts/debug/story-sim/story-run.mjs
agents: [codex-codebase-review]
fingerprint: 208eaa408c52
confidence: high
status: fixed-approved
---

**Title**: Campaign simulator retries reuse mutated enemy teams

**Evidence**: foeMons is built before the retry loop. The supplied-object probe retains Blissey at 219/330 HP on a second attempt. Opening, EV adaptation and completion labels also differ from live flow; see review R3.

**Repro**: `node scripts/debug/review-september-2026.mjs`

**Blast radius**: Campaign balance estimates and automated difficulty tuning.

**Fix sketch**: Construct fresh parties per attempt, share legal preparation transactions and reproduce live opening and completion states.

**Verification**: Confirm retries start with pristine battle state and scripted preparation matches actual unlocks and costs.

Full context: `docs/STORY_MODE_REVIEW_2026-09-12.md`.

---
severity: P2
category: inconsistency
anchor_symbol: RIVAL_PROGRESS_PRIMARY_QUOTES
file: battle.html
agents: [codex-codebase-review]
fingerprint: f497e28bcd74
confidence: medium
status: fixed-approved
---

**Title**: Rival and Mystery dialogue contradict live campaign structure

**Evidence**: Phase quotes say Four gyms after three badges, seventh slot with a six-slot cap, and Post-Hall fight before HoF. main.mfBattle promises an extra starter absent from the normal HoF mirror builder.

**Repro**: `Inspect RIVAL_PROGRESS_PRIMARY_QUOTES, main.mfBattle and rollMysteryFigureFinalBossTeam at reviewed commit 62202bde.`

**Blast radius**: Progression guidance and finale expectations.

**Fix sketch**: Derive state-sensitive counts from the campaign and author explicit short-roster and rematch variants.

**Verification**: Validate dialogue against all rival phases and normal/short/legacy Hall-of-Fame rosters.

Full context: `docs/STORY_MODE_REVIEW_2026-09-12.md`.

---
severity: P1
category: bug
anchor_symbol: save
file: battle.html
agents: [codex-codebase-review]
fingerprint: b1c05ec35fc6
confidence: medium
status: fixed-approved
---

**Title**: Failed story persistence has no durable player-visible recovery

**Evidence**: Story save sets _lastSave before localStorage.setItem; its catch logs failure without persistent UI or recovery action. Physical storage-pressure failure was not reproduced.

**Repro**: `Inspect StoryMode save at reviewed commit 62202bde and inject setItem failure in a controlled save fixture.`

**Blast radius**: Progress persistence and user trust after storage failure.

**Fix sketch**: Track successful writes separately and return a result; surface retry/export and keep last-known-good data.

**Verification**: Inject quota errors and verify truthful success timestamps, recovery actions and intact prior saves.

Full context: `docs/STORY_MODE_REVIEW_2026-09-12.md`.

Implementation verification: see `docs/IMPLEMENTATION_REVIEW_2026-09-12.md` and the new progression, interaction, save/recovery and simulator regression suites. The maintainer approved these fixes for merge after reviewing the proposed diff. Campaign acquisition/optional reward modeling and full device acceptance remain explicitly limited.
