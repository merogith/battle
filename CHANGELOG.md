# Changelog

All notable user-visible changes land here. Sessions append entries under
`## Unreleased` and a date/branch heading.

## Unreleased — Character creation is now sprite-based, not gender-based 2026-05-18 (`claude/sprite-based-characters-VfHkk`)

### Changed — New Adventure: removed Boy/Girl picker, added Prev/Random/Next sprite browser

The "1 — Your trainer" panel used to make players pick a gender first
(Boy → Red.png pool / Girl → Leaf.png pool) before choosing a sprite,
which served no mechanical purpose — gender wasn't passed to anything in
battle, online play, or the Hall of Fame UI, so the choice was a
decorative gate that funnelled players into one of two narrower rosters.
The new flow lets the player browse a single 71-entry trainer-sprite
pool directly:

* The `Boy` / `Girl` radio row is gone. In its place the Trainer-look
  field now exposes three buttons: `◀ Prev`, `🎲 Random`, `Next ▶`.
  Prev/Next wrap around the pool so it's quick to scan; Random rolls
  any other sprite (never the current one).
* `TRAINER_SPRITE_POOL_M` and `TRAINER_SPRITE_POOL_F` were merged into a
  single curated `TRAINER_SPRITE_POOL` led by the iconic Gen 1–7 player
  avatars (Red, Leaf, Ethan, Kris, Brendan, May, Lucas, Dawn, Hilbert,
  Hilda, Elio, Selene) and rounded out alphabetically with 57 trainer
  classes (Ace Trainers in both Snow variants, Aroma Lady, Battle Girl,
  Blackbelt, Cooltrainers, Cyclists, Hex Maniac, Lass, Picnicker,
  Psychics, Rising Stars, Veterans, …). The new default is `Red.png` —
  the first entry in the pool — used as the reset target when an old
  saved sprite filename fails to load.
* While auditing the pool I caught that the two old gender-split arrays
  referenced 16 filenames that didn't actually exist in
  `sprites/trainers/` (e.g. `Pokemon_Breeder.png`, `Karate_King.png`,
  `Schoolgirl.png`, `Snowboarder.png`, `Twin.png`, `Lass-JPN.png`,
  `Madame.png`, …). The runtime `onerror` handler was silently
  rerouting those to the default sprite, so hitting Random had hidden
  dead-end picks. The new pool only contains files that exist on disk,
  with the typo'd entries swapped for their real-world counterparts
  (`Blackbelt.png`, `Poke__0301mon_Breeder.png`,
  `Poke__0301mon_Ranger.png`, `Poke__0301_Maniac.png`, `Twins.png`,
  `School_Kid{,~F}.png`, etc.).
* `gender` is no longer written to `sm.trainerProfile`, the
  cross-run `pbs_story_meta.trainerProfile`, the pending payload that
  feeds `startNewRun`, or new Hall-of-Fame records (`trainerGender` is
  removed from the HoF record schema). Existing saves that *do* carry a
  `gender` field still load fine — it's simply ignored now, and any
  rewrite drops it.
* Removed: `trainerCreateSetGender`, `trainerCreateUseDefault`,
  `_trainerPoolForGender`, `_tcSyncGenderButtons`,
  `TRAINER_DEFAULT_M`, `TRAINER_DEFAULT_F`, the
  `.story-create-gender-row` / `-btn` / `-icon` CSS class block, and the
  two `#story-create-gender-{m,f}` buttons from the screen markup.
  Added: `trainerCreatePrevSprite`, `trainerCreateNextSprite`,
  `_trainerStepSprite`, a single `TRAINER_DEFAULT` constant.
* The "Default" button was removed alongside the gender row — without a
  per-gender default it didn't carry a clear meaning, and Prev/Next/
  Random already cover every navigation need.

Touched: `battle.html` — trainer-create section markup (~line 6815–6837),
`.story-create-gender-*` CSS block (removed around line 5536), trainer
pool / state / handlers (~line 29845–30015), `confirmTrainerAndStart`
pending payload (~line 30072), `startNewRun` trainer-profile defaults
(~line 30378), `_storySaveTrainerProfile` (~line 27666), HoF record
creation (~line 27649), the resume-card sprite fallback (~line 37183),
and the `window.StoryMode` export list (~line 40101).
## Unreleased — Story-embedded tutorials replace one-time alerts 2026-05-18 (`claude/add-tutorial-events-EIPjH`)

### Added — `STORY_TUTORIAL_SCENES` data table + `playStoryTutorial(id)` dispatcher

The previous first-time tutorial layer was a bare `window.showGameAlert`
modal — useful, but jarring against the story-mode framing where every
other narrative beat (intro rival, gym victories, Hall of Fame) gets
sprite + dialogue treatment. Each new mechanic now opens with a one-shot
character cameo: NPC sprite slides in from the lower-left, nameplate
fades on, dialogue box pops, Continue → dismisses and the player drops
into the live screen.

14 scenes shipped, one per first-encounter mechanic. Sprite picks reuse
the existing trainer roster (no new art):

| Scene | Sprite | Fires at | Replaces tip |
|---|---|---|---|
| `firstTrainerBattle` | Oak | first `showBattleIntro` (intro rival) | `first-battle` |
| `firstWild` | Oak | first catch-tutorial encounter | `catch-tutorial` |
| `firstWildRoute` | Oak | first route-node wild | `catch` |
| `firstSafariCatch` | Hiker | first Safari Zone encounter | `safari-catch` |
| `firstMart` | Clerk | first Pokémart | `first-mart` |
| `firstDept` | Clerk-2 | first Department Store (City 6+) | `first-dept` |
| `firstSafari` | Hiker | first free Safari Zone entry (City 4) | (free-entry alert) |
| `firstCasino` | Gambler | first Poké Casino (City 5) | `first-casino` |
| `firstPokemonCenter` | Nurse | first Pokémon Center | `center` |
| `firstMoveTutor` | Veteran | first Move Tutor | `first-tutor` |
| `firstNatureRater` | Aroma_Lady | first Nature Rater | `first-nature` |
| `firstBattleDojo` | Blackbelt | first Battle Dojo (City 4+) | `first-dojo` |
| `firstEVTrainer` | Battle_Girl | first EV Trainer (City 4+) | `first-ev` |
| `firstColress` | Scientist | first Colress (City 6+) | `first-colress` |

### Stage alignment — automatic via city-action gating

Each mechanic is already stage-gated by the city's action list in
`STORY_EVENTS_RAW` (see `STORY_MODE_FLOW.md` §15f), so first-interaction
firing aligns with the power-stage rollout without any new gating logic:

- **Stage 1 (pre-G3)** — `firstTrainerBattle` (intro rival), `firstWild`
  (catch tutorial after intro rival), `firstWildRoute` (any route
  beyond), `firstMart`, `firstPokemonCenter`, `firstMoveTutor`,
  `firstNatureRater`
- **Stage 2 entry (City 4)** — `firstBattleDojo`, `firstEVTrainer`,
  `firstSafari` / `firstSafariCatch`
- **Stage 2 (City 5)** — `firstCasino`
- **Stage 3 (City 6)** — `firstDept`, `firstColress`

### Sequencing — battle intro gated on tutorial dismiss

`showBattleIntro` previously fired the alert tip and the intro overlay in
parallel, with a `setTimeout` ticking the battle off behind the alert
modal. The tutorial scene is animated and longer to read, so the rest of
the intro now sits behind a `playStoryTutorial('firstTrainerBattle',
_runIntro)` callback — the trainer-sprite overlay and the 2.2-3.4s
delayed `launchBattle` only fire after the player taps Continue. Subsequent
fights see no delay (dispatcher fires `onDone` synchronously on the
dedupe path).

### Dedupe — shared `tipsShown` bucket

Each scene declares its own `metaKey` (`tutorial-first-*`); the
dispatcher stamps `tipsShown[metaKey]` in `pbs_story_meta` on first
play. The keys are deliberately distinct from the legacy alert keys
(`first-mart`, `center`, etc.) so existing saves see the new scene once
even if they'd seen the prior alert — a one-time enriched onboarding,
then quiet.

### Animation — three keyframes, staggered entry

CSS additions (~70 lines, inline near the existing storyfx animations):
`storyTutorialOverlayIn` (0.32s background fade), `storyTutorialSpriteIn`
(0.55s cubic-bezier slide-in for the NPC), `storyTutorialNameIn` (0.4s
fade for the nameplate + Continue button, delayed 0.25s and 0.7s
respectively), `storyTutorialDialogIn` (0.5s pop for the dialogue box,
delayed 0.4s). Total entry choreography ≈ 1.1s before the player can
read the full scene.

### Files touched

- `battle.html` — CSS keyframes (~70 LOC), `STORY_TUTORIAL_SCENES` data
  table + `_showStoryTutorialScene` / `playStoryTutorial` helpers
  (~180 LOC, near `STORY_COLD_OPENS`), 8 entry-point rewrites
  (`enterShop`, `enterSafariZone`, `enterCasino`, `enterPokemonCenter`,
  `enterTutor`, `enterColress`, `enterEVTrainer`, `_catchRender`,
  `showBattleIntro`), one export added to `window.StoryMode`
  (`playTutorial`).
- `CHANGELOG.md` — this entry.

## Unreleased — Wild & Safari catch curve shifted one tier easier 2026-05-18 (`claude/improve-pokemon-catch-rates-E1Y8U`)

### Changed — Base catch rates lifted one grade across the board

The previous tightening pass (the v15 → v16 rebalance) left G3 and G4
encounters reading as "you still might bounce three Ultra Balls off this
Bidoof," which doesn't match what those tiers are supposed to feel like —
G4 is supposed to be the trivial filler tier, and G3 the mid-game routine
catch. Each grade now adopts the *next* grade's old base rate, and G4 gets
a fresh, deliberately lenient ceiling:

| Grade | Old base catch | New base catch | Old flee on miss | New flee on miss |
|---|---|---|---|---|
| G1 | 4% | **12%** | 55% | **40%** |
| G2 | 12% | **22%** | 40% | **28%** |
| G3 | 22% | **35%** | 28% | **20%** |
| G4 | 35% | **50%** | 20% | **12%** |

The shift propagates through the existing `_CATCH_RATE_BY_GRADE` /
`_CATCH_FLEE_BY_GRADE` lookups, so wild routes, Safari encounters, boss
arena phase-2, and roaming legendaries all pick up the new curve from a
single source. Ball multipliers (Poké 1.0× / Great 1.5× / Ultra 2.0× /
Master ∞) and Safari extras (`SAFARI_BALL_MULT 1.35×`, bait 0.70× catch /
0.55× flee, rock 1.65× catch / 1.70× flee) are unchanged — the bump comes
purely from the species base, so the Safari mini-game still trades the
same way, just on a friendlier baseline.

Sanity check on the new ceiling: G4 × Great Ball = 75%, G4 × Ultra = 100%
(capped), G3 × Ultra = 70%. Great Ball stays meaningfully better than
Poké on G4 instead of both balls capping, which was the alternative if
we'd pushed G4 to 55%+.

Touched: `battle.html` lines 33896-33897 (constants), line 8374 (Help
overlay copy), `STORY_MODE_FLOW.md` §5 catch-rate table. The stale
v15→v16 comment block above the constants was removed — the numbers are
the spec.

## Unreleased — Route pacing: 2 wilds per route + "Up next" hints across transitions 2026-05-18 (`claude/improve-game-flow-s723x`)

### Changed — Wild encounters now fire two-in-a-row per route node

Leaving a city to reach the next one used to surface a single wild
encounter before the trainer battle. One wild felt thin once the player
learned the beat — the loop barely had room to breathe between "click
Continue Route" and the foe portrait. Now each route node fires
**`STORY_WILDS_PER_ROUTE_NODE` (= 2)** wilds back-to-back before the
trainer fight. Each wild is rolled independently from the wild grade
curve, so the two species are usually distinct.

How it's wired:

* `sm.wildSeenByEventIdx[battleIdx]` is now a **count** (legacy boolean
  `true` reads as 1, so saves mid-route on the previous version don't
  re-fire a wild they already cleared).
* `_shouldFireWildBeforeBattle` returns `true` while the count is below
  `STORY_WILDS_PER_ROUTE_NODE`.
* `_runFirstStoryInterrupt` honors a new `chainAfter: true` flag on the
  `wildRoute` entry — it re-enters `enterBattleEvent(ev)` *without* the
  `_wildAlreadyChecked` short-circuit, so the interrupt chain re-runs
  and fires the next wild. The counter eventually crosses the threshold
  and the trainer battle launches normally.
* One-shot beats (`catchTutorial`, `roamingLegendary`) still use the
  original onComplete that jumps straight to the trainer fight — they
  don't chain. Roaming legendaries also consume *both* wild slots at
  once (`_markWildSeen(idx, STORY_WILDS_PER_ROUTE_NODE)`), preserving
  the "roaming replaces the route's wild" framing.

### Added — "Up next" pill on every transition screen

Between events the player used to hop opaquely: click Continue on a
victory overlay and just *land* on the next screen with no breadcrumb.
Each transition card now carries a small **"Up next →"** chip that names
what comes next:

* Catch encounter (route) — "One more wild on this route" while a wild
  slot remains; otherwise the upcoming trainer ("Gym Leader — Brock") or
  city ("Cerulean City") or finale ("Hall of Fame").
* Catch resolution card ("Continue →" after catch / flee / run) — same.
* Battle victory overlay — same, computed against the already-advanced
  `sm.eventIndex` and accounting for any wild slot still queued before
  the next trainer.

The pill is suppressed in Safari mode (it has its own per-encounter
counter), boss mode (cage-only flow), and the catch tutorial (the
tutorial framing is its own narrative beat). Driven by a single
`_storyComputeUpNext({ phase: 'inCatch' | 'postVictory' })` helper, so
every surface reads the same source of truth.

`STORY_MODE_FLOW.md §3` will want a follow-up edit to document the new
constant; the prose still reads "Once per route node" but the table row
will need to point at `STORY_WILDS_PER_ROUTE_NODE` for the actual count.

## Unreleased — Gym → route → next-city Professor sequencing 2026-05-18 (`claude/fix-gym-party-sequencing-5j6NH`)

### Changed — Professor no longer arrives right after the gym badge

Beating a gym unlocks `+1` party slot, but the next Professor was appearing
on the same post-gym hub — i.e. immediately after the badge, before the
player ever walked the road. The route wild-encounter beat the design
relies on was effectively skippable: take the badge, take a partner from
the same Center, never see a wild.

The post-gym hub now drops the **Professor** action entirely (cities 1–5
in the action list; cities 6–8 via the `shouldForceCityProfessor` rule
flipping off whenever the current row sits immediately after a
`Gym Leader N` battle). The intended beat sequence after each badge is:

1. **Beat the gym** → `+1` slot unlocked.
2. **Post-gym hub** — Pokémon Center / Pokémart / tutors stay open. If
   the player already has stored Pokémon, they can withdraw one from the
   PC into the new slot here.
3. **Leave the city** → forced **wild encounter** on the first battle of
   the new route (unchanged from the existing wild-route flow).
4. **Catch attempt** → if caught, the new partner fills the slot. Either
   way the route continues.
5. **Next city's pre-gym hub** → Professor is available there (cap-gated
   as before), so a non-catcher still finishes the front half with a
   full team without ever needing to wild-hunt.

Lone exception preserved: **City-8 post-Gym-8 legendary gate** (Mystery
Figure / `isPreLeagueLegendaryMysteryGate`) still surfaces at the
post-gym hub — that swap is required to enter Victory Road and takes
precedence over the post-gym suppression.

No save-format change; existing runs land in the new flow on next reload.
The PC, Pokémart, tutors, EV Trainer, Battle Dojo, Safari Zone (City 4),
and Poké Casino (City 5) remain on post-gym hubs — the post-gym town is
still a real stop, just not where the new partner is handed out.

`STORY_MODE_FLOW.md §1` updated to match: the "expected sequence" row
now spells out the route-wild beat between badge and next Pro, and the
Professor-visibility row reads "appears only at pre-gym hubs".

## Unreleased — Sheer Force / Life Orb / every held item now fire on freshly caught + evolved Pokémon 2026-05-18 (`claude/fix-item-effects-evolved-pokemon-Za2en`)

### Fixed — Item effect + ability silently no-oping on edited builds

User report: a story-mode Nidoking that the team panel and summary screen
showed as holding **Life Orb** with the **Sheer Force** ability was hitting
Earth Power on Arcanine for 175 damage (consistent with Life Orb alone
applying — Sheer Force's 1.3× base-power boost never fired). Sludge Bomb on
the next foe still poisoned the target, which directly proved Sheer Force
was off (it should consume the 30% poison chance for the damage trade).

Root cause is a snapshot drift between two views of the same mon:

* `summaryTarget` / team-panel / overview UI reads `mon.item` and
  `mon.ability` straight off the live `state.playerParty[i]` object — but
  the team panel rebuilds that view through `buildPokemon` whenever it
  renders, so the *render* always reflects the latest `build.a` / `build.i`.
* The battle engine's damage path reads the **string snapshot** that
  `buildPokemon` captured *once* at battle start — `let abilityVal = build.a;`
  and `item: build.i`. If the saved build was edited (Dojo / catch / evolve)
  between the snapshot and the read, the engine kept using the stale value
  while every UI surface kept showing the new one.

So the player saw "Ability: Sheer Force" in the summary, told us Sheer
Force was broken, and they were right — the engine's `attacker.ability`
was still the pre-Dojo ability slot.

### Fix

New `_resyncMonFromBuildData(mon)` helper rebinds `mon.item` and
`mon.ability` to `mon.buildData.i` / `mon.buildData.a` (which is the same
object reference the Dojo / catch / evolve flow already mutates) whenever
no battle effect has touched them this fight. Three call sites cover every
path a mon can reach a damage roll on:

1. **`startBattle`** — runs once after `state.playerParty` /
   `state.foeParty` are built. Catches the lead.
2. **`applySwitchInAbilities`** — runs on every switch-in (including the
   initial lead, second slot via Roar/Whirlwind, U-turn replacement, …).
3. **`performAction`** — runs once per acting turn, just before the move
   resolves. Last-line safety net.

The resync is guarded so it never undoes a legitimate in-battle change:

* **Items**: skipped when `mon.itemConsumed === true` (Berry / Gem /
  Power Herb / Normal Gem / …) or `mon.knockedOff === true` (Knock Off,
  Trick / Switcheroo, Embargo-driven loss, Thief), so consumed items don't
  resurrect.
* **Abilities**: tracked with a new `mon._abilityMutatedInBattle` flag,
  set wherever the engine overwrites ability mid-battle —
  Mega Evolution's locked slot, Terapagos / Tera Shift / Teraform Zero,
  Mummy / Lingering Aroma, Wandering Spirit, Trace, Imposter, Transform,
  Skill Swap, Role Play, Simple Beam, Worry Seed, Entrainment. When the
  flag is set, the resync leaves `mon.ability` alone.

### Verification

Reproduced the bug headlessly: construct `state.pActive` with
`buildData.a = "Sheer Force"`, `buildData.i = "Life Orb"`, then corrupt
`mon.ability = "Poison Point"` and `mon.item = "Leftovers"` to simulate
the stale snapshot. Pre-fix, Earth Power dealt ~150 dmg with Poison
Point + Leftovers and Sludge Bomb still poisoned. Post-fix, the resync
inside `performAction` flips the in-battle mon back to Sheer Force +
Life Orb before the damage roll, Earth Power one-shots Arcanine for 197
dmg with Sheer Force's basePower×1.3 + Life Orb's modifier×1.3, takes
0 Life Orb recoil (Sheer Force suppresses), and Sludge Bomb no longer
applies its secondary poison.

Also verified no-clobber on legitimate mid-battle mutations: a Trace'd
ability ("Trace" → "Sheer Force" on switch-in) survives the resync (flag
set), and a consumed Sitrus Berry stays consumed (`itemConsumed === true`).

## Unreleased — `sm is not defined` no longer crashes every story battle 2026-05-18 (`claude/fix-recent-bugs-eiMsL`)

### Fixed — Story mode "MissingNo" placeholder screen (real root cause)

Reproduced the user's exact bug via headless playwright: Story Mode →
New Adventure → pick starter → Battle Your Rival → through the Prof.
Oak cold-open → battle screen comes up with "MissingNo" placeholders
and no command menu. Console:

```
PAGEERROR: sm is not defined
  at startBattle (battle.html:13420:43)
  at launchBattle (battle.html:32105:13)
  at startFight (battle.html:31995:17)
```

`sm` is declared `let sm = …` *inside* the StoryMode IIFE (line
~27235). It is therefore invisible at script-top scope, where
`startBattle` lives. The Crucible Hard Mode check —
`if (state.mode === 'story' && sm && sm.crucibleHardMode && …)` —
added in the balance-overhaul commit (`dee8cb3`) referenced bare `sm`,
which has thrown ReferenceError on **every** story battle since.

The fix uses the public getter `window.StoryMode.state` (already used
the same way at lines 11342 / 11364 / 11375):

```js
const _smRef = (window.StoryMode && window.StoryMode.state) ? window.StoryMode.state : null;
if (state.mode === 'story' && _smRef && _smRef.crucibleHardMode && …) { … }
```

The hardening from the previous commits in this branch (defensive
try/catch around buildPokemon, foe scaling, aiBestSwitch, updateUI,
animation, etc.) means this same regression wouldn't be capable of
stranding the player on a half-built battle screen again even if it
reoccurred — startBattle would now log + skip the bad step and still
reach the command menu.

Verified headlessly: first rival fight now lands on `Eldegoss vs
Torchic`, command menu visible, four log entries, zero errors.

## Unreleased — `startBattle` is now bulletproof against every kind of init crash 2026-05-18 (`claude/fix-recent-bugs-eiMsL`)

### Fixed — placeholder "MissingNo" battle screen with no command menu

A user kept reporting the static "MissingNo / 0/0 / empty Player/Foe
sprites / no battle log / no command menu" screen at the start of
every battle, even after the `anime.js` fix below. The remaining cause
was that **any** throw between "show battle screen" and "show command
menu" inside `startBattle` would leave the user with the static
placeholder HUD: corrupt p1Draft/p2Draft, a build missing `.m`, a bad
foe scaling helper, a Pokédex side-effect with a stale species name,
`state.fActive` undefined when `state.revealedFoe.add(state.fActive.name)`
runs, etc. None of those were wrapped — they all crashed init silently.

Now every step from "battle screen shown" through "command menu shown"
is individually try/caught:

- **Team build (fatal path)**: empty p1Draft, empty p2Draft, or a
  `buildPokemon` throw bails to the main menu with a "corrupted team
  data" alert. The battle screen is re-hidden so the user isn't stuck.
- **Recoverable steps** (story scaling, Crucible boost, difficulty
  scale, weather/terrain rolls, `aiBestSwitch`, foe story inventory,
  artifact effects, leftover-sprite cleanup, `updateUI`,
  `applySwitchInAbilities`, the first-battle tip): each logs and
  continues — the battle still starts, just without the optional bit
  that failed.
- **Command menu show**: now in its own try/catch so even if
  everything else is on fire, the user gets input controls and can at
  least flee.

Verified headlessly:
- Normal battle start (`?locktest=1`): names render, command menu
  visible, no errors — same as before.
- Corrupt state (`p1Draft=[]`): bails to main menu cleanly, no JS
  errors, no stuck placeholder screen.

## Unreleased — anime.js failure no longer strands the player on a blank battle screen 2026-05-18 (`claude/fix-recent-bugs-eiMsL`)

### Fixed — `playPokeballAnimation` crashes `startBattle` when `anime` is undefined

The entrance animation called `anime({...}).finished` unguarded.
`anime.js` is CDN-loaded (`cdn.jsdelivr.net/npm/animejs@3.2.2`), so a
slow / blocked / failed CDN response left `anime` undefined; the
unhandled `ReferenceError` rejected the `Promise.all` in `startBattle`
mid-init. The user was then left on a half-built battle screen — the
static "MissingNo" HUD with empty `Player` / `Foe` sprite alt text,
**no** battle log line ("Battle started!" never fires), and **no**
command menu (it's unhidden 20 lines later, past the throw).

Reproduced headlessly with `?locktest=1`:

```
PAGEERROR: anime is not defined
  at playPokeballAnimation (battle.html:13337)
  at async Promise.all (index 0)
  at async startBattle (battle.html:13440)
```

After the fix, the same headless run with `anime` completely absent
yields `foeName: "Blissey"`, `playerName: "Garchomp"`,
`cmdVisible: true` — battle starts cleanly, just without the bounce-in.

Fixes:
- `playPokeballAnimation` now feature-detects `typeof anime === 'function'`
  before calling it. If anime is missing, it snaps the sprite in
  (opacity 1, visibility visible) and skips the bounce.
- The `Promise.all([player, foe])` call in `startBattle` is wrapped in
  a try/catch that force-shows both sprites on failure, so any future
  animation regression also can't kill the rest of init.

## Unreleased — Soft-lock recovery no longer paints a fake MissingNo battle 2026-05-18 (`claude/fix-recent-bugs-eiMsL`)

### Fixed — `__recoverBattleSoftLock` could fabricate a placeholder battle

When the user tabbed away and back (or the battle watchdog scanned a
between-battles transition), `__recoverBattleSoftLock` would happily
force the command menu open even if no real battle was loaded — the
party / command / move menus are all hidden in that state too. The
result was the static HTML defaults you can never normally see:
`MissingNo` for both names, empty `Player` / `Foe` alt text where the
sprites should be, `0/0` HP, and the misleading log line *"Battle UI
was stuck — commands restored. If the battle still looks wrong, use
Force Continue again or reload."* — followed by `FIGHT / POKÉMON /
BAG / RUN` buttons that pointed at nothing.

Root cause: the recovery path didn't gate on (a) `screen-battle`
actually being on-screen, or (b) `state.pActive` / `state.fActive`
being real Pokémon. The tab-visibility and `pageshow` hooks attached
to the recovery also fired on every screen, not just battle.

Fixes:
- New `__battleHasLiveActives()` helper requires both sides to have an
  active Pokémon with finite HP / maxHp before the recovery is allowed
  to do anything.
- `__recoverBattleSoftLock` now early-returns when the battle screen
  is hidden or when there are no live actives.
- The `visibilitychange` and `pageshow` listeners also gate on the
  battle screen being visible before invoking recovery.
- After a legitimate recovery, `updateUI()` is called so the HUD
  reflects current state rather than whatever was painted at the
  moment of the soft-lock.
- `__forceBattleContinue` (the Settings → Force Continue button) now
  actively escapes a stuck placeholder screen: if the battle UI is up
  but `state.pActive` / `state.fActive` are missing, it calls
  `returnToHome()` (online dispose, story-forfeit handling) instead of
  repainting the same placeholder, so the user is never left staring
  at a `MissingNo` vs `MissingNo` card that doesn't accept input.

## Unreleased — Full game balance & economy overhaul 2026-05-17 (`claude/game-balance-economy-overhaul-a5h2s`)

### Changed — Heal vs X-item price rebalance (pass 2)

Initial overhaul priced healing too high relative to X items, making the
"bench a mon to set up +6 stages" cheese strictly cheaper than healing
through damage. Healing prices dropped, X items raised so the two sit
at parity.

| Item | Pass 1 | Pass 2 |
|---|---|---|
| Super Potion (60 HP) | 700G | **500G** |
| Hyper Potion (120 HP) | 1500G | **1000G** |
| Max Potion (full HP) | 2200G | **1500G** |
| Full Restore (full + status) | 3000G | **2000G** |
| Elixir (10 PP all) | 1200G | **1000G** |
| Max Elixir (full PP) | 1800G | **1500G** |
| Revival Herb (30% HP) | 1500G | **1200G** |
| Revive (50% HP) | 3000G | **2500G** |
| Max Revive (full HP) | 4500G | **4000G** |
| X Attack / Defense / Sp.Atk / Sp.Def / Speed / Accuracy | 800G | **1000G** |
| Dire Hit | 300G | **400G** |
| Guard Spec. | 350G | **450G** |

X items now cost the same as a Hyper Potion: heal 120 HP, or +2 a stat
for the fight. Same gold, different decision.

### Changed — Tutor/Colress price tweaks

- **Battle Dojo (Ability swap)**: 2500G → **2000G**. Now matches Item-swap
  cost; the +500G ability premium wasn't earning its keep given how often
  enemy teams field non-baseline abilities post-overhaul.
- **Colress (gimmick swap)**: 10000G → **7500G**. Gimmick density on
  enemy teams rose with the Frontier per-round bands and Crucible Hard
  Mode (+20% absolute frequency). The player needs to keep up without
  spending a small fortune per change.

Move Tutor (1500G), Nature Rater (2000G), EV Trainer (5000G), Stone Sage
(1.5K/6K/16K by target grade), and Cable Link (variable) were left as-is
— each remains correctly calibrated for what it delivers under the new
build-tier pipeline.

### Added — Heal/PP gradient + mid-tier revive

The PokéMart now stocks a full Potion ladder where there used to be a
jump from 300G (Full Heal — status only) straight to 1000G (Max Potion).
New entries (pass-1 prices; superseded by the pass-2 rebalance above):

- **Potion** (200G, +20 HP)
- **Super Potion** (700G, +60 HP)
- **Hyper Potion** (1500G, +120 HP)
- **Ether** (400G, restores 10 PP of one move)
- **Elixir** (1200G, restores 10 PP of every move)

The PP gradient closes the same gap (no PP option below Max Elixir 500G).

The Department Store gains a mid-tier **Revival Herb** (revives to 30% HP)
so early-game runs aren't forced to choose between no revive and the
high-cost Dept-store revives.

### Added — Permanent stat-boost vitamins (drop-only)

A new mon-side stat-investment layer, distinct from EVs (which the EV
Trainer still handles via 252/252/4 presets) and from the existing
Vitamin Pack voucher (which still buys a free EV Trainer preset).

Six new earned-only items:

| Vitamin | Stat | Cap per mon |
|---|---|---|
| HP Up   | HP        | +10 |
| Protein | Attack    | +10 |
| Iron    | Defense   | +10 |
| Calcium | Sp. Atk   | +10 |
| Zinc    | Sp. Def   | +10 |
| Carbos  | Speed     | +10 |

Each gives +1 to that stat permanently when applied. Stored on
`mon.build.permBoosts[stat]`; additive on top of the EV-derived
stat at `buildPokemon` time. Cap is **+10 per stat per mon** (60 total
when fully boosted). Carries through Cable Link Rebuild (same mon) and
Stone Sage evolution (same identity); does NOT carry through Cable Link
Reroll/Upgrade (which trade the mon for a new species).

**Drop schedule** (~110 vitamins across a perfect run — enough to fully
boost ~1.8 mons or partially invest across 4-5):
- Gym Leader 1-8: 2-5 each, themed to the gym's combat style
- Elite Four E1-E4 + Champion: 3-12 each, escalating
- Pokédex milestones 25/50/75/100: 2-8 each
- Post-HoF Mystery Figure: 18 (3 of each)
- Caged God (boss arc): 30 (5 of each)

UI: surfaced in the **City Bag** with a Use button that opens a roster
picker (party + PC mons). Rows show current boost vs cap; at-cap rows
are dimmed. Vitamins are never sellable.

### Changed — Cable Link build pipeline (no more T4 free skip)

Cable Link Reroll / Upgrade / Rebuild were calling `makeBuild()` directly,
which produced Tournament-tier builds at every action regardless of cost.
After the overhaul:

- **Reroll** (cheap, same grade) → **Competent** tier (EVs capped at 420
  instead of 510; still competitive, Tutor / Dojo / EV Trainer still add
  meaningful polish)
- **Upgrade** (expensive, one grade up) → **Tournament** tier — premium
  service stays premium
- **Rebuild** (medium, same species) → **Competent** tier; perm-boost
  vitamin investment is carried through (the mon is still the same mon)

The shared `_makePlayerLinkBuild(name, tierTag)` helper preserves the
existing player gimmick gating (only roll gimmicks the player has
unlocked via gym victories) and tags `build.powerTier` so any future
tier-aware UI can display it.

### Added — Crucible Hard Mode toggle

A single checkbox at the top of the Crucible Battles grid. When on:

- **+30% foe HP / bulk / speed** on every Crucible rematch (Mystery
  Figure, Rival, League Run E1→Champion, Random Gym Rematch, Battle
  Frontier). Stacks multiplicatively with the per-event boss boost
  (Champion +40% HP) and the difficulty mode (`hard` +15%, `challenge`
  +30%). A Champion rematch on Hard difficulty with Crucible Hard Mode
  on hits ≈ 1.40 × 1.30 × 1.15 = **2.09× canonical foe HP**.
- **+20% absolute gimmick frequency** on League/Mystery/Rival/Gym
  rematches (so a hard-mode Champion rematch fields gimmicks at ~100%
  per eligible mon).
- **+15% absolute** in Battle Frontier rounds.

Toggled via the `sm.crucibleHardMode` boolean, persisted in the save.

### Changed — Champion / Mystery Figure / Elite Four buff

The boss-tier multipliers now hit harder so post-vitamin / post-Cable-Link
investment doesn't trivialize the league climb. New values:

| Event | HP boost | Bulk boost | Speed boost |
|---|---|---|---|
| E1-E4 | 1.20 → 1.22 | 1.15 → 1.17 | 1.10 → 1.12 |
| Champion / league Rival | 1.30 → 1.40 | 1.15 → 1.22 | 1.15 → 1.18 |
| Mystery Figure (post-HoF) | 1.35 → 1.50 | 1.20 → 1.28 | 1.20 → 1.25 |

### Changed — Battle Frontier scaling acceleration

The Frontier ramp was too gentle — round 10+ felt comparable to a
mid-game gym fight. New values:

| Curve | Old | New |
|---|---|---|
| HP per round | 1.35 + 0.05/r (cap 2.50) | 1.50 + 0.075/r (cap 3.00) |
| Bulk per round | 1.20 + 0.03/r (cap 1.80) | 1.25 + 0.045/r (cap 2.00) |
| Speed per round | 1.20 + 0.03/r (cap 1.80) | 1.25 + 0.045/r (cap 2.00) |
| Mech frequency (per round band) | flat per event-type | round-tiered: 25% → 45% → 70% → 90% → 100% |

Round 1 is now harder than the post-HoF Mystery climax; round 10+ caps
out near a Caged-God-tier wall.

## Unreleased — VGC depth pass + responsive battle UI 2026-05-17 (`claude/battle-scenery-backgrounds-PagsV`)

### Changed — Battle screen now reads as a 3D VGC arena

The battle scene used to render the player and foe at nearly the same on-screen
size, which killed the "I'm standing behind my Pokémon, looking across the
arena" perspective the rest of the chrome was hinting at. Three things together
were responsible:

1. The `--sprite-foe-w` / `--sprite-player-w` tokens were within ~6% of each
   other on every layout (e.g. desktop 265 / 281), so lore-scaling alone
   couldn't make the foe feel distant.
2. The desktop foe sat well above the arena's back wall, planting it in the
   audience seats rather than on the floor near the horizon.
3. The desktop player container was 322px tall with its baseline far above the
   chrome line, so on a 720px canvas its head was pushed up into the stadium
   rafters and its feet floated awkwardly above the HUD.

Per layout the new sizing is roughly player ≈ 1.55–1.7× foe:

| Layout              | Foe      | Player    | Ratio  |
| ------------------- | -------- | --------- | ------ |
| Desktop (1280×720)  | 198×184  | 310×296   | ~1.57× |
| Ultrawide           | 212×196  | 332×312   | ~1.57× |
| Portrait (phone)    | 138 sq   | 224 sq    | ~1.62× |
| Tablet portrait     | 188 sq   | 300 sq    | ~1.60× |
| Phone landscape     | 132 sq   | 200 sq    | ~1.52× |

The foe was repositioned so its feet land on the arena's back horizon line
(top 138px on desktop, right ~11%). The player was shortened (322 → 296),
widened (281 → 310), and moved so its feet tuck behind the HUD strip
GBA-style.

### Changed — Floor shadows scale with the sprite

`.foe-platform` / `.player-platform` were 140/180px flat with hard-stop
shadows. They now use percentage widths against the container (76% / 82%) and
a radial-gradient ellipse, so larger Pokémon get larger, softer ground
shadows automatically. Inline `style="width:140px"` overrides in the HTML
that were locking them at the old size are gone.

### Changed — Battle log no longer a slab of pure black on desktop

The right-hand log on desktop was solid `#161616` filling the whole bottom
strip. It now renders as a translucent panel (`rgba(10,12,18,0.78) → 0.92`)
with a soft border, light backdrop-blur, and a thin scrollbar — the arena
art reads through it, the panel still has enough contrast for readability.
The `.ui-bottom` chrome gradient was softened so the boundary between arena
and chrome is a fade rather than a hard horizontal seam, and the player HUD
row's `90deg → flex-end` wedge was replaced with a subtle vertical shade.

### Changed — Vignette frames the action with depth

The base vignette darkened the top and bottom uniformly. Desktop now uses a
foreground-tinted variant (extra bottom-radial + a 60→100% linear shade)
that nudges the eye toward the centre arena floor where the sprites stand —
classic VGC framing.

### Changed — Tablet preset keeps the same player-to-foe ratio

The 700–1100px viewport preset was overriding sprite tokens with
`foe = min(38vw, 200)` and `player = min(40vw, 215)` — almost equal,
breaking the depth ratio on iPad-class screens. Replaced with width-aware
clamps that mirror the desktop/portrait 1.6× ratio (foe 168–198, player
282–332 depending on the data-battle-layout JS picked).

### Changed — Phone-portrait nudge transform no longer overflows wider tablets

`#player-sprite-container` had `transform: translate(-0.5cm, 0.45cm)` to
overlap the chrome GBA-style. On phone widths this was fine; on 768px
tablet portrait it pushed the larger 300px container 19px past the canvas's
left edge. The X translation is gone; the Y nudge stays, and the `bottom`
calc compensates so feet still tuck behind the HUD.

### Implementation notes

- Production sprite loading (`getSprite(name, shiny, isPlayer)` →
  `gen5ani-back/<sid>.gif`) is unchanged. The player back-sprite chain
  already hands off to PokeAPI back-static
  (`/sprites/pokemon/back/<dex>.png`) when Showdown is unreachable, so the
  player still shows from-behind in every browser even when the CDN is down.
- `getSpriteLoreScaleNumber()` and the per-species `weight/height` curve
  still drive the additional ±12% scale around the per-layout base — so
  Wailord still feels huge next to Joltik, on top of the new player/foe
  depth ratio.

## Unreleased — Game-wide text standardization pass 2026-05-17 (`claude/standardize-game-text-xGSU9`)

### Changed — Tone & writing sweep across every visible screen

A run-wide writing pass to lift the "AI slop" tone identified across
the game: help screens, NPC dialogue, tutorials, milestone toasts,
end-of-fight chrome, and post-game beats. **No mechanical changes** —
only the strings the player reads.

The unifying voice rule: less bulleted manual, more in-world prose,
with the same mechanical information density. Every Pokémon-game tone
beat (canonical battle messages like "It's super effective!", the
Hall-of-Fame "Welcome to the HALL OF FAME!", warden "Ding-dong!" PA
calls) was preserved on purpose — only the original-prose text was
rewritten.

**One-time tutorial tips (22 of them):** `welcome`, `what-is-a-gym`,
`prof-overview-v2`, `legendary-gate`, `first-battle`, `center`,
`crucible`, `frontier`, `catch-tutorial`, `safari-catch`, `catch`,
`roaming`, `first-mart`, `first-dept`, `relic`, `first-link`,
`first-casino`, `first-evolab`, `first-tutor`, `first-nature`,
`first-dojo`, `first-colress`, `first-ev`, `postHof` — rewritten
end-to-end. Bullets dropped in favor of paragraphs that read like a
trainer explaining the road, not a manual reciting features.

**`STORY_FACILITY_QUOTES`** (8 facilities × 5–6 lines each):
expanded and sharpened with distinct character voice. Buck talks like
a coach, Colress like a scientist whose ten-thousand-gold price tag
"sounds fair to me," the Relic Keeper like a fence with a license,
the Move Tutor like a teacher who's seen every variant. Each pool
gained a line of variety and lost the dry "Welcome. I can do X." cadence.

**`PROF_QUOTES`** (5 → 9 lines): "Pick the one your gut argues for —
gut is usually right about partners." The two contextual variants
(full party / Mystery-Figure legendary gate) given proper diction so
the swap framing actually lands as a tradeoff.

**`TRAINER_QUOTES`** (generic role pools: Basic / Gym / Gym Leader /
Elite / Rival / E1–E4 / Champion / Victory Road) rewritten so the
standard trainer lines stop sounding like NPC placeholders. Each role
is now grounded — Basic Trainers talk about routes, Gym Trainers talk
about the leader, Champion and Victory Road carry the gravity of
where the player is standing.

**`RIVAL_PROGRESS_PRIMARY_QUOTES`**, `rivalStandingPrimaryQuotePool`,
`pickRivalSecondaryIntroLine`: phase-aware rivalry lines so a 6-badge
rival reads like a 6-badge rival, not a "rival" archetype.

**Per-rival victory flavor** in `showVictoryOverlay` (rival win
banners by phase): generic "First steps, first rival win" replaced
with phase-aware lines that read like narrative beats.

**`POKEDEX_CAUGHT_MILESTONES`** (25 / 50 / 75 / 100): "100 species. The
dex is no longer a notebook — it's a record." No more "Pokédex
centurion" Reddit-username vibes.

**Help guide** (`helpData.story` / `.menu` / `.draft`): tightened from
bullet-heavy reference card to prose that still carries every number.

**Catch flow text:** "Gotcha!", PC-send, party-swap, wobble misses,
flee, and the boss-mode miss pool all rewritten with rhythm. Roamer
flees now warn that roamers don't come back. The catch screen header
and sub-line ("A wild Pokémon appeared!" → "A wild Pokémon stepped
out of the grass!") were tightened too.

**Underground:** header + empty-state copy now sound like a broker.

**Safari Zone:** first-visit warden welcome rewritten in the PA-system
voice the changelog already established; out-of-balls /
out-of-encounters / early-exit / empty-pool fallbacks aligned.

**Hall of Fame epilogue dialogue:** per-state rival line (player vs
rival claimed the league) reshaped. Professor's line carries the
in-character "the lab remembers you" weight.

**End-of-battle screens** (non-story modes: Quick Play, Local PvP,
Gauntlet): "You defeated the opponent." → "The last opposing Pokémon
falls. The round is yours." Parallel sharpening on GAME OVER ("Your
last Pokémon is down. The fight is over."), DRAW, FORFEIT, GAUNTLET
OVER variants.

**Story Mode menu tagline** ("A single-player journey…") replaced.
**Abandon-run confirm dialog**: sharper warning, clarifies why the
Pokédex carries over even after wipe. **Cap-teach toast** on gym
victories now reads as prose. **League milestone toasts** ("4 badges",
"8 badges") tightened. **Cage-unlock alert**, **post-HoF mystery
climax** (won/lost) and **Battle Frontier streak-end** alerts
rewritten for impact.

### Changed — Pokémon diacritic restored on trainer names

`Pokemon Breeder` / `Pokemon Breeder F` / `Pokemon Ranger` /
`Pokemon Ranger F` in `TRAINER_DATA` → `Pokémon Breeder` /
`Pokémon Breeder F` / `Pokémon Ranger` / `Pokémon Ranger F`. Visible
on trainer intros, victory overlays, and run logs.

### Migration — `SAVE_VER` 17 → 18

New `migrateStoryTrainerDiacriticsPreV18` remaps existing saves where
a Breeder / Ranger had already been assigned under the old name. Five-
line lookup table; no other schema change.

### Reason

Past polish passes touched cities, Professors, victory lines, and
Safari flavor (see prior CHANGELOG entries). Everything else — the
welcome screen, the tutorial popups, the facility NPC pools, generic
trainer lines, the catch flow, the end screens, the milestone toasts —
still read as templated tutorial copy. This pass standardizes the
voice across every screen the player actually sees.

## Unreleased — AI over-switching fix 2026-05-17 (`claude/fix-enemy-ai-switching-bQGZV`)

### Fixed — Enemy AI cycling its whole bench against one wall-breaker

`aiDecision()` had two clauses that compounded into a bench-cycling
bug. When the active matchup was `walled` (AI's best damaging move did
< 8% of the defender's max HP and < 12% of its current HP):

1. The "don't switch into a guaranteed KO" guard
   (`switchThreat >= switchTo.currentHp && !walled`) bypassed itself —
   the `!walled` carve-out let the AI feed fresh bench mons into a
   one-shot whenever the active matchup was walled.
2. The final commit check
   (`newBestDmg > myBestDmg * 1.2 || willDieFirst || walled`) returned
   the switch unconditionally because `walled` is true, regardless of
   whether the picked target was *also* walled by the same defender.
   `aiBestSwitch` always returns a best-of-bench, so against a single
   wall-breaker (Mega Lucario, Garchomp, etc.) the AI burned its entire
   team switching every turn without ever attacking.

Both clauses now reject pointless swaps: the KO guard is unconditional,
and a walled trigger only commits if the picked switch-in actually
breaks the wall. `willDieFirst` still overrides — when the current mon
won't get a move off, switching is correct even into a bad target.

## Unreleased — Safari / Wild / Evolution animations + story-mode visual pass 2026-05-17 (`claude/safari-zone-animations-Jb1zx`)

### Added — `StoryFx` animation + sound module

A new top-of-script module (`window.StoryFx`) owns every animation and
sound effect for the story-mode flows that previously rendered as
pure-text screens. It exposes:

- **`buildEncounterStage(parent, { tone })`** — drops a tone-themed
  (`wild` / `safari` / `boss`) stage div into the catch screen body
  with a soft type-tinted radial backdrop. The stage element is
  persistent across `_catchRender` re-mounts so wobble / idle state
  survives the rebuild after each throw.
- **`encounterReveal(stage, name, opts)`** — slides the wild Pokémon
  in from the upper-right with a "tray-enter" SFX and plays the
  species cry. Mirrors the FireRed / Emerald opener cadence.
- **`throwBall(stage, ballKey, outcome)`** — animated ball arc → flash
  → wobble (1 / 2 / 3 wobbles for flee / wobble / catch) → capture
  seal (`pb_lock` + sparkle starburst) or break-out (`pb_rel` puff).
  The catch path also plays `shing` + `sparkle`. Pre-computes the
  outcome so the animation mirrors truth.
- **`safariActionFx(stage, action)`** — Bait/Rock puff bubble + per-
  action SFX (`pb_tray_ball` for bait, `pb_move` for rock); rock also
  shakes the wild sprite.
- **`evolutionScene({ fromName, toName, shiny, allowCancel })`** —
  full-screen Gen 3-style sequence: silhouette → conic-ray spin →
  white flash → reveal with cry. Optional B-button cancel; the
  Evolution Lab calls it with `allowCancel: false` after a
  `showGameConfirm` gate so once committed it always completes.
- **`casinoSpin({ host, finalText, win })`** — three-reel spinning
  display with `gacha_dial` start, ticking reel SFX, per-reel lock,
  win/lose glow. The reel text snaps to a roll-derived value.
- **`flashPulse(el, variant)`** + **`buyFx` / `healFx` / `saveFx` /
  `upgradeFx` / `warnFx`** — coloured pulse rings on a target element
  with an attached SFX (used for shop buys, Pokémon Center actions,
  Tutor commits, EV Trainer presets, Colress gimmick activations,
  Link Station rerolls / upgrades, and Relic Annex claims).
- **`floatCoin(el, label)`** — short floating "-NNNG" indicator on
  shop rows after a purchase.
- All helpers respect `prefers-reduced-motion`: when that media query
  matches, every `_wait` is clamped to 80ms so the player still
  reaches the resolution screen without holding for the cinematic.

### Added — Catch screen visual overhaul (Safari + wild routes + boss + tutorial)

- `enterCatchEncounter` now builds the persistent stage on entry,
  fires `StoryFx.encounterReveal` with the species cry, and clears
  the stage between encounters (so each Safari pull gets a fresh
  slide-in).
- `catchThrow` is now async: pre-rolls the outcome (catch / flee /
  wobble), runs `StoryFx.throwBall` with that outcome, then applies
  the actual state change. A guard (`_catchThrowInFlight`) blocks
  double-clicks while a throw is mid-air.
- `safariBait` / `safariRock` fire the puff animation + SFX before
  the per-turn flee roll. The wild's shake on a thrown rock reads
  the canonical "this is your last warning" beat from Emerald.
- `catchRun` plays the `flee` SFX so running registers as an event,
  not a silent state change.
- `_catchFinishWithMessage` and `catchContinue` always tear down the
  stage so a re-entry can't see stale animation state.

### Added — Stone Sage evolution scene

`evoLabEvolve` and `evoLabEvolveWithCandy` now route through a new
`_evoLabApplyEvolutionWithAnim` helper that performs the data swap
first, then plays `StoryFx.evolutionScene` with the old → new
species. The cinematic is allowCancel:false (the showGameConfirm
prompt is the cancel gate) so the screen always resolves cleanly.

### Added — Casino spin animation

`casinoPlay` is now async and runs the 3-reel spin before applying
the gold delta. A reentrancy guard (`_casinoSpinInFlight`) blocks
fast-clicks during the spin. The result message lands as a
post-reel `div` so the spin and the outcome are visually distinct.

### Added — Wired the unused `music/ui_sfx/*.wav` files

Eighteen sample audio files that were sitting unused in the repo
are now wired into `AudioSystem.UI_SFX` and consumed by the new
flows: `pb_bounce_1`, `pb_bounce_2`, `pb_lock`, `pb_move`,
`pb_tray_ball`, `pb_tray_empty`, `pb_tray_enter`, `crit_throw`,
`egg_crack`, `egg_hatch`, `gacha_dial`, `gacha_dispense`,
`gacha_running`, `achv`, `shing`, `upgrade`, `save`, `buy`, and
`danger`. Each maps to a camelCase key on `UI_SFX` (`pbBounce1`,
`pbLock`, `gachaRun`, etc.).

### Added — Facility entry chimes + commit pulses

A whole-story polish sweep. Every facility now plays a short
themed cue on entry and a "commit" cue on each action:

- **Pokémon Center** — `save` (Joy's welcome chime) on entry;
  PC deposit `pb_tray_ball`, withdraw `pb_rel`, release
  `pb_tray_empty`, Underground sell `buy`.
- **Pokémart / Department Store** — `pb_tray_ball` door bell on
  entry (gated so it only fires when transitioning *into* the
  shop, not on the post-buy re-render). Each successful purchase
  plays `buy`, drops a `-NNNG` coin float over the row, and rings
  the row's gold pulse.
- **Move Tutor / Battle Dojo / Nature Rater** — soft
  `pb_tray_enter` on entry, `upgrade` on every move / item /
  ability / nature commit.
- **EV Trainer** — `stat_up` whistle on entry; the preset-apply
  commit plays `stat_up` + delayed `exp` (mirrors the canonical
  in-battle EV-train ping).
- **Colress** — `beam` hum on entry; gimmick activation plays
  `charge` + delayed `shing` (mega / Z / dyna / tera all share the
  cue via `_colressFinish`).
- **Stone Sage / Evolution Lab** — `sparkle` on entry, full
  evolution scene on commit.
- **Cable Link Station** — `beam` on entry, `shing` on Reroll /
  Rebuild, `upgrade` + delayed `shing` on Upgrade.
- **Poké Casino** — `gacha_dial` on entry; full reel-spin per play.
- **Relic Annex** — `shine` on entry, `upgrade` + delayed `shing`
  on claim.
- **Safari Zone** — `pb_tray_enter` gate chime as the session
  starts; each encounter inherits the new encounter reveal.
- **The Crucible** — `achv` chord on entry.
- **Battle Frontier** — `danger` horn on entry.

### Added — CSS keyframe library for the new flows

A `STORY FX` block of new keyframes (`storyfxMonIdle`,
`storyfxMonEnter`, `storyfxMonShake`, `storyfxMonFlee`,
`storyfxMonAbsorb`, `storyfxBallThrow`, `storyfxBallWobble`,
`storyfxBallSeal`, `storyfxBallBurst`, `storyfxStarBurst`,
`storyfxBannerIn`, `storyfxPuff`, `storyfxEvoRaySpin`,
`storyfxEvoRayFade`, `storyfxEvoFlash`, `storyfxEvoFlashFade`,
`storyfxEvoMorph`, `storyfxEvoReveal`, `storyfxPulse` family,
`storyfxCoinFloat`, `storyfxReelBlur`, `storyfxReelWin`,
`storyfxReelLose`) sits alongside the existing battle anims so
all motion lives in one place. Stage / ball sprite art reuses the
canonical Showdown sprite CDN (via `getSprite`) and the pokesprite
ball icons already on disk.

## Unreleased — Story-mode regression sweep 2026-05-17 (`claude/fix-story-mode-bugs-1L4dU`)

### Fixed — Post-KO party modal + Pokémon summary blanking

- `spriteDisplayName` (added with the rare cosmetic-skin roll) was
  declared **inside** the `window.StoryMode` IIFE but called from
  ~16 places outside it: `openParty`, `switchSummaryTab`, Mega/Dynamax
  activation, in-battle Transform/Imposter, the draft pool / draft
  card renderers, and the local-PvP draft picker. JS function
  declarations don't leak out of an IIFE, so every one of those calls
  threw `ReferenceError: spriteDisplayName is not defined`. The
  visible damage was bad: after a faint, the engine called
  `window.openParty(true)`, the slot template literal exploded on the
  first `${getSprite(spriteDisplayName(mon), …)}`, the modal never
  unhid, and the player was stuck staring at the battle screen with
  no input. Same crash blanked the in-battle Pokémon summary and the
  story team-panel summary the moment the Overview / Moves / Matchups
  page tried to render its sprite. Moved the helper to the top-level
  script scope right after `getBattleSpriteSpeciesName`, removed the
  duplicate IIFE-local copy. Sprite renders, post-KO switch, and the
  summary modal all resume working.
- `STORY_COSMETIC_SKINS` and `STORY_SKIN_TO_BASE` had the same scope
  problem in `makeBuild` and `buildPokemon` (both live outside the
  IIFE). Their `typeof` guards swallowed the failure instead of
  crashing, so the cosmetic-skin roll **silently never fired** for
  any roll outside the IIFE — i.e. the feature was effectively dead
  for every wild encounter, draft pool, and Quick Play roster.
  Exposed both maps via `window.STORY_COSMETIC_SKINS` /
  `window.STORY_SKIN_TO_BASE` and switched the two consumers to read
  through `window` so the 1.5% skin roll actually triggers.

### Hardened — Defensive guards around story summary + Professor picks

- `showDraftPokemonSummary` now wraps `buildPokemon(draftItem.name,
  build)` in try/catch. A throw used to leave `summaryTarget`
  pointing at a stale or undefined mon while the modal was still
  un-hidden, showing a half-blank page.
- `summaryNavigateParty` builds the next-page mon into a local
  variable first and only commits `summaryTarget` / nav index if the
  build succeeds. Lets the user keep navigating after a single bad
  team entry instead of trapping the page.
- `openSummary` (story team panel) normalizes the partyList to
  trimmed string names and drops entries with no name. Prev/Next on
  the summary nav no longer crashes on a corrupt slot.
- Story Professor pick rolling now catches `makeBuild` throws and
  skips that species instead of pushing a `{ name, build: null }`
  choice that would crash the pick-card renderer with "Cannot read
  property 'gimmick' of null" the moment the screen tried to draw.

## Unreleased — Story-mode audit pass: tutorials, help screen, Underground prices 2026-05-17 (`claude/audit-story-mode-design-GH8Fn`)

### Added — First-visit one-time tip for every facility

A full-stack tutorial coverage pass. Previously the one-time tip system
covered city arrival, the Pokémon Center, Safari, Crucible, Battle Frontier,
the catch flow, and the Relic Annex — but nine other facilities had no
onboarding at all. New players were dropped into Move Tutor, Battle Dojo,
EV Trainer, Colress, Link Station, the casino, the evolution lab, and both
shops with no explanation of what each one does or why they'd visit it.

Each tip fires cross-run-deduped via `pbs_story_meta.tipsShown`, so a
veteran on NG+ doesn't re-read them. Keys added: `first-mart`, `first-dept`,
`first-tutor`, `first-nature`, `first-dojo`, `first-ev`, `first-colress`,
`first-link`, `first-casino`, `first-evolab`.

### Added — In-battle gimmick discovery tip

The four battle forms (Mega, Z-Move, Dynamax / G-Max, Tera) are now
always-on in story mode (`Simplify game modes` pass, 2026-05-16). A
brand-new player walking into their first battle with a Mega-capable
Pokémon could see the MEGA / DYNAMAX / TERA / Z-MOVE buttons appear
above the move grid with zero in-game explanation of what they do or
the once-per-team rule.

A new `gimmick-first-seen` one-time tip fires the **first time any
battle form button is rendered** for the player in a story battle.
The tip describes each of the four mechanics, the Classic per-team
cap, and how to queue a form before picking a move. Cross-run-deduped
like the other tips. Player-side / story-mode only — no fire on AI
turn renders or in PvE / PvP / Gauntlet.

### Added — Always-accessible Help screen in story mode

The existing `modal-help` (settings → "VIEW") now also renders a
comprehensive story-mode reference when the player is on any
story screen or in a story battle:

- Story Mode Overview — badge curve, auto-heal, foe-match-size rule.
- Battle Mechanics — what Mega / Dynamax / Tera / Z-Move each do, the
  Classic-mode per-team cap, the ▲/▼/⊘ effectiveness arrows.
- Catching — base catch rates, ball multipliers, per-grade flee rates,
  Master Ball reservation for the boss.
- Build Power Tiers (T1 → T4) — what each tier means and where each
  trainer / facility lands you on the curve.
- Cities & Facilities — one-line reference for every shop, tutor, and
  hub (Pokémart, Department Store, Pokémon Center, Move Tutor, Nature
  Rater, Battle Dojo, EV Trainer, Stone Sage, Colress, Link Station,
  Relic Annex, Poké Casino, Safari Zone).
- Endgame — the Crucible super-hub and the Caged God boss arc.
- Useful Habits — tap-foe-to-inspect, "🎯 Next:" chip, vouchers,
  difficulty's coin-mult side-effect.

A new `?` Help button sits in the story HUD action row next to
the gear icon, opening this reference in one tap from any city or
facility. Settings → VIEW still works during battles.

The Help modal now has `role="dialog"`, `aria-modal="true"`, and
`aria-labelledby="help-title"` for screen readers, plus `max-height:
88vh` so the long story reference scrolls on small screens instead of
clipping. `Run Info` and `Abandon` HUD buttons get matching
`aria-label`s alongside the existing `title` tooltips.

### Changed — Underground sell prices raised for catch-light players

Wild-route catches now sell for meaningful gold so the Underground
isn't a dead facility unless you mostly skip wild catching.
`_PC_UNDERGROUND_PRICE_BY_GRADE`:

- G3: 100G → **250G**
- G4: 20G → **60G**
- G2 unchanged at 450G (small bump from 400G to soften the curve).
- G1 unchanged at 1,800G.

Safari spam is still net-negative: a typical 6-encounter session at
the live weights (g1:3 / g2:22 / g3:50 / g4:25) yields ~1,758G
expected sell value before catch-rate failures — well below the
2,500G Safari entry. Keeping and training mons remains the rewarding
play; the Underground is now a real gold source for the PC overflow,
not a token-effort facility.

### Changed — City 9 (Pokémon League) gains Pokémart access

Previously the league hub had Department Store but no Pokémart. A
player who entered the league with low Poké Ball stocks could only
buy 1,000G Great Balls, locking them out of cheap catches even though
the Crucible's wild route remains available post-HoF. City 9 now has
both shops, restoring access to 300G Poké Balls. The action key was
added to row idx 58 in `STORY_EVENTS_RAW`.

### Changed — Run-setup screen clarifies what difficulty actually does

The difficulty `<select>` previously only told the player about foe
stat scaling. The description now lists all three knobs:

- **Foe stats** — Very Easy −30% to Very Hard +30%, scaling HP /
  Atk / Def / SpA / SpD / Spe.
- **Coin rewards** — Very Easy ×1.60 down to Hard ×1.00 (floored
  from 0.92 so the hardest non-challenge mode isn't pure punishment).
  Easier modes earn more gold for facility visits.
- **Retreat fee** — Normal and above; veryeasy / easy waive it.
- **Early-game softening** — Gym Leader 1 and 2 are gently scaled to
  ×0.95 foe stats so a fresh save can't brick at the first wall.

### Changed — Generation toggles get per-gen tooltips + scope reminder

The 9 G1–G9 checkboxes had no explanation of which generation they
gate or what the filter affects. Each checkbox now has a `title`
attribute naming the region and dex range, and a one-line scope note
under the row spells out that the filter affects species rolls only —
move learnsets, abilities, items, and the type chart are
generation-independent. A G1-only run plays the full game with the
G1 roster.

### Doc — Spec drift caught up

- `STORY_MODE_FLOW.md` §5 (Catch minigame) was the last place still
  saying `SAFARI_BALL_MULT = 1.25×`; the Safari Zone gameplay-loop
  pass bumped this to 1.35× in `battle.html`. Spec text now matches
  live constant.
- §14c city specialties: City 7 was described as "last Pokémart
  city" but City 8 has a Pokémart too (and now City 9 does). Table
  rows for City 7 / 8 / 9 updated to match the live action lists.
- §6 Underground sell table updated to the new 1800/450/250/60
  rebalance with a note on why Safari spam is still unprofitable.

### Reason

This pass is the polish layer on top of a story mode that's
~95% spec-aligned: every major system (catch math, party-cap
badge curve, foe sizing, build-power tiers, Safari, boss arc,
PC/Underground, Crucible, Battle Frontier) is shipped and
tuned. The remaining gaps were all educational — the player
who reads the design doc can engage every facility intentionally,
but the player who doesn't was being asked to figure out
Mega / Dynamax / Tera / Z-Move, EV training, the Link Station,
and Colress purely by clicking around. The tutorial tips plus
the Help reference close that gap without changing any of the
underlying balance. The Underground price buff + City-9 Pokémart
+ difficulty / gen-toggle descriptions are the small drag points
the audit surfaced alongside the big tutorial gap.

## Unreleased — Battle KO ordering & switch-in edge cases 2026-05-17 (`claude/fix-battle-ko-ordering-7UoSZ`)

### Fixed — Simultaneous-KO switch-in (Explosion / mutual faint)

- The auto-replacement that runs when both active Pokémon faint on the
  same turn (Explosion, Final Gambit, Destiny Bond, Counter to last HP,
  Liquid Ooze+Substitute, etc.) used to call
  `applySwitchInAbilities(newFoe, deadPlayer)`, but the function bailed
  on its first line whenever the opposing slot was at 0 HP. That meant
  the foe's switch-in abilities silently no-op'd in this path: Drought,
  Drizzle, Sand Stream, Snow Warning, Electric/Grassy/Psychic/Misty
  Surge, Intrepid Sword, Dauntless Shield, Slow Start, Tera Shift,
  Primal Reversion, Protosynthesis/Quark Drive, Forecast, the Rusted
  Sword/Shield + Origin / Vile Vial forme changes — all skipped. The
  guard now only short-circuits when the entering mon itself is dead;
  foe-targeted effects (Intimidate, Download, Frisk, Trace, the
  Neutralizing Gas suppression flag) guard themselves on a live foe.
- The simultaneous-faint path now clears permanent weather for both
  sides (Desolate Land / Primordial Sea / Delta Stream). Mutual
  Groudon/Kyogre Explosion no longer leaves harsh sun or heavy rain
  stuck on the field for the rest of the battle.
- If the foe's auto-replacement faints to entry hazards on the way in
  (4× Stealth Rock weakness, no Heavy-Duty Boots), we now chain to the
  next surviving foe instead of opening the player's switch modal
  against a fainted opponent sprite. If hazards wipe the entire
  remaining bench, the win condition fires correctly.

### Reason

The scenario "Pokémon A uses Stealth Rock, Pokémon B explodes before it
resolves" exercises three separate quirks of the simultaneous-faint
path. The Stealth Rock side already worked (the user's `currentHp <= 0`
guard at the top of `performAction` drops A's queued move when B's
Explosion KOs it first), but the auto-switch into the replacement foe
swallowed weather/terrain/stat-boost abilities, lost permanent weather
cleanup, and didn't chain hazard KOs. Surfaced while auditing battle
ordering and KO edge cases.

## Unreleased — Special-case Pokémon variations 2026-05-16 (`claude/special-case-pokemon-variations-pZmOU`)

### Added — Second-pass variant audit: more cosmetic skins, more dedup families

- More **cosmetic skin pairs** added after a full audit of every alt-forme
  in the dex (~1.5% rare reskin, mechanics stay on the base):
  - **Sinistea** ↔ Sinistea-Antique (mirrors the Polteageist-Antique pair).
  - **Poltchageist** ↔ Poltchageist-Artisan (mirrors Sinistcha-Masterpiece).
  - **Basculin** ↔ Basculin-Blue-Striped (regional-color variant; note
    White-Striped is *not* cosmetic since it has a unique evolution to
    Basculegion and stays in the regular pool).
  - **Genesect** ↔ Genesect-Douse / -Shock / -Burn / -Chill (Drive forms,
    same BST / types / abilities — only Techno Blast's elemental type
    changes, which the rest of the game doesn't treat as a distinct identity).
  - **Keldeo** ↔ Keldeo-Resolute (Secret-Sword form, identical stats).
  - **Xerneas** ↔ Xerneas-Neutral (out-of-battle dormant pose, same stats).

- More **state-only formes** added to the never-roll list:
  - **Ogerpon-Teal-Tera / -Wellspring-Tera / -Hearthflame-Tera / -Cornerstone-Tera**
    — Terastallized states, same category as Mega / Gmax.
  - **Terapagos-Terastal / -Stellar** — Tera Shell auto-flip states.

- More **family-dedup species** so a player can't end up with the same
  legendary twice via different formes:
  - **Deoxys** — Normal / Attack / Defense / Speed share one identity (same
    DNA splice). Each forme still rolls distinctly so the player can land
    a glass-cannon Attack vs a wall Defense, but the team-uniqueness rule
    prevents holding both.
  - **Dialga / Palkia / Giratina** — Origin formes (Adamant Crystal /
    Lustrous Globe / Griseous Orb) are the same legendary trio. The
    Mystery Figure gate would otherwise let one player walk away with
    both Dialga and Dialga-Origin.

  (Therian formes, Lycanroc time-of-day variants, gender variants, and
  Gourgeist / Pumpkaboo size variants intentionally stay distinct — they
  have meaningful ability and stat-distribution differences and players
  expect each as a separate competitive identity.)

### Added — Pikachu (and friends) can show up in a rare cosmetic skin

- Every base species with a pure-cosmetic alt forme now has a **~1.5% "shiny-like"
  chance** to roll with that skin pinned on. The forme is purely visual — the
  Pokémon is still a Pikachu in every game-mechanic sense (same stats, same
  ability pool, same Raichu evolution, same builds, same move legality). Only
  the rendered sprite swaps.
- Coverage: **Pikachu** (14 skins — Cosplay, Rock-Star, Belle, Pop-Star, PhD,
  Libre, Original, Hoenn, Sinnoh, Unova, Kalos, Alola, Partner, World),
  **Pichu** (Spiky-eared), **Magearna** (Original), **Vivillon** (Fancy,
  Pokeball), **Maushold** (Four), **Squawkabilly** (Blue, Yellow, White),
  **Tatsugiri** (Droopy, Stretchy), **Dudunsparce** (Three-Segment),
  **Polteageist** (Antique), **Sinistcha** (Masterpiece). 27 skins across
  10 base species.
- The skin pins on `build._cosmeticForme` (same persistence convention as
  `_isShiny` / `_gender`), so it survives save/load and propagates from
  the slot into the in-battle mon as `mon.cosmeticForme`. A new
  `spriteDisplayName(monOrSlot)` helper reads the skin first, falling back
  to the canonical species name when no skin is pinned — wired into every
  sprite render site (battle, team panel, Cable Link, PC, Professor pick
  card, Evo Lab, Move/Dojo/Nature/EV tutors, trainer roster cards).
- Team-panel name line now shows a small cyan **✦ Belle / ✦ Fancy / …** badge
  on cosmetic-skinned mons, with a tooltip explaining the skin is purely
  visual so the player knows the underlying Pikachu mechanics are unchanged.
- Cross-species evolution drops a stale skin: evolving a Pikachu-Belle into
  Raichu re-rolls a fresh build (which gets its own ~1.5% skin chance for
  the new species), so the Belle decal doesn't bleed onto the Raichu sprite.

### Fixed — Cosmetic alt formes can no longer roll as a starter / wild

- **Eevee-Starter** (the Let's-Go partner forme, BST 435) and the full set
  of **Pikachu cosplay / cap / Let's-Go** formes (Cosplay, Rock-Star, Belle,
  Pop-Star, PhD, Libre, Original, Hoenn, Sinnoh, Unova, Kalos, Alola,
  Partner, World, Starter) are now excluded from every random-pool roll —
  Professor picks (including the City 0 starter pool), wild encounters,
  Cable Link re-roll/upgrade, Safari Zone, casino prizes, trainer
  synthetic teams, and the legendary Mystery Figure gate. None of these
  formes have evolutions in the dex, so picking one as the starter (which
  is **bonded for life**) used to permanently lock the player out of the
  Stone Sage evolution path. The base species (Eevee, Pikachu) is
  unaffected and still rolls normally.
- Same filter is also applied to **in-battle state formes** that should
  never be the canonical roster pick — Mimikyu-Busted, Aegislash-Blade,
  Darmanitan-Zen (and Galar-Zen), Wishiwashi-School, Minior-Meteor,
  Cherrim-Sunshine, weather Castform, Morpeko-Hangry, Palafin-Hero,
  Eiscue-Noice, Cramorant-Gulping/Gorging — and to **Totem variants**,
  **purely cosmetic pattern formes** (Vivillon-Fancy/Pokeball,
  Maushold-Four, Squawkabilly-Blue/Yellow/White, Tatsugiri-Droopy/
  Stretchy, Dudunsparce-Three-Segment, Polteageist-/Sinistcha-Antique/
  Masterpiece, Pichu-Spiky-eared, Magearna-Original), and the
  raid-only Eternatus-Eternamax shell.
- Competitive alt formes that **are** in randbats and players expect to
  see (Hisuian / Galarian / Alolan regional variants, Therian Tornadus /
  Thundurus / Landorus / Enamorus, Kyurem-Black/White, Hoopa-Unbound,
  Calyrex-Ice/Shadow, Necrozma-Dusk-Mane/Dawn-Wings, Greninja-Ash, etc.)
  are intentionally **not** filtered.

### Fixed — Stone Sage can evolve legacy cosmetic-forme saves

- If an older save happens to carry one of the now-filtered formes
  (a Pikachu-Original from a pre-fix run, say), the Stone Sage now falls
  back to the base species' evolution list rather than declaring the mon
  "fully evolved". Pikachu-Original → Raichu / Raichu-Alola, Eevee-Starter
  → any of the eight Eeveelutions, etc.

### Fixed — Starter status survives Stone Sage evolution

- Evolving the starter (or any nicknamed / bonded Pokémon) at the Stone
  Sage now **preserves the slot's identity** — `starter`, `unsellable`,
  `nickname`, the stable slot `id`, and any catch metadata. Previously
  the new slot was rebuilt as `{ name, build }` only, which silently
  stripped the ★ STARTER badge and let the evolved mon be sold at the
  Underground. The Cable Link rebuild path (same species, fresh build)
  now also preserves the same metadata.

### Reason

A player who happened to roll **Eevee** at the City 0 Professor could
actually land on **Eevee-Starter** — the dex includes both as separate
species, and the alt forme passed every existing filter. Once
"chosen for life" it had no `evos`, so the Stone Sage screen flat-out
told the player their starter was fully evolved. The same trap was set
by every cosplay / cap Pikachu and several in-battle state formes. The
fix excludes the variants that don't fit the story's evolution-as-
progression mechanic, while leaving Arceus / Silvally (already family-
deduped) and the competitive alt formes alone.

## Unreleased — Story-mode flow, writing & immersion 2026-05-16 (`claude/story-mode-flow-LS32t`)

### Added — Per-city arrival welcome screen

- Entering a city for the first time in a run now opens a short welcome
  overlay: the city name, its specialty banner, two lines of in-world
  flavor, and a portrait of the resident Professor/City Guide. Uses the
  existing city background SVGs and trainer sprites so the screen fits
  the rest of the story-mode chrome.
- One overlay per city per run (City 0 keeps its existing cold-open as
  its arrival). Tracked via `sm.citiesArrived`; migrated saves back-fill
  the flag for cities already passed through so returning to an
  in-progress run doesn't pop the overlay mid-game.

### Changed — Professor visits are now must-do to leave town

- "Continue to Next Route" is locked the same way "Challenge the Gym
  Leader" already was when the city's Professor is on the board and
  hasn't been visited yet. The button shows a `Visit Professor first`
  hint; the legendary Mystery-gate variant keeps its own message.
- The city dialog gets a `⚠ Must-do: Visit the Professor` line at the
  top whenever a Professor is unvisited, so the gate is announced
  before the player taps a locked button.

### Changed — City writing pass (guide quotes, Professor quotes, blurbs, openings)

- `CITY_GUIDE_QUOTES` (12 entries) and `CITY_PROFESSOR_QUOTES` (12
  entries) rewritten end-to-end. Tone: Pokémon-world voice with a
  sharper edge — references to the gym scene, the Underground, the
  Move Tutor / Dojo / Casino circuit, the Plateau. Less greeting-card,
  more in-world.
- `CITY_SPECIALTY_BLURBS` tightened to one-line city identities
  (`Hometown. The lab, the starter, and the only road that goes north.`
  etc.).
- New `CITY_ARRIVAL_LINES` (10 entries) drives the welcome overlay's
  scene-setter.
- `PROF_QUOTES` rewritten with the same voice — the three-choice
  Professor screen now reads like a working lab, not a tutorial bot.
- Pallet Town cold-open, intro-rival cold-open, and the City 0
  welcome / "what is a Gym" tips all updated to match.

### Reason

Story-mode flow audit ([STORY_MODE_FLOW.md](STORY_MODE_FLOW.md))
flagged two recurring complaints: city guide text was bland, and
players could blow past the Professor in post-gym hubs without
realizing they were missing a team slot. The welcome overlay gives
each city a sense of arrival; the gated route + must-do beacon makes
Professor visits structurally mandatory; and the writing pass brings
the city/Professor copy in line with the existing leader/elite/
champion victory lines.

## Unreleased — Build power tier curve (story scaling) 2026-05-16 (`claude/improve-build-generation-7AOc7`)

### Added — 4-tier training-quality curve across the story

Foe builds and player-obtainable mons now scale on a **build power tier**
that's independent of the species' Grade (G1–G4). The same Pokémon can
appear at any tier — the tier captures *training quality*, not species
strength. Tier rules:

| Tier | Name | EVs | Nature | Ability | Item |
|---|---|---|---|---|---|
| T1 | Untrained | 0 total | Neutral (Hardy/Docile/Serious/Bashful/Quirky) | Default (`abilities[0]`) | None or flavor berry |
| T2 | Novice | ≤220 total (capped/scaled from Smogon spread) | 35% chance neutral, else kept | Kept | Elite items downgraded to flavor type-boost / Eviolite / Leftovers |
| T3 | Competent | ≤420 total | Kept | Kept | Kept (no elite swap) |
| T4 | Tournament | Full Smogon (510/252-252-4) | Kept | Kept | Kept (current behavior) |

Move sets and gimmick-bound items (Mega Stones, Z-Crystals, Tera Blast)
are preserved at every tier — the goal is training quality, not species
rebuilds. T4 is a no-op; the source `makeBuild` output is already
tournament-quality.

### Story curve — who sits at which tier

**Foes** (`_storyBuildTierForEvent`):

- Pre-Gym-1 Basic Trainer / Intro Rival / Gym Trainer 1: **T1**
- Pre-Gym-1 Gym Leader 1: **T2** (slightly above the route average)
- Post-Gym-1–2 Gym Leader, Basic Trainer at 3 badges, Rival at 1 badge: **T2**
- Gym Leader 3–5, Gym Trainer 2 / Elite Trainer at 3+ badges, Basic Trainer at 6+ badges, Rival at 3+ badges: **T3**
- Gym Leader 6–8, all Elite Trainers at 6+ badges, E1–E4, Champion, Victory Road, post-HoF Mystery Figure, league Rival: **T4**
- Battle Frontier and any post-HoF rematch (badges = 8): **T4** (frontier already scales via stat-boost, not build polish)

**Player obtainables** (`_storyBuildTierForProfessor` + `makeWildBuild`):

- Starter from City-0 Professor: **T1** — symmetric with the T1 intro
  rival; the player develops their starter via tutors as the story unfolds.
- Professor gifts at later cities scale with city + badges: **T1 → T2 → T3 → T4** by city 7+ / 6+ badges.
- Catch-tutorial partner: **T1** (now routed through `makeWildBuild` so it
  sits in the same tier band as every other wild catch — keeps the partner
  from out-classing the freshly-picked starter).
- Wild route catches & Safari catches: **T1** (`makeWildBuild`'s existing
  170-EV head-start; tier metadata only newly added).
- Legendary mystery-gate offer (City 8 pre-Victory-Road), Caged God
  capture, roaming sub-legendaries: **T4** (one-shot story rewards stay
  battle-ready out of the box).
- Link Station rebuild / reroll / upgrade (paid gold): **T4** — the
  Link Station is the "pay to upgrade everything now" button by design.

### Why this matters

The existing tutor economy (Move Tutor, EV Trainer, Nature Rater,
Battle Dojo for item swaps) had no real headroom because every
Pokémon — Professor gift or wild catch — already arrived as a fully
EV-maxed, perfect-nature, top-pool-ability, optimal-item competitive
build. Tutors were cosmetic. With the new tier curve, a freshly caught
wild starts at T1 and the player has a concrete upgrade path through
the run: tutors and EV training meaningfully shift the mon from T1 →
T2 → T3 → T4. Foe scaling mirrors this curve, so the early route
trainers actually *feel* like route trainers (no item, neutral nature,
0 EVs) instead of Smogon imports, while the Elite Four and Champion
keep their tournament-grade weight at the top.

### Hooks

- `_storyDowngradeBuildForTier(name, build, tier)` runs after
  `_applyEnemyGimmickDistribution` in both `rollTrainerTeam` branches
  (standard and rival) so structural moves and gimmick stones are
  preserved while training quality softens.
- `_applyStoryBuildPowerTier(team, eventType, storyRowIdx)` stamps
  `build.powerTier` on every slot for future inspector UI; tier 4
  short-circuits.
- Mystery Figure final boss roll (`rollMysteryFigureFinalBossTeam`)
  also passes through the hook for tier-metadata consistency.
- Professor flow downgrades each generated choice in-place before the
  card renders, so the player sees the actual training level they'll
  receive (Hardy nature, no item, partial EVs) and can weigh it
  against the curated species.

### Merge-ready polish

- **Acrobatics safety**: the downgrade now detects `Acrobatics` in the
  moveset and forces `build.i = ''` at both T1 and T2 instead of
  swapping in a flavor berry. Without this guard, an Acrobatics-Hawlucha
  rolled at T1 / T2 would silently lose half its damage (110 → 55 BP).
- **Training-tier badge on Professor pick cards**: a small chip next to
  the species name reads `Untrained · Novice · Competent · Tournament`
  in tier-specific colors (gray / green / blue / gold). Hover / tap
  reveals a tooltip explaining the tier and what tutors can lift it to.
  Skipped (gracefully renders empty) when `build.powerTier` is undefined
  on legacy locked-foe-team saves.
- **One-time onboarding tip** consolidated into `prof-overview-v2` —
  one popup per save that covers Professor vs wild AND the new tier
  system. Replaces the older `prof-vs-wild` tip; chained
  `showGameAlert` calls would clobber each other (non-blocking) so a
  single message is the only clean path.
- **`window.StoryMode.debugBuildTiers()`** — console helper that
  prints two `console.table` matrices (foe tier by event × badges, and
  Professor tier by city × badges) so the curve can be audited live
  without walking the whole story.

### What's not in this pass (Phase B)

- Move-quality scaling (replace top-BP moves with level-up filler at
  T1) — held back to avoid learnability bugs.
- Settings toggle to disable the tier curve — default is always-on; a
  toggle was deemed UI noise.
- Tier badge on player team panel / in-battle foe inspect — would need
  dynamic tier recomputation (tutors change EVs / nature / item, so a
  stamped tier goes stale). Current badge is decision-point only.

## Unreleased — Safari Zone authentic gameplay loop 2026-05-16 (`claude/safari-zone-gameplay-vxFOb`)

### Added — Per-turn flee on Bait/Rock (canonical Safari Zone tension)

- The wild Pokémon may now flee at the end of **any** turn — Bait or Rock
  turns included, not just after a missed throw. This is the core
  dilemma the real Safari Zone is built around: every rock improves your
  eventual catch chance, but the wild may bolt on the same turn you
  threw it. Without this, Bait/Rock were "free" actions that just
  stacked modifiers; with it, the bait/rock loop is a real bet.
- **Bait stays gentle.** Bait turn flee multiplier is `0.20×` the
  post-miss formula — typically 1–6% per turn. The Pokémon is occupied
  eating, so wandering off is unlikely but not impossible.
- **Rock is the real gamble.** Rock turn flee multiplier is `0.55×` —
  ~20–40% per turn, scaling fast with each rock stack. Capped at 45%
  (`SAFARI_TURN_FLEE_CAP`) so no single action ever auto-flees.
- The Bait and Rock buttons now surface their **per-turn flee chance**
  inline (e.g. `🪨 Rock — flee 28%`), so the gamble is legible at the
  point of decision — same affordance as the catch-% badge on the ball.
- Buttons disable at 3 stacks to make the cap obvious.

### Changed — Safari catch math slightly more forgiving overall

The new per-turn flee adds real session risk, so the catch side gets a
modest boost so a 6-encounter run still feels rewarding instead of
brutal:

- **Safari Ball multiplier `1.25× → 1.35×`.** The baseline (no
  bait/rock) Safari throw is now between Poké and Great rather than
  just above Poké. A G3 with a fresh Safari Ball is ~30% instead of
  ~28%.
- **Rock catch multiplier `1.45× → 1.65×`.** Stacking rocks is now
  genuinely powerful: a G3 after 2 rocks goes from ~58% to ~81% (and
  hits the catch-mult ×4 cap at ~88% with a third rock — G4 caps at
  100%). The trade-off is steep — 3 rocks means three per-turn flee
  rolls — but if you get there, the throw is essentially decided.
- Bait catch multiplier (`0.70×`) and flee multipliers
  (`0.55×` bait / `1.70×` rock) are unchanged — the strategic axes
  stay the same; only the levers got sharper.

### Added — Safari Zone flavor polish

- Dedicated **🦒 Safari Zone** header on the catch screen when inside a
  Safari run (was the generic "🌿 Wild Encounter"). Boss and tutorial
  flows get their own headers too. Restored on exit.
- **PA-style end-of-session announcements** replace the dry "session is
  over": `📣 "Ding-dong! Your Safari Zone game is over!"`, `📣 "Ding-dong!
  You're out of Safari Balls — game over!"`, and a warm
  `📣 "Thanks for visiting the Safari Zone! Come again soon."` on early
  exit. Same vibe as the canon games' warden voice.
- **Grade-keyed opening flavor** for each Safari encounter. G1 reads as
  "rare, alert, ready to bolt"; G4 reads as "ambling, friendly, curious".
  Replaces the same "Safari Pokémon appeared!" copy for every wild —
  the player now has an observation cue before picking Bait vs. Rock.
- Welcome modal expanded to spell out the per-turn flee rule so
  first-time visitors know "every turn the wild may flee" before they
  start clicking Rock.
- Tutorial tip rewritten to call out the per-turn flee and the
  bait-vs-rock gamble explicitly.

### Reason

The previous Safari Zone replicated most of the canon loop (session
balls, bait/rock asymmetry, encounter cap, exclusive Safari Ball) but
missed the single mechanic that makes the real Safari Zone *feel* like
a casino: the wild can flee on any turn, not just after a missed throw.
Without per-turn flee, the optimal play was always "stack 3 rocks
risk-free, throw once" — Bait/Rock were modifier sliders, not
decisions. Adding per-turn flee restores the real dilemma, and the
modest catch-rate boost (Safari Ball 1.35×, Rock catch 1.65×) keeps a
6-encounter session from collapsing into "everything fled, I caught
nothing".

## Unreleased — Story-mode event registry refactor (architecture) 2026-05-17 (`claude/refactor-story-mode-PDZsW`)

### Changed — Internal architecture, no behavior change

- Story mode's per-event flow (cold-open scenes, catch tutorial, roaming
  legendary, wild route) is now driven by three small declarative registries
  living just above the `enterBattleEvent` dispatcher in `battle.html`:
  - **`STORY_BEATS`** — per-row metadata (kind, gym/elite number, tags,
    optional cold-open tag). Rows not listed fall back to a derived default.
  - **`STORY_COLD_OPENS`** — one-shot pre-battle scenes, cross-run-deduped
    via story meta `tipsShown`.
  - **`STORY_BATTLE_INTERRUPTS`** — ordered list of pre-battle catch screens.
    Each interrupt's `prepare(battleIdx, ev)` returns the encounter spec
    or `null`; the first non-null wins. Roaming preserves legacy
    "consume-on-predicate-match" semantics via `markWildSeenOnPrepare`.
- A fourth registry, **`STORYLINE_VARIANTS`**, lets the same timeline play
  with different narrative framing — a variant can shadow any beat
  (`beatOverrides[rowId]`) without affecting the difficulty curve. Pokémon
  picks still flow through the existing rollers (`rollTrainerTeam` reads
  the row's `gradeWeights`; `rollWildEncounter` reads the badge-keyed wild
  curve), both gated by `sm.settings.enabledGens`. A variant changes the
  *story around* the fight, never the foe roster math.
- `enterBattleEvent` is now a three-step dispatch: resolve the beat, run
  the cold-open via the bus, run the interrupt chain, then fall through to
  the unchanged trainer-setup block. The previous stacked-`if` block (one
  per scene type) is gone.

### Player-facing surface

- **Zero visible change** at v17 for existing runs — the refactor preserves
  the exact pre-battle sequencing (cold-open → catch tutorial → roaming
  legendary → wild route → trainer fight). Verified against the legacy
  semantics with targeted smoke tests: beat resolution for known/unknown
  rows, cold-open meta gating, interrupt ordering, and roaming consuming
  its slot even when `makeBuild` returns null (legacy parity).
- Save schema: `SAVE_VER` 16 → 17. `sm.storyLine` (default `'classic'`) is
  the new field; `migrateStoryPreV17` sets it on any v16 save that's
  loaded. Invalid values (number, empty string, null) all fall back to
  `'classic'` at read time, so a corrupt save never strands the bus.

### Testing & extensibility surface

- New `window.StoryMode` inspection helpers — handy from DevTools when
  adding new content:
  ```js
  window.StoryMode.getStoryBeat(rowId);     // merged beat for a row
  window.StoryMode.getActiveStoryline();    // current variant object
  window.StoryMode.listStorylines();        // available variant ids
  ```
- Adding a new pre-battle scene is now one append to
  `STORY_BATTLE_INTERRUPTS` — no edits to `enterBattleEvent`.
- Adding a new cold-open is one entry in `STORY_COLD_OPENS` and a
  `coldOpen` tag on the relevant `STORY_BEATS` row.
- Adding a new storyline variant is one entry in `STORYLINE_VARIANTS`
  with `beatOverrides` for the rows being retuned. The registry already
  understands variants; surfacing a picker UI is the only missing piece
  and lands when variant #2 ships.

### Reason

Before this pass, deepening any single story beat (richer rival dialogue,
a unique pre-fight scene for a specific gym leader, a one-shot encounter
between two cities) meant editing the same ~80-line block inside
`enterBattleEvent` and threading state through ad-hoc flags. That made
content edits feel structural and structural edits feel scary. Splitting
the metadata out into a registry and the orchestration into a bus means
the dispatcher stays small, content lives in one obvious place per beat,
and the door is open to actual storyline variants — same map, different
journey, same Pokémon rules — without rewriting the engine each time.

### Docs

- `STORY_MODE_FLOW.md` §17 documents the architecture, the common-case
  edit recipes ("how do I add a cold-open / interrupt / variant"), and the
  adapt-to-ruleset contract (static narrative beats + flexible species
  rolls bound by enabled gens, the row's grade weights, and the badge
  curve).

## Unreleased — Calmer city hub + responsive tutor/market screens 2026-05-16 (`claude/improve-city-design-0pNO3`)

### Changed — City hub visual design

- Toned down the seven competing border colors on action buttons
  (red / green / orange / cyan / teal / purple / pink) to a single calm
  neutral surface. Section identity now lives on a small left-edge accent
  stripe + a section-coloured icon + the section header. Only the
  primary call-to-action (the next gym / route / league button) keeps
  its bold red border — the eye now lands on it immediately instead of
  fighting seven equally loud chips.
- The pulsing red **"New!"** badge that flashed on every unvisited
  facility is gone. Unvisited facilities now show a calm gold **"New"**
  pill, and visited facilities show a soft **"✓"** tag — the same
  information without the carnival lights. Visited rows also dim ~22 %
  so the player can scan "what's left to try" at a glance.
- Hover no longer slides the whole button 4px to the right; it now
  brightens the border in place, which feels less twitchy on touch
  devices that fire hover on first tap.
- Section headers gained a subtle `(n)` count, so "Train (5)" tells
  the player how dense each group is before they scroll.
- The NPC dialogue box no longer gets stuffed with milestone shoutouts
  ("📻 4 Badges earned…"), facility barkers, or rival warnings. Milestones
  fire once as a calm toast on entry; everything else lives in the tip rail.

### Changed — Should-be-visited / smart suggestion rail

- The tip rail is capped at 3 items (was 4 + a quote-stuffed barker).
  The first slot is always **"Next: …"** with a soft gold treatment, so
  the answer to "what now?" is the first thing the eye lands on.
- Tips are now **directly wired to the relevant facility button**:
  when "3 Pokémon have empty move slots" appears in the rail, the
  Move Tutor button below picks up a soft gold outline so the player
  can find it without scanning. Suggestions feed: empty move slots →
  Move Tutor, missing held items → Battle Dojo, no EVs → EV Trainer,
  free relic available → Relic Annex, unspent Rare Candies →
  Evolution Tutor, unspent Vitamins → EV Trainer.
- Per-city / per-facility "seen" state (`sm.facilitiesSeen[cityIdx][key]`)
  is unchanged on the data side — only the visual presentation changed.

### Changed — Mobile city portrait sidebar

- On phone portrait, the NPC portrait + name now sit side-by-side in
  a 72px-tall strip (was a 120px stacked block). That recovers ~50 px
  of vertical space above the action list, so on a typical 720×640
  phone window the first action button is visible without scrolling.

### Changed — Pokémart & Department Store

- Items are grouped into **Balls / Healing & Revives / Stat Boosters /
  Field Effects / Battle Utility** sections, each with a small
  uppercase strap and a count chip. The Pokémart used to be a 12-item
  unsorted grid that all looked alike; now a player looking for "the
  ball" or "an X Speed" lands on the right group instantly.
- The **Buy** button bumped from a cramped 24 px-tall, 11 px-font
  tap target to a 34 px desktop / 42 px mobile button, so accidental
  taps on the wrong row are no longer reported.
- Prices that the player can't afford render in red instead of gold,
  matching the existing "cant-afford" tone used on city action badges.
- The Relic Annex got the same button treatment plus a cleaner card
  background; the artifact cards now feel like first-class siblings
  of the Pokémart cards instead of a one-off styling.

### Changed — Move Tutor / Dojo / Nature / EV Trainer / Stone Sage on phone

- When a Pokémon is expanded in the tutor accordion, the mon's header
  row now sticks to the top of the scroll area. Players editing 4
  move slots in a row no longer lose track of *which* mon they were
  editing while scrolling.
- Move-tutor filter input, move list, and "Teach selected" button all
  scale up on phone (38–42 px tap targets, 13 px font) — same
  treatment for the dojo's item/ability option buttons and the
  Stone Sage's evolution chips.
- The tutor card accordion header itself grew to a 56 px tap target
  (was ~36 px), removing the "I keep tapping the wrong mon" reports.

### Reason

The city hub is the screen players see the most — between every
battle, often dozens of times per run — and it had gradually
accumulated seven button colors, a pulsing red badge per facility,
and a quote box that was stuffed with system messages on top of NPC
dialogue. The combined effect was chaotic on desktop and overwhelming
on phone portrait, where the action grid was pushed below the fold by
the noisy NPC sidebar + bloated quote + 4-pill tip rail. The redesign
keeps every facility, every facility's identity (via icon + stripe +
section header), and every cost / new / free indicator — but presents
them with the restraint the rest of the retro-GBA UI uses elsewhere.

The "should-be-visited" suggestion rail closes a separate gap: the
old system surfaced the *need* ("3 mons have no EVs") but didn't link
it visually to the *solution* button below. New players had to read
each tip, then re-scan the action list to find the right facility.
Now the suggested button glows softly, so the tip and the answer line
up at a glance.

The tutor/market screens shared the same family of problems — tiny
tap targets, long lists with no grouping, no sticky context — and
got the matching mobile-first treatment in the same pass since they
sit one tap away from the hub.

## Unreleased — Story-mode investigation pass: cleanup, climax, casino 2026-05-16 (`claude/story-mode-investigation-lILFs`)

### Changed — Active party cap = `2 + badges`, foes match player team size 1:1

- `_storyMaxPartySize()` is the **badge curve** (`max(2, min(6, 2 + badges))`):
  starter slot is always available, the catch tutorial fills slot 2 right
  after the intro rival, and each gym badge unlocks one more slot up to 6
  at four badges. Catches and Professor gifts above the cap still succeed
  — they land in the PC, so a player can always *catch*, they just can't
  *field* more than the active cap until the next badge.
- `_storyEnemyPartySize()` is now **player-matching with per-role floors**.
  Foe size = player team length, but no smaller than:
    Basic / Gym Trainer / Elite Trainer = 1,
    Rival = 2,
    GL1–2 = 2, GL3–4 = 3, GL5–6 = 4, GL7 = 5, GL8 = 6.
  Story finales (Champion / E1–E4 / Victory Road / post-HoF Mystery Figure)
  still field a full 6 regardless. Intro rival stays a pure player-match
  (1v1 starter duel).
- Result: a player who runs lean fights lean trainers run-to-run; a
  player who builds full faces 6v6 trainer fights from Gym 5 onward.
  The cap and the foe-size formula stay locked on the same progression
  clock so every battle is a readable, fair fight regardless of how
  many wilds the player caught.
- Restored the city hub party label's "(next slot at N badges)" hint and
  the PC storage tab's "(next slot at badge N+1)" cap-hint that the
  earlier flat-6 pass had stripped.

### Changed — Post-HoF first reentry routes through Mystery Figure (row 67)

- Row 67 in `STORY_EVENTS_RAW` is no longer skipped on the way to the
  post-game hub. `continuePostGame()` snaps `sm.eventIndex` to row 67 and
  sets `sm.crucibleBattleSource = 'postHofMystery'` so the post-battle
  interceptor (`_handleCrucibleBattleEnd`) flips a new save flag
  `sm.postHofMysteryClimaxDone` and routes the player back into the
  existing Master-Ball / boss-arc / lastCity flow. Result: the Mystery
  Figure climax fires exactly once per save as a one-time mask-drop beat,
  then the Crucible / Caged God doors stay open at every later city visit.
- `processNextEvent` re-establishes the dispatch source if the player
  reloads while still standing on row 67 with the climax flag unset
  (e.g. tab closed mid-fight), so the climax can't loop into a save-
  killing dead-end.
- Migration: existing saves that already have `sm.bossArc.available`
  set are marked climax-done in v16 so they skip the new beat entirely.

### Changed — Poké Casino has three wager tables instead of one

- Same one-line core RNG (a single d10) but three modes layered on top:
  - **Coin Flip** — Heads/Tails, pays 1:1, 50% (parity of the roll).
  - **Color** — Red/Black, pays 1:2, 30% (roll 1–3 = Red, 8–10 = Black,
    4–7 = neither). Small house edge.
  - **Jackpot** — pick a number 1–10, pays 1:9, 10%. High-variance kicker.
- The bet chip row, the gold HUD, and the result line are unchanged;
  the screen body adds three labelled clusters so the player can read
  the odds at a glance before choosing.

### Fixed — Boss-arc legendary roll honors the run seed

- `_bossArcRollLegendary()` now picks the species through `storyRngNext`
  (when `sm.active`) instead of bare `Math.random()`. The chosen legendary
  is locked into the save once unlocked, so the same `runSeed` and
  generation toggle now reproduce the same Caged God across machines.

### Fixed — Pokémon Center entry uses the same interaction guard as siblings

- `enterPokemonCenter` now wraps in `_storyTryBeginInteraction()` /
  `_storyEndInteraction()` like every other facility entry. Closes a
  tap-spam race where the screen could re-enter mid-`save()`.

### Removed — Dead `partyEverReached2` / `partyEverReached4` flags

- Both flags were written in six places and never read anywhere; the
  CHANGELOG had described them as the G4-strip gate, but the actual
  gate in `storyStripGrade4IfPartyMature` is `sm.badges < 1`. Removed
  the writes and the schema-default entries; behavior is unchanged.

### Doc — Spec drift caught up

- `STORY_MODE_FLOW.md` catch-rate table updated to the live constants
  (G1 4% / G2 12% / G3 22% / G4 35%, per-grade flee 55/40/28/20) and
  notes Safari Ball at the live 1.25× multiplier.
- §9 (boss arc) rewritten to describe the new row-67-once flow.
- New §14e clarifies that internal action keys (`Pokemart`, `Pokemon
  League`, `Pokemon Breeder` sprite IDs) keep their ASCII form; only
  user-facing copy is renderered with the diacritic.
- `agent-state/CODEBASE_MAP.md` Safari row updated to the live
  2,500G entry / 15-ball / 1.25× / g1:3/g2:22/g3:50/g4:25 numbers.

### Misc

- Stale comment over `SAFARI_BALL_MULT` (called it "1.5×, between Great
  and Ultra") corrected to match the live value. (Note: the Safari Zone
  gameplay-loop branch superseding this PR bumps the same constant to
  1.35× and rewrites the comment again — see the entry at the top of
  this file.)

## Unreleased — Vitamin / EV-training balance pass 2026-05-16 (`claude/balance-vitamins-stats-PAaPn`)

### Added — Vitamin distribution fills the gym dead zones

- Gym Leaders 1, 2, 4, and 6 now each drop **+1 Vitamin Pack** as part
  of their reward bundle. Previously vitamins only began at Gym 3 and
  the curve had four gym victories with zero EV-investment access.
- **Mid-game route find** — first Basic/Elite Trainer cleared while
  holding exactly 4 badges drops 1 Vitamin Pack with a "found in the
  tall grass" flavor message. Gated by `sm.staticDrops.vitaminRouteMidgame`
  so it can only fire once per save.
- Per-run vitamin total rises from 9 guaranteed (gym/league only) to 14;
  up to 16 with a full Pokédex.

### Changed — UI surfaces the EV-training permanence rule

EVs were already permanent and traveled with the Pokémon through PC
deposit/withdraw, evolution, and tutor work — but nothing in the UI
told the player that. Players could release a fully trained Pokémon
without realizing the investment went with it.

- **Vitamin Pack tooltip** in the bag now explicitly states the
  investment stays with the mon forever, only lost on release or sale.
  Rewritten in plain language with a concrete example
  (+252 Atk / +252 Speed) and the 5,000G equivalence.
- **Buck quote pool** at the EV Trainer gains a permanence line.
- **PC Release confirm** appends "Its EV training will be lost too."
  when the slot has any non-zero EVs.
- **PC Underground Sell confirm** appends the same EV note when
  applicable, and the tab intro banner mentions the same.

### Added — EV Trainer onboarding & vitamin discoverability

The EV Trainer screen previously surfaced only a random Buck quote and
the per-mon preset cards — new players had no persistent answer to
"what is an EV?" and players carrying unused Vitamin Packs through
no-EV-Trainer cities (City 2, 3, 5) had no reminder beyond the bag tab.

- **Persistent info banner** at the top of the EV Trainer screen.
  Plain-language explainer (what EVs are, 252/510 cap, permanence rule)
  plus a live state line — pink "💊 N Vitamin Packs ready" call-out
  when the player has any, gold-cost reminder when they don't.
- **Clearer Vitamin button label** on each preset: "💊 Use Vitamin
  (N left)" replaces the more ambiguous "💊 Vitamin (N)" so mobile /
  touch users who can't see the hover tooltip still understand it's
  a consume action.
- **City tip in no-EV-Trainer cities** — quiet "💊 N Vitamin Packs
  saved — use at next EV Trainer" reminder. Clicks open the bag so the
  full tooltip is one tap away. Existing tip in EV-Trainer cities
  unchanged.

### Reason

The previous vitamin curve front-loaded the "leveling up" feel into the
middle and end of a run — early-game Pokémon could not be EV-trained
without a 5,000G/preset gold sink, so most starters fought their first
three gyms untrained. Filling Gyms 1/2/4/6 with one Vitamin Pack each
plus a single mid-game route find restores a steady "every gym = a real
power bump" cadence without changing caps, foe scaling, or the swap
mechanic. 252/510 caps remain the guardrail against runaway investment.

### Not changed (deliberate)

- Per-stat cap: 252. Total cap: 510. Untouched.
- EVs persist across party/PC swaps. The "swap loses investment" rule
  asked about during planning was **never implemented in code** — only
  release/sell loses the investment, and the UI now makes that explicit
  rather than introducing a new commitment penalty mid-game.
- Foe stat scaling (`applyStoryLeagueFoeStatBoost`, difficulty mult)
  unchanged. The +14 vitamin curve was tuned to fit inside the existing
  Champion +30% HP / +15% bulk league boost.

## Unreleased — Random wild encounters keyed on grade + gen toggles 2026-05-16 (`claude/random-wild-encounters-wNB0M`)

### Changed — Wild grade pool is now a standalone progression curve

- Route wilds previously inherited the next trainer's `gradeWeights`
  shifted one tier weaker, which meant the wild you fought right
  before a gym felt suspiciously like a preview of the gym leader's
  tier mix (and the curve had odd shoulders at rows where the
  trainer's grade jumped). Wild rolls now read a dedicated
  badge-keyed table (`_WILD_GRADE_CURVE_BY_BADGES`) that doesn't
  touch the trainer fight at all — the two inputs to a wild roll
  are **the player's badge count** and **the enabled-gen toggles**,
  full stop. Wilds reflect the route's biology, not the upcoming
  trainer's lineup.
- The new curve scales smoothly from 0 badges (all G4) to 8 badges
  (G1:20 / G2:70 / G3:10), and is tuned to sit roughly one tier
  behind the contemporaneous trainer roll at every step. Concrete
  early-/mid-/late-game shape:
  - 0 badges → G4 only.
  - 2 badges → G3:40 / G4:60.
  - 4 badges → G2:25 / G3:60 / G4:15.
  - 6 badges → G1:3 / G2:60 / G3:35 / G4:2.
  - 8 badges → G1:20 / G2:70 / G3:10.
- Species pick inside the chosen grade was already pure `Math.random`
  (not seeded story RNG), so reloads and rematches each surface a
  different species. That stays.
- The Crucible's wild encounter button now flows through the same
  `rollWildEncounter` path — at 8 badges (post-HoF) it resolves to
  the late-game curve above, replacing the hardcoded G1:10 / G2:30
  / G3:40 / G4:20 mix.

### Reason

The user spec for wild encounters is "random, based **only** on the
grade system and the toggled generation settings, balanced with a
fun challenging curve through story mode." The old derive-from-
trainer-then-shift formula technically used grades + gens, but the
trainer's row was a third hidden input that made the curve
non-monotonic across the timeline and coupled the wild experience
to the next fight's identity (gym-trainer vs. basic-trainer rows
could roll different wild pools at the same badge level). Pulling
the curve onto its own table — explicitly indexed by badges —
gives a single readable progression you can tune, keeps the wild
intentionally one tier behind the foe ahead, and frees the wild
roll from any awareness of the trainer fight it precedes.

## Unreleased — Simplify game modes (default = Classic, all mechanics on) 2026-05-16 (`claude/simplify-game-modes-vHlMS`)

### Changed — Battle menu defaults & hidden advanced toggles

- The main battle menu no longer exposes the four mechanic checkboxes
  (Mega / Z-Move / Dynamax / Tera) or the Classic ↔ Unlimited radio.
  All four mechanics are **always on**, and **Classic** (one use per
  team) is the only mode. This removes a confusing pre-battle decision
  most players ignored.
- The same toggles still exist in **Story setup**, but are now folded
  into a collapsible "Advanced (mechanics, mode, item rules)" section
  that ships closed. The **No Item Run** checkbox lives in the same
  section. Defaults: all mechanics on, Classic, item run normal.
- Online PvP inherits the new defaults via the host's `settings`
  (no contract change). Existing story saves keep whatever they were
  started with.

### Reason

Two independent knobs (which mechanics are legal, and whether each
one is once-per-team or once-per-mon) doubled the design surface for
no real benefit — the build planner and AI were both implicitly
balanced around "Classic + all on", and the toggles mostly created
confusing edge cases (e.g. "why is Mega greyed out?"). Hiding them
behind a story-only advanced section keeps the system available for
the few players who want it without making it the first thing
everyone sees.

## Unreleased — Post-rival catch tutorial (FireRed/Emerald-style) 2026-05-16 (`claude/balance-story-mode-Vf3Vj`)

### Added — Static "your first wild" catch tutorial

- Right after the intro rival victory, a one-time event interrupts the
  next battle: a friendly **Grade-4 wild** (drawn from a curated
  `STARTER_PARTNER_POOL` of generation-appropriate route fauna — Pidgey,
  Rattata, Lechonk, Skwovet, etc.) appears with a guaranteed catch
  (100% on first throw, no flee) and a richer "🎓 CATCH TUTORIAL" tip
  walking the player through ball multipliers and the percentage math.
- The Run button is hidden — this is a "must catch" event, modeled on
  the FireRed Weedle / Emerald Zigzagoon catching demos.
- Flagged via `sm.catchTutorialDone` so it fires exactly once per save.
- Net effect: the player leaves the intro-rival zone with **2 mons**
  guaranteed, so the first wild route, the next basic trainer, and
  Gym 1 are at least 2v2. No more 1v1 number-cheese opening.

### Reason

After yesterday's pass made foe size match player team size, a player
who skipped the pre-rival wild route ended up at Gym 1 with just
their starter — fighting 1v2 against the gym leader's role-floor of
2 mons. That felt off. The catch tutorial closes the loop: it
teaches the mechanic, adds flavor pacing between the intro rival and
Gym 1, and guarantees the player always has at least 2 mons by the
first gym — without forcing a partner directly into the starter
flow.



### Changed — Foes now match the player's team size

- Replaced the badge-curve foe sizing with **player-matching**: foe
  party size = player party size, with a small per-role floor so a
  1-mon trainer still feels like a real fight pre-Gym 1. Floors:
  trainers 1, rivals 2, GL1–2 = 2, GL3–4 = 3, GL5–6 = 4, GL7 = 5,
  GL8 = 6. Story finales (Champion + Elite Four + Victory Road +
  post-HoF Mystery Figure) still field a full 6 regardless.
- Net effect: a player who runs lean (1–3 mons) faces lean trainer
  parties; a player who builds full faces 6v6 trainer fights. Every
  battle stays a fair duel run-to-run, regardless of how many wilds
  the player caught.

### Changed — Party cap is back to a flat 6 (no badge gating)

- Removed the prior `1 + badges` cap. The new foe-matching makes the
  cap unnecessary — a runaway player team just gets a matching foe.
- Catches above 6 still go to the PC; the cap message still fires.

### Changed — Professor only appears until party reaches 6

- Each city's Professor (cities 0–5 directly, cities 6–8 via
  `shouldForceCityProfessor`) is now hidden once the player's active
  team is at 6/6. A player who never catches a single wild still
  ends the front half of the run with a full 6-mon team because the
  six pre-League Professors are exactly enough.
- The City-8 post-Gym-8 legendary gate (Mystery Figure swap) is the
  *one* exception — it stays visible at 6/6 because the swap is the
  required pre-Victory-Road story beat.

### Reason

Previous balance pass keyed the active party cap on badges, which
was too rigid: accepting the Professor's gift at City 1 (pre-Gym 1)
overflowed straight to PC because the cap was still 1. The new
model is cleaner: foes match player team size, so the player's
choice of how many mons to bring is honored as a strategic decision
rather than a balance liability. Professor still guarantees a path
to a full team for non-catchers.



### Changed — Party size is now a real progression mechanic

- **Active party cap = `1 + badges`** (cap 6 at five badges). With wild
  catching enabled, runs were ending with wildly different party sizes
  (1-mon purists vs 6-mon hoarders) which made foe scaling unreliable.
  The cap ties active party growth to the same badge clock the foe-size
  formula already uses — so 0-badge intro fights are reliably 2v2 (or
  1v2 with full heal), and Gym 5 onward is full 6v6 territory. Catches
  beyond the cap still succeed; they wait in the PC until you've earned
  more slots. Surfaced in the city hub party label, the PC, and the
  Professor's tip on first visit.
- **Intro rival no longer hardcoded to 1 mon.** It now follows the
  standard rival formula (2 at 0 badges). A player who caught their
  pre-fight wild fights a fair 2v2; a player who skipped fights 1v2
  with full heal between mons. Old hardcode pre-dated wild catching.

### Changed — Mystery Figure is no longer the "team is full" handler

- **Professor and Mystery Figure are distinct mechanics now.** The
  Professor's gift always works (via the new badge-gated cap, never
  overflowing). When you visit at the cap, the Professor offers a
  "Lab Companion swap" — pick a teammate to send to PC. The
  "Mystery Figure" branding is now reserved for actual story-mystery
  events: the City-8 post-Gym-8 legendary gate, the post-HoF Mystery
  Figure battle, and the Crucible's Mystery encore button.
- Side-effect: the "lab companion swap" UI uses Professor sprites and
  Professor quotes, not the Mystery Figure mask. The mechanic stays;
  the framing aligns with what the player is actually doing.

### Changed — Safari Zone tightened (was OP)

- **Entry 1,200 → 2,500G.** Old price made a Safari run consistently
  cheaper than a Link-Station upgrade for a G2, which collapsed the
  cost curve.
- **Pool weights G1:8/G2:40/G3:38/G4:14 → G1:3/G2:22/G3:50/G4:25.**
  Safari is no longer a free G1/G2 pipeline; it's a G3-leaning catch
  trip with a small G2/G1 chance.
- **Encounters per session 8 → 6.** Matches the original design spec.
- **Safari Balls per session 25 → 15.** You're not stockpiling.
- **Safari Ball catch multiplier 1.5× → 1.25×** (sits between Poké
  and Great instead of between Great and Ultra).

### Changed — Underground sell prices reduced

- **G1 2,500 → 1,800 / G2 700 → 400 / G3 150 → 100 / G4 30 → 20.**
  Old prices made "catch wilds, sell wilds" net positive enough to
  fund a full training pass on the same gold. The new curve makes
  *keeping* and training the catch the rewarding play; the Underground
  is for roster management (PC overflow, unwanted dupes), not gold
  farming.

### Added — Early-game thematic battles

- Added `STORY_THEMED_BATTLES` entries at event IDs **7** (cursed —
  "a vagrant on the back road"), **14** (multitype — first wanderer),
  and **20** (villain — first Team operative scouting). The mid-game
  thematic arc was previously empty for events 1–25; the early game
  now plants seeds the mid-game payoff resolves.
- Three new **cursed**-tagged Basic Trainers (Hollow Pilgrim, Mire
  Witness, Whisper Tracker) so the expanded thematic slots have a
  bigger pool to draw from. The cursed pool grew from 3 to 6 entries.

### Changed — City identity (forwarded from the city-identity pass)

- **Safari Zone is gated to City 4** ("Wilderness town"). Previously
  it surfaced on every city hub — including Pallet Town — which
  clashed with the design spec's "specific story event" intent.
  Crucible access is unchanged.
- **Poké Casino added to City 5** ("Resort town"). Stays in City 9
  (League) too — mid-game gets a coin-flip stop between Gyms 4 and 5,
  endgame keeps the existing hub.
- **Battle Dojo + EV Trainer added to City 8.** The player can't
  backtrack, and the prior loadout left a dead zone between Gym 8
  and the Elite Four for held-item / ability / EV polish.
- **One-line specialty banner per city** above the NPC quote, keyed
  by `CITY_SPECIALTY_BLURBS`. Drives home why each city matters.

### Reason

The story mode had picked up wild catching, the PC, the Safari Zone,
the Crucible, and a boss arc on top of mechanics that were balanced
for a simpler era. Cities felt interchangeable; Safari farmed cheaper
than upgrading; the Professor and the Mystery Figure read as the same
thing; the intro rival hardcode predated wild catching. This pass
threads the new mechanics through the existing balance curve, gives
each city a distinct identity, and reserves the Mystery Figure
branding for moments that actually carry the story's mystery.



### Changed — Cities now feel distinct instead of interchangeable

- **Safari Zone is gated to City 4** ("Wilderness town"). Previously it
  surfaced as a recover action on every city hub — including Pallet Town —
  which clashed with both the design spec ("specific story event")
  and the user expectation of it being a destination. Crucible access is
  unchanged, so post-HoF still lands you there with everything else.
- **Poké Casino added to City 5** ("Resort town"). Casino used to be
  League-only, which made mid-game gold management a single straight
  line. City 5 now hosts a coin-flip wager hub between Gyms 4 and 5
  — the mid-game gambler's stop — and the League's Casino stays in
  place for endgame.
- **Battle Dojo + EV Trainer added to City 8.** The player cannot
  backtrack, and the previous loadout left a dead zone between Gym 8
  and the Elite Four for held-item / ability / EV polish. With these
  added, the "Final-gym town" actually supports the last-mile team
  optimization its name implies.

### Added — One-line specialty banner per city

- Every city hub now prints a `📍`-prefixed identity line above the NPC
  quote (e.g. *"Wilderness town — the only Safari Zone gate in the
  region. Catch what you can while you're here."*). Drives home why
  the city exists on the route — surfaces what to do here, in one
  sentence, before any button is read.
- New constant `CITY_SPECIALTY_BLURBS` (10 entries, indexed by city)
  + `_cityBlurbFor(cityIdx)` helper; rendered by `renderCityActions`.

### Reason

The story mode had two latent identity problems: (1) Move Tutor and
Nature Rater spammed across 7–9 cities each made every mid-game hub feel
interchangeable, and (2) Safari Zone showed everywhere, which deflated
the design's "destination" vibe. This pass makes each city signal
its purpose at a glance and reserves Safari + Casino as the mid-game
flavor stops they were meant to be. Crucible (post-HoF super-hub)
still consolidates everything, so endgame access is preserved.

## Unreleased — Catch & party balance 2026-05-15 (`claude/balance-pokemon-safari-zone-AMDkM`)

### Changed — Catch math is meaningfully tighter
- **Base catch rates lowered.** G1 5%→4%, G2 20%→12%, G3 40%→22%, G4 60%→35%.
  A maxed Ultra Ball on a G3 used to land 80% of the time and made wild
  captures feel like free gifts; it now lands ~44%, so the throw is a real
  decision. Master Ball is unchanged (still 100%) — it stays the special
  arc reward.
- **Per-grade flee rates.** Rarer mons are skittier. G1 55%, G2 40%,
  G3 28%, G4 20% (was a flat 25% across the board). A missed Ultra Ball
  on a G1 usually means it's gone — you bring your best ball on the first
  throw, not the fifth.

### Added — Safari Zone is actually different from a wild route
- **Safari Balls** are a session-only resource. Each Safari run grants
  25 Safari Balls; leftovers are forfeited at the gate (they never enter
  `sm.balls`, so they can't be hoarded for wild routes). Catch multiplier
  is 1.5× — between Great and Ultra. Your own Poké/Great/Ultra/Master
  Balls do NOT work inside the Safari Zone.
- **Bait** calms the wild Pokémon. Each bait stacks: catch chance × 0.70,
  flee chance × 0.55. Lower payoff, longer leash.
- **Throw Rock** angers the wild Pokémon. Each rock stacks: catch chance
  × 1.45, flee chance × 1.70. High risk, high reward — most G1 captures
  in Safari now happen after 2–3 rocks land you a quick clean throw before
  it bolts.
- Modifiers stack up to 3 each and reset between encounters.
- Safari encounter cap raised to 8 (from 6). Safari pool nudged slightly
  richer at G1 (8% from 5%) since catches there are now genuinely hard.
- Safari entry cost raised to 1,200G (from 800G) to reflect the 25-ball
  allotment + Bait/Rock toolkit. First visit per save still free.
- Per-encounter Skip + per-session Leave (forfeit balls) both surface
  directly on the encounter card so the player never gets cornered.

### Changed — Enemy party size, no more "weird"
- **Predictable role + badge curve.** Pre-v16 enemy party size mirrored
  the player's current team length (+1 after 4 badges), which meant the
  game changed difficulty silently when you released a mon or held two
  back at the PC. The new curve is fixed and readable:
  - Intro Rival: 1
  - Gym 1: 2 · Gym 2: 3 · Gym 3–4: 4 · Gym 5–6: 5 · Gym 7–8: 6
  - E1–E4 / Champion / Victory Road: 6
  - Rival (post-intro): 2 → 3 → 4 → 5 → 6 by badges (1/3/5/7)
  - Basic / Gym Trainer / Elite Trainer: 1 → 2 → 3 → 4 by badges
  - Soft floor: non-boss trainers cap at `playerTeam + 1` so a player
    still rebuilding their roster never walks into a 1v4 stomp.

### Added — Dynamic party swap on catch
- When you catch a Pokémon and your party is already full (6/6) but the
  PC has space, you now get a choice screen — **Send to PC** (the old
  default) or **pick a teammate to swap to PC**, putting the newcomer in
  that party slot. No more silent "it went to the PC" right when you
  wanted it on the field. Boss-arc catches (Subject Zero) still go
  straight to party — that story beat needs the mon in your hand.

### Notes
- PC code path audited end-to-end: deposit / withdraw / release / sell
  all guard against the last-mon, full-box, and missing-id edge cases.
  No changes were needed there.

## Unreleased — Progression pass 2026-05-15 (`claude/optimize-game-progression-91Yy0`)

### Added — Catch rewards
- **Partially-trained wild builds.** `makeWildBuild` no longer returns a
  Hardy/0-EV husk. Caught wilds now arrive with a curated positive nature
  (Adamant/Modest/Jolly/Timid/Bold/Calm picked from the species' base-stat
  profile) and a ~170 EV head-start (85 on the best offensive stat + 85
  speed, or 85 HP + 85 best-defensive for bulky shells). Held item stays
  None so Battle Dojo is still a real upgrade. Catches feel like a reward
  now — Tutor / EV Trainer / Stone Sage still matter for the last 30%.
- **Roaming sub-legendaries.** After Gym 5 and Gym 7 victories the next
  route surfaces a one-shot wild legendary (Articuno, Suicune, Latios,
  Tapu Koko, Chien-Pao, etc., gen-filtered, 50-species pool). 30% catch
  rate (no override — Master Ball still ∞ = 100%). Missed throw or Run
  = the Pokémon flees permanently. Roaming mons use the full `makeBuild`
  (not the wild build) — they're rare, they should feel ready.

### Added — Themed gym & elite gifts
- **`GYM_VICTORY_REWARDS` table.** Every gym leader / E1–E4 / Champion
  defeat hands a themed bundle on first clear: Gym 1 = 3 Poké Balls + 500G,
  Gym 2 = Rare Candy + 1000G, Gym 3 = 2 Great Balls + Vitamin, Gym 4 =
  Ultra Ball + Rare Candy, Gym 5 = 2 Great Balls + Vitamin + 1000G, Gym 6
  = 2 Ultra Balls + Rare Candy + 1500G, Gym 7 = Ultra Ball + Rare Candy
  + Vitamin, Gym 8 = 3 Ultra Balls + 2 Vitamin Packs. E1 = 2 Great Balls
  + Vitamin; E2 = Ultra Ball + Rare Candy; E3 = Ultra Ball + Vitamin;
  E4 = 2 Ultra Balls + Rare Candy; Champion = 2 Ultra Balls + Rare Candy
  + 2 Vitamin Packs. Old `staticDrops.ultraGl4` / `ultraE2` flags treated
  as "reward already taken" so legacy saves don't double-dip.

### Added — Pokédex milestone rewards
- **`POKEDEX_CAUGHT_MILESTONES`.** Catching 25 / 50 / 75 / 100 unique
  species fires bundle rewards: 25 = Ultra Ball + 2000G; 50 = 2 Ultra
  Balls + Vitamin; 75 = 2 Rare Candies + 5000G; 100 = 3 Ultra Balls +
  Rare Candy + Vitamin. (No 2nd Master Ball — that stays uniquely tied
  to the Caged God arc.) Checks fire inside `_catchHandleSuccess` so
  Safari, route wilds, Crucible wilds, and the boss arc all count.

### Added — Permanent-stat vouchers
- **🍬 Rare Candy = free Stone Sage evolution.** When the player has
  rareCandy in `sm.inventory`, the Stone Sage screen renders a "🍬 Rare
  Candy" button next to each gold-cost evolve button. One charge =
  bypass the gold cost (saves up to 16,000G on G2→G1). Nature, ability
  slot, EVs, item, Tera all still carry over. Repeat-use cost ramp still
  consumes a slot so paid follow-ups scale fairly.
- **💊 Vitamin Pack = free EV Trainer preset.** Same pattern on EV
  Trainer — a "💊 Vitamin" button on every preset, one charge =
  bypass 5,000G.
- Bag screen surfaces both as "Voucher" entries at the top of the bag
  (not sellable for gold; earned, not bought).
- City Tips strip surfaces unused vouchers as quick-launch chips
  ("🍬 N Rare Candies — free evolve" / "💊 N Vitamins — free EV preset").

### Changed — Enemy challenge curve
- **Aggressive late curve.** From 4 badges onward, every non-boss
  trainer fields one more Pokémon than the player's party
  (`min(player+1, 6)`). Intro Rival stays 1; Gym 6+/E1–E4/Champion/
  Victory Road stay forced 6. Pre-Gym-4 still matches party size.

### Fixed
- **Smart-quote syntax crash in trainer quote table.** Lines 22951–23006
  had U+2018/U+2019 smart quotes as string delimiters from a previous
  merge (`'Red': [...]`, `'Maxie': [...]`, every Veteran Gym Leader,
  every Team admin, etc.). The browser fails to parse them silently;
  the page would crash on first reference to those quotes. Normalized
  to ASCII apostrophes. Plumeria's "Salazzle—poison 'em!" line got an
  explicit `\'em!` escape since plain `'em` would close the string.

### Added — Voice & flavor
- **Per-leader / elite / champion victory voice.** `LEADER_VICTORY_LINES`,
  `LEADER_BADGE_NAMES`, `ELITE_VICTORY_LINES`, and `CHAMPION_VICTORY_LINES`
  tables drive the post-battle overlay. 70 gym leaders, 31 Elite Four, and
  11 Champions each get a bespoke one-liner that names the badge earned
  (e.g., "Brock: 'Your defense rivals stone. Take the Boulder Badge.'");
  unknown trainers fall back to the generic role line.
- **Per-facility NPC voice.** Move Tutor, Nature Rater, Battle Dojo,
  EV Trainer (Buck), Colress, Cable Link Station, and Poké Casino all open
  with a rotating in-character one-liner instead of bare titles. Lines
  lean into the darker-adult-pokemon tone — anonymous link strangers,
  croupier warnings about runs going bust, the dojo master remembering
  every fall.
- **Rotating Mystery Figure identity.** The masked stranger used to wear
  Cyrus's face every run. Now a single identity rolls at run start from
  seven candidates — Cyrus, Ghetsis, Cynthia, Steven, N, Red, Lance —
  and pins for the save. Each has a bespoke 4-line intro pool and the
  victory overlay drops the mask: "It was <Name> all along."
- **Red voice padding.** Red's ellipsis lines now mix in stage-direction
  parentheticals ("…(Pikachu sparks. Once.)") so the cameo reads as
  deliberate silence, not missing content.

### Added — Replayability & guidance
- **Cross-run career counter.** New `pbs_story_meta` localStorage key
  tracks `completedRuns`, `lastClearSeed`, and per-milestone
  `firstClears` across runs. Story menu shows "🏆 Career runs cleared:
  N · Last seed XXX"; Hall of Fame shows run number, difficulty, seed.
- **Career first-clear celebration.** The very first time a player ever
  clears any gym / elite / champion / rival / mystery across all their
  runs gets a "★ Career first ★" banner and 96-particle confetti pulse
  (normal milestone = 32 particles). Veterans see the normal beat;
  new players get the rush.
- **City "Next:" preview tip.** Every city Tips strip now opens with a
  "🎯 Next: <event>" chip — "Gym 3 — Lt. Surge", "Elite 2 — Karen",
  "Champion — Cynthia", "Mystery Figure (???)" — that clicks straight
  into the next battle.

### Added — Trainer-UI misclick guard
- **Confirmation prompts on every Pokémon-modifying click.** Move Tutor,
  Nature Rater, Battle Dojo (ability + item), EV Trainer preset,
  Colress (Mega/Dyna/Z/ZSig/Tera), Link Reroll/Upgrade/Rebuild, Artifact
  Annex, and Department-Store + ≥1500G shop purchases now open a confirm
  modal with the specific change, the cost, and the player's remaining
  gold after the transaction ("Apply Adamant nature (2,000G → 18,500G
  left)"). Stone Sage / PC Release / PC Sell already confirmed;
  no-op clicks (same value re-applied) short-circuit before the prompt.
- **Tutor button touch targets.** `.story-tutor-btn` bumped to 40px tall
  on phone portrait (was ~22px). Direct response to misclick reports.

### Added — Polish
- **Starter badge on team panel.** Team cards now render a "★ STARTER"
  pill on the starter and an "⛓ BOUND" pill on any other unsellable
  mon (Subject Zero, etc.) so players see at a glance why the
  Underground sell button is disabled on those rows.

### Changed
- **Typography polish.** User-facing "Pokemon" → "Pokémon" in Quick Play
  help, Tera card description, Sleeping Song log, League-city label,
  rival opening quote. Internal action keys and trainer-class sprite IDs
  (Pokemart, Pokemon Breeder, etc.) keep their ASCII form.
- **PAR status tense.** "is paralyzed!" → "was paralyzed!" so the
  status-application message table reads in the same past-tense voice
  as its peers (was poisoned / burned / etc.). Mid-turn "is paralyzed!
  It can't move!" stays present-tense (different context).

### Balance
- **G4 strip at 2 mons, not 4.** `storyStripGrade4IfPartyMature` now
  triggers off a new monotonic `partyEverReached2` flag. With the old
  threshold, early routes still rolled G4 trainers while Gym 1/2 was
  already pure G3 — the gym fight was easier than the road to it.
- **Rival decay /30 → /10.** `RIVAL_ATTACK_TYPE_DECAY` reduced so a
  dominant counter-type can land on two of the rival's six instead of
  collapsing after a single pick. Rivals now actually punish monotype
  parties.
- **Starter pool floor.** PROF_ROLLS for City0/City1 raised to 70% G3
  (was 30%/50%) so the Gym 1 (100% G3) wall isn't a brick wall.

### Fixed
- **Evolution carry-over uses correct build keys.** Stone Sage promised
  "Nature, ability slot, item, and EVs are kept," but the code read
  `old.nature` (never existed on a build — keys are single letters)
  and never read `old.a` at all. Nature was silently wiped; ability
  was always rerolled. Now reads `old.n` and `old.a` correctly.
- **Starter unsellable per spec.** Design spec §8 requires the starter
  to be bonded for life. Only the boss-arc capture was flagged. The
  first Pokémon any Professor gives now sets `starter: true` +
  `unsellable: true`; sell screen reads "Starter — bonded for life".
- **Pokédex.seen now populated.** `sm.pokedex.seen` was initialized
  but never written — only catches went into `pokedex.caught`. Every
  wild / Safari / boss encounter now stamps `seen` on entry.
- **Caged God ball-exhaustion escape.** The boss-arc catch screen hid
  the Run button to prevent flee, but a player who ran out of all four
  ball types had no exit (softlock to refresh). The screen now shows
  "↩ Retreat — bring more balls" only when total ball count is zero;
  the boss state (HP, lock) persists for the return trip.
- **`crucibleBattleSource` reset on load.** Closing the tab during a
  Crucible/Frontier fight persisted the transient flag without the foe
  team. Next main-timeline battle would then wrongly route through
  `_handleCrucibleBattleEnd`. `load()` now always clears it.
- **Corrupted enemy-lock recovery.** `load()` drops a malformed
  `sm.currentEnemyLock` (missing eventIdx, empty/non-array team, slot
  without name/build) so the engine rerolls a fresh team instead of
  crashing inside launchBattle.

### Added — Round 3 (audit-and-fix loop)
- **One-time tips system** (`_storyShowOneTimeTip` + `pbs_story_meta.tipsShown`).
  Cross-run, so a tip seen in run 1 never re-fires. Wired to:
  Pokémon Center first-visit, Relic Annex first-visit, Battle Frontier
  first-visit, Crucible first-visit, first wild catch encounter,
  Pallet Town welcome, and post-HoF orientation listing the three
  endgame doors.
- **Mystery Figure per-identity outro epilogues** (7 trainers). Each
  rotates with the identity reveal in the post-defeat overlay —
  Cynthia hands you tea, N kneels by your lead Pokémon, Red tips his
  cap and is gone.
- **Caged God cage-unlock celebration.** Final lead now fires an
  alert pointing at the new "Enter the Cage — `<Boss>`" button.
- **Subject Zero capture epilogue.** Expanded from one line to a
  three-beat closer: cage shutting, sixty-years lore, unsellable bond.
- **Master Ball / Ultra Ball gift flavor rewrite** + explicit inventory
  chips. Elite-2 broker theft framing replaced with a League attendant
  "the way a treasure is given."
- **Wild Pokémon sprite on catch screen** (and boss HP-attrition phase).
  Screen was text-only before.
- **Catch wobble + flee + boss strike variety.** Each now picks from
  4-line pools so a string of misses doesn't read identical. Boss
  strikes also narrate per HP band — clean hits early, dread at <10%.
- **Relic Keeper voice** (5-line rotating barker on every Annex visit).
- **Crucible orientation tip** spelling out battle vs facility columns.
- **Caged God lead status sidebar** got its own labelled box with a
  3-of-3 counter and explicit Pokémon Center city locations.
- **Stone Sage level-up flavor.** Function used to return empty string
  for the most common evolution type (level-up). Added four rotating
  flavor lines so the screen always speaks.
- **Casino result variety** — 4 win and 4 loss flavor lines instead
  of a single repeating string.
- **Pallet Town welcome tip** — one-time, cross-run.

### Added — Trainer pool variety
- **9 new 2-type / type-coverage Basic Trainers** all charGen 1 with
  `pkmGens` 1–9: Ace Diver, Mountain Guide, Glacial Trekker, Reactor
  Tech, Tea Aroma, Mystic, Crooked Beat, Marsh Walker, Lab Rat.
  Together they add Ground, Ice, Steel, Fairy, Psychic, Dark coverage
  the original G1 set was missing. All reuse existing sprites.
- **8 thematic Elite Trainer variants** (`tag:'eldritch'`): Shadow Blue,
  Cursed Lance, Forsaken Cynthia, Eldritch N, Tarnished Steven, Pale
  Ghetsis, Hollow Cyrus, Silent Red. Reuse canonical champion sprites
  with darker pools; the `eldritch` tag lifts the gen-filter so a
  G1-only run can still meet a Hydreigon under an old champion's mask.
- **3 cursed Basic Trainer variants**: Cursed Vagrant, Scarred
  Brawler, Charred Acolyte.
- **`STORY_THEMED_BATTLES` map** marks four mid-run event ids
  (34, 42, 48, 58) as themed slots; pass 3 of `assignTrainers`
  consults it and prefers a tag-matched trainer when available.
- **Type-coverage filter fallback** — when a gym's preferredType
  yields zero trainers under the active gen filter, fall through to
  the full role pool. Before: a G1-only run hitting a Pryce gym
  silently fielded non-Ice trainers. After: Glacial Trekker covers Ice
  for any gen.
- **TRAINER_QUOTES_BY_NAME entries** for all 11 new thematic trainers
  so they don't fall back to the generic role pool.

### Audited (no code change required)
- **Generation toggle leakage.** Species-only filter confirmed; no
  leakage into learnsets, abilities, items, type chart, damage formula.
- **Eviolite Late-Evo rule.** Gated by `sp.evos.length > 0` from the
  dex — gen-independent. Compliant.
- **Hardcore difficulty removal.** Only the migration line remains.
- **Settings toggles** (animations / weather / terrain / music / SFX /
  Mega / Z-Move / Dynamax / Tera). All honor both on and off paths.
- **Damage formula, type chart, AI tier.** Gen 6+ universal rules; AI
  is heuristic with damage estimation + threat scoring + switch logic.
- **Safari Zone, catch flow, boss arc, Crucible, Frontier, PC,
  Underground.** Core mechanics verified: free-first-entry flag, 6-
  encounter pacing, grade-pool richness, caught-state hygiene, party/
  PC overflow, gen filter, ball economy, Frontier stat scaling
  (correctly applied via `applyStoryLeagueFoeStatBoost`), boss lead
  flavor consistency.
- **No-Item Run mode** — battle bag disabled both sides, shops stay
  open, balls usable for catches. Compliant with spec.
- **PC last-mon protection** — `_pcTeamHasOnlyOneMon` blocks deposit
  when team would empty; UI disables button with reason.
- **Stone Sage carry-over** — fixed earlier this session to use the
  correct build keys (`n`, `a`) so nature and ability survive
  evolution.
