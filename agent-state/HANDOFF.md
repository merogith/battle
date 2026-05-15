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

## Phase 1 status (this session)

- Grade thresholds reconciled (Finding-011, code at `battle.html:8830–8881`).
- SETTINGS_MATRIX.md written.
- EVL Late-Evo verified on static check (Finding-009 RESOLVED-PENDING-RUNTIME-TEST).
- New findings: 005 (Sleep Clause missing — VGC blocker), 006 (Species Clause forme-dedup risk), 007 (Item Clause non-togglable), 008 (OHKO/Evasion/Endless/Moody clauses missing), 010 (Gen toggle consumer sweep TODO), 011 (Grade table documented).

## Next 5 actions

1. **Decide on VGC compliance scope.** Findings 005, 008 are blockers *only if* the game targets strict VGC. If the game targets a casual / Smogon-flavored format, they downgrade to "documented deviation." Read `docs/STORY_FEATURES_INTEGRATION.md` more carefully and Grep for `VGC` to identify intent. Default assumption: dual-mode — VGC mode strict, free-play permissive.
2. **COVERAGE.md** — count entries per data file. Cross-reference with Story Mode opponent pools.
3. **Phase 4 GEN toggle sweep** — Read every `enabledGens`/`minGen`/`maxGen` consumer in battle.html. Confirm none alters type chart, damage formula, status durations, or learnsets.
4. **Propose test framework (Finding-002)** — write a minimal `test/` skeleton using vitest + a happy-DOM harness that can load `battle.html`'s `<script>` content. Start with clause-enforcement tests so Findings 005–008 have an executable record.
5. **BACKLOG.md** — group findings into upgrade packages with priority. Initial cut: P0 = 002 (test framework, blocks all verification), 005 (Sleep Clause if VGC-target). P1 = 001, 006, 008, 010. P2 = 003, 004, 007, 011, 009.

## Constraints to remember

- Branch: `claude/polish-story-mode-battles-YELGn` — push there only.
- No GitHub PR unless user asks.
- Single-file inline-JS architecture means most fixes will be `Edit` calls on `battle.html`. Plan diffs carefully — line numbers shift after each edit; use distinctive `old_string` patterns.
- Numbers, not vibes (battle). Don't propose damage / formula changes without a reference comparison and a written acceptance test (even if the framework has to be added first).

## Open questions for user (do NOT block on these; flag at next session start)

None blocking yet. Auto-discovery is non-judgmental work.
