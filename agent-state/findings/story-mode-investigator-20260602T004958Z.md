# story-mode-investigator — deep sequencing + desync audit (re-run)

Read-only. Focus per re-run brief: (1) full sequencing map, (2) the 3 variants,
(3) the desync class (preview vs dispatch; beat-type vs trainer), (4) notification /
event-style consistency. Builds on docs/STORY_OVERHAUL_PLAN.md + the committed
spec-drift / consistency partials (NOT re-filed). The dormant unified-flow engine,
Caged God arc, and Crucible-gate fix are excluded per the brief. Scope: Story mode
(normal) per CLAUDE.md.

---
severity: P1
category: bug
anchor_symbol: _resolveActiveRoadBeats
current_line_hint: ~42126
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4638d3b1dea5
confidence: high
status: open
---

**Title**: Entire MAIN finale (twist + ending) spoils before E1 — 6 league event-beats drain at once

**Evidence**:
```js
// _ROAD_BY_ARRAY_IDX marks E1..E4/Champion/Rival/Mystery all = 'league'.
// MAIN_STORY_BEATS @ league (event-kind): event6, event7, event8, event9, mfReveal, ending.
// _tryFireRoadStoryBeats(ev) at the FIRST league battle (E1, array idx 59):
const queue = _resolveActiveRoadBeats('league'); // → all 6 unfired event beats
_playStoryBeatQueue(queue, 0, () => processNextEvent());   // plays them back-to-back, then E1
// main.event7 body: "After E4, pre-Champion…"   main.event8: "After Champion, pre-Rival final…"
// main.mfReveal: "He says — 'I am The First. You become me…'"  main.ending: "…door…onto the Battle Frontier."
```

**Repro**: Reach City9 → Enter Pokémon League → first event is E1 (idx 59, road 'league'). `processNextEvent` runs `_tryFireRoadStoryBeats` first; `_resolveActiveRoadBeats('league')` returns every unfired event-kind league beat. Player sees event6→event7("After E4")→event8("After Champion")→event9("Hall of Fame closes")→**mfReveal("the face under the cap is yours… I am The First")**→**ending("the door opens onto the Battle Frontier")** — all before fighting E1.

**Blast radius**: The whole League/finale arc. The "it was you all along" twist (`main.mfReveal`) and the post-game ending (`main.ending`) fire BEFORE E1, the Champion, and the Mystery Figure battle. The narrative payoff of the entire main track is destroyed. This is the maximum-severity instance of the maintainer's "what fires ≠ proper order" class. (Supersedes/specializes ledger ISSUE-223, which only counted the clumping.)

**Fix sketch**: Road anchor is too coarse for the league. Either (a) re-anchor event7→after-E4 row, event8→after-Champion row, event9/mfReveal/ending→post-HoF Mystery row (give beats a `rowAnchor` sub-position the dispatcher honors), or (b) gate `_resolveActiveRoadBeats('league')` to fire at most ONE event beat per league battle row in narrative order. mfReveal + ending must fire only after the Mystery Figure (row 67) resolves.

**Verification**: Walk E1→E4→Champion→Rival→HoF→Mystery; confirm event6 fires at E1, event7 after E4, event8 after Champion, and mfReveal/ending only after the Mystery Figure battle — never before.

---
severity: P1
category: bug
anchor_symbol: _resolveActiveRoadBeats
current_line_hint: ~42126
file: battle.html
agents: [story-mode-investigator]
fingerprint: 13be257103c9
confidence: high
status: open
---

**Title**: Villain-track "ending" event fires before the villain boss fight (road7 event-kind drains first)

**Evidence**:
```js
// VILLAIN_STORY_BEATS[track] @ road7 in source/iteration order: event6(event), boss(boss), ending(event).
// _resolveActiveRoadBeats filters to kind==='event' only → returns [event6, ending] in one queue.
function _tryFireRoadStoryBeats(ev){ const queue=_resolveActiveRoadBeats(road); _playStoryBeatQueue(queue,0,…); }
// Played at the first road7 Battle (array idx 48). The boss BATTLE beat fires later via
// _activeBattleBeatForCurrentRow(). So order is: event6 → ending → [boss fight].
```

**Repro**: Any villain track (rocket/magma/…). road7 = array idx 48,49,51,52 (Victory-Road Elites + City8 Gym Trainers). On the first of those, `_resolveActiveRoadBeats('road7')` returns both `event6` and `ending` (both event-kind). They play together; the `boss` battle (Giovanni etc.) only fires afterward through `_activeBattleBeatForCurrentRow`. The arc's resolution prose ("ending") plays before the climactic boss is fought.

**Blast radius**: All 10 villain tracks. The villain arc's conclusion is shown before its boss battle — every run that rolls a villain track (always, since one is rolled at run start) hits this. Same root cause as the league finding (road anchor is the only ordering key; event-beats always precede battle-beats on the same road).

**Fix sketch**: Within a road, the dispatcher must interleave event and battle beats in authored order rather than draining all event-kind first. Give `_resolveActiveRoadBeats` / `_activeBattleBeatForCurrentRow` a shared per-road ordered cursor so `boss` fires before `ending`, OR move `ending` to road8/league.

**Verification**: Run a villain track to road7; confirm event6 → boss fight → ending, in that order.

---
severity: P1
category: inconsistency
anchor_symbol: _storyComputeUpNext
current_line_hint: ~49892
file: battle.html
agents: [story-mode-investigator]
fingerprint: 49f6e139a855
confidence: high
status: open
---

**Title**: "Up next" preview computed from a different model than the dispatcher — ignores all story beats

**Evidence**:
```js
function _storyComputeUpNext(opts){ // postVictory
  const row = STORY_EVENTS_RAW[sm.eventIndex];
  if (row[1]==='Battle'){
    if (_shouldFireWildBeforeBattle(idx) || _shouldFireRoamingBeforeBattle(idx) || _shouldFireCatchTutorialBeforeBattle(idx))
      return { icon:'🌿', text:'A wild encounter on the road' };
  }
  return _storyEventRowToUpNext(row);   // trainer / city / HoF label
}
// But processNextEvent's REAL next step is: _tryFireRoadStoryBeats(ev) FIRST (road event beats),
// THEN enterBattleEvent → cold-open → interrupts → _activeBattleBeatForCurrentRow scene → fight.
// _storyComputeUpNext knows nothing about _resolveActiveRoadBeats or _activeBattleBeatForCurrentRow.
```

**Repro**: Finish any battle whose next row sits on a road with an unfired event-beat (e.g. clearing City1's Gym Leader 1 → next is the road1 basic trainer; road1 has main.event1 + extra.<track>.event1 queued). The victory overlay's "Up next" pill shows "⚔ Basic Trainer — X" (or "🌿 A wild encounter"), but tapping Continue actually fires one or more full-screen story-beat scenes first.

**Blast radius**: Every transition surface that renders the pill (victory overlay @48316, catch screen @50661/51014). The label is structurally a different code path from `processNextEvent`/`enterBattleEvent`, so it is wrong wherever a beat is queued — the canonical "screen says X but Y fires" desync the overhaul targets.

**Fix sketch**: Compute the preview from the SAME resolution the dispatcher uses. Add a `_storyPeekNextDispatch()` that mirrors processNextEvent's order (road event beats → cold-open → interrupt → battle beat → battle/city) and returns the first thing that will actually render; have `_storyComputeUpNext` call it. Long-term: one ordered queue feeds both preview and dispatch (STORY_OVERHAUL_PLAN §4).

**Verification**: For a row with a queued road beat, the pill reads "📖 Story scene" (or the beat title); for a wild-prefixed row it reads wild; for a plain trainer it reads the trainer — matching the literal next screen in every case.

---
severity: P1
category: inconsistency
anchor_symbol: _storyEventRowToUpNext
current_line_hint: ~49922
file: battle.html
agents: [story-mode-investigator]
fingerprint: c55e0a763c3a
confidence: high
status: open
---

**Title**: "Up next" trainer name is the pre-override name — boss beats relabel the trainer after the preview

**Evidence**:
```js
// Preview reads the CURRENT assignment:
const trainerName = sm.trainerAssignments && sm.trainerAssignments[row[0] | 0];
const text = trainerName ? (role + ' — ' + trainerName) : role;
// But enterBattleEvent OVERRIDES it for boss/miniBoss/raid/mysteryBoss beats, AFTER the preview was shown:
sm.trainerAssignments[ev[0] | 0] = _canon;  // BEAT_CANON_TRAINER[sceneKey] e.g. 'Giovanni'
```

**Repro**: On a road7 battle row that will host the villain `boss` beat, the victory pill of the *previous* fight shows the row's generic assignment (e.g. "Elite Trainer — <random>"). When the player arrives, `enterBattleEvent` swaps the assignment to the canon villain ("Giovanni"/"Cyrus"/…) and shows that instead. Preview name ≠ fought name.

**Blast radius**: Every villain boss (10) + mini-boss (10) + the extra-track raids (which substitute a solo legendary, not a trainer at all — the pill still shows the row's generic trainer name). The preview's trainer label is unreliable for exactly the marquee fights.

**Fix sketch**: When peeking, resolve the canon override the same way `enterBattleEvent` does: if `_activeBattleBeatForCurrentRow()` is a boss/miniBoss/raid/mysteryBoss and `BEAT_CANON_TRAINER[sceneKey]` exists, surface that name (or "Raid: <species>" for extra raids) in the pill.

**Verification**: The pill for a boss-beat row names the canon villain (or the raid species); it matches the VS splash that follows.

---
severity: P1
category: bug
anchor_symbol: _tryFireRoadStoryBeats
current_line_hint: ~42327
file: battle.html
agents: [story-mode-investigator]
fingerprint: 721b22bdaa85
confidence: high
status: open
---

**Title**: Road event-beats fire before in-city Gym Trainer / Gym Leader fights, not only on the route

**Evidence**:
```js
function _tryFireRoadStoryBeats(ev){
    if (!ev || ev[1] === 'City') return false;     // only City rows are skipped
    const road = _roadForArrayIdx(sm.eventIndex);  // road = currentGym-based, NOT route-vs-city aware
    const queue = _resolveActiveRoadBeats(road);
    if (!queue.length) return false;
    _playStoryBeatQueue(queue, 0, () => processNextEvent());
    return true;
}
// _ROAD_BY_ARRAY_IDX assigns 'roadN' to EVERY battle between Gym N and Gym N+1 —
// including the in-city Gym Trainer rows and (for the next gym's road) the Gym Leader row.
```

**Repro**: road3 spans array idx 19,20,21,23 — idx 23 is `Gym Trainer 1` *inside* City4's gym. If a road3 event-beat is still unfired when the player reaches the City4 gym, the beat scene plays as a "pre-battle" interrupt to the Gym Trainer fight, i.e. inside the gym rather than out on the road where the prose ("A Rocket grunt at the route stop…") is set.

**Blast radius**: Any beat that survives unfired until the gym (common — beats only fire when the player walks into a battle, and a player may go straight from the route to the gym). The road-flavored prose then plays out of place (in a gym). Pacing + setting mismatch across all tracks.

**Fix sketch**: Anchor road event-beats to actual route nodes only (the first battle of a new route, like `_isFirstBattleOfNewRoute`), or suppress `_tryFireRoadStoryBeats` on Gym Trainer / Gym Leader rows so route prose never plays inside a gym.

**Verification**: Force an unfired road-N beat, walk straight into Gym N+1's trainer fight; confirm the beat does NOT fire there (fires only on the route segment).

