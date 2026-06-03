# Task 03 — Fill the remaining move todos

**Goal:** drive the post-promotion todo count (≈44) toward zero by filling what's
fillable and making an explicit call on what isn't.

**Owner:** test-coverage-filler. **Sign-off:** direction only (no game logic changes —
this is test authoring). **Depends on:** Task 02 for the broken-move group.

Use the existing drafts in `tests/moves/by-category/manual/` (post-promotion) as
templates. Harness facts and the apostrophe gotcha are in `README.md`. New fills go in
a draft/manual file and must be deterministic (the harness pins `seedRng(0)`).

---

## Bucket A — unblocked once Task 02 lands (fill these after each fix)

Each has a ready recipe; the placeholder usually already exists.

| Move | Fix (Task 02) | Assertion to write |
|------|---------------|--------------------|
| Comeuppance | #1 | reflects 1.5× the prior physical/special hit; 0 with no prior hit (clone the Metal Burst test in `prior-context`) |
| Crush Grip | #2 | dmg vs full-HP target > dmg vs 30%-HP target (replace placeholder in `variable-damage`) |
| Trick / Switcheroo | #3 | both items swap: `a.item===foeOld && d.item===userOld` |
| Upper Hand / Shell Trap | #4 | fails vs a non-priority / non-physical move; connects under its gate |
| Grass Whistle | #5 | seed-sweep lands `SLP` (mirror Sing in `status-infliction`) |
| Power Shift, Corrosive Gas, Purify, Venom Drench, Ion Deluge, Crafty Shield, Mat Block | #6 | the effect each finding's "Verify" line names |
| Nature Power, Copycat, Mirror Move, Parting Shot, Doodle, Powder, Me First, Electrify, Fairy Lock, Nightmare, Disable, Laser Focus | #7 | only if #7 confirms they're real & fixed |

When a fix lands, remove the move from the generator's `DEFERRED` set (Task 01) and
add its assertion. Re-run `node tests/audit/generate-move-tests.js` + the suite.

---

## Bucket B — complex, fillable now (no engine fix needed)

These work in the engine but need choreography the simple `runTurn` helper doesn't do.
Use the **manual 2-mon-party setup** from `manual/switch-pivot.test.js` /
`manual/misc-status.test.js` as the template (`reset(); seedRng(0);
engine.state.pActive/fActive/playerParty/foeParty=...; window.playTurn(...)`).

- **Healing Wish / Lunar Dance** — user faints; the *incoming* switch-in is healed (and
  Lunar Dance restores PP). Set up `playerParty=[user, benched]`, have the user faint
  (or be the one using it), force the switch, assert the replacement is full HP /
  cured. Lunar Dance also cures status.
- **Heal Pulse / Floral Healing** — these target an **ally** and were no-ops in singles
  (healed 0). If you build a doubles/ally context (see Bucket C), assert the ally heals.
  Otherwise leave as a documented doubles-only todo.
- **Recycle** — needs the user to have **consumed** an item first (e.g., hold a
  Sitrus/Oran Berry, drop below 50% so it's eaten, then Recycle on a later turn).
  Assert `a.item` is restored. Multi-turn via `window.playTurn`.

---

## Bucket C — doubles-only (decision required)

These have **no observable effect in a 1v1 harness** (ally buffs, redirection,
turn-order, team-protect that needs a partner):

```
After You, Ally Switch, Aromatic Mist, Coaching, Decorate, Dragon Cheer,
Flower Shield, Follow Me, Gear Up, Helping Hand, Magnetic Flux, Quash,
Rage Powder, Rototiller, Spotlight
```

Pick one with the maintainer:

- **(Recommended) Leave as permanent todos**, retitled to flag intent, e.g.
  `it.todo('Follow Me [doubles-only — no singles effect]')`. Cheap, honest, and
  matches the active scope (Story mode is 1v1). Add them to a `DOUBLES_ONLY` set in the
  generator so the title is self-documenting and they're excluded from "unfilled work."
- **Build a minimal doubles harness** in `tests/helpers/` (2 active mons per side) and
  assert real redirection/ally effects. Larger effort; only worth it if doubles enters
  scope.

Either way, record the decision in `STORY_MODE_FLOW.md` or a comment so the next agent
doesn't re-investigate.

---

## Definition of done

- Every Bucket A move with a landed fix has a real test; its finding is
  `fixed-<branch>`.
- Bucket B moves filled (or explicitly deferred with a reason).
- Bucket C decision made and encoded in the generator.
- `node --test --test-concurrency=4 'tests/moves/**/*.test.js'` → `0 fail`, and
  `# todo` reflects only the agreed doubles-only set (≈15) or 0.
