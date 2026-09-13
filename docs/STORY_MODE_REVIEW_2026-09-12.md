# Pokémon Battle Arena — codebase review and upgrade plan

Review date: 12 September 2026  
Repository: `merogith/battle`  
Reviewed commit: `62202bde7f43df0af00e4d037c5954736310c6c6` (`main`)  
Stage: review and proposed implementation plan. No gameplay, balance, dialogue, or production UI changes have been made or deployed.

Follow-up: [game-wide upgrade backlog](GAME_WIDE_UPGRADE_BACKLOG_2026-09-12.md) covers additional product improvements and feature proposals without a local preview.

## Assessment

The game has a strong foundation and much more implemented content than its monolithic structure initially suggests. The right next step is a coordinated reliability and experience pass. Adding more content before consolidating the rules, progression contracts, and presentation would compound existing inconsistencies.

The most consequential confirmed defect is that in-battle form recalculation discards progression modifiers. A successful Mega Evolution can remove earned player upgrades or a boss's difficulty scaling. Separately, the balance simulator is not faithful enough to certify the campaign: it changes the first encounter, models some purchases approximately, grants free EVs on loss, and carries damaged opponents into retries.

The goal should be **a welcoming but demanding campaign whose rules can be trusted**. Beginners need a clear next action and a practical way to learn; experienced players need dependable calculations, meaningful team building, and fair tactical opposition. Those requirements support each other.

## What was reviewed and what remains unverified

The full repository was obtained and inventoried. The audit traced the major systems and ran the complete existing automated test command, focused independent probes, and a small campaign simulation matrix. This is a broad codebase review with targeted reproduction, not a claim that every line, asset, device, save history, and possible battle combination has been manually verified.

| Area | Evidence examined | Verification level |
|---|---|---|
| Application architecture | `battle.html`, package scripts, loader, globals, exposed test interfaces | Source review; local engine execution |
| Story flow | Timeline, city/route transitions, rival gates, three-track dispatch, narrative queue, victory flow, Mystery Figure and post-game entry | Source review and existing story tests |
| Progression | Team caps, grades, build tiers, BP gates, NPC stages, foe multipliers, training/evolution economy | Live constants, tests, six diagnostic simulations |
| Mechanics | Build/stat calculation, move execution, effects dispatch, ordering, AI, items, abilities, forms and gimmicks | Full tests, reference comparisons, new reproduction probes |
| Content and onboarding | Canonical docs, current tutorials, NPC actions, objective helpers, journal/recap infrastructure, selected main/villain/extra scenes | Source/content review; no beginner user study |
| UI and animation | CSS/layout system, 26 static screens plus dynamic overlays, motion settings, move animation map, camp interactions, prior audit/fix code | Code-based; no current visual certification |
| Saves and offline | Save schema 28, migration paths/tests, local storage behavior, service worker and download flow | Source and automated tests; no physical-device storage-pressure test |
| Other modes | Quick Battle/Gauntlet integration, Online PvP module, SQL migrations, security/concurrency tests | Source and local tests; no two-client live backend session |
| Assets | Repository inventory, local mappings, manifests, data validator | Inventory/reference checks; not frame-by-frame inspection of all media |

The managed browser rejected the local preview with `ERR_BLOCKED_BY_CLIENT`. Current screenshots, screen-reader interaction, touch behavior, frame pacing, and portrait/landscape usability therefore remain unverified. Historical screenshots and reports were treated as context, not new observations.

### Current architecture

- `battle.html`: **77,856 lines; 5,484,785 bytes**. It combines styles, UI markup, data loading, battle rules, AI, narrative content, economy, saves, and presentation.
- **67 timeline rows, 48 battle rows** at the reviewed commit. An older progression document still says 44 battles.
- **954 moves** in the flattened move data and 954 entries in the animation map. An entry is not proof that every effect or animation is correct.
- **17,399 builds** scanned by the data validator.
- Local media is substantial: approximately **433 MiB sprites and 240 MiB music**. These are repository sizes, not initial network payload measurements.
- Story is a custom singles campaign. The engine and reference adapter use one active Pokémon per side. Enjoyment for VGC experts is a valid goal; actual VGC doubles would require a separate format/targeting/turn-system project.

## Test results

| Check | Result | What it establishes |
|---|---|---|
| `npm ci --ignore-scripts` | Completed | Dependencies installed from lockfile |
| `npm test` | **2,586 pass, 0 fail, 35 TODO**; 2,621 reported tests | Existing assertions pass under Node 24.19.0; CI uses Node 22 |
| `npm run debug:data` | **0 findings**, 17,399 builds | Validator's current referential checks pass |
| `npm run audit` | 954 moves; 822 name references, 82 data-driven, 50 damaging-only | Heuristic classification, not behavioral coverage |
| Differential scenarios | 21/21 required match scenarios pass; 1/44 exploratory probes flagged | Selected mechanics agree at the harness's confidence threshold |
| Damage sweep | 0 unexpected divergences in 53 probes, 12 seeds per engine | No large range/minimum-skew differences detected in those probes |
| Independent nature/stat probe | **2,400 comparisons, 0 mismatches** | All 25 natures across four representative species, IV 0/31, selected legal EV spreads at level 50 agree with `@pkmn/data` |
| New form/progression probes | Reproduced modifier loss | See defect R1 below |
| New species-gender probe | Reproduced incorrect assignments | See defect R2 below |
| Story simulation | Six runs: seeds 1–2 × casual/recommended/optimal, Normal, battle items off | Diagnostic only; simulator defects materially affect conclusions |
| `npm run lint` | 1 error, 22 warnings | Existing error at `scripts/debug/ui-rig/phone-audit.mjs:160`, undefined `settings` |
| Spec drift | 21/37 checked line references drifted across four documents | Locator maintenance required; semantic drift separately confirmed |

The Bullet Seed differential flag is **not a confirmed battle bug**. The scenario explicitly allows different random hit counts, yet the generic damage-ratio heuristic labels the large difference as high confidence. Fix the comparison before using that flag as a mechanics defect.

The damage sweep permits range overlap and significant tolerances. Passing it does **not** establish exact integer damage parity. The main damage code itself documents weather-stage and modifier-rounding differences. The 35 TODOs are incomplete assertions, not proof that those 35 moves are broken; some have coverage elsewhere.

Reproduction: `node scripts/debug/review-september-2026.mjs`. Outputs: [probe results](review-september-2026-probes.json). Five concrete findings were also registered in `agent-state/findings/codex-codebase-review-20260912T000000Z.md` and the issue ledger was regenerated. Existing command reports and six simulation records are in [review-evidence-2026-09-12](review-evidence-2026-09-12/).

## Confirmed defects and important gaps

### R1 — Form changes discard progression modifiers · P1 · reproduced

Anchors: `buildPokemon` (~18337), `activateMega` (~18834), `_setMonForm` (~31111), `_reapplyRelationshipBuff` (~18596), in `battle.html`.

`buildPokemon` applies story scaling, EXP-Share levels and Fight Club IV bonuses. Mega/form recalculation rebuilds stats at level 50 from raw IVs and EVs; it restores camp relationship buffs but not the other modifiers.

| Probe | Actual after transformation | Expected if the same build modifiers persist |
|---|---:|---:|
| Charizard → Mega X, story multiplier 1.30, Attack | 150 | 195 |
| Same Pokémon, Speed | 120 (was 156) | 156 |
| EXP-Share +3 levels, Mega X Attack | 150 | 159 |
| Fight Club +10 Attack IV bonus, Mega X Attack | 150 | 155 |
| Scaled Castform → Rainy, max HP | 145 (was 188) | 188 |

Castform retains its `1.3` multiplier marker even after its stats lose that multiplier. This also risks misleading summaries. Ordinary unmodified Mega X recalculation matched the comparison, isolating the progression layers.

**Fix direction:** one shared stat calculation pipeline for initial build and every relevant transformation, with explicit persistent versus temporary modifiers. Preserve HP according to each mechanic's contract. Include foes, player rewards, Primal, Palafin, weather forms, Dynamax, Transform and reversion tests. Transform's copied stats need their own contract; do not blindly reapply every source modifier.

### R2 — Species gender metadata is replaced with incorrect lists · P1 · reproduced

Anchor: gender assignment inside `buildPokemon` (~18539).

Latias, Latios, Cresselia, Heatran and Tornadus are assigned genderless by the current lists. Several species with mixed gender ratios are forced female; regional and special forms frequently fall through to 50/50. The final probe observed **150 fixed-gender mismatches** against the installed Dex among locally available forms. This is a sampled mismatch count; random fallback can accidentally match some fixed-gender species.

**Impact:** Attract, Captivate, Cute Charm and Rivalry inputs can be wrong even if their effect handlers are correct. Existing gender tests manually assign genders, so they do not catch species construction errors.

**Fix direction:** derive gender and ratios from the canonical species data, use the correct seeded stream, preserve valid saved assignments, and explicitly migrate impossible assignments. Test base forms, regional forms, fixed genders, genderless forms and ratios.

### R3 — The campaign simulator overstates its fidelity · P1 · reproduced/source-confirmed

Anchors: `PlayerAgent.pickStarter`, `_evolveAndTrain`, `adaptAfterLoss`; `runStory`; `resolveBattle`.

- It grants the tutorial partner before the opening rival. All six review simulations ran that encounter **2v2**; the real introductory flow is a starter duel.
- `adaptAfterLoss` assigns **508 EVs per Pokémon**, without charging the actual service price or respecting a service transaction.
- `runStory` constructs `foeMons` outside the retry loop. `resolveBattle` reuses supplied mon objects, so damage, status and other battle mutations can survive into retries. The probe preserved a Blissey's **219/330 HP** into a second attempt.
- Training uses an approximate **500G per Pokémon** charge and rebuild shortcuts; it is not the actual NPC purchase flow.
- All three preparation policies use `playerSkill: 'hard'`. “Casual” does not model novice battle decisions.
- Completion remains labeled `hof` even when the run reaches and defeats Mystery Figure.

**Fix direction:** build fresh teams from frozen specifications on every attempt; invoke shared legal preparation transactions; reproduce the actual first-run sequence; separate player decision skill from preparation investment; report Hall of Fame, Mystery victory, concession and post-game access distinctly.

### R4 — Story dialogue contradicts current progression and finale · P2 · source-confirmed

Anchors: `RIVAL_PROGRESS_PRIMARY_QUOTES` (~42258), `STORY_SCENES['main.mfBattle']` (~41110), `rollMysteryFigureFinalBossTeam` (~49111).

- Rival phase 2 includes “Four gyms” despite the rematch following three badges.
- Phase 3 refers to a “seventh slot,” while the party cap is six.
- Phase 4 includes “Post-Hall fight,” although the timeline places that rival before Hall of Fame.
- The Mystery scene promises the exact six **plus an extra starter**. The normal live path deliberately copies only the saved Hall-of-Fame roster, with no extra slot or synthetic starter.

**Fix direction:** derive count/phase-sensitive prose from state, remove obsolete lines, and author explicit variants for short Hall-of-Fame parties, first encounter win/loss/decline, rematches and legacy saves. Add state-aware content validation.

### R5 — Save failures are only logged · P1 risk · source-confirmed failure handling

Anchor: `save` (~45659). `localStorage.setItem` exceptions are caught and logged; the player receives no durable failure state or recovery action. `_lastSave` is updated before the storage write succeeds. No storage-pressure failure was induced on a physical browser in this review.

**Fix direction:** return a save result, record last successful persistence separately, show a persistent “Progress could not be saved” notice with retry/export, and retain a last-known-good save. Test quota denial, malformed saves, interrupted imports, old versions and interrupted reward/scene transitions.

### R6 — Quality checks do not collectively gate deployment · P1 process gap · source-confirmed

Anchors: `.github/workflows/quality.yml`, `.github/workflows/static.yml`, `package.json`.

Data validation, move audit, spec drift and lint are allowed to fail. Differential commands are not part of that workflow. The deployment workflow independently runs on pushes to main; it has no dependency on successful quality checks. The main `battle.html` code is excluded from lint.

**Fix direction:** run one immutable build through required checks before deployment, fail on new actionable findings, add baseline exception files with reasons where necessary, and include browser journeys and deterministic reference mechanics in the release gates. Do not simply turn all historical warning reports into blockers without triage.

### R7 — Visual consistency remains structurally fragile · P2 · measured in source

The current source contains **1,599 inline `style="…"` occurrences, 613 `!important` occurrences and 19 distinct width breakpoints**. The style guard permits 1,600 inline styles and 20 widths. It prevents some growth but does not establish consistent components or good layouts. These are source counts, not rendered defect counts.

The existing arena/stack layout, tokens, accessible modal infrastructure and prior fixes should be retained. In particular, the old landscape HUD clipping rule is now scoped to the stack layout; it would be wrong to re-report the old unconditional clipping defect as current without reproduction.

**Fix direction:** consolidate shared screen shells, action bars, tabs, cards, dialogs, spacing and typography. Reduce the guard ceilings after each component migration. Validate in a real browser before declaring a visual fix.

### R8 — Some camp interactions require pointer movement · P2 · source-confirmed

Anchor: `_campSteady` (~60314). The drifting-target activity wires mouse/touch coordinate tracking and no equivalent keyboard operation in that implementation. This matters because camp activities can contribute to progression bonuses, rather than being purely visual decoration.

**Fix direction:** provide an equivalent keyboard/control alternative and an accessible non-timing option with comparable progression. Test cancellation, focus return, orientation changes and reduced motion. This review did not establish a whole-game keyboard failure.

### R9 — Mechanics coverage and ruleset identity need explicit contracts · P1 verification gap

The move audit treats any matching string literal as a named implementation. A UI label or data list can therefore count as “handled.” Some handlers explicitly say “logged only,” and doubles-targeted moves need a defined singles behavior or availability policy. The game mixes standard mechanics with intentional custom rules and awakened builds.

**Fix direction:** publish a versioned ruleset and maintain an entity support matrix. Mark each selectable move/ability/item/form as canonical, intentional custom, inapplicable to singles, unsupported or verified. Explain meaningful custom differences at the point of use. Inapplicable or unimplemented options must not be recommended as useful builds.

## Story-mode essence to preserve

The campaign is primarily a **team-building journey**, not conventional level grinding. Most Pokémon remain level 50; EXP-Share rewards add a bounded level 51–53 exception. Progress comes through species/evolution, party growth, moves, abilities, items, nature, EVs, IVs and later custom layers.

The narrative has three concurrent tracks: the main gym/rival journey, one of **10 villain arcs**, and one of **8 extra mystery arcs**. The First, the Hall-of-Fame mirror and the remember/forget ending connect repeat runs to the fiction. Camp bonds, town visits and returning NPCs provide continuity between battles.

Keep that identity. The update should strengthen character causality and player comprehension. Avoid reviving the removed eight-tone system, Caged God arc, or other cut systems just because obsolete docs still mention them.

### Proposed story update

1. **Opening:** establish a concrete personal goal, name the rival, teach one action at a time, and show the first unsettling clue briefly. Do not make understanding the mystery a prerequisite for knowing where to go.
2. **First three gyms:** give the rival a visible learning arc. Let town NPCs teach the preparation tool needed for the next challenge. Deliver villain harm through a specific person or place the player can help.
3. **Middle campaign:** connect the chosen villain's actions to changed towns, dialogue and battle preparations. Every investigation beat should identify what was learned and what happens next. Keep optional flavor distinct from required progress.
4. **Final gyms and League:** pay off established clues, rival choices and local consequences. Stage advanced mechanics with practice opportunities before major bosses depend on them.
5. **Mystery finale:** accurately describe the player's actual Hall-of-Fame roster; preserve the optional earlier encounter and later concession/rechallenge paths. Let the mirror battle embody the player's build decisions. Shorten repeated exposition and move optional deep lore into the journal.
6. **Ending and subsequent runs:** reflect remember/forget choices in specific callbacks and relationships. Keep the post-game objective explicit after the reveal or concession.

For **each of the 18 rotating arcs**, create a beat sheet recording setup, character motive, clue, player action, local consequence, battle lesson, reward, resolution and later callback. Validate all 80 villain/extra pairings structurally; editorially inspect collision hotspots where multiple threads occupy one road. Finish one representative pairing end-to-end as the writing and presentation standard before updating the remaining arcs.

Example revised direction text: “Next: challenge the first Gym Trainer. Want help preparing? Visit the Battle Mentor to review your partner's build.” The objective is explicit; preparation is contextual and optional. Exact wording should be generated from the current objective and available facilities.

## Onboarding and NPC usability plan

The current game already has tutorial scenes, a Battle Mentor, an objective label helper, a journal, recaps and staged facilities. Improve their coordination and teaching value rather than creating another disconnected tutorial layer.

Use a shared objective object containing **goal, reason, destination, primary action, optional preparation and completion condition**. Render it consistently in the city, route, camp, journal, pause menu and returning-player recap. Never expose internal row IDs to players.

| Player need | NPC/service to surface | What the UI should explain |
|---|---|---|
| “I don't know how to build my team” | Battle Mentor | Recommended changes, reasons, total cost, exact before/after preview |
| “I need different attacks” | Move Tutor | Move role, effective story power, unlock rule and alternatives |
| “My Pokémon needs to evolve” | Evolution Tutor / Stone Shop / Link service | Eligible evolution, retained upgrades, required item/cost and unlock |
| “I need an ability or held item” | Battle Dojo | Current stage, item/ability effect, next stage and its unlock condition |
| “My stats are poorly distributed” | Nature Rater / EV Trainer | Plain-language tradeoff and exact stats; distinguish reshuffling existing EVs from buying training |
| “I want permanent potential upgrades” | Fan Club | IV effect, cap, cost and comparison with EV training |
| “I caught too many Pokémon” | Pokémon Center / PC | Party cap, storage, swap and safe release/sale consequences |
| “How do special battle mechanics work?” | Colress | One mechanic at a time, cost/slot/rules and practice opportunity |
| “I lost and don't know why” | Defeat review + relevant service | Explain the observed cause and offer a concrete affordable response |
| “I returned after a week” | Continue recap / journal | Last milestone, current team, next objective and newly available service |

Show services by **purpose plus character identity**, not a mysterious NPC name alone. Label actions consistently: “Teach move,” “Change nature,” “Train stats,” “Manage team.” Retain names and portraits for personality. Show unavailable services only when useful, with an exact unlock explanation.

The first-session teaching sequence should be: choose partner → inspect an attack → make a battle decision → understand the result → catch partner → make one suggested preparation change → enter the first gym. Use short practical demonstrations, replayable help, and an expert skip path. Tutorial completion should mean the player performed or deliberately skipped the lesson, not merely dismissed several paragraphs.

## Difficulty and competitive depth plan

### Current curve, from live code

| Segment | Normal foe stat multiplier |
|---|---:|
| Opening rival | 0.75 |
| Cities 0–3 | 0.80 / 0.85 / 0.90 / 0.95 |
| Cities 4–8 | 1.00 / 1.03 / 1.05 / 1.08 / 1.10 |
| Elite Four | 1.14 / 1.16 / 1.18 / 1.20 |
| Champion / final Rival / Mystery | 1.23 / 1.26 / 1.30 |

Difficulty multiplies this by 0.70, 0.85, 1.00, 1.15 or 1.40. These are descriptive values, not proposed replacements. The multiplier affects HP and all five combat stats, including Speed. Therefore “30% stronger” is not a simple measure of encounter difficulty: it changes bulk, damage and turn order simultaneously.

The current move-power progression is C0 40; C1–2 60; C3–4 80; C5+ uncapped, with a starter allowance. Dojo, move-category, evolution, EV training and gimmick unlocks follow their own clocks. Explain those clocks through a shared capability model and expose actual effective values in battle.

### Six-run diagnostic sample

| Preparation policy | Seed 1, Normal | Seed 2, Normal |
|---|---|---|
| Casual | Stopped at City-2 Gym Trainer; 1 badge | Stopped at three-badge rival; 3 badges |
| Recommended | Stopped at final rival; 8 badges | Stopped at Mystery Figure; 8 badges |
| Optimal | Reached and defeated Mystery | Reached and defeated Mystery |

Do not use these six runs as win-rate estimates or balance targets. The sample is tiny and the simulator defects above bias it. Its failure to represent a real novice and its contaminated retries are more important findings than the apparent completion rate.

### Proposed challenge progression

| Segment | Teach | Test |
|---|---|---|
| Opening–Gym 1 | Controls, damage categories, one type interaction | A readable starter matchup and one meaningful decision |
| Gyms 2–3 | Switching, role coverage, evolution, nature | A clearly telegraphed weakness answered by available tools |
| Gyms 4–5 | Status, items, setup, hazards and recovery | Synergistic teams with distinct strategies and counterplay |
| Gyms 6–8 | Speed control, prediction, advanced builds and gimmicks | Multi-turn plans; teach before demanding mastery |
| League | Full team construction and resource decisions | Curated archetypes, matchup adaptation and strong legal execution |
| Mystery / Crucible | Mastery of the player's own strategy | Transparent custom modifiers, rematches and optional expert challenges |

Balance using enemy strategy, team synergy, available counters, information and AI competence as well as raw stats. Keep Normal demanding but recoverable. Provide expert challenge rules and post-game depth without forcing beginners through unexplained systems. Any eventual doubles mode must receive its own rules and testing matrix.

After simulator repair, sweep all difficulty settings, generation restrictions, preparation styles, decision-skill profiles, item settings and selected story pairings. Record first-attempt wins, retries, forced-switch failures, KO/turn counts, time to clear, resource affordability and which counterstrategies were available. Use fixed seed cohorts and percentile distributions, then compare with observed beginner and expert playtests.

Suggested evaluation criteria to agree before tuning: no unavoidable progression deadlock; an affordable recovery path after defeat; required counters introduced before the challenge; no seed-specific opening wall without a preparation response; optional expert challenges remain strategically demanding after optimal preparation. Numerical win-rate and economy targets should be chosen after a faithful baseline, not guessed now.

## UI, visuals and animation plan

Preserve the game's pixel-art identity and strengthen its hierarchy. Use one screen shell with a location/title, stable navigation, one primary action, contextual secondary actions and predictable modal behavior. Apply the same components to home, Story, battle, facilities, Quick Battle and Gauntlet.

- **Typography:** test pixel text for long dialogue and dense stats. Consider a readable companion body font while retaining pixel titles; the current single-font guard would need deliberate revision. A 10px floor is not itself a readability standard.
- **Components:** shared buttons, cost badges, type/status chips, party cards, tabs, empty/error/loading states, confirmations and sticky action bars. Avoid one-off inline styling for each NPC.
- **Responsive behavior:** maintain the existing arena/stack distinction, use content-driven sizing, safe-area padding and scrollable short-height layouts. Important controls and both HP displays must remain reachable in landscape and with the virtual keyboard open.
- **Motion:** build on the 954-entry map with reusable anticipation, travel, impact and recovery phases. Coordinate HP changes, sound, status popups and fainting from one battle event sequence. Reserve elaborate bespoke effects for signature moves and climaxes.
- **Control:** independent text speed, battle speed, sound and reduced-motion preferences. Skipping an animation must not skip a state mutation, duplicate rewards, consume extra RNG or release input locks early.
- **Clarity:** make misses, immunity, protection, absorption, critical hits, switching, hazards and ability activations visually distinct. Use text/icons as well as color.
- **Performance:** load current-scene assets first, retain opt-in bulk offline download, pool effects, limit particles, avoid layout thrashing and clean up timers/listeners on navigation. Measure actual low-end-device frame time before choosing effect budgets.

Proposed device acceptance matrix: 320/360/390px phones; 844×390 landscape; 768×1024 and 1024×768 tablets; 1280×720 laptop; 1440×900 and 1920×1080 desktops. Include touch and keyboard, text enlargement, reduced motion, browser zoom, resume/backgrounding and interrupted loading. Run Chromium, Firefox and WebKit automation, plus real iOS Safari and Android Chrome testing.

Use WCAG 2.2 AA as the interface accessibility baseline, with game-specific review of essential spatial/timing interactions. W3C's target minimum is 24×24 CSS pixels with specified exceptions; use **44×44 as the product's preferred primary touch target**, not a false claim about the AA minimum. Menus and text should reflow at narrow widths, and nonessential interaction animation should be suppressible. Sources: [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

## Implementation sequence and completion gates

| Phase | Deliverable | Completion gate |
|---|---|---|
| 1 — Reliable baseline | Fix simulator fidelity, mechanics support inventory, repeatable repro fixtures, shared release checks | Real opening and retries reproduced; no false completion labels; new audit scripts reproducible |
| 2 — Mechanics and saves | Shared stat pipeline, gender metadata, exact-rule comparisons, save failure/recovery UX | Reproduced defects fixed; canonical/custom behavior specified; save migration and failure fixtures pass |
| 3 — First-hour experience | Shared objectives, service descriptions, practical teaching, defeat guidance, return recap | Beginners independently choose next action/NPC; experts can skip teaching; no new progression gates |
| 4 — Consistent UI foundation | Screen shell and shared components; migrate home/battle/first cities, then all facilities and secondary modes | Device matrix passes; keyboard/focus/touch verified; style guard ceilings reduced |
| 5 — Campaign and writing | State-correct rival/finale text; one finished arc pairing, then all remaining arcs; capability-based unlock explanations | Every required beat reachable once; rewards once; journal agrees; all 80 pairings structurally valid |
| 6 — Balance and expert depth | Calibrated Normal curve, differentiated difficulty, authored boss strategies, expert post-game challenges | Faithful seeded sweeps plus beginner/expert playtests meet agreed targets |
| 7 — Animation and performance | Unified event presentation, move families, signature effects, scene transitions and audio mix | Same battle trace with animations on/off/skipped; no stuck locks; measured mobile budgets met |
| 8 — Release qualification | Cross-browser full journeys, legacy saves, offline update/recovery, secondary-mode checks | No open release-blocking defects; a green tested artifact is the one deployed |

Small story corrections can be drafted alongside phases 1–2; the larger writing and visual pass should use the shared foundations. Balance tuning follows simulator/mechanics repair. Avoid a wholesale rewrite of the monolith: extract bounded modules with characterization tests, beginning with pure rules/data and shared UI, while preserving the public interfaces.

### Meaning of “every NPC, move, ability and item works”

Maintain a release inventory with an owner, supported ruleset, runtime handler, tests, UI explanation, source and known limitations for every selectable entity. Validate every NPC's entry/unlock/transaction/cancel/re-entry path; every move's relevant success/failure/immunity/target/timing cases; every ability's activation/suppression/switch/form interactions; every item's consumption/removal/restoration/suppression; every nature and stat boundary. Combine exhaustive entity coverage with targeted pairwise and adversarial multi-effect scenarios. Exact battle traces, not name counts, should back a supported claim.

Full combinatorial perfection cannot be demonstrated by one review or a green suite. A credible release claim is that all supported entities have the required evidence, no known blocking defects remain, and representative end-to-end/device/competitive tests pass.

### First proposed implementation batch

Start with **R1 form-stat persistence, R2 gender construction and R3 simulator correctness**, alongside save-failure handling and required release gates. Then build the first-hour onboarding/UI slice against reliable mechanics. This sequence directly addresses experienced-player trust, beginner confusion and difficulty calibration without spending a visual overhaul on unstable behavior.

This document proposes changes for review. Existing repository guidance requires sign-off before game-behavior changes are committed; no such changes have been committed in this audit.
