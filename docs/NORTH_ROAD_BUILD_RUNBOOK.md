# North Road build runbook

Implementation packet prepared November 18, 2026. Start here when development begins.

## 1. Deliverables and decisions

Build a complete Pallet-to-Crucible release around one promise. Training makes the player stronger, exploring changes what they find, and their partner makes the story personal. The [implementation plan](NORTH_ROAD_IMPLEMENTATION_PLAN.md) explains the design. The [research dossier](STORY_FAN_RESEARCH.md) records what informed it. This runbook defines what to build, in what order, and how to tell when it works.

| Specification | What to use it for |
| --- | --- |
| [Campaign content](north-road/CAMPAIGN.md) | Canonical names, artwork directions, all nine road outcomes, all ten witness chapters, anomaly and villain content, field clues, and the finale. |
| [Combat and encounter rules](north-road/COMBAT.md) | Native Showdown timing, exact authored boss behavior, counterplay, generation legality, retry and regression contracts. |
| [Player experience](north-road/PLAYER_EXPERIENCE.md) | Onboarding through Gym 2, training recommendations, navigation, collection, accessibility, and blind-playtest tasks. |
| [Art, audio, and cinematics](north-road/PRESENTATION.md) | Asset and cue list, scene storyboards, compression targets, source records and accessible fallbacks. |
| [Save and replay contracts](north-road/SAVE_AND_REPLAY.md) | Which state is authoritative, when to write it, legacy and failure behavior, recovery examples, and the first postgame challenge set. |
| [Verification and release](north-road/RELEASE.md) | Build and test commands, test data, package and device runs, actual online staging, release evidence and rollback. |

**Keep these decisions fixed during implementation.**

- Story battles use base level 50 and retain the existing late Experience Share power-up, where the six-unit gift allows up to three levels per Pokémon. Difficulty continues to rise through grade, team size, tactics and builds. Default Story uses generations 1–9 and a single shared transformation per side per battle, with the existing mode-specific settings. Competitive Arena historical formats remain a separate battle rules choice.
- Use the existing town, battle, Pokédex, Notebook, Field Archive and Frontier surfaces when possible. A required objective stays visibly available. Optional discoveries work without familiarity with the franchise or its folklore.
- A city’s geographic identity stays fixed. The seeded leader keeps their own name, birthplace and signature. Geography never determines a roster, route key or progression rule.
- Native simulator results drive battle outcomes. Authored Story rules are explicit about triggers, timing, affected side and expiry. Competitive modes continue to use their declared formats.
- Preserve established rewards, save keys, early gates and postgame balance. A new road or story branch gives a tangible local result. Extra career rewards for replay are records, scene access or cosmetics.
- Use original new copy, assets, arrangements and layouts. Treat fan myths as folklore, with any unreliable artifact contained within the fiction. Keep save and system messages trustworthy.

The current working tree contains earlier game changes. Record the exact snapshot and preserve that work. The implementation baseline must include the actual source and distributables that produced the measured behavior. The previous two-seed playtest is useful evidence. It is neither a clean test run of the future candidate nor evidence from physical devices and real hosted matches. [Previous audit](../agent-state/playthrough/immersion-audit/PLAYTEST-AUDIT.md)

## 2. Work packages in execution order

| Work | Depends on | Build | Accept before moving on |
| --- | --- | --- | --- |
| **01. Set the baseline** | Current source | Record source SHA plus worktree status, versions, existing package hash, build/test commands, active scenario data and a previous published package. Preserve sanitized before-state and gallery for all touched surfaces. Open a separate integration branch or worktree from the intended snapshot when authorized to implement. | Can build the same starting artifact and identify real baseline failures. No overwrites of existing uncommitted work. |
| **02. Set shared state contracts** | 01 | Decide exact data IDs and validators from the appendices. Extend existing save normalization, scoped boss lock and chapter presentation lookup. Add transaction and read-only checks before the content depends on them. | Legacy slot, active slot and backup restore all load. Reopening a scene has no extra write, random draw or award. |
| **03. Prove Flintreach** | 02 | Store stable pilot name and visiting leader label. Add the Route 1 noticeboard state, Iona’s dispatch or Scout result, one contextual action and compressed original art. | Scout, Help and Pass visible before and after Gym in all target layouts. Gold, Ball/Potion grant, Scout habitat, arrival state and next battle match the expected baseline for each path. |
| **04. Prove the first two Gym lessons** | 02, 03 for integration | Improve existing move details, defeat recovery, beginner advice and links. Use the first Gym as one teach-and-test loop. Keep one recommendation per milestone. | A first-time player can choose, prepare and recover from a failed tactic. Technician test verifies Bronzor/Levitate display and lack of an unearned hidden-info hint. |
| **05. Prove Marowak** | 02 | Add native authored timing and the Cubone family profile. Connect actual phase events to the current HUD/log and story/cinematic. | Full stage-legal native win by changing category, full one-category win, and a genuine loss/retry. Pass, reset, immunity, damage and restricted-generation cases all pass. |
| **06. Pilot review** | 03–05 | Ship an internal preview of the three integrated tasks. Compare screenshots and outcomes with the baseline. Run the first blind sessions and revise the copy, controls and combat numbers once informed by play. | Players can explain one real town consequence and boss response. No open save loss, softlock, native rules error or blocked essential control in the slice. |
| **07. Finish the map and roads** | 06 | Apply final names and route subtitles to all displays. Add the remaining road outcome table, landmarks, NPCs, city callbacks and legal habitat guidance. Bring JSON and offline fallback parity into release validation. | All 27 road outcome rows have a visible result and continuing route. Every hub survives legacy imports. Route names, habitat and services agree across HUD, Notebook and arrival. |
| **08. Finish story consequences** | 06, 07 | Implement the 20 Open Circle callback outcomes, the villain and anomaly scene continuity pass and the later witness/payoff props. Retain choice secrecy and story records. | Both choices in every chapter, setup when earlier records are absent, all authored archives, and genuine route/terrain phase order are validated. Primary story remains comprehensible without optional clues. |
| **09. Finish boss families and rematches** | 06, 02 | Add Hypno, Trevenant and Mimikyu, then the remaining four anomaly families. Add the chosen villain and First encounters last. Validate actual stage legality and common reveal language per wave. | Every new profile has an engine fixture, at least one legal actual browser win, a tested retry, and an alternate reasonable response. Reject unavailable or mismatched roster/profile combinations before launch. |
| **10. Finish finale and cinematics** | 07, 08, 09 for final encounter | Add the three-beat recognition, gallery and choice presentation. Commission the original partner/road/finale phrase and finalized portrait/backdrop variants. Hook the actual starter and chosen saved outcome. | Both endings, accepted loss with concealment, rematch, archive replay, started-legacy, traded/boxed/evolved starter, captions, audio mute and landscape all pass. |
| **11. Finish collection and replay** | 07, 08, 10 | Wire reachable habitat hints, existing archive records, one earned keepsake per outcome group, and three versioned offline Frontier challenge entries. | Full PC, empty/current/unavailable habitat, import/export, no duplicate ownership, no growth or economy gain from repeating read-only content. Existing Frontier normal rules still work. |
| **12. Review the whole game** | 07–11 | Play all major surfaces from beginning to end, retest the first two Gyms with fresh players, audit all layouts and original assets, and repair any player-specific problem. | Two blind rounds and feedback changes recorded. Bookkeeping lists which routes were ordinary play and which used diagnostic checkpoints. |
| **13. Certify and publish the candidate** | 12 | Build and test exact package, acquire required physical device runs and controlled staged hosted rooms, rehearse upgrade and rollback, issue release notes and publish only the verified artifact. | Release evidence and owner authorization match the exact source and artifacts under test. An older save survives update and recovery. Real rooms remain consistent through interruption. |
| **14. Check the published build** | 13 | Run fresh home/Continue, new slot, one native Story battle, hosted room smoke with permitted accounts, and offline reopen. Collect reproducible reports and patch the relevant work package if needed. | Live version and bundle match release notes. A reproducible progress-loss or match-state issue triggers the documented response and a regression case before reopening release status. |

Work 03, 04 and 05 can proceed concurrently after the contracts are agreed. Work 08 and 09 can author their content in parallel after the pilot, then integrate against the same source revision. One person or queued patch owns edits to `battle.html` at a time. Keep content and test changes in their owned files and check all previous anchors still exist after applying a monolith patch.

### Start-of-day implementation checklist

1. Read this runbook and the relevant appendix. Use the current symbol index or `rg` to locate the named source entry points. Read bounded sections of the monolith.
2. Capture the baseline fixture before changing its behavior. Record source/engine, build, seed, mode, generations, story gates, built package and browser or device.
3. Change one complete player path at a time. Write its data, read path, persistence path, player copy and focused verification together. Exercise an ordinary setting and a restrictive setting.
4. Run the focused Node tests and packaged browser case, then replay the previous adjacent path. Save screenshots and state evidence, including any setup or controlled outcome.
5. Review errors and UX before widening the rollout. Fix any proven issue and rerun its case. Keep a list of open tuning decisions that genuinely require player evidence.

## 3. Technical orientation

| Area | Start here | Contract to preserve |
| --- | --- | --- |
| Route and hub | `STORY_ROAD_DISCOVERIES`, `_maybeShowRoadDiscovery`, `_roadDiscoveryArrival`, `_rollRoadHabitatEncounter`, `renderCityActions`, `getStoryDisplayTownNameForCityRow`, `data/story/routes.json` | Three choices, stable row ids, one award and existing travel gates, deterministic lawful habitat information. |
| Story chapters | `data/story/adventure-*.json`, `data/story/adventure.js`, `data/story/adventure-progress.js` | Existing `listen` and `act` keys, evidence requirements, read-only replay, separate run and career scopes. |
| Battle and retry | `nativeBattleRules`, `applyNativeBattleView`, `_rollRaidPhaseEffects`, `enterBattleEvent`, `currentEnemyLock` call sites, `scripts/competitive/classic-*.mjs` | Native precision, frozen enemy and RNG identity, Showdown projections, existing fallback behavior for old unprofiled battles. |
| Preparation | `showMoveMenu`, `_cityPrepSuggestion`, `_renderStoryCityMoveMilestone`, `_renderBadgeRecruitment`, `_showStoryDefeat`, `GameUpgrades.openBattleReview` | A new player can train and prepare using basic terms. A recommendation derives from actual available state and moves. |
| Finale | `_fireMysteryRevealThenEnding`, `_resumePostHofNarration`, `main.mfReveal`, `main.ending`, `StoryFx` | Preserve the current accepted-loss concealment, retry path, Remember/Forget keys, original starter proof, and saved scene responses. |
| Delivery | `package.json`, `sw.js`, `scripts/build-offline-asset-manifest.mjs`, `scripts/build-release.mjs`, `scripts/debug/installed-upgrade-playtest.mjs` | Same fully verified content version from source to package, differential caching, offline export and safe activation. |
| Hosted match | `online-pvp.js`, `supabase/migrations`, `tests/visual/online-native-room.mjs` | Revision-aware host-authoritative rooms. Current mock is kept and augmented by staging runs on real networks. |

Check whether a new anchor already exists under another name before adding one. New design data should live next to existing Story data and be straightforward to validate. Keep pure reads separate from rewards. The browser must be able to load the game’s normal entry points with precisely the source that built the release.

## 4. What counts as complete

| Outcome | Required evidence |
| --- | --- |
| A complete adventure | Source and packaged campaign traces, all major gameplay surfaces, two endings and alternate witness branches. Evidence identifies shortcuts. Source comparisons show that the expected facility, grade, story and capture gates still hold. |
| A distinct and fair boss suite | Versioned authored encounter list, stage-legal winning teams and normal action traces, replay and retry equality, form/ability/narrow generation cases, and no mode bleed. |
| A humane horror story | Full cue sheets for the 10 Open Circle scenes, 10 villain tracks and eight anomalies, a visible outcome for all 27 road choices, and evidence that the central payoff is understandable without fan lore. |
| A modern interface | First-time players can find onward actions and understand an early loss. Experienced players can reach meaningful detailed information without redundant steps. Keyboard, browser zoom, captions, mute, actual touch and short landscape work through real flows. |
| Stable delivery | Clean full test run on the final candidate, source/packaging harmony, old save recovery, repeatable offline updates, low-storage handling, actual device and staging evidence, and rehearsed rollback that preserves player data. |

Keep a brief decision record per work item. Record scope, release impact, actual behavior, tests, screenshot or trace path, and explicitly any unverified platform or edge case. Estimates, tentative names and difficulty targets in the design are accepted as working defaults. Validate them with stage-legal play before bulk rollout.

## 5. Risks to resolve early

| Risk | Response |
| --- | --- |
| Story additions change a seeded encounter or reward by viewing a screen. | Make render helpers pure. Compare equivalent before/after save and RNG snapshots. Commit one canonical choice and use it to derive the town, side note, and archive variant. |
| Fixed raid species bypass a restricted run’s generations. | Check lawful options before committing a track or roster. Author explicit substitutes with matching copy. Use neutral lawful continuation if no such option applies. Preserve the frozen pre-update lock for a controlled legacy retry. |
| The current boss timer advances before the player reads the warning. | Apply rules in native completed-turn order and publish state before next choice. Separate mechanically pending and active state in view tests. |
| More instructions overwhelm a phone player. | Reuse the one objective and staged help structure. On the smallest viewport, always test the first tap, the last action, the focus return, and whether older and longer text pushes the primary action out of reach. |
| Added art, audio and story data inflate the standard download. | Use measured budgets and only load the assets the current scene needs. Keep the package manifest and cache delta test part of the change. |
| Browser automation passes while actual players are lost. | Require blind sessions for early preparation, boss tells and consequence recall. Verify actual device installation and audio by hand. |
| A change passes independently but breaks another change when merged. | Sequence monolith patches, compare current anchor signatures and both summary and raw reports. Re-run all affected paths on the exact release candidate. |

**First implementation task:** Work 01 builds the baseline and opens the first three pilot fixtures. Each later work item has a clear acceptance condition. Candidate publication follows the release procedure in the verification appendix.
