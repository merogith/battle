---
description: Run a narrow story-mode-focused audit — story-mode-investigator + spec-drift-auditor + consistency-auditor (text-content sub-mode). ~10–15 min. Use this for a story-mode-only polish pass.
---

# /story-audit

Story Mode-focused subset of `/deep-debug`. Faster than the full battery.

## Workflow

Spawn these three sub-agents **in a single message** with three Agent tool calls:

- `subagent_type: story-mode-investigator` — event timeline, save migrations, catch, PC, Safari, boss arc, mechanics unlock gates, party-cap curve, professor flow, rival, Mystery Figure
- `subagent_type: spec-drift-auditor` — STORY_MODE_FLOW.md / docs vs actual code
- `subagent_type: consistency-auditor` — pass the constraint "focus on text-content sub-mode only (Pokemon vs Pokémon, dialogue tone, pool exhaustiveness)"

Wait for all three to complete.

## Synthesis

```bash
ls -la agent-state/findings/
node scripts/debug/issue-ledger.mjs
```

Read `agent-state/ISSUE_LEDGER.md` and summarize:

- Severity counts
- Top 5 story-mode findings
- Any agent failures

## When to use this instead of /deep-debug

- You want a focused pass on story mode without paying for engine/perf/PvP audits
- You're shipping a story-mode polish PR and want the most relevant findings
- Iterating after a story-mode change to confirm no new drift introduced

Use `/deep-debug` for the full battery (engine + PvP + perf included).
