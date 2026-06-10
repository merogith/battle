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
status: fixed-claude/cagedgod-excision
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
status: fixed-main
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
status: fixed-main
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
status: fixed-main
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

---
severity: P2
category: bug
anchor_symbol: _storyComputeUpNext
current_line_hint: ~49892
file: battle.html
agents: [story-mode-investigator]
fingerprint: c6cbf62f71a3
confidence: high
status: open
---

**Title**: In-catch "Up next" says "trainer/wild" but a battle-kind beat scene fires between catch and fight

**Evidence**:
```js
// inCatch branch:
if (_shouldFireWildBeforeBattle(battleIdx)) return { icon:'🌿', text:'One more wild on this route' };
const row = STORY_EVENTS_RAW[battleIdx];
return _storyEventRowToUpNext(row);   // → "⚔ Basic Trainer — X"
// On catch-screen resolution the chain re-enters enterBattleEvent, which (after wilds exhaust)
// fires _activeBattleBeatForCurrentRow()'s scene BEFORE launching the fight. The pill never
// mentions that intervening story beat.
```

**Repro**: On a route that carries both a forced wild and an unfired battle-kind beat (e.g. main.battle1 @ road5, or a villain miniBoss @ road6), the catch screen's pill shows "One more wild" or the trainer label; after the last wild resolves, a story-beat scene plays before the trainer. This is the maintainer's "screen previews wild→rival but the true order is wild→event→rival" pattern.

**Blast radius**: All catch-screen transitions on roads that host a battle-kind beat (road5 main.battle1, road6 villain miniBoss + extra raid/event, road7 villain boss). Narrow vs the postVictory cases but same root model split.

**Fix sketch**: Same as the postVictory desync — route the inCatch peek through a shared `_storyPeekNextDispatch()` that accounts for `_activeBattleBeatForCurrentRow`.

**Verification**: On a road with a battle-beat, the catch pill reads the beat (or "Story scene") when that is genuinely next.

---
severity: P2
category: inconsistency
anchor_symbol: _variantMysteryOutro
current_line_hint: ~32937
file: battle.html
agents: [story-mode-investigator]
fingerprint: 910267b13380
confidence: high
status: fixed-main
---

**Title**: All ~30 per-variant Mystery-Figure outros are dead — keyed by retired identities, never match `the_first`

**Evidence**:
```js
const _MYSTERY_OUTRO_BY_VARIANT = {
  second_sun: { red:'…', cynthia:'…' }, bone_keepers:{ cyrus, ghetsis, lance, red }, … // keys = OLD identities
};
function _variantMysteryOutro(identityKey){ const t=_MYSTERY_OUTRO_BY_VARIANT[(sm&&sm.storyLine)||'classic']; return t? (t[identityKey]||'') : ''; }
// But _storyEnsureMysteryIdentity() ALWAYS returns 'the_first'; showVictoryOverlay calls
// _variantMysteryOutro(sm.mysteryIdentity) === _variantMysteryOutro('the_first') → always '' (no 'the_first' key).
```

**Repro**: `grep -n "_MYSTERY_OUTRO_BY_VARIANT" battle.html`; none of the inner keys is `the_first`. Beat the Mystery Figure on any non-classic variant — the variant outro is always empty, so the overlay falls back to `MYSTERY_FIGURE_IDENTITIES.the_first.outro` regardless of variant. (Confirms ledger ISSUE-107 still present; corrected understanding: variants ARE rolled randomly each run — see the variant-reachability finding — so this dead pool is hit by every non-classic run, not unreachable.)

**Blast radius**: ~30 hand-written per-variant outros (8 variants × 2-4 identities) never display. Dead content + maintenance confusion. Several of these outros (hypnos_lullaby.n: "Walk to the broker", project_mewtwo.cyrus: "magnetic key", lavender_frequency.buried_alive) point at the cut Caged-God arc, compounding the cut-residue issue.

**Fix sketch**: Re-key the table by `the_first` (one outro per variant), or delete the dead table and fold any worth-keeping prose into the single `the_first` identity. Tie to the Caged-God excision (Phase B) — drop the broker/cage-pointing lines.

**Verification**: Beating the Mystery Figure on each variant shows the variant-appropriate outro, OR the dead table is gone and `the_first.outro` is the single source.

---
severity: P2
category: inconsistency
anchor_symbol: _CHAMPION_DIALOGUE_BY_VARIANT
current_line_hint: ~32848
file: battle.html
agents: [story-mode-investigator]
fingerprint: 10765c88017a
confidence: high
status: fixed-main
---

**Title**: Variants are rolled every run (not forced classic) — so variant Champion/post-HoF lines pointing at the dead broker/cage DO fire

**Evidence**:
```js
// startNewRun: storyLine: _readStorylineFromUI()
// _readStorylineFromUI → _tcState.storyline is ALWAYS 'surprise_me' (set @38773; the picker grid
//   _tcRenderStorylineGrid is never called) → _pickRandomStorylineVariant():
const ids = Object.keys(STORYLINE_VARIANTS).filter(v => v.tier !== 'random'); // 8 real variants
return ids[Math.floor(r * ids.length)];   // a real variant, uniformly, EVERY run
// So project_mewtwo / hypnos_lullaby / lavender_frequency Champion outros that say
// "Walk to the broker. They have the Master Ball. End it." fire for ~7/8 of runs.
```

**Repro**: New run → `sm.storyLine` is a random one of the 8 (rarely `classic`). Play to the Champion outro / post-HoF epilogue on `project_mewtwo` — the prose instructs "walk to the broker… enter the cage," but the Caged-God arc is cut (broker/cage unreachable). The earlier consistency-auditor P3 marked this medium-confidence assuming variants might be forced classic; they are NOT — confidence is high and the player-facing impact is ~7/8 of runs, not an edge case.

**Blast radius**: Champion outro (row 64) + post-HoF epilogue for project_mewtwo, hypnos_lullaby, lavender_frequency, static, dead_raticate (and the mystery-outro lines above). The variant arcs' climaxes dangle at a destination that no longer exists, in the large majority of runs.

**Fix sketch**: Part of the Caged-God excision (Phase B): scrub broker/cage references from variant Champion + post-HoF + mystery-outro prose. Until then this is live, high-frequency dead-end dialogue.

**Verification**: No live variant Champion/epilogue/outro instructs the player to visit a broker or cage.

---
severity: P2
category: balance
anchor_symbol: _resolveActiveRoadBeats
current_line_hint: ~42126
file: battle.html
agents: [story-mode-investigator]
fingerprint: cc5df56aa969
confidence: high
status: fixed-main
---

**Title**: Road beat clumping: 2 beats/road (villain road7 = 3, league = 7) play back-to-back, breaking pacing

**Evidence**:
```text
MAIN per-road:    road1:1 road3:1 road5:2 road7:2 road8:1 league:7
VILLAIN per-road: road2:1 road3:1 road4:2 road5:2 road6:2 road7:3
EXTRA per-road:   road1:1 road2:1 road3:1 road4:2 road5:2 road6:2 road7:1
// All tracks fire SIMULTANEOUSLY (one main + one villain + one extra rolled per run), so a single
// road can stack main+villain+extra event-beats: e.g. road5 = main.event3 + villain.event4 + extra.event5
// all drain in one _playStoryBeatQueue before the road's fights.
```

**Repro**: On road5, `_resolveActiveRoadBeats('road5')` aggregates MAIN (event3), the rolled villain (event4) and the rolled extra (event5) — up to 3 unrelated event scenes play consecutively before the player fights anyone. Road7 stacks even more (MAIN event4, villain event6, extra ending).

**Blast radius**: Whole-run pacing. Because beats only fire when the player walks into a battle (not on city exit), they pool up and dump in a wall of overlays. This is the structural cause of ledger ISSUE-223's "6 beats back-to-back," generalized to every road once three concurrent tracks are summed.

**Fix sketch**: Spread beats across the road's multiple battle rows (one beat per battle entry, in priority order), instead of draining the whole road queue at the first battle. The road map already has 3-5 battle rows per road to distribute onto.

**Verification**: Walking a road with 3 queued event-beats shows them spaced across that road's battles, not all at the first fight.

---
severity: P2
category: inconsistency
anchor_symbol: BEAT_CANON_TRAINER
current_line_hint: ~42423
file: battle.html
agents: [story-mode-investigator]
fingerprint: 825b3fd7aee3
confidence: high
status: open
---

**Title**: `battle`-kind beats (main.battle1/battle2) launch a generic trainer, not a themed one — no canon override

**Evidence**:
```js
// enterBattleEvent: canon override only applies to boss/miniBoss/raid/mysteryBoss:
const _isInsertKind = _beatBattle.kind === 'boss' || _beatBattle.kind === 'miniBoss'
                    || _beatBattle.kind === 'raid' || _beatBattle.kind === 'mysteryBoss';
if (_canon && _isInsertKind) { sm.trainerAssignments[ev[0]|0] = _canon; … }
// MAIN_STORY_BEATS has kind:'battle' beats (battle1 @road5, battle2 @road7). Their scene prose
// ("Their team is your starter line plus mons that match yours uncannily") sets up a THEMED foe,
// but the fight is whatever the row's generic _generateBasicTrainer / assignment rolled.
```

**Repro**: road5 fires `main.battle1` ("A wandering veteran… 'You always lose this one.'") — the scene primes a specific eerie doppelgänger fight, but `_activeBattleBeatForCurrentRow` returns kind `battle`, which is NOT in `_isInsertKind`, so no trainer/team is themed. The player fights a random route trainer immediately after the doppelgänger prose. Beat-type ≠ actual trainer — the maintainer's 3(b) class.

**Blast radius**: MAIN `battle1` + `battle2` (every run). The villain `battle1`/`battle2` beats (kind `battle`) likewise theme nothing. Only the boss/miniBoss/raid beats deliver a themed encounter; the lower-tier `battle` beats are prose-only with a mismatched generic fight.

**Fix sketch**: Decide intent: if `battle`-kind beats should be themed, add canon entries + include `'battle'` in `_isInsertKind` (and a `_BEAT_BATTLE_TEAM` for the "mirror your team" main.battle1/battle2 fights). If they're intentionally prose-only, soften the scene prose so it doesn't promise a specific foe. (Comment at ~47468 says battle/miniRaid "keep theme via prose only" — but the prose describes a concrete opponent, so the contract is violated.)

**Verification**: After main.battle1's scene, the fight either matches the prose (themed mirror team) or the prose no longer implies a specific opponent.

---
severity: P2
category: refactor
anchor_symbol: _renderNarrativeOverlay
current_line_hint: ~46830
file: battle.html
agents: [story-mode-investigator]
fingerprint: 20e830d422c1
confidence: high
status: open
---

**Title**: ~12 parallel event-presentation paths with 3 z-index layers and no single registry

**Evidence**:
```text
_renderNarrativeOverlay (z9998)  — cold-opens, 3-track beat scenes, post-battle scenes  [paged, Continue, no auto-dismiss]
showBattleIntro        (z9999)  — bespoke VS splash + quote                               [timed auto-advance 2.2-3.4s]
showVictoryOverlay     (z9999)  — bespoke confetti + up-next pill                         [6s auto-dismiss]
_showStoryTutorialScene         — STORY_TUTORIAL_SCENES, 4-stage animated overlay
_showRoamingLegendarySighting / _showFirstSightingLoreOverlay — bespoke catch cinematics
_showBossBanner / showGimmickBanner — non-blocking flash banners
showGameAlert          (~z1200) — modal alert (anomaly seeds, track rewards)
_storyShowOneTimeTip            — plain-text tip (vs sprite-backed scenes elsewhere)
_maybeShowSaveToast             — "Saved" toast
```

**Repro**: Grep `function (_render|_show|show)\w*(Overlay|Scene|Banner|Alert|Tip|Toast|Intro|Sighting)`. Each surface builds its own DOM with its own z-index, dismissal model (timed vs click vs Escape), and a11y posture. No shared "present this event" entry point.

**Blast radius**: The maintainer's deliverable (4): inconsistent/duplicate presentation. Notably z-order collides — `showGameAlert` (~1200) renders BEHIND `showVictoryOverlay` (9999), the documented NOTIF-1 (anomaly seed / reward toast paints behind the victory card; partly worked around by `{silent:true}` on track rewards, but anomaly seeds @ processNextEvent still use the bare alert).

**Fix sketch**: One event-presentation registry per STORY_OVERHAUL_PLAN §4: `{ type → {renderer, z, dismiss, a11y} }`, with a single `presentStoryEvent(kind, payload, onDone)` dispatcher. Migrate cold-opens/beats/tutorials/sightings/victory onto it incrementally; pick one z-stack.

**Verification**: All story narrative surfaces route through one function; z-index + dismissal + dialog-role are uniform; the alert-behind-overlay class is structurally impossible.

---
severity: P2
category: inconsistency
anchor_symbol: showGameAlert
current_line_hint: ~42319
file: battle.html
agents: [story-mode-investigator]
fingerprint: f31bcfda964b
confidence: medium
status: fixed-main
---

**Title**: Anomaly seeds fire via low-z `showGameAlert` on the same tick as the row's flow — can paint behind/over other overlays

**Evidence**:
```js
// processNextEvent: try { _tryFireAnomalySeed(ev); } catch(e){}   // does NOT early-return
// _tryFireAnomalySeed: window.showGameAlert(seed);   // modal alert, lower z than 9998/9999 overlays
// Then the SAME tick proceeds to _tryFireRoadStoryBeats / enterBattleEvent (which may open a z9998 overlay).
```

**Repro**: Rows 7/14/30/49 carry anomaly seeds. At row 7 (a road1 Basic Trainer), `_tryFireAnomalySeed` shows a `showGameAlert`, then flow continues to enterBattleEvent (cold-open / beat / VS splash at z9998-9999). The seed alert and the subsequent overlay are not coordinated — the seed can be obscured by, or sit oddly alongside, the battle-entry overlay.

**Blast radius**: The 4 anomaly seeds (the deliberate "The First" breadcrumbs). They're meant to be quietly noticed; firing them on the same tick as a battle-entry overlay risks them being missed or overlapped — undercutting the slow-burn payoff that mfReveal pays off.

**Fix sketch**: Route anomaly seeds through the unified presentation registry (above) with a defined layer + sequencing relative to the row's other scenes, or fire them on city-arrival/exit rather than the battle-entry tick.

**Verification**: An anomaly-seed row shows the seed cleanly, sequenced before/after the battle-entry overlay, never overlapping.

---
severity: P3
category: inconsistency
anchor_symbol: showVictoryOverlay
current_line_hint: ~48199
file: battle.html
agents: [story-mode-investigator]
fingerprint: 361a9dacf73d
confidence: high
status: open
---

**Title**: Inconsistent auto-dismiss across scene types — victory 6s timeout vs beat scenes never auto-dismiss

**Evidence**:
```js
// showVictoryOverlay: const autoClose = setTimeout(dismiss, 6000);   // vanishes after 6s
// _renderNarrativeOverlay (cold-opens, 3-track beats, post-battle): NO timer — waits for click/Enter.
// showBattleIntro: setTimeout(callback, isRivalBattle?3400:vsIsMajor?2900:2200);  // forced advance
```

**Repro**: A gym victory card that stacks the leader line + reflection + variant card + cap-teach can exceed 6s of reading and auto-dismisses mid-read (ledger ISSUE-343), while a one-line beat scene waits indefinitely for a click. Three different dwell models across adjacent surfaces in the same flow.

**Blast radius**: Reading/pacing consistency. The biggest narrative moment (victory + variant flavor) is the one that auto-vanishes; quieter beats persist. Inconsistent with the "one consistent flow" goal (deliverable 4).

**Fix sketch**: Standardize dwell behavior in the presentation registry — either all narrative overlays are click-to-continue (preferred for story beats + victory flavor), or the auto-timer scales with text length. Remove the fixed 6s from victory or make it reading-time-aware.

**Verification**: No story overlay auto-dismisses before its text can be read; dwell behavior is uniform by surface type.

---
severity: P3
category: refactor
anchor_symbol: getStoryBeatForRow
current_line_hint: ~41884
file: battle.html
agents: [story-mode-investigator]
fingerprint: ac151dae7911
confidence: high
status: open
---

**Title**: Two disjoint "beat" systems — row-id `STORY_BEATS` (cold-opens) vs sceneKey `*_STORY_BEATS` (3-track)

**Evidence**:
```js
// System A — keyed by ROW ID, drives cold-opens + variant beatOverrides:
getStoryBeatForRow(rowId, ev) → { ...derived, ...STORY_BEATS[rid], ...variant.beatOverrides[rid] }
//   STORY_BEATS = { 68:{coldOpen:'introRival'}, 5..53 gymLeader, 67:{coldOpen:'mystery67'} }
//   STORYLINE_VARIANTS.classic.beatOverrides = { 7:'classic_gym1', 26:'classic_gym4', 56:'classic_gym8', 64:'classic_champion', … }
// System B — keyed by sceneKey + roadAnchor, drives the 3-track event/battle/boss/raid beats:
//   MAIN/VILLAIN/EXTRA_STORY_BEATS → _resolveActiveRoadBeats / _activeBattleBeatForCurrentRow
// The two never reconcile: a row can have a cold-open (System A) AND road beats (System B) with no shared ordering.
```

**Repro**: Read `getStoryBeatForRow` (System A, cold-opens, row-id) vs `_resolveActiveRoadBeats`/`_activeBattleBeatForCurrentRow` (System B, sceneKey/road). enterBattleEvent runs the System-A cold-open first, then (separately) the System-B battle-beat scene; processNextEvent runs System-B event-beats before either. Three independent scene sources feed one battle entry with no unified order.

**Blast radius**: Maintainability + the desync class root. The fragmentation is why preview can't be derived from dispatch (two beat models + the interrupt chain). Directly motivates STORY_OVERHAUL_PLAN §4's "ONE canonical event model / ONE dispatcher."

**Fix sketch**: Long-term, merge into one declarative ordered event list per row/road consumed by a single dispatcher + a single peek (preview). Short-term, document the precedence (System-B event beats → System-A cold-open → interrupts → System-B battle beat → fight) in one place and assert it in a test.

**Verification**: One model resolves "what happens at row N" for both preview and dispatch; the cold-open and 3-track layers are unified or have a single documented, tested ordering.

---
severity: P3
category: dx
anchor_symbol: _storyActiveVariant
current_line_hint: ~41086
file: battle.html
agents: [story-mode-investigator]
fingerprint: 58d14e311a0e
confidence: high
status: fixed-main
---

**Title**: CORRECTION to prior audit: storyline variant is rolled randomly every run, NOT forced to 'classic'

**Evidence**:
```js
// startNewRun (the LIVE path @ ~39414): storyLine: _readStorylineFromUI()
// _readStorylineFromUI: _tcState.storyline is hard-set to 'surprise_me' (@38773); the picker grid
//   _tcRenderStorylineGrid is never called → always the surprise_me branch → _pickRandomStorylineVariant()
// _pickRandomStorylineVariant: returns a uniform pick of the 8 tier!=='random' variants.
// (sm.storyLine='classic' @35258 is ONLY the v17 migration default for OLD saves.)
```

**Repro**: New run; `sm.storyLine` resolves to a random one of {classic, second_sun, bone_keepers, project_mewtwo, hypnos_lullaby, dead_raticate, lavender_frequency, static}. The spec-drift partial (`spec-drift-auditor-...214256Z`, fingerprint e9e4c9139950) states "`sm.storyLine` is forced 'classic' (battle.html:35258)" — that line is the migration default, not the new-run path; the assertion is incorrect for fresh runs.

**Blast radius**: Re-prioritizes several findings. ALL 8 variant prose layers (intro cold-opens, gym cold-opens, champion outros, mystery outros, variant rival quotes, variant gym victory cards) are LIVE and player-facing in ~7/8 of runs — so the "dead variant prose pointing at the cut Caged-God arc" issues are high-frequency live bugs, not dead-code cleanup. The player cannot choose the variant (no picker UI — ledger ISSUE-241), so it is a hidden per-run roll.

**Fix sketch**: No code fix here — this corrects the analysis baseline. Either surface the picker (re-wire `_tcRenderStorylineGrid`) so the random roll is intentional/visible, OR document that variants are an invisible per-run flavor roll. Critically: treat variant prose as LIVE when scrubbing Caged-God references.

**Verification**: Confirm via boot that `sm.storyLine` after a fresh run is frequently non-classic; downstream Caged-God-residue findings are scoped as live.

---
severity: P3
category: inconsistency
anchor_symbol: _storyEnsureMysteryIdentity
current_line_hint: ~33120
file: battle.html
agents: [story-mode-investigator]
fingerprint: d042b79a10dc
confidence: high
status: fixed-main
---

**Title**: Mystery Figure sprite is now `Red` (the_first); the `'Cyrus'` fallback at enterBattleEvent is dead

**Evidence**:
```js
const MYSTERY_FIGURE_IDENTITIES = { the_first: { sprite: 'Red', reveal: 'The First', … } };
function _storyEnsureMysteryIdentity(){ sm.mysteryIdentity='the_first'; return MYSTERY_FIGURE_IDENTITIES.the_first; }
// enterBattleEvent: spriteFile: (_mysteryFinalFace && _mysteryFinalFace.sprite) || 'Cyrus',
//   _mysteryFinalFace is always the_first (sprite 'Red'), so the '|| Cyrus' arm never executes.
```

**Repro**: Reach the post-HoF Mystery Figure (row 67). Sprite is `Red`, not `Cyrus`. The prior audit item "Mystery Figure sprite was unconditionally `Cyrus`" is resolved — it is now unconditionally `Red`. The `'Cyrus'` literal fallback is unreachable dead code.

**Blast radius**: Cosmetic / dead-code only. Worth noting so the prior audit item is closed and the dead fallback removed.

**Fix sketch**: Drop the `|| 'Cyrus'` fallback (the_first always supplies a sprite) or keep as defensive default but update the stale prior-audit note.

**Verification**: Mystery Figure renders the Red sprite; grep shows no live dependence on the `'Cyrus'` fallback.

---
severity: P3
category: bug
anchor_symbol: _pickRandomStorylineVariant
current_line_hint: ~38758
file: battle.html
agents: [story-mode-investigator]
fingerprint: 068158ced84c
confidence: medium
status: open
---

**Title**: Variant roll + Mystery identity use bare `Math.random()` at run construction — non-deterministic across seeded replays

**Evidence**:
```js
function _pickRandomStorylineVariant(){
   const r = (sm && sm.active && typeof storyRngNext==='function') ? storyRngNext() : Math.random();
   …// at startNewRun time sm.active is false → Math.random()
}
// startNewRun: mysteryIdentity: _storyPickMysteryIdentity()  (now constant 'the_first', so benign),
//   tracks: { villain: _pickTrack(VILLAIN_TRACKS), extra: _pickTrack(EXTRA_TRACKS) }  // _pickTrack also Math.random when !sm.active
```

**Repro**: At `startNewRun`, `sm.active` is still false, so `_pickRandomStorylineVariant` and `_pickTrack` fall to `Math.random()`. Two runs created with the same `runSeed` can roll different storyline variants and different villain/extra tracks — the run's entire narrative spine is not reproducible from the seed.

**Blast radius**: Determinism (CLAUDE.md: "Use seeded RNG everywhere user-visible… Deterministic replays are part of the product"). The variant + tracks are the most user-visible run-level choices and they're seeded by wall-clock RNG, so a "replay this seed" can't reproduce the same story. Distinct from ledger ISSUE-105 (Mystery identity, now constant).

**Fix sketch**: Seed the variant + track rolls from `runSeed` deterministically at construction (derive a temp RNG from the freshly-assigned seed before `sm.active` flips), so the same seed yields the same variant/tracks.

**Verification**: Two fresh runs with an identical injected `runSeed` produce identical `sm.storyLine` and `sm.tracks`.

---
severity: P3
category: inconsistency
anchor_symbol: _ROAD_BY_ARRAY_IDX
current_line_hint: ~42098
file: battle.html
agents: [story-mode-investigator]
fingerprint: d0c94030baf0
confidence: high
status: open
---

**Title**: "Reveal lands inside first ~10 minutes" comment is wrong — first villain beat is post-Gym-2 (road2)

**Evidence**:
```js
// Comment @ ~30708: "tracks stay hidden until the first beat fires organically — Road 1 = first
//   extra beat, Road 2 = first villain beat — so the reveal lands inside the first ~10 minutes."
// Road→array-idx map (derived): road1 first Battle = array idx 7 (post-Gym-1 Basic Trainer);
//   road2 first Battle = array idx 13 (post-Gym-2 Basic Trainer).
// So extra.event1 (road1) ≈ after Gym 1; villain.event1 (road2) ≈ after Gym 2 — not ~10 min in.
```

**Repro**: Compare the run-start comment to the road map. The first VILLAIN reveal can't fire until the player has cleared Gym 2 and stepped onto road2 (array idx 13). For a normal player that is well past 10 minutes. Extra-track reveal (road1) is after Gym 1.

**Blast radius**: Doc/comment only, but it misstates a deliberate pacing intent (early hook). If the intent is a genuinely-early reveal, the anchors are too late; if the late anchor is intended, the comment is misleading.

**Fix sketch**: Either move extra.event1 to the pre-Gym-1 route (Road 0, array idx 2 — currently `null` road) and villain.event1 to road1, OR fix the comment to state the real timing (extra after Gym 1, villain after Gym 2).

**Verification**: The reveal timing matches the comment, or the comment matches the road map.

---
severity: P3
category: data
anchor_symbol: ANOMALY_SEEDS
current_line_hint: ~42285
file: battle.html
agents: [story-mode-investigator]
fingerprint: e9994d066619
confidence: medium
status: open
---

**Title**: Anomaly seeds are keyed by row ID but several land on mismatched event types vs their prose

**Evidence**:
```js
const ANOMALY_SEEDS = { 7:"…'Welcome Back.'…", 14:"…Pokédex…YOUR handwriting…",
  30:"An Elite Trainer says, mid-fight: 'Tell The First we said hi.'", 49:"…starter's Pokédex entry…" };
// Row-id 30 = STORY_EVENTS_RAW[idx 30] is 'Gym Trainer 2' at City5 (NOT an Elite Trainer).
//   (Elite Trainer rows are id 34/42/48/49/56-58/60-63.) The seed prose says "An Elite Trainer says…".
// Seeds fire on processNextEvent for ANY type at that row id (no type check).
```

**Repro**: Row id 30 is a City5 Gym Trainer 2 fight, but the seed text attributes the line to "an Elite Trainer." The seed shows on the Gym Trainer encounter. Rows 7/14/49 are Basic-Trainer/route rows; 14's "Pokédex updates" and 49's "starter's Pokédex entry" are fine as ambient tips, but 30's speaker attribution is wrong for its row.

**Blast radius**: Minor flavor mismatch in the deliberate "The First" breadcrumb trail. Row 30's "Elite Trainer" attribution on a Gym Trainer fight is a small immersion break in one of only 4 career-once seeds.

**Fix sketch**: Move the row-30 seed to an actual Elite Trainer row id (e.g. 34 or 42), or reword it to not name the speaker's class. Confirm 7/14/49 land where their prose implies.

**Verification**: Each anomaly seed's prose matches the event type of the row it fires on.

---
severity: P3
category: dx
anchor_symbol: STORY_BEATS
current_line_hint: ~39521
file: battle.html
agents: [story-mode-investigator]
fingerprint: 9b3fe50135f0
confidence: medium
status: fixed-claude/cagedgod-excision
---

**Title**: Row-67 `STORY_BEATS` still tags `'cagedGod'` + coldOpen `mystery67` — stale cut-arc residue in the live beat map

**Evidence**:
```js
67: { kind: 'mystery', tags: ['postHoFMystery', 'cagedGod'], coldOpen: 'mystery67' }
// 'cagedGod' tag survives the v24 arc cut. The coldOpen 'mystery67' still fires before the
// post-HoF Mystery Figure battle (row 67) — verify its prose doesn't promise the cut cage.
```

**Repro**: `grep -n "cagedGod" battle.html` → row-67 beat tag. The Caged-God arc was cut (v24, per STORY_MODE_FLOW §9 + CLAUDE.md) but the tag and the `mystery67` cold-open remain wired to the live row-67 fight. Part of the broader incomplete-excision cluster (see committed spec-drift/consistency partials + STORY_OVERHAUL_PLAN Phase B), surfaced here as a concrete live beat-map entry.

**Blast radius**: Low functional risk (tag is descriptive); but it is live code referencing cut content, and the `mystery67` cold-open prose should be audited for cage/broker promises (cross-refs the variant-dialogue finding).

**Fix sketch**: Drop the `'cagedGod'` tag from the row-67 beat; verify the `mystery67` cold-open prose describes only the shipped post-HoF Mystery Figure climax (no cage/broker). Fold into Phase B excision.

**Verification**: No live beat/tag/cold-open references the Caged God; row-67 cold-open prose matches the shipped climax.

