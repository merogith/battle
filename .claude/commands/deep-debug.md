---
description: Run the full multi-agent debug battery (9 specialists in 3 waves) and synthesize a master ISSUE_LEDGER. ~30–60 min wall-clock, maximum token usage. Use this when you want comprehensive coverage; use /story-audit, /perf-check, or /data-check for narrower passes.
---

# /deep-debug

Run the full multi-agent debug battery on the codebase. Story Mode is the priority focus area for this update.

## What this does

Fans out 9 specialist sub-agents in 3 waves, then synthesizes their findings into `agent-state/ISSUE_LEDGER.md`. **No game-code edits** are made; agents only emit findings.

## Workflow

Execute these steps in order. Do NOT skip the wave staging — running all 9 agents at once will exhaust context.

### Wave 1 — Read-only auditors (parallel, 2–5 min)

Spawn these three sub-agents **in a single message** with three Agent tool calls:

- `subagent_type: data-integrity-auditor` — cross-validates data/*.json
- `subagent_type: consistency-auditor` — code-style and text-content
- `subagent_type: spec-drift-auditor` — STORY_MODE_FLOW.md / docs vs actual code

Wait for all three to complete.

### Wave 2 — Behavior agents (parallel, 8–15 min)

After Wave 1 finishes, spawn these three sub-agents in a single message:

- `subagent_type: battle-engine-debugger` — damage formula, RNG, status, AI
- `subagent_type: performance-profiler` — turn loop, parseMoveEffects, memory
- `subagent_type: test-coverage-filler` — research mode (enumerate the 351 TODOs into clusters)

Wait for all three.

### Wave 3 — Focus agents (parallel, 10–20 min)

After Wave 2 finishes, spawn these three sub-agents in a single message:

- `subagent_type: story-mode-investigator` — the priority agent; biggest token budget
- `subagent_type: pvp-concurrency-hunter` — online-pvp.js races, XSS, RLS
- `subagent_type: accessibility-ux-auditor` — ARIA, keyboard, contrast

Wait for all three.

### Wave 4 — Synthesis (sequential, <1 min)

```bash
ls -la agent-state/findings/
node scripts/debug/issue-ledger.mjs
```

Then read `agent-state/ISSUE_LEDGER.md` and summarize for the user:

- Severity distribution (P0/P1/P2/P3 counts)
- Top 5 P0/P1 findings by id and title
- Any agents that failed (degraded mode)
- Next-step suggestion: which issue to tackle first

## Degraded mode

If any single agent fails (timeout, error, no output file), proceed with the rest. Note the failure in the final summary. The ledger generator handles missing inputs gracefully.

## Reminders

- All agents are read-only — no game-code edits this pass.
- Story Mode is the priority focus area.
- Commit to the active feature branch (never hardcode a branch name here — they're short-lived).
- Don't open a PR unless the user asks.
