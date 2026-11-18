# Pokémon Arena deep dive

This document records the pre-overhaul audit. Follow the implementation checkpoint for fixes, new player paths, and current release gates. [Overhaul plan](ARENA_OVERHAUL_PLAN.md)

The next playable milestone should run from a new save through the first Gym. It should give a new player a reason to care about their starter, let them make a meaningful choice on the first road, and teach enough through play that they can attempt the Gym without reading a guide. The later campaign should build on those same choices and combat verbs up to a Kaizo-style League.

## Play anywhere and keep progress

The game already ships as a static PWA with a versioned service worker and an allowlisted release artifact. The audited version has about 693 MiB of offline content across 8,254 files. Its core cache is about 19.5 MiB before the offline manifest. Sprites account for about 433 MiB and audio for about 240 MiB across the repository. These figures describe file sizes before transport compression.

Keep the browser game and the installed app on the same release and save formats. Make the first playable route a small, explicitly tested offline tier, then offer region and full-library downloads that show remaining bytes, pause, and resume. Load large battle reference data, animations, and late-game media at the point of use. Convert large PCM audio and backgrounds where listening or visual comparison confirms the conversion holds up. Use hash reuse for updates and confirm that a cancelled or failed update can launch the previous game offline. Browser storage can be evicted, so keep export and restore visible in the installed game. A standalone installer is a separate distribution target and should go through the same migration, offline, and update checks.

Test 320px-wide small phones, safe areas in both orientations, touch and keyboard on tablets, and window resize on desktop. Run first boot, first battle, first catch, city menu, Pokédex, resume, and update flows in Chromium, WebKit, and Firefox. Scroll every major sheet to its final action. Keep the primary buttons reachable even when text is enlarged and a player opens the battle log. Use a system or legible UI face for long reading and keep the pixel face for short titles and accents.

## Battle simulation and rules

Competitive Arena resolves Gen 1–9 OU singles and Gen 8 Battle Stadium Singles through the pinned Showdown simulator. OU offers three- and six-Pokémon teams with matching AI rosters. Battle Stadium uses three Pokémon at level 50 and supports native Dynamax and Gigantamax. The browser worker supplies legal commands and records replay input. [Arena simulator](../scripts/competitive/arena-simulation.mjs)

Story, Jump In, Quick Battle, Draft, Gauntlet, and local PvP now resolve turns through the same pinned simulator. Room-code PvP negotiates the engine protocol with both players and publishes a new decision revision after a turn or a forced replacement. The adapter imports the game’s generated rosters and actual stats, health, status, and PP. It returns legal requests and state in the game’s original party order. The compatibility resolver remains available to older room clients and when the native module cannot initialize. [Shared simulator](../scripts/competitive/classic-simulation.mjs) · [Online transport](../online-pvp.js)

The November 18 audit ran 3,070 generated probes. Four high-confidence flags repeated across both sweeps. Moody, Metronome, and Acupressure drew different random outcomes. The Frustration fixture compared the in-house engine's fixed power with Showdown's power at default friendship. The separate 53-scenario damage sweep found zero unexpected divergences. Targeted regressions cover exact damage and stat rounding, weather and status, priority, and replacement order. [Damage tests](../tests/suites/damage-gen9-oracle.test.js) · [Field and status tests](../tests/differential/field-status-parity.test.js) · [Priority tests](../tests/suites/move-priority-oracle.test.js) · [Replacement tests](../tests/suites/turn-replacement-order.test.js)

The game's standard modes use an explicit modern singles profile for mixed-generation rosters. The profile supports Mega and Primal forms, Z-Moves, Dynamax and Gigantamax, and Terastallization under the selected form budget. Story adds authored power limits, trainer items, artifacts, boss phases, and seeded field cycling. Capture, retry checkpoints, and reward claims are campaign transactions. Native snapshots preserve the simulator's own state, requests, and random stream. Room-code PvP resolves turns on the host and was exercised with two browser clients on a local backend mock. [Mixed-generation rules](../scripts/competitive/classic-format.mjs) · [Campaign rules](../scripts/competitive/classic-scenario-rules.mjs) · [Boss rules](../scripts/competitive/classic-boss-rules.mjs)

Keep **species generations** and **battle rules** as separate settings. Story enables all generations and all four transformations by default. Campaign progression controls when transformations become usable, and Classic shares one activation per side per battle. Named historical presets can use the rules and legality of their own generation. An all-generations preset with Mega Evolution, Z-Moves, Dynamax and Terastallization needs explicit Arena rules and tests. Upstream Showdown checks generations when allowing Dynamax and Terastallization, so a standard National Dex format cannot automatically give every requested combination. [Browser simulator](https://github.com/pkmn/ps/tree/main/sim) · [Showdown battle protocol](https://github.com/smogon/pokemon-showdown/blob/master/sim/SIM-PROTOCOL.md)

## Randomness, retry, and collection

A run seed should produce the same starter draft, story tracks, encountered teams, and rewards from the same choices and content version. Persist independent versioned random streams for world generation, battle, capture, rewards and cosmetic effects. Audit code that routes `Math.random` globally while a story run is active. Confetti and battle effects can currently consume the same stream as gameplay. A defeated battle retry locks the opponent while keeping the advanced RNG cursor, so identical choices can produce different outcomes. Closing during a route battle can trigger a retreat, which can cost gold on harder settings. Define Retry as a replay from the original encounter seed, and give Return to Map and Resume Battle distinct labels and persistence behavior.

Save the encounter descriptor, simulation version, seed and accepted actions before moving to the next screen. Record battle rewards and captures with a stable encounter or claim ID so refresh, retry, and import cannot apply them twice. Verify real saves created before the change. Add fixtures for refresh before choosing, refresh during a turn, retry after losing, interrupted write, and duplicate reward claims.

The existing Collection already has the Pokédex, Shiny Dex, Signatures, Hall of Fame, Memorial and achievements. Test that seen and caught progress survives storage, import, reset of the current run, and save upgrades. Use one family entry for regional and alternate forms while retaining which forms and shiny forms the player acquired. Distinguish gifts, evolution, and trades from actual wild catches. Reveal a new entry from the capture confirmation and give optional route clues for unseen species.

## Make the campaign feel inhabited

The authored campaign already has route flavor, city facilities, a rival, rotating villain and anomaly stories, cinematics, and an optional Trainer Notebook. The first-rival lesson arrives as a tutorial overlay and a battle intro before the player has a meaningful switch. Move teaching into a choice the current team can make. Teach attacks first, healing and catching on the road, and switching once the party actually grows. Give experienced players a quick start and keep explanations replayable in the Notebook. Surface the current goal, the immediate action, and a single route exit in the city. Put specialized trainers, shops, and historical dialogue behind a clear directory as they become relevant.

Use the first road to prove the exploration loop. At a washed-out bridge, follow tracks into a drained canal for an unusual encounter, help a stranded courier, or stay on the main road and head to town. Carry the outcome forward into an NPC line, a recovered item, or a later rival encounter. Reuse the same branching structure for detours, weather, nighttime sightings, traveling challengers, and optional rescues across the campaign. Seed each opportunity and flag when it has been resolved so reloads preserve the result.

Use short, skippable illustrated scenes for turning points with lasting consequences. An abandoned Poké Center, damaged rescue logs, and a survivor who recognizes a captured Pokémon can give the dark story more weight than a longer exposition scene. Reserve more graphic body horror and irreversible losses for later arcs and use reduced-motion support and text summaries for story-critical information. Give each route a readable landmark and distinctive sound. Tie easter eggs to optional field clues or rare party combinations so they reward curiosity. Use original or licensed illustrations and sound for new distributable content and keep asset credits with the release. [Existing story flow](../STORY_MODE_FLOW.md) · [Existing attribution](../ATTRIBUTION.md)

## Difficulty and reasons to return

- Open with a recoverable starter duel, guaranteed first catch, and predictable first-Gym lesson. Measure where new players first lose the thread or close the game.
- Introduce held items, field control, switches and route risk across the middle badges. Give each opponent a recognizable lead, team theme or scouting clue.
- Make late badges and the League test speed tiers, team roles, hazards, pivoting, credible switching and team preview, and earned transformation choices. Protect the Kaizo-style challenge with fixed regression seeds and checks that at least one reasonable preparation route exists under each supported rules preset.
- Give players new goals across runs with seeded challenges, alternate urban outcomes, hidden entries, team records, and achievements for different play styles. Examples include winning with three different starter lines, finding a regional form through a route clue, and finishing a League with a cap on healing. Count each completed challenge once.

Release the first-Gym slice once the same saved run can finish it on phone, tablet and desktop, online and offline. Expand the campaign or migrate more modes only after the playable slice and the competitive simulator pilot pass their own tests.

## Repeatable checks

- Run `npm test` for game regressions and `npm run test:differential` for the Showdown comparisons.
- Run `node tests/story-walkthrough.mjs` to exercise the campaign flow with automatic battle wins.
- With the local app running, execute `node tests/visual/battle-responsive.mjs` to check battle controls and safe-area sizing in Chromium. The script accepts `BATTLE_TEST_URL` and `BATTLE_TEST_CHROMIUM` overrides.
- Run `npm run offline:manifest` after changing an app file or asset, then `npm run build:release` to verify hashes and build the deployable `dist/` directory.
