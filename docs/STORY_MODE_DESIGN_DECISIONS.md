# Design Decisions Required — Catch / PC / Dynamic-Party Integration

The risk doc (`STORY_MODE_CATCH_INTEGRATION_RISK.md`) shows **how** to integrate the
new mechanics without breaking things. This doc lists **what must be decided** before
implementation. Each decision below has more than one defensible answer, and picking
the wrong one locks out a sub-system or forces a painful refactor later.

Use this as a working checklist. Each item is:

- **Decision** — the explicit choice
- **Why it matters** — the cost of leaving it implicit
- **Options** — defensible answers
- **Recommendation** — my pick, with reasoning
- **Touches** — files / line numbers affected

22 decisions, grouped: **Schema & identity → Party rules → Catch mechanics → PC mechanics
→ Difficulty & balance → UX & flow → Cross-run continuity**.

---

## A. Schema & identity (5)

### A1 — Mon identity: slot index vs. stable id

**Why it matters.** Link Station (`25587–25710`), Tutor (`26986`), Colress (`27277`),
EV Trainer (`27585`) all mutate `sm.team[idx]` by **slot index**. With dynamic party
and PC, "this is *my* Pikachu" must survive deposit/withdraw/re-order. If you stay
slot-indexed, identity is lost the moment a mon enters the PC.

**Options.**
1. Keep slot-indexed; PC is just a separate array. Identity ≈ "first-Pikachu-named".
2. Add a stable `id` (uuid or monotonically incrementing) on every mon at creation.

**Recommendation.** Option 2 — **stable id**. Generate at `makeBuild` time (`5974`) and at
`enterProfessor` insertion (`24537`). Mutations stay slot-indexed for back-compat, but
PC deposit/withdraw and Pokédex tracking key off id. **Migrate older saves** by
assigning ids on load.

**Touches.** `5974`, `22191`, `24537`, `24560`, all Link/Tutor/EV/Colress writers; save
migration at `22049`.

---

### A2 — PC Box storage model: flat array vs. boxed

**Why it matters.** UI complexity and save size. A flat array is simpler but ugly at
50+ mons; boxes are nicer UX but require pagination.

**Options.**
1. Flat array `sm.pcBox = [mon, mon, …]`.
2. Boxed: `sm.pcBox = [[..30 slots..], [..30..], …]` with a current-box pointer.
3. Flat with cap (e.g., 60 mons, oldest auto-released).

**Recommendation.** Option 3 — **flat, capped at 60**, oldest releases when full
(with a notification, not silent). Simple schema; bounded localStorage; the cap creates
a small interesting decision (which catches to keep). Boxes can be a v2 UI on top of
the same array.

**Touches.** Save schema `22191`, new PC screen, catch flow.

---

### A3 — Pokédex tracking: catch-only vs. seen+caught

**Why it matters.** Whether trainer fights contribute to a long-tail completion goal.
Drives meta-progression density.

**Options.**
1. Catch-only — only mons you've actually captured count.
2. Seen+Caught — every encountered species enters "seen"; catches add "caught".
3. None — no Pokédex.

**Recommendation.** Option 2 — **seen + caught**, both persisted across runs (separate
key from `pbs_story_save`). Seen drops from every battle's foe team into a Set. Cheap;
gives players a reason to *fight* even when they can't catch.

**Touches.** Save schema, post-battle hook at `24820`, new title-screen Pokédex screen.

---

### A4 — Wild mon build quality: full competitive vs. rough

**Why it matters.** If wild captures get the same Smogon-tier builds as Professor's
mons (`makeBuild` `5974`), **Professor and Link Station become obsolete**. Players just
catch instead. The economy collapses.

**Options.**
1. Wild mons get full `makeBuild` builds.
2. Wild mons get a **rough** build: 4 random level-up moves, no held item, default
   ability (not hidden), neutral nature, no EVs.
3. Wild mons get a partial build (held item random; moves rough; nature random).

**Recommendation.** Option 2 — **rough builds**. Re-anchors Tutor (2k/swap) and Link
(reroll/upgrade) and EV Trainer (5k/preset) as the path from "raw catch" to "battle
ready". Professor remains valuable because its rolls are pre-built. Catching becomes
a long-term *project* per mon, not an instant power-up.

**Touches.** New `makeWildBuild(name)` helper near `5974`; catch insertion at the new
catch flow. Flag with `slot.wild = true` so the rival adapter can de-weight it.

---

### A5 — `sm.team` per-slot fields: extend or wrap

**Why it matters.** Today slots are `{ name, build, currentHp?, status?, statusTurns?,
pp?, consumedItem? }`. Catching needs `id`, `wild`, `caughtAt`, `nickname`, `seenAt`.
Either extend in place or wrap.

**Options.**
1. Extend the existing object with new optional fields.
2. Wrap: `{ id, src: 'professor'|'wild'|'trader', mon: {name, build, ...} }`.

**Recommendation.** Option 1 — **extend in place**, defaults to old shape, all new fields
optional. Cleanest migration; minimal blast radius across 94 `sm.team` reads.

**Touches.** Every `sm.team[i]` reader (the 94 from the risk doc).

---

## B. Party rules (4)

### B1 — Minimum party size for entering a trainer battle

**Why it matters.** Today an empty party blocks with an alert (`24594`). With PC, a
player could deposit all 6 mons and walk into a gym. Foe `partySize` calc `24655` does
`Math.min(Math.max(sm.team.length, 1), 6)` → minimum 1, but that means **1v1 gym
leader battles** are possible.

**Options.**
1. Allow 1v1 → glass cannon gameplay.
2. Force minimum party of 3 before entering a Battle event (block at hub if <3).
3. Foe matches your count: 1v1 if you bring 1, 6v6 if 6.

**Recommendation.** Option 3 — **foe matches**, with a floor of 1 for Basic Trainers and
3 for Gym Leaders / Rival / Elite Four / Champion. Display the foe count in the hub
("Erika brings 4 Pokémon — match her or risk it"). Gives the player agency without
trivializing major battles.

**Touches.** `24655`, hub render `23667–23720`.

---

### B2 — Party-size effect on difficulty: monotonic or live

**Why it matters.** `storyStripGrade4IfPartyMature` (`22480`) keys off `sm.team.length
>= 4` — catching/depositing toggles G4 difficulty. (Failure mode #1 in the risk doc.)

**Options.**
1. Keep live `length` — accept G4 oscillation.
2. Add `sm.partyEverReached4` monotonic flag.
3. Drop party-size as a difficulty signal entirely; use `badges` (already in
   `_storyProgressFactor` `22604`).

**Recommendation.** Option 3 — **drop party-size as a signal**. The progression curve
should be entirely badge-driven post-catch. Cleanest; predictable; eliminates whole
class of bugs. The `partyEverReached4` fallback (Option 2) is a fine intermediate if
you want minimum churn.

**Touches.** `22480`, `22481`, and every `length`-keyed gate listed in the risk doc.

---

### B3 — Rival adaptation: what counts as "the player's team"?

**Why it matters.** `_rivalScoreAttackTypeVsParty` (`22706`) reads live `sm.team`. With
catching, players can stash a Magikarp before a Rival fight to skew counter-picks.

**Options.**
1. Read live `sm.team` — exploitable.
2. Filter out `slot.wild === true` — partial fix; still exploitable via PC.
3. Read **last-deployed party** (snapshot at the end of the last completed battle).
4. Read **city-entry snapshot** (snapshot when entering the current city hub).

**Recommendation.** Option 4 — **city-entry snapshot**. Rival's pre-game scouting
"knows" what you walked into town with; catches mid-route don't affect their team.
Frame it narratively ("My informants said you'd bring…"). Eliminates the exploit
cleanly. The snapshot is just `sm.rivalScoutedParty = sm.team.map(t => t.name)` on
`enterCity`.

**Touches.** `22706`, `22897`, and new snapshot write on city entry.

---

### B4 — Trainer assignment cache hygiene

**Why it matters.** `sm.trainerAssignments[rowId]` (`22069+`) pins which trainer fills
each role. If wild mons start spawning, their species can collide with a trainer's sigs
(e.g., you catch a Pidgey, then meet a trainer whose sig is Pidgey — dedup logic in
`_rivalPickSpeciesForAttackType` `22763` reads `usedNames` against your team).

**Options.**
1. Trainers can use species you own — no filter.
2. Trainers avoid species in your party — current Professor behavior.
3. Only Rivals avoid your species; other trainers don't care.

**Recommendation.** Option 3 — **Rivals avoid, others don't**. Rivals feeling unique is
the point; basic trainers having a Pidgey when you also have a Pidgey is fine and
realistic.

**Touches.** `22763`, `_rivalPickSpeciesForAttackType` and callers.

---

## C. Catch mechanics (5)

### C1 — Catch flow placement: in-battle bag vs. dedicated menu

**Why it matters.** Where the player presses "throw ball". Two patterns:

**Options.**
1. **Bag-as-category** — a "Balls" tab in the existing bag modal. Compact menu but
   balls drown in items.
2. **Dedicated "Throw" button** — adds a fifth main-menu button (Fight / Pokémon /
   Bag / Run / Throw). Clear and explicit but always present.
3. **Throw replaces Run** in wild encounters only — clean, narrative-correct (you
   chose engage rather than flee), no menu clutter in trainer fights.

**Recommendation.** Option 3 — **Throw replaces Run in wild encounters**. Visible only
when `state.isWild === true`. Run is still available behind a long-press or sub-menu
("Flee"). Mobile-friendly, no clutter in trainer battles.

**Touches.** Battle UI main menu (around `11800` area), new `state.isWild` flag.

---

### C2 — Catch formula

**Why it matters.** Drives the feel of catching — too easy and Master Ball is
pointless; too hard and players bounce off the loop.

**Options.**
1. Pokémon canon formula (catch rate × HP × ball × status mod).
2. Simplified: `(ballMult × (1 - hp%)) + statusBonus + gradeMod`.
3. Always succeeds, ball type just affects animation.

**Recommendation.** Option 2 — **simplified**. Concrete: `chance = ballMult × max(0.05,
1 - hp%) × (1 + statusBonus) × gradeMod` where `ballMult = {poke: 0.3, great: 0.5, ultra:
0.7, master: 1.0}`, `statusBonus = {sleep: 0.5, freeze: 0.5, paralysis: 0.25, burn:
0.25, poison: 0.25}`, `gradeMod = {1: 0.4, 2: 0.7, 3: 1.0, 4: 1.2}`. Easy to balance,
intuitive, Master Ball deterministic.

**Touches.** New catch helper near `25420` (casino style); integrate with `storyRngNext`.

---

### C3 — Caught mon: full HP / current HP / wild HP?

**Why it matters.** A caught mon's state at storage.

**Options.**
1. Full HP, full PP, no status — pristine.
2. Current HP/status/PP at moment of capture — preserves the "you hurt it" cost.
3. Full HP but status sticks.

**Recommendation.** Option 2 — **as captured**. If you bombed it to 5 HP with a sleep,
it enters your party / PC with 5 HP asleep. Reinforces the cost of weakening; gives
the Pokémon Center its job back; punishes catch-via-Master-Ball lightly (full HP
captures cost you a Master Ball).

**Touches.** New catch flow; PC deposit code.

---

### C4 — Foe behavior in wild battles (run / fight to KO / scripted)

**Why it matters.** Pacing of the encounter.

**Options.**
1. Foe fights until KO'd or caught — players can use as many balls as they want.
2. Foe flees after N turns (e.g., 8) — adds urgency.
3. Foe flees if HP > 90% and the player attempts to flee.

**Recommendation.** Option 1 for v1 — **fights to KO**. Simplest; matches the engine
without new "flee" code paths. Add Option 2 as a Safari Zone exclusive (where the
type-restricted pool + flee timer makes it a distinct mechanic).

**Touches.** New `state.isWild` flag; KO-handling for wild faint.

---

### C5 — Wild encounter rate & ordering

**Why it matters.** How often catching opportunities appear. Spec says **50% per route
battle slot** but this conflicts with the trainer fight in the same slot.

**Options.**
1. Wild **replaces** the trainer fight 50% of the time on a route slot.
2. Wild **prepends** the trainer fight 50% of the time (you fight twice).
3. Wild is **interspersed** between trainer fights (extra route nodes).
4. Wild **always plays** before route trainer fights, with the 50% being whether a
   wild appears or you walk through quietly.

**Recommendation.** Option 4 — **always run wild check before trainer**, 50% chance
spawn, foe team builds from route-themed pool. If wild appears: catch loop, then
trainer fight. Doubles route length on hits, keeps route count constant on misses.
Matches `STORY_FEATURES_INTEGRATION.md` §5 ordering ("wild before trainer"). Wrap in
**strategy A** from the risk doc (save/restore around the wild battle).

**Touches.** `proceedToNextBattle` `24593`, new `runItinerary` queue.

---

## D. PC Box mechanics (3)

### D1 — PC heal-on-deposit policy

**Why it matters.** Whether the PC is a free Pokémon Center (broken in hardcore) or a
stasis vault (consistent across modes).

**Options.**
1. Deposit **heals**: PC is a hospital. Fast; trivializes hardcore.
2. Deposit **freezes**: HP/PP/status stored, restored verbatim on withdraw. Stasis.
3. Deposit **freezes HP**, restores PP. Mixed.

**Recommendation.** Option 2 — **stasis**. Consistent with hardcore intent; no "free
revive" exploit; lore-clean (the PC isn't a hospital). Pokémon Center stays the only
healer (and remains disabled in hardcore). If players want to heal between battles,
they pay the canonical cost (potions / Center / hardcore: nothing).

**Touches.** PC deposit/withdraw flow; hardcore restore at `24740`.

---

### D2 — PC accessibility: every city vs. gated

**Why it matters.** UX friction vs. progression pacing.

**Options.**
1. PC at every city, always.
2. PC unlocked after first catch.
3. PC unlocked after first city visit (City1) — i.e., not at City0 where Professor
   gives the starter.

**Recommendation.** Option 2 — **unlock on first catch**. Hides clutter from players
who don't use catch mode; gives the feature its own moment when it first appears.
Show the PC button when `sm.pcBox.length > 0 OR (sm.settings.catchMode && hasCaughtOnce)`.

**Touches.** Hub render `23667–23720`.

---

### D3 — Release of stored mons

**Why it matters.** Whether players can clean up storage / generate value from unwanted
catches.

**Options.**
1. No release — PC is forever (until v3 cap auto-releases oldest).
2. Manual release with confirmation modal.
3. "Fence" — release for gold (Black Market mechanic).
4. Auto-release at PC cap, with a 1-mon warning queue.

**Recommendation.** Options **2 + 3 combined**. From the PC screen, "Release" (free,
double-confirm modal) and "Fence at the Black Market" (paid into gold; this is the
spec'd Black Market mechanic). Cap of 60 (per A2) auto-releases oldest with a banner
warning when within 5 of cap.

**Touches.** PC screen, Black Market shop (spec'd).

---

## E. Difficulty & balance (3)

### E1 — Hardcore catch policy

**Why it matters.** Hardcore should not become trivial via catch-as-revive (failure
mode #5).

**Options.**
1. No catch in hardcore at all.
2. Catch enabled, PC is stasis (Decision D1) — neutralizes the exploit naturally.
3. Catch enabled, but caught mons start at 1 HP (you must heal them somehow).
4. Catch enabled, ball prices doubled in hardcore.

**Recommendation.** Option 2 — **catch enabled, PC is stasis**. The combination of
"deposit freezes HP" + "Pokémon Center disabled in hardcore" + "catch preserves capture
HP" already prevents the exploit without needing a special mode. **No special-casing.**

**Touches.** PC deposit; verify no path heals in hardcore.

---

### E2 — Catch coin economy

**Why it matters.** Whether catching is a gold sink, faucet, or neutral.

**Options.**
1. Wild encounters give 0 coins; catch is its own reward.
2. Wild encounters give partial coins (e.g., 200–400) on KO; full reward if caught.
3. Wild encounters give the same coin payout as basic trainer fights.

**Recommendation.** Option 1 — **0 coins from wild**. The mon **is** the reward. Coin
mults already make late-game tight (per the balance audit §2); adding another faucet
unbalances. Catching costs (balls 200–500G) make it a small gold sink, which is
healthy.

**Touches.** Post-wild-battle reward code.

---

### E3 — Foe `partySize` policy when player party shrinks

**Why it matters.** Failure mode "deposit all into PC, walk into gym". Decision B1
covers minimums; this is about scaling.

**Options.**
1. Foe size = `min(player.length, baseFoeSize)` — 1v1 gym if you bring 1.
2. Foe size = `baseFoeSize` always — 1v6 disaster if you bring 1.
3. Foe size = `max(player.length, minimumByEventType)` — at least 3 for Gym Leaders.

**Recommendation.** Option 3 — **clamped minimums per event type**. Basic Trainer min 1,
Gym Trainer min 2, Gym Leader / Rival min 3, Elite Four min 4, Champion min 6. Shows
the minimum on the hub before entering. Lets players play "1v1 brave run" against
basic trainers but not trivialize Gym Leaders.

**Touches.** `24655` partySize calc; hub render `23667–23720`.

---

## F. UX & flow (3)

### F1 — Caught mon destination prompt

**Why it matters.** Friction vs. clarity. Every catch raises "to party or PC?" if there's
room.

**Options.**
1. Always prompt — friction.
2. Auto-decide: party if room, else PC.
3. User pre-sets in Settings ("Default destination: PC / Party / Ask").

**Recommendation.** Option 3 — **user pre-set, default Ask**. First-time catch shows
the chooser with "Remember this choice?" toggle. After the choice is remembered, only
prompt when both party AND PC are full (failure modal).

**Touches.** Settings screen, catch flow.

---

### F2 — In-battle bag for hardcore + catch interaction

**Why it matters.** `noItemRun` filters battle bag (`21558`, `25110–25220`); catch mode
adds balls to the bag; balls aren't really "battle items" in the canonical sense.

**Options.**
1. `noItemRun` strips balls too.
2. `noItemRun` exempts balls (they're a tool, not a buff).
3. `noItemRun` strips balls only in **trainer** battles (where they'd do nothing
   anyway).

**Recommendation.** Option 3 — **strip in trainer, allow in wild**. Most narratively
consistent; allows the no-item-run player to still play catch mode. Wild encounter
flow shows the throw UI; trainer fight bag shows everything except balls under
`noItemRun`.

**Touches.** `21558`, `25110–25220`, catch UI.

---

### F3 — First-time tutorials for the new systems

**Why it matters.** Three large new systems land at once on top of an already
information-dense game. Without one-time tips, the UI becomes hostile.

**Options.**
1. No tutorials, players figure it out.
2. Long modal tutorial on first encounter.
3. Single-line `oneTimeTip(key, body)` helper (from main audit §12), fires once per
   feature, dismissible.

**Recommendation.** Option 3 — **`oneTimeTip` helper**, six new tips: first wild
encounter, first ball throw, first catch success, first catch failure, first deposit,
first withdraw. Each is one sentence. Track in `sm.tipsSeen[key]`.

**Touches.** New helper; hooks at each event.

---

## G. Cross-run continuity (2)

### G1 — NG+ carryover scope

**Why it matters.** Whether the new collection layer has any longitudinal weight. The
biggest replayability lever.

**Options.**
1. Nothing carries — each run is fully fresh.
2. Only Pokédex (seen/caught) carries.
3. Pokédex + achievements + a small pool of "marks" / cosmetic relics carry. PC empties,
   party resets.
4. Pokédex + achievements + PC carries.

**Recommendation.** Option 3 — **Pokédex + achievements + run-clear marks** carry; PC
empties between runs. Storing PC across runs creates the "I have a battle-ready team in
storage" problem that trivializes future runs. Pokédex completion is a great
long-term goal that costs nothing. Marks (e.g., "Cleared on Hardcore", "Cleared
Catch-Mode No-Item") are pure flex with no balance impact.

**Touches.** New `pbs_story_meta` separate localStorage key.

---

### G2 — Save format versioning strategy

**Why it matters.** This is the biggest schema change since v1. Done wrong, you brick
saves.

**Options.**
1. One big v15 migration with all new fields.
2. Split: v15 for schema only (no behavior), v16 for catch mode default, etc.
3. Use a separate key `pbs_story_meta` for cross-run data; the per-run save stays at
   v14 + monotonic flag bump.

**Recommendation.** Option 1 + Option 3 combined — **v15 single migration** for per-run
schema (PC, balls, pokedex, partyEverReached4, mon ids); **separate `pbs_story_meta`
key** for cross-run carryover (Pokédex master, achievements, marks). Sequenced as
milestone M0 in the risk doc.

**Touches.** `22049–22183`, all defaults at `22191`.

---

## Summary: decisions in one table

| # | Decision | Recommended pick |
|---|----------|------------------|
| A1 | Mon identity | Stable id, generated at creation |
| A2 | PC storage model | Flat array, cap 60, oldest auto-releases |
| A3 | Pokédex tracking | Seen + Caught, cross-run |
| A4 | Wild mon build quality | Rough builds, not competitive |
| A5 | Slot schema | Extend in place with optional new fields |
| B1 | Min party for trainer battles | Foe matches with per-event-type minimum |
| B2 | Party-size as difficulty signal | Drop entirely; use badges |
| B3 | Rival "your team" definition | City-entry snapshot |
| B4 | Trainer species collisions | Rivals avoid; others don't |
| C1 | Catch flow placement | Throw replaces Run in wild encounters |
| C2 | Catch formula | Simplified: ball × hp% × status × grade |
| C3 | Captured mon state | As captured (HP/status preserved) |
| C4 | Foe wild behavior | Fights to KO (v1); Safari adds timer |
| C5 | Wild encounter rate & order | 50% pre-trainer; strategy A wrapper |
| D1 | PC heal policy | Stasis (freeze on deposit) |
| D2 | PC accessibility | Unlock on first catch |
| D3 | Release of stored mons | Manual release + Black Market Fence |
| E1 | Hardcore catch policy | Enabled; rely on stasis to prevent exploit |
| E2 | Wild coin payout | 0 coins; mon is the reward |
| E3 | Foe party size scaling | Clamped minimum per event type |
| F1 | Catch destination prompt | User pre-set, default Ask |
| F2 | noItemRun × catch | Strip balls in trainer fights only |
| F3 | First-time tutorials | `oneTimeTip` helper, six new tips |
| G1 | NG+ carryover | Pokédex + achievements + marks; PC empties |
| G2 | Save versioning | v15 per-run + separate cross-run meta key |

---

## The three decisions that block everything else

If you can only decide three things today, decide these:

1. **A1 (stable id)** — without this, Link/Tutor/EV/Colress can't safely operate on PC
   mons; you'd be locked to slot semantics forever.
2. **B2 (drop party-size as difficulty signal)** — without this, G4 oscillation will be
   the #1 playtest complaint and you'll be patching it for weeks.
3. **C5 + risk-doc strategy A (wild as save/restore-wrapped interrupt, not a virtual
   `STORY_EVENTS_RAW` row)** — without this, `eventIndex` semantics, the migration
   system, and save format all get tangled with wild encounters and you can't separate
   them later.

Everything else can be adjusted post-launch. These three are foundational.

---

## Existing design issues the new mechanics will expose

These weren't blockers before but become urgent:

- **Math.random in rival secondary line** (`21852`) — already a determinism bug; with
  daily seeds + catch mode it becomes more visible because shared seeds will diverge.
- **`GYM_CITY_LEADER_EVENT` hardcoded map** (`21469`) — adding any new event type
  (wild, wager, safari) puts pressure on this map to stay correct. Refactor to derive
  from `STORY_EVENTS_RAW`.
- **Slot-by-index identity in Link Station** (`25587+`) — already wrong-feeling but
  invisible because party is static. Becomes a UX bug the moment mons can move
  in/out of slots.
- **`storyRetryInventorySnapshot`** (`24832`) — needs to snapshot **balls** and
  **pendingCatch** too, or retry can rewind catches but not consumed balls.

---

*Generated from a direct trace of the integration surface against the prior six-agent
audit. No code modified — this document is the deliverable. Use as a working
checklist; once each row is decided, implementation in milestones M0–M3 (see
`STORY_MODE_CATCH_INTEGRATION_RISK.md`) can proceed without ambiguity.*
