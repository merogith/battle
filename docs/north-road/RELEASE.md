# North Road QA and release runbook

[Build runbook](../NORTH_ROAD_BUILD_RUNBOOK.md)

The candidate is the exact hash-verified browser and installable PWA artifact tested below. The previous audit sets the comparison baseline for coverage and bytes. The new release needs fresh evidence from the staged game, physical devices, and hosted rooms. Native wrappers and store distribution belong to a later delivery milestone. [Current audit](../../agent-state/playthrough/immersion-audit/PLAYTEST-AUDIT.md) · [Player drivers](../PLAYER_PLAYTEST.md) · [Delivery plan](../ARENA_OVERHAUL_PLAN.md)

## 1. Pin the baseline and fixtures

1. Preserve the working tree. Record current source revision and worktree status. Retain the last verified artifact and its manifest, the published production reference if different, and the approved candidate reference. Deploy from a reviewed clean checkout with its intended generated inputs recorded.
2. Stamp Node 22.x, npm, Playwright and browser builds, commit, `dist/release.json` version/digest/file count, Story rules revision, `@pkmn/sim` lockfile version and generated bundle hash. Capture Story save version, backup version and archive version. Current source uses Story save v28, backup v1 and archive v1. Record the actual candidate values.
3. Use one evidence directory per candidate and one subdirectory per case and attempt. Preserve machine-readable reports, a sanitized console and request summary, and images or video where relevant. Remove room credentials and personal save contents from shared evidence.
4. Create a fixture registry using stable seeds and ordinary legal party snapshots. Verify species, forms, level, moves, items, gold, badges and facilities at the starting row. Debug seeds can shorten setup. A proof of battle balance uses only those attainable values and outcomes determined by native play.

| Fixture | State and evidence |
| --- | --- |
| NR-GYM-EARLY | Seed 253 is an existing opening/defeat recovery seed. Pin a Normal first-Gym journey after checking its actual roll, a legal basic counter and a second-Gym follow-up. Inspect the relevant known immunity or category, lose deliberately, use an affordable preparation action, and win a full match. Check the badge, party expansion and actual next action. Sample one partner, empty PC and low gold separately. |
| NR-ROAD-01 | Route 1 before its prompt, before its encounter and after arrival in Flintreach. Run Scout, Help and Pass from equivalent copies. Record save and next legal encounter. Include v28 missing its choice, already claimed supplies, and a conflicting second tab. |
| NR-BOSS-01 | Teaching encounter and final Marowak profile. Pin entrance seed and resolved legal parties. Register one team with both attack categories, one with a single damaging category, and a loss. Document actual moves when the first battle is approved. |
| NR-STORY-253 | Seed 253, Scout/evidence journey from Pallet to the Crucible. Retain road, camp, item, full-PC and discovery traces. |
| NR-STORY-77 | Seed 77, Help/Act journey through League, alternate ending and Crucible. Collect the ten chapter records for that path. |
| NR-STORY-MIX | Scout, Help, Pass repeated and opposing selected chapter choices. Use the mixed-route browser driver to verify the saved choice for each destination. |
| NR-FINALE | Pre-fight, accepted loss, completed win, pending reply, awaiting choice, Remember, Forget and rematch. Include original partner evolved, stored, traded/gone, and an old save requiring a neutral portrait. |
| NR-SAVE-LEGACY | The existing v19 migration seed and a valid v28. Add samples for any changed historical boundary. Include items, favorite, PC, egg, Journal, archive, pending encounter, an older same-run backup, and a different-run backup. The v19 loader-only fixture needs a valid move list for the UI import path. |
| NR-PACK-A/B | One secure test origin, previous immutable release A and candidate B. Retain fresh profile, A save and complete pack, incomplete A pack, and B save after new content. |
| NR-ROOM-H/G | Two independent profiles/devices on distinct networks, tagged staging room. Track join, pending choice, resolved revision, phase, result and both visible boards. |

## 2. Automated checks and executable commands

Run from repository root in Bash. Use the dev server on an isolated machine without forwarding its port. It listens on the default interface and serves the repository root as well as `dist/`. Physical-device tests use a separate HTTPS preview serving only the artifact.

~~~bash
node --version
npm --version
git rev-parse HEAD
git status --short
npm ci
npx playwright install chromium webkit firefox
~~~

Regenerate only in the implementation checkout when generated inputs need updating. `build:pwa` also regenerates sprite metadata and icons, builds competitive bundles and refreshes the offline manifest. `offline:manifest` is sufficient for changed packaged assets when generated bundles already match. Freeze the generated inputs before candidate verification. `build:release` hashes allowlisted files, rejects stale entries and recreates `dist/`. Keep any baseline artifact elsewhere first.

~~~bash
# Use during implementation when generated inputs changed.
npm run build:pwa

# Use on the frozen candidate.
export QA_RUN="agent-state/playthrough/north-road/$(git rev-parse --short HEAD)-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$QA_RUN"
set -euo pipefail
npm run lint | tee "$QA_RUN/lint.log"
npm run debug:data | tee "$QA_RUN/data.log"
npm test | tee "$QA_RUN/node.log"
npm run audit | tee "$QA_RUN/audit.log"
npm run build:release | tee "$QA_RUN/package.log"
cp dist/release.json "$QA_RUN/release.json"
git diff --check
~~~

Quality CI also refreshes the symbol index and runs advisory spec drift. Run targeted suites during each change, then retain the full candidate result.

~~~bash
node --test tests/suites/story-road-discoveries.test.js \
  tests/suites/adventure-content.test.js tests/suites/adventure-progress.test.js \
  tests/suites/story-pokedex.test.js tests/integration/save-migration.test.js \
  tests/suites/game-upgrades.test.js
node --test tests/integration/classic-boss-rules.test.js \
  tests/integration/classic-scenario-rules.test.js tests/integration/classic-simulation.test.js \
  tests/integration/competitive-simulation.test.js tests/suites/story-boss-mechanics-v22.test.js \
  tests/suites/story-battle-form-budget.test.js tests/suites/story-enemy-roster-fallback.test.js
node --test tests/suites/release-integrity.test.js tests/suites/offline-pwa-assets.test.js \
  tests/suites/online-pvp-hardening.test.js tests/integration/pvp-stub.test.js
npm run test:differential
~~~

Keep the candidate shell for the browser commands, and start the server in a separate terminal. If the candidate shell has closed, export the same `QA_RUN` path and turn on `set -euo pipefail` before running browser cases. If using system Chromium, set the optional `BATTLE_TEST_CHROMIUM` to its executable and record its version.

~~~bash
PORT=5177 node scripts/dev-server.cjs
~~~

~~~bash
: "${QA_RUN:?Set the candidate evidence directory}"
export BATTLE_TEST_URL=http://127.0.0.1:5177/dist/battle.html
export BATTLE_EXPECT_STORY_ENGINE=showdown
export BATTLE_EXPECT_NATIVE_MODES=quick-vs-ai,quick-battle,battle-party,quick-draft,local-pvp,gauntlet
export BATTLE_TEST_STORY_BAG=1
curl --fail --silent --retry 10 --retry-connrefused "$BATTLE_TEST_URL" -o /dev/null

npm run playtest:player -- --seed=253 --road-choice=scout --chapters \
  --real-battles=8 --real-turns=12 --milestone-turns=3 --fight-style=matchup \
  --out-dir="$QA_RUN/scout-253"
node scripts/debug/story-playthrough.mjs --seed=77 --road-choice=help \
  --chapters=true --chapter-choice=act --viewport=820x1180 --out-dir="$QA_RUN/help-77"
npm run playtest:player -- --only=story --seed=77 \
  --road-choices=scout,help,pass,scout,help,pass,scout,help,pass --chapter-choice=act \
  --chapters --viewport=820x1180 --out-dir="$QA_RUN/mixed-77"
BATTLE_PLAYTEST_OUT="$QA_RUN/chapters-chromium" node scripts/debug/player-chapters-playtest.mjs
BATTLE_TEST_ENGINE=webkit BATTLE_PLAYTEST_OUT="$QA_RUN/chapters-webkit" \
  node scripts/debug/player-chapters-playtest.mjs
BATTLE_TEST_OFFLINE=1 BATTLE_COMPETITIVE_SHOTS="$QA_RUN/competitive" \
  npm run test:competitive:browser
BATTLE_TEST_ROOM_PIVOT=1 node tests/visual/online-native-room.mjs \
  | tee "$QA_RUN/native-room-mock.log"
~~~

Campaign drivers label real turns and controlled wins separately. Chapter coverage tests every answer and clue, archive and replay. Real matches for the Gym and raid, live hosting, and physical-device coverage require the dedicated evidence in this runbook.

### Mandatory browser smoke list

Run the relevant cases during a package, and all cases on the assembled candidate. Each line uses its script's actual screenshot or report variable.

~~~bash
BATTLE_MAIN_RES_SHOTS="$QA_RUN/battle-responsive" node tests/visual/battle-responsive.mjs
node tests/visual/keyboard-navigation.mjs | tee "$QA_RUN/keyboard.log"
BATTLE_ONBOARDING_OUT="$QA_RUN/story-onboarding" node tests/visual/story-onboarding.mjs
node tests/visual/story-starter-parity.mjs | tee "$QA_RUN/starter-parity.log"
BATTLE_CITY_OUT="$QA_RUN/city" node tests/visual/story-city-notifications.mjs
node tests/visual/story-city-errands-and-bag.mjs | tee "$QA_RUN/errands-bag.log"
BATTLE_MILESTONE_SHOTS="$QA_RUN/milestone" node tests/visual/story-milestone-actions.mjs
BATTLE_COLLECTION_OUT="$QA_RUN/collection" node tests/visual/story-collection-layout.mjs
BATTLE_PLAYTEST_OUT="$QA_RUN/pivot" node tests/visual/classic-native-pivot.mjs
node tests/visual/story-retry-save.mjs | tee "$QA_RUN/retry-save.log"
BATTLE_PLAYTEST_OUT="$QA_RUN/boss" node tests/visual/story-boss-phases.mjs
BATTLE_PLAYTEST_OUT="$QA_RUN/ceremony" node tests/visual/story-cinematic-hierarchy.mjs
BATTLE_PLAYTEST_OUT="$QA_RUN/audio" node tests/visual/story-audio.mjs
BATTLE_TEST_SCREENSHOTS="$QA_RUN/legendary" node tests/visual/story-legendary-capture.mjs
BATTLE_PLAYTEST_OUT="$QA_RUN/side-activities" node tests/visual/story-side-activities.mjs
node tests/visual/story-first-gym-coach.mjs | tee "$QA_RUN/first-gym-coach.log"
BATTLE_PLAYTEST_OUT="$QA_RUN/north-road-world" node tests/visual/story-north-road-world.mjs
BATTLE_FRONTIER_OUT="$QA_RUN/frontier-challenges" node tests/visual/story-frontier-challenges.mjs
BATTLE_PLAYTEST_OUT="$QA_RUN/camp" node scripts/debug/player-camp-playtest.mjs
for viewport in 320x568 568x260; do
  BATTLE_CASINO_VIEWPORT="$viewport" BATTLE_PLAYTEST_OUT="$QA_RUN/casino-$viewport" \
    node scripts/debug/player-casino-playtest.mjs
done
~~~

Allow for both optional pack profiles, storage and repeat runtime. A fresh profile defaults to Compact. The campaign driver selects and checks the downloaded profile when `--offline-profile` is present. Run both using independent browser contexts. Pass a retained artifact with `--baseline-dist`, or select the actually published Git tree with `--baseline`. In Git mode the installed upgrade driver uses `git show` to read the previous manifest and differing files.

~~~bash
for profile in compact full; do
  BATTLE_TEST_RESUME_OFFLINE_TURN=1 npm run playtest:player -- --only=story \
    --seed=253 --road-choice=scout --chapters --real-battles=1 \
    --offline-pack --offline-profile="$profile" --out-dir="$QA_RUN/$profile-offline"
done
node tests/visual/offline-pack-update.mjs \
  "${NORTH_ROAD_PREVIOUS_ARTIFACT:?Set the path of the retained artifact}" dist
node scripts/debug/installed-upgrade-playtest.mjs --dist=dist \
  --baseline-dist="${NORTH_ROAD_PREVIOUS_ARTIFACT:?Set the path of the retained artifact}" \
  --rollback --out="$QA_RUN/installed-upgrade"
~~~

Pages depends on both reusable Quality and Player playtest. Player playtest runs the packaged browser checks, including the mixed route and a fresh offline campaign, then uploads the tested `dist/`. Pages deploys that artifact. The workflow records the commit, release manifest identity and checksums of the game and simulator files. Run the browser gate locally with `BATTLE_CANDIDATE_MIXED=true BATTLE_CANDIDATE_STATEFUL=true OFFLINE_PACK=true bash scripts/debug/release-candidate-playtest.sh` after building the candidate. Run `node tests/visual/battle-long-session.mjs` against the candidate and measure repeated Town → tool → Camp → Battle → Town visits to check cross-screen resource cleanup as well as sustained battle input. Rehearse on staging and bind the physical and manual evidence to the same revision and digest before updating a deployment-triggering ref. [Quality](../../.github/workflows/quality.yml) · [Player workflow](../../.github/workflows/player-playtest.yml) · [Pages workflow](../../.github/workflows/static.yml)

## 3. Physical devices, accessibility, and human testing

Record device model, memory class, OS/browser build, orientation, CSS viewport, input, assistive settings, install mode and network. WebKit automation adds rendering coverage. iOS and iPadOS Safari tab and Home Screen behavior need physical evidence.

| Device | Required journey |
| --- | --- |
| **iPhone Safari and Home Screen** | New run → starter → Route 1 → first native fight, portrait and landscape. Background and reopen after a choice and during an optional download. Export in Safari, install, import in Home Screen, cold offline reopen, and test the opposite direction. Inspect safe areas and short landscape. VoiceOver sample for move list, phase announcement, choice and import. |
| **Lower-memory Android phone and installed Chrome PWA** | Cold load on profiled network, starter through real Gym 1, route/phase decision, rotate mid-menu and use system Back. Toggle TalkBack. Background kill, cancel and resume pack, inspect low space recovery, and compare audio in game and after resume. |
| **Physical tablet** | iPad Safari where available. Touch and external keyboard, portrait/landscape, increased text, turn history, tooltip and full choice/reply. Load a legal late save and reach Hall of Fame and Crucible. Check reduced viewport/split view where supported. |
| **Desktop browsers** | Chromium, Firefox and macOS Safari where supported. Keyboard-only launch through native battle/capture and full-PC placement. Browse Inspect, Tutor, PC, Collection, export/restore and finale choices. Sample NVDA with Firefox/Chromium and macOS VoiceOver when available. |

Reproducible layout fixtures are 320×568, 568×260, 390×844, 820×1180 and 1440×900. Sample 200% zoom or increased font, system and in-game reduced motion, independent mute settings, instant battle, touch-only, keyboard-only, and relevant screen readers. Critical touch controls target 44 CSS pixels. Each modal gets an accessible name, sensible focus order, visible focus, focus restoration, and accessible Back/Close when allowed. Enter and Space commit one answer. A screen reader hears one state notification and still reaches the active choices. Capture the smallest layouts.

Mandatory readable cues include attack category, known immunity, unavailable action, telegraph/active/expired boss phase, road payoff, catch/ball result, retry and retreat, public versus private witness choice, save/error and download/reconnect status. Verify they convey equivalent information with color, sound or movement removed. Test longer localized copy, wrapping, scroll position, overlay stacking and input after dismissing. [Xbox accessibility guidance](https://learn.microsoft.com/en-us/xbox/accessibility/guidelines) · [Apple Home Screen storage behavior](https://developer.apple.com/videos/play/wwdc2023/10120/)

### Blind player script

Run two qualitative rounds with six new/returning participants and at least four experienced participants each as proposed. Keep difficulty, initial state and build comparable, and invite new people after changes. Let players explore without teaching the intended answer.

1. “Get your first partner and travel to the next town. Do whatever seems useful along the way.” Record first correct action, why they chose the road branch, and whether they recognize the consequence later.
2. “Prepare to try this Gym again.” After first defeat, record whether they inspect or find a relevant, available, affordable action, and actually attempt it. Record wrong turns and their explanation afterward.
3. “What do you expect next? What could your team do?” Ask when the Marowak warning is actionable. Sample both ordinary teams and compare what they try, when they understand, and attempts after loss.
4. “Find where you might encounter a species you haven’t caught. What would you return for?” Observe use of the Pokédex and whether its next action is reachable.
5. At the next town or gallery, ask what changed, why, and what the partner’s presence means. Record recall before explaining any clue.

Initial targets are five of six novices finding and trying a valid preparation action unprompted and four of six explaining both one relevant raid response and a road consequence. A repeated misunderstanding records a fix and a new observation even if the target is met.

## 4. Save, offline, performance and rollback fixtures

For each transaction, interrupt before confirm, after confirm before feedback, during animation or reply, after persistence, and after replay/reimport. Compare the seed, party and foe stable IDs, badges, row, cash, bag, held gear, PC, opportunity/reward receipts and relevant archive. Eligible seeded Story fights resume from a compatible native snapshot, including forced replacement. An unavailable or incompatible snapshot uses the locked encounter recovery boundary. Check that a resumable terminal turn settles once and already committed results show the aftermath without another fight. [Exact-turn fixture](../../tests/visual/story-exact-resume.mjs)

| Case | Expected outcome |
| --- | --- |
| Road, archive and finale | Closing before commit leaves ordinary state. After commit retains the outcome, visual callback and one grant. Read-only replay has no state effects. Resume the correct finale beat and original partner. A same-run restore keeps earned recorded choices under existing rules. Different runs remain distinct. |
| Battle, defeat, retry, retreat | Frozen foe, profile and seed reconstruct the intended fight. Explicit retreat uses its existing fee and route. Tab close never charges a retreat. An update during an active fight waits for a safe boundary on the old page. |
| Catch, Safari, wagers and training | Catch and full-party placement claim once. A Safari fee remains paired with its paid visit. Coin Flip, Slots and Roulette keep committed outcome, gold, RNG, prize and Replay state where applicable. Vouchers and purchases either commit or recover pre-action state. |
| Backup, two tabs, quota | Safari-tab/Home Screen and remote-device backups restore. Reject unsupported versions, malformed data and partial writes without replacing good data. A partial multi-key restore journals enough to recover. Cross-tab conflict preserves the latest save and exposes the stale run’s recovery option. |
| Download pause, kill and eviction | Fresh pack cold-launches. Pause or drop network mid-batch, background-kill, reopen, then resume. Compare completed file reuse and unchanged hashes. Simulate denied quota/eviction only on disposable test profiles. Show actionable guidance and accurate readiness, preserve the run. |
| Core update and media | Corrupt a copied candidate core asset in a staging fixture. Confirm the verified version remains active. Restore the bytes and complete the update. Candidate releases serve a matched shell, worker and manifest. During partial optional transfer, assets fall back and readiness stays accurate. Check supported offline BGM seeking, an original cue, rare art, and warm Continue with zero transfers. |

The current worker verifies a complete core before activation, updates optional media in place across batches, and removes old versioned shells on activation. Its optional readiness reflects the applied asset snapshot. Rollback needs an externally retained matching artifact. The prior installed evidence was 36 changed optional files at 9.4 MiB plus about 13.1 MiB changed shell, followed by zero-byte Continue. Compare real candidate values. [Worker](../../sw.js) · [Offline integration](../../tests/suites/release-integrity.test.js)

Profile iPhone and midrange Android with at least eight cold samples and matching warm samples on a documented 4 Mbps/150 ms RTT link. Use identical conditions baseline versus candidate. Record p75 actionable menu, through first battle, encoded transfer bytes, installed storage, memory, largest optional animation and sound impact, and any long control stall. Mark the point where a player can proceed, plus total page load. The wider plan’s 1 MiB/3-second actionable menu, 5 MiB first battle, 15 MiB starter pack and 80 MiB low-data campaign are design targets. The current browser ships a single large optional library. Keep new media out of startup and require evidence for a measured regression decision. The jsdom `debug:perf` benchmark measures the harness. [Delivery budgets](../ARENA_OVERHAUL_PLAN.md#7-offline-play-installs-and-updates)

## 5. Real hosted-room staging script

Use a project-controlled HTTPS preview, staging Supabase, consenting testers and synthetic data. Configure the staging project’s public URL and publishable or legacy anon key through its copy of `online-config.js`. Rebuild the preview since that file is hash-tracked. Keep staging migration and Realtime settings aligned with intended release defaults. Public room gameplay is host-authoritative. The local browser scripts use a mock transport. [Config template](../../online-config.example.js) · [Room driver](../../tests/visual/online-native-room.mjs) · [Supabase reconnect guidance](https://supabase.com/kb/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794)

1. Record revisions and two networks. Save a small Story canary in one profile. Start from fresh browsers. Host creates a tagged room with legal rules and party size, guest joins with code, then both draft and start. Verify identical rules/ready state. Exercise wrong code and rejected third party in disposable rooms.
2. Resolve a normal turn. Compare active slots, HP, visible log, turn, permitted action and phase. In separate attempts use a legal pivot/replacement for the host and guest. Only the assigned side can act on a unilateral request.
3. Drop the guest before submitting a turn and reconnect in that tab. Confirm latest revision, one accepted choice, and the visible available actions. Repeat with the prior submission sent and its response delayed.
4. Drop the host while publication is pending and resume the same session. Verify the authoritative result appears once. The guest catches up to head, old inputs cannot apply to the new board, and both proceed from the same phase. Capture timeout and recovery UI.
5. Disconnect before and after a final result. Verify one score increment, one winner and result notice, resume to the terminal state, rematch, then leave and create another room to check cleanup. Confirm no Story canary change.
6. Test host refresh, guest refresh, OS kill, stale room and mixed candidate/predecessor browsers. Current room token and pending publication live in memory. Distinguish same-tab transport reconnect from full-session loss. If the room cannot be resumed, give a clear, finite exit or rejoin path. Reject incompatible versions before draft unless tested interoperability is explicitly supported.

Minimum evidence is two real completed matches with roles swapped, one forced replacement per side, the recovery and refresh cases, rematch and listener cleanup. Use sanitized before/after revisions and both device outcomes. Ranked integrity claims require independently trusted results.

## 6. Rollout and recovery

1. Freeze the candidate. Confirm release metadata, worker and downloadable manifest agree. Retain the last working package, old and current save fixtures, and the deployment instructions for the same game origin.
2. Rehearse A → B → recovery on a stable staging origin with both complete and interrupted media. Verify old and new saves against any intended rollback artifact. Serve a matching shell, worker, manifest and assets, keeping the original save origin.
3. Prefer a forward repair with a fresh release identity if the previous runtime cannot read newer data. A v29 save, for example, is newer than the v28-only runtime accepts. Preserve the newest player data, make a verified compatibility/recovery path, and avoid automatic save replacement or downgrade.
4. Block on reproducible save/team corruption, duplicated rewards/losses, unreachable required actions, stuck matches, unauthorized exposure, published simulation drift, blocking accessibility issue, or a core install that misstates readiness. Pause rollout for these classes and choose the rehearsed compatibility-safe recovery. Log minor issues with affected platform and tested workaround.
5. Publish the review-approved exact candidate after all evidence is attached. Confirm a clean install, existing Continue, one room entry, and release/byte behavior on the deployment URL. The source-only and mock reports remain useful diagnostics alongside, but cannot stand in for, the corresponding real-device and hosted evidence.

### Evidence template

Record one copy per case, carrying the final gate identification and retest. A missing physical device, staging environment or required fixture is **Blocked** until its case is completed.

~~~yaml
candidate:
  git: ""
  artifact_version: ""
  artifact_digest: ""
  manifest_file_count: 0
  engine_package_and_bundle: ""
  story_rules_revision: ""
  story_save_version: 28
  backup_format_and_version: battle-backup/v1
  archive_version: 1
  previous_release: ""
case:
  id: ""
  fixture_or_seed: ""
  precondition_and_route: ""
  rules_generations_and_forms: ""
  battle_outcome_method: "" # full native / controlled progression / no battle
  device_os_browser_and_network: ""
  viewport_input_and_accessibility: ""
  browser_or_installed_context: ""
  exact_steps: []
  expected: ""
  actual: ""
  before_after_save_and_room_revisions: []
  p75_or_bytes_if_measured: ""
  evidence_paths: []
  status: "" # PASS / FAIL / BLOCKED / NOT RUN
  issue_and_retest: ""
  reviewer_and_utc_date: ""
~~~

Final sign-off attaches candidate identity, retained package identity, automated logs, physical-device and hosted evidence, blind-play outcomes, known issues, performance comparison, release notes and rollback rehearsal. Bind every result to the commit and manifest digest actually exercised.
