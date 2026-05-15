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

If still running when you resume:
- `a9501e4d1bbebf11c` (Explore) — battle-engine map of battle.html
- `a68e6a53a949d0a79` (Explore) — story-mode flow / grades / saves

Send each a SendMessage with `"status?"` and incorporate their output into `agent-state/CODEBASE_MAP.md`. If they completed already, their final messages are in this session's transcript context (when summarized).

## Next 5 actions

1. Assemble `agent-state/CODEBASE_MAP.md` from the two Explore agents' output (skeleton from PROGRESS.md notes).
2. Confirm STORY_MODE_FLOW.md emptiness (it IS empty as of this session) and decide: regenerate from STORY_EVENTS_RAW (Phase 1 STORY_MAP), OR mark as deferred and continue.
3. Write `agent-state/SETTINGS_MATRIX.md` — Grep battle.html for `Sleep Clause`, `Species Clause`, `Item Clause`, `catchMode`, `hardcore`, `Eviolite`, `Hidden Ability`, `gen` toggle, etc.
4. Run a focused EVIOLITE LATE-EVO audit (Phase 5) — small, self-contained, high-value confidence check.
5. Run a focused GEN TOGGLE audit (Phase 4) — same shape, second-highest value.

## Constraints to remember

- Branch: `claude/polish-story-mode-battles-YELGn` — push there only.
- No GitHub PR unless user asks.
- Single-file inline-JS architecture means most fixes will be `Edit` calls on `battle.html`. Plan diffs carefully — line numbers shift after each edit; use distinctive `old_string` patterns.
- Numbers, not vibes (battle). Don't propose damage / formula changes without a reference comparison and a written acceptance test (even if the framework has to be added first).

## Open questions for user (do NOT block on these; flag at next session start)

None blocking yet. Auto-discovery is non-judgmental work.
