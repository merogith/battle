---
name: read-monolith-section
description: Reads a bounded region of `battle.html` (the 48,416-line / 3.2 MB monolith). Enforces a 400-line cap per read to prevent context burn. Use anchor symbols to find the right region, not raw line numbers.
---

# read-monolith-section

## When to use

Whenever you need to study a chunk of `battle.html`. **Never** read the whole file — it's 48,416 lines and will exhaust your context. Always bound by anchor symbols or a tight line range.

## How to use

### Step 1 — Resolve the anchor

Use the `find-anchor` skill to get the line number for the symbol you care about (e.g., `rollTrainerTeam`).

### Step 2 — Read a bounded region

Use the `Read` tool on `/home/user/battle/battle.html` with `offset` and `limit`. **Hard cap: 400 lines per call.**

```
Read tool args:
  file_path: /home/user/battle/battle.html
  offset: <anchor_line - 5>
  limit: 200  # default; can go up to 400 for top-level review
```

For a function definition, read 5 lines before (to capture the comment/decorator if any) and up to 200 lines forward.

### Step 3 — If you need more, chunk it

If you need to study more than 400 lines, do two reads with different offsets. **Do not** raise the limit above 400.

## Anti-patterns

- ❌ `Read battle.html` with no offset (reads first 2000 lines — wastes 2000 lines of context on CSS).
- ❌ `Read battle.html` with `limit: 5000` (hard refusal — your context will overflow before you finish).
- ❌ Reading by raw line number from CODEBASE_MAP.md (stale by thousands of lines — resolve via `find-anchor` first).
- ❌ `cat battle.html | grep ...` via Bash — slow on a 3.2 MB file; use grep directly without cat.

## Good patterns

- ✅ `find-anchor rollTrainerTeam` → resolves to `~32290` → `Read battle.html offset=32285 limit=200` reads the function head + body.
- ✅ For a section bounded by two anchors (`STORY_EVENTS_RAW` to next top-level), resolve both, compute the range, cap at 400.
- ✅ `grep -nE "pattern" battle.html | head -20` for fast pattern hunts that produce file:line you can then read.
