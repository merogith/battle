# Player experience playtest

This playtest runs the rendered game in Chromium and follows its controls. It checks whether a player can find, use, and leave each experience. Difficulty and win rates belong to the existing combat and balance suites. The campaign driver plays the opening fight and can resolve longer encounters as controlled wins after the real battle screen opens.

## Run it locally

```sh
npm ci
npx playwright install chromium
npm run playtest:player
```

The runner starts a local game server and opens fresh browser profiles. Set `BATTLE_TEST_URL` to point to a running loopback game server. Set `BATTLE_TEST_CHROMIUM` to use an existing Chromium binary. The runner writes a gallery, logs, structured reports, and screenshots under `agent-state/playthrough/`. Pass `--out-dir=path` to select an output folder.

```sh
npm run playtest:player -- --only=story,progress --seed=1 --out-dir=agent-state/playthrough/seed-1
npm run playtest:player -- --only=story --seed=77 --road-choice=help --out-dir=agent-state/playthrough/seed-77
npm run playtest:player -- --report-only --out-dir=agent-state/playthrough/seed-1
```

Add `--chapters` to visit the Open Circle scenes in all nine cities and the Crucible. The driver follows clue-bearing choices and records each discovery. [Chapter plan](ADVENTURE_CHAPTER_PLAN.md)

Give `--road-choices` a comma-separated choice for each of the nine roads to verify a mixed route. The driver compares all nine decisions with the saved run. Use `--chapter-choice=act` or `listen` to select alternate answers, and `--viewport=820x1180` for a tablet campaign.

For a longer combat sample, increase `--real-battles` and `--real-turns`, or add `--milestone-turns` to play turns at Gyms, rivals, bosses, and the League. `--fight-style=matchup` chooses from the power, accuracy, and type cues shown on the move tiles. The trace marks actual outcomes and controlled victories.

```sh
npm run playtest:player -- --only=story --chapters --seed=253 --real-battles=8 --real-turns=12 --milestone-turns=3 --fight-style=matchup
```

The focused chapter pass uses arrived-town checkpoints to check the other branches, interrupted scenes, backup restore, archive replay, and the alternate-aftermath reward through the public UI.

```sh
BATTLE_TEST_URL=http://127.0.0.1:5173/dist/battle.html node scripts/debug/player-chapters-playtest.mjs
```

Set `BATTLE_TEST_ENGINE=webkit` with Playwright WebKit installed to check the same chapter flows in WebKit.

To test the release offline, generate the PWA and serve `dist/` through a local HTTP server. Point the runner at its `battle.html` entry. The Story pass waits for the service worker, uses the title screen to download the full release, disconnects Chromium, then reloads and plays from Pallet to the Crucible. Allow approximately 672 MiB for the full current release and additional space for browser data and screenshots.

```sh
npm run build:pwa
npm run build:release
# With npm start running in a separate terminal on port 5173
BATTLE_TEST_URL=http://127.0.0.1:5173/dist/battle.html npm run playtest:player -- \
  --only=story --offline-pack --out-dir=agent-state/playthrough/release-offline
```

Run the independent Competitive Arena browser pass against the same served build to exercise historical format selection, accepted turns, and a completed replay download. Set `BATTLE_TEST_OFFLINE=1` to include worker caching and restart offline.

```sh
BATTLE_TEST_URL=http://127.0.0.1:5173/dist/battle.html BATTLE_TEST_OFFLINE=1 npm run test:competitive:browser
```

The [Player playtest workflow](../.github/workflows/player-playtest.yml) runs both passes against the packaged build on game-related pull requests. It preserves screenshots, logs, and coverage as an artifact. A manual run can choose a seed, road choice, and full offline download.

The installed-upgrade pass uses the Git tree of a published release and the current `dist/` on one test origin. It creates a real save in the old version, installs the new version, checks the bytes transferred, and opens Continue with the server disconnected. Use `--baseline` to choose another compatible Git commit. [Upgrade test](../scripts/debug/installed-upgrade-playtest.mjs)

```sh
node scripts/debug/installed-upgrade-playtest.mjs --dist=dist
```

## What the passes cover

| Pass | Player path |
| --- | --- |
| `story` | Fresh run through character creation, city objectives, route encounters, story choices, rival, badges, League and the post-Champion path. A seed fixes the sampled branch. The trace identifies automated fight outcomes. |
| `facilities` | Shops and training in a late-city test save. Real purchases and upgrades should change both the currency balance and the appropriate bag or build entry. Cancellation and reload checks cover persistence. |
| `postgame` | Optional and post-Champion routes are entered from prepared local checkpoints when necessary. Activities and results use the presented controls. The report identifies fixture setup and automated fights. |
| `casino` | The City 5 Game Corner in landscape. Play Coin Flip, Slots and Roulette with in-game currency, repeat a Roulette stake, and inspect lifetime stats. |
| `modes` | Quick AI, draft, local PvP, Gauntlet, settings, Help, Collection and the offline download size panel. Online screens can be inspected locally without hosting or joining a public session. |
| `progress` | Phone onboarding, all eight practice questions, Notebook pages and favorite protection, accessibility, Save & Quit, a save slot, file export and restore into a clean landscape profile. |

The gallery marks player screens and dialogs as observed or unobserved, based on recorded evidence. Suites list the actions they performed, and screenshots show the state reached. Several systems share one backing screen, so the inventory of static IDs and the action trace should be read together. Change the Story seed and use `--road-choice=scout`, `help`, or `pass` to explore different scenes, encounters, and route consequences. Other outcomes and endings need additional runs.

A failing check leaves the report and screenshots available and exits with a nonzero status. Other passes still run. Use `--only` to repeat an individual pass and `--report-only` to rebuild the gallery from existing evidence.

Save imports, game spending, and record changes happen inside isolated local browser profiles. Real online matches and browser-specific installation prompts require dedicated passes.
