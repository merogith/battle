---
description: Run the data-integrity auditor only — cross-validates data/*.json (moves, species, abilities, items, natures, builds) for missing references, illegal pairings, schema inconsistencies. ~1 min. Useful as a smoke test of the debug system.
---

# /data-check

Data integrity audit only. Fastest of the debug commands — useful as a smoke test that the system is working.

## Workflow

Spawn the data-integrity-auditor sub-agent:

- `subagent_type: data-integrity-auditor`

The agent invokes `node scripts/debug/data-validator.mjs` which scans:

- `data/moves.json` (~954 moves)
- `data/species.json` (~1515 species)
- `data/abilities.json` (~314 abilities)
- `data/items.json` (~583 items)
- `data/natures.json` (~25 natures)
- `data/builds/gen[4-9].json` (~17,381 flattened builds)

Cross-checks every build's move/species/ability/item/nature against the catalog. Files findings for missing references.

## Synthesis

```bash
node scripts/debug/issue-ledger.mjs
```

Print the data findings summary. The validator also writes `tests/reports/data-integrity.md` with raw counts.

## When to use

- Right after a `npm run sync-showdown-data` to confirm the new data shapes still match expectations
- As a smoke test before / after touching any build-generation code
- As the first check in a CI pipeline
