---
description: Comprehensive Showdown-parity sweep — enumerate every move/ability/item, run the differential against @pkmn/sim, then fan out differential-triage-auditor agents (one per divergence shard) to classify findings into the ledger. ~30–45 min. The "is the engine a Showdown replica?" battery.
---

# /differential-sweep

Run the full Showdown-parity methodology (`tests/differential/METHODOLOGY.md`):
enumerate all moves/abilities/items, diff both engines, then triage the divergences
into `ISSUE_LEDGER.md`. No game code changes — observe, diff, and file findings only.

## Stage A — regenerate + sweep (one script each; ~30 min)

```bash
# 1. Enumerate every entity → scenarios + coverage map
node tests/differential/generate-scenarios.mjs

# 2. Run the comprehensive differential sweep (writes SWEEP_REPORT.md, FIDELITY.md,
#    sweep-out/results.json, sweep-out/triage-shards.json)
node tests/differential/sweep-all.mjs --seeds 8
```

Read `tests/differential/SWEEP_REPORT.md`. The "High-confidence divergences by shard"
table tells you which shards exist and how big they are.

## Stage B — fan out triage agents (one per shard)

For each non-empty `kind.family` shard in `triage-shards.json`, spawn a
`differential-triage-auditor` (parallelize in waves of ~3, like `/deep-debug`):

- `subagent_type: differential-triage-auditor`
- Tell each agent its shard name in the prompt, e.g.
  *"Triage shard `move.status` from tests/differential/sweep-out/triage-shards.json."*

Typical shards: `move.damaging`, `move.status`, `move.fixed-damage`,
`ability-defensive`, `ability-offensive`, `ability-switchin`, `item-offensive`,
`item-hold`. Skip empty ones.

Each agent classifies its divergences into the six-bucket taxonomy, files findings for
the real bugs (and the curated top-N unimplemented gaps), and appends rng/intentional/
harness cases to the allow-lists.

## Stage C — synthesize

```bash
node scripts/debug/issue-ledger.mjs   # fold all triage findings into ISSUE_LEDGER.md
```

Print the new findings (severity + category breakdown). Re-read `FIDELITY.md` for the
headline "divergent entities" number — that is the replica-fidelity metric.

## Narrower runs

- One kind: `node tests/differential/sweep-all.mjs --kind move --seeds 8`
- One entity / family: `node tests/differential/sweep-all.mjs --filter thunder`
- Shard the run itself (for parallel machines): `--shard 0/8 … --shard 7/8`

## When to use

- After `npm run sync-showdown-data` (new Showdown data → re-validate parity).
- Before a release, as the "engine matches Showdown" gate.
- When the user asks "does <move/ability/item> work like Showdown?" — `--filter <name>`.

## Scope

Story-mode normal singles only. Banned/illegal *availability* is acceptable
(differences on Z/Max/Gigantamax/CAP/doubles are not bugs). Engine fixes for the
findings are a separate, sign-off-gated follow-up (`CLAUDE.md`).
