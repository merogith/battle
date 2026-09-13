# Story and mechanics upgrade — implementation review

Repository: `merogith/battle` · baseline: `62202bde7f43df0af00e4d037c5954736310c6c6` · proposed version: **1.8.0**.

The maintainer approved the reviewed implementation for merge with “merge pls”. This report records the tested implementation snapshot; the Git history and Actions run record its commit and deployment. The diff-level approval required by `CLAUDE.md` has been received. The earlier review and backlog describe the original baseline; this document records implementation progress against them.

No local preview or browser/device testing was used. This is a substantial repair and usability release, **not a claim that every mechanic is certified or that the entire long-term backlog is complete**.

## What changes for players

### Clearer direction and preparation

- The **Trainer Notebook** connects the current objective, available town services, team advice, story recap and rules. It is reachable from town guidance, the former Journal button, Settings, Mentor and defeat recovery.
- Town buttons explain the purpose of the NPC, rather than relying only on names. The Notebook explains access requirements and invokes existing facility entry points.
- Team advice identifies shared weaknesses without natural switch-ins, damage-category concentration and common speed-control options. Exact trained stats, nature, ability, item, moves and EVs are inspectable. Existing Mentor quotes and selective purchases remain authoritative.
- Eight optional practice lessons teach type matchups, switching, priority, categories, Choice Scarf, setup counterplay, Unaware and team planning. Lessons do not mutate campaign progress or RNG. These are interactive questions; a playable arbitrary battle laboratory remains future work.
- Defeat recovery links to a battle review and the team plan. The review displays recent calculation records and battle messages. It distinguishes calculated damage from final damage after survival, fixed-damage and custom overrides. It does not pretend to infer a proven winning line from a short log.

### Story revisions

- `data/story/narrative-revision.json` revises **36 scenes across all 18 optional villain/mystery arcs**, concentrating on introductions and endings: clearer motives, player agency, consequences and emotional resolution.
- The narrative overlay preserves scene identity, choices, conditions, rewards, branches and speaker framing. Reapplication is idempotent.
- Rival/finale text no longer claims four badges at the three-badge encounter, a seventh party slot, or an extra finale starter that the actual Hall-of-Fame mirror does not create.
- The central campaign, randomized track structure, mystery identity and existing post-game are preserved. This is not a rewrite of every dialogue line or a new region.
- The achievement formerly labeled “No Death Run” now reads **Unbeaten Journey**, matching its existing no-lost-battles condition. Its persistent ID is preserved.

### Safer progress and collection

- Saving reports success only after the primary storage write succeeds. Failure leaves the previous save and success timestamp intact, with persistent retry/export actions.
- Full backups include the run, collection records, settings and accessibility preferences. Connection tokens are excluded.
- Import validates structure, versions, unsafe object keys, party/storage entries, move lists, progress and numeric boundaries. A transaction journal rolls back partial multi-key writes and recovers interrupted imports before settings/save hydration.
- An active battle cannot be replaced by an import. A restored run cannot be overwritten by old in-memory state before reload.
- Three manual backup slots and two rotating healthy checkpoints provide recovery choices. Existing broken-save recovery now uses the same review and validation path.
- A save change from another tab blocks stale writes and explains how to back up/reload.
- Party and PC favorites are protected from selling/releasing. Delayed confirmations re-resolve stable identities; reordered storage and duplicate sale confirmations cannot remove the wrong partner or award money twice.
- Direct EV purchase/vitamin/redistribution actions enforce their actual facility gates.

### UI, reading and motion

- Notebook, practice, recovery and support use one responsive dialog/card/button system with wrapping layouts, safe-area padding, keyboard dismissal, focus trapping/restoration and inert background screens.
- Existing screens receive visible keyboard focus and larger touch targets; coarse-pointer inputs use readable sizing.
- Optional readable font, larger story/Notebook text, reduced motion and untimed camp activities are available in Settings. Untimed camp preserves the existing successful-activity reward and resolves cancellation exactly once.
- Story/camp motion checks read the current preference rather than a startup-only snapshot.
- Online unavailability text is player-facing; database setup instructions are removed from that player flow.

These are source- and DOM-verified foundations. They do not certify every old screen, rendered contrast, screen-reader behavior, touch ergonomics, animation timing or tablet layout. No new sprite library, boss cinematics or soundtrack was produced in this batch.

## Mechanics repaired

| Area | Corrected behavior | Main regression evidence |
|---|---|---|
| Form stats | Mega/Primal/weather/Palafin/Transform reversion share persistent stat calculations; progression, nature, EV/IV, relationships and encounter modifiers survive without compounding; fainted Pokémon are not revived | `progression-mechanics-regression.test.js`, transformation suites and stat probes |
| Species gender | Canonical fixed genders and ratios; valid saved mixed-species genders retained; impossible fixed-species assignments corrected | Full bundled fixed-gender comparison against `@pkmn/dex` |
| Ability bypass | Defensive Fluffy/Dry Skin/Punk Rock/Fur Coat and related modifiers honor bypass; ability protection and item suppression use shared checks | `ability-item-interactions-regression.test.js` |
| Stat stages | Unaware ignores relevant positive and negative stages; Psyshock-family Defense handling distinguishes Defense items/abilities from Special Defense ones | Interaction regressions and damage differential sweep |
| Item multipliers | Klutz suppresses applicable damage/speed effects, with canonical Ability Shield/training-weight exceptions; Silk Scarf applies once; Metal Powder is untransformed Ditto Defense only | Interaction regressions |
| Charge | Charge and Electromorphosis use one shared 2× effect and consume it once | Interaction regressions |
| Screens | Matching screen and Aurora Veil do not multiply together | Physical and special regressions |
| Physical modifiers | Guts is physical only; toxic poison qualifies for Toxic Boost; physical source-stat overrides retain applicable source modifiers | Interaction and damage regressions |
| Sheer Force | Canonical secondary metadata replaces false move lists; boost/suppression share scope; primary self effects and defender contact reactions remain independent | Positive/negative move examples and contact regressions |
| Additional effects | Shield Dust, Covert Cloak, bypass, primary effects and self effects are distinguished; breaking Substitute still protects the target for that hit | Acid Spray, Power-Up Punch, Clear Smog, Salt Cure and other regressions |
| Type conversion | Liquid Voice, Normalize and the Normal-converting abilities resolve before immunity/effectiveness; Struggle/type-locked exceptions retained | Converted attacks against Ghosts and absorption abilities |
| Weather | Snow Warning, Snowscape and Chilly Reception set non-damaging Snow; Snow Defense, Ice Body, Slush Rush, Snow Cloak and Aurora Veil recognize it; deliberate Hail sources remain Hail | Field tests and Snow Warning reference probes |
| Terrain/weather defense | Grass Pelt applies to Defense; Snow applies to Defense-targeting special attacks; Utility Umbrella uses the correct holder for weather damage effects | Interaction regressions |
| Gender moves | Captivate checks gender and Oblivious before dropping Special Attack, rather than taking a generic stat-drop shortcut | Gender/bypass cases and reference probe |
| Healing | Life Dew/Jungle Healing recover one quarter; Jungle Healing cures status; Shore Up retains half recovery in rain | Explicit HP/status regressions |
| Substitute/multi-hit | Follow-up hits continue after Substitute breaks; Knock Off cannot remove an item through the substitute hit; damaging phazing respects Substitute | Interaction regressions |
| Primary self changes | Headlong Rush drops each defense once; Clanging Scales and Scale Shot retain metadata-driven primary changes | Substitute/Sheer Force cases and reference probes |
| Callback secondaries | Dire Claw now applies its random poison/paralysis/sleep effect; Secret Power changes its effect with terrain | Forced-roll, protection and terrain regressions |

Frustration's documented fixed 102 power is an intentional project rule and remains unchanged. Reference disagreement alone is not sufficient reason to erase an approved custom mechanic.

## Campaign scaling: corrected measurement, tuning still open

The simulator previously made the curve look more forgiving by reusing damaged enemies on retries and granting preparation benefits the player had not bought. It now:

- Builds both teams afresh per attempt, recording starting HP/status/PP for invariant checks.
- Uses a one-partner opening; adds the tutorial partner after opening resolution.
- Uses actual evolution eligibility, costs and Mentor transactions, plus shared battle EV rewards. No free EV adaptation or flat per-win gold grant remains.
- Keeps caught encounter builds instead of replacing their IV/build characteristics.
- Separates player battle skill from campaign difficulty.
- Uses the same rival-concession state transition as the live game, including the all-gold forfeit. A lost rival battle is not automatically labeled a progression wall.
- Resets run state/RNG for reproducibility and uses explicit Hall-of-Fame/mystery/incomplete outcomes.

Six normal-difficulty diagnostics (items off, seeds 1 and 2) produced:

| Preparation policy | Seed | Last failed required fight | Badges | Battles attempted | Invariant violations |
|---|---:|---|---:|---:|---:|
| Casual | 1 | Gym Trainer 1, timeline index 4 | 0 | 3 | 0 |
| Casual | 2 | Gym Trainer 1, timeline index 10 | 1 | 7 | 0 |
| Recommended | 1 | Basic Trainer, timeline index 13 | 2 | 9 | 0 |
| Recommended | 2 | Gym Leader 3 | 2 | 12 | 0 |
| Optimal | 1 | Gym Trainer 1, timeline index 23 | 3 | 16 | 0 |
| Optimal | 2 | Gym Leader 3 | 2 | 12 | 0 |

These are diagnostics, **not player win rates**. Catch acquisition, optional rewards, preparation choices and player tactics remain approximations. No end-to-end completion proof follows from this sample. The live mystery finale also permits a concession that this battle diagnostic does not model.

The repaired harness exposes preparation/economy pressure worth investigating. It does not justify choosing new enemy multipliers blindly. `CLAUDE.md` explicitly leaves HP curves, multipliers, catch percentages, gold and retreat costs to the maintainer; those tuning numbers have not been silently changed.

Next balance acceptance work is a representative seed matrix with actual optional-reward/capture paths, novice/recommended/expert preparation budgets, first-gym loss/recovery, all eight gyms, League and both finale outcomes. Record available affordable responses at each loss before proposing particular numerical changes.

## Release safeguards

- `build:release` verifies every manifest hash and emits an allowlisted `dist/` artifact. Development files, tests and dependencies are excluded from the deployed artifact.
- The offline manifest binds its version to release content. New assets are included, and stale manifests fail the build.
- Service-worker activation requires complete, hash-verified core files. Partial download/storage failure does not activate an incomplete release.
- Core assets are immutable within a release. Bulk download progress is not marked applied after failed cache writes, so failed assets remain retryable. Runtime caching is bounded.
- GitHub Pages deployment depends on the reusable quality workflow: tests, data validation, move audit, lint and release verification. Historical spec drift remains a visible informational report.

## Verification and its limits

Final checks passed on the reviewed code snapshot (Node 24 locally; CI targets Node 22):

| Check | Result |
|---|---|
| Full `npm test` | **2,631 passed, 0 failed, 35 existing TODOs**; 2,666 reported tests |
| Required reference contracts | **21/21 passed** |
| Damage comparison | **0 unexpected divergences / 53 scenarios**, 12 seeds each |
| Data validation | **0 findings / 17,399 builds** |
| Lint | **0 errors**, 22 existing warnings |
| Move dispatch audit | 0 unhandled entries; dispatch coverage is not behavioral certification |
| Verified static artifact | **8,254 files**, release `battle-v5-828dc46a6e15` |
| Six campaign diagnostics | **0 structural/accounting-related test failures**; no completion-rate claim |
| Whitespace / patch check | `git diff --check` clean |

See [verification-summary.json](review-evidence-2026-09-12/verification-summary.json), [final-tests.log](review-evidence-2026-09-12/final-tests.log), and [the review diff](review-evidence-2026-09-12/implementation.patch). The patch contains tracked implementation changes and new source/test files; generated asset manifests and diagnostic reports are kept separately to make the behavior diff readable.

The broad reference sweep covers **3,070 scenarios**, including 762 move, 311 ability and 532 item entities. A passing generic probe is not exhaustive interaction coverage. The generated inventory still lists 52 moves needing targeted probes, 24 moves untestable by its generic harness, one item requiring another harness, and 173 out-of-scope entries. Some of these already have separate manual tests; the labels describe the automatic sweep's capabilities.

The initial broad sweep found eight high-confidence flags, including the now-repaired Snow Warning and Captivate defects. A subsequent sweep reduced this to four flags: Frustration (intentional rule), Moody, Acupressure and Metronome (random selection comparisons). Lower-confidence review also found and fixed Headlong Rush, Clanging Scales and Dire Claw; the added forced-roll suite exercises all 45 chance-effect move flags. Headlong Rush and Clanging Scales have separate post-fix reference results. These classifications do not certify every probability distribution or complex event ordering.

Existing tests were updated only where the implementation deliberately changes behavior or invalid fixtures were exposed: canonical Snow, truthful achievement/button labels, actual `{name, build}` save slots and the City 3 redistribution gate. The regenerated city golden has 194 changed **text leaves only**, with no structural changes. Historical baseline probe evidence is preserved separately from implementation results.

## Remaining backlog, explicitly not marked complete

| Work package | Current status | Remaining acceptance/work |
|---|---|---|
| Core repair and recovery | Implemented, regression tested | Broader combinatorial mechanics and real storage/device interruption testing |
| Objectives, NPC guidance and Notebook | Implemented | Observe true first-time and returning players; prove no confusing mandatory route |
| Story updates | 36 optional scenes plus core continuity corrections | Full campaign editorial/playthrough pass and additional state-sensitive NPC callbacks |
| Team coaching | Whole-team heuristic advice plus existing priced Mentor | Budgeted alternative plans and evidence-driven tactical defeat coaching |
| UI consistency and motion | Shared new surfaces and cross-screen input/accessibility changes | Migrate remaining legacy screens; rendered desktop/phone/tablet and assistive-tech acceptance |
| Difficulty and boss strategy | Trustworthy retry/preparation measurement | Calibrate a full journey; approve any new numerical curve; curated strategy and AI-information policy |
| Art, animation and audio | Motion preference behavior improved | New animation families, signature scenes, expression assets and sound mix work |
| Practice and sharing | Eight lessons, passport and diagnostic export | Playable isolated Battle Lab, full deterministic replay, challenge presets |
| Online | Friendly availability copy and existing security tests | Live two-client reconnect/version/latency acceptance |
| Large additions | Not implemented | Cloud sync, ranked play, VGC doubles and new regions are separate projects |

The next shipping decision is approval of the concrete behavior diff, not a claim that those remaining projects are already delivered.
