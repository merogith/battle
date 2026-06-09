# Storytelling Systems & Tools — Stream 4 design spec

> **Story Immersion initiative · Stream 4 (the foundation).** Streams 1–3 build on the
> APIs specced here. **DESIGN PASS ONLY** — nothing changes game code; every API is a
> *proposal* the maintainer signs off before it ships. Saves are sacred.
>
> **Status:** DRAFT — audit complete, **reconciled** against the real brief, the Narrative
> Craft Playbook, all three sibling specs, and the parallel Camp System spec (see §0).
> Awaiting maintainer sign-off on the tool surface (§3), the **v25 save-migration conflict
> with Camp (§5 — needs a decision)**, and the balance knobs (§9).

---

## 0. Provenance & how this reconciles with the rest of the initiative

The first draft of this spec was written without the brief set (it lives on the
`claude/camp-system-spec` branch, not on `main`, so none of the four streams had it at
author time — Stream 3 notes the same). After a cross-branch sweep, this revision is
**reconciled against the actual sources**:

| Source | Location | What it pinned |
|---|---|---|
| **My brief** — `04-storytelling-systems.md` | `camp-system-spec` branch | the 5 tools, the data pipeline, "align with Camp", grounded-episodic |
| **Narrative Craft Playbook** — `NARRATIVE-CRAFT.md` | `camp-system-spec` branch | events = bottlenecks, **camp = the diamond**; foldback; C&C "no orphan flags"; **barks**; "no dead nodes"; v1 state = flags + one rival-affinity number |
| **Stream 1** — `narrative-coherence.md` | `claude/compassionate-franklin` (+ `main`) | the per-event setup map; the setup/payoff inversion bug; consumes setup-beat hook + content schema |
| **Stream 2** — `dialogue-and-writing.md` | `claude/gifted-galileo` | **four explicit data-layer asks** (§8.2): `speaker` block, externalize pools, `barkPool` schema, keep the choice contract byte-identical |
| **Stream 3** — `visual-and-cinematic.md` | `claude/practical-wright` | the **raid trainer-intro mis-framing** fix; consumes the cinematic trigger + encounter-framing |
| **Camp System** — `camp/*.md` | `camp-system-spec` branch | the diamond; `slot.bonds` per-mon affinity; **claims the same `SAVE_VER 24→25` migration** (§5 conflict) |

**What changed from the first draft:** added the **bark hook** (a 5th tool the craft
playbook + Stream 2 require); reframed the setup-beat hook from a long-range "Chekhov"
plant to a **per-event establishing node** (grounded-episodic is locked — no
overarching-mystery retrofit); sited agency at the **diamond** (existing city hub /
rest-stop now, Camp later); made the cinematic trigger **Promise-based on `evolutionScene`**;
folded in the **`data/dialogue/` pipeline** that already ships; replaced the inferred
handshake with the real one (§8); and surfaced the **v25 migration collision with Camp**
(§5) — the highest-stakes finding.

**The maintainer's actual problem (verbatim, from the brief):** *"the stories feel so out
of nowhere… stronger reasoning — what / why / when / how / who… much of the dialogue
doesn't make sense,"* plus mis-framed encounters (**raids show a trainer intro though raids
are wild Pokémon**). Every tool here exists to make a fix for that *implementable* by the
other streams — not to restructure the timeline.

**Locked decisions I design within (do not relitigate):** reframe + connect (not a premise
overhaul) · **grounded-episodic** (strong *local* motivation per event, no overarching
mystery) · classic storyline only · saves sacred (**one** migration, never renumber
`STORY_EVENTS_RAW`) · behavior changes (barks, timed choices, stat/RNG/flow) need sign-off.

**Anchors** were resolved live 2026-06-04 against `battle.html`; names are stable, line
numbers drift — re-resolve with the `anchor` / `find-anchor` skill. The brief/camp docs cite
slightly older line numbers; where they differ, the current value is used and noted.

---

## 1. The architecture this all hangs on — bottlenecks & the diamond

From the craft playbook (the single most important idea, and the reason saves stay safe):

```
Event N            THE DIAMOND (camp / city hub / rest-stop)        Event N+1
(bottleneck)  ──▶  setup beat · ONE foldback choice · flags    ──▶  (bottleneck)
 fixed             callbacks · barks · cinematic                     fixed
 STORY_EVENTS_RAW   ← all new agency lives HERE, never in timeline → STORY_EVENTS_RAW
```

- **Bottlenecks** = `STORY_EVENTS_RAW` rows. **Immovable** — `sm.eventIndex` indexes into
  them; renumbering = save corruption. Fixed is a *feature*: foldback is built around fixed
  bottlenecks.
- **The diamond** = where choices branch and **fold back** before the next bottleneck.
  The craft playbook's canonical diamond is **Camp** — but **Camp is unimplemented draft
  spec** (`camp/README.md`: *"nothing implemented yet"*). So **today the diamond is the
  existing city hub + between-event rest-stop**, which Stream 1 maps to real symbols:
  `enterCity` · `_showCityArrivalScreen` · `_cityBlurbFor` · the `IntroQueue` · the
  `proceedToNextBattle` wild interrupt. My tools mount on **those** now and migrate to Camp
  when it lands — same data, new host. (This is the key flow-coordination point; §6.3.)

> **The rule every stream designs to:** new motivation, agency, and memory live in **(a) the
> diamond** and **(b) the pre-event setup beat / cold-open** — **never** in a timeline edit.

---

## 2. Current state — the live engine (audited, anchored)

Stream 4 is not green-field; it's targeted extensions to a working engine.

### 2.1 Renderers & scene engines (two of them — know which is which)

| Symbol | Anchor | What it is |
|---|---|---|
| `_renderNarrativeOverlay(opts)` | `battle.html:47752` | **The** canonical one-shot overlay. `opts = { lines, sprite, name, nameplate, banner, bannerClass, accent, toneClass, choices, continueLabel, metaKey, sfx, onDone }`. Gold-nameplate box at `--sn-z-overlay`. Serialized anti-stacking queue (`_narrationLive`/`_narrationMountNext`). |
| `_storyScene(beats, onDone, sceneId)` | `battle.html:45100` | The **multi-beat branching** engine (Daycare/Fight-Club today). `beats[] = {id, html, options:[{label, goto, onPick, danger}]}`; `goto` jumps by id, `onPick` runs a side-effect. The substrate for multi-step cinematics & camp scenes. |
| `evolutionScene(opts)` | `battle.html:29938` | The **Promise-based, skippable, SFX-orchestrated** cinematic (silhouette→ray→morph, `onCommit` swaps data mid-flash). The **gold-standard** the cinematic trigger copies (also exposed as `StoryFx.evolutionScene`). |
| `STORY_SCENES` | `battle.html:32157` | The content registry. `{ title, body, sprite?, acts?, outro? }`; ~200 entries, 0 flat. |
| `IntroQueue` / `INTRO_PRIORITY` | `battle.html:43519` / `43513` | Priority-ordered serialized intro dispatcher. Items `{priority, run(done)}`; `enqueue`→deferred `flush`. Priorities: facility_first_time 100 · market_giveaway 60 · npc_tip 30 · one_time_lesson 10. **The mount point for setup beats** (§3.1). |

### 2.2 The act schema + resolvers (the content contract heart)

Documented inline at `battle.html:42739–42755`; three pure resolvers, all exposed to tests:

| Resolver | Anchor | Contract |
|---|---|---|
| `_resolveActLines(act)` | `battle.html:42762` | branch set (first matching `when:{key,eq}`, else when-less default) **or** static `lines`/`line`. `when` reads `_storyChoiceValue(key)`. |
| `_resolveActChoices(act)` | `battle.html:42778` | maps `act.choice.options[]` → `{ label, reply, persistKey, value }`. |
| `_sceneProgressDots(i,total)` | `battle.html:42790` | `●◦◦` dot row. |
| `_storyChoiceValue(key)` | `battle.html:42757` | safe read of `sm.storyChoices[key]`. |

Players: `_playStoryBeatScene(sceneKey,onDone)` (`42904`) → `_playSceneActs(scene,baseMeta,onDone)`
(`42800`); `_playPostBattleScene` (`42859`); `_playStoryBeatQueue` (`42954`);
`_tryFireRoadStoryBeats(ev)` (`43061`).

### 2.3 Story-state that exists today

| State | Anchor | Role |
|---|---|---|
| `sm.storyChoices` | init `37590`, written `47842` | `{persistKey→value}` — the canonical "what I picked." Written by the overlay choice click, read by `_resolveActLines`. |
| `sm.flags` | init `37594` | `{}` — declared, **barely used.** A free persisted store for setups / side-state. |
| `sm.scenesShown` / `_storyRunSceneMark` | `37578` / `47810` | **per-run** dedupe (resets each run). |
| `sm.storyEventsFired` | init `37599` | **persistent** `{sceneKey→true}` (once per save). |
| rival track: `rivalLastWinner`/`rivalStanding`/`rivalChampionClaimed`/`rivalConsecutiveWins`/`Losses`/`rivalEncounterLog` | `37583–37597` | written by **one** choke point `setRivalStanding(winner, storyRowIdx, rivalTeamNames)` (`37615`); normalized at `37603`. **No scalar affinity** (`grep rivalFriendship` → 0). |
| `slot.bonds` (per-Pokémon affinity) | **NOT IN CODE** | Camp `BONDING_RELATIONSHIPS.md` defines it (6 paths→6 stats); **only Destiny/Parental Bond exist today** — `slot.bonds` is Camp-owned future state, referenced not defined here (§4). |

### 2.4 Cinematic / encounter-framing surfaces (today: bespoke)

`_showRoamingLegendarySighting(speciesName,onDone)` (`47964`) · `_showFirstSightingLoreOverlay`
(`47952`) · `showBattleIntro(trainer,eventType,callback,storyBattleRowIdx)` (`48483`, the
VS-splash) · `showVictoryOverlay` (`49023`) · raid config/roll `_populateExtraRaidConfigs`
(`43224`) / `_rollExtraRaidBossTeam` (`43265`). Design tokens `--sn-*`/`--sn-z-*` at
`2185–2195`. **Today only two framings exist — trainer VS-splash and legendary cinematic — so
a wild raid wrongly gets `showBattleIntro` (the trainer splash): Stream 3's headline bug.**

---

## 3. The five tools

Each: **purpose · API · a REAL tiny usage example · where it mounts (design-only).**
Design rule for all five: **additive, backward-compatible, choice-contract byte-identical**
(Stream 2 §8.2 #4). A bare `{title, body}` scene still renders. New `let`/`const` get
`{}`/`[]` defaults near their consumer and mutate via `Object.assign`/`push` — never bare
reassign (the sloppy-mode hazard; `battle.html` has no `'use strict'`).

### 3.1 Setup-beat hook — the establishing node (Tool: `SETUP_BEATS` + `_resolveSetupBeat`)

**Purpose.** Kill "out of nowhere": attach a short **who / why / now / stakes** beat to any
event **keyed by event id/row, without touching `STORY_EVENTS_RAW` ordering**. It plays in
the **diamond upstream** (or the battle cold-open for city/major beats), so the setup sits
*before* the bottleneck instead of piling into it. This is the engine under Stream 1's
connective tissue. It is **not** a long-range plant (grounded-episodic is locked).

**API (data-driven).**
```js
// data/story/setup-beats.json  → loaded via early-let + Object.assign (§3.4 loader)
SETUP_BEATS["road3.broker"] = {
  anchorRow: 24,                 // STORY_EVENTS_RAW row this sets up (the bottleneck)
  mount: "diamond",             // "diamond" (default) | "coldOpen" (city/major beats)
  sceneKey: "main.event2.setup", // a STORY_SCENES entry (acts schema, §3.4)
  requires: { flag: "metBroker", eq: false },  // optional gate (<Cond>, §4)
  once: true,                    // dedupe via sm.storyEventsFired[sceneKey]
};

// DESIGN SKETCH — resolver the diamond consults; returns beats to enqueue, in order.
function _resolveSetupBeats(roadId, mountPoint) {
  return Object.values(SETUP_BEATS)
    .filter(b => b.mount === mountPoint
             && _roadForArrayIdx(b.anchorRow) === roadId
             && !(b.once && sm.storyEventsFired[b.sceneKey])
             && _condHolds(b.requires))            // §4
    .sort((a, b) => a.anchorRow - b.anchorRow);
}
```

**Usage example — Stream 1 plants the broker's "why now" in the diamond (no timeline edit):**
```js
"main.event2.setup": {              // a normal STORY_SCENES entry
  title: "Road 3 — the rest stop", sprite: "broker",
  body: "A man in a good coat is asking the wrong questions about your badges.",
  acts: [{ phase: "intro", lines: [
    "“Eight badges buys a lot,” he says, not looking up. “Some people skip the line.”",
    "He means you. He wants you to ask how." ] }]
}
```

**Where it mounts.** At the diamond: `IntroQueue.enqueue({ priority: PLOT_SETUP, run })`
inside the city-arrival / rest-stop flow (a new `PLOT_SETUP` priority slotting just under
`facility_first_time`); or, for `mount:"coldOpen"`, the existing `enterBattleEvent` (`48278`)
pre-battle interrupt chain. **Mounts on today's diamond now; re-points to Camp's
`Break camp` end-step when Camp ships — data unchanged** (§6.3). Honors the craft rule:
setup lives in the diamond, payoff in the bottleneck.

### 3.2 Choice / consequence + story-state (Tool: `_storyApplyConsequence`)

**Purpose.** Make choices **mean** something and **be remembered** — the C&C layer — while
staying **foldback** (a choice never forks which beat fires next; it folds back by the next
bottleneck) and grounded-episodic (small local callbacks, not a branching tree).

**Choice taxonomy (craft playbook §3) the tool supports:** *Flavor* (changes reply only) ·
*Consequence/C&C* (sets a **flag** → paid off by a later **callback**) · *Illusion* (converge;
1–2 dramatic spots only) · ***Blind* — banned.** **The C&C contract: every consequence choice
MUST set a flag AND have ≥1 later callback. No orphan flags** (lockable as a test, §7).

**API.** Today the choice click (`battle.html:47842`) does only
`sm.storyChoices[key] = pick.value || pick.label; save();`. The tool adds one declarative
side-effect applier at that same site — leaving the existing contract byte-identical:
```js
// DESIGN SKETCH — runs right after the existing storyChoices write.
function _storyApplyConsequence(pick) {
  if (!pick || !sm) return;
  if (pick.set && typeof pick.set === 'object')                       // → sm.flags (§4)
    for (const k in pick.set) _storySetFlag(k, pick.set[k]);
  if (typeof pick.friendship === 'number') _storyNudgeRivalFriendship(pick.friendship); // §4
  if (pick.cinematic) _pendingCinematicAfterReply = pick.cinematic;   // → §3.3
}
```
`_resolveActChoices` (`42778`) widens by three lines to carry `set`/`friendship`/`cinematic`
(already flowing through `o`); `persistKey`/`value`/`reply`/`branches.when` **do not change**.

**Usage example — Stream 2's "spare vs humiliate the rival" (one flag, one friendship nudge, a callback):**
```js
"rival.road5.standing": { title: "After the Bridge", sprite: "rival",
  acts: [{ phase: "climax", lines: ["They're down. They won't look up."],
    choice: { persistKey: "rival.road5", options: [
      { label: "Offer a hand.",   value: "spared",
        reply: ["They take it. Neither of you says anything."],
        friendship: +1, set: { rivalSpared: true } },
      { label: "Walk off.",       value: "humiliated",
        reply: ["You leave them in the dirt. The road gets quieter after that."],
        friendship: -1, set: { rivalHumiliated: true } } ] } }] }
```
The mandatory callback (no orphan flag), a later diamond beat:
```js
"rival.league.preface": { /* … */ acts: [{ phase: "intro", branches: [
  { when: { flag: "rivalHumiliated", eq: true }, lines: ["“After you walked off on me,” they say, “I trained like the road was ending.”"] },
  { when: { friendshipAtLeast: 1 },                 lines: ["“Whatever happens in there,” they say, “thanks for the hand back there.”"] },
  { lines: ["They nod once. All business."] } ] }] }
```

### 3.3 Cinematic trigger (Tool: `STORY_CINEMATICS` + `_playCinematic` → Promise)

**Purpose.** Fire a **spotlight-tier moment** (sighting, pre-boss, raid intro) from data —
**Promise-based, skippable, reduced-motion-aware**, on the shared substrate — so Stream 3 and
Camp's `EVENT_CINEMATICS.md` add beats without N more bespoke overlays. **This tool is the
*trigger/registry*; `EVENT_CINEMATICS.md` owns the per-event *catalogue* — no duplication.**

**✅ CONVERGED with Stream 3 (D3 — locked 2026-06-04).** Stream 3 independently specced the
concrete cinematic *bodies*; both designs were still unbuilt (0 hits each), so we keep the best
of each: **Stream 3's functions are the bodies, `_playCinematic` is the thin Promise facade over
them, and there is ONE registry.** Specifically — Stream 3's `_showWildEncounterCinematic` (its
generalization of `_showRoamingLegendarySighting`, S3 §4.3) backs both `sighting` and `raid`;
its `_playPreBossCinematic` + `PRE_BOSS_CINEMATICS` table back `preboss` (that table folds into
`STORY_CINEMATICS` as the `kind:"preboss"` rows). Raid framing keys off Stream 3's
`_raidBossSpeciesForBeatKey`, so the intro and the rolled foe team read the **same** source and
can never disagree about who walks onto the field (label == reality).

**API (Promise facade over the callback bodies — wrap, don't reinvent).**
```js
const STORY_CINEMATICS = {
  "sighting.lugia":   { kind: "sighting", species: "Lugia" },
  "raid.cubone":      { kind: "raid", beatKey: "extra.cubone.raid" },        // species via _raidBossSpeciesForBeatKey (§6.4)
  "preboss.giovanni": { kind: "preboss", sceneKey: "villain.rocket.boss" },  // defaults from PRE_BOSS_CINEMATICS + BEAT_CANON_TRAINER
};

// _playCinematic = the awaitable facade; the bodies are Stream 3's callback fns,
// each wrapped once via `new Promise(res => fn(..., res))`. No new overlay engine.
async function _playCinematic(key) {
  const c = STORY_CINEMATICS[key]; if (!c) return;
  if (_prefersReducedMotion()) return _playCinematicReduced(c);   // cross-fade fallback
  switch (c.kind) {
    case "sighting": return new Promise(res => _showWildEncounterCinematic(_sightingOpts(c), res));
    case "raid":     return new Promise(res => _showWildEncounterCinematic(_raidOpts(c), res));  // wild, NOT showBattleIntro
    case "preboss":  return new Promise(res => _playPreBossCinematic(c.sceneKey, _bossTrainer(c), res));
  }
}
```

**Usage example — Stream 3 fixes the raid mis-framing (encounter-framing, the headline bug):**
```js
// enterBattleEvent interrupt: a raid is a WILD Pokémon, not a trainer.
if (beat.kind === "raid" || beat.kind === "miniRaid")
  await _playCinematic("raid." + sm.tracks.extra);   // wild emerge + cry — never the VS-splash
else if (beat.kind === "boss" || beat.kind === "miniBoss")
  await _playCinematic("preboss." + (BEAT_CANON_TRAINER[beat.sceneKey] || "generic"));
```

**Where it mounts.** A `kind` in the `enterBattleEvent` (`48278`) interrupt chain for
pre-battle; a direct `await` for overworld. **Constraints (EVENT_CINEMATICS §5–6):**
`--sn-z-*` tokens (never literals) · skippable (tap/B) · `prefers-reduced-motion` fallback ·
seeded flourish via `storyRngNext` · ≤~1.5s default · off the battle hot path. **Behavior
change (timed/animation) → sign-off.**

### 3.4 Content schema & data pipeline (Tool: `STORY_SCENES` v2 + `data/dialogue/`)

**Purpose.** One documented, versioned content shape every stream authors against — extended
with the optional slots the other tools need and wired to the **`data/dialogue/` pipeline that
already ships**, so copy review is a JSON diff (Stream 2 §8.2 #2), not a monolith diff.

**Schema (today's, unchanged) + the additive slots:**
```js
STORY_SCENES["key"] = {
  title, body /* REQUIRED legacy fallback */, sprite,
  acts: [{ phase, lines /* or line */,
           branches: [{ when:<Cond>, lines }, { lines:/*default last*/ }],
           choice: { persistKey,                       // ALWAYS explicit (§6.5)
                     options: [{ label, value, reply,
                                 set?, friendship?, cinematic? /* §3.2 */ }] } }],
  outro: { win: [...] },
  // ── NEW, all optional ──
  setup:    "road3.broker",      // §3.1 — registers/links a setup beat
  cinematic:"preboss.giovanni",  // §3.3 — opens with a cinematic
  speaker:  { id:"the_first", sprite:"Red", nameplate:"The figure in the doorway", voice:"dread" }, // Stream 2 §8.2 #1
};
```
`<Cond>` — the one grammar (superset of today's `when`, back-compatible):
```js
{ key:"rival.road5", eq:"spared" }   // sm.storyChoices  (EXISTING)
{ flag:"rivalHumiliated", eq:true }  // sm.flags         (NEW)
{ friendshipAtLeast:1 } | { friendshipAtMost:-2 }            // sm.rivalFriendship (NEW)
{ all:[...] } | { any:[...] }                            // composition (NEW)
```

**The data pipeline (Stream 2 §8.2 #2 — extend, don't reinvent).** `data/dialogue/` already
exists (`champion-victory-lines.json`, `city-guide-quotes.json`, `leader-victory-lines.json`,
`trainer-quotes*.json`, …) with extractor `scripts/build/extract-dialogue-pools.mjs`. New
event-beat / dialogue / cinematic JSON joins it, loaded via the canonical **early-`let` +
`Object.assign`** pattern:
```js
// DESIGN SKETCH — the sloppy-mode-safe loader (mirrors loadGameData)
let SETUP_BEATS = {}, STORY_CINEMATICS = {}, BARK_POOLS = {};   // declared near consumers
window.SETUP_BEATS = SETUP_BEATS; /* …mirror for cross-script reads… */
async function loadStoryContent() {
  const beats = await (await fetch('data/story/setup-beats.json')).json();
  Object.assign(SETUP_BEATS, beats);          // MUTATE — never `SETUP_BEATS = beats`
  // …same for cinematics, barks; dialogue pools via the existing extractor path…
}
```
Stream-2 asks #2 (externalize `cold-opens.json`/`tutorial-scenes.json`/`intro-scenes.json`/
`city-arrival.json`/`mystery-figure.json`/`rival-pools.json`) follow this exact pattern.

### 3.5 Bark hook (Tool: `BARK_POOLS` + `_storyBark`) — the 5th tool

**Purpose.** The craft "no dead nodes" + variance layer: short, triggered, **additive**
one-liners (battle crit/KO, last-Pokémon-faint, flee; camp proximity) — the cheapest possible
voice. **Stream 2 writes the lines; Stream 4 hooks the trigger** (craft §9). **This is a
behavior addition → maintainer sign-off** before it ships.

**API + hard rules (Stream 2 §8 — encoded as load-time validation).**
```js
// data/dialogue/barks.json — Stream 4 owns the container + load path
BARK_POOLS = {
  "playerLastFaint": ["The crowd goes quiet.", "The road stops here unless you've got a comeback."],
  "foeLastFaint":    ["The fight's yours.", "Their corner goes still."],
  "fledRoad":        ["The road will remember the shortcut."],
};
// DESIGN SKETCH — additive-only, seeded, never substitutes a state line.
function _storyBark(poolKey) {
  const pool = BARK_POOLS[poolKey]; if (!pool || !pool.length) return null;
  return pool[(storyRngNext() * pool.length) | 0];   // seeded; caller APPENDS after the canonical line
}
```
**The non-negotiable rule (validated at load, fails `tests/smoke-dialogue-load.mjs`):** a
`barkPool` key may attach **only to a non-state event**, and its line is **appended, never
substituted.** *"It's super effective!"*, *"…fainted!"* (as a state event), *"But it failed!"*,
move/status/effectiveness lines are **out of the bark layer** — engine voice, singular.

**Usage example — Stream 2's run-defining beat (today silent):**
```js
// where the player's LAST Pokémon faints, AFTER the canonical "{name} fainted!" line:
const bark = _storyBark("playerLastFaint");
if (bark) logLine(bark);          // additive second line, never replacing the faint event
```

---

## 4. The story-state model (memory) — small, by design

> Craft v1 scope is **LOCKED: flags + ONE rival-affinity number** — not a multi-NPC web.

| Layer | Store | Owner | Notes |
|---|---|---|---|
| **Decisions** | `sm.storyChoices` (`37590`) | Stream 4 | "what I picked." Existing; contract frozen. |
| **Side-state / setups** | `sm.flags` (`37594`) | Stream 4 | `setup.*`, `seen.*`, `rivalHumiliated`, world bits. Helpers below. |
| **Per-Pokémon affinity** | `slot.bonds` | **Camp** (`BONDING_RELATIONSHIPS.md`) | 6 paths→6 stats; **not in code yet**. Stream 4 **references**, does not define. |
| **Rival friendship** | `sm.rivalFriendship` (**NEW**) | Stream 4 | the one number. Signed int, clamped (range = maintainer-owned, §9). |

```js
// DESIGN SKETCH — the sanctioned accessors (stop poking sm.* directly).
function _storySetFlag(k, v) { if (!sm) return; if (!sm.flags || typeof sm.flags!=='object') sm.flags={}; sm.flags[k] = (v===undefined?true:v); }
function _storyHasFlag(k)    { try { return !!(sm && sm.flags && sm.flags[k]); } catch(e){ return false; } }
// gating helpers: hard gate = exact flag/item; soft gate = threshold (friendshipAtLeast).
function _condHolds(cond)    { /* evaluates the <Cond> grammar over storyChoices/flags/rivalFriendship */ }

const RIVAL_FRIENDSHIP_RANGE = 12;        // ← maintainer-owned (§9)
function _storyNudgeRivalFriendship(d) {
  if (!sm || typeof d!=='number') return;
  sm.rivalFriendship = Math.max(-RIVAL_FRIENDSHIP_RANGE, Math.min(RIVAL_FRIENDSHIP_RANGE, (sm.rivalFriendship|0) + d));
}
```
**Two writers, one number:** (1) battles — `+1` on a player win, `-2` on a loss (a loss stings
more), one line inside `setRivalStanding` (`37615`, the existing single choke point) on
`w==='player'|'rival'`; (2) dialogue — a choice's `friendship:`
via `_storyApplyConsequence`. One clamp, no scattered `+=`. **Naming ✅ DECIDED (§9):
`rivalFriendship`** — the canon Pokémon *Friendship* stat; its Return ↔ Frustration move duality
maps the camaraderie ↔ rivalry swing exactly (the negative end is the "Frustration" side).

---

## 5. Save-migration — ✅ **RESOLVED: one unified v25 (Option A)**

**The collision.** Two parallel initiatives both target **`SAVE_VER 24 → 25` /
`migrateStoryPreV25`**:

- **Camp** (`camp/README.md` §4 + `BONDING_RELATIONSHIPS.md` §7): *"one `SAVE_VER` bump for
  the whole [camp] feature… do not ship pillars on separate version bumps."* Its v25 adds
  `slot.bonds` defaults (team + box, skip eggs) + camp-flow fields (`sm.campByEventIdx`,
  `sm.campReturnPoint`).
- **Story Immersion / me:** my only new persistent field is `sm.rivalFriendship`, which also
  wants v25.

**Two independent v25s = save corruption.** **✅ DECISION (2026-06-04): Option A** — one unified
`migrateStoryPreV25`; **Stream 4 owns the story-state store**, Camp contributes its field block,
and Phase-E's dedup change folds in (or takes **v26** if it lands later). *(Maintainer: saves
aren't a fuss-point → take the no-regret default.)* The options, for the record:

| Option | Shape | When it fits |
|---|---|---|
| **A — Unify ✅ LOCKED** | **ONE `migrateStoryPreV25`** adds `slot.bonds` + camp-flow **and** `sm.rivalFriendship`. Stream 4 "owns the store + API" (craft §9), so Stream 4 owns the unified story-state migration; Camp contributes its field block. | If Immersion + Camp land together (they share the diamond + the affinity model anyway). |
| **B — Sequence** | First to ship = v25; the other = **v26**. Mirror `migrateStoryPreV21`'s idempotent shape; never renumber. | If they ship on different timelines. |

Either way **never two unilateral v25s.** My field's migration body (whichever version):
```js
// idempotent; derives a sensible opening value from existing rival history (not a flat 0).
function _migrateRivalFriendship() {            // folded into the unified v25 (A) or its own vN (B)
  if (typeof sm.rivalFriendship === 'number') return;
  let net = Array.isArray(sm.rivalEncounterLog)
    ? sm.rivalEncounterLog.reduce((a,e)=>a+(e&&e.won?1:-1),0)
    : (sm.rivalConsecutiveWins|0) - (sm.rivalConsecutiveLosses|0);
  const R = 12; sm.rivalFriendship = Math.max(-R, Math.min(R, net));   // R == RIVAL_FRIENDSHIP_RANGE
}
```
Plus the `sm = {…}` default (`rivalFriendship: 0`, near `37571`), a load() presence back-fill
(beside `rivalStanding` @`37885`), and a clamp in `normalizeRivalStandingState` (`37603`).
**Safety invariants intact:** `version > current` rejected; corrupt JSON swallowed; pure
back-fill (no destructive delete); `STORY_EVENTS_RAW` never renumbered.

---

## 6. Flow-ordering / behavior issues flagged

- **6.1 — [CONFLICT] v25 migration collision with Camp.** §5. Highest stakes — surface before
  either initiative ships.
- **6.2 — Setup/payoff inversion (Stream 1's structural root bug).** `_tryFireRoadStoryBeats`
  (`43061`) dumps a road's scenes (the *setups*) at the **same** first-battle row as the fight
  (the *payoff*) — the diamond plays a generic brochure, the bottleneck is overloaded. The
  setup-beat hook (§3.1) is the **fix-enabler**, but it only lands if setups mount in the
  diamond *upstream* of their `anchorRow`. **The hook is only as correct as dispatch order.**
- **6.3 — [DEPENDENCY] The diamond's host isn't built yet.** Craft says agency lives at Camp;
  **Camp is unimplemented** (`camp/README.md`). Resolution: mount on the **existing** diamond
  (`enterCity`/`IntroQueue`/cold-open) now; re-point to Camp's `Break camp` end-step when it
  ships. The setup-beat data (`SETUP_BEATS`) is host-agnostic, so the migration is a mount
  change, not a content change. Coordinate the `eventIndex`-keyed mount with Camp `CAMP_FLOW`.
- **6.4 — Raid encounter mis-framing (Stream 3's headline).** A wild **raid/miniRaid** gets the
  **trainer** VS-splash (`showBattleIntro`) because only two framings exist. The cinematic
  trigger's `framing:"wild"` path (§3.3) + a `beat.kind → framing` map fixes it. Behavior/visual
  change → sign-off.
- **6.5 — Choice `persistKey` fallback is positional.** Omitting `persistKey` keys on
  `metaKey = baseMeta+'-'+i` (`42808`); **reordering acts silently re-keys the choice**,
  orphaning its callbacks. **Rule: always set an explicit `persistKey`** (lockable test, §7).
- **6.6 — C&C contract / no dead nodes / barks.** Encode "every consequence choice sets a flag
  AND has a callback — no orphan flags" and "every node advances / chooses / barks" as **tests**,
  not prose. **Barks + timed choices are behavior changes → sign-off.**
- **6.7 — Dedupe ledgers + a pending Phase-E migration.** `scenesShown` (per-run) vs
  `storyEventsFired` (persistent) — authors must pick per intent (§3 states which each tool
  uses). Note Stream 1's **H4-3 slot-dispatcher** change "touches the dedup store and needs the
  `STORY_OVERHAUL_PLAN.md` Phase E migration" — coordinate so it doesn't become a *second*
  story-state migration racing v25.

---

## 7. Test plan

Under the jsdom harness (`tests/helpers/load-engine.js`), seeded RNG, driving
`window.__narrationTest` — matching the `-v2x` suffix convention and the existing
`story-narration-system.test.js` / `save-migration.test.js` patterns.

| Suite (proposed) | Asserts |
|---|---|
| `story-setup-beats.test.js` | `_resolveSetupBeats(road, "diamond")` returns the road's unfired beats in `anchorRow` order; a `requires` gate filters; `once` dedupes via `storyEventsFired`; a mounted beat plays **before** its `anchorRow` bottleneck. |
| `story-consequence.test.js` | resolve a `choice` with `set`+`friendship`; simulate the click; assert `sm.flags[k]`, `sm.rivalFriendship` moved by the delta & **clamped**, `storyChoices[key]` still written (contract intact). |
| `story-cond-grammar.test.js` | `_resolveActLines`/`_condHolds` over `<Cond>`: `{key,eq}` back-compat, `{flag,eq}`, `{friendshipAtLeast/AtMost}`, `{all}`/`{any}`; when-less default last-wins. |
| `story-cinematic-trigger.test.js` | `_playCinematic` returns a Promise that resolves on dismiss **and** on skip; routes by `kind`; **raid→wild framing, never `showBattleIntro`**; reduced-motion takes the fallback branch; unknown key is a safe no-op; seeded flourish reproduces. |
| `smoke-dialogue-load.mjs` (extend) | `barkPool` validation: a bark key on a **state** event **fails**; bark lines are additive; pools load via `Object.assign` (no stray window globals). |
| `story-cc-contract.test.js` | **lint:** every consequence `choice` (one that sets a flag) has ≥1 later `branches.when`/`requires` reader — **no orphan flags**; every `choice.options[]` has an explicit `persistKey`. |
| `save-migration-v25.test.js` | load a v24 fixture (win-heavy & loss-heavy `rivalEncounterLog`); assert `rivalFriendship` derived + clamped, idempotent, `flags`/`storyChoices` preserved; **co-loads Camp's `slot.bonds` block** in the unified-v25 case (Option A); `version>current` rejected; corrupt JSON swallowed. |
| `story-narration-system.test.js` (extend) | completion invariant unchanged; add: `speaker` block tolerated where present; every `cinematic`/`setup`/`when:{flag}` reference resolves. |

Fixtures: `tests/fixtures/story-save-v24.json`. Determinism: friendship = integer deltas;
cinematic dedupe & barks seeded. Every new behavior gets a guard test (the `CLAUDE.md`
sustainability mandate).

---

## 8. Handshake — which API each stream consumes (RECONCILED)

### 8.1 Per-stream

| Stream | Charter | Consumes from Stream 4 |
|---|---|---|
| **1 — Narrative Coherence & Causality** | why each event happens; per-event setup map; encounter-framing matrix | **Setup-beat hook** (§3.1, its connective tissue) · **content schema** (`acts`/`branches`/`requires`) · reads **flags**. *(Stream 1 inferred Stream 4 as "Reactivity & Player Agency" — same APIs, different label.)* |
| **2 — Dialogue & Writing** | clear voiced copy; barks; voice guide; before/after | **Choice/consequence + story-state** (`set`/`friendship`, branch on `flag`/`friendship`) · **Bark hook** · **content schema** + the **four data-layer asks** below |
| **3 — Visual & Cinematic** | scenes, animation, pre-boss cinematics; **fix the raid intro** | **Cinematic trigger** (Promise, skippable) · **encounter-framing** (`beat.kind → framing`, the raid fix) |
| **Camp System** *(parallel initiative)* | the diamond; bonding; event cinematics | shares the **diamond mount** (§6.3), the **`slot.bonds`** affinity model (§4), `EVENT_CINEMATICS` builds on the **cinematic trigger**, and the **unified v25 migration** (§5) |

### 8.2 Stream 2's explicit data-layer asks (answered)

1. **`speaker` block** on the scene/overlay schema — **adopted** (§3.4); makes the
   "Oak-monotony" voice fix a data edit.
2. **Externalize in-code pools** to `data/dialogue/` via the existing
   `extract-dialogue-pools.mjs` — **adopted** as the §3.4 pipeline (it already ships).
3. **`barkPool` schema** with the non-state/additive rule as load-time validation —
   **adopted** as Tool 5 (§3.5) + the smoke test (§7).
4. **Choice contract byte-identical** (`persistKey`/`value`/`reply`/`branches.when`) —
   **guaranteed**; all §3.2 additions are new optional keys only.

### 8.3 Stream 4 provides (the stable contract)

| API | Symbol / shape | Consumed by |
|---|---|---|
| Setup-beat hook | `SETUP_BEATS` + `_resolveSetupBeats` (§3.1) | 1 |
| Choice consequences | `choice.options[].{set,friendship,cinematic}` + `_storyApplyConsequence` (§3.2) | 2 |
| Flags + helpers | `_storySetFlag`/`_storyHasFlag`/`_condHolds` over `sm.flags`; `sm.storyChoices` (§4) | 1, 2 |
| Rival-friendship number | `sm.rivalFriendship` + `_storyNudgeRivalFriendship` (§4) | 2 |
| Cinematic trigger | `STORY_CINEMATICS` + `_playCinematic`→Promise (§3.3) | 3, Camp |
| Bark hook | `BARK_POOLS` + `_storyBark` (§3.5) | 2 |
| Content schema + pipeline | `STORY_SCENES` v2 + `<Cond>` + `data/dialogue/`+`data/story/` (§3.4) | 1, 2, 3 |

---

## 9. Open decisions for the maintainer (balance & coordination are user-owned)

> **✅ Locked 2026-06-04 (this pass):** cinematic API = **Promise facade over Stream 3's bodies**
> (D3, §3.3) · dispatcher/sequencing = **Overhaul Phase E owns; flow bugs G3/G4 ship ahead** (D2)
> · v25 = **Option A, one unified migration** (D1, §5) · rival scalar = **`rivalFriendship`** (D4, §4).
> The items below are the genuinely user-owned balance / sign-off knobs that remain.

1. ~~**§5 — the v25 decision.**~~ ✅ **RESOLVED: Option A** (one unified `migrateStoryPreV25`,
   Stream 4 owns the store; Camp contributes its field block).
2. ~~**`RIVAL_FRIENDSHIP_RANGE` + per-battle deltas.**~~ ✅ **RESOLVED: Standard profile** —
   range `±12`; a win `+1`, a loss `-2` (a loss stings more than a win warms).
3. ~~**Per-choice `friendship` budget.**~~ ✅ **RESOLVED: `±1`**, with `±2` reserved for pivotal beats.
4. ~~**v25 derivation.**~~ ✅ **RESOLVED: derive from history** — net wins−losses over
   `rivalEncounterLog`, clamped (the §5 sketch). *(Saves not a priority → keep the better default.)*
5. ~~**Naming.**~~ ✅ **RESOLVED: `rivalFriendship`** — the canon *Friendship* stat (poles read
   as Return ↔ Frustration); lexically distinct from Camp's team `slot.bonds`.
6. **Behavior sign-offs** — ✅ **approved to develop:** barks (§3.5), raid + pre-boss cinematics
   (§3.3/§6.4), and the impact layer (hit-stop / screen-shake / portrait-emotion). ❌ **CUT:** the
   timed/"resonance" choice. Each approved item still gets a diff before code ships.

---

## Appendix A — verified anchor map (resolved 2026-06-04; re-resolve before editing)

| Symbol | Anchor | | Symbol | Anchor |
|---|---|---|---|---|
| `_renderNarrativeOverlay` | 47752 | | `_storyScene` | 45100 |
| `evolutionScene` | 29938 | | `STORY_SCENES` | 32157 |
| `IntroQueue` / `INTRO_PRIORITY` | 43519 / 43513 | | `_tryFireRoadStoryBeats` | 43061 |
| `_resolveActLines` | 42762 | | `_resolveActChoices` | 42778 |
| `_storyChoiceValue` | 42757 | | choice-click write | 47842 |
| `_playStoryBeatScene` | 42904 | | `_playSceneActs` | 42800 |
| `sm` init / `sm.storyChoices` | 37571 / 37590 | | `sm.flags` | 37594 |
| `sm.storyEventsFired` / `scenesShown` | 37599 / 37578 | | `_storyRunSceneMark` | 47810 |
| rival fields | 37583–37597 | | `setRivalStanding` | 37615 |
| `normalizeRivalStandingState` | 37603 | | load() rival back-fill | 37885 |
| `_showRoamingLegendarySighting` | 47964 | | `_showFirstSightingLoreOverlay` | 47952 |
| `showBattleIntro` | 48483 | | `showVictoryOverlay` | 49023 |
| `_populateExtraRaidConfigs` | 43224 | | `_rollExtraRaidBossTeam` | 43265 |
| `enterBattleEvent` | 48278 | | `onBattleEnd` | 48591 |
| `getStoryBeatForRow` | 42465 | | `BEAT_CANON_TRAINER` | 43157 |
| `_roadForArrayIdx` | 42698 | | `STORY_EVENTS_RAW` | 30942 |
| `--sn-*` / `--sn-z-*` tokens | 2185–2195 | | `SAVE_VER` (=24) / `SAVE_KEY` | 36816 / 36805 |
| `migrateStoryPreV22` / `…V24` | 37340 / 37351 | | `window.__narrationTest` | 38956 |
| `slot.bonds` (Camp-owned) | NOT IN CODE | | `data/dialogue/*` + `extract-dialogue-pools.mjs` | shipped |

## Appendix B — cross-spec references (not my lane; coordinate, don't duplicate)

- **`camp/EVENT_CINEMATICS.md`** — the per-event cinematic catalogue (builds on §3.3).
- **`camp/BONDING_RELATIONSHIPS.md`** — `slot.bonds` per-mon affinity + **the rival
  v25** (§5). Anchors there (`_storyScene≈45003`, `evolutionScene≈29847`) are drifted;
  current values are in Appendix A.
- **Stream 1 `narrative-coherence.md`** — the setup/payoff map (§3.1 consumer); the
  inversion bug (§6.2); its H4-3 Phase-E dedup migration (§6.7).
- **Stream 2 `dialogue-and-writing.md` §8–9** — the four data-layer asks (§8.2).
- **Stream 3 `visual-and-cinematic.md` §4–5** — the raid-framing fix (§6.4) + pre-boss.

## Appendix C — what I did NOT touch / verify

- **No game code changed** (design pass); all code is *sketches*.
- **Camp internals** (minigames, hexagon, titles) — Camp's lane; I only touch the shared
  `slot.bonds` store, the cinematic substrate, and the v25 migration.
- **Balance magnitudes (§9)** and the **v25 sequencing (§5)** — left as maintainer decisions.
- **Stream 1's dispatch/sequence findings** are quoted from its spec, not re-measured.
