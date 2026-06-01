---
name: find-anchor
description: Resolves a symbol name (function or const) to `file:line` in the codebase. Drift-tolerant — agents should call this instead of trusting line numbers in older design docs. Maintains a negative cache for confirmed-missing symbols so you don't repeat-grep dead leads.
---

# find-anchor

## When to use

Any time an agent needs to know where a symbol lives. Especially:
- Before reading a region of `battle.html` (use the resolved line to bound the read).
- Before quoting a `file:line` in a finding (so the line is fresh).
- When any design doc (e.g. STORY_MODE_FLOW.md, PROGRESSION_CURVE_MASTER.md) mentions a `battle.html` line number — treat it as almost certainly stale; battle.html drifts continuously. Resolve via this skill.

## How to use

### Fast path — symbol is in the index

```bash
node scripts/debug/symbol-index.mjs --lookup <SYMBOL_NAME>
```

Returns one or more `file:line` matches with kind and a snippet. Exit 0 = found, exit 3 = not in index (might exist as a property reference or object method — fall back to grep).

### Slow path — symbol not in the index

```bash
grep -nE "(function|const|let|var)\s+<SYMBOL_NAME>\b|\.<SYMBOL_NAME>\s*=|<SYMBOL_NAME>\s*\(" battle.html | head -10
```

If grep also returns nothing, the symbol may have been renamed or removed.

### Refresh the index if you suspect drift mid-session

```bash
node scripts/debug/symbol-index.mjs
```

Idempotent. Re-scans `battle.html`, `online-pvp.js`, `move-*-map.js`. Writes `agent-state/symbol-index.json` (consumed by `--lookup`).

## Negative cache

`agent-state/symbol-negative-cache.json` tracks symbols that were searched and confirmed missing in this session. Before grepping, agents should consult this file:

```bash
node -e "const x=require('./agent-state/symbol-negative-cache.json'); process.exit(x.misses.includes(process.argv[1]) ? 1 : 0)" <SYMBOL>
```

Exit 1 = confirmed missing this session, don't grep again. Add to the cache when you confirm a miss:

```bash
node -e "
const fs=require('fs'); const p='agent-state/symbol-negative-cache.json';
const j=JSON.parse(fs.readFileSync(p,'utf8'));
if(!j.misses.includes(process.argv[1])){j.misses.push(process.argv[1]);fs.writeFileSync(p,JSON.stringify(j,null,2));}
" <SYMBOL>
```

## Output contract

Always quote the **freshly resolved** line in findings as `current_line_hint: ~<line>` (with the tilde to signal approximate). The `anchor_symbol` field is the source of truth — line numbers drift.
