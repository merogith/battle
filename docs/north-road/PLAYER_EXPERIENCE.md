# Player experience production specification

[Build runbook](../NORTH_ROAD_BUILD_RUNBOOK.md) · [Campaign content](CAMPAIGN.md) · [Release verification](RELEASE.md)

## Work packages

| ID | Deliverable | Completion |
| --- | --- | --- |
| UX-01 | Opening baseline and new-player QA fixture | Record Normal defaults, actual accessible services, legal starter moves and first two Gym assignments before changes. |
| UX-02 | One battle lesson and one practical defeat action | Reuse move details, live logs and the existing Defeat review. Recommend only a currently possible response. |
| UX-03 | A road outcome and stable city identity | Prove the three Route 1 choices in the current city screen, independent of the rolled leader. Then apply the display to the other eight roads. |
| UX-04 | Pokédex habitat lead and earned replay | Extend the present entry and the Field Archive with no new top-level collection surface. Keep the existing Frontier facility for an optional seed challenge. |
| UX-05 | Acceptance and player iteration | Test keyboard, touch, browser back, restored progress and blind players, then run the changed-surface checks again. |

## First-hour script

The live timeline places Pallet at row ID 0, the opening Rival at 68, the first Basic Trainer at 1, Flintreach at city rows 3 and 6 with Gym battles at 4 and 5, then Basic Trainers at 7 and 8 before Kettlestone’s city rows 9 and 13 with Gym battles 10 and 11. Key logic by row ID or the existing city index, never by display strings. Preserve current stage prices, badge grants, trainer assignments, turn order and difficulty settings. Base level stays 50 with the existing late-game Experience Share exception. [Timeline](../../battle.html:38379) · [Progression](../PROGRESSION_CURVE_MASTER.md)

| Trigger | Player sees | Proof |
| --- | --- | --- |
| New Adventure and Pallet | Existing trainer form and Lab objective. In the starter picker selecting and inspecting have different controls. Any required facility leads the single gold objective. | No input autofocus on first phone render. The ordered moves promised in the Lab match the claimed build after save/reload and the first battle. |
| First move menu in Rival | Existing Fight menu, separate **Move details** and action buttons, one optional line saying the arrow describes typing and abilities may alter the result. | Details can open and close without selecting a move, spending PP, changing RNG or advancing the turn. |
| Lost solo Rival | Existing Retry, Return to Last City and Concede actions. Lead the review with one verified fact, or present the existing replay/help choices for an unknown loss. Quote the real current costs. | No advice to switch with an empty bench, use an unavailable bag item or buy an illegal lesson. Concede retains its actual cost and outcome. |
| First catch and Road 1 | Existing catch prompt and rarity cues, then the three current road choices with literal benefits. | State the available space and caught destination. Current scout/habitat and help rewards still happen once, and Pass keeps hub, badge and story open. |
| Flintreach before Gym | One gold objective, persistent road consequence, and optional **Review Gym tip** only where earned. A mandatory facility gets the current objective ahead of the Gym. | Tip reflects the assigned leader’s known specialty and never predicts a private enemy ability or full roster. Road outcome is still visible after the Gym. |
| Gym deputy 1 → leader 1 | Explain a public result. Example after a real Bronzor immunity: **Levitate blocked Mud-Slap. Check your other attacks or switch.** | Use a current legal staged fixture for this exact interaction, and a separate production journey whose lesson adapts to the assigned leader and public events. No forced Bronzor or automatic advantage. |
| Badge 1 | Existing cap change and **Add from PC** if an eligible reserve and open slot exist. | Acceptance moves the exact ID once and survives reload. Leaving or proceeding without it leaves the reserve alone. |
| Kettlestone and Gym 2 | Practice one purposeful switch or a stage-legal build improvement. Include at most one actionable recommendation. | The actual assigned opponent matters and trainers can ignore optional advice. Tutor, Dojo, evolution and stone choices retain their gates. Test a restricted-generation journey as well as Normal defaults. |
| Badge 2 | Show the actual unlock and next destination. Keep the objective where players learned to find it. | No duplicate teaching overlay or automatic spend. Continuation works for returning players. |

The existing player observation had a Bronzor-style Ground immunity and a confusing green arrow. Verify the live seed if it can still reproduce. A disclosed deterministic fixture is suitable for regression but does not replace a full unmodified Gym 1–2 run through real outcomes. [Playtest observations](../HUMAN_STYLE_PLAYTEST.md#findings-from-the-original-build)

## Battle advice and defeat recovery

1. Implement in the already-installed sibling controls .battle-btn-move and .move-info-hit and in the existing #screen-story-gameover, _showStoryDefeat, GameUpgrades.openBattleReview and Notebook team page. Use native request availability for legal actions. Keep the visible info hit target and its own accessible name.
2. Observe the existing public flow describeBattleLog → applyNativeBattleView → recordBattleEvent. The private native view contains an opponent’s hidden ability and item. Use only publicly disclosed protocol events for advice. The recorded event currently drops detail such as the Levitate cause on -immune. Normalize structured public cause/target/turn fields before rendering, and bind the known move semantically. Avoid regex against user-facing English and avoid calculating a guaranteed future outcome from a prior observation.
3. Choose the latest decisive verified observation with a deterministic priority for ties. A direct immunity or known signature counterplay takes priority, then a named super-effective hit, then a known status or setup obstacle, then neutral Inspect. Offer one applicable action, preferring an equipped PP-positive move or available switch to shopping. Mention an affordable legal lesson only where the actual availability, cost, stage, generation and reachability all pass. A Heart Scale waives a legal price and supplies no extra move access.
4. Put fact plus action in the existing defeat review. If choosing training, route back through the normal retreat action, with its actual displayed fee. On arrival, render one selected prep cue. Use enterTutor('moves', {partnerId,move}) only after a legal current check. Preview and opening the Tutor never apply or buy anything. If the candidate or slot becomes unavailable, render an ordinary preparation cue. Rival counterdraft exceptions and other existing retry behaviors remain intact.
5. Continue currently empties state.battleEvents before a restored Defeat. To show the same useful fact after reload, attach one bounded public observation to the existing defeat-save transaction, keyed to the run, row and revision. Recalculate price and recommendation from current state. Old or invalid records fall back to neutral advice. Retain the observation through the requested city handoff, then clear it on retry, victory or completion of that handoff. Verify identical RNG, cost, difficulty and encounter data.

Specific tests cover known immunity vs unrevealed ability, known live immunity vs the standard type icon, remaining PP/choice lock, replacement phase, switched or departed advisor target, insufficient resources, offline learnset delay, unavailable Teach action, voucher, loss/reload/retreat, existing battle bag claims, and a neutral recommendation for older saves. In the known immunity case prefer “Levitate blocked this last turn.” in the detail. Conditions can change, so the ordinary type-chart label retains its honest meaning.

## City, road and navigation contract

The existing shell has #story-city-primary, #story-adventure-city, #story-city-milestone and #story-city-secondary. Keep one gold objective and its existing precedence through lab, camp return, required facility, Gym and route. Keep the current facility groups Story, Team & Storage, Train, Shops and Connect & Bag, and the existing optional Open Circle invitation. The preferred addition is one optional contextual expansion in the existing tips area for a road or chapter consequence, with an active story or main objective taking no extra step.

Use renderCityActions and existing advice/presentation entry points. The callback rendered by _roadDiscoveryArrival currently vanishes after clearing a Gym or when the Rival/Mystery portrait has priority. Render the durable physical payoff and its inspect/talk action independently of that quote. Derive it from committed choice through a pure read. If two eligible consequences compete, show the most immediate earlier action until acknowledged and leave other earned material available in Story & clues or Field Archive. Keep acknowledgement UI-only unless the base narrative state requires durability. Use normal audience-visible state and no RNG to paint or re-open a consequence.

Expose a stable locale name on phone and desktop, including HUD, route arrival, return from defeat, location facts, victory and archive replays. Keep visiting leader hometown independent. Reuse upgradeSnapshot and upgradeVisit for current enabled services. Preserve cursor or a safe fallback when dynamic groups change. Refresh the town-name and hub goldens to check new intended labels while retaining row-ID and trainer mapping assertions. [City renderer](../../battle.html:56141) · [Town-name regression](../../tests/suites/story-town-name-cityidx-v23.test.js)

## Collection and replay

| Surface | Behavior |
| --- | --- |
| Current Pokédex entry | Add one optional **Find a habitat** detail under the existing type, status, source and sighting facts. Keep the genuine Seen or Caught status, exact selected observed form, shiny regular toggle, filters, card focus/scroll restoration and previous screen. |
| Recorded sighting | Display the actual reported location. A legacy firstWildLocation string is still historical location copy. It does not create a current travel destination. Record a structured key only when the player legitimately sees the species in a known habitat. |
| Unsearched reachable habitat | Use a pure candidate query shared with the live encounter pool. Require a truly available path, unspent encounter, active generation and city evolution cap. Offer one verified lead and wait for the player to choose whether to travel. |
| Later or no lead | “Later in the journey” requires a known, eligible authored location and proven progress gate. Other states use a neutral **No route lead yet**. A consumed or out-of-reach path can remain a record. |
| Current Field Archive | Add earned clue/callback cards by archived runId and respect existing outcome slots. Replay through the current read-only dialog and restore focus to the card. Preserve archive merge/version handling, identify earned history accurately, and avoid giving rewards or leaking a future secret in labels. |
| Current Frontier | Use its existing facility, offer an optional shared seed/rules revision and cosmetic result. Keep already earned challenges and archive cards available offline. No daily streak or timed story expiry. |

Reuse openCollection, _renderPokedexEntry, pokedexOpenEntry and pokedexCloseEntry. Reveal only species and forms supported by the player’s recorded sightings. Preserve Tab/Home/End behavior across the existing tab order. Keep horror within fictional notes and records, with reliable settings, backups and room controls.

## Interaction and evidence

- Key touch targets reach 44 × 44 CSS pixels. Check 320×568, 568×260, 390×844, 820×1180 and 1440×900. Verify larger text, reduced motion, mute and contrast. Keep one primary scroll area per surface, hit targets clear of sticky footers/save notices, and persistent access to Continue, Back and Settings.
- Reuse the existing topmost dialog stack and _registerAppDialog. Escape/browser Back closes only the top layer and focus returns to the original trigger or a stable visible fallback. Verify equivalent control through keyboard, touch and a screen reader without relying on hover, color or sound. Announce one committed result instead of successive animation frames or timer ticks.
- Extend existing story-onboarding, story-milestone-actions, story-collection-layout, story-retry-save and story-starter-parity browser drivers. Use targeted game-upgrades, story-road-discoveries, story-pokedex and a11y-modal-focus-trap-v23 suites. Record actual inputs, battle outcome, stage, save/RNG/PP/gold delta, keyboard focus, clipped controls, viewport and any checkpoint shortcuts.
- Per proposed round use six uncoached newcomers/returners and at least four experienced players, including collectors/story and challenge audiences and touch-first users. Give two tasks without button names. “Choose a partner, reach the next two towns, and show how you would prepare for a fight that went badly.” “Find out what changed after your first detour, then explain the raid warning in your own words.” Record first action, wrong turns, expected result, observed result, help requests, and stopping point. Target at least five of six finding and trying one workable preparation action unaided and at least four of six understanding the tell and visible callback. Investigate repeated confusion even if a target passes. Retest with new players, and report these counts as qualitative design criteria.
