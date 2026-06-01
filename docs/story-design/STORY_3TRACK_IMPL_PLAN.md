# Story Mode 3-Track Implementation Plan

> Bone-structure pass. Wires the 3-track design (Main / Villain / Extra) into
> the existing 67-row `STORY_EVENTS_RAW` timeline. Random track assignment at
> run start, no picker UI. Content lives in the CSVs in this folder; this plan
> wires the structure first — story polish and boss-fight tuning happen later
> on top of the bone.

**Source of truth for content**
- `docs/story-design/story-flow-optimized.csv` — flow grid + rules
- `docs/story-design/story-core-structure.csv` — Main spine, 10 Villain modules, 8 Extra modules

**Mystery Figure voice**: "The First"

---

## 0. Premise

- 3 parallel tracks fire each run:
  - **Main** — stable, every run (5 road events + Battle 1/2 + 4 League events + Mystery Figure trio + Ending)
  - **Villain** — one of 10 (`rocket / magma / aqua / galactic / plasma / flare / skull / yell / macroCosmos / star`)
  - **Extra** — one of 8 (`cubone / yamask / hypno / phantump / mimikyu / drifloon / parasect / mewtwo`)
- Assignment: random at `confirmTrainerAndStart`, locked for the run. No picker.
- All 3 tracks layer on top of the existing 67-row `STORY_EVENTS_RAW` (idx 0–66) — we DO NOT fork the timeline.
- Existing 8-variant `STORYLINE_VARIANTS` system (`battle.html:37225`) stays alive but defaults to `classic` and is no longer surfaced. Retirement is a separate pass once 3-track is stable.

---

## 1. Anchor map (current, verified)

| Symbol | File | Line | Role |
|---|---|---|---|
| `SAVE_VER` | battle.html | 31509 | save schema version |
| `STORY_EVENTS_RAW` | battle.html | 29247 | 67-row event timeline (idx 0–66) |
| `MYSTERY_FIGURE_IDENTITIES` | battle.html | 30013 | identity table |
| `_storyEnsureMysteryIdentity` | battle.html | 30081 | picks an identity |
| `sm.storyLine` default | battle.html | 32210 | `'classic'` default |
| `confirmTrainerAndStart` | battle.html | 35340 | run-start hook |
| `rollMysteryFigureFinalBossTeam` | battle.html | 34655 | MF team builder |
| `STORY_BEATS` | battle.html | 35858 | per-row scene hooks |
| `STORY_COLD_OPENS` | battle.html | 35884 | scene dispatcher table |
| `STORYLINE_VARIANTS` | battle.html | 37225 | old 8-variant table (stays alive, dormant) |
| `_runStoryColdOpen` | battle.html | 38417 | cold-open runner |
| `_showIntroRivalColdOpen` | battle.html | 42304 | overlay-renderer pattern |
| `continuePostGame` | battle.html | 44023 | post-HoF MF climax |
| `startBattle` | battle.html | 16167 | battle entry |
| `window.StoryMode.onBattleEnd` | battle.html | 14349, 17179 | battle exit |
| `window.StoryMode.retreatToLastPokemonCenter` | battle.html | 8795 | loss → city |
| `state.weather` / `state.weatherTurns` | battle.html | 14634, 21731 | weather lock |
| `state.terrain` / `state.terrainTurns` | battle.html | 14638 | terrain lock |

Anchor drift is real — re-resolve via `node scripts/debug/symbol-index.mjs --lookup <symbol>` before editing.

---

## 2. Phasing — 7 PRs, each shippable

| PR | Scope | LOC | Risk |
|---|---|---|---|
| **PR-1** ✓ | Save schema bump (v21→v22) + random track assignment + migration | ~150 | low |
| **PR-2** | Event data tables + reward-tier table (data only; content from CSVs) | ~400 | low (data only) |
| **PR-3** | **Unified Story Flow Dispatcher** — single state machine, priority intro queue, beat dispatch, battle hooks, facility-intro dedupe collapse | ~600 | medium |
| **PR-4** | Healing rules + loss penalty (20%) + route fight cap + reward delivery (tier table wired, gold rebalance) | ~350 | medium |
| **PR-5** | Boss/raid mechanic engine + 3 reusable mechanics + track-end reward grants (Master Ball, Exp Share ×6) | ~600 | medium |
| **PR-6** | Mystery Figure / The First reveal staging (replace 7-identity dispatcher with single voice) | ~200 | low |
| **PR-7** | Anomaly seeding + tests + autopilot extension | ~250 | low |

Total ~2,550 LOC, almost entirely additive + data tables. (Up ~500 LOC from the original estimate after folding in the unified dispatcher + reward tiers + track-end rewards.)

---

## PR-1 — Save schema + track assignment

### Schema bump
- `SAVE_VER 21 → 22` at battle.html:31509
- New `sm.*` fields:
  ```
  sm.tracks = { main: 'classic_v2', villain: <key>, extra: <key> }
  sm.storyEventsFired = {}        // sceneKey → true (dedupe)
  sm.stats.battlesLost = 0
  sm.routeFights = { roadId: null, regulars: [], story: [] }  // transient
  sm.achievements = sm.achievements || {}
  ```
- Migration (v21 → v22): if `sm.tracks` missing, roll new villain + extra; default stats=0, eventsFired={}.

### Track pools
Define right after `STORY_EVENTS_RAW` (battle.html:~29370):
```js
const VILLAIN_TRACKS = ['rocket','magma','aqua','galactic','plasma',
                        'flare','skull','yell','macroCosmos','star'];
const EXTRA_TRACKS   = ['cubone','yamask','hypno','phantump',
                        'mimikyu','drifloon','parasect','mewtwo'];
function _pickTrack(pool, rng) { return pool[(rng() * pool.length) | 0]; }
```

### Run-start hook
In `confirmTrainerAndStart` (battle.html:35340), after `sm` initialization and before the first cold-open fires:
```js
const rng = (typeof window._seededRng === 'function') ? window._seededRng : Math.random;
sm.tracks = sm.tracks || {};
sm.tracks.main    = sm.tracks.main    || 'classic_v2';
sm.tracks.villain = sm.tracks.villain || _pickTrack(VILLAIN_TRACKS, rng);
sm.tracks.extra   = sm.tracks.extra   || _pickTrack(EXTRA_TRACKS,   rng);
```

**Do NOT** surface the rolled tracks on the confirm modal — tracks stay hidden until the first villain / extra beat fires organically in-game (Road 1 = first extra beat, Road 2 = first villain beat, so the reveal lands within ~10 min of starting). Strongest first-experience feel, zero modal UI work. The player can still re-roll the whole run by hitting "Back" before confirm — the rolled tracks just don't show.

### Tests (PR-1)
- `tests/suites/save-migration-v22.test.js` — load v21 fixture, assert v22 fields after `loadGameData`.
- `tests/suites/story-track-assign.test.js` — seeded RNG, call `confirmTrainerAndStart` stub, assert `sm.tracks.villain ∈ VILLAIN_TRACKS` and `sm.tracks.extra ∈ EXTRA_TRACKS`.

---

## PR-2 — Event data tables

### Three nested tables, after `STORY_BEATS` (battle.html:~35900)

```js
const MAIN_STORY_BEATS = {
    event1: { roadAnchor: 'road1', kind: 'event', sceneKey: 'main.event1' },
    event2: { roadAnchor: 'road3', kind: 'event', sceneKey: 'main.event2' },
    event3: { roadAnchor: 'road5', kind: 'event', sceneKey: 'main.event3' },
    battle1:{ roadAnchor: 'road5', kind: 'battle', sceneKey: 'main.battle1', diff: 'Trainer' },
    event4: { roadAnchor: 'road7', kind: 'event', sceneKey: 'main.event4' },
    battle2:{ roadAnchor: 'road7', kind: 'battle', sceneKey: 'main.battle2', diff: 'Elite' },
    event5: { roadAnchor: 'road8', kind: 'event', sceneKey: 'main.event5' },
    event6: { roadAnchor: 'league', kind: 'event', sceneKey: 'main.event6' },
    event7: { roadAnchor: 'league', kind: 'event', sceneKey: 'main.event7' },
    event8: { roadAnchor: 'league', kind: 'event', sceneKey: 'main.event8' },
    event9: { roadAnchor: 'league', kind: 'event', sceneKey: 'main.event9' },
    mfBattle:{ roadAnchor: 'league', kind: 'mysteryBoss', sceneKey: 'main.mfBattle' },
    mfReveal:{ roadAnchor: 'league', kind: 'event', sceneKey: 'main.mfReveal' },
    ending: { roadAnchor: 'league', kind: 'event', sceneKey: 'main.ending' },
};

const VILLAIN_STORY_BEATS = {
    rocket: {
        event1:   { roadAnchor: 'road2', kind: 'event', sceneKey: 'villain.rocket.event1' },
        event2:   { roadAnchor: 'road3', kind: 'event', sceneKey: 'villain.rocket.event2' },
        event3:   { roadAnchor: 'road4', kind: 'event', sceneKey: 'villain.rocket.event3' },
        battle1:  { roadAnchor: 'road4', kind: 'battle', sceneKey: 'villain.rocket.battle1', diff: 'Elite' },
        event4:   { roadAnchor: 'road5', kind: 'event', sceneKey: 'villain.rocket.event4' },
        battle2:  { roadAnchor: 'road5', kind: 'battle', sceneKey: 'villain.rocket.battle2', diff: 'Elite' },
        event5:   { roadAnchor: 'road6', kind: 'event', sceneKey: 'villain.rocket.event5' },
        miniBoss: { roadAnchor: 'road6', kind: 'miniBoss', sceneKey: 'villain.rocket.miniBoss', bossId: 'proton' },
        event6:   { roadAnchor: 'road7', kind: 'event', sceneKey: 'villain.rocket.event6' },
        boss:     { roadAnchor: 'road7', kind: 'boss', sceneKey: 'villain.rocket.boss', bossId: 'giovanni' },
        ending:   { roadAnchor: 'road7', kind: 'event', sceneKey: 'villain.rocket.ending' },
    },
    // ... 9 more villains, same shape
};

const EXTRA_STORY_BEATS = {
    cubone: {
        event1:    { roadAnchor: 'road1', kind: 'event',     sceneKey: 'extra.cubone.event1' },
        event2:    { roadAnchor: 'road2', kind: 'event',     sceneKey: 'extra.cubone.event2' },
        event3:    { roadAnchor: 'road3', kind: 'event',     sceneKey: 'extra.cubone.event3' },
        event4:    { roadAnchor: 'road4', kind: 'event',     sceneKey: 'extra.cubone.event4' },
        miniRaid:  { roadAnchor: 'road4', kind: 'miniRaid',  sceneKey: 'extra.cubone.miniRaid',  bossSpecies: 'Cubone' },
        event5:    { roadAnchor: 'road5', kind: 'event',     sceneKey: 'extra.cubone.event5' },
        miniRaid2: { roadAnchor: 'road5', kind: 'miniRaid',  sceneKey: 'extra.cubone.miniRaid2', bossSpecies: 'Marowak' },
        event6:    { roadAnchor: 'road6', kind: 'event',     sceneKey: 'extra.cubone.event6' },
        raid:      { roadAnchor: 'road6', kind: 'raid',      sceneKey: 'extra.cubone.raid',      bossSpecies: 'Marowak' },
        ending:    { roadAnchor: 'road7', kind: 'event',     sceneKey: 'extra.cubone.ending' },
    },
    // ... 7 more extras, same shape
};
```

### Scene content table
```js
const STORY_SCENES = {
    'main.event1': { title: 'Off Again', body: "An old man on the path nods at you and says 'Off again. Tell me how it ends this time.' He says it like a joke. He doesn't smile.", sprite: 'old_man' },
    'villain.rocket.event1': { title: 'Rocket Grunt', body: "...", sprite: 'rocket_grunt' },
    'extra.cubone.event1': { title: 'The Mask', body: "A child on the route is wearing a skull mask for a school play. The mask is too big. The mask is real bone.", sprite: null },
    // ... ~200 entries total, populated from the structure CSV
};
```

**Content ingestion**: write a one-shot script `scripts/build-story-scenes.mjs` that parses the structure CSV into a JS object literal and emits it as a `<script>` block or include. Run once at PR-2 time; don't ship the parser at runtime.

### Road-anchor → STORY_EVENTS_RAW row map
Verify against `STORY_EVENTS_RAW` (battle.html:29247). Each `roadAnchor` resolves to a contiguous block of row indices (the wild encounters / trainer rows between two city rows). Build a helper:
```js
function _rowsForRoad(roadId) { /* returns [startRow, endRow] inclusive */ }
```

### Reward tier table (PR-2 data, PR-4 delivery)

```js
const STORY_REWARD_TIERS = {
    // Flavor event with no battle. Tiny morale drop.
    flavor: { goldFrac: 0.05, vouchers: 0, vitamins: 0, items: ['heartScale?'] },
    // Basic grunt battle (e.g. Rocket Grunt). Matches current Basic-Trainer reward.
    low:    { goldFrac: 0.80, vouchers: [0, 1], vitamins: 0, items: [] },
    // Mini-boss / mini-raid. Matches current Ace-Trainer reward.
    mid:    { goldFrac: 1.00, vouchers: [1, 2], vitamins: 1, items: ['voucher_artifact?'] },
    // Track boss / full raid. Matches current Gym-Leader / Rival reward.
    big:    { goldFrac: 1.00, vouchers: [3, 5], vitamins: [2, 3], items: ['voucher_artifact'] },
    // Mystery Figure battle. Matches Champion reward.
    apex:   { goldFrac: 1.00, vouchers: 5,      vitamins: 3,      items: ['voucher_artifact', 'masterball?'] },
};

// Maps `kind` in MAIN/VILLAIN/EXTRA_STORY_BEATS to a tier.
const STORY_KIND_TO_TIER = {
    event: 'flavor',
    battle: 'low',
    miniBoss: 'mid',
    miniRaid: 'mid',
    boss: 'big',
    raid: 'big',
    mysteryBoss: 'apex',
};

// Base-trainer gold nerf — applied in PR-4 to compensate for the new event-battle
// gold flowing in. Targets a ~neutral total-run gold balance vs. the current build.
const STORY_BASE_TRAINER_GOLD_MULT = 0.82;  // -18%
```

`goldFrac` is a multiplier of the Gym-Leader-tier gold table. Vouchers/vitamins given as `[min, max]` for a small spread (rolled per battle), or a flat number.

### Tests (PR-2)
- `tests/suites/story-beats-table.test.js` — assert every track has all expected slot keys; assert every sceneKey has a `STORY_SCENES` entry.
- `tests/suites/story-reward-tiers.test.js` — every `kind` in `MAIN/VILLAIN/EXTRA_STORY_BEATS` resolves to a tier; every tier has all required fields.

---

## PR-3 — Unified Story Flow Dispatcher

> **The architectural fix for the stacking-popup bug.** Today multiple intro
> systems fire independently when the player enters a city — market giveaway
> popup, facility welcome overlay, one-time tip system, gift events — and they
> can stack, contradict each other ("you get 5 PokéBalls" + "you get 1 PokéBall"),
> or fire out of order. PR-3 replaces every scattered popup-firer with a single
> priority-ordered queue that owns the entire city-entry / city-leave flow.

### State machine

```
CITY_ARRIVE
  → IntroQueue.collectFor(cityId)        // gather all valid intros
  → IntroQueue.runSequentially()         // priority-ordered, deduped
  → CITY_IDLE                            // player can browse facilities
  → (optional) GYM_BATTLE
  → CITY_IDLE
  → CITY_LEAVE → ROAD
```

### Single queue, one source of truth

```js
const INTRO_PRIORITY = {
    facility_first_time:  100,   // "Welcome to the Pokémon Center" intro
    plot_beat_main:        90,   // MAIN_STORY_BEATS event firing this city
    plot_beat_villain:     80,   // VILLAIN_STORY_BEATS event
    plot_beat_extra:       70,   // EXTRA_STORY_BEATS event
    market_giveaway:       50,   // shop tutorial / freebie
    npc_tip:               20,   // generic facility tip
    one_time_lesson:       10,   // legacy `_storyShowOneTimeTip`
};

const IntroQueue = {
    pending: [],
    enqueue(item) { /* item = { priority, sceneKey, dedupeKey, oneTime, payload } */ },
    collectForCity(cityId) {
        // 1. facility intros (Pokemon Center, Mart, etc.) → priority 100
        // 2. main/villain/extra beats whose roadAnchor === cityId
        // 3. market giveaways the player hasn't claimed
        // 4. one-time tips not yet shown
        // All filtered against sm.facilityIntros / sm.storyEventsFired
    },
    async runSequentially() {
        this.pending.sort((a, b) => b.priority - a.priority);
        for (const item of this.pending) {
            if (item.dedupeKey && sm.facilityIntros[item.dedupeKey]) continue;
            await _renderNarrativeOverlay(STORY_SCENES[item.sceneKey] || item.payload);
            if (item.oneTime) sm.facilityIntros[item.dedupeKey] = true;
            if (item.sceneKey) sm.storyEventsFired[item.sceneKey] = true;
        }
        this.pending.length = 0;
        save();
    },
};
```

### Migration — collapse the bugged firers

Audit and DELETE the parallel firing paths, route them all through `IntroQueue.enqueue`:
- `_storyShowOneTimeTip` (battle.html:31560) — replace direct overlay call with `IntroQueue.enqueue({ priority: INTRO_PRIORITY.one_time_lesson, ... })`.
- Market freebie popup (find via grep — likely in shop code): replace direct `showGameAlert` with enqueue.
- Facility welcome overlay: replace direct call with enqueue at priority 100.
- Gift events: replace direct call with enqueue.
- `_runStoryColdOpen` (battle.html:38417): becomes a thin wrapper that calls into `IntroQueue.runSequentially()` once.

End state: one place that fires overlays. Adding a new intro = `IntroQueue.enqueue(...)`. Removing or re-ordering = adjust priority constant.

### Beat resolver — feeds the queue

Add `_resolveActiveBeatsForRow(rowIdx)` near `_runStoryColdOpen` (battle.html:38417):
```js
function _resolveActiveBeatsForRow(rowIdx) {
    const roadId = _roadForRow(rowIdx);
    const queue = [];
    // 1. main beats (always)
    for (const slot of Object.values(MAIN_STORY_BEATS)) {
        if (slot.roadAnchor === roadId && !sm.storyEventsFired[slot.sceneKey]) queue.push(slot);
    }
    // 2. villain beats (gated by sm.tracks.villain)
    const v = VILLAIN_STORY_BEATS[sm.tracks.villain];
    if (v) for (const slot of Object.values(v)) {
        if (slot.roadAnchor === roadId && !sm.storyEventsFired[slot.sceneKey]) queue.push(slot);
    }
    // 3. extra beats (gated by sm.tracks.extra)
    const x = EXTRA_STORY_BEATS[sm.tracks.extra];
    if (x) for (const slot of Object.values(x)) {
        if (slot.roadAnchor === roadId && !sm.storyEventsFired[slot.sceneKey]) queue.push(slot);
    }
    return queue;  // order: main → villain → extra
}
```

Wire into the existing per-row hook (the function that fires when the player advances `sm.eventIndex`). Each beat played → set `sm.storyEventsFired[sceneKey] = true`.

### Battle intro/outro

### Beat resolver
Add `_resolveActiveBeatsForRow(rowIdx)` near `_runStoryColdOpen` (battle.html:38417):
```js
function _resolveActiveBeatsForRow(rowIdx) {
    const roadId = _roadForRow(rowIdx);
    const queue = [];
    // 1. main beats (always)
    for (const slot of Object.values(MAIN_STORY_BEATS)) {
        if (slot.roadAnchor === roadId && !sm.storyEventsFired[slot.sceneKey]) queue.push(slot);
    }
    // 2. villain beats (gated by sm.tracks.villain)
    const v = VILLAIN_STORY_BEATS[sm.tracks.villain];
    if (v) for (const slot of Object.values(v)) {
        if (slot.roadAnchor === roadId && !sm.storyEventsFired[slot.sceneKey]) queue.push(slot);
    }
    // 3. extra beats (gated by sm.tracks.extra)
    const x = EXTRA_STORY_BEATS[sm.tracks.extra];
    if (x) for (const slot of Object.values(x)) {
        if (slot.roadAnchor === roadId && !sm.storyEventsFired[slot.sceneKey]) queue.push(slot);
    }
    return queue;  // order: main → villain → extra
}
```

Wire into the existing per-row hook (the function that fires when the player advances `sm.eventIndex`). Each beat played → set `sm.storyEventsFired[sceneKey] = true`.

### Battle intro/outro
Wrap `startBattle` (battle.html:16167). Before the existing battle setup:
```js
async function startBattle(opts) {
    const battleId = opts && opts.storyBattleId;
    if (battleId) await _playBattleScene(battleId, 'pre');
    /* ... existing body ... */
}
```

In `window.StoryMode.onBattleEnd` (battle.html:14349, 17179) after the result is computed:
```js
if (battleId) await _playBattleScene(battleId, won ? 'post.win' : 'post.loss');
```

`_playBattleScene(battleId, suffix)` looks up `STORY_SCENES['battle.' + battleId + '.' + suffix]` and plays it via `_renderNarrativeOverlay`.

Generic fallback: if no scene exists, no overlay fires (existing toast / shout stays).

### Tests (PR-3)
- `tests/suites/story-dispatch.test.js` — seed `sm.tracks.villain='rocket'`, advance through road 2 rows, assert `villain.rocket.event1` fires + dedupes on re-advance.
- `tests/suites/battle-dialogue.test.js` — start a story battle with `storyBattleId='main.battle1'`, assert pre-scene runs before turn 1, post-scene runs after KO.
- `tests/suites/intro-queue-order.test.js` — enter a city with all four sources active (facility intro, main beat, market giveaway, one-time tip); assert overlays render exactly once in priority order with no duplicates.
- `tests/suites/intro-queue-dedupe.test.js` — re-enter the same city, assert no facility intro fires twice (dedupe via `sm.facilityIntros`).
- `tests/suites/intro-stacking-regression.test.js` — reproduce the "5 PokéBalls + 1 PokéBall" stacking bug from a fresh run; assert only one Mart giveaway overlay fires per city per run.

---

## PR-4 — Healing + loss penalty + route fight cap

### City auto-heal
Find the city-entry handler (trace `window.StoryMode.enterCity` from the buttons at battle.html:8388, 8420, etc.). Add at top of handler:
```js
if (sm && Array.isArray(sm.party)) {
    for (const mon of sm.party) { mon.hp = mon.maxHp; mon.status = ''; /* restore PP */ }
}
```

### Route entry — no auto-heal
Verify no auto-heal happens on route entry today (likely already true — confirm in test). HP/PP carry across encounters within a road.

### Bag-item usage between fights
Story Mode already routes back to overworld after each battle where Bag works. Verify bag UI is reachable between road encounters (smoke-test via autopilot).

### Loss penalty
Locate the lose-battle path (`retreatToLastPokemonCenter` at battle.html:8795 is the manual button; the auto-loss path runs through `onBattleEnd` with `won=false`). In the loss branch:
```js
const penalty = Math.floor(sm.gold * 0.20);
sm.gold = Math.max(0, sm.gold - penalty);
sm.stats.battlesLost = (sm.stats.battlesLost | 0) + 1;
// existing: rewind to last city + full heal
```

### No Death Run achievement
On Hall of Fame (battle.html:~44005), set the flag — the existing achievements / collection page pass owns the visual:
```js
if ((sm.stats.battlesLost | 0) === 0) {
    sm.achievements = sm.achievements || {};
    sm.achievements.noDeath = true;
}
```
No banner / no trophy work in this PR. Register the achievement key, hand off to the achievements system update.

### Route fight cap (≤4)
New `_resolveRoadFights(roadId)` that the road-event cycler consults:
```js
function _resolveRoadFights(roadId) {
    const base = ROAD_REGULAR_FIGHTS[roadId];  // hardcoded from STORY_EVENTS_RAW counts
    const story = _resolveActiveBeatsForRow(/* this road */)
                    .filter(b => b.kind === 'battle' || b.kind === 'miniBoss'
                              || b.kind === 'boss' || b.kind === 'miniRaid' || b.kind === 'raid');
    const total = base.length + story.length;
    if (total <= 4) return { regulars: base, story };
    // yield: Basic first, then Elite, never Rival or Story
    const sorted = base.slice().sort((a,b) => YIELD_PRIORITY[a.type] - YIELD_PRIORITY[b.type]);
    const drop = total - 4;
    const kept = sorted.slice(drop);
    // restore Rival to the front if present
    return { regulars: _restoreRivalFirst(kept, base), story };
}
const YIELD_PRIORITY = { Basic: 0, Elite: 1, Rival: 99, Story: 99 };
```

### Reward delivery + gold rebalance

Wire `STORY_REWARD_TIERS` and `STORY_KIND_TO_TIER` from PR-2 into the post-battle reward path. Find the existing `_storyAwardBattleRewards` / `applyBattleRewards` function (grep for gym-leader gold table) and add:

```js
function _storyAwardForStoryBeat(beat, multipliers) {
    const tier = STORY_REWARD_TIERS[STORY_KIND_TO_TIER[beat.kind]];
    if (!tier) return;
    const baseGold = _gymLeaderGoldForCity(_cityForRow(currentEventIdx));
    sm.gold += Math.floor(baseGold * tier.goldFrac);
    if (tier.vouchers) _grantVouchers(_rollRange(tier.vouchers));
    if (tier.vitamins) _grantRandomVitamins(_rollRange(tier.vitamins));
    if (tier.items) for (const it of tier.items) _grantItemIfPresent(it);
}
```

Apply `STORY_BASE_TRAINER_GOLD_MULT = 0.82` to the BASIC trainer rewards path (route trainer table) — find via grep on the current basic-trainer gold formula. Total run gold stays neutral after the bump; vouchers + vitamins net-up.

### Tests (PR-4)
- `tests/suites/healing-rules.test.js` — assert no heal between route fights, heal on city entry.
- `tests/suites/loss-penalty.test.js` — set gold 1000, force loss, assert gold=800, party HP full, returned to last city.
- `tests/suites/no-death-run.test.js` — clear to HoF without losing, assert `sm.achievements.noDeath === true`.
- `tests/suites/route-fight-cap.test.js` — seed villain + extra on Road 5, assert total fights ≤ 4.
- `tests/suites/reward-tier-delivery.test.js` — fire a beat at each tier (low/mid/big/apex); assert gold + voucher + vitamin counts match the tier table.
- `tests/suites/gold-neutral-fullrun.test.js` — autopilot a full run with the new tier table active; assert total gold delta vs. baseline is within ±15%.

---

## PR-5 — Boss/raid mechanic engine

### Mechanic module
Add after `MYSTERY_FIGURE_IDENTITIES` (battle.html:30013):
```js
const BOSS_MECHANICS = {
    hpThresholdPhase(battle, thresholdPct, effectFn, bannerText) {
        battle.hooks.onDamageTaken.push(() => {
            const hpPct = battle.boss.hp / battle.boss.maxHp;
            if (hpPct <= thresholdPct && !battle._phaseFired[thresholdPct]) {
                battle._phaseFired[thresholdPct] = true;
                _showBattleBanner(bannerText);
                effectFn(battle);
            }
        });
    },
    immunityRound(battle, everyN, durationTurns, bannerText) {
        battle.hooks.onTurnStart.push(turn => {
            if (turn > 0 && turn % everyN === everyN - 1) _showBattleBanner('BOSS IS PREPARING');
            if (turn > 0 && turn % everyN === 0) {
                battle.boss._immuneTurns = durationTurns;
                _showBattleBanner(bannerText);
            }
        });
        // hook damage rolls: if boss._immuneTurns > 0, damage = 0 (statuses still apply)
    },
    fieldLock(battle, kind, value, turns) {
        if (kind === 'weather') { state.weather = value; state.weatherTurns = turns; }
        else if (kind === 'terrain') { state.terrain = value; state.terrainTurns = turns; }
        _showBattleBanner(`${value.toUpperCase()} LOCKED`);
    },
    powerSurge(battle, turns) { /* +25% STAB on boss for N turns */ },
    priorityFirst(battle) { /* +1 priority on boss next move */ },
};
```

### Boss configs
```js
const BOSS_CONFIGS = {
    'villain.rocket.boss': {
        mechanics: [
            { type: 'hpThresholdPhase', at: 0.50, effect: 'powerSurge', banner: 'INJECTION' },
            { type: 'hpThresholdPhase', at: 0.25, effect: 'powerSurge', banner: 'CALLED IN' },
            { type: 'immunityRound', everyN: 5, turns: 1, banner: 'BOSS IS PREPARING' },
        ],
    },
    'villain.magma.boss': {
        mechanics: [
            { type: 'fieldLock', kind: 'weather', value: 'Sun', turns: 99, banner: 'PRIMAL HEAT' },
            { type: 'hpThresholdPhase', at: 0.25, effect: 'powerSurge', banner: 'PRIMAL HEAT' },
            { type: 'immunityRound', everyN: 5, turns: 1 },
        ],
    },
    // ... one entry per villain boss, miniBoss, and extra raid/miniRaid (the CSV rows)
};
```

### Hook into rollTrainerTeam path
When a story battle starts, look up `BOSS_CONFIGS[battleId]` and attach mechanics. Mini-Raid / Raid HP scaling per CSV rule:
```js
if (kind === 'miniRaid') boss.maxHp = baseHp * (partySize - 1);
else if (kind === 'raid') boss.maxHp = baseHp * partySize;
```

### Telegraph discipline
Every mechanic activation: banner one turn before via new `_showBattleBanner(text)` helper. No surprise mid-fight introductions.

### Track-end reward grants

On boss-victory in the `villain.<track>.boss` event:
```js
_grantItem('masterball', 1);
_showBattleBanner('You found a MASTER BALL.');
sm.storyEventsFired['villain.' + sm.tracks.villain + '.reward'] = true;
```

On raid-victory in the `extra.<track>.raid` event:
```js
sm.inventory.expShareVoucher = (sm.inventory.expShareVoucher | 0) + 6;
_showBattleBanner('You earned 6 EXP SHARE VOUCHERS.');
sm.storyEventsFired['extra.' + sm.tracks.extra + '.reward'] = true;
```

### Exp Share Voucher item

New inventory item + UI. The wallet stores N level-units (`sm.inventory.expShareVoucher`). Player opens it from the Bag → "Use" → modal lets them pick distribution across party + PC mons. Each "+1 level" click consumes one unit and bumps the chosen mon by 1 level (capped at L100 and at the run's current level cap).

```js
function applyExpShareVoucher(monId, levels) {
    const have = sm.inventory.expShareVoucher | 0;
    const n = Math.min(have, levels | 0);
    if (n <= 0) return;
    const mon = _findMonById(monId);
    if (!mon) return;
    mon.level = Math.min(mon.level + n, 100, _currentLevelCap());
    _recomputeMonStats(mon);
    sm.inventory.expShareVoucher = have - n;
    save();
}
```

Modal lives in the Bag screen; the rest of the inventory UI handles count display via the existing item-pill template.

### Tests (PR-5)
- `tests/suites/boss-hp-threshold.test.js` — damage boss to 49%, assert banner + power-surge fires once.
- `tests/suites/boss-immunity-round.test.js` — advance 5 turns, assert preparation banner at turn 4, immunity at turn 5, damage clamped to 0, status sticks.
- `tests/suites/boss-field-lock.test.js` — start magma boss, assert sun weather locked for 99 turns.
- `tests/suites/raid-hp-scaling.test.js` — 5-mon party vs Marowak mini-raid → HP × 4; vs raid → HP × 5.
- `tests/suites/track-reward-grants.test.js` — beat a villain boss → Master Ball in inventory; beat an extra raid → 6 Exp Share vouchers.
- `tests/suites/exp-share-voucher-apply.test.js` — start with 6 vouchers, apply 3 to mon A and 3 to mon B; assert levels bumped, voucher wallet → 0, stats recomputed.
- `tests/suites/exp-share-voucher-cap.test.js` — try to bump past level cap; assert clamped + voucher refunded.

---

## PR-6 — Mystery Figure / The First reveal

### Identity dispatcher
Replace `MYSTERY_FIGURE_IDENTITIES` (battle.html:30013) with a single entry:
```js
const MYSTERY_FIGURE_IDENTITIES = {
    the_first: {
        name: 'The First',
        sprite: 'trainer_self_inverted',   // reuse player sprite, inverted CSS
        nameplate: '???',
        prefightLine: "You're going to win this one. The next one too. That's the problem.",
        /* + reveal speech, post-fight line */
    },
};
```
The 7 old identities (`cyrus`, `n`, `ex_rocket`, etc.) are **deleted in this PR**. Simplify `_storyEnsureMysteryIdentity` (battle.html:30081) to:
```js
function _storyEnsureMysteryIdentity() {
    return MYSTERY_FIGURE_IDENTITIES.the_first;
}
```
Also grep for any callers that pass an identity key (`_BOSS_LEAD_FLAVOR`, `_storyPickMysteryIdentity`, etc.) and either remove the param or hardcode `the_first`. Run the full test suite — any test referencing an old identity is dead code and gets removed too.

### Mystery Figure team builder
`rollMysteryFigureFinalBossTeam` (battle.html:34655) — verify the existing implementation produces player-party + one stronger starter slot per spec. If it does (per PLAYTEST_REPORT.md mention), keep. Otherwise patch to:
```js
function rollMysteryFigureFinalBossTeam(partySize, enabledGens) {
    const playerParty = (sm.party || []).slice(0, partySize);
    const starter = sm.starter ? _buildStrongerVariant(sm.starter) : null;
    return [...playerParty, starter].filter(Boolean).slice(0, 6);
}
```

### Reveal scene + ending scene
Add to `STORY_SCENES`:
```js
'main.mfReveal':  { title: 'The First', body: "The figure removes their cap. The face under the cap is yours — older, tired, scarred. He says: 'I am The First. You become me. I become the one who saves the universe by losing to you forever.' ...", multiPage: true, sprite: 'trainer_self_aged' },
'main.ending':    { title: 'Run #1', body: "You leave the museum hall. The empty portrait now has a face — yours. The brass plate reads 'The First — Run #1.' ...", sprite: null },
```

Wire into `continuePostGame` (battle.html:44023) — after the Mystery Figure battle wins, queue `main.mfReveal` cold-open → then `main.ending` → then post-game door to Battle Frontier.

### Tests (PR-6)
- `tests/suites/mystery-figure-the-first.test.js` — sim post-HoF, assert identity = `the_first`, team includes player-party-shaped mons + stronger starter, reveal scene fires after win.

---

## PR-7 — Anomaly seeding + tests + autopilot

### Anomaly seeds (subtle one-liners)
Plant early-game `'Welcome Back' sticker` / `Pokédex updates in your handwriting` / `radio plays a song you know` lines as small overlay tips on:
- `STORY_EVENTS_RAW` row 7 (first basic trainer post-Gym-1) → "Welcome Back" map sticker overlay
- Row 14 (mid-game basic) → Pokédex handwriting tip
- Row 30 (post-Gym-5 elite road) → "tell The First we said hi" trainer line
- Row 49 (Road 7 elite trainer) → starter line in your handwriting

These reuse existing tip-overlay machinery (`tipsShown[metaKey]`).

### Autopilot extension
Update `scripts/debug/autopilot-fullrun.mjs`:
- After confirm, assert `sm.tracks.villain` and `sm.tracks.extra` are populated.
- Iterate one full run per villain (10 runs total) in seed-rotation mode → assert no scene throws + reaches HoF.
- Final run: extra rotation (8 runs) → same assertion.

### Aggregate test suite
- All PR-1..PR-6 test files in a top-level `tests/suites/story-3track/` directory.
- Add to `package.json` test script as a named suite.

---

## 3. Scene content ingestion (one-time)

The structure CSV holds ~200 cells of prose. Pull them into JS via a build script:

```bash
node scripts/build-story-scenes.mjs \
    docs/story-design/story-core-structure.csv \
    > scripts/build/story-scenes.generated.js
```

Then paste `story-scenes.generated.js` body into the `STORY_SCENES` const in battle.html. **Manual ingestion, not runtime parsing** — keeps the shipped build lean.

When the CSV changes, re-run the script and re-paste. (We can automate via a CI step later.)

---

## 4. What we are NOT doing (deferred)

- **Per-track sprite swaps** — boss sprites reuse existing trainer art.
- **Per-track BGM** — audio mixing is finicky; existing BGM stays.
- **Per-track cinematic backgrounds** — defer to a polish pass.
- **Full reconciliation with the old 8-variant `STORYLINE_VARIANTS`** — it stays alive but defaults to `classic` and is no longer surfaced. Retirement is a separate PR after 3-track is stable.
- **Trainer pool / encounter table / difficulty curve work** — owned by your separate effort. This plan calls into the existing `rollTrainerTeam` interface unchanged; trainer-pool work can fork its pool by villain/extra context once the `sm.tracks` keys exist (PR-1 unblocks).
- **Per-encounter unique boss art** — use existing sprites; theme via mechanic names and field locks.
- **Localization / i18n** — out of scope; all strings are English.

---

## 5. Locked design decisions

| # | Decision | Resolution | Implication |
|---|---|---|---|
| 1 | Villain Story Ending location | **Road 7 right after Boss** | Boss + Ending colocated. Clean reward beat, zero extra routing. |
| 2 | No Death Run reward shape | **Register one achievement key (`sm.achievements.noDeath = true`) — surfaced through the existing collection / achievements page** | No custom HoF trophy work; the achievements system pass owns the visual. PR-4 just sets the flag. |
| 3 | Reveal tracks on confirm modal | **Hide — keep it a mystery** | Player discovers villain + extra through the first beat (Road 1 extra, Road 2 villain) within ~10 minutes. Strongest first-experience feel, cheapest to ship (zero modal UI work). |
| 4 | NG+ re-roll behavior | **Re-roll fresh tracks every NG+ on the same save** | 80 villain×extra combos hunt-able without creating new saves. Tiny: re-run the same roll logic in the NG+ entry path. |
| 5 | Old 7 Mystery Figure identities | **Retire now — delete code** | PR-6 removes the 7 old entries from `MYSTERY_FIGURE_IDENTITIES`, keeps only `the_first`. Smaller surface, fewer dormant branches. |
| 6 | Villain track endgame reward | **Master Ball** (Road 7 boss drop) | Iconic, thematic ("you broke the cartel, you took the prize"). Useful for HoF, Boss Arc, post-game, NG+. One-line inventory grant. |
| 7 | Extra track endgame reward | **Exp Share Voucher ×6** + arc gives its signature mon mid-arc (Cubone joins event 4, etc.) | Voucher wallet of 6 level-units, distributable any way the player wants. Math: 100-base stat at L50→51 = ~+13 stats, so ×6 = ~+78 stats spread however — equivalent to ~6 Rare Candies. Generous endgame, not OP. Thematic dark-mon gift mid-arc keeps the arc emotionally landing. |
| 8 | Reward tier philosophy | **Big = Gym/Rival · Mid = Ace Trainer · Low = Basic. Vouchers + vitamins UP, gold ~same** | Tier table in PR-2 (data); delivery + 15–20% basic-gold nerf in PR-4. Keeps total run gold close to current despite new event battles, while bumping vitamin/voucher economy. |
| 9 | Facility-flow stacking-popup bug | **Collapse all intro sources into ONE unified state machine** (PR-3 expanded scope) | Today: market giveaway popup, facility welcome overlay, `_storyShowOneTimeTip`, and gift events all fire independently → stacking + contradictory messages (5 balls + 1 ball example). PR-3 routes everything through a single priority-ordered, deduped `IntroQueue` keyed on `sm.facilityIntros`. Tutorial intros gated `firstTimeOnly: true`. |
| 10 | Trainer team builder for the 67 new story battles | **Auto-roll via `rollTrainerTeam` with hardcoded lead** | Use the existing builder at the right difficulty tier (Elite for grunts, Champion for bosses); hardcode the CSV's lead Pokémon (e.g. Raticate+Golbat for rocket.battle1). 6-mon team auto-derives at correct level scaling. Bone structure ships fast; hand-authoring per-team rosters deferred to a polish PR after playtest. |
| 11 | Mid-arc dark-Pokémon gift (Cubone joins after event 4, etc.) | **Rejected — endgame reward only** | Extra arc reward is just the Exp Share Voucher ×6 at raid victory. The signature mon stays as encounters/raids; player catches it themselves with a real ball. Simpler scope, no special gift wiring needed in PR-5. |
| 12 | PR-3 sub-scoping | **Split into PR-3a + PR-3b** | PR-3a = beat dispatcher + battle hooks (~300 LOC, additive, low risk, unblocks PR-4/PR-5). PR-3b = unified IntroQueue + collapse existing firers (~400 LOC, medium risk, fixes the stacking-popup bug). Easier review, safer rollback. |
| 13 | Refactor aggressiveness in PR-3b | **Route + delete** | Old direct-overlay-fire sites become thin wrappers over `IntroQueue.enqueue`. Once parity tests pass, the dupe code paths are deleted. Cleanest end-state, matches the "1 codebase" mandate. |
| 14 | Old 8-variant storyline picker card | **Hide in PR-3a** | UI card removed from trainer-create. Code stays alive (`sm.storyLine = 'classic'` works), no surface area. The 3-track system supersedes it. |
| 15 | Flavor-event mechanical reward | **Zero across the board** | `STORY_REWARD_TIERS.flavor` is `{ goldFrac: 0, vouchers: 0, vitamins: 0, items: [] }`. The scene IS the reward; flavor events don't drip gold or vouchers. Battle tiers (low/mid/big/apex) own all mechanical rewards. |
| 16 | Story-canon Pokémon vs. player's enabled-gen toggle | **Mixed — slot-level `forceCanon` override** | Default: respect the gen toggle for all team rolls. Exception: story-mandated canon leads (villain battle leads, mini-bosses, bosses, MF's `+1 starter` slot) carry a `forceCanon: true` flag and override the gen toggle. ~2–3 forced slots per boss team out of 6 → ~50% canon, ~50% gen-respecting variety. Player gets a small toast on entry: *"Story canon — this team includes Pokémon outside your enabled generations."* Delivers max replayability (3-track × 10 villains × 8 extras = 80 distinct canon rotations even on single-gen lock) AND story integrity (Giovanni stays Giovanni). Implementation: PR-5 boss/team builder. |

---

## 6. Sanity checks before PR-1

- Confirm `confirmTrainerAndStart` (battle.html:35340) is the only run-start entry point used in the live build (no alt path that skips track assignment).
- Confirm SAVE_VER bump won't lose any in-flight live saves (migration tested with a v21 fixture).
- Confirm `STORY_EVENTS_RAW` row indices match the road-anchor map exactly — write a `tests/suites/story-row-anchor-map.test.js` table check.
- Confirm `rollTrainerTeam` signature is stable enough that PR-5 can attach mechanics without altering it.

---

## 7. Estimated wall-clock

- PR-1: half-day (schema + assignment)
- PR-2: 1 day (tables + content ingest script)
- PR-3: 2 days (dispatcher + battle hooks)
- PR-4: 1 day (healing + loss + cap)
- PR-5: 2 days (mechanic engine)
- PR-6: half-day (MF wiring)
- PR-7: 1 day (anomalies + tests + autopilot)

**Total**: ~8 working days for the bone structure. Content polish + boss tuning + sprite work on top.

---

## 8. Source references

- `docs/story-design/story-flow-optimized.csv` — flow grid + rules (anchor for road definitions, healing rules, cap rule)
- `docs/story-design/story-core-structure.csv` — 200+ cells of prose (anchor for `STORY_SCENES` content)
- `docs/STORY_NARRATIVE_VARIANTS.md` — predecessor 8-variant design (informs retirement path)
- `docs/story-design/CITY_BY_CITY.md` — shipped facility ladder (informs city-vs-road healing rule)
- `STORY_MODE_FLOW.md` §17 — existing event-registry architecture
- `PLAYTEST_REPORT.md` — confirms `rollMysteryFigureFinalBossTeam` already builds player-party + 1 slot
