# Camp System — Implementation Roadmap

> Part of the [Camp System spec](./README.md). This sequences the build so a
> future session can ship it in small, testable, sign-off-gated PRs. **Nothing
> here is implemented yet.** Re-resolve every anchor with `find-anchor` before
> coding.

---

## 1. How to use this folder

1. Read, in order: `CLAUDE.md`, `STORY_MODE_FLOW.md` (saves/flow are sensitive),
   `docs/PROGRESSION_CURVE_MASTER.md` (the buff must fit the curve),
   `../STORY_NARRATION_SYSTEM.md` (the cinematics substrate), then this folder's
   [`README.md`](./README.md).
2. Get the maintainer to answer the **decisions** (README §5 rollup, D1–D10)
   relevant to the PR you're about to start. Balance + content + flow changes
   need explicit sign-off *before* the diff ships (`CLAUDE.md` Approval rules).
3. Work one PR at a time from §3 below, each on its own short branch, each
   leaving a deterministic test behind.

---

## 2. Phasing

- **Phase 0 — Cinematics POC** (no save changes): the sighting fold. De-risks the
  shared-substrate approach and continues §6.
- **Phase 1 — Dormant plumbing** (save + battle hook, no UI): land the `SAVE_VER`
  25 migration and the relationship buff math while all bonds are 0 (buffs are
  no-ops) → behaviour-preserving but everything is wired.
- **Phase 2 — The buffer** (camp flow + hub shell): deliver the between-events
  beat and the camp screen; no earning loop yet.
- **Phase 3 — The earning loop** (minigames + party panel): bonds can now rise →
  buffs become live → **balance sign-off gate**.
- **Phase 4 — Navigation + polish**: return-to-previous-city; the rest of the
  cinematics catalogue.

---

## 3. Suggested PR sequence

| PR | Scope | Risk | Save Δ | Sign-off needed |
|----|-------|------|--------|-----------------|
| **A** | Sighting fold + cinematics POC (`EVENT_CINEMATICS` §3) | low | none | direction (folds) |
| **B** | `migrateStoryPreV25` (all new fields) + `relationshipStatMult` + `buildPokemon` apply block + player-build stamp — **dormant** (bonds all 0) | **high** (saves+battle) | **V25** | save-schema + stat-hook diff |
| **C** | Camp flow: interpose seam, `enterCamp`, `screen-story-camp`, arrival beat, gating | med (flow) | uses V25 | **flow ordering** |
| **D** | Bonding micro-games (18 = 6 actions × 3 on a shared input toolkit; ship 1/action, expand to 3) + Temperament + Titles + `renderCampPartyPanel` (bond hexagon) + wire → `slot.bonds` | med | uses V25 | **balance** + content tone |
| **E** | Return-to-previous-city round-trip + revisit-cinematic suppression | med (flow) | uses V25 | flow |
| **F** | Cinematics catalogue Pri 2–3 + wild/catch/victory polish | low | none | direction |

**Why this order:** PR B lands the scary save+battle plumbing *in isolation and
dormant* (provably behaviour-preserving because every bond is 0, so every
`_relationshipStatMult` is all-1.0). PR C delivers the maintainer's primary ask
(the buffer) without needing the earning loop. The buff only becomes *live* in PR
D — which is exactly when the balance review should happen. Each PR is small
enough to review and revert.

> **Critical:** the **single `SAVE_VER` 24 → 25 bump lands in PR B** and covers
> *all* new fields (`slot.bonds`, `sm.campByEventIdx`, `sm.campReturnPoint`) even
> though their UIs arrive in later PRs. Do **not** bump the version again in C/D —
> add no new persistent fields after B without another planned migration.

---

## 4. The consolidated V25 migration (lands in PR B)

```js
// SAVE_VER: 24 -> 25
function migrateStoryPreV25() {
  // bonding (BONDING_RELATIONSHIPS §6)
  const DEFAULT_BONDS = () => ({ praise:0, nurture:0, discipline:0, intimidate:0, mimicry:0, devotion:0 });
  for (const arr of [sm.team, sm.pcBox]) {
    if (!Array.isArray(arr)) continue;
    for (const slot of arr) {
      if (!slot || slot.isEgg) continue;
      if (!slot.bonds || typeof slot.bonds !== 'object') slot.bonds = DEFAULT_BONDS();
    }
  }
  // camp flow (CAMP_FLOW §7)
  if (!sm.campByEventIdx || typeof sm.campByEventIdx !== 'object') sm.campByEventIdx = {};
  if (sm.campReturnPoint === undefined) sm.campReturnPoint = null;
}
// load(): if (d.version < 25) migrateStoryPreV25();
// template sm{}: add the three fields with the same defaults.
```

Mirror the existing `migrateStoryPreV21` / `migrateStoryPreV24` shape exactly.
Idempotent; exactly-once on load.

---

## 5. Dependency graph

```
PR A (sighting fold) ──────────────► independent (do anytime)
PR B (V25 + buff math, dormant) ──► PR C ──► PR D ──► PR E
                                              │
PR F (cinematics catalogue) ◄─────── reuses A's substrate; PR D needs the
                                      bond-maxed reveal from F-Pri3 (or stub it in D)
```

- B blocks C/D/E (they need the V25 fields).
- A and F are cinematics; A is the POC, F the rest.
- D's "bond maxed" reveal overlaps F-Pri3 — implement the small reveal in D, or
  land it in F and stub in D.

---

## 6. Test strategy

Every PR leaves a deterministic jsdom test (`tests/helpers/load-engine.js`),
mirroring the style of `tests/suites/overlay-zindex-tokens.test.js`:

- **A:** sighting overlay renders via `_renderNarrativeOverlay`, carries a
  `--sn-z-*` token, shows lore, fires `onDone`; skip resolves; reduced-motion
  fallback taken.
- **B:** migration idempotency + defaults; `relationshipStatMult` unit; player
  mon with one maxed path scales exactly one stat; foe unaffected; HP path scales
  `maxHp`. **Plus a "dormant" assertion: with all bonds 0, built stats are byte-
  identical to pre-feature.**
- **C:** camp fires once per transition; `campByEventIdx` set; `STORY_EVENTS_RAW`
  length/ids unchanged (no-renumber guard).
- **D:** scoring clamp; backfire; preference stability; budget cap; no bare
  `Math.random` in scored paths.
- **E:** round-trip restores `eventIndex`, clears `campReturnPoint`, suppresses
  revisit cinematics; survives save/reload mid-trip.

Run the full suite before each push; expect only the known `@pkmn/sim`
differential-oracle env failure locally (green in CI).

---

## 7. Risk register

| Risk | Mitigation |
|------|------------|
| **Save corruption** | single idempotent V25; never touch `STORY_EVENTS_RAW` rows; migration test; mirror existing pattern; land dormant in B |
| **Balance drift** (buffs) | buffs no-op until PR D; sign-off gate at D; curve-fit check vs `PROGRESSION_CURVE_MASTER`; aggregate cap knob (D1) |
| **Flow-ordering bug** (camp at wrong seam) | flag class per `CLAUDE.md`; fire after reward+save, before next cold-open; validate vs `IntroQueue`; gating test |
| **Content tone** (cruel/romance) | declared ceiling (D10); copy reviewed for sign-off; backfire = sulk, not harm |
| **Cinematics sprawl** | one-substrate rule (`_renderNarrativeOverlay`/`_storyScene`); per-event time budget; tokens not literals |
| **Perf** | DOM/CSS only, off battle hot path; skippable; reduced-motion; perf-profiler check |
| **Anchor drift** | every anchor re-resolved with `find-anchor`; symbols over line numbers |

---

## 8. Definition of the first PR (start here)

**PR A — legendary-sighting fold + cinematics POC.** Self-contained, no save
changes, continues §6, proves the substrate loop. Scope in `EVENT_CINEMATICS`
§3. It's the lowest-risk way to start and the maintainer already greenlit
"start with the legendary-sighting cinematics."

If the maintainer would rather see the *camp buffer* first, start at **PR B then
C** instead (saves plumbing → buffer), accepting the higher initial risk of the
V25 migration.

---

## 9. Decision index

All open decisions (D1–D10) are collected in [`README.md`](./README.md) §5 with
per-doc detail. Resolve the ones a PR touches before that PR ships.
