# HANDOFF

## RESUME

- **Current phase**: 0 (auto-discovery) → transitioning to 1 (mapping)
- **Last agent**: Lead agent (this session). Dispatched 2 Explore sub-agents (IDs in PROGRESS.md) — they may still be running when next session starts; if so, send them a SendMessage poke, otherwise just re-Glob and re-Grep yourself.
- **Files modified this session**:
  - `agent-state/PROGRESS.md` (created)
  - `agent-state/FINDINGS.md` (created; FINDING-001, FINDING-002 logged)
  - `agent-state/HANDOFF.md` (this file)
- **No source code modified.**
- **npm test status**: N/A — no test framework configured (FINDING-002)
- **Git**: branch `claude/polish-story-mode-battles-YELGn`, clean working tree, no commits this session

## Codebase shape (Phase 0 preliminary)

- Single-page HTML game: `battle.html` is **28,775 lines** (~2 MB). Battle engine, story mode, UI, dialogue, build generator, settings — ALL inline in `<script>` blocks within that file. **NEVER full-read this file.** Use Grep + targeted Read with line offsets.
- Data is in `data/`:
  - `abilities.json` (3.7k lines), `items.json` (6.2k), `moves.json` (22k), `species.json` (32k), `natures.json` (28 lines)
  - **Format**: Showdown-style overlays. Top key = generation number (e.g. `"9": { ... }`). Entries use `"inherit": true` to inherit from a baseline, otherwise override per-gen.
  - **Implication for GEN toggle audit**: the data files themselves are gen-shaped. Engine must read modern data regardless of toggle (per spec), so verify the resolution layer always reads from the latest-gen entry unless the toggle changes that.
- `data/builds/gen{4..9}.json`: pre-generated Smogon-style sets keyed by **species → tier (vgc2025, ou, uu, nfe, lc, zu, godlygift, monotype, etc.) → role**. ~13k lines total. Build generator must be picking from these per current gen + tier.
- Existing docs: `STORY_MODE_FLOW.md` (EMPTY — FINDING-001), `docs/STORY_FEATURES_INTEGRATION.md` (rich), `docs/design-audit/DESIGN_CONSISTENCY_CHECKLIST.md` (a separate prior agent's visual-design audit — do NOT confuse with this polish audit; that one only touches CSS).
- No test framework. `npm start` = dev server on :5173. `?kobugtest=1` query param activates a KO/hazard sandbox.

## Outstanding sub-agents

Both completed.
- `a68e6a53a949d0a79` — fed `agent-state/STORY_MAP.md`; produced FINDING-003, FINDING-004.
- `a9501e4d1bbebf11c` — fed `agent-state/CODEBASE_MAP.md`.

## Reconciliation needed (recorded for next session)

- Grade BST thresholds disagree between the two agents (G1 ≥570 vs ≥530). Resolve by reading `battle.html:8830` directly before any GRADE work.
- `STORY_EVENTS_RAW` location: story-agent said 22032–22100; engine-agent said 22354+. Likely 22032 = the array literal, 22354 = a consumer/secondary. Verify.

Send each a SendMessage with `"status?"` and incorporate their output into `agent-state/CODEBASE_MAP.md`. If they completed already, their final messages are in this session's transcript context (when summarized).

## Next 5 actions

1. Reconcile grade BST thresholds — Read `battle.html:8800–8920` directly. Update STORY_MAP / CODEBASE_MAP.
2. Write `agent-state/SETTINGS_MATRIX.md` — Grep battle.html for `Sleep Clause`, `Species Clause`, `Item Clause`, `catchMode`, `hardcore`, `Eviolite`, `Hidden Ability`, `enabledGens`. Locate each toggle's enforcement point. Mark every row UNVERIFIED initially.
3. Phase 5 EVIOLITE LATE-EVO audit. Read `battle.html:8650–8700` and `:16150–16180`. Build the test matrix from the lead-agent brief (Chansey/Scyther/Dusclops/Gligar/Porygon2/etc). Since no test runner exists, write the matrix as a JS snippet that can be dropped into the browser console + capture results manually as a stopgap; flag the proper-test-framework gap (FINDING-002) as a prerequisite.
4. Phase 4 GEN TOGGLE regression — Grep all `enabledGens`/`minGen`/`maxGen` consumers; confirm none touch type chart / damage / status durations / move learnsets. Cross-check the data-resolution layer reads modern entries regardless of toggle.
5. Phase 1 COVERAGE.md — count entries in moves.json, abilities.json, items.json, species.json (per gen and total), then Grep `battle.html` for the names to see which are reachable in Story Mode flow.

## Constraints to remember

- Branch: `claude/polish-story-mode-battles-YELGn` — push there only.
- No GitHub PR unless user asks.
- Single-file inline-JS architecture means most fixes will be `Edit` calls on `battle.html`. Plan diffs carefully — line numbers shift after each edit; use distinctive `old_string` patterns.
- Numbers, not vibes (battle). Don't propose damage / formula changes without a reference comparison and a written acceptance test (even if the framework has to be added first).

## Open questions for user (do NOT block on these; flag at next session start)

None blocking yet. Auto-discovery is non-judgmental work.
