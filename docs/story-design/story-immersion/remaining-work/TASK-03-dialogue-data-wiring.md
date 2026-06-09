# TASK-03 — Dialogue Data Wiring

> Mostly mechanical, behavior-preserving. Stream 2 shipped the **copy + the contracts**;
> this wires the data into the render paths and finishes the data-driven externalization
> `CLAUDE.md` prefers.
>
> **Bundles:** bark wiring (consume `barks.json`) · H2-3 substitution-bridge render (copy
> ready) · 7c (externalize remaining in-code pools) · 7b (speaker-block schema). All four
> are the `data/dialogue/` lane.

---

## Goal

Make the authored dialogue data actually render, and move the last in-code pools into
`data/dialogue/` so copy review is a JSON diff.

## Sub-tasks (each independently shippable)

### 3a — Bark wiring  *(consume `data/dialogue/barks.json`)*
**Status:** data + schema guard shipped (Stream 2 §7a); the **wiring is owned by Stream 4
and not done.**
Append a seeded (`storyRngNext`) pick from `barks.json` **after** the canonical battle-log
line on the 4 non-state events: `playerLastFaint`, `foeLastFaint`, `fledRoad`, `critKO`.
**Contract (locked by the schema guard):** ADDITIVE-ONLY — the bark is appended, never
replaces a state-information line (effectiveness, status, faint-as-state, "But it failed!").
Pick must use `storyRngNext`, never `Math.random`. See `dialogue-and-writing.md §8`.

### 3b — H2-3: substitution-bridge render  *(copy ready)*
When `BEAT_CANON_TRAINER` swaps a scheduled road battle for a canon villain, render one
bridge line so the named villain doesn't appear as an unexplained reskin. **Copy is ready**
in `dialogue-and-writing-CONCLUSION.md §B` (20 lines: 10 bosses + 10 admins, keyed by
sceneKey). Proposed shape: `data/dialogue/substitution-bridges.json`, keyed by sceneKey
(mirrors `BEAT_CANON_TRAINER`). Render home is the encounter-intro hook (shares H3-1's
raid/encounter frame). World-narrator voice, one line, no boss-mechanic telegraph (that
stays in `BOSS_CONFIGS`/the banner).

### 3c — 7c: externalize remaining in-code pools
Move the still-in-code dialogue pools into `data/dialogue/` via the existing extractor:
`cold-opens` · `tutorial-scenes` · `intro-scenes` · `mystery-figure` · `rival-pools`.
Add them to the POOLS list in `scripts/build/extract-dialogue-pools.mjs`.
Behavior-preserving (1:1) — needs direction approval but not diff-level sign-off.
**Sloppy-mode hazard:** load via `Object.assign(POOL, fetched)` / `POOL.push(...fetched)`,
never `POOL = fetched` (see `CLAUDE.md`).

### 3d — 7b: speaker-block schema  *(low priority / future-proofing)*
Add a `speaker` block (`speaker.id` / `speaker.voice`) to the scene/overlay schema so the
§6 casting (Veteran / world-narrator Hall) becomes data, not code. §6 already shipped as
code, so this is future-proofing — lowest priority in the bundle.

## Anchors (verified 2026-06-08)

| Symbol | Line | Role |
|---|---|---|
| `data/dialogue/barks.json` | — | Bark copy + contract (exists) |
| `BEAT_CANON_TRAINER` | (getter `38795`; const via anchor) | Canon-trainer swap → substitution-bridge key |
| `scripts/build/extract-dialogue-pools.mjs` | — | Pool extractor — add to its POOLS list |
| `_renderNarrativeOverlay` / `_playStoryBeatScene` | (anchor) | Scene render (speaker block consumer) |
| battle-log append site | (anchor near `showBattlePopup`) | Where the seeded bark appends |

## Dependencies
- 3b's render home overlaps TASK-02's encounter-intro surface — coordinate, but 3b can ship
  standalone with its own minimal hook.
- 3c is independent and safe; good warm-up.

## Sign-off needed
- 3a/3b: copy pre-approved; confirm the bark append placement reads right (it's player-visible).
- 3c: behavior-preserving direction OK per `CLAUDE.md`.

## Test plan (jsdom)
- **Bark schema guard** (already exists) stays green; add: a seeded run appends exactly one
  bark after the canonical line on each of the 4 events, and never on a state line.
- Same seed ⇒ same bark pick (determinism).
- Substitution bridge: each of the 20 `BEAT_CANON_TRAINER` swap keys resolves a bridge line.
- 3c: extracted pools load and render byte-identical to the in-code versions (snapshot).
