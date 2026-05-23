---
description: Look up a symbol in the codebase — function or const name → file:line. Drift-tolerant; refreshes the symbol index automatically if the symbol isn't found.
argument-hint: <symbol-name>
---

# /anchor <symbol-name>

Fast wrapper around the `find-anchor` skill.

## What it does

```bash
node scripts/debug/symbol-index.mjs --lookup "$ARGUMENTS"
```

Returns one or more `file:line` matches with kind and a code snippet. If the symbol isn't in the index, the symbol index is regenerated and the lookup is retried.

## Example

```
/anchor rollTrainerTeam
→ battle.html:32290    function-decl    function rollTrainerTeam(trainer, partySize, ...) {

/anchor STORY_EVENTS_RAW
→ battle.html:27969    const-decl       const STORY_EVENTS_RAW = [
```

## When the symbol isn't found

The symbol may be:

- A property reference (e.g., `__testHarness`) — the index only captures declarations
- An object method using shorthand syntax — not in the current pattern set
- Renamed or removed

Fall back to grep:

```bash
grep -nE 'function.*<symbol>|const.*<symbol>|<symbol>\s*\(' battle.html | head -10
```

## When to use

- Before reading a region of `battle.html` (use the resolved line to bound your `Read` call)
- Before citing a `file:line` in a finding or commit message
- Whenever `CODEBASE_MAP.md` or `HANDOFF.md` mentions a line number — those are stale; resolve via this command
