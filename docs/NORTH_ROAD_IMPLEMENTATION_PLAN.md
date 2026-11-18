# Pokémon Arena Story next release plan

Planning draft · November 18, 2026

For implementation order, exact behavior, test cases and release procedures, start with the [build runbook](NORTH_ROAD_BUILD_RUNBOOK.md).

## 1. The game this release should become

The player sets out from Pallet with a partner they chose, recognizes each town by what happens there, and reaches the League with a team they understand. The darker story grows out of what people and Pokémon have to protect. A railway dispatcher hiding a name, a wild encounter guarding a den, and a Gym Leader teaching a counter each need a believable reason to be there. By the time the gallery appears, the player has seen enough evidence to form their own theory about the loop.

Preserve base level 50 and the existing late Experience Share power-up. The growth players feel comes from grade, evolution, team slots, moves, items, abilities, IVs, EVs, bonds, and late power-ups. Preserve the deliberate rise toward very hard League and postgame fights. The default journey offers generations 1–9 and the currently supported transformations within the existing one-use budget per side per battle. Campaign generation selections govern encounter and build eligibility within Arena Story’s mixed-generation rules. Historical battle formats remain available through the Competitive Arena.

The previous audit already reached Pallet through the Crucible on two seeds, exposed all 25 player screens, verified 30 Camp activities and both answers in all ten Open Circle scenes, and installed an update while preserving an offline save. It used Chromium and some controlled battle outcomes. The new release needs production-legal teams for its signature boss tests, physical-device coverage, blind player observation and real hosted multiplayer. [Playtest audit](../agent-state/playthrough/immersion-audit/PLAYTEST-AUDIT.md) · [Progression model](PROGRESSION_CURVE_MASTER.md) · [Research and inspiration](STORY_FAN_RESEARCH.md)

### Design rules

- Teach one useful decision before testing it. Tell players what happened, then put the tool that can help within one action of the relevant screen. Let veterans open the detailed build data and move on.
- Make each town do a job, each road offer a sensible decision, and each optional branch produce a visible result. Familiar names, species and trainer references should help the player predict something about the world.
- Reward different ways to engage. A collector gets a habitat lead, a story player gets a witness or record, and a battler gets a preparation idea or a different opponent. A miss or alternate decision remains a legitimate story.
- Show danger and counterplay through text and icon first. Animation and original audio add weight. A player using mute, reduced motion, larger text, keyboard, or touch gets the same essential information and choices.
- Build tension through concrete evidence and consequences. Leave room for recovery, ordinary jokes, friendly professionals, and time with the player’s partner. Keep disturbing material purposeful and place the heaviest scenes on clearly signposted optional paths. [Design sources](STORY_FAN_RESEARCH.md#game-design-references)

## 2. Order of implementation

| Order | Work package | What has to pass before expanding |
| --- | --- | --- |
| 0 | Capture the current release baseline. Inventory campaign rows, all 10 hubs, nine roads, 10 villain tracks, eight anomalies, 24 raid entrances, Open Circle, storage/replay, and room transport. Record the current first two Gym seeds and asset bytes. | Baseline evidence and fixtures are saved with release/engine revisions. Stable IDs and balances are recorded. |
| 1 | Deliver the first complete slice. Route 1 → Flintreach, Marowak’s signature fight, and a first-Gym preparation/defeat loop. | All three road outcomes still work after reload. Two ordinary legal teams finish Marowak using different plans. New players can say what changed in town and why the boss turned. |
| 2 | Apply approved world naming and local consequences over all nine roads. Add the lighter habitat guidance to the existing Pokédex and one contextual town action per destination. | Every hub reads like a place with a job. Identical geographic names resolve from active and legacy saves, while each selected leader and home region still resolves correctly. |
| 3 | Expand signature encounter rules in stages. Author the rest of the anomaly family sheets and selected villain and late-game climaxes. | Engine conformance, readable counterplay and generation eligibility pass for every added configuration before the next wave. |
| 4 | Cut the finale and commission original audio/visual motifs. Carry the Open Circle’s choice effects into visible spaces and add small replay rewards. | Both ending decisions, loss and rematch, import, chapter archive and all supported presentation settings pass. A blind player can follow the main payoff without bonus clues. |
| 5 | Iterate on onboarding and discovery with actual players. Fix the sources of confusion and test again with fresh participants. | The novice and veteran criteria below are met without flattening the late difficulty curve. |
| 6 | Validate the release package and hosted room flow. Capture build, device, offline, accessibility and live match evidence. | Stable save migration, cache update and room recovery. Every release-blocking defect is fixed and retested. |

Writing, original asset concepts, and device preparation can run in parallel after the baseline. Gameplay implementation follows the order above. The first slice is the approval point for the story tone, difficulty lesson and new boss treatment before authoring the rest. This document is the implementation specification for later work.

## 3. First slice in detail

### The Unlit Signal → Flintreach

The same flood lamp appears on Route 1 and on the Flintreach noticeboard. Establish it as a safety device before anything supernatural occurs. Give the courier a name, **Iona Kells** as a working name, and a practical problem. Their dispatch needs to reach the crew before shift change. Keep this lamp distinct from Mara Venn’s broken survey relay in Open Circle Chapter 1.

| Existing choice | On the road | Visible at the first hub | Existing progression |
| --- | --- | --- | --- |
| **Scout the culvert** | Follow the tracks. See one legal, current-party-specific Gym tip and the usual optional habitat encounter. | The foreman has chalked the culvert into the noticeboard map. **Review Gym tip** shows the recorded hint or offers the existing source of preparation. | Existing Scout encounter rules and rewards. |
| **Escort Iona** | Get the courier and their dispatch to higher ground. | Iona hands over the dispatch at the desk. The foreman relights the flood lamp and thanks the player for the specific thing they did. | One existing Poké Ball and Potion bundle. |
| **Take the main road** | Reach town with a clear travel action. | The noticeboard says the crew is due at dawn. The foreman still gives the normal objective. | Ordinary route. All town facilities, the badge and Open Circle remain reachable. |

Show one contextual inspect/talk action in the current town flow. Derive the variant from `road.discovery.1` and render its state before the player opens anything. A missing choice in an old save uses the ordinary board. Keep the existing pre-choice save boundary and rewards. Reopening the board, reloading the city, retrying the Gym, or viewing an archive consumes no extra RNG or rewards. Add a compact before/after art treatment to the current assets and a captioned relay lamp sound if a cue improves readability.

**Proof required:** All three normal road buttons exercised on touch and keyboard. Interrupt before choice, immediately after confirming, at habitat entry, in the arrival screen, and in town. Include double input, an old save, an unavailable rolled species, and a Gym loss/retry. Compare currency, inventory, encounter ID and RNG state against expected values.

### Marowak and Grave Guard

Use the existing Cubone anomaly and its final Marowak raid. An earlier encounter shows the same one-turn tell. The final fight gives the player a reason to inspect damage categories and shows what Marowak is protecting.

1. During ordinary Showdown resolution, record the last successful direct hit that dealt damage to the boss’s actual HP during the current turn. Read its resolved Physical or Special category. Substitute damage, misses, immunity, status and indirect damage supply no category.
2. The first time the living boss ends a turn at or below half health after crossing the threshold, announce a two-turn brace against that category. A residual-only threshold turn defaults to a visibly announced Physical brace. A lethal threshold hit skips the phase. The pilot has one threshold and one guard.
3. Apply 25% damage reduction to subsequent matching direct hits during the next two actionable turns, with ordinary minimum-damage handling. Setup, healing, switching and continuing to attack all remain viable. Forced replacement and presentation frames consume no phase turn. A normal Battle Bag action consumes the same turn as under the existing Story rules.
4. Mark the threshold and announce the category and duration in the log, phase indicator and optional original impact cue. Use plain language such as “Braces against Physical attacks for two turns.” Offer a legal Special move, if the active partner knows one, among the existing choices. If it does not, say that the player can play through the guard or use the time to prepare.
5. Save or reconstruct the authored profile and revision with the locked encounter so retries keep the same formation, phase and starting seed. A combat resolution event drives the UI.

**Proof required:** Ordinary stage-legal party from the actual encounter window. Complete one full win by changing damage category, one win with a single attacking category, and one actual loss → retry. Unit and browser cases include multi-hit, fixed damage with a documented rule, Substitute, damage denied by immunity/Protect, a low-HP heal, status/hazards, critical hits, fainting on threshold, forced replacements, bag turns, story generation restrictions, and no phase leakage into other modes.

### First-Gym preparation

Reuse the move tiles, Inspect, Mentor, Tutor and post-defeat review. Show how type and a revealed ability can disagree using an ordinary legal seed with a Bronzor-style immunity case. After a real defeat, offer one directly relevant action the player can afford and reach. Use **Look at the matchup** before selection, **Add from PC** after a badge when a slot and reserve are available, and **Find an answer in the Tutor** only when this Gym stage has a legal option. Supply a workable alternative if the player has one partner, no reserve, insufficient gold, and no appropriate Tutor move. The early guide uses that fight’s known information and only explains abilities the player has learned. Assistance clarifies the rematch while retaining the chosen difficulty and existing retreat rules. [Earlier player notes](HUMAN_STYLE_PLAYTEST.md)

## 4. Places, people, and fan service

The current town resolver derives its display name from the seeded Gym Leader’s canonical hometown. Each local town already has its own terrain, industry, progression and story independent of that roll. Give the journey stable original towns, using existing Pallet and Pokémon League framing. Present proven trainer hometown information as a short “Visiting from …” line. Keep `CityN`, row IDs, route keys, save keys, facility gates, and assignment tables intact. Use the same names in arrival cards, objectives, Pokédex, Notebook, Hall of Fame, media captions and the fetched and offline route data. [Town resolver](../battle.html:57259) · [Route data](../data/story/routes.json) · [Official World Tournament reference](https://www.nintendo.com/en-gb/News/2012/Get-ready-to-enter-the-Pokemon-World-Tournament-646905.html)

Working names and local moments are proposed below. Place names receive a legibility and collision pass before they become display copy.

| Stop | Incoming route signage | Landmark and familiar cue | Local person and visible change |
| --- | --- | --- | --- |
| **Pallet Town** | Hometown trailhead | Salt fence, worn lab bench, first partner in the foreground | Professor gives the existing starter choice. A small original note about the partner follows it to the gallery. |
| **Flintreach Town** | **Route 1 · Breakwater Road** | Mining siren, flood lamp, chalk Gym diagram | Iona and Foreman Dena Pike thank the player, mark the route map, or prepare for the next shift according to the road decision. |
| **Kettlestone Town** | **Mineshaft Pass** | Ore-lift lamp and a Link Station connector behind glass | Lift keeper Wren Moss marks a usable tunnel or greets the crew at the stone shop. The existing Stonewise Token pays off at the existing vendor. |
| **Lindenbell Town** | **Route 4 · Canopy Mile** | Survey stakes, academy bell, student sketches | A student posts the missing field notebook or marks the habitat on their chart. Show a useful field fact near the Tutor. |
| **Reedmarket City** | **Route 6 · Warden’s Track** | Reed awnings, shuttered post, first Department Store | Warden Rook Alder changes the board when warned. The alternative posts an annotated animal trail near the existing road summary. |
| **Glasswater City** | **Lakeside Road** | Neon reflection, Safari boardwalk, original guardian lantern tradition | Night warden Edda Marr puts recovered tags on public display or updates a trail sign. Let the lake chapter’s evidence or rescue appear at the next stop. |
| **Brasslock City** | **Route 9 · Switchback Road** | Freight cranes, Daycare stairwell, Bay Nine depot | Nera Vale and the local workers react to the manifest or shelter warning. Place the weigh-slip or a rescued resident’s keepsake in the same location. |
| **Beaconrest Town** | **Highcountry Pass** | Relay hut, wind cloth, warm windows | An existing lookout can receive power for the distress beacon or recognize the rival’s recorded call. The training services stay in the same place. |
| **Vespergate Town** | **Cathedral Approach** | Bell glass, undercroft, extra lantern | The keeper’s real everyday job makes the reflection uncanny. The signed distress call or hikers appear according to Chapter 7. |
| **Pokémon League** | **Victory Road** | Trail register, mountain wind, quiet intake window, Hall of Fame | Orin’s desk and the public register reflect what was submitted. The gallery and Crucible pay off the partner and chosen witness path. |

Keep established witness names such as Mara Venn and Ivo. A new named NPC gets a job, a concern, one recognizable pose or prop, one actionable line, and an alternate response only where the player can change something. Put the main objective above **Explore town** and include at most one new contextual action beside existing services. Known habitat, trainer history, and family portraits belong in expandable detail. Chapter copy must agree with route art, town names, Safari debut at City 5, and the current badge gates. [Open Circle chapter beats](ADVENTURE_CHAPTER_PLAN.md)

Use a distinct silhouette and texture for each stop. Flintreach uses rock, warm warning lamps and coarse dust. Glasswater uses shallow reflective light and narrow boardwalks. Brasslock uses overhead gantries and paper tags. Beaconrest uses a distant beacon and a sheltered pool of warmth. Vespergate uses high windows and a low lantern. Keep the player-facing interaction area bright and stable across those environments. In Gen-restricted runs, use legal field cameos and neutral references when a visual would otherwise promise an unavailable encounter. Keep the current player-owned example in Collection → Signatures and reuse the real visiting leader’s home or legal discovered ace. [Existing art direction](story-design/VISUAL_ART_DIRECTION_REVIEW.md)

### Fan-service standards

- Use official material as a point of recognition. A visitor’s hometown, a specimen’s ecology, a familiar training idea, and a battle facility’s challenge style are suitable. Give each reference local meaning through original dialogue, art, text, layouts, and music.
- Tie species recognition to a place and a reason. Mimikyu belongs in a scene about being seen. The partner in the finale is the player’s own, however unpopular it is in a poll. A habitat may highlight an overlooked legal species through behavior before a stronger encounter arrives.
- Use a light three-layer structure. Everyone sees the useful surface action, attentive players can notice the extra clue, and a replay can reveal its alternate consequence. Optional cameos and clues need no encyclopedia knowledge to understand the main objective.
- Keep rare encounters readable and trustworthy. Reuse the existing recovery flow, visual and captioned audio cues, species availability and explicit throw/leave outcomes. A myth can change an archive record or prop inside the fiction.

## 5. Expansion after the slice

### Roads and exploration

Implement a small declarative table linking a known road or chapter choice to a destination, trigger and at most one rendered local consequence. Reuse the existing story choice and archive state. Store durable outcome, intensity rules and witnesses required to render. Read state through a pure helper with a neutral result for missing or inapplicable legacy records. Persist reward claims through existing grants where one is earned. The new callbacks should be idempotent and consume no RNG just to render a scene. Keep navigation forward-compatible by offering callbacks at the next reachable stop, at a named postgame revisit, or in the archive.

Build a `Find a habitat` action inside the existing Pokédex for currently reachable or recorded sightings. Show **Seen here**, **Unsearched**, and **Later in the journey** only when supported by the player’s state. The suggestion uses the actual seed, selected generations and current badge gates, supplies one useful next location, and hides exact rare outcomes until discovered. No extra global map, daily timer or research currency in the first release. Observe a partner’s ordinary behavior on one road or in Camp to make discovery meaningful beyond ownership. [Arceus gameplay](https://legends.arceus.pokemon.com/en-us/gameplay/) · [New Pokémon Snap](https://www.pokemon.com/uk/pokemon-video-games/new-pokemon-snap)

### Boss families and difficulty

Author each anomaly as a teach → variation → payoff sequence mapped to the shipped intro, mini-raid or raid where available. The next wave after Marowak gives distinctive rules to Hypno, Trevenant and Mimikyu. After it passes, extend to the other four anomaly families and selected villain and League bosses. Shared battle primitives are valuable when encounters use them for different decisions.

| Scope | Direction | What the player can do |
| --- | --- | --- |
| **Cubone / Marowak** | Grave Guard against the last damage category | Change category, set up, or play through the shorter reduction. |
| **Yamask group** | A clearly timed protective stance associated with its relic | Use the guard window for setup, then attack during the advertised opening. Use effects valid for the actual rolled form. |
| **Hypno** | Telegraphed native status attempt after an unmistakable audible and visual tell | Inspect the named threat, choose a safe switch, heal, apply a known counter, or push for the finish. |
| **Phantump / Trevenant** | An announced sustain plan using legal native effects | Disrupt the named sustain, switch away from a seeded effect, or exploit the damage window. |
| **Mimikyu** | Stage a change in the encounter around its native Disguise actually breaking | Read the new state and choose a setup or damage turn. Let the real ability event drive the reveal. |
| **Drifloon group** | A visible tempo window built around a legal field effect such as Tailwind | Reserve a safe response, rely on available priority, or wait out the clearly marked timer. |
| **Parasect** | An opening or threshold with a named, legal spore threat | Use the known counter on the current team, switch, or plan recovery. Tune the first version around one threat. |
| **Mewtwo** | A telegraphed attack pattern with a deliberate recovery beat | Identify the recurring tempo, preserve a switch and hit the opening. |
| **The First and villain climaxes** | Tie one named environmental or tactical rule to the scene. The First reads as an older trainer with a habit the player can learn. | A scout note or a past battle provides a clue. Keep the encounter winnable through ordinary decisions when the clue was missed. |

Use a stable profile ID and revision alongside the frozen encounter. Curated profiles bypass the seeded effect picker. Keep Showdown in control of moves, abilities, order, status, type or category changes, and normal damage. Story-side code may select legal authored strategies and control scenario effects through the existing simulator seam. Export announced, active, broken, and expired state for the log and accessible HUD. Competitive, Quick Battle, local PvP, online PvP and ordinary Frontier rules keep their native behavior. Clearly labelled Story rematches can opt into curated rules.

Check member species, form, moves, ability, held item, stage, and generation eligibility when an arc is assigned and when its battle is built. One audit found fixed anomaly species can currently bypass selected generation filters. For new runs, assign a legal, authored alternative only when its scene and cues have been written to make sense. Otherwise choose another eligible arc from a deterministically ordered pool. Preserve already locked pre-update encounters for retry or offer a one-time, clearly explained compatible transition with their progress intact if preserving the lock would make them unusable. Display the profile appropriate to the resulting foe. Test every single generation, non-contiguous filters and all mechanics off as well as default. [Current phase picker](../battle.html:55303) · [Classic Story rules](../scripts/competitive/classic-format.mjs) · [Native boss rules](../scripts/competitive/classic-boss-rules.mjs) · [Showdown reference](https://www.smogon.com/sim/)

### Carry the Open Circle through the world

Give the ten existing chapters a second beat in a place the player is already going. These are additions to the existing responses. Evidence, mystery, and the stated choice about who gets named still work the way each scene promises.

| Existing chapter | Listen callback | Act callback | Destination |
| --- | --- | --- | --- |
| **1. The Empty Circle** | The keeper recognizes a mark from the rubbing. | A working survey light proves someone restored the line. | Mineshaft Pass or lift office |
| **2. The Shift Below** | The keeper’s duplicate slip is ready to compare. | The lift plate rubbing lets a student match the same code. | Lindenbell archive |
| **3. The Drawer Marked Released** | The ranger follows up in private. | A copied transfer tag is ready for inspection after the clerk leaves safely. | Reedmarket duty desk |
| **4. Last Check-In** | A signed call-log copy is on the check-in board. | The gatehouse clip holds a copy that shows the conflicting load. | Glasswater ranger booth |
| **5. Last Light on the Lake** | The weigh-slip is visible under glass. | Mara’s tackle box shows the trace of the rescued Krabby. | Brasslock depot |
| **6. The Light in Bay Nine** | Ivo’s recovered recording is ready at the relay desk. | A volunteer hangs a dry blanket and points out the lamp they left. | Beaconrest relay |
| **7. One Call Before Dark** | Ivo’s signed account is filed. The hikers’ names stay private. | Hikers warm themselves beside the chapel and thank the lookout. | Vespergate chapel |
| **8. Names Under Glass** | Ina’s signed account is accepted at intake. | The preserved impression is laid out with the disputed return form. | League intake |
| **9. The Intake Window** | A sealed copy is waiting at the service entrance. | The filed public case number can be found on the noticeboard. | Crucible |
| **10. On the Record** | An approved private note appears in the player’s archive. | The public statement shows Ivo’s named testimony. | Crucible and a later journey |

For all ten villain tracks, review one ordinary local routine, one physical contradiction, the player’s intervention, and one line or prop that proves the aftermath. For all eight anomaly tracks, verify evidence order, eligible species, named counterplay, and one optional return or archive observation. Publish a content sheet per track with the actual trigger and status variants, then check narration for recurring exposition and continuity across neighboring routes. The main story should make sense even if the player misses earlier optional clues.

### Finale, cinematics and replay

| Beat | Player sees or hears | What it pays off |
| --- | --- | --- |
| Starter selection | The partner waits at the bench. A brief four-note original motif accompanies the choice. | Record the real starter identity by stable slot ID with a small presentation snapshot if needed. |
| Mid-game road or relay | Recognizable handwriting, a cropped piece of the gallery motif, or the same musical notes muffled through the relay. | Creates a question about who walked this route before. Pair any meaningful sound with subtitle or visible cue. |
| Hall of Fame unmasking | Familiar silhouette resolves into the player’s avatar. One close-up puts the earlier sticker or inscription beside a gallery detail. | Reveals continuity by recognition. Keep the authored lines that define the loop and the signature “the number is a mercy” line. |
| Remember / Forget | The first partner’s figure or an appropriate legacy silhouette appears in the portrait. The complete motif plays after a moment of silence. The choice is visible in both orientations. | Keep both persisted outcomes and the original intent of each reply. Show a real saved previous-run detail only when there is a matching record. |
| Next journey and Crucible | An earned archive recording, postscript, field sketch, or cosmetic keepsake appears when relevant. | Replay gives an authored alternate consequence. Store distinct decisions once across playthroughs. Existing badges and competitive balance stay intact. |

Restructure the exposition around a clue → relationship → decision rhythm. Ensure a missed optional clue has a concise main-story explanation. Resolve the starter through its actual history. It can evolve, be deposited, be traded, or be gone by the finale. Use a truthful memory presentation for those cases and a neutral frame on old saves without a proven partner. Never derive the starter from the first slot in the current party. Respect accepted-loss concealment and the later rematch reveal path.

Build with the existing self-paced narration, layered WebP and sprite treatments, reduced-motion alternatives, transferable captions, and controlled soundtrack ownership. Prototype still art or a short economical animation first. Add at most one scene-specific effect that makes the important visual change easier to perceive. Commission original cue stems for partner, beacon, raid transition and gallery. Test them isolated and in the battle mix, including thin phone speakers, headphones, mute, game interruption, and instant battle speed.

Reuse the Field Archive/Notebook and Crucible. Prioritize ten earned chapter cards and short aftermath differences over another checklist. Later, offer an optional shareable seed challenge inside the existing Frontier with a version label and cosmetic recognition. Offline seeds and archived rules stay usable when a new seed rotates. Avoid tying a unique story outcome to a real-time schedule. [Existing chapter loader](../data/story/adventure.js) · [Adventure archive](../data/story/adventure-progress.js) · [Horror and replay references](STORY_FAN_RESEARCH.md#horror-and-replay-references)

## 6. Learning, inclusion, and interface

Play the first sessions in two qualitative rounds. Aim for six newcomers or returning casual players and at least four experienced players per round, with collectors, story fans and challenge players in the sample. Include touch-first participants. Let newcomers play without coaching. Invite a fresh set after learning from the first round. Treat the targets as local design criteria for discovery sessions.

| Moment | What players need to do | Evidence and decision |
| --- | --- | --- |
| Town 0 and first route | Choose a partner, find the next objective, catch or pass, identify the safe alternate route. | Record first unassisted action, wrong turns, and whether they know how to pause and save. Merge redundant prompts into existing UI. |
| First two Gyms | Inspect a matchup, attempt a sensible switch or prepare at a reachable facility, explain a loss, and choose the next action. | Initial target is five of six newcomer sessions finding and using a preparation option after a first loss without a hint from the observer. A repeated confusion is a design defect to retest, even if the total meets the target. |
| First new boss and world callback | Explain the phase in their own words, name a plausible response, and connect a town prop or NPC to a prior choice. | Initial target is four of six correctly explaining the tell and linking the road action. Watch both types of team and alternate world choices. |
| Advanced play | Inspect details quickly, assemble a legal build, replay a road choice, and finish a serious late fight. | Confirm veterans can skip repeat teaching and get to useful filters. Review six deterministic encounter seeds before changing grade, rewards or fixed stats. |

Offer beginner prose with an expandable detail surface. Named moves show their category, actually applicable power, known immunities and one reason for a recommendation. Show cost, availability and why a locked move is unavailable. At the badge, show one concrete earned action, such as **Add from PC** when there is both a slot and a reserve. Keep one visible objective and a clear back route through Camp, cities, menus and battles. Color, icons and text should all provide the same critical signals. Controls stay reachable on short landscape, in the larger font setting and on real touch hardware. [Xbox objective clarity](https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/109) · [Input](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/107) · [Additional channels for cues](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103)

## 7. Release checks

| Gate | Required evidence |
| --- | --- |
| **Campaign correctness** | Fresh Packaged Scout/evidence run and a Help/action run, plus representative mixed and pass branches. Exercise all stage gates, story and build availability, a beginner-legal complete Gym win, native signature boss wins and losses, Hall and Crucible both ways, carry-to-PC and one-time awards. Record every controlled win clearly. |
| **Native and restricted formats** | Run the existing battle, competitive and replay checks. All scripted raid profiles exercise native rules and correct event ordering. Cover Gen 1 through 9 filters, non-contiguous filters, forms off, the default one-use transformation budget, built-in quick modes, local multiplayer and historical Arena formats. |
| **Save round trips** | Load older current-version and migrated formats. Interrupt before and after road choices, rare throw, boss turn, Safari payment, wager, Dojo purchase and finale choice. Check reward deduplication, frozen seed/party/enemy data, restore on another device, save failure recovery, and offline save export/import. Keep optional callbacks from rewriting history on load. |
| **Physical and browser coverage** | iPhone Safari tab plus Home Screen, iPad portrait/landscape, a lower-memory Android phone with Chrome, and desktop Chromium/Firefox/Safari where available. Test short landscape, enlarged text, keyboard focus, reduced motion and a screen reader sample. Safari and installed Home Screen storage can differ, so verify export and restore in both contexts. |
| **Offline and performance** | Measure encoded cold-start, first battle, through-Gym-1 and full offline bytes, interaction latency, memory and media use on target devices. Compare with the baseline and established budgets. Verify interrupted download, quota and eviction handling, kill/reopen, rollback, offline after update, and zero transfers during warm offline Continue. Keep new illustrations and cue files on demand and in the asset manifest, separate from essential startup assets. |
| **Hosted rooms** | Use consenting testers, separate real networks and a project-controlled staging environment. Exercise host→join→draft→publish→play→forced replacement→rematch→leave. Drop a phone offline before submitting, during turn publication and after a result. Reconnect to the latest authoritative revision, avoid duplicate turns/results, and handle unsupported client revisions visibly. Track stale rooms and entry/exit states. Current room architecture is host-authoritative. Describe the model accurately and require trusted result verification for any new ranked claims. |
| **Release evidence** | Expanded browser gallery, passing changed-surface tests, final package integrity checks, source and provenance review, save-migration notes, and concise ship notes. For each failure, record the seed, device, route, reproducible steps and repair verification. |

Use the existing browser drivers, source tests and release builder. Document what was measured on hardware versus emulated. Existing reports cover simulated layout and local mocked multiplayer. Capture real transfer bytes and unchanged-asset usage in both shell and optional pack. Pin the room and engine revisions exercised and retain the last verified package for rollback. Treat save loss, roster/gear corruption, battle softlock, illegal encounter data, a blocking accessibility failure, and divergent room state as release blockers. Fix and rerun the affected scenario before approval. [Playtest workflow](PLAYER_PLAYTEST.md) · [Delivery budgets](ARENA_OVERHAUL_PLAN.md) · [Installed update driver](../scripts/debug/installed-upgrade-playtest.mjs) · [Local room test](../tests/visual/online-native-room.mjs) · [Apple web apps](https://developer.apple.com/videos/play/wwdc2023/10120/) · [Supabase Realtime protocol](https://supabase.com/docs/guides/realtime/protocol)

## 8. Production responsibilities

| Discipline | Artifact needed before implementation expands |
| --- | --- |
| Systems and encounter design | Phase sheet per family, difficulty placement and fair escape/counter options, list of legal alternatives per supported generation. |
| Narrative and level design | Route-by-route consequence sheet, place and NPC vocabulary, evidence timeline for all Open Circle and villain tracks, finale storyboard. |
| UI and accessibility | Phone portrait, short landscape, tablet and desktop state sketches, focus sequence, caption and reduced-motion checklist. |
| Art and audio | Original landmark silhouettes, compact web-ready crop variants, partner and incident motifs, credits and budget notes. |
| Engineering and save QA | Display name resolver, data contracts, simulator rules and phase event versions, migration fixtures, package-level recovery and performance evidence. |
| Playtest and release | Two newcomer iterations, collector/story and competitive tasks, physical device matrix, staging rooms, decision log and reproducible evidence. |

The first implementation package is complete when a player can follow the same road twice, see a tangible difference in Flintreach, learn a useful preparation step, then win Marowak with a legal party using either a new answer or the team they already brought.
