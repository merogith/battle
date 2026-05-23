# Finding & Ledger Schema

Every specialist sub-agent writes findings into `agent-state/findings/` as a
markdown file containing one YAML frontmatter block per issue. The deduper
(`scripts/debug/issue-ledger.mjs`) reads every file, collapses by
fingerprint, and emits the master `agent-state/ISSUE_LEDGER.md`.

The same schema is used in both finding files and the ledger.

## Finding file naming

`agent-state/findings/<agent-name>-<ISO8601-timestamp>.md`

Examples:
- `data-integrity-auditor-20260522T140530Z.md`
- `story-mode-investigator-20260522T141512Z.md`

A finding file may contain multiple `---`-delimited YAML blocks (one per issue).

## YAML frontmatter fields

| Field | Required | Notes |
|---|---|---|
| `id` | yes (in ledger) | `ISSUE-NNN`, three-digit padded. Agents leave blank; ledger assigns on dedup. |
| `severity` | yes | `P0` (broken, blocks shipping), `P1` (real bug, ship without it), `P2` (inconsistency / quality), `P3` (polish / nice-to-have) |
| `category` | yes | `bug` \| `inconsistency` \| `balance` \| `perf` \| `a11y` \| `data` \| `test-gap` \| `refactor` \| `security` \| `dx` |
| `anchor_symbol` | yes | Drift-resilient anchor (function or const name). Prefer over line numbers. |
| `current_line_hint` | optional | Approximate line, `~NNNNN`. Resolved fresh by `find-anchor` at fix-time. |
| `file` | yes | Repo-relative path (`battle.html`, `online-pvp.js`, etc.) |
| `agents` | yes | List of agent names that flagged this fingerprint |
| `fingerprint` | yes | First 12 hex chars of SHA-256 of `kind + anchor_symbol + evidence_text` |
| `confidence` | yes | `high` (≥2 agents OR clear repro), `medium` (1 agent + concrete evidence), `low` (heuristic) |
| `status` | yes | `open` \| `in-progress-<branch>` \| `fixed-<branch>` \| `wontfix-<reason>` \| `duplicate-of-<id>` |

## Body fields (markdown, below the frontmatter)

```
**Title**: <one-sentence problem statement, ≤80 chars>

**Evidence**:
```js
<≤8-line code excerpt showing the issue>
```

**Repro**: <terminal command, URL+seed, or scenario the user can run to see it>

**Blast radius**: <which other systems / code paths are affected>

**Fix sketch**: <1–3 sentences describing the proposed fix — NOT a patch>

**Verification**: <how to confirm the fix worked: which test, which scenario>
```

## Example finding

```yaml
---
severity: P1
category: bug
anchor_symbol: getRivalIntroLine
file: battle.html
current_line_hint: ~21852
agents: [battle-engine-debugger, spec-drift-auditor]
fingerprint: a3f4b71c9e02
confidence: high
status: open
---
```

**Title**: Rival's secondary intro line uses bare `Math.random()` instead of `storyRngNext()`

**Evidence**:
```js
if (Math.random() < 0.3) {
  return RIVAL_QUOTES_SECONDARY[Math.floor(Math.random() * RIVAL_QUOTES_SECONDARY.length)];
}
```

**Repro**: Load story with `?seed=12345`, encounter rival twice — secondary quote varies between runs with the same seed.

**Blast radius**: Any seeded replay; daily-seed contests; player-shared replays diverge from advertised behavior. Same class as confusion/trap/thaw/harvest sites.

**Fix sketch**: Replace both `Math.random()` calls with `storyRngNext()`. Confirm no other branches in `getRivalIntroLine` depend on a separate RNG stream.

**Verification**: `tests/integration/story-flow.test.js` seeded-replay assertion — same seed must produce identical quote sequence across two runs.

## Severity rubric

- **P0** — Crashes, data loss, save corruption, security (XSS, leaked secret with RLS gap), gameplay-blocking.
- **P1** — Real bug a player will hit; correctness drift; race condition with observed effect; spec-vs-code drift that breaks expectations.
- **P2** — Inconsistency, naming, dead code, dialogue typo, light balance issue, missing affordance.
- **P3** — Polish, fanservice, accessibility nice-to-have, internal DX improvement.

## Confidence rubric

- **high** — Reproducible with a concrete command/scenario, OR flagged by ≥2 independent agents.
- **medium** — One agent, clear code evidence, no reproduction yet.
- **low** — Heuristic or pattern match; needs human eye to confirm.

## What agents must NOT do

- Do not invent line numbers — use `anchor_symbol` and let `find-anchor` resolve.
- Do not write patches — `fix sketch` is 1–3 sentences, no code diff.
- Do not edit `battle.html`, `online-pvp.js`, `move-*-map.js`, `data/*.json`, or anything under `tests/helpers/`. Findings only.
- Do not set `id` — the ledger assigns it on dedup.
- Do not set `status` to anything other than `open` in a finding — status transitions happen in the ledger itself.
