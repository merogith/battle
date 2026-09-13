# Game-wide upgrade backlog

Repository: `merogith/battle` · baseline `62202bde7f43df0af00e4d037c5954736310c6c6` · 12 September 2026.

This extends [the first review](STORY_MODE_REVIEW_2026-09-12.md). It covers product direction, existing systems to improve, potential additions, and verification that can proceed without a local preview. No game behavior has been changed. No new visual, device, or live multiplayer observations are claimed.

**Recommendation:** make the game easier to understand, more trustworthy, and more expressive before increasing its size. The campaign should develop the player's skills alongside their team. Experienced players should find depth in decisions, counterplay, and build experimentation.

## Additional findings from the source

These are observations of the reviewed commit. Recommendations below are proposals, not assertions that a feature is wholly absent.

| Existing behavior | Evidence | Implication |
|---|---|---|
| Mentor already builds a priced, stage-aware plan per Pokémon, with component opt-outs and vouchers | `enterMentor`, `renderMentorTeam`, `_txBuildFastBuildPlan`, `tutorApplyFastBuild` | Extend it with whole-team context and teaching; another auto-build NPC would duplicate it |
| Switch prediction examines actual living player bench Pokémon, their moves, PP and effective speed | `aiPredictPlayerSwitchIn` | Define what the AI may know. This code is not evidence that it reads the player's pending input, but it does use actual bench information |
| Difficulty changes move-selection randomness and prediction strength as well as stats | `AI_DIFFICULTY_PARAMS`, `aiSelectScoredMove` | Preserve this existing axis. Choosing the highest heuristic score is not proof of perfect competitive play |
| Standard defeat recap reports the opponent/event and numbers left standing | Defeat branch writing `story-gameover-desc` and `story-gameover-team-recap` | Expand this recap into evidence-based explanation and an affordable next action |
| Save export and broken-save recovery are under Developer / Story tools | `modal-settings`, `__exportStorySave`, `__recoverBrokenStorySave` | Move ordinary player data management into a clear Save & Recovery section |
| The exporter copies only `pbs_story_save`; cross-run records use `pbs_story_meta`, and settings are separate | `SAVE_KEY`, `SAVE_KEY_META`, `__exportStorySave` | A complete device-transfer backup must explicitly include the run, collection/meta, settings and format version |
| Recovery restores the broken blob; it catches a failed write and still displays a restored message | `__recoverBrokenStorySave` | Reattempting a broken save is different from restoring a healthy checkpoint. Validate the payload and report actual write success; this path was source-reviewed, not failure-injected here |
| Debug battle outcomes, save-changing tools and normal recovery actions share a settings subsection | Settings markup and exported debug functions | Separate development tools from player support. Audit actual gates before treating all entries as equally reachable or destructive |
| An unavailable Online PvP hint contains Supabase and SQL setup instructions | `online-setup-hint` | Production players need service availability and a useful next action; configuration belongs in maintainer documentation |
| Achievements already include collection, milestone, challenge and lifetime goals | `STORY_ACHIEVEMENTS`, `openCollection` | Improve variety and wording. Several goals overlap; “No Death Run” is described as no lost battles, which should be distinguished from no fainting |
| Offline caching, differential asset downloads, update notices and battle-aware reload deferral already exist | `sw.js`, `__maybeSwReload`, `__maybeShowShellUpdate` | Extend these systems with release consistency and storage management; do not propose offline support as a new feature |
| Team diversity and legal build safeguards have already been improved | `enforceRoleSpread`, move-stage gates, current build-diversity suites | Improve coherent strategies and useful variety instead of repeating old “all foes have four STAB moves” findings |

## Product and rules identity

Write a short player-facing promise: a story-led, strategic singles adventure with a largely level-50 team-building progression and clearly identified custom mechanics. Explain the bounded level exceptions and permanent upgrades when they become relevant.

Provide two layers of explanation using the same rules: a plain-language summary and optional exact details. A novice should understand “this nature trades physical damage for speed”; an expert should inspect the exact effective stats and all modifiers. Show whether a displayed stat is base, trained, currently modified in battle, or scaled by the encounter.

Publish a versioned rules summary covering generation behavior, singles targeting, move availability, gimmick limits, bag items, enemy bonuses and custom awakened builds. Update tooltips, recommendations, tests and patch notes from the same definitions. Classify deliberate deviations separately from defects.

Actual VGC doubles is a possible future format, with targeting, spread damage, ally abilities, simultaneous replacements and its own AI. It is a large separate project, not an inexpensive switch to make the current campaign more competitive.

## Coverage across the game

| Area | Update or extend | Addition worth considering | Success condition |
|---|---|---|---|
| Opening and returning play | Practical tutorials, expert skip, current objective, clear next service | Guided first preparation; “since you last played” recap | Players can start or resume without consulting an external guide |
| Town navigation | Service-purpose labels, consistent back navigation, useful lock explanations | Compact journey map linking known objectives and facilities | Players know where they are and why a destination matters |
| Story and dialogue | State-correct prose, distinct voices, motives and consequences | Persistent NPC callbacks and a spoiler-aware mystery notebook | Every required beat has a clear action and every major setup has a payoff |
| Pacing | Reduce repeated introductions, menus and mandatory reading | Optional short tactical encounters or town problems between major battles | Story, preparation and battle alternate deliberately |
| Battle clarity | Explain priority, speed, weather, terrain, hazards, status and failure reasons | Expandable “why did this happen?” event details | Players can identify the rule responsible for an observed outcome |
| Engine correctness | Fix reproduced defects; exact damage/event-order contracts | Supported-entity matrix and deterministic regression corpus | Every offered mechanic has evidence or an explicit limitation |
| AI and bosses | Information policy, coherent strategies, switch restraint, gimmick timing | Boss scouting notes and recognizable tactical personalities | Difficulty comes from readable strategy and competent execution |
| Team building | Extend Mentor beyond individual optimized sets | Whole-team role/weakness analysis and budget-aware upgrade plans | Advice improves team function and preserves intentional choices |
| Moves, items and stats | Compare before/after, explain custom effects and unlocked alternatives | Build templates and a searchable, contextual reference | Players can experiment without memorizing every system |
| Catching, evolution and PC | Clear eligibility, retention of upgrades, party/storage actions | Favorite protection, collection filters and encounter notes | New catches are usable and important Pokémon are hard to discard accidentally |
| Economy | Audit all income, costs, vouchers, retries and reward timing | Visible shopping plan and recovery options after poor spending | No mandatory progression deadlock or unexplained money sink |
| Camp and side activities | Explain rewards and provide equivalent accessible interactions | Relationship scenes tied to actual shared milestones | Optional activities add character without becoming compulsory chores |
| Saves and continuity | Truthful save state, full backup/import, safe recovery | Multiple slots, rotating checkpoints, later optional sync | Progress survives expected interruptions and transfer is understandable |
| UI consistency | Shared shells, buttons, cards, dialogs, tooltips and terminology | Simple and detailed information modes | The same action has the same meaning and presentation everywhere |
| Accessibility and input | Keyboard paths, focus restoration, readable text, touch alternatives | Remappable controls and explicit motion/text preferences | Essential actions do not depend solely on hover, color, sound or fine pointer timing |
| Art, animation and sound | Unified sprite framing, scene palette, move-event timing and mix | Character expressions, signature boss entrances and musical themes | Effects communicate the battle and strengthen story moments |
| Performance and offline | Measure boot work, bound caches, handle missing assets, consistent releases | Download packs and a low-effects preset | Long mobile sessions remain responsive and offline availability is truthful |
| Replayability and collection | Distinct achievement goals, meaningful Hall-of-Fame records | Seed challenges, boss rematches, challenge presets and cosmetic mastery rewards | Repeat runs offer different decisions and goals |
| Multiplayer and social | Clear room states, version compatibility, reconnect/timeout behavior | Friendly rematches and shareable run/team summaries | Participants agree on rules and outcomes; disconnections are understandable |
| Support and maintenance | Reproducible bugs, current docs, safe release gates, bounded modules | Exportable bug report and an in-game changelog | Reports are actionable and releases can be traced and rolled back |

## Most valuable feature designs

### 1. Trainer's Notebook

Unify the existing objective, journal, tutorial and collection entry points around four questions: **What next? What did I learn? What can I change? What am I investigating?** Keep the visible view short, with optional deeper pages.

Include the next required action, newly unlocked service, a brief recap, discovered battle concepts, and unresolved clues. Link only to reachable destinations. Preserve mystery spoilers until discovered. An expert should be able to collapse guidance without disabling useful run information.

### 2. Battle explanations and defeat coaching

Build explanations from structured engine events rather than interpreting prose logs. Record relevant effective speed/priority, damage modifiers, activation and suppression reasons, weather/terrain changes, and resource consumption.

After a loss, show a few observed causes and one or two available responses. For example: “Your lead moved second and was knocked out before attacking. You currently have a faster bench option.” Link to that Pokémon or to an affordable training service where appropriate.

Do not present a guess as the decisive cause. Distinguish a demonstrated immunity from a possible better line. Do not reveal hidden opponents or future story battles through coaching. Full damage-roll details can live in an optional expert view or practice environment.

### 3. Team-aware Mentor

Preserve the existing per-Pokémon plans, selective purchasing and vouchers. Add team context: physical/special balance, defensive switch-ins, shared weaknesses, speed control, hazard management and a coherent way to win. Do not insist that every team fills a generic checklist; offensive and defensive archetypes legitimately differ.

Offer a small set of reasoned changes at different costs. Respect protected moves, favorite Pokémon, current role and intended gimmick. Explain what an alternative gives up. Audit recommendations for legality, current-stage availability, custom mechanics and statistical relevance; build frequency is not synonymous with best fit for this particular team.

### 4. Practice Lab

Turn selected debug capabilities into a safe player-facing learning mode with isolated state. The existing Story team tester previews generated teams; it is not a complete guided tactical lab.

Start with short scenarios for switching, priority, status, setup, hazards and weather. Permit reset, alternative choices and exact explanations without changing the campaign save, inventory, achievements or RNG. Advanced users can test a team or reproduce a matchup with a chosen seed and ruleset version.

A full arbitrary battle editor is a later extension. The first version should teach a handful of concepts reliably.

### 5. Preparation plan and safe experimentation

Show a before/after build, total price, vouchers used, unlocked components and items remaining. Extend this into a persistent shopping plan across NPCs. Let users reserve a desired upgrade without treating a reservation as a purchase.

Consider reversible drafts and build templates before general transaction undo. An undo system must restore exact costs, rewards and related state; it must not permit farming discounts or duplicating items. Templates are intentions, not free unlocked builds: applying one still validates legality and charges actual costs.

### 6. Boss scouting and rematches

Give each major boss a strategic identity: what their team tries to accomplish, a signature member, a readable threat and available counterplay. Reveal only information justified by the story and rules. Scouting can disclose an archetype without exposing every move.

Keep ordinary opponent generation internally coherent; do not silently counter-pick the player's latest edits. Any rival adaptation should be intentional and understandable. After completion, offer rematches with changed strategies or optional rule modifiers and clear records of which rules were used.

### 7. Run passport and replay sharing

A shareable run record can contain seed, game/rules/data version, difficulty, generation restrictions, active challenge rules, story tracks and Hall-of-Fame team. A seed alone cannot reproduce a run after the rules or data change.

Start with a local export and a compact share card. Full turn replays require initial state, player decisions, RNG state and supported replay-version handling. New daily/weekly challenges should have an archive so they remain playable later; they should not require a service before the core campaign is reliable.

### 8. Player data center

Offer **Save status, Back up, Restore, Manage slots, and Storage** with plain-language consequences. A full export needs a versioned envelope covering the run and chosen cross-run/settings data; allow the player to inspect what an import will replace.

Keep healthy checkpoints separately from diagnostic broken-save blobs. Test failed writes, concurrent tabs, duplicate imports, malformed payloads and interrupted migrations. Start with dependable local transfer. Optional cloud sync comes later with explicit conflict resolution, rather than silently overwriting the most recent session on another device.

## Story and challenge upgrades in greater depth

Preserve the gym journey, recurring rival, rotating villain and extra-mystery tracks, The First and the Hall-of-Fame mirror. Update all 18 rotating arcs through a shared editorial template: motive, clue, player action, consequence, battle connection, resolution and callback. Validate the 80 pairings for structural collisions and incompatible claims.

Give towns recognizable identities through their people, problem, visual theme and service introduction. Revisit a few NPCs after local events so victories change something tangible. Prefer small state-aware consequences over a sprawling branching plot that is costly to write and test.

Let choices express character even when they reconverge. Promise consequences only where code and later text support them. Separate optional disturbing lore from essential navigation; consider an intensity preference that shortens graphic descriptions without removing the clues needed to progress.

For the difficulty curve, evaluate **power, tactical complexity, information, available tools, economy, and recovery cost** separately. Existing AI difficulty already changes decision selection; determine whether those changes produce intended behavior rather than merely relying on the constants. Do not label a strongest-scored heuristic “perfect AI.”

Check opening seeds, constrained-generation runs, small parties, unusual starters, unfavorable type combinations and short Hall-of-Fame teams. Advanced strategies should emerge before the League; they should have clear counters before becoming mandatory knowledge. Expert challenge should reward planning and adaptation without requiring undocumented bonuses or an external spreadsheet.

Rewards should open decisions: a useful move, an alternative role, a new service or a meaningful choice. Audit when collectibles, side currencies and camp bonuses become necessary for the advertised difficulty. Vary encounters and optional objectives before adding more raw battles to the already substantial campaign.

## Visual and technical work that does not require a preview

We can define the design system, rewrite text, inventory screens, trace state transitions and implement components from source. We can verify DOM structure, labels, handlers, data dependencies and many navigation invariants in jsdom. This establishes useful structure, not rendered usability or visual quality.

For animation, define one event-to-presentation contract. Damage, fainting, switching and rewards must resolve identically at normal, fast, instant and reduced motion. Separate cosmetic randomness from gameplay randomness. Plan impact families, restrained boss cinematics, consistent sound categories and fallback assets. Existing speed and volume controls should be retained and tested for consistent application.

For performance, inspect large synchronous work, repeated parsing and DOM reconstruction, listener/timer cleanup, sprite fallbacks and cache growth. Measure headless engine cost separately from rendering cost. Offline updates should activate compatible code and data together; do not claim the existing best-effort multi-file refresh is an atomic release without testing interrupted updates.

For architecture, incrementally extract pure stats/damage, entity data, transactions, narrative state and shared UI. Add narrow interfaces around global state. Use one transaction contract for NPC purchases and one event contract for battle presentation. Keep old-save fixtures through each extraction. A full rewrite would multiply the regression surface before improving the player experience.

For data upkeep, pin canonical input versions, record provenance, validate imports and show a human-reviewable data diff before release. Keep asset attribution and dependency notices organized. These are maintenance tasks, not a claim about any particular legal permission.

For support, provide a user-initiated bug export containing version, mode, seed, recent actions, structured battle state and errors, with sensitive connection tokens excluded. Do not automatically transmit the player's save. Show short actionable error states for failed loading, unavailable multiplayer, failed persistence and interrupted downloads.

## Verification without local preview

| Check | What it can establish now |
|---|---|
| Exact reference mechanics and edge-case fixtures | Damage rounding, effective stats, ordering and move/ability/item interactions within the declared ruleset |
| State-machine and property tests | Legal transitions, reward-once behavior, legal builds, nonnegative resources and no stuck pending action |
| NPC transaction matrix | Entry, unlock, selection, cost, voucher, confirm, cancel, repeat and failure behavior |
| Save fixtures and injected storage failures | Recovery correctness, old-version compatibility, import safety and truthful success state |
| Story graph and content validation | Reachability, objective destinations, arc compatibility, variable substitution and completion branches |
| Repaired campaign simulator | Reproducible difficulty and economy evidence under legal preparation and defined player skill |
| DOM and static accessibility checks | Control names, relationships, semantic structure, key handlers and focus-management code paths |
| Asset and release checks | Missing mappings, manifest consistency, version agreement and required deployment gates |

Pixel layout, contrast as rendered, touch accuracy, actual screen-reader behavior, browser paint performance and real-device suspend/resume remain separate acceptance work. Source review cannot certify them.

## Prioritized delivery backlog

Effort is relative scope, not a calendar estimate: **S** bounded change; **M** several connected screens/systems; **L** foundational or cross-cutting; **XL** a separate major project. Items are not additive commitments.

| Order | Work package | Effort | Dependency |
|---|---|---|---|
| 1 | Form-stat and gender fixes; simulator fidelity; save failure truthfulness | L | First review reproductions |
| 2 | Explicit mechanics/AI information policy and supported-entity inventory | M | Agree canonical/custom boundaries |
| 3 | Shared objectives, NPC purposes, recovery tools and first-session teaching | M | Reliable progression and transaction state |
| 4 | State-correct rival/finale text; player-facing terminology cleanup | S–M | Current narrative state model |
| 5 | Whole-team Mentor, defeat explanations and budget-aware preparation | L | Rules correctness and structured battle events |
| 6 | Shared UI foundations, navigation and accessibility paths | L | Component inventory and interaction contracts |
| 7 | One complete town/story pairing, then remaining campaign content | L | Writing template and shared UI |
| 8 | Calibrated progression, curated boss strategies and meaningful rewards | L | Repaired simulations and earlier gates |
| 9 | Animation families, signature scenes, sound polish and performance budgets | L | Stable battle event contract |
| 10 | Full backup/import, checkpoints and save slots | M–L | Save envelope, migrations and atomic transactions |
| 11 | Practice lessons, rematches, challenge presets and run sharing | M–L | Stable rules and isolation from live saves |
| 12 | Cloud sync, ranked competition, full doubles, large new regions | XL | Separate product decisions and support capacity |

The best first experience milestone is a polished path from **new game through the first gym**, including one loss and recovery, one meaningful upgrade, a save/reload, and expert tutorial skipping. Use that path to establish the standard for the rest of the campaign. It should ship with mechanics repairs and regression evidence, rather than postponing player-facing clarity until every optional feature is built.

Avoid committing to all additions at once. The strongest near-term additions are the integrated Notebook, team-aware Mentor, battle explanations, safe Practice Lab and complete backup/restore. They directly address the reported beginner confusion and expert distrust while supporting the existing story identity.
