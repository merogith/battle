---
description: Re-run the ledger generator against existing finding files. Use this after manually adding or editing a finding, or after marking a finding as fixed.
---

# /triage-issues

Re-synthesize `agent-state/ISSUE_LEDGER.md` from the current contents of `agent-state/findings/`.

## When to use

- You manually added a finding file and want it merged into the ledger
- You edited a finding's `status` field (e.g., `open` → `fixed-<branch>`) and want the ledger to reflect it
- You deleted a stale finding file and want the ledger to drop the issue

## Workflow

```bash
ls -la agent-state/findings/
node scripts/debug/issue-ledger.mjs
```

Read the regenerated `agent-state/ISSUE_LEDGER.md` and summarize:

- Severity distribution
- New entries since the last run (if you can tell from git)
- Status transitions visible in the body

## Notes

- The ledger is **regenerated**, not edited. Never hand-edit it.
- To change an issue's status: edit the corresponding file in `agent-state/findings/` and re-run this command.
- Fingerprints handle dedup automatically — two findings with the same fingerprint collapse to one entry with multiple `agents:` listed.
