---
description: Convert one cluster of `it.todo()` test stubs into real assertions. Pass the cluster id from test-coverage-filler's enumeration. Drafts go to tests/moves/by-category/_drafts/ — the user promotes after review.
argument-hint: <cluster-id>
---

# /fix-todo-test <cluster-id>

Convert one cluster of `it.todo()` stubs into real assertions using the jsdom harness.

## Prerequisite

The `test-coverage-filler` agent must have run at least once (via `/deep-debug` or directly) to produce the cluster enumeration in `agent-state/findings/test-coverage-filler-*.md`.

If no enumeration exists yet, run the agent first:

```
spawn test-coverage-filler in research mode (the agent's default)
```

## Workflow

Spawn the test-coverage-filler sub-agent with the cluster id:

```
subagent_type: test-coverage-filler
prompt: "Fix mode. Cluster id: $ARGUMENTS. Convert this cluster's it.todo() stubs into real assertions. Draft to tests/moves/by-category/_drafts/$ARGUMENTS.test.js, run it, confirm pass. If any assertions fail, treat as a real engine bug and file a finding instead of forcing the test green."
```

## After the agent returns

```bash
ls -la tests/moves/by-category/_drafts/
node --test tests/moves/by-category/_drafts/$ARGUMENTS.test.js
```

Read the draft and decide whether to promote (move into `tests/moves/by-category/<category>.test.js` and delete the `_drafts` copy).

## Cluster taxonomy (initial)

- `status-sleep`, `status-burn`, `status-confusion`, `boost-only`, `secondary-status`
- `recoil`, `multihit`, `charge`, `weather-dependent`, `field-effect`
- `ally-target`, `variable-power`, `signature-ohko`, `transform-form`, `counter-like`
- `misc-unclassified` (catch-all — split if it grows large)

The actual cluster ids depend on the enumeration in `agent-state/findings/test-coverage-filler-*.md`.

## Anti-patterns

- ❌ Promoting a draft without running it locally
- ❌ Editing existing test files directly (orchestrator promotes drafts; do not skip review)
- ❌ Filling more than ~40 TODOs per cluster (batch size limit)
