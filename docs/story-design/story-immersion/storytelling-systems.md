# Storytelling Systems & Tools — Stream 4 design spec

> **Story Immersion initiative · Stream 4 (the foundation).** The other three
> streams build on the APIs specced here. **DESIGN PASS ONLY** — nothing in here
> changes game code. Every API is a *proposal*; the maintainer signs off before
> any of it ships. Saves are sacred: this spec adds **one** migration
> (`SAVE_VER 24 → 25`) and never renumbers an existing one.
>
> **Status:** DRAFT — audit complete, awaiting maintainer sign-off on the tool
> surface + the open balance knobs (§9).

---

## 0. Provenance & scope (read this first)

⚠️ **The two input files the brief names were not present.** I searched the
working tree, full git history, every branch, stashes, the whole filesystem, and
the session attachments:

- `docs/story-design/story-immersion-briefs/04-storytelling-systems.md` — **absent**
- `docs/story-design/story-immersion-briefs/NARRATIVE-CRAFT.md` — **absent**

The task description says they are "in the repo; attached too," so this is most
likely a delivery gap (web/app attachments not transferring). **What this spec is
grounded in instead:**

1. the deliverable shape + the four tools, which the task description enumerates
   explicitly (setup-beat hook · choice/consequence + story-state = flags + one
   rival-affinity number · cinematic trigger · content schema);
2. the **live** narration canon in code, audited symbol-by-symbol (§1, Appendix A);
3. the shipped design docs: `STORY_NARRATION_SYSTEM.md` (the schema this extends),
   `STORY_3TRACK_IMPL_PLAN.md` (the beat/track model), `STORY_OVERHAUL_PLAN.md`
   (the north-star + known flow bugs).

**Consequences for the reader:** every section except **§8 (the cross-stream
handshake)** is fully code-grounded and brief-independent. §8 *infers* what
Streams 1–3 are and is flagged as such — **reconcile it against the real
sibling briefs at sign-off.** If you drop the two files into the repo I'll
fold them in; I expect the core (§1–§7) to survive intact because the tool set
is pinned by the task description, not by my inference.

**Scope:** Story mode, normal difficulty (per `CLAUDE.md`). PvP / Quick Play /
Frontier are out of scope and untouched. The 8-tone `STORYLINE_VARIANTS` layer is
**cut** (classic-only infra remains); nothing here revives it.

**Anchors:** every `battle.html:LINE` below was resolved live during this audit
(2026-06-04). `battle.html` drifts constantly — re-resolve any symbol with the
`anchor` / `find-anchor` skill before editing. Names are stable; line numbers are not.

---

## 1. Current state — what the storytelling engine already is

The foundation is **already substantial and shipped.** Stream 4 is not a
green-field build; it is *four targeted extensions* to a working scene engine.
Here is the live surface, audited:

### 1.1 The one renderer + the scene engine

| Symbol | Anchor | What it is |
|---|---|---|
| `_renderNarrativeOverlay(opts)` | `battle.html:47752` | **The** canonical overlay. `opts = { lines, sprite, name, nameplate, banner, bannerClass, accent, toneClass, choices, continueLabel, metaKey, sfx, onDone }`. Gold-nameplate `.story-dialog-*` box at `--sn-z-overlay` (9998). Anti-stacking queue: one live at a time, the rest queue (`_narrationLive` / `_narrationMountNext`). |
| `STORY_SCENES` | `battle.html:32157` | The content registry. `STORY_SCENES[key] = { title, body, sprite?, acts?, outro? }`. ~200 entries, **0 flat** (every scene has `acts`). |
| `_playStoryBeatScene(sceneKey, onDone)` | `battle.html:42904` | Dispatches one scene. Has `acts` → `_playSceneActs`; else legacy flat `body`. |
| `_playSceneActs(scene, baseMeta, onDone)` | `battle.html:42800` | Renders each act as one overlay page; tail-recursive `step(i)`; threads progress dots + per-act `metaKey = baseMeta + '-' + i`. |
| `_playPostBattleScene(sceneKey, onDone)` | `battle.html:42859` | Fires `scene.outro.win` after a battle (supersedes regex `STORY_POST_SCENES`). |
| `_playStoryBeatQueue(queue, i, onDone)` | `battle.html:42954` | Plays a queue of beats, stamps `sm.storyEventsFired[sceneKey]=true`, `save()`s, recurses. |
| `_tryFireRoadStoryBeats(ev)` | `battle.html:43061` | Road dispatch gate: resolves the road via `_roadForArrayIdx(sm.eventIndex)`, compiles unfired **event-kind** beats (main → villain → extra), enqueues. |

### 1.2 The act schema + its resolvers (the heart of the content contract)

The schema is documented inline at `battle.html:42739–42755` and read by three
pure resolvers — all exposed to tests via `window.__narrationTest`:

| Resolver | Anchor | Contract |
|---|---|---|
| `_resolveActLines(act)` | `battle.html:42762` | Branch set (first matching `when:{key,eq}`, else the when-less default) **or** static `lines`/`line`. The `when` matcher reads `_storyChoiceValue(key)`. |
| `_resolveActChoices(act)` | `battle.html:42778` | Maps `act.choice.options[]` → `{ label, reply, persistKey, value }`. `value` defaults to `label`. |
| `_sceneProgressDots(i, total)` | `battle.html:42790` | `●◦◦`-style dot row; empty for single-act scenes. |
| `_storyChoiceValue(key)` | `battle.html:42757` | Safe read of `sm.storyChoices[key]`. |

A scene today looks like (real shape, abbreviated from the live Rocket arc):

```js
"villain.rocket.event2": {
  title: "He Just Drives", body: "…legacy flat fallback…",
  acts: [
    { phase: "intro",       lines: ["…", "…"] },
    { phase: "climax", lines: ["The situation, framed for a decision."],
      choice: { persistKey: "villain.rocket.driver", options: [
        { label: "Lean on him.",   value: "leaned", reply: ["…consequence text…"] },
        { label: "Let him drive.", value: "freed",  reply: ["…other consequence…"] } ] } },
  ]
},
"villain.rocket.event3": { /* … */ acts: [
  { phase: "development", branches: [
    { when: { key: "villain.rocket.driver", eq: "leaned" }, lines: ["…the thread you pulled…"] },
    { when: { key: "villain.rocket.driver", eq: "freed"  }, lines: ["…no thread to pull…"] },
    { lines: ["…default…"] } ] } ] },
```

### 1.3 Story-state that exists today

| State | Anchor | Shape / role |
|---|---|---|
| `sm.storyChoices` | init `battle.html:37590`, written `47842` | `{ persistKey → value }`. The **only** cross-scene memory channel. Written by the overlay choice click, read by `_resolveActLines`. |
| `sm.flags` | init `battle.html:37594` | `{}` general flags — **declared but barely used.** Effectively a free, persisted key/value store waiting for an owner. |
| `sm.scenesShown` / `_storyRunSceneMark` | `battle.html:37578`, `47810` | **Per-run** dedupe (resets each run) for `metaKey`. |
| `sm.storyEventsFired` | init `battle.html:37599` | **Persistent** `{ sceneKey → true }` — a beat fires once per save. |
| `sm.tracks` | init `battle.html:37598` | `{ main:'classic_v2', villain, extra }` — the 3-track roll. |

### 1.4 Rival state (the seed for the affinity number)

There is a **whole rival track already**, written through one choke point:

| State | Anchor | Shape |
|---|---|---|
| `sm.rivalLastWinner` | `37583` | `'player' \| 'rival' \| 'none'` |
| `sm.rivalStanding` | `37584` | `'player' \| 'rival' \| 'undecided'` |
| `sm.rivalChampionClaimed` | `37585` | `bool` — rival won the league |
| `sm.rivalConsecutiveWins` / `…Losses` | `37592/37593` | streak counters |
| `sm.rivalEncounterLog` | `37597` | `[{ rowIdx, phase, won, team, badges, date }]`, capped 30 |
| `setRivalStanding(winner, storyRowIdx, rivalTeamNames)` | `37615` | **the single writer** — called from `onBattleEnd` (`48591`) |
| `normalizeRivalStandingState()` | `37603` | load-time clamp |
| `pickRivalSecondaryIntroLine(phase, badges)` | `36334` | a *consumer* that picks intro flavor by phase/badges |

> **There is no scalar affinity.** `grep rivalAffinity battle.html` → 0 hits.
> The brief's "one rival-affinity number" is a **new** field — designed in §3.2
> and §4 as a companion to this existing track, written at the same single
> choke point.

### 1.5 Cinematic / spotlight surfaces (today: bespoke & imperative)

| Surface | Anchor | Tier |
|---|---|---|
| `_showRoamingLegendarySighting(speciesName, onDone)` | `battle.html:47964` | full-screen sighting (type bg + sprite glow + lore frame) |
| `showBattleIntro(trainer, eventType, callback, storyBattleRowIdx)` | `48483` | pre-battle banner, `--sn-z-spotlight` (9999) |
| `showVictoryOverlay(title, coins, gotBadge, cb, …)` | `49023` | post-victory card, `--sn-z-spotlight` |
| `showHallOfFame()` | `55127` | champion screen |

Each is a hand-rolled function with its own DOM + style. There is **no
declarative trigger** and no shared registry — `STORY_NARRATION_SYSTEM.md` §6
already lists folding these as open work. The design tokens they *should* share
live at `battle.html:2185–2195` (`--sn-*`, `--sn-z-*`).

### 1.6 Beat dispatch + the canon-trainer parity layer

`getStoryBeatForRow(rowId, ev)` (`42465`) · `_activeBattleBeatForCurrentRow()`
(`42995`) · `BEAT_CANON_TRAINER` (`43157`) · `_canonTrainerForUpcomingBattle()`
(`50621`) · `_storyEventRowToUpNext(row)` (`50633`). `enterBattleEvent` (`48278`)
runs a **declarative one-shot interrupt chain** (`STORY_BATTLE_INTERRUPTS`) —
the natural mounting point for the cinematic trigger (§3.4).

### 1.7 Save + test harness

- `SAVE_VER = 24` (`battle.html:36816`); key `pbs_story_save` (`36805`); loaded by
  `load()` (`37801`), which validates `version ∈ [2, SAVE_VER]`, `Object.assign`s
  the blob, runs `migrateStoryPreVN()` for each `_loadedVer < N`, then does
  presence back-fills (e.g. `rivalStanding` at `37885`).
- Migration chain present: `…PreV15, 16, 17, 19, 20, 21, 22, 24` (v23 was additive,
  no fn). Latest = `migrateStoryPreV24` (`37351`, strips cut `sm.bossArc`).
- `window.__narrationTest` (`38956`) exposes the resolvers, `sm` (get/set),
  `STORY_SCENES`, the players, and queue introspection. `window.__storyLoad` +
  `window.__STORY_SAVE_VER` drive the migration suite.

---

## 2. Tool-gap analysis — what immersion needs that isn't there yet

The engine renders and remembers; it does not yet let content **react
mechanically** or **stage a moment** declaratively. Four gaps, each → one tool:

| # | Gap (grounded) | Tool (§3) |
|---|---|---|
| **G1** | A scene's content shape is solid but **undocumented as a contract** other streams can target, and has no slot for the new reaction fields. | **Content schema** (§3.1) — formalize + extend `STORY_SCENES`. |
| **G2** | A choice writes a flag and swaps reply text — **nothing else.** No way for a pick to nudge a relationship, set a side-flag, or gate a later *cinematic*. `sm.storyChoices` is the only memory; `sm.flags` is unused; there is no affinity scalar. | **Choice/consequence + story-state** (§3.2) + the **state model** (§4). |
| **G3** | The only cross-scene callback is `branches.when:{key,eq}` against one choice. There is **no first-class "plant now, pay off later"** (Chekhov) primitive — the Main spine's foreshadow→reveal is hand-wired per scene, and PR-7's "anomaly seeds" are ad-hoc tip overlays. | **Setup-beat hook** (§3.3). |
| **G4** | Big moments (sighting, reveal, champion card) are **bespoke imperative functions** off the shared z-scale, with no declarative trigger and no dedupe story content can reach. | **Cinematic trigger** (§3.4). |

Design rule for all four (matches the house "fold onto one renderer" mandate and
the sloppy-mode hazard in `CLAUDE.md`): **additive and backward-compatible.** A
bare `{ title, body }` scene must still render. Every new field is optional; every
new reader tolerates its absence. New `let`/`const` get `{}`/`[]` defaults near
their consumer and are mutated, never reassigned.

---

## 3. The four tools

Each tool below gives: **purpose · the API surface · a REAL, tiny usage example ·
where it hooks into the live code (design-only sketch).**

### 3.1 Content schema — the data contract (Tool: `STORY_SCENES` v2)

**Purpose.** One documented, versioned shape every stream authors against, so a
code agent can add/modify/remove a scene by editing **one data entry** (the
`CLAUDE.md` data-driven mandate). It is today's schema (§1.2) **plus** optional
slots for the other three tools — all backward-compatible.

```js
STORY_SCENES["key"] = {
  // ── existing, unchanged ───────────────────────────────────────────
  title: "Steady chapter nameplate",      // shown across all acts
  body:  "Legacy flat fallback (REQUIRED — keeps old-save render valid)",
  sprite: "old_man" | null,
  acts: [{
    phase: "intro|development|climax|outro",   // documentation only
    lines: ["…"] ,                              // or `line: "…"`
    branches: [{ when: <Cond>, lines: ["…"] }, { lines: ["default last"] }],
    choice: {
      persistKey: "scene.topic",                // ALWAYS set this explicitly (see §6.3)
      options: [{
        label: "Do the thing.", value: "did", reply: ["…immediate consequence text…"],
        // ── NEW (§3.2): declarative consequences, all optional ──
        set:      { "flag.key": true },          // → sm.flags
        affinity: -1,                            // → rival-affinity delta (maintainer-owned size, §9)
        cinematic:"sighting.lugia"               // → fire a spotlight beat after the reply (§3.4)
      }]
    }
  }],
  outro: { win: ["…post-fight aftermath…"] },   // battle scenes

  // ── NEW, all optional ─────────────────────────────────────────────
  setup:    "oak.warning",        // §3.3 — planting this scene marks a setup flag
  requires: <Cond>,               // §3.3 — scene is skipped unless Cond holds
  cinematic:"reveal.the_first",   // §3.4 — this scene opens with / is a cinematic
};
```

`<Cond>` is the **one** condition grammar, a superset of today's `when`
(backward-compatible — `{key,eq}` still means `sm.storyChoices`):

```js
{ key: "scene.topic", eq: "did" }       // sm.storyChoices[key] === eq   (EXISTING)
{ flag: "oak.warning", eq: true }       // sm.flags[flag] === eq         (NEW, §3.3/§4)
{ affinityAtLeast: 2 }                  // rival affinity ≥ n            (NEW, §3.2/§4)
{ affinityAtMost: -2 }                  // rival affinity ≤ n            (NEW)
{ all: [<Cond>, <Cond>] } | { any: [<Cond>, …] }   // composition (NEW)
```

**Usage example — a flavor scene that reads world-state (Stream 3):**
```js
"world.lavender.radio": {
  title: "Static", body: "The radio plays a song you almost know.",
  requires: { flag: "world.firstNightfall", eq: true },
  acts: [
    { phase: "intro", lines: ["The tower hums under the song."] },
    { phase: "outro", branches: [
      { when: { affinityAtMost: -2 }, lines: ["You think of your rival. You don't know why."] },
      { lines: ["You move on."] } ] } ]
}
```

**Where it hooks.** `_resolveActLines` (`42762`) gains the extended `<Cond>`
matcher; `_playStoryBeatScene` (`42904`) consults `scene.requires` before
rendering (skip + still mark fired, so dispatch stays monotone). No call sites
change. Authors keep writing plain `{title, body, acts}`.

### 3.2 Choice / consequence + story-state (Tool: `_storyApplyConsequence`)

**Purpose.** Let a choice do more than swap text: set side-flags, move the
**one rival-affinity number**, and optionally trigger a cinematic — *without*
ever forking which beat fires next (the design invariant at `42748–42750` holds).

**API.** Today the choice click (`battle.html:47842`) does exactly:
```js
sm.storyChoices[key] = pick.value || pick.label;  save();
```
The tool adds one declarative side-effect applier, called at that same site:

```js
// DESIGN SKETCH — additive, runs right after the existing storyChoices write.
function _storyApplyConsequence(pick) {
  if (!pick || !sm) return;
  if (pick.set && typeof pick.set === 'object') {           // → flags (§4)
    if (!sm.flags || typeof sm.flags !== 'object') sm.flags = {};
    for (const k in pick.set) sm.flags[k] = pick.set[k];
  }
  if (typeof pick.affinity === 'number') _storyNudgeRivalAffinity(pick.affinity); // §4
  if (pick.cinematic) _pendingCinematicAfterReply = pick.cinematic;               // §3.4
}
```
`_resolveActChoices` (`42778`) is widened by three lines to carry `set`,
`affinity`, `cinematic` through onto the choice contract (they're already
flowing through `o`). Nothing else moves.

**Usage example — a rival choice that costs/earns affinity (Stream 2):**
```js
"rival.road3.taunt": {
  title: "On the Bridge", body: "Your rival blocks the bridge, grinning.",
  acts: [{ phase: "climax",
    lines: ["“Prove you've still got it,” they say."],
    choice: { persistKey: "rival.bridge.tone", options: [
      { label: "Match the grin.", value: "warm",
        reply: ["They laugh — a real one. Something eases between you."],
        affinity: +1, set: { "rival.sawYouSmile": true } },
      { label: "Walk past, silent.", value: "cold",
        reply: ["They watch you go. The grin fades."],
        affinity: -1 } ] } }]
}
```
A later rival scene reads it back with zero new plumbing:
```js
"rival.league.preface": { /* … */ acts: [{ phase: "intro", branches: [
  { when: { affinityAtLeast: 2 }, lines: ["“Whatever happens here,” they say, “thanks.”"] },
  { when: { flag: "rival.sawYouSmile", eq: true }, lines: ["They almost smile."] },
  { lines: ["They say nothing. They never did."] } ] }] }
```

**Story-state = flags + one number.** "Flags" is the union of the existing
`sm.storyChoices` (choice keys) and `sm.flags` (free side-flags) — see §4 for the
single read/write helpers and why both stay. The "one rival-affinity number" is
the new scalar, §4.

### 3.3 Setup-beat hook (Tool: `setup` / `requires` + `_storyPlantSetup`)

**Purpose.** First-class **Chekhov's gun**: plant a setup in an early beat, pay
it off (or branch on it) later — the Main spine's foreshadow→"it was you all
along" reveal, and Stream 3's anomaly seeds, become data instead of bespoke
wiring. Backed by `sm.flags` (§4) so it costs **no new save field**.

**API.**
```js
// DESIGN SKETCH
function _storyPlantSetup(id)   { _storySetFlag('setup.' + id, true); }   // §4 helper
function _storyHasSetup(id)     { return _storyHasFlag('setup.' + id); }
```
A scene plants by declaring `setup: "<id>"` (auto-planted when the scene fires, in
`_playStoryBeatScene` right where it stamps `storyEventsFired`). A later scene
pays off by `requires: { flag: "setup.<id>", eq: true }` (§3.1) or branches on it.

**Usage example — plant on Road 1, pay off at the reveal (Stream 1):**
```js
// Road 1, fires early, plants quietly:
"main.event1": { title: "Off Again",
  body: "An old man nods: “Off again. Tell me how it ends this time.”",
  setup: "loop.oldManKnows",
  acts: [{ phase: "intro", lines: ["He says it like a joke. He doesn't smile."] }] }

// The reveal beat only lands the callback if the seed was planted:
"main.mfReveal": { title: "The First", body: "…",
  acts: [
    { phase: "climax", lines: ["The face under the cap is yours."] },
    { phase: "outro", branches: [
      { when: { flag: "setup.loop.oldManKnows", eq: true },
        lines: ["“Tell me how it ends this time,” the old man had said. Now you know he knew."] },
      { lines: ["You wonder who else knew."] } ] } ] }
```
Because setups are flags, a payoff can also gate a **cinematic** (`requires` on a
cinematic-bearing scene) or an **affinity** read — the three tools compose.

**Why not a bespoke ledger.** `sm.flags` already exists, persists, and migrates
for free. A dedicated `sm.setups` map would be a redundant second store (the
exact anti-pattern `CLAUDE.md` warns against). Namespacing with the `setup.`
prefix keeps the journal greppable and avoids collisions with choice flags.

### 3.4 Cinematic trigger (Tool: `STORY_CINEMATICS` + `_playCinematic`)

**Purpose.** Fire a **spotlight-tier moment** (full-screen sighting, reveal,
champion card) from data, deduped, on the shared z-scale — instead of four
hand-rolled functions. Initially a thin **router** over the existing bespoke
renderers (§1.5), so this ships as a façade with zero visual change, then those
renderers fold in behind it (the `STORY_NARRATION_SYSTEM.md` §6 roadmap).

**API.**
```js
const STORY_CINEMATICS = {
  "sighting.lugia":     { kind: "sighting", species: "Lugia" },           // → _showRoamingLegendarySighting
  "reveal.the_first":   { kind: "fullscreen", sprite: "trainer_self_aged",
                          lines: ["I am The First.", "You become me."], accent: "var(--sn-gold)" },
  "card.champion":      { kind: "card" },                                  // → showVictoryOverlay path
};

// DESIGN SKETCH — declarative trigger, dedupe via the per-run scene mark.
function _playCinematic(key, onDone) {
  const c = STORY_CINEMATICS[key];
  if (!c) { onDone && onDone(); return; }
  switch (c.kind) {
    case "sighting":   return _showRoamingLegendarySighting(c.species, onDone);   // 47964
    case "fullscreen": return _renderSpotlightOverlay(c, onDone);                 // new, --sn-z-spotlight
    case "card":       /* route into the showVictoryOverlay path */ ;
  }
}
```

**Usage example — choice-gated set-piece (composes §3.2):** the
`cinematic:"reveal.the_first"` on a climax option (or a scene-level
`cinematic:` field) fires the reveal *after* the reply text dismisses, via the
`_pendingCinematicAfterReply` hand-off planted in `_storyApplyConsequence`
(§3.2). Stream 3 fires an ambient one directly:
```js
// Stream 3, on entering a haunted road the first time:
if (!_storyHasFlag("seen.lavenderSighting")) {
  _playCinematic("sighting.lugia", () => { _storySetFlag("seen.lavenderSighting", true); save(); });
}
```

**Where it hooks.** As a new entry kind in the declarative
`STORY_BATTLE_INTERRUPTS` chain inside `enterBattleEvent` (`48278`) for
pre-battle cinematics, and as a direct call for overworld ones. Dedupe reuses
`_storyRunSceneMark` (`47810`) / `sm.scenesShown` for per-run, or a `sm.flags`
seed for once-ever.

---

## 4. The story-state model (single source of truth)

> "story-state = flags + one rival-affinity number." Two stores, one number, four helpers.

### 4.1 Flags — keep both existing stores, give them helpers

There are already two persisted key/value stores; this spec **does not add a
third.** It assigns each a clear role and wraps them in helpers so callers stop
poking `sm.*` directly (the sloppy-mode hazard):

| Store | Role | Written by | Read by |
|---|---|---|---|
| `sm.storyChoices` (`37590`) | **player decisions** — the canonical record of "what did I pick." | overlay choice click (`47842`) | `when:{key,eq}` |
| `sm.flags` (`37594`) | **derived/world side-state & setups** — `setup.*`, `seen.*`, `world.*`, choice side-effects. | `_storySetFlag` / consequence `set` | `when:{flag,eq}`, `requires` |

```js
// DESIGN SKETCH — the only sanctioned flag accessors.
function _storySetFlag(key, val) {
  if (!sm) return;
  if (!sm.flags || typeof sm.flags !== 'object') sm.flags = {};   // mutate, never reassign sm
  sm.flags[key] = (val === undefined ? true : val);
}
function _storyHasFlag(key) {
  try { return !!(sm && sm.flags && sm.flags[key]); } catch (e) { return false; }
}
```

### 4.2 The one rival-affinity number — `sm.rivalAffinity`

A single signed integer, **clamped to a maintainer-owned range** (§9). It is *not*
a replacement for the existing rival track (§1.4) — it's a smooth scalar derived
from it plus dialogue choices, cheap for Stream 2 to read for line selection,
intro tone, and `branches`.

```js
// DESIGN SKETCH — the single writer; lives beside the existing rival choke point.
const RIVAL_AFFINITY_RANGE = 12;          // ← maintainer-owned (§9)
const RIVAL_AFFINITY_ON_WIN  = +1;        // ← maintainer-owned
const RIVAL_AFFINITY_ON_LOSS = -1;        // ← maintainer-owned
function _storyNudgeRivalAffinity(delta) {
  if (!sm || typeof delta !== 'number') return;
  const cur = sm.rivalAffinity | 0;
  sm.rivalAffinity = Math.max(-RIVAL_AFFINITY_RANGE, Math.min(RIVAL_AFFINITY_RANGE, cur + delta));
}
```

**Two write paths, one number:**
1. **Battles** — one line added inside `setRivalStanding` (`37615`), the existing
   single writer, right where it already branches on `w === 'player' | 'rival'`:
   ```js
   if (w === 'player') _storyNudgeRivalAffinity(RIVAL_AFFINITY_ON_WIN);
   else if (w === 'rival') _storyNudgeRivalAffinity(RIVAL_AFFINITY_ON_LOSS);
   ```
2. **Dialogue** — a choice option's `affinity:` delta, via
   `_storyApplyConsequence` (§3.2).

This keeps **one writer per source** and one clamp — no scattered `sm.rivalAffinity += …`.

### 4.3 Test-surface additions

Extend `window.__narrationTest` (`38956`) with: `storySetFlag`, `storyHasFlag`,
`nudgeRivalAffinity`, `applyConsequence`, `playCinematic` (no-op-safe under
jsdom), and a getter for `STORY_CINEMATICS`. The existing `sm` get/set already
lets a test seed `rivalAffinity` / `flags` and assert resolver behavior.

---

## 5. Save-migration sketch (`SAVE_VER 24 → 25` — one migration, never renumber)

Only **one** new field needs persisting (`sm.rivalAffinity`). `sm.flags` already
exists and migrates; `setup.*` lives inside it. So the migration is minimal and
**idempotent**, and it *derives* a sensible starting value from existing rival
history rather than flattening every veteran save to 0.

```js
// 1) bump the constant (battle.html:36816)
const SAVE_VER = 25;                       // was 24

// 2) add ONE migration fn beside migrateStoryPreV24 (battle.html:37351). NEVER renumber 24.
/** v25: introduce the scalar rival-affinity number. Derive an opening value from
 *  the save's existing rival history (net wins−losses across the log, clamped) so
 *  a veteran save doesn't reset to neutral and contradict its own standing. */
function migrateStoryPreV25() {
  if (typeof sm.rivalAffinity === 'number') return;        // idempotent
  let net = 0;
  if (Array.isArray(sm.rivalEncounterLog)) {               // 37597 — the existing log
    for (const e of sm.rivalEncounterLog) net += (e && e.won) ? 1 : -1;
  } else {
    net = (sm.rivalConsecutiveWins | 0) - (sm.rivalConsecutiveLosses | 0);  // fallback
  }
  const R = 12;                                            // == RIVAL_AFFINITY_RANGE (§9, maintainer-owned)
  sm.rivalAffinity = Math.max(-R, Math.min(R, net));
}

// 3) wire it in load() next to the other `_loadedVer < N` calls (battle.html:~37887+)
if (_loadedVer < 25) { try { migrateStoryPreV25(); } catch (e) { console.warn('[Story] v25 affinity migrate', e); } }

// 4) add the default to the `sm = {…}` literal (battle.html:37571+) and a presence
//    back-fill in load() (next to rivalStanding @37885), so a same-version load is safe:
//    sm literal:   rivalAffinity: 0,
//    load() guard: if (!('rivalAffinity' in sm)) sm.rivalAffinity = 0;
```

`normalizeRivalStandingState()` (`37603`) gains one clamp line
(`sm.rivalAffinity = Math.max(-R, Math.min(R, sm.rivalAffinity | 0))`) so a
hand-edited or out-of-range save self-heals, mirroring how it already normalizes
the streak counters.

**Safety invariants honored:** future versions still rejected (`version > 25`);
corrupt JSON still swallowed; `flags` already present so no field is lost; the
migration is a pure back-fill (no destructive deletes). Fixture test in §7.

---

## 6. Flow-ordering / behavior issues flagged

Per the brief, ordering issues are the AI's job to spot. From this audit:

- **6.1 — Choice consequences are inert today (gap, not regression).** A pick
  writes `sm.storyChoices` and swaps reply text; it cannot move a relationship,
  set a side-flag, or gate a moment (§1.3 / G2). This is the central reason the
  consequence channel (§3.2) exists. *Not a bug — a missing capability.*

- **6.2 — Cinematics sit off the declarative path.** `_showRoamingLegendarySighting`
  / `showBattleIntro` / `showVictoryOverlay` are imperative and not reachable from
  scene data, so content can't stage or dedupe a set-piece. The trigger (§3.4) +
  the §6.2 fold close this; until then, Stream 1/3 must call them directly and
  cannot dedupe via the scene ledger.

- **6.3 — Choice `persistKey` fallback is positional & fragile.** When an act
  choice omits `persistKey`, the key falls back to `metaKey + ':choice'`, and act
  `metaKey = baseMeta + '-' + i` (`42808`). **Reordering acts silently re-keys the
  choice**, orphaning every `when:{key,eq}` that referenced it. **Rule for all
  streams:** *always set an explicit `persistKey`* (§3.1). Recommend a dev-only
  assertion in `_resolveActChoices` that warns when `act.choice.persistKey` is
  missing.

- **6.4 — Two dedupe ledgers with opposite lifetimes.** `sm.scenesShown` /
  `_storyRunSceneMark` is **per-run** (resets each run); `sm.storyEventsFired` is
  **persistent** (once per save). A setup planted via `storyEventsFired` persists
  across the run as intended; a cinematic deduped via `scenesShown` will **replay
  on a new run** (usually desired). Authors must pick the right ledger per intent;
  §3.3/§3.4 state which each tool uses. *Document, don't change.*

- **6.5 — DEPENDENCY RISK (out of my lane, must be named).** `STORY_OVERHAUL_PLAN.md`
  §3 records a 🔴 ordering bug: the league road over-drains beats so the Main
  finale / Mystery reveal can fire **before** E1/Champion. My content schema and
  setup→payoff **ride on `_tryFireRoadStoryBeats` / `_resolveActiveRoadBeats`
  dispatch order**; if a payoff scene fires before its setup beat, branches fall
  to the default and the callback is silently lost. **The setup→payoff tool is
  only as correct as the dispatcher's ordering.** This belongs to the
  flow/dispatch effort, not Stream 4 — flagging it as a hard prerequisite for
  Stream 1's foreshadow→reveal to land. Verify dispatch order is monotone before
  authoring long-range setups.

---

## 7. Test plan

All under the jsdom harness (`tests/helpers/load-engine.js`), seeded RNG, driving
`window.__narrationTest` — matching the existing `-v22`/`-v23` suffix convention
and `story-narration-system.test.js` / `save-migration.test.js` patterns.

| Suite (proposed) | Asserts |
|---|---|
| `tests/suites/story-consequence-v25.test.js` | Seed `nt.sm`, resolve a `choice` with `set` + `affinity`; simulate the click path; assert `sm.flags[k]`, `sm.rivalAffinity` moved by the delta, **clamped** at the range edge, and `storyChoices[key]` still written (no regression). |
| `tests/suites/story-cond-grammar-v25.test.js` | `_resolveActLines` over the extended `<Cond>`: `{key,eq}` (back-compat), `{flag,eq}`, `{affinityAtLeast/AtMost}`, `{all}`/`{any}`; when-less default still last-wins. |
| `tests/suites/story-setup-payoff-v25.test.js` | Plant via a `setup:` scene → `sm.flags['setup.x']===true`; a later scene's `requires`/branch reads it; **negative**: no plant → default branch, payoff scene with unmet `requires` is skipped **and** still marked fired (monotone dispatch). |
| `tests/suites/story-cinematic-trigger-v25.test.js` | `STORY_CINEMATICS` lookup; `_playCinematic` routes by `kind` and always calls `onDone` (jsdom-safe, no real DOM cinematic); unknown key is a safe no-op; per-run dedupe via the scene mark. |
| `tests/suites/save-migration-v25.test.js` | Load a v24 fixture (with a win-heavy and a loss-heavy `rivalEncounterLog`); assert `version===25`, `rivalAffinity` derived + clamped, idempotent on re-load, `flags`/`storyChoices` preserved, `version:999` still rejected, corrupt JSON still swallowed. |
| `tests/regression/story-narration-system.test.js` (extend) | Completion invariant unchanged (every scene has `acts` + legacy `body`); add: every `choice.options[]` has an explicit `persistKey` (locks §6.3); every `cinematic:`/`requires`/`when:{flag}` reference resolves to a real key. |

**Fixtures:** add `tests/fixtures/story-save-v24.json` (a realistic mid-/post-game
save) for the v25 migration suite, mirroring the existing v19/v21 fixtures used by
`save-migration.test.js`.

**Determinism:** affinity moves are integer deltas (no RNG); cinematic dedupe and
dispatch are seed-stable. Every new behavior gets a guard test so the next session
can't silently regress it (the `CLAUDE.md` sustainability mandate).

---

## 8. Handshake table — which API each stream consumes  ⚠️ INFERRED

> **The sibling briefs were absent (§0), so the stream roster below is
> reconstructed from the tool requirements, not read from the briefs.** It is a
> *best-fit* decomposition of a 4-stream "Story Immersion" initiative with Stream 4
> as the foundation. **Confirm / correct against the real briefs at sign-off** —
> the API columns are stable regardless of how the content work is sliced; only
> the row labels are a guess.

| Consuming stream (inferred) | Likely charter | Consumes from Stream 4 |
|---|---|---|
| **Stream 1 — Main Spine & Pacing** | the loop canon, the_first reveal, beat ordering | **Setup-beat hook** (foreshadow→reveal) · **Content schema** (`acts`/`outro`, `requires`) · **Cinematic trigger** (`reveal.the_first`) · reads **flags** for spine gating |
| **Stream 2 — Rival & Characters** | rival relationship, recurring NPCs, dialogue tone | **Rival-affinity number** (read for line/tone selection via `pickRivalSecondaryIntroLine`; write via choices) · **Choice/consequence** (`affinity`, `set`) · **Content schema** `branches` on `{affinityAtLeast}`/`{flag}` · **Setup-beat hook** (rival callbacks) |
| **Stream 3 — World & Ambient Storytelling** | cities, roads, environmental flavor, anomaly seeds | **Content schema** (flavor scenes, `requires`) · **flags** (`world.*`, `seen.*` world-state) · **Cinematic trigger** (sightings/landmarks) · **Setup-beat hook** (anomaly seeds → later payoff) |

**Stream 4 provides (the stable contract — this is what survives any re-slicing):**

| API | Symbol / shape | Consumed by |
|---|---|---|
| Content schema v2 | `STORY_SCENES[key]` + the `<Cond>` grammar (§3.1) | 1, 2, 3 |
| Choice consequences | `choice.options[].{set,affinity,cinematic}` + `_storyApplyConsequence` (§3.2) | 2 (3) |
| Flags | `_storySetFlag` / `_storyHasFlag` over `sm.flags`; `sm.storyChoices` read (§4.1) | 1, 2, 3 |
| Rival-affinity number | `sm.rivalAffinity` + `_storyNudgeRivalAffinity` (§4.2) | 2 |
| Setup-beat hook | `setup:` / `requires:` + `_storyPlantSetup`/`_storyHasSetup` (§3.3) | 1, 2, 3 |
| Cinematic trigger | `STORY_CINEMATICS` + `_playCinematic` (§3.4) | 1, 3 |

---

## 9. Open decisions for the maintainer (balance numbers are user-owned)

Per `CLAUDE.md`, I extract & expose; you pick the values. Nothing ships until these
are set + the §3 tool surface is signed off:

1. **`RIVAL_AFFINITY_RANGE`** — the clamp magnitude (sketch uses `12`). Sets how
   many decisions/battles it takes to swing from cold→warm.
2. **`RIVAL_AFFINITY_ON_WIN` / `…_ON_LOSS`** — per-battle deltas (sketch `+1`/`-1`).
   Should a *loss* to the rival sting more than a *win* warms?
3. **Per-choice `affinity` deltas** — the budget a single dialogue pick may move
   (recommend `±1`, reserve `±2` for rare pivotal beats).
4. **v25 derivation formula** — net `wins − losses` over `rivalEncounterLog`,
   clamped (sketch). Acceptable, or start veteran saves at neutral `0`?
5. **Naming** — `sm.rivalAffinity` vs. a neutral `sm.rivalBond` / `sm.rivalRespect`
   (affects journal copy in Collection → Rivalry).
6. **Tool/field names generally** — if the (absent) brief named these differently,
   say so and I'll rename before any code is touched.

---

## Appendix A — verified anchor map (resolved 2026-06-04)

Re-resolve before editing — names stable, lines drift (`anchor`/`find-anchor`).

| Symbol | Anchor | | Symbol | Anchor |
|---|---|---|---|---|
| `_renderNarrativeOverlay` | 47752 | | `STORY_SCENES` | 32157 |
| `_playStoryBeatScene` | 42904 | | `_playSceneActs` | 42800 |
| `_playPostBattleScene` | 42859 | | `_playStoryBeatQueue` | 42954 |
| `_tryFireRoadStoryBeats` | 43061 | | `_resolveActLines` | 42762 |
| `_resolveActChoices` | 42778 | | `_sceneProgressDots` | 42790 |
| `_storyChoiceValue` | 42757 | | choice-click write | 47842 |
| `sm` init literal | 37571 | | `sm.storyChoices` | 37590 |
| `sm.flags` | 37594 | | `sm.scenesShown` | 37578 |
| `sm.storyEventsFired` | 37599 | | `sm.tracks` | 37598 |
| `sm.rivalLastWinner` | 37583 | | `sm.rivalStanding` | 37584 |
| `sm.rivalChampionClaimed` | 37585 | | `sm.rivalConsecutiveWins/Losses` | 37592/37593 |
| `sm.rivalEncounterLog` | 37597 | | `setRivalStanding` | 37615 |
| `normalizeRivalStandingState` | 37603 | | `pickRivalSecondaryIntroLine` | 36334 |
| `_showRoamingLegendarySighting` | 47964 | | `showBattleIntro` | 48483 |
| `showVictoryOverlay` | 49023 | | `showHallOfFame` | 55127 |
| `getStoryBeatForRow` | 42465 | | `_activeBattleBeatForCurrentRow` | 42995 |
| `_roadForArrayIdx` | 42698 | | `BEAT_CANON_TRAINER` | 43157 |
| `enterBattleEvent` | 48278 | | `onBattleEnd` | 48591 |
| `STORY_EVENTS_RAW` | 30942 | | `--sn-*` / `--sn-z-*` tokens | 2185–2195 |
| `SAVE_VER` (=24) | 36816 | | `SAVE_KEY` (`pbs_story_save`) | 36805 |
| `load()` | 37801 | | load() rival back-fill | 37885 |
| `migrateStoryPreV22` | 37340 | | `migrateStoryPreV24` | 37351 |
| `window.__narrationTest` | 38956 | | `window.__storyLoad` / `__STORY_SAVE_VER` | (test hooks) |

## Appendix B — what I did NOT touch / verify

- **No game code changed** (design pass). All code blocks are *sketches*.
- **Sibling briefs unread** (absent) — §8 inferred; reconcile at sign-off.
- **Dispatcher ordering (§6.5)** is reported from `STORY_OVERHAUL_PLAN.md`, not
  re-measured here — it's outside the Stream 4 lane but is a hard prerequisite.
- **Balance magnitudes (§9)** deliberately left as exposed knobs, not chosen.
