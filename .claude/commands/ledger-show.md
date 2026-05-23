---
description: Print a summary of the current ISSUE_LEDGER — severity counts, category breakdown, top P0/P1 issues. Quick status check without re-running any agents.
---

# /ledger-show

Print a summary of `agent-state/ISSUE_LEDGER.md`.

## Workflow

```bash
ls -la agent-state/findings/
test -f agent-state/ISSUE_LEDGER.md && head -60 agent-state/ISSUE_LEDGER.md
```

Read the ledger and present:

1. **Severity counts** (P0/P1/P2/P3)
2. **Category breakdown** (bug / inconsistency / balance / perf / a11y / data / test-gap / refactor)
3. **Top 5 P0/P1 issues** by id and title
4. **Status summary**: how many `open` vs `in-progress-*` vs `fixed-*` vs `wontfix-*`
5. **Stale findings**: any finding file older than 14 days that hasn't been re-flagged this session

## When to use

- At the start of a session to remember where you left off
- After a partial fix push, to confirm the ledger reflects current state
- Before deciding which issue to tackle next

## What this command does NOT do

- It does **not** re-run any agents. Use `/deep-debug` or `/story-audit` for that.
- It does **not** regenerate the ledger from findings. Use `/triage-issues` for that.
