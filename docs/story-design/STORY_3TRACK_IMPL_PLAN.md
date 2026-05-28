# Story Mode 3-Track Implementation Plan

> Bone-structure pass. Wires the 3-track design (Main / Villain / Extra) into
> the existing 68-row `STORY_EVENTS_RAW` timeline. Random track assignment at
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
- All 3 tracks layer on top of the existing 68-row `STORY_EVENTS_RAW` — we DO NOT fork the timeline.
- Existing 8-variant `STORYLINE_VARIANTS` system (`battle.html:37225`) stays alive but defaults to `classic` and is no longer surfaced. Retirement is a separate pass once 3-track is stable.

---

## 1. Anchor map (current, verified)

| Symbol | File | Line | Role |
|---|---|---|---|
| `SAVE_VER` | battle.html | 31509 | save schema version |
| `STORY_EVENTS_RAW` | battle.html | 29247 | 68-row event timeline |
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
| **PR-1** | Save schema bump (v21→v22) + random track assignment + migration | ~150 | low |
| **PR-2** | Event data tables (labels + sceneKey lookups; content from CSVs) | ~300 | low (data only) |
| **PR-3** | Dispatcher wiring + battle intro/outro layer | ~400 | medium |
| **PR-4** | Healing rules + loss penalty (20%) + route fight cap | ~250 | medium |
| **PR-5** | Boss/raid mechanic engine + 3 reusable mechanics | ~500 | medium |
| **PR-6** | Mystery Figure / The First reveal staging (replace 7-identity dispatcher with single voice) | ~200 | low |
| **PR-7** | Anomaly seeding + tests + autopilot extension | ~250 | low |

Total ~2,050 LOC, almost entirely additive + data tables.

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

Display assigned tracks in a single confirm-modal one-liner (no warning glyph — these aren't tone choices, they're plot rolls). Player can re-roll the whole run by hitting "Back" before confirm.

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

### Tests (PR-2)
- `tests/suites/story-beats-table.test.js` — assert every track has all expected slot keys; assert every sceneKey has a `STORY_SCENES` entry.

---

## PR-3 — Dispatcher + battle intro/outro

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
On Hall of Fame (battle.html:~44005), check:
```js
if ((sm.stats.battlesLost | 0) === 0) {
    sm.achievements.noDeath = true;
    _showAchievementBanner('No Death Run', 'Cleared without losing a single battle.');
}
```

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

### Tests (PR-4)
- `tests/suites/healing-rules.test.js` — assert no heal between route fights, heal on city entry.
- `tests/suites/loss-penalty.test.js` — set gold 1000, force loss, assert gold=800, party HP full, returned to last city.
- `tests/suites/no-death-run.test.js` — clear to HoF without losing, assert `sm.achievements.noDeath === true`.
- `tests/suites/route-fight-cap.test.js` — seed villain + extra on Road 5, assert total fights ≤ 4.

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

### Tests (PR-5)
- `tests/suites/boss-hp-threshold.test.js` — damage boss to 49%, assert banner + power-surge fires once.
- `tests/suites/boss-immunity-round.test.js` — advance 5 turns, assert preparation banner at turn 4, immunity at turn 5, damage clamped to 0, status sticks.
- `tests/suites/boss-field-lock.test.js` — start magma boss, assert sun weather locked for 99 turns.
- `tests/suites/raid-hp-scaling.test.js` — 5-mon party vs Marowak mini-raid → HP × 4; vs raid → HP × 5.

---

## PR-6 — Mystery Figure / The First reveal

### Identity dispatcher
Update `_storyEnsureMysteryIdentity` (battle.html:30081):
```js
function _storyEnsureMysteryIdentity() {
    if (!sm.mysteryIdentity) sm.mysteryIdentity = 'the_first';  // hardcoded under 3-track
    return MYSTERY_FIGURE_IDENTITIES[sm.mysteryIdentity];
}
```
Add `the_first` entry to `MYSTERY_FIGURE_IDENTITIES` (30013):
```js
the_first: {
    name: 'The First',
    sprite: 'trainer_self_inverted',   // reuse player sprite, inverted CSS
    nameplate: '???',
    prefightLine: "You're going to win this one. The next one too. That's the problem.",
    /* etc */
}
```

The other 7 identities stay defined but unreachable while 3-track is active (deferred retirement).

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

## 5. Open design calls (flag, not blocking)

| # | Question | Default |
|---|---|---|
| 1 | Villain Story Ending location: Road 7 (CSV) or C9 area (mapping note) | **Road 7** (per flow CSV) |
| 2 | Reward for No Death Run achievement: title / badge / gold bonus | **Title only** (cosmetic) |
| 3 | Random track display on confirm modal: show keys or hide entirely | **Show one-line summary** ("This run: Team Magma · The Hypno") |
| 4 | NG+ track re-roll on the same save: allowed or locked | **Re-rolled on NG+** (matches existing `sm.storyLine` NG+ behavior) |
| 5 | 7 old Mystery Figure identities: retire now or later | **Later** (parked behind `the_first` dispatcher) |

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
