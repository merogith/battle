---
description: Run the performance profiler only — turn loop, parseMoveEffects, memory growth across a story replay. ~3–5 min. Use this when you're investigating a slowdown or want a quick perf snapshot.
---

# /perf-check

Performance-only audit.

## Workflow

Spawn the performance-profiler sub-agent:

- `subagent_type: performance-profiler`

The agent will invoke `node scripts/debug/perf-bench.mjs`, which writes `tests/reports/perf.md` with:

- Engine boot time
- Turn loop median / IQR / min / max (target: < 50 ms in jsdom)
- `parseMoveEffects` per-move (target: < 0.5 ms)
- Memory growth over 60 turns (linear = OK, quadratic = leak)

The agent files findings for any metric exceeding 2× target.

## Synthesis

```bash
node scripts/debug/issue-ledger.mjs
```

Print the perf findings summary and link to `tests/reports/perf.md` for the raw timings.

## Tips

- Run with `--expose-gc` for cleaner memory readings: `node --expose-gc scripts/debug/perf-bench.mjs`
- jsdom timing ≠ production timing (jsdom short-circuits `sleep`). Use the numbers comparatively, not absolutely.
