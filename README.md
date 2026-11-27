# Battle — Fan-Made Pokémon Battle Simulator

A playable, noncommercial fan project with turn-based battles and a single-player story mode. [Play in your browser](https://merogith.github.io/battle/)

## North Road campaign

Travel from Pallet to the Pokémon League. A road decision can change the noticeboard, a local resident’s response, or a record you find in a later town. The Field Archive lets you revisit earlier accounts and inspect earned keepsakes. After the League, the Battle Frontier offers three optional offline seed challenges.

Story uses base level 50 with the existing late Experience Share power-up. Your team grows through recruitment, evolution, moves, items, abilities, training, and bonds. Signature bosses show what they are preparing before the next turn. Historical formats are available separately in the Competitive Arena.

The **Battles** menu offers **Quick Battle** for a single CPU match, **Gauntlet** for a draft and winning streak, **Competitive Arena** for generation-specific rules and Showdown teams, and **Play with a friend** for same-device or online play.

Use **Settings → App & data** to export a backup or manage the installation. The title screen offers Compact and Full offline downloads. Restore a backup when moving to another device. [Player playtest](docs/PLAYER_PLAYTEST.md) · [Build and release checks](docs/north-road/RELEASE.md)

## Game reference

The [game reference](docs/game-reference/README.md) indexes player screens, NPCs, tools, story branches, mechanics, and design sources. Run `npm run audit:game -- --scope city` to find the full scope of town and facility work, or append `--json` for source IDs and test cases.

## Battle engine and testing

Story and the standard battle modes use a Showdown simulator adapter for damage, action order, abilities and status. Story adds its own level, equipment, encounter and transformation rules around that simulator. Competitive Arena uses the rules of the selected format. The test suites cover deterministic retries, native battle behavior, and legacy-engine comparisons against Showdown.

- [Move verification and test commands](tests/README.md)
- [Battle engine investigation and testing approach](docs/BATTLE_ENGINE_INVESTIGATION.md)
- [Story mode design and implementation notes](STORY_MODE_FLOW.md)

This project has no affiliation with Nintendo, The Pokémon Company, Creatures Inc., or GAME FREAK Inc. See [asset credits and licensing](ATTRIBUTION.md) for third-party art, audio, and data.

## Localhost URL for testing

## URL

**http://localhost:5173/**

**KO / faint / hazard debug sandbox:** `http://localhost:5173/battle.html?kobugtest=1` (or `battle.html#kobugtest` — or Settings → *Developer / Story tools* → **Debug: KO / hazard test**). Puts **Stealth Rock** on your side, **Blissey** + two **Shedinja**; let the foe KO Blissey, then test forced switch chains.

The dev server prints this on startup (`scripts/dev-server.cjs`; `PORT` defaults to `5173`).

## How to run

From the project folder:

```bash
npm start
```

That runs `node scripts/dev-server.cjs` (see `package.json`).

## Optional: different port

**cmd.exe:**

```bat
set PORT=8080 && npm start
```

**PowerShell:**

```powershell
$env:PORT = 8080; npm start
```

Then open `http://localhost:8080/`.

## Story Mode saves (local browser only)

Story runs are stored in **one** browser `localStorage` key: `pbs_story_save`. There is **no cloud sync**; clearing site data or using another browser/device does not carry the run over.

- **Bag and money** are part of that save. A native Story timeline battle commits the resolved turn and its inventory together before presentation. **Continue** restores the saved move or replacement prompt. Older or incompatible snapshots restart the encounter from its original checkpoint.
- **Party HP, status, PP, and consumed held items** are fully restored between battles on every difficulty. Mart consumables (potions, X-items, orbs) matter only within a single battle.
- **General settings** (for example toggles under the main Settings screen) live in separate storage from the story run and are not the same object as `pbs_story_save`.
- See `STORY_MODE_FLOW.md` for the spec of the catch / PC / Underground / Safari / boss-arc systems (shipped).

## Install or try a packaged build

Open the game on its HTTPS site and use your browser’s install or Add to Home Screen action. Choose **Offline play** for the download options. The **Compact** pack is about 70 MiB with still sprites and shorter audio. The **Full** pack is about 648 MiB with animated sprites and extended audio. Both play the complete Story offline. The game shows the size before downloading and fetches changed files on subsequent updates.

To try the verified local package, run `npm run build:release`, start `npm start`, and open `http://localhost:5173/dist/`. The localhost server provides the origin needed for the simulator modules, installation and offline downloads.

## Debug & issue resolution system

The repo ships a multi-agent debug system under `.claude/` and `scripts/debug/`. Findings collect into a single `agent-state/ISSUE_LEDGER.md` so you can review and fix at your own pace.

Slash commands (in Claude Code):

- `/deep-debug` — full battery (9 specialists in 3 waves, ~30–60 min). Maximum coverage.
- `/story-audit` — story-mode-focused subset (~10–15 min).
- `/perf-check` — performance profile only (~3–5 min).
- `/data-check` — data integrity check only (~1 min). Useful smoke test.
- `/triage-issues` — re-synthesize the ledger after manually editing findings.
- `/fix-todo-test <cluster-id>` — convert one cluster of `it.todo()` stubs to real assertions.
- `/anchor <symbol>` — drift-tolerant symbol → file:line lookup.
- `/ledger-show` — print summary of the current ledger.

Scripts (any shell):

- `npm run debug:anchors` — regenerate the symbol index and `agent-state/ANCHOR_INDEX.md`.
- `npm run debug:data` — cross-validate `data/*.json`.
- `npm run debug:spec-drift` — check `STORY_MODE_FLOW.md` and other specs vs current code.
- `npm run debug:perf` — turn-loop / parseMoveEffects / memory benchmarks.
- `npm run debug:replay` — deterministic story-run replay; diffs two runs from the same seed.
- `npm run debug:ledger` — regenerate `agent-state/ISSUE_LEDGER.md` from `agent-state/findings/`.

Live debug logger (browser):

- `npm run start:debug` — dev server that injects `scripts/debug/debug-logger.js` when you load `battle.html?debug=1`. Once loaded, `window.__debugLogger.export()` downloads a postmortem JSON (last 2000 console events + engine state snapshot).

The full architecture and schema live in `agent-state/LEDGER_SCHEMA.md` and the agent definitions under `.claude/agents/`. All agents are read-only — they emit findings but do not modify game code.
