# Battle game reference

Start here when a request says “all screens,” “all city content,” or “all mechanics.” The inventory resolves those requests against current code and shipped data. The feature guides explain how a player reaches each surface, what changes inside it, and where to verify it.

```sh
npm run audit:game -- --check
npm run audit:game -- --scope city
npm run audit:game -- --scope nature-rater
npm run --silent audit:game -- --scope all --json
```

The console view is a worklist. Use `--json` for all source entries, static controls with line numbers, feature owners, and linked case IDs. For town changes, the current action registries include buttons assembled by the town and Crucible renderers. The unscoped audit also lists potential dynamic entry points that require reachability review. A control assembled at runtime can share a fixed host with many other screens.

| Guide | Player journeys and design areas |
| --- | --- |
| [App and delivery](APP.md) | Public title, Classic home, mode launchers, Help and practice, keyboard and settings, profiles and backups, dialogs, room forms, scores, PWA installation, Compact and Full packs, updates and offline play. |
| [Story and world](WORLD.md) | Trainer creation and Professor, each town and route, local errands and paths, main story, faction histories, anomalies, chapters, Gym handoffs, League, Mystery Figure, endings, replay, art and audio. |
| [City facilities](FACILITIES.md) | Center and services, Mart, Department Store, Relic Hall, Move Tutor and Hidden Power, Nature Rater, Dojo, Battle Mentor, EV Trainer, IV Fan Club, evolution, Cable Link, Colress, vouchers and unlocks. |
| [Field tools](FIELD_TOOLS.md) | Bag pockets and battle inventory, Party and three-page Pokémon Summary, Center/PC, Pokédex, achievements, Hall of Fame and other collection tabs, Notebook, Journal, Atlas, Archive and notices. |
| [Activities and postgame](ACTIVITIES.md) | Road and Camp encounters, wild and legendary capture, Camp, bonding and all minigames, Daycare Inn, Poké Pits, Underground Fight Club and Memorial, Game Corner, Safari, Crucible, rematches and Frontier. |
| [Battle modes and systems](BATTLES.md) | Classic Story and independent modes, draft, Gauntlet, local and online partner play, Competitive Arena, simulator rules, build generation, animation, HUD, replacement, results and exact-turn restore. |
| [Design sources](DESIGN.md) | Progression, gold, availability, enemy and wild strength, combat and capture rules, narrative, presentation, release and testing documents. |

## Apply a broad request

1. Resolve the player language to a scope in [scopes.json](scopes.json). `city` includes Pallet and Professor, towns and late hubs, facilities, local quests, trainers, shops including Department Store, and the field tools reachable from them. Add `field-tools`, `activities`, or other scopes when the change also affects the same surfaces in Camp, battle, or postgame.
2. Make a row for every affected family, its real launch contexts and the controls changed. The same screen can have different requirements at an NPC, through a voucher, from a narrative choice, and after a battle. Before editing, identify the entry rule, primary action, player-visible consequences, visual and audio cues, and how a player leaves or resumes.
3. Check the guide and its sources for variants. Include first visit and return, locked and unlocked, empty and populated, one or many Pokémon, legal and blocked choices, full party, insufficient funds, storage denial, and reload wherever the feature supports them. For story branches, follow the response, reward, later reference and chapter replay. For a roster change, inspect the resulting card, party, PC, Pokédex or Memorial as applicable.
4. Verify real presentation. For a phone-wide visual change include at least a narrow portrait and short landscape, then check tablet and desktop where controls reflow. Verify keyboard focus and Back, tap targets, long names, scrolling, silent/reduced-motion settings, and missing asset/loading behavior where applicable. Any decorative element should earn its space through world context, recognition, navigation, feedback or story.
5. Record evidence by build and case. A source row establishes ownership, a checkpoint establishes behavior from that state, and an ordinary-input run establishes what actually happened through that route. Use physical-device, hosted-room or human-play evidence for claims that depend on those conditions. Preserve missing cases in the register with a reason. [Playtesting plan](../FULL_SCALE_PLAYTEST_PLAN.md) · [Case register](../PLAYTEST_COVERAGE_REGISTER.csv)

## Keep the index current

Add the feature’s real entry, child states, mutating actions, exit, design sources and verification to its guide. Give an added fixed screen or dialog one owner in [scopes.json](scopes.json). Link it through `relatedViews` anywhere else that can open it. Nested panels can use `controlGroups` to report their controls alongside the full screen. Assign each new stable source ID to the appropriate catalogue owner. When introducing a new family of dynamically constructed screens, index its authoritative registry and add the catalogue to its feature. Add or update existing case IDs when a player path or expected outcome changes.

`npm run audit:game -- --check` runs in CI. It catches unowned fixed views, unresolved guide and test paths, unassigned explicit keys, and tracked catalogue discrepancies. Review [RELEASE.md](../north-road/RELEASE.md) and use the [release candidate runner](../../scripts/debug/release-candidate-playtest.sh) for executable evidence. The scope audit itself records no player actions.
