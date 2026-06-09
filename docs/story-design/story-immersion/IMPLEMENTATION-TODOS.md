# Stream 4 — Implementation TODO Brief

> **Handoff for a deep-investigation agent.** This enumerates what the Stream 4 design spec
> (`storytelling-systems.md`) leaves **unbuilt**, re-grounded against the *actual current code*.
>
> **Snapshot:** `main @ 59e687d` · 2026-06-09. The design spec was written 2026-06-04; **main has
> moved a lot since** (PR #252 per-tier raids + framing, PR #255 late-game balance, etc.).
> **⚠️ MAIN MOVES FAST.** Treat every "built / unbuilt" flag and line number below as *of this
> date only* — **re-resolve every symbol with the `anchor` skill before acting.** Several items
> the spec calls "0 hits / unbuilt" are *already shipped under different names* (see §6).

---

## 0. How to use this brief

For each TODO the investigating agent should produce a **finding** (`agent-state/findings/…`,
via the `emit-finding` skill) or a short plan containing:
1. **Re-grounded anchors** — exact `file:line` + symbol, re-resolved today.
2. **Scope** — what changes, what call sites, what data.
3. **Approach** — the smallest correct implementation (reuse > reinvent).
4. **Test** — the guard test that locks it (jsdom harness; see §5).
5. **Risk + sign-off** — does it touch save schema / balance / behavior? (→ needs maintainer diff.)

**Hard constraints (from `CLAUDE.md`) — non-negotiable:**
- **No game-behavior change ships without maintainer sign-off** (damage/status/AI/ball/RNG/balance,
  *and any new behavior* — barks, cinematics, friendship deltas). Propose a diff; wait for approval.
- **Save schema is sensitive** (`SAVE_VER` + `migrateStoryPreV*`). A wrong edit corrupts live saves.
  Read `STORY_MODE_FLOW.md` first.
- **Seeded RNG only** (`storyRngNext`), never bare `Math.random()`, for anything user-visible.
- **Sloppy-mode hazard** (no `'use strict'`): populate module placeholders via `Object.assign(X, …)`
  / `X.push(…)`, never `X = …`. (The live `BARK_POOLS` loader at ~10293 is the canonical pattern.)
- **Data-driven over code-driven**: pools / strings / tables → `data/`; mechanics + curves stay in code.

---

## 1. Status snapshot — built vs unbuilt @ `59e687d`

| # | Tool / item | Spec § | Status | Key symbols (re-resolve!) |
|---|---|---|---|---|
| T1 | Setup-beat hook | 3.1 | ❌ **unbuilt** | `SETUP_BEATS`, `_resolveSetupBeats` → 0 |
| T2 | Choice/consequence + flags + friendship | 3.2, 4 | ⚠️ **partial** | choices render/persist (`storyChoices` ✓); **consequence layer 0** (`_storyApplyConsequence`, flag-writes, friendship) |
| T3 | Cinematic trigger (registry + Promise facade) | 3.3 | ⚠️ **bodies exist, facade unbuilt** | concrete bodies ✓ (11: `_showRoamingLegendarySighting`, `showRaidEncounterIntro`, …); `STORY_CINEMATICS`/`_playCinematic` → 0 |
| T4 | Content schema v2 (`speaker`, `<Cond>` grammar, data pipeline) | 3.4 | ⚠️ **base exists, v2 ext unbuilt** | `branches`/`requires`/`when` in data ✓ (40); `_resolveActLines` ✓; `_condHolds` (proposed name) → 0 |
| T5 | Bark hook | 3.5 | ✅ **BUILT** (don't rebuild) | `_emitBark` ✓ + `BARK_POOLS` ✓, wired (`critKO`/`foeLastFaint`/`fledRoad`/…). TODO = **coverage only**. |
| T6 | Rival-friendship scalar | 4 | ❌ **unbuilt** (source exists) | `rivalFriendship` → 0; **`rivalEncounterLog` ✓ (8)** = the derivation source |
| T7 | Unified v25 save migration | 5 | ❌ **unbuilt** | `SAVE_VER = 24`; `migrateStoryPreV25` → 0 |

---

## 2. The backlog, prioritized into tiers

### Tier A — cheap, safe, ship-ahead (no save touch, low risk)

- **A1 — Explicit `persistKey` + guard (spec §6.5).** Today an omitted `persistKey` falls back to a
  **positional** `metaKey = baseMeta + '-' + i`, so **reordering acts silently re-keys a choice** and
  orphans its callbacks. Audit all `choice.options[]` for explicit `persistKey`; add a lint-style test
  (`story-cc-contract.test.js`) that fails on any positional fallback. *Mechanical; no behavior change.*
- **A2 — "No orphan flag / no dead node" contract tests (spec §6.6).** Encode as tests, not prose:
  every consequence `choice` that sets a flag has ≥1 later `requires`/`branches.when` reader; every node
  advances / chooses / barks. *Test-only — but depends on T2's flag layer to be meaningful; can start as
  a skeleton over today's `branches`/`requires`.*
- **A3 — Per-tier Road-4 balance knob (from PR #252).** Per-tier raids made Road-4 spawn **base forms**
  → 4 arcs got easier (correct direction: Road-4 *should* be the easiest tier). If the maintainer wants
  base forms tougher, tune `_bossStatMult` for the `miniRaid` tier. **Balance = maintainer-owned**; this
  is a "surface the knob + propose values" task, not an autonomous change.

### Tier B — core engine hooks (each ships with a diff for sign-off; §9.6 pre-approved to *develop*)

- **B1 — Setup-beat hook (§3.1).** `SETUP_BEATS` table + `_resolveSetupBeats(road, host)`; mount on the
  **existing diamond** (`enterCity` / IntroQueue / cold-open) now, re-point to Camp later (§6.3). This is
  the **fix-enabler for B-fix below.**
- **B2 — Choice/consequence + story-state (§3.2, §4).** Extend the *existing* choice system with optional
  keys `set` (flag), `friendship` (delta), `cinematic`; add `sm.flags` + helpers (`_storySetFlag`/`_storyHasFlag`),
  `sm.rivalFriendship` (T6) + `_storyNudgeRivalFriendship`. **Choice contract must stay byte-identical**
  (`persistKey`/`value`/`reply`/`branches.when`) — additions are new optional keys only.
- **B3 — Cinematic registry + Promise facade (§3.3, Decision D3).** **Do not rebuild the bodies** — they
  exist (T3). Build the unified `STORY_CINEMATICS` registry + `_playCinematic(key) → Promise` thin wrapper
  over the existing concrete functions, and a `beat.kind → framing` map. Keys off `sm._activeBeatBattleKey`
  (confirmed live). Skippable + reduced-motion fallback.
- **B4 — Content schema v2 (§3.4).** Additively extend `STORY_SCENES`: optional `speaker` block (the
  Stream-2 "Oak-monotony" voice fix becomes a data edit); extend the **existing** condition reader
  (`_resolveActLines`) to support `{flag,eq}`, `{friendshipAtLeast/AtMost}`, `{all}`/`{any}` (back-compat
  with today's `{key,eq}`); wire the `data/dialogue/` + `data/story/` pipeline (the `extract-dialogue-pools.mjs`
  path already ships). **Extension, not rewrite.**
- **B5 — Bark coverage (§3.5).** Mechanism is DONE (`_emitBark`/`BARK_POOLS`). TODO = audit story-event
  coverage for "no dead nodes," add pools where missing (additive, seeded). Verify the load-time `barkPool`
  validation (a bark on a **state** event must fail).

### Tier C — sensitive / cross-initiative (coordinate; do NOT freelance)

- **C1 — Unified v25 save migration (§5, Decision D1). 🔴 SENSITIVE.** One `migrateStoryPreV25`, Stream-4-owned,
  bumping `SAVE_VER 24→25`: derive `rivalFriendship` from `rivalEncounterLog` (net wins−losses, clamped ±12),
  co-load **Camp's `slot.bonds`** block (Option A). Must be idempotent (mirror `migrateStoryPreV21`'s shape),
  reject `version>current`, swallow corrupt JSON. **Never two v25s** — coordinate with Camp + Overhaul Phase-E
  before writing a byte. Needs the v24 fixture (`tests/fixtures/story-save-v24.json`) + `save-migration-v25.test.js`.
- **C2 — Setup/payoff inversion (§6.2). Structural.** `_tryFireRoadStoryBeats` dumps a road's *setup* scenes
  at the **same** first-battle row as the *payoff* fight. The setup-beat hook (B1) only fixes this if setups
  mount **upstream** of their `anchorRow` — i.e. it depends on **dispatch order**, which the spec routes to
  **Overhaul Phase E** (slot dispatcher, H4-3), *not* Stream 4. Investigate the seam; flag whether a cheap
  sort fix (G3/G4) can ship ahead of the full dispatcher.
- **C3 — Dedupe-ledger coordination (§6.7).** `scenesShown` (per-run) vs `storyEventsFired` (persistent) —
  each tool must pick by intent. Overhaul Phase-E's H4-3 "touches the dedup store and needs the Phase-E
  migration" — ensure it doesn't become a **second** story-state migration racing v25.
- **C4 — Diamond-host dependency (§6.3).** Agency is meant to live at **Camp**, which is **unimplemented**.
  Resolution: mount on the existing diamond now; re-point to Camp's `Break camp` end-step when it ships.

---

## 3. Test plan to build alongside (spec §7)

jsdom harness (`tests/helpers/load-engine.js`), seeded RNG, `-v2x` suffix convention. Suites:
`story-setup-beats` (T1) · `story-consequence` (T2) · `story-cond-grammar` (T4) ·
`story-cinematic-trigger` (T3 — *raid→wild framing, never `showBattleIntro`*) ·
`smoke-dialogue-load` extend (T5 bark validation) · `story-cc-contract` (A1/A2 lint) ·
`save-migration-v25` (C1) · `story-narration-system` extend (schema tolerance).
Fixture: `tests/fixtures/story-save-v24.json`.

---

## 4. Open maintainer decisions (mostly resolved — confirm before coding)

Per `cross-stream-coherence.md §8` + `storytelling-systems.md §9`, D1–D7 are **locked**: v25 = one unified
migration (D1) · cinematic = Promise facade over Stream-3 bodies (D3) · dispatcher = Overhaul Phase E owns,
G3/G4 ship ahead (D2) · rival scalar name = `rivalFriendship` (D4) · friendship tuning ±12 / win +1 / loss −2,
choice ±1 (D6) · barks + cinematics + impact layer **approved to develop**, timed "resonance" choice **CUT** (D7).
**Each approved item still ships with a diff for sign-off** before code lands.

---

## 5. Already DONE on main — do NOT rebuild

- **Raid encounter framing (spec §6.4):** `showRaidEncounterIntro` mounts the legendary-sighting cinematic
  (not the trainer VS-splash); locked by `tests/suites/story-raid-framing.test.js`.
- **Per-tier raid species (PR #252):** `_EXTRA_RAID_SPECIES_BY_TIER` + `_raidBossInfoForBeatKey` — each raid
  tier fields the creature its prose names (Road-4 base → Road-5 evolved → Road-6 climax).
- **Bark hook (spec §3.5):** `_emitBark` + `BARK_POOLS`, wired into battle events. Coverage may be incomplete
  (B5) but the **mechanism is built**.
- **Condition base + dedupe ledgers:** `_resolveActLines`, `branches`/`requires`/`when`, `scenesShown`,
  `storyEventsFired`, `rivalEncounterLog` all live — the v2 work *extends* these.

---

## 6. ⚠️ Drift warnings for the next agent

- The spec's "0 hits / unbuilt" claims are **dated 2026-06-04** — this brief already found **T5 (barks)
  shipped** and **T3 bodies shipped** since. **Re-run the symbol greps** (or `anchor`) for every item; assume
  more may have landed.
- Symbol names drift from the spec's *proposed* names (spec said `_storyBark`; real is `_emitBark`). Search by
  **behavior**, not just the spec's name.
- Housekeeping (verify, low priority): a stray `tmp-pd.mjs` appeared in the repo root via an upstream merge —
  confirm whether it belongs; `tests/moves/` still has ~39 `it.todo()` stubs (test debt, owned by
  `test-coverage-filler`).
