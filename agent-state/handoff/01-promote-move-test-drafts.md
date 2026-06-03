# Task 01 — Promote the move-test drafts

**Goal:** turn the 26 reviewed draft files into the canonical move tests, and stop
the generator from emitting `it.todo()` for moves that now have a real test.

**Owner:** test-coverage-filler (or general). **Sign-off:** not required — this is
behavior-preserving (no game logic changes). Get the maintainer's nod on *direction*
(file location) before the sweep, per `CLAUDE.md`.

**Effort:** ~30–45 min. **Risk:** low.

---

## Why this is needed

`tests/audit/generate-move-tests.js` **regenerates** `physical.test.js`,
`special.test.js`, `status.test.js` from scratch on every run, emitting `it.todo()`
for any move it can't auto-assert (charge / variable / multi-target / status-without-
boosts / the `NEEDS_MANUAL_SETUP` list). The fills are separate hand-written files in
`tests/moves/by-category/_drafts/`. So right now a filled move shows up **twice**:
once as a live test in a draft, once as a skipped `it.todo()` in the generated file.
That's why the suite still reports `# todo 351`.

This task removes the duplication and makes the drafts permanent.

## Steps

### 1. Review the drafts (they are green, but read them)

```bash
node --test tests/moves/by-category/_drafts/*.test.js   # expect 306 pass / 0 fail
```

Optionally run `/code-review` over the diff. Each draft's header comment states its
setup-shape and which moves it deliberately defers (and why). Spot-check that the
assertions match real mechanics, not harness artifacts.

### 2. Relocate the drafts to a permanent home

The `_drafts/` name signals "unreviewed." Recommended: move them to
`tests/moves/by-category/manual/` (sibling of the generated files).

```bash
git mv tests/moves/by-category/_drafts tests/moves/by-category/manual
```

Then fix the import depth in every moved file (they go from 3 levels deep to 2):

```
-import { loadEngine } from '../../../helpers/load-engine.js';
+import { loadEngine } from '../../helpers/load-engine.js';
```

(If the maintainer prefers to keep them in `_drafts/`, skip this step — the import
paths already work there. The de-dup in step 3 is what matters.)

### 3. De-duplicate the generator

Teach `generate-move-tests.js` which would-be-todo moves now have a manual test, so
it emits a pointer comment instead of `it.todo()`. Add a `DEFERRED` set (the moves
that should *stay* `it.todo()` — everything else that would be a todo is covered):

```js
// Moves still legitimately unfilled — keep emitting it.todo() for these only.
// See agent-state/handoff/03-fill-remaining-move-todos.md.
const DEFERRED = new Set([
  // damage — broken (ISSUE_LEDGER)
  'Comeuppance',
  // status — broken / no-op (ISSUE_LEDGER)
  'Trick', 'Switcheroo', 'Power Shift', 'Corrosive Gas', 'Purify', 'Venom Drench',
  'Ion Deluge', 'Crafty Shield', 'Mat Block', 'Nature Power', 'Copycat', 'Mirror Move',
  'Parting Shot', 'Doodle', 'Powder', 'Me First', 'Grass Whistle', 'Dark Void',
  // status — no readable effect in harness (verify before filling)
  'Electrify', 'Fairy Lock', 'Nightmare', 'Disable', 'Laser Focus',
  // status — complex switch/heal choreography (fillable later)
  'Healing Wish', 'Lunar Dance', 'Heal Pulse', 'Floral Healing', 'Recycle',
  // status — doubles-only, no singles effect
  'After You', 'Ally Switch', 'Aromatic Mist', 'Coaching', 'Decorate', 'Dragon Cheer',
  'Flower Shield', 'Follow Me', 'Gear Up', 'Helping Hand', 'Magnetic Flux', 'Quash',
  'Rage Powder', 'Rototiller', 'Spotlight',
]);
```

In `buildItBlock`, when `isTodo` is true:

```js
if (isTodo) {
  if (!DEFERRED.has(move.name)) {
    // Covered by a hand-written test in tests/moves/by-category/manual/.
    return `  // ${moveLit} — covered by a manual test (see by-category/manual/).`;
  }
  return `  it.todo(${moveLit} + ' [...]', async () => { /* TODO */ });`;
}
```

> The `DEFERRED` set is keyed on the **real** move name (with apostrophes). The
> generator's `safeName` only affects the emitted string literal, not this match.

### 4. Regenerate and verify

```bash
node tests/audit/generate-move-tests.js
node --test --test-concurrency=4 'tests/moves/**/*.test.js'
```

**Acceptance criteria:**
- `# fail 0`.
- `# todo` drops from **351 → ~44** (only the `DEFERRED` set remains).
- No move appears as both a live test and an `it.todo()`.
- Coverage report regenerated if one exists (`tests/audit/coverage-report.js`).

### 5. Commit

```
test(moves): promote manual move-test drafts; de-dup generator todos

306 hand-written tests (all damage + ~191 status todos) become canonical under
tests/moves/by-category/manual/. Generator now emits a pointer comment instead of
it.todo() for covered moves; only the ~44 DEFERRED moves remain as todos.
```

## Notes

- This is **1:1 behavior-preserving** for the test suite (no assertions change, no
  game logic touched) → qualifies for the "behavior-preserving refactor" rule in
  `CLAUDE.md`. Still confirm the file-location direction first.
- Do **not** hand-edit the generated `{physical,special,status}.test.js` — they are
  overwritten on regenerate. All durable changes go in the generator or the manual
  files.
