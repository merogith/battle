# Player playtest protocol

The [full-scale playtest plan](FULL_SCALE_PLAYTEST_PLAN.md) defines the complete execution sequence, player assignments and release criteria. Use its [coverage register](PLAYTEST_COVERAGE_REGISTER.csv) to assign and track individual cases. Add the [field and stress-testing methods](FULL_SCALE_PLAYTEST_PLAN.md#9-test-voluntary-play-learning-strategy-and-access) for open-ended home play, learning transfer, masked comparisons, competitive and bad-luck testing, friend invites, and gameplay accessibility.

Use the same packaged build and three core passes. A scripted run proves observable game behavior. A blind run shows where a player-like decision can go wrong. A confirmed defect gets a replayable regression. The full plan defines separate participant and platform evidence for natural play, returning after a break, and gameplay with assistive technology.

## Run the three passes

| Pass | What the tester can see | What to report |
| --- | --- | --- |
| Scripted regression | Use Playwright, fixtures, seeded starts, engine events, persisted saves, and fault injection where useful. | Expected and observed results by task and state, browser or engine, exact reproduction, and evidence. Label fixture entry and controlled wins at the affected step. |
| Blind exploration | Give an independent agent a clean packaged session, a charter, and screenshot and input tools. For a keyboard or assistive charter include the accessibility tree. Start only with information the player would already know. | Visible decisions, mistaken assumptions, backtracks, skipped scenes, places a task stalled, notable audiovisual cues, and the reason the agent stopped. Record these as observations. |
| Confirmation | A second agent repeats the reported symptom from a fresh session without seeing the first agent's route or diagnosis. Then give a diagnostic agent access to code, logs, traces, and fixtures. | Confirmed, intermittent with conditions, or unconfirmed. Turn confirmed functional defects into minimal assertions and rerun the related charter after the fix. |

Use Cloud Desktop for the blind lane when a session depends on actual screen layout and input. Give each agent a fresh profile or browser context, with separate saves and no shared history. Use Playwright for the regression lane and retain its trace for failures. A scripted run can use accessible locators that mimic visible controls. A blind agent receives screenshots or the agreed accessibility surface and uses ordinary clicks, taps, scrolls, or keys. Keep source, hidden stats, CSS selectors, future plot beats, seed controls, and developer actions out of its context. [Session-Based Test Management](https://www.satisfice.us/articles/sbtm.pdf) · [Playwright best practices](https://playwright.dev/docs/best-practices) · [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)

This is a practical use of autonomous QA and vision-based game testing. VideoGameBench separates playing at the game's own clock from modes that give agents longer to observe. Use both where appropriate and keep their timing evidence separate. GBQA's highest reported detection rate was 48.39% on its own verified, deliberately introduced game defects. That's a reason to keep deterministic regressions and independent retests alongside blind exploration. [EA SEED on autonomous game testing](https://www.ea.com/seed/news/cog23-challenges-deploying-rl-agents-game-testing) · [VideoGameBench](https://vgbench.com/) · [GBQA](https://arxiv.org/abs/2604.02648)

## Assign goals and a stopping point

Describe experience as knowledge and behavior. For instance, an agent can know the type chart and choose to inspect unfamiliar abilities. Keep persona and neutral runs for high-risk charters and compare the actions they actually took. Give agents a success outcome and an honest stopping rule, such as abandoning a path when they run out of in-game ideas. [Research on the limits of persona prompting](https://aclanthology.org/2025.emnlp-main.1364/)

| Charter | Player goal given to the agent | Evidence the evaluator looks for |
| --- | --- | --- |
| First-time trainer | Choose a partner, buy something useful, fight the Rival, and earn the first badge on a phone. | Understands inspect versus commit, makes at least one independent move choice, uses the available recovery after a loss, and finds where to use the first badge reward. |
| Gym planner | Prepare for a three-fight Gym. Take a break, come back, and finish it. | Discovers the round count and deliberate next action, reviews or adjusts the team, then returns to the same bracket. See win, loss, retry, and Hard-mode resume in separate verified cases. |
| Explorer | Uncover a road lead, decide whether to follow it, and find out what it changes in the next town. | Can explain the visible consequence, find the next objective, and recognize what changes on an alternate run. Include camp and a side activity, then check alternate branches with fixtures separately. |
| Collector | Catch something for which there is no empty party slot, find it again, and prepare it for battle. | Finds Party or PC destination, the exact Pokédex entry, and one legal training or evolution action. Exercise Safari, flee, failed throw, and a legendary in their own states. |
| Story-focused player | Follow the existing chapter clues, reach a major raid, then return to the story. | Identifies the opening stakes and result, distinguishes a phase cue from damage, finds the aftermath, and can return to choices or the archive. Compare first view, retry, and Fast or muted presentation. |
| Competitive player | Inspect a matchup, build or import a team, complete a historical and a modern match, then review a replay. | Discovers accurate move details, observes legal target and replacement choices, understands results, and sees only public facts in the battle. Test local, standalone and two-player rooms separately. |
| Returning and offline player | Pause a download, reopen the game, and continue the same journey offline. | Finds status, recovers a previous save, sees what a delta update downloads, and returns with state intact after a network interruption. |
| Keyboard and low-motion player | Reach a real battle and finish a story interaction using keyboard only or larger text and reduced motion. | Focus stays visible, actions have accurate names, dialogs return focus, captions include essential information, and major scenes remain completable without motion or sound. |
| Repeat player | Start a rematch or streak mode, complete a round, take a break, and decide whether to continue. | Sees earned progress and how to exit without losing it. Exercise Gauntlet draws, Frontier banked rewards, League rematch recovery, and Fight Club forfeit separately. |

Track coverage by **mode, task, and state**. A raid is separate checks for warning, activation, expiry, and interrupted retry. A capture includes a catch, full-party placement, breakout, and flee. Use pairwise configurations for common combinations of input, layout, speed, generation settings, and seed. Explicitly add high-risk cases such as short landscape with larger type and touch, Fast with reduced motion and multi-hit, reconnect while a replacement is pending, and an offline upgrade after a paused download. Keep at least one continuous opening and one long repeat-player session. [NIST combinatorial testing guidance](https://csrc.nist.gov/pubs/sp/800/142/final)

## Capture decisions and outcomes

Record the release ID, charter ID, scenario or seed when the evaluator can identify it, viewport, browser, input, speed, motion preference, connectivity, and entry method. For each meaningful action keep:

1. What the tester could see and what they expected before acting, in one sentence.
2. The input, timestamp, before/after frame, and visible outcome. Keep raw screenshots and motion samples for faces, focus, effect contact, HP, and newly enabled controls.
3. Whether the task passed, failed, or remained unobserved. Record misclicks, backtracks, retries, help requests, and the stopping reason. Use a distinct field for fixture access and controlled wins.
4. The smallest repeatable steps, affected state, and player consequence. Report broken competitive choices, save loss, inaccessible required controls, and misleading battle outcomes as functional defects. Save a separate observation for unclear wording, tentative pacing concerns, or artistic preferences.

Measure input to next paint, engine resolution, first impact cue, next legal command, and tool/model overhead independently. For effects, take real motion-enabled video or timed frames. Screenshots taken with animations disabled can skip the exact beat under review. Run timed minigames and live deadlines in real time with known input for correctness. An exploratory paused agent can still show whether the objective, controls, and feedback were discoverable. [Interaction to Next Paint](https://web.dev/articles/inp) · [Playwright screenshot options](https://playwright.dev/docs/api/class-page#page-screenshot)

## Reusable blind tester brief

> You are playing a fresh build with the device and game knowledge described in your charter. Try to reach the stated goal using only what you can normally see and operate. Make your own decisions. Before a significant choice or a confusing control, say briefly what you expect and why. Continue through genuine wins and losses. If you are stuck or would normally put the game down, record the last visible state and why. Report exactly what happened, your guesses about its cause, and any task you could not observe as separate facts. Keep save-changing or competitive actions within the charter's test profile.

## Run existing Battle checks

Run these against the packaged build at its loopback URL. Use `BATTLE_TEST_CHROMIUM` if the workspace uses an installed Chromium binary. The offline update regression serves two verified releases at one origin. After the normal update, it adds a temporary single-clip fixture to exercise the media delta without altering either release.

```bash
npm run playtest:player -- --seed=77 --chapters --real-battles=3 --real-turns=5 --milestone-turns=2
node scripts/audit-battle-move-profiles.mjs --json
node tests/visual/battle-motion-catalog.mjs
node tests/visual/battle-motion.mjs
node tests/visual/story-gym-intermission.mjs
BATTLE_TEST_ROOM_RECONNECT=1 node tests/visual/online-native-room.mjs
node tests/visual/offline-pack-update.mjs /path/to/previous-release /path/to/candidate-release
```

The catalog check advances a controlled frame clock and checks that each move paints, reaches its contact callback once, and releases its stage. The live browser check uses ordinary animation timing and true outcomes. Use the existing playtest gallery and append individual charter traces instead of replacing the scripted pass. [Battle test runner](PLAYER_PLAYTEST.md) · [Previous blinded findings](HUMAN_STYLE_PLAYTEST.md)

## Calibrate after the automated pass

A model can flag a confusing screen, run an unusual input path, or confirm a save and battle invariant. Use actual newcomers and competitive players to evaluate learning curve, perceived difficulty, pace, attachment to the cast, and whether they choose to replay. Ask them to use their usual phones, keyboards, or assistive setup. Have them attempt the charter unassisted and debrief afterward. Compare their observed choices and stopping points with the agent traces before using the latter to prioritize subjective changes. [GOV.UK moderated usability testing](https://www.gov.uk/service-manual/user-research/using-moderated-usability-testing) · [W3C on involving users](https://www.w3.org/WAI/test-evaluate/involving-users/)
