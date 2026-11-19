# Pokémon Arena Full Overhaul Plan

Build a complete opening from Pallet through Gym 1, prove it on real devices, then bring the remaining campaign, competitive modes, and distribution up to that standard. The finished game should make it easy to start an adventure, give players a world worth exploring, and grow from a recoverable starter duel into the demanding League the game already aims for.

The baseline browser playtest reached all 25 shell screen types and 16 of 17 dialogs. It reached the Crucible and covered shops, training, catching, branching endings, local PvP, and save transfer. The campaign driver played real opening turns and used controlled wins for long encounters. Competitive Arena has a separate browser pass. [Playtest workflow](PLAYER_PLAYTEST.md) · [Technical deep dive](BATTLE_DEEP_DIVE.md)

## Implementation checkpoint

| Area | Built and exercised | Remaining release gate |
| --- | --- | --- |
| Onboarding and presentation | Pallet cold open, first-command guidance, compact City HUD, legal starter previews, Gym recovery paths, chapter cinematics, authored move cues, and responsive battle and facility layouts | Observe unprompted first-time play, pacing, comfort, and accessibility on players’ devices. |
| Exploration and collection | A saved three-way decision on every road, detours and town callbacks, Pokédex access from a catch, acquired-form detail, road and ending achievements, two ending choices, and repeatable Crucible challenges | Measure which goals players independently discover and return to over multiple runs. Expand coverage of rare achievement and event combinations. |
| Save and randomness | First-visit gifts, captures, and results survive reload. A native Story timeline fight restores its last committed move or replacement prompt. Legacy or incompatible saves can restart the original encounter. | Expand the cross-version and device-interruption matrix. |
| Competitive rules | The bundled Showdown engine ran 19 Arena configurations, including singles and doubles. Story, draft, Quick Battle, and local PvP use the native engine in the browser fixtures. Mocked rooms cover draft, turns, rematches, and reconnect. | Exercise hosted multiplayer, expand edge-case combinations, and confirm the encounter-specific battle pacing with players. |
| Delivery | The public title opens before the gameplay document. The Compact and Full packages share the complete game. Tests exercised a complete offline campaign and save-preserving differential updates. | Test installation on physical devices and secure distribution tooling for signed standalone builds. |

Run the same player path after each milestone and retain new seed and format evidence when rules or story content change. Automated coverage is one criterion for a release. Hands-on difficulty, accessibility, installation, and save migration gates still apply. [Repeat the player tests](PLAYER_PLAYTEST.md)

## Release sequence

| Phase | Playable result | Gate before expanding |
| --- | --- | --- |
| 0. Stabilize the current game | Opening gifts, notifications, and leaderboard work reliably | Reproduce and close the observed problems with browser tests |
| 1. Protect the run | App close, refresh, retry, and saves have predictable outcomes | Interrupted actions recover without lost progress, duplicate rewards, or accidental retreat fees |
| 2. Finish Pallet through Gym 1 | A new player can learn, catch, prepare, and make a consequential road choice | Fresh players complete the opening unaided across a small device and generation matrix |
| 3. Finish the interface and presentation | Consistent art, controls, sound, and cinematics across modes | The entire screen inventory passes the new layout and accessibility checks |
| 4. Prove the competitive engine | Local competitive singles, followed by historical singles and a doubles pilot | Each published format has signed-off rules, legality, replay, and parity fixtures |
| 5. Finish the campaign | Eight distinct Gyms, reactive roads, coherent arcs, and a complete League and ending | Every chapter passes browser, save, pacing, and difficulty regression checks |
| 6. Finish collection and replay | A useful Pokédex, meaningful run challenges, and an active Crucible | Progress survives migration and repeating a reward screen cannot farm unlocks |
| 7. Ship installs and updates | Browser and installed modes use a common save format, with playable offline packs | Upgrade from the previous public version on real devices and complete an offline campaign run |
| 8. Release and maintain | A staged release with recoverable updates and repeatable playtests | All release gates are green and a rollback rehearsal works |

Phase 0 starts first. Design and test the install size budgets from the start. The competitive pilot can run in parallel after Phase 1 defines the battle and save boundaries. Expand content after the Gym 1 slice proves the format. Move a campaign encounter to the new simulator only after its Story rules pass their own parity checks.

## 0. Stabilize the current game

- Commit the first Poké Mart tutorial completion and its five-ball gift as one save operation. Reopen the Mart after an interruption before and after Continue. Exercise both first-run and skipped-tutorial paths. For older saves, recover a missed gift only where the available save data can distinguish it from an already spent gift. Apply the same pattern to other first-visit gifts after auditing their grant paths.
- Initialize the leaderboard client through the existing SDK loader and give loading, empty, offline, and error states distinct copy. Test a cold browser visit before any online feature has loaded.
- Queue achievements and other nonessential notifications while cinematics, tutorials, and reward choices own the screen. Keep only one short notification visible and put the full batch in history. Reproduce the Paras reveal at the phone size where the stack covered narration and Continue.
- Reconcile visible copy with behavior for the opponent pool count, configurable local PvP party size, relic prices, and Safari balls on exit. Verify values from the active configuration.
- Measure the first music request. The three background MP3s occupy roughly 166 MiB combined, and starting music can immediately preload the next track. Remove speculative next-track downloads from first play and the low-data preset. Use the measured results to direct the first compression pass.
- Save a comparison baseline with representative screenshots, a few fixed campaign seeds, older exports, a release upgrade pair, and real browser timings. Measure with animations both enabled and reduced.

**Done when** the specific browser failures stay fixed on reload, the existing campaign still reaches the Crucible, and the core build can still install and reopen offline. [Browser coverage and reproduction](PLAYER_PLAYTEST.md)

## 1. Save, randomness, and event reliability

- Introduce versioned storage for the profile, active run, encounter, accepted actions, and reward receipts. Use an atomic transaction for changes that belong together. Examples include purchase debit and item grant, catch placement and Pokédex ownership, and battle result and payout. Keep a validated previous save during migration from the current browser storage and verify older exports before retiring any reader.
- Give route events, encounters, choices, and reward claims stable IDs. Store the active encounter's teams, start seed, attempt ID, rules version, and content version. Record both sides' accepted commands at a stable decision point before playing the result animation. Use save revisions to detect stale writes from another tab and preserve the newest recoverable progress if storage is full.
- Separate randomness for world and team generation, narrative selection, capture and loot, bot decisions, battle simulation, and presentation. Freeze resolved events and choices after commitment. A new seed produces a new adventure. The same seed, version, and decisions reproduce the same outcomes across devices and presentation settings.
- Define **Resume Battle** as continuing from the last accepted decision. Define **Retry Encounter** as restarting with the original opponent, battle seed, and pre-battle inventory. **Return to Town** is an explicit retreat and applies any existing difficulty-specific fee once. Closing the app retains the active encounter. If an old save has no recoverable turn data, offer a clearly labeled encounter restart from its preserved checkpoint.
- Unify what the map previews and what the event system starts. An event needs an entry condition, screen or encounter, visible choice, consequence, recovery point, and fallback. Reuse current city and campaign IDs while extracting these parts from the monolith through tested interfaces.

**Done when** closing the browser at a story choice, during a battle turn, or after a result can be recovered. Check interrupted writes, repeated claims, two tabs, save export and import, an engine update during a fight, and both restored and fresh runs online and offline.

## 2. The first hour from Pallet to Gym 1

Treat these times as pacing targets. Players can read, explore, and learn at their own speed.

| Segment | Player action | Presentation and consequence |
| --- | --- | --- |
| Opening, about 0–8 minutes | Choose a trainer and starter, then duel the rival | A short Pallet scene establishes the road and the rival. Teach Fight with one line when the command appears. Ensure each offered starter has a viable move plan. A loss gives a clear retry or preparation path. |
| First companion, about 8–20 minutes | Receive supplies, catch a guaranteed first wild partner, open its Pokédex entry | Teach the ball from the inventory the player actually has. Show party or PC placement. Introduce switching in a safe encounter after party size makes it possible. |
| Route 1, about 20–40 minutes | Choose a detour in **The Unlit Signal**, or take the main road to town | Investigate the culvert for a habitat clue and unusual encounter, escort the courier for useful supplies, or continue. The chosen route changes the mining town's welcome and a later clue. Every branch has a viable path to the Gym. |
| Town and Gym 1, about 40–60 minutes | Follow the town objective, make one preparation choice, then fight for the badge | The town points to one relevant service. An apprentice previews a readable tactic and counter. The badge gives a useful upgrade choice and the next road lead. |

Put the current objective and one primary action on the town screen. Use **Prepare**, **Team**, and **Explore** to group NPCs and facilities. Keep the Notebook available from uncertain moments and let returning players skip explanations while receiving necessary items. Preserve the existing challenge curve. The opening gets clearer instruction, an attainable team response, and quick recovery.

**Done when** a first-time player can name their next objective, attack, catch, switch, and afford one helpful upgrade without prompting. As a small formative check, aim for four of five new players to complete those actions unaided. Run all-generation and single-generation seeds, both route choices and the direct path, real rival and first Gym fights, and a close-and-resume after the catch or badge.

## 3. Visual direction, interface, audio, and cinematics

### Visual language and controls

Keep the pixel creatures, familiar type colors, and battle arena perspective. Give scenery one illustrated language with strong silhouettes, believable foregrounds, and a consistent palette. Pallet starts warm and coastal. Working towns use practical lamps and signage. Anomalies introduce sickly greens, off-color reflections, and broken patterns. The League moves toward severe stone, black water, and sparse light. Reserve pixel lettering for titles, badges, and display accents. Use a clear interface face for dialogue, tooltips, descriptions, and settings.

- **Title and creation.** Make Continue or New Adventure the first action. Put Battle and Collection nearby, with advanced rules behind one expandable panel. Present the first-run settings default and give previews for trainer portraits, generation filters, and mechanics.
- **Adventure and facilities.** Use a persistent location, objective, and Back convention. Show what each service changes, its price, and the before-and-after result. Adapt shop, tutoring, evolution, PC, team, and inventory screens to the same navigation and confirmation rules.
- **Battles and collection.** Keep the four battle commands easy to locate, then reveal move information and the detailed log as needed. Give type, status, target, and legality cues text or icons alongside color. Use consistent detail cards for Pokédex, party, preview, and training. Make defeat, retry, and rewards readable before handing control back.
- **Responsive layouts.** Reuse the arena and portrait stack where they work. Keep primary actions reachable at 320 px wide, on short landscape phones, with the address bar visible, and at enlarged text settings. Test keyboard, touch, visual focus, reduced motion, screen readers, safe areas, and relayout when rotating or switching input types.

### Cinematic production

Build on the existing narration and battle presentation code. Use templates for **arrivals**, **trainer entrances**, **encounter reveals**, **evolution and transformations**, and **chapter endings**. Use layered stills, character poses, sprite animation, lighting, sound cues, and camera cuts. Keep repeatable encounters short. Reserve bespoke illustrations and timing for story turning points such as the first rival, the first badge, the major raid, Gym 8, Hall of Fame, and the Mystery Figure.

**The Unlit Signal storyboard**

1. A wide view shows the washed-out path and a signal lamp that should be lit. Grass and a low coastal loop place the player on Route 1.
2. A closer shot shows a stalled courier at the fork. A burst of static from the culvert cuts the ambience. The player sees the three available actions with destination and immediate risk.
3. The chosen branch plays a short distinct reveal. A habitat discovery can open a normal catch, while escorting commits supplies and a town callback. The direct path retains momentum.
4. The mining town arrival repeats the signal motif in the foreman's reaction. The objective refocuses on Gym preparation and the Notebook retains the clue.

For later scenes, build dread through changed environments, surviving witnesses, and consequences that show up in play. The Paras raid can start with a familiar silhouette and reveal the mismatch between the body and its movements. Use the Hall of Fame and Mystery Figure to pay off repeated names, portraits, and signal fragments. Include optional intensity settings for graphic overlays and flashes, readable sound captions, and a summary for skipped or reduced-motion scenes. The information and outcomes stay equivalent across presentation settings.

**Asset production order.** Approve one city backdrop, one route backdrop, one battle arena treatment, a portrait set for the opening cast, and sound cues for the pilot. Then build packs per chapter with one recognizable landmark, reusable environment layers, a small portrait and lighting library, ambient audio, and localized sound cues. Use compressed still and audio formats after comparison on low-end devices. Record ownership or licenses and credits for distributable assets. Preload upcoming scenes within performance budgets and use fallback art or text if an optional visual pack is absent. [Existing art direction](story-design/VISUAL_ART_DIRECTION_REVIEW.md) · [Existing cinematic system](story-design/story-immersion/visual-and-cinematic.md) · [Asset credits](../ATTRIBUTION.md)

**Done when** players can read and close a scene in both orientations, skip and replay it without changing its rewards, and identify the location from art and sound. Review screenshots or recordings of ordinary movement as well as set pieces. Validate that overlays never cover the only actionable control.

## 4. Competitive engine, rules, and difficulty

1. **Create and test the adapter.** Define how teams, legal commands, forced switches, targets, previews, results, and public battle events pass between simulation and UI. Keep battle resolution independent of animation. Capture intentional campaign rules such as bag use, captures, relics, party carryover, custom boss phases, and any scripted exception before moving modes.
2. **Pilot local Gen 9 singles.** Pin the exact Showdown-based `@pkmn/sim` version and format definitions. Lazy-load a browser worker. Drive the existing battle renderer from the worker's validated requests and public events. Prototype a saved replay and offline rematch. Measure bundle size, worker startup, and long turns on a midrange phone. Smogon sets can inform team building and bot archetypes.
3. **Add named formats.** Use the same revision for team validation and battle simulation. Ship historical Gen 1–9 singles as each format passes. Include clear legality errors and importable teams. Add a separate Gen 9 doubles pilot with targeting, two active slots, forced choices, and AI that can evaluate partner effects. Test replay and inputs on touch before expanding doubles formats.
4. **Specify mixed mechanics.** Keep species availability and historical battle rules as separate settings. The Story default enables all generations and Mega Evolution, Z-Moves, Dynamax, and Terastallization, with progression unlocks and **one manual activation per side per battle** in Classic. Give mixed rules a named Arena format and test them against pinned fixtures. Showdown's native Dynamax and Tera rules are generation-specific. Verify that a custom format really supports the intended combinations, including simultaneous choices and automatic form changes. Keep native format behavior intact and display any campaign-only exception.
5. **Migrate modes once tested.** Move Quick Battle and draft, local PvP, and other competitive modes first. Follow with Gauntlet, Frontier, and rematches, then campaign battle families as their special mechanics pass. Keep existing saves tied to a supported simulator version or a safe migration checkpoint. Extend public PvP after two staging clients can verify legal turns, reconnect, surrender, and rematch under one rules revision. Require server-authoritative resolution before publishing ranked play.

Show teams and tactics progressively during the campaign. Early bosses provide readable counterplay, middle badges introduce one tactical idea at a time, and late bosses use speed tiers, hazards, removal, pivots, team synergy, and strong transformations. Preserve the current challenge settings and difficulty personalities. Do a separate manual fight pass for each major chapter with scarce resources and restricted species pools. Assisted playthroughs establish story and UI flow. Real fights establish tactical fairness. Give the bot the same legal choices as a human and score them using its side's available information. Record what the bot picked in saved replays.

**Done when** supported native formats agree with pinned reference turn sequences for damage, priority, switching, traps, immunities, items, ability effects, weather, hazards, faint timing, and transformations. Mixed and campaign-specific rules must pass explicit fixtures. The same replay reaches the same ending state with animation speed changed, after a worker restart, and offline. [Battle investigation](BATTLE_ENGINE_INVESTIGATION.md) · [Showdown protocol](https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md)

## 5. Finish the campaign chapter by chapter

The Open Circle chapter plan records the research, scene beats, clue requirements, and replay goals for the field investigation from Pewter to the Crucible. [Open Circle chapter plan](ADVENTURE_CHAPTER_PLAN.md)

Keep the eight-badge spine, the rival, the selected villain and anomaly tracks, and the post-Hall-of-Fame Mystery Figure. Give each road an illustrated set of explorable nodes. A road gets a landmark, a clear destination, one curated opportunity, and a reason to talk to someone when you arrive. Build the following new content against the existing route names and chapter order.

| Chapter | New moment and consequence | Battle or progression lesson |
| --- | --- | --- |
| Pallet and Route 1 | The Unlit Signal, first partner, mining town reacts to the chosen route | Move choice, catch, switch, first Gym counter |
| Mineshaft Pass and Gym 2 | Read lamp marks and choose to reopen an ore lift or take the tunnel. The craftsman town responds with a clue or a service lead. | Read a status effect and select a practical response |
| Route 4 and Gym 3 | An abandoned field lesson points toward a local form. Compare the lesson to an academy record altered by the run's villain. | Priority, safe switching, and build options |
| Route 6 and Gym 4 | Inspect a ranger outpost and choose what evidence to carry into town. Unlock an encounter lead or a witness's account. | Held items, field setup, and identifying a team role |
| Lakeside Road and Gym 5 | Follow a lost enclosure tag or a boardwalk rumor. A handoff changes Safari guidance or the Game Corner's rumor list. | Broader team preparation and optional scouting |
| Route 9 and Gym 6 | Investigate a closed transfer yard and find a choice that changes a later Underground contact. Tie the villain's money or supplies to a visible consequence. | Hazards, removal, and resource management |
| Highcountry Pass and Gym 7 | **Closed Circuit** offers a salvage reward or a rival scouting lead. Colress puts the next form decision in context. | Weather, pivots, and choosing a transformation |
| Cathedral Approach and Gym 8 | Catch a reflection showing a roster different from your own. Make the optional Mystery encounter an intentional choice with clear stakes. | Advanced preparation and late-game counterplay |
| Victory Road and the League | Distinct Elite Four strategies, Champion build, Hall of Fame cipher, then the existing Mystery resolution | Team construction, sequencing, and earned high difficulty |

Advance in three batches after Gym 1. Finish Gyms 2–4, then Gyms 5–8, then the League and ending. Maintain one track for the main mystery and use the selected villain and Pokémon stories to change clues, opponents, and rewards. Give each active track an introduction, pressure point, reveal, confrontation, aftermath, and a Journal clue trail. Make optional scenes dismissible with a clear return path. Record choices before the location reacts so reload shows the same town or encounter. Build each chapter as a complete route, hub, battle, and aftermath before moving to the next one.

**Done when** every road has a discoverable optional experience and a reliable way forward. Check distinct start and arrival scenes, chapter-specific audio, correct trainers and stakes, late narrative callbacks, both ending choices, and save recovery between every chapter. The hard routes and League should still reward the preparation and battle strategy that are already fun. [Existing campaign flow](../STORY_MODE_FLOW.md) · [Story data and tracks](story-design/STORY_3TRACK_IMPL_PLAN.md)

## 6. Exploration, collection, training, and replay

- **Pokédex and field research.** Link a catch result to its species entry. Show seen, caught, shiny, and regional or other forms, with acquisition source such as wild, trade, hatch, evolution, or gift. Add limited habitat clues in towns, route landmarks, and the Journal. Offer a few multi-road field requests that pay off through observation and optional catches. Link the Dex to the Collection screens and show where the Pokémon went when the party was full.
- **Team building and economy.** Preserve existing costs and rewards as the comparison baseline. Every service explains what it does, why it is useful now, its cost, and what happens on confirm. Give each chapter a dependable way to buy basic supplies and a choice of corrective upgrades. Keep expensive training, rare items, Safari, and comparable activities optional. Show upgrade previews and voucher use. Compare real spending, supply shortages, and ways players recover before retuning payout or difficulty.
- **Camps and characters.** Make a camp a short decision between preparing, checking a trail, or spending time with a partner. Use existing camp mechanics to support the story. Give partner events small callbacks, collectible mementos, or hints. Add easter eggs for unusual team members, return visits, and lore connections without making secrets mandatory for progression.
- **Achievements and run history.** Measure constraints over the whole relevant run. Examples include using the starter line in every badge fight, finishing all rival encounters without a loss, following field clues to regional forms, and clearing a League without bag use. Track unique villain and anomaly outcomes, record League clear and ending completion separately, and award alternate dialogue, cosmetics, or records that preserve the difficulty curve.
- **Postgame.** Give the Crucible a readable set of goals. Add Frontier challenges with published rule modifiers, rotating fixed seeds, curated rematches, and chapter detours that can be revisited after the ending. Add run cards with seed, rules, team and story outcomes, plus a reliable same-seed rematch or new-seed start. Let repeat players skip the opening lessons while granting their supplies once.

**Done when** collection, favorites, PC storage, badges, endings, and replay achievements persist across refresh, import, a new run, and a supported migration. Check that resetting one run preserves lifetime history and that claiming a reward twice has the same result as claiming it once.

## 7. Offline play, installs, and updates

The audited build has roughly 693 MiB of optional offline content and a core cache of about 19.5 MiB before its manifest. Profile encoded network transfer, main-thread boot time, and installed storage separately. The numbers below are design targets to validate on real devices before setting release budgets. [Delivery baseline](BATTLE_DEEP_DIVE.md#play-anywhere-and-keep-progress)

The public and installed title is `index.html`. It opens without downloading the gameplay document or installing the worker on a fresh browser visit. The legacy gameplay address remains available for direct links and diagnostics. Settings offers a Compact pack of about 69 MiB and a Full pack of about 647 MiB before the shared manifest. Compact uses locally bundled first frames, shorter music, and type-based attack sounds. It retains the campaign, authored scenes and dialogue, and offline battle rules. Full keeps the animation and extended audio library. Existing Full downloads retain their profile unless the player switches. [Continuity test evidence](../agent-state/playthrough/continuity/RESULTS.md)

When updating the bundled GIFs, run `npm run sprites:compact` with Python 3 and WebP-enabled Pillow, then regenerate the offline manifest. The checked-in archive lets ordinary releases build without running Pillow.

| Download | Target and behavior |
| --- | --- |
| First menu | Aim for 1 MiB encoded before it is actionable and a 3-second p75 on a profiled midrange phone at 4 Mbps and 150 ms round-trip latency |
| First battle | Aim for 5 MiB total encoded from a cold browser through the first playable battle |
| Starter offline pack | Aim for 15 MiB with a working start through Gym 1, save, battle data, and basic presentation |
| Full low-data campaign | Aim for 80 MiB after profiling data and media, with the full story, basic visuals, supported species and rules, collection, and offline battles |
| Optional fidelity packs | List bytes before download. Let players opt into higher-quality sprites, music, voices or ambient mixes if used, and scene art by region or all together |

- Split the boot shell from campaign code, simulator data, learnsets, advanced tools, move media, and cinematic assets. Load and cache what the current activity needs. Prioritize short compressed music loops, static sprite equivalents, and responsive backdrop sizes. Compare decode cost and quality on target devices, including whether media can seek offline in an installed iOS app. Keep one version identity across manifest, settings, packages, and release notes.
- Offer a download manager that reports bytes and available space, with pause, resume, and clear coverage for each pack. Keep a verified version active while downloading a replacement. Reuse matching files, verify changed assets, and switch versions after a safe Story save or match exit. If installation is interrupted, reopen the previous complete version and keep resumes incremental. App caches and save storage have separate lifecycle rules.
- Ship the browser and installable web app first. Verify Android Chrome and iOS Safari in browser and home-screen modes, tablet touch and keyboard, desktop Chromium and Firefox, and Safari where supported. Publish simple install guidance and backup and restore procedures. Keep a stable site identity and origin for updates.
- Package signed standalone Windows, macOS, and Linux builds after the same assets, save migration, and offline play pass in the web app, with versioned downloads and update rollback. Plan Android and iOS store distribution as a separate milestone with device packaging and validation. Home-screen installs cover those platforms during the web release.

**Done when** a player can choose the correct offline pack, finish a complete offline campaign, and update from the last release without replaying content or losing the run. Rehearse cancelled downloads, full disks, deleted caches, interrupted updates, background app kills, and backups moved between devices. A current installation should reuse its downloaded assets. Updates should transfer changed assets and compact metadata.

## 8. Release checks and ongoing updates

Run three distinct verification passes. Use the automated browser playtest for coverage and navigation, seeded rules and persistence tests for reproducibility, and hands-on play for difficulty, guidance, visual clarity, and audio.

- **Campaign and economy.** Run start to Crucible with the main seed, repeat selected chapters with each track and representative generation restrictions, and play real fights through the opening and representative late bosses. Test all main services with buy, cancel, restore, and insufficient funds. Check lost and won outcomes, reloaded cutscenes, alternate endings, and postgame rewards.
- **Competitive and online.** Verify the declared rules matrix and deterministic replays. Exercise two staging clients for join, reconnect, leave, rematch, and leaderboard states. Keep failed connections from modifying local story progress. Verify both players' legal choices and formats with the same simulator revision.
- **Devices and accessibility.** Use physical phone and tablet portrait and landscape, desktop with keyboard, real browser installation, reduced motion, larger text, and VoiceOver or TalkBack. Verify restoration of focus and readable actionable controls through every major dialog.
- **Release and rollback.** Ship a preview build, migrate older saves, and update a previous installed release with incomplete media. Publish versioned artifacts, package sizes, release notes, and known issues. Rehearse rollback without overwriting newer player data. Clear all reproducible progress loss, unreachable required actions, or rules errors in published formats before marking the release ready.
- **Following releases.** Add one short route episode, visual pack, balance revision, or format at a time. Keep content and rules revisions pinned for saved runs and seeded challenges. Re-run the affected paths and compare screenshots and performance to the previous release.

Use the existing unit and differential suites, `npm run playtest:player`, the responsive battle checks, and the verified offline release build as the starting harness. Extend them as each phase introduces new screens, choices, and supported formats. [How to run the player test](PLAYER_PLAYTEST.md)

## First build

1. Fix and re-test the Mart gift, cold leaderboard, and cinematic notification overlap. Measure and cut speculative music transfers.
2. Implement the first safe save transaction and define Resume, Retry, and Return to Town using existing saves and a reproducible encounter.
3. Finish Pallet through Gym 1 with the new Route 1 choice, one art and sound pack, one polished cinematic, and a town callback.
4. Play that opening on phone, tablet, desktop, and offline. Use the results to set the standard for the rest of the overhaul.
