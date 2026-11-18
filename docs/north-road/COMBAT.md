# Signature battles implementation spec

[Build runbook](../NORTH_ROAD_BUILD_RUNBOOK.md) · [Campaign content](CAMPAIGN.md) · [Save and replay](SAVE_AND_REPLAY.md)

Phase values are implementation defaults. Change them only after the balance gate supplies evidence.

## 1. Order and rules

1. Prove all three Cubone encounters with Grave Guard and actual playable retry.
2. Add Hypno, Trevenant, and Mimikyu. These prove an advertised native move, a removable sustain effect, and a cinematic driven by an actual native ability.
3. Add Yamask, Drifloon, Parasect, and Mewtwo using the same rules and the existing three-tier structure.
4. Add the full Aqua, Magma, and Galactic climaxes, then The First. Other villain bosses and all villain mini-bosses retain their existing mechanics. Their scene and aftermath changes have separate acceptance.

Preserve level 50 with the existing late Exp. Share exception, progression/stat multipliers, city caps, and shared single transformation per side in default Story. Campaign generation selection limits eligible species and forms inside the mixed-generation Story format. Historical Arena rules are independent. Ordinary campaign, early optional Mystery fight, post-Hall climax, Crucible rematch, Frontier, Quick, Local PvP, and Online remain distinct sources for profile selection.

## 2. Data, runtime and view

Author `data/story/boss-profiles.json` keyed by the present scene key and revision. Extend the existing Story data initialization near the `framing.json` request. Use the existing offline assets and boot fallback convention, with a parity test for the profile IDs, mechanics, and actual species when data is unavailable. Single resolution feeds cinematic, roster, and native simulator.

Example payload for the pilot:

~~~json
{
  "schema": 1,
  "sceneKey": "extra.cubone.raid",
  "revision": 1,
  "foeSlot": 0,
  "phases": [
    {
      "id": "graveGuard",
      "trigger": { "kind": "hpCross", "percent": 50 },
      "effect": {
        "kind": "categoryWard",
        "completedTurns": 2,
        "reductionPercent": 25,
        "fallbackCategory": "Physical"
      },
      "cue": "graveGuard"
    }
  ]
}
~~~

Allowed triggers are HP crossing, first positive opposing direct hit, first native Disguise break, completed native turn, ally-KO count, and a fixed turn cadence. Allowed effects are category ward, next-hit ward, one scheduled native move, opening native weather, and a narrative cue. Most profiles reuse the scheduled move effect. Status, duration, and ownership are finite configuration fields. Scripted actions name canonical move IDs and never include functions or executable content. Validate integers, uniqueness of IDs, phase order, scene, revision, known actor, and known legal moves at construction and restore.

| Surface | Implementation point |
| --- | --- |
| Story run assignment and `enterBattleEvent` | Resolve eligible arc and current beat. For profiled fights, resolve and apply the existing move gate to the actual roster before showing an actionable intro. Freeze it with the profile. The cinematic reads the same resolved or frozen roster. Preserve row IDs, reward path, and current order of route interrupts. |
| `battle.html` `startBattle` and `nativeBattleRules` | Attach a resolved profile as `rules.boss.profile` for the precise Story source. Curated profiles bypass `_rollRaidPhaseEffects` and the old phase dispatcher. Keep legacy effects for unprofiled fights. Do not resolve title, battle mode, and gameplay effect independently from the trainer’s identity. |
| `scripts/competitive/classic-boss-rules.mjs` | Attach custom native callbacks once through the existing constructor/restore seam. Store serializable state in `battle.classicBoss`. Keep the current legacy effect implementation. |
| `scripts/competitive/classic-simulation.mjs` | Preserve rules in the native snapshot and attach the hooks in constructor and `fromSnapshot`. Include queued actor, category, stage, remaining turns and last completed native turn in the serializable battle state. |
| `scripts/competitive/classic-events.mjs` and `applyNativeBattleView` | Keep the existing `boss-phase` protocol’s first payload fields (phase, banner, effect, plain text). Add optional stable phase and structured state. State drives the existing persistent chips. Sounds and story animations respond to events. Preserve keyboard operation, expanded detail, and accessible status announcements. |
| `pickNativeFoeChoice` | Resolve forced replacement first. If the current live actor has the announced move in its native p2 request, use its legal slot for that one turn before voluntary switch, item, or form choice. Keep normal AI for all other turns and unavailable scripts. The planned move follows native priority, miss, ability, PP, status, and forced choice behavior. A move’s suggestion cannot use the pending player choice. |

The additive native view supplies `profile: {sceneKey, revision}` and `phases: [{id, status, category?, moveId?, remainingTurns?, ownerSlot}]`. Status is pending, active, or expired. Emit a readable interruption event if a previously named move cannot legally begin. Avoid repeat telegraphs, false previews, or generic fallback banners. Use actual remaining completed turns, with no CSS timing or request-count inference.

The turn wrapper captures threshold and scheduling conditions before calling native `endTurn()`. After that call publishes the real next move request, resolve any advertised candidate against that request before exposing the new view. Do not evaluate legality from the stale previous request. Applying a move at submission rechecks the current actor and request as well. Keep outcome transitions in the driver, and make reading `view()` free of game-state changes.

If native startup fails for a profiled battle, keep its save lock, inventory, and progression. Offer retry or return to the nearest safe existing route/city action without counting defeat or a retreat fee. A profiled fight must run its promised rules. Preserve the existing compatibility fallback for unprofiled fights.

## 3. Grave Guard rules

- **Detect damage.** Record starting HP for the configured p2 actor at native turn start. Capture the last positive opposing direct hit in that turn via the installed simulator’s `DamagingHit` event. The event supplies actual positive HP damage and the resolved active move. An in-memory probe confirmed attacks into Substitute do not trigger it and a later real hit does. Exclude own-side hits, status, weather, poison, hazards, recoil, item and ability effects, delayed Future Sight/Doom Desire resolution, and special OHKO moves. Fixed damage and Counter-like direct attacks qualify when they damage actual HP. Use the resolved Physical/Special category, including the actual Z/Max action when relevant.
- **Detect crossing.** Install an additive non-enumerable instance wrapper before the simulator’s native `endTurn()` constructs the next actionable request. Residual effects, multihits, and required replacements have resolved. Skip the initial turn-zero invocation and an ended battle. Trigger once when the live target started the completed turn above threshold and ends at or below it. A heal back above during the turn suppresses the trigger. Crossing and later taking different qualifying damage in the same turn uses the last qualifying category. Residual-only crossing is explicitly Physical. Test Dynamax-form rounding against the threshold shown in HUD. A lethal crossing does not grant a phase.
- **Announce and tick.** The next regular request shows the pending category and duration. Activate at native `BeforeTurn`, before actions. At the end of each full native turn decrease the displayed future count, not at replacement or while menus render. Voluntary switch and ordinary Bag pass use a turn. A required replacement or U-turn prompt alone does not. If the targeted boss faints, expire silently on battle end or clear with a normal expiry event if the battle continues. Never give its guard to a replacement.
- **Apply reduction.** Use a native incoming `Damage` callback scoped to the exact p2 slot and matching resolved category. Work after ordinary calculation and before Sturdy/Focus Sash survival. Apply `max(1, floor(damage * 0.75))` to positive damage and preserve zero. This explicitly includes eligible fixed-damage attacks, so matching 50 becomes 37. Special OHKO moves, indirect damage, misses, immunity, Protect and Substitute retain native mechanics. Do not add another reduction in the old `applyClassicBossDamage` path. An ability that prevents damage still prevents it.
- **Show counterplay.** Pending says **Next turn · Physical guard** or **Next turn · Special guard**. Detail names Marowak, 25%, duration and the player’s choices. Offer a known legal alternate category if present. A one-category team can keep attacking, switch or use the opening to prepare. The active chip shows future actionable turns. Use the actual event for the single expiry log and clear the chip.

An example trace on Road 6 is turn start above 50, a Special hit takes it to 48, then the next native request contains Special guard pending for two turns. The player may use Physical on the active turn or use a turn to swap. After the first complete guarded turn the chip says one turn, and after the second it disappears. The result and timing are the same on a continued native snapshot.

## 4. Authored encounter matrix

Use the existing species and stage anchors. Road 4 is `miniRaid`, Road 5 is `miniRaid2`, and Road 6 is `raid`. “Queue” means a readable advance warning at the previous turn boundary followed by an ordinary p2 move selection if still legal. If the gate removes a specifically named Story move, use only an authored candidate which survives the same gate. If none remains, render a narrative cue and ordinary AI. Do not advertise a move that cannot be attempted. A known legal move can miss or be interrupted and receives no extra PP.

| Family and actor | Road 4 teaches | Road 5 practices | Road 6 pays off | Counterplay |
| --- | --- | --- | --- | --- |
| **Cubone → Marowak → Marowak** | 50% one-turn category ward. | 60% two-turn ward. | Grave Guard at 50% for two turns. | Alternate category, heal, switch, or play through the 25% reduction. |
| **Yamask → Cofagrigus → Yamask** | After its first actual direct hit, Relic Guard wards the next positive direct hit by 25% over the next turn. | 60% trigger, next successful hit over two turns is reduced 25%. | 60% trigger, next successful hit over two turns is reduced 50%. | Spend it on a weak hit, use later hits of a multihit, or take the status/setup window. Only a qualifying actual positive HP hit consumes it. |
| **Hypno ×3** | Queue native Hypnosis after turn 1 if retained, with a field cue. | Queue once at 60%. | Queue once at 50%. Hypnosis is the sole authored sleep move and the build uses ordinary attacks. | Player reads the known move’s risk, switches to an eligible partner, Protects, prepares recovery, or attacks. |
| **Phantump → Trevenant → Trevenant** | Queue native Leech Seed after turn 1. | Queue at 60%. | Queue once at 50%. Sustain depends on the native seed condition. | Grass immunity, a legal blocker, switching out of the condition, or racing damage. No additional forced regeneration. |
| **Mimikyu ×3** | Foreshadow and show the actual Disguise break. | Add a brief stage reaction at the actual break. | The actual break advertises one available Ghost attack on the next full turn, preferring Shadow Claw and then a retained authored attack. | Native absorption, immunity, bypass, substitute, recoil, and HP results stay native. No forced form transformation or restored costume. |
| **Drifloon → Drifblim → Drifblim** | Queue Tailwind after turn 1. | Queue at 60%. | Queue once at 50% with native Tailwind duration visible. | Use priority, defend, switch to a safe speed matchup, or wait out the visible window. Defog is no counter to Tailwind. |
| **Paras → Parasect → Parasect** | One announced Spore attempt after turn 1 when this stage permits it. | Queue at 60%, then ordinary attacks. | Queue once at 50%. Spore is its only sleep move and the build retains reliable attacks. | Grass/powder immunity, safe pivot, normal preparation, damage pressure or cure. A failed attempt consumes the authored attempt. |
| **Mewtwo ×3** | After turn 1, advertise Psybeam or an available weaker Psychic-type attack. | At 60%, Psychic or retained lower-power attack. | Once at 50%, advertise Psystrike/Psychic and follow it with one clearly shown legal Calm Mind recovery beat when available. | Resistance, immunity, setup, or pressure in the recovery beat. If Calm Mind is unavailable, show no recovery promise and let ordinary AI act. |

Mimikyu’s branch follows the actual profile-owned p2 form transition to Busted form. A miss, native immunity, an intact substitute, copied appearance, or ability bypass must not fabricate a break. Announce only once, after the existing native event. The guarded mitigation and spend events for Yamask use the same positive direct-hit conditions as Grave Guard. Spend on the first qualifying actual hit, so a shield, Substitute, or immunity that prevents all HP loss does not consume it.

| Selected climax | Rule | Acceptance |
| --- | --- | --- |
| **Aqua** | Existing opening native Rain. After the first foe faint, if Rain was displaced and the new active has legal Rain Dance, advertise one attempt to restore it. | Ordinary contestable Rain. No perpetual reapplication, pending script from a benched actor, or promised move when Rain already holds. |
| **Magma** | Existing opening Sun. After the first foe faint, advertise one Solar Beam from the active when its legal request permits it. | Sun may change before resolution. Charging, immunity, speed and item interactions retain their native behavior. Copy explains the weather dependency. |
| **Galactic** | Once after the first completed turn with a foe fainted, advertise one available Trick Room when that condition is absent. | Ordinary move priority and dimensions. Do not add Trick Room without using its native move. If the actor changed or the condition already holds, gracefully drop the script. |
| **The First** | Only at the real post-Hall climax, before turns 5, 10, 15 and so on, preview a legal unconditional damaging attack from the current active’s retained moves. Pick from authored candidates in stable order, then eligible move slots. On the following recovery turn choose one retained legal status/setup move if available. This replaces the legacy Story-only ward, regen, and immunity cycle for this profile. | No knowledge of the player’s unsubmitted move or hidden input. Compare late challenge and time to finish with the baseline. The City 8 optional fight and ordinary Crucible rematch keep distinct configuration. |

The faction actor must learn its special move and have it available under city restrictions and current rules. Add no artificial turn or move to an illegal actor. Tactical previews omit the selected move when ordinary AI is the fallback. For The First preserve the actual foe identity, late roster and reveal/retry routing. Legacy locked fights keep their former mechanics as described below. Tune authored fights without changing global enemy strength.

Candidate existence was checked in the pinned simulator’s learnsets for Hypno/Hypnosis, both tree actors/Leech Seed, both balloon actors/Tailwind, both mushroom actors/Spore, Mimikyu/Shadow Claw and Shadow Sneak, Mewtwo/Psybeam, Psychic, Psystrike and Calm Mind, Sharpedo/Rain Dance, Camerupt/Solar Beam, and Bronzong/Trick Room. These are sources for candidate construction. The per-city Story gate and actual legal-build fixture remain authoritative.

## 5. Generation eligibility and persistence

1. Resolve `eligibleExtraTracks(storySettingsGens())` in existing stable arc order. For v1 require all three existing actors in a family to be eligible. No substitutions without authored compatible versions. Expected single-gen pools are Gen 1 = Cubone, Hypno, Parasect and Mewtwo. Gen 4 = Drifloon. Gen 5 = Yamask. Gen 6 = Phantump. Gen 7 = Mimikyu. Gen 2, 3, 8 and 9 are empty. Validate actual species/form entries in the canonical data. Non-contiguous selection uses the eligible union. Keep one assignment RNG draw even on an empty pool to preserve unrelated initial RNG draw order.
2. Use explicit `tracks.extra = null` for a valid empty result. Update new-run creation and migration/safety backfills to distinguish absent from null. Missing legacy metadata is normalized once using a row-scoped seed without consuming saved world draws on load. Old incompatible arcs with completed material keep their archive and rewarded outcomes. Future unavailable battles use the ordinary eligible road encounter and, if needed, a neutral one-line observation. Open Circle and badge progress stay reachable. New all-gen saves retain the same ordered pool and one draw.
3. Validate the actual pre-lock roster and move candidates against established species, form, gimmick budget, city, stage, learnset, ability, and item rules. The current fixed raid species path can bypass species generations, and the simulator’s `teamSet` checks existence. Story also needs its campaign learnset check. Reuse Story’s legality helpers and base-gen rules. Do not interpret a restricted species pool as older battle mechanics or create a second model of move legality. Keep at least one unconditional legal attacking move in every foe build, or two where the family explicitly asks for reliable attack coverage.
4. Store optional `currentEnemyLock.bossProfile` with the canonical scene key, source or encounter scope if needed, expected actor, revision, and frozen validated phase data. Script moves also remain in the existing saved `team`. Keep the current convention of `eventIdx` as array index, and the native seed derived via the stable story row ID. Prove the current row-seeded path preserves an exact retry before adding a seed field. A fresh curated profile spends no random phase draws. The current retry branch replaces the whole lock when refreshing `team`; preserve its validated extra metadata in that branch.
5. A pre-update lock with missing profile metadata runs the legacy encounter and its exact existing roster for that one lock, including any old incompatible species. Subsequent encounters obey the new filter. Invalid optional profile metadata gets a controlled legacy rules fallback if the roster itself is valid. The profile revision is locked for that encounter and never silently swapped. If authored native startup fails, use the retry/safe-return flow above.
6. Story refresh, retry, and retreat use the existing saved **pre-fight** checkpoint and bag policy. They do not restore active cooldowns mid-turn. Give the same input sequence to the completed reload/retry and compare its outcomes. Exact continuation from a native standalone snapshot is a separate case. Include `battle.classicBoss` state and validated rules in native snapshot data, reacquire callbacks once, and preserve existing v1 snapshots with absent authored fields.

**Source anchors:** [Native rule bridge](../../battle.html:22018) · [Story start](../../battle.html:22631) · [Run tracks](../../battle.html:52668) · [Family species](../../battle.html:54867) · [Raid pool](../../battle.html:55303) · [Foe move gate](../../battle.html:61708) · [Encounter lock](../../battle.html:63637) · [Retry and checkpoint](../../battle.html:64414) · [Classic simulation](../../scripts/competitive/classic-simulation.mjs) · [Classic boss rules](../../scripts/competitive/classic-boss-rules.mjs)

## 6. Test matrix

Extend existing tests. Record the scenario, exact seed, production row ID and array index, active settings, legal roster provenance, choices and native state. A staged Road 6 acceptance party must be earned through normal progression or reconstructed from a verified attainable save. The current browser phase fixture uses extra HP and remains a UI regression test. Do not use inflated stats or controlled victory as evidence of a fair boss.

For the isolated native capture case, the in-memory probe used seed `1,2,3,4`, level-50 Mew with Protect, Seismic Toss, and Psychic, and level-50 Blissey with Substitute and Splash. Protect versus Substitute created the shield. Two Seismic Toss hits removed it with no true-damage event. The next Toss produced 50 Physical damage, then Psychic produced 40 Special damage. This gives a deterministic unit recipe for the native integration independently of campaign-party availability. The production legal-party fixture still comes from an actual route or a validated save.

| Case | Arrange and act | Expected |
| --- | --- | --- |
| **COMBAT-01 Native hits** | Test physical and special attacks, Substitute, Protect, forced miss, type and ability immunity, poison, recoil, delayed Future Sight, and available transforms. | Record category only on qualifying actual HP hits using the resolved native category. |
| **COMBAT-02 Threshold order** | Cross then heal above in one turn, cross with residual later, land exactly at 50%, KO on crossing, cross with ordered multihit. | No trigger above threshold. Residual queues Physical. Exactly 50 qualifies. Lethal skips. The alive boss queues once. |
| **COMBAT-03 Arithmetic** | Seeded matching/alternate attacks, one-point hit, fixed 50, possible OHKO, Sturdy and Focus Sash. | Matching damage reduced once with minimum one. Fixed 50 becomes 37. Native OHKO and survival work as specified. |
| **COMBAT-04 Timers** | Setup, voluntary switch, U-turn requiring a choice, normal Bag pass, required replacement, menu reopen. | Completed native turns tick once. Replacement prompts do not. Requests and HUD agree. Cleanup on ending. |
| **COMBAT-05 Exact native snapshots** | Persist pending, active with one turn left, and inside replacement. Resume identical input path. | Same normalized state and winner, same structured event semantics, no duplicate hook/phase. Legacy snapshots restore. |
| **COMBAT-06 Actual campaign** | Enter through Road 6, win with mixed category, win with same category, lose, retry, reload after telegraph and after item use. | Same frozen roster, plan, and retry actions. No seed drift, item duplication, or extra rewards. |
| **COMBAT-07 Restricted pools** | Enumerate all 24 profiles, selected faction ones, nine single gens, all, sparse 1/7 and 3/8, default forms and forms off. | Legal species, moves, ability, and item. Empty optional pool stable. All mandatory progression reachable. Intro species matches actual roster. |
| **COMBAT-08 Staged native abilities** | Hypnosis out of PP, Taunt, flinch and failed accuracy. Leech Seed then switch. Actual Disguise, immunity and Substitute controls. Tailwind expiry. Spore versus Grass/powder immunity. | One legal attempt when possible and standard move results. Correct order, no repeated sleep forcing, and no fabricated form break. |
| **COMBAT-09 Fields and final** | Change Aqua/Magma weather, change planned actor, already-active Trick Room, and finish The First’s real post-Hall route with both saved replies and one loss/retry. | Weather and turn order stay native. Names, interrupted cue and actual action agree. Both ending branches and rewards commit once. |
| **COMBAT-10 Mode isolation** | Same actor in Quick AI, local/online native room, ordinary Frontier, and historical Arena. | No new Story profile or mode regression. Record unchanged native replay and form usage. |

Pilot balance requires two complete native wins with ordinary attainable party setups, including a one-category team. Evaluate six deterministic attainable seeds before touching global values. Track tight wins, ordinary retry and extreme stall. Adjust an authored phase or foe if the supposed counterplay is inaccessible. Test the cues with touch and keyboard, 320-pixel portrait, short landscape, tablet and desktop, reduced motion, speed-up, muted cues, and enlarged text.

Existing entry points are [native boss tests](../../tests/integration/classic-boss-rules.test.js), [scenario tests](../../tests/integration/classic-scenario-rules.test.js), [Story phase browser tests](../../tests/visual/story-boss-phases.mjs), [retry browser tests](../../tests/visual/story-retry-save.mjs), [form budget](../../tests/suites/story-battle-form-budget.test.js), and [playtest workflow](../PLAYER_PLAYTEST.md). After implementation rebuild the native bundles with `npm run build:competitive` and again prove the packaged path.
