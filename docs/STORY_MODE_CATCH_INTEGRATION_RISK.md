# Catch / PC / Dynamic Party — Integration Risk Analysis

> **Anchor drift**: line numbers below were accurate at writing. Resolve
> stale `battle.html:LINE` refs via `node scripts/debug/symbol-index.mjs
> --lookup <symbol>` or `agent-state/ANCHOR_INDEX.md`. Most of the
> mechanics this doc analyzed (Catch, PC, Safari, balls) have shipped —
> see CHANGELOG.md and STORY_MODE_FLOW.md for the canonical current spec.

**Context:** Today the player's party is established by the Professor (1–6 mons rolled at
specific city visits) and is **never added to via wild encounters**. There is **no PC
storage**, **no Poké Balls**, **no wild-encounter battle path**. Adding all three at once
turns a static, draft-style game into a roguelike with collection.

This is a much bigger surface than `STORY_FEATURES_INTEGRATION.md` implies. This document
catalogs every place the existing code assumes a static party, every battle/save/UI
invariant that will break, and a sequencing plan that lets the new mechanics ship
**without retro-breaking saves or trivializing existing systems**.

All claims cite `battle.html:LINE`. Total `sm.team` references in code: **94**.

---

## 1. The 7 invariants the codebase silently relies on

If you violate any of these, something subtly breaks.

| # | Invariant | Where it's read | What breaks if you mutate party freely |
|---|-----------|-----------------|----------------------------------------|
| **I1** | Party only **grows via Professor**, only **shrinks at HoF** | `enterProfessor` `24314`, `_mysteryDoSwap` `24553` | Wild catch path will be the **first** mutation that isn't Professor; every "is full?" check needs to acknowledge it. |
| **I2** | Party content is **static within a city visit** | `renderCityActions` `23667–23720`, `_storyBuildSummaryHTML` `24064` | Catching mid-route → returning to city should re-render the hub team panel; today the panel is rendered once per `enterCity()`. |
| **I3** | Party size is the foe team's `partySize` for trainer rolls | `enterBattleEvent` party-size calc `24655`: `Math.min(Math.max(sm.team.length, 1), 6)` | Catch a 7th and the foe still gets sized to **min(7,6)=6**, but the player goes in with 6 (PC auto-deposit) — fine — UNLESS catching reduces party (release in PC swap) below the foe count, then it's a 1v6 wipe. |
| **I4** | "Mature party" = `length ≥ 4` | `storyStripGrade4IfPartyMature` `22480` | Catching to 4 mid-game **strips G4 forever**, suddenly making routes harder. Conversely, depositing back to 3 **re-introduces G4 weak foes** mid-late game — backwards difficulty. |
| **I5** | Mystery Figure modes branch on `length ≥ 6` (full) and `length ≥ 4` (rolls = ?) | `enterProfessor` `24317, 24324` | Players who use the PC strategically can stay at 5 to keep "add" semantics; full party at 6 forces "swap". This is a strong gameable interaction — not a bug, but a balance lever. |
| **I6** | `currentEnemyLock` snapshots the foe team at battle start | `sm.currentEnemyLock = …` at battle launch | If a mid-battle catch is allowed (Pokémon-style), the foe roster as catch target lives in `state.foeParty`, **not** in the lock. Catch flow needs its own pipeline — don't try to bolt onto `currentEnemyLock`. |
| **I7** | Hardcore persists `currentHp`, `status`, `pp` on `sm.team[i]` only | `24739–24750`, `24946–24961` | Caught mons enter at full HP; releasing/depositing wipes their persistence; PC-stored mons have an undefined "are they healed?" question. |

---

## 2. Concrete conflict catalog (file:line ↔ what breaks)

### Party-shape readers that need re-thinking

| File:line | Code today | Conflict with new mechanics |
|-----------|-----------|-----------------------------|
| `battle.html:21481` | `return sm.team.length < 6;` (used for "can add?" gates) | Becomes `partyHasRoomOrPcHasRoom()` once PC exists. Today this allows Professor; tomorrow it must allow **catch** without forcing a swap modal if the PC has space. |
| `battle.html:22481` | `if (… sm.team.length < 4) return gw;` — bail out of mature G4 strip | **The single biggest balance trap.** Catching a 4th wild mon in City2 kills G4 routes; depositing back to 3 in City6 resurrects G4. Solution: switch keying from `sm.team.length` to a monotonic `sm.partyEverReached4` flag, OR switch entirely to a `badges`-based curve (already in `_storyProgressFactor` `22604`). |
| `battle.html:22706` | `_rivalScoreAttackTypeVsParty` reads only `sm.team` | A wild-caught underleveled mon **drags the rival's counter-build down** — rival sees a Caterpie in your party and counters it. Either filter out caught-but-unbuilt mons here, or run rival adapt off "deployed in last fight" rather than "currently in party". |
| `battle.html:22897` | Rival rolling: `sm.team.length > 0` gates adaptive mode | Same issue — caught noise pollutes the signal. |
| `battle.html:23611, 23620` | `hasTeamRoom`, `rivalGateActive` city action gates | Need PC accessor; "rival gate" must not block while player is mid-catch loop on the previous route. |
| `battle.html:23671` | Tutor/Colress/etc. require `sm.team.length` | Trivial; PC mons should also be tutorable (allow "switch slot" OR "withdraw first"). |
| `battle.html:23698–23714` | `partyHurt`, no-item count, slot-with-3-moves count — drives city barker hints | Caught mons start with no item / 1–4 moves / no nature → **every barker fires constantly** for fresh catches. Either skip newly caught mons here or only count "set up" mons. |
| `battle.html:24145` | `(${sm.team.length}/6)` party header | Just text, fine — but PC count needs its own header `(N stored)`. |
| `battle.html:24317, 24324` | Mystery `isFull` / `rolls` use `length` | (Already noted as I5.) |
| `battle.html:24594, 24658` | "No Pokémon, visit Professor" hard-codes Professor as the only fix | If catch is the new entry path (e.g., starter is now a wild encounter), the alert text is wrong. |
| `battle.html:24655` | `partySize = Math.min(Math.max(sm.team.length, 1), 6)` | **Caps at 6, fine.** But if the player's party drops to 1 mid-run via PC, every basic trainer becomes 1v1. Decide policy: pad foe party from PC? Force minimum party of 3? Show a warning? |
| `battle.html:25507, 26958, 27352, 27669` | "No Pokémon in party" empty states for Link / Tutor / Colress / EV | All four need a "Withdraw from PC" CTA, otherwise an empty party + full PC = dead-end UX. |
| `battle.html:25587, 25620, 25654, 25690, 25608, 25642, 25678, 25706` | Link Station mutates `sm.team[idx]` in place | Link is **identity-preserving by slot** today. With dynamic party, the player expects "this is my Pikachu" → identity must be by mon, not by slot. Add a stable id when catching. |
| `battle.html:24515, 24537, 24556, 24560` | Professor adds via `sm.team.push(...)`, swaps via `sm.team[slotIdx] = …` | Same code path is the natural one for catching. But Professor's draft uses `usedNames` / `usedFamilies` (`24355–24357`) to prevent dupes — wild catch must **not** apply that filter, or the entire catch loop becomes "you've already caught X, fail". |
| `battle.html:24865–24878, 24946–24961` | After-battle sync from `state.playerParty` back to `sm.team` | Mons that were **deposited mid-run** are not in `sm.team` for that battle. Sync needs to be by id, not by index, or PC mons get clobbered. |
| `battle.html:26484` | `team:` blob in `sm` snapshot for run summary | Add `pcBox: …` and `inventory.balls: …` here too. |
| `battle.html:26505, 26526, 26550` | Tester scaffold `sm.team = Array.from(...)` | Dev-only; verify it still works after the schema change. |

### Battle engine readers (`state.playerParty`)

These are mostly fine because `state.playerParty` is **rebuilt every battle from `sm.team`**
at `10863` — so as long as `sm.team` mutations happen between battles, the battle engine
sees a consistent snapshot. Risks only emerge if **mid-battle catching** is added.

| File:line | Code | Mid-battle catch risk |
|-----------|------|----------------------|
| `battle.html:11077` | Heavy-Duty Boots clear loop iterates `state.playerParty` | If catching mutates `state.playerParty` mid-battle, this and ~30 other iterations break (race conditions). **Recommendation:** caught mons go to a staging buffer; promotion to `sm.team` / `state.playerParty` happens at battle end. |
| `battle.html:12998–13145` | Bench-aware abilities (Telepathy, Intimidate immunity bench checks, Sticky Hold poison absorber, Storm Drain redirect, etc.) | All read `state.playerParty.filter(m => m !== defender …)`. A mid-battle catch could spawn a bench member with no `currentHp` → these checks break. |
| `battle.html:13447` | EoT loop `state.playerParty.forEach` | Same concern. |
| `battle.html:11354–11975, 12020, 12293–12327` | Switch-in pickers, summary screens, gimmick slot tracking by index | All slot-by-index. **Don't append to `state.playerParty` mid-battle.** |
| `battle.html:13510–13514` | Sky Drop / role swap shenanigans | Don't touch this. |

### Save / load / migration

| File:line | Today | Required addition |
|-----------|-------|-------------------|
| `battle.html:22049` | `SAVE_VER = 14` | Bump to **15**. |
| `battle.html:22191–22206` | Default state initializer | Add `pcBox: []`, `inventory.balls: { poke:0, great:0, ultra:0, master:0 }`, `pokedex: { seen: Set, caught: Set }`, `partyEverReached4: false`. |
| `battle.html:22310, 22313–22348` | Load normalization | Initialize the new fields when loading older saves; **set `partyEverReached4 = sm.team.length >= 4`** so old saves don't suddenly re-encounter G4 trash. |
| `battle.html:22049–22183` | All migrations | Add `migrateStoryAddPcBoxPreV15()` — set `pcBox = []`, `balls = {…}`, derive `partyEverReached4`. |
| `battle.html:24832, 24902` | `storyRetryInventorySnapshot` | Snapshot must also include **balls** and **PC box state** at battle start, otherwise retry can rewind catches but not the consumed balls (or vice-versa) — desync. |

### Inventory / shop conflicts

| File:line | Conflict | Fix |
|-----------|----------|-----|
| `battle.html:21528` `POKEMART_ITEMS` | Mart has no balls | Conditionally inject `pokeball/greatBall/ultraBall/masterBall` when `sm.settings.catchMode === true`. **Don't** let `noItemRun` strip balls (they aren't battle items). |
| `battle.html:25110, 25145, 25202, 25226` | `noItemRun` filters by `battleBag !== false` | Add `meta.kind === 'ball'` exemption. Otherwise no-item-run + catch mode = unplayable. |
| `battle.html:21558–21570` | `isNoItemRunBattleBagExcluded` | Same exemption. |
| Mystery Figure & Trader & Wager | All move mons in/out of `sm.team` | Already gated by `length >= 6`. After PC ships, they should ask: **"swap into party or stash directly in PC?"** |

### Difficulty / balance interactions

| Source | Today | After catch ships |
|--------|-------|-------------------|
| Hardcore HP/PP persistence (`24740`) | Per-slot snapshot | Caught mon enters at full HP; on faint in a future battle, HP persists (good). But **withdrawing from PC** — does that "heal" the mon? Spec'd "no". So PC is a hospital? Decide: PC = stasis (HP frozen) or PC = safety only (no heal). Recommend stasis. |
| `_storyProgressFactor(badges)` (`22604`) | Pure badges | Independent of party — keep this. Use this as the single difficulty curve, deprecate party-size-based G4 strip. |
| Coin curve (`21356, 21365`) | Per-event constants × difficulty mult × progress mult | Wild encounters need their own coin payout (suggest: 10–20% of basic-trainer payout, no progress mult). |
| Rival adapt (`22697–22746`) | Reads full `sm.team` | Filter out un-EV-trained / un-built caught mons from the score, OR use last-battle's deployed party. Otherwise "catch a Magikarp" trivializes the rival. |

---

## 3. Six failure modes that will surface in playtest

If you ship catch + PC + dynamic party without the mitigations above, expect:

1. **G4 oscillation.** Player catches their 4th mon → routes get harder; deposits one in PC → routes get easier; catches a 5th → harder again. Difficulty bounces like a yo-yo because `storyStripGrade4IfPartyMature` keys off live count.
2. **Rival counter-pick exploit.** Catch a Magikarp/Caterpie before a Rival fight → rival weights its team to counter Water/Bug → swap the bait into PC at the last hub → rival's team is now miscalibrated. (Or the inverse: leave a strong type out of party until the fight to surprise them.)
3. **Dead-end empty-party UX.** Player deposits all 6 mons in the PC, walks into a city, can't enter Tutor/Link/Colress/Battle (all gated on `length > 0`), has no "Withdraw" button anywhere except (presumably) the new PC screen.
4. **Mid-battle catch race conditions.** Adding a 7th mon to `state.playerParty` mid-turn breaks 30+ bench-iterating ability checks (Sticky Hold, Storm Drain, Telepathy, etc.).
5. **Hardcore + catch = infinite revives.** Catch a fresh mon at full HP → swap with a fainted PC member → fainted mon stays fainted in storage but you have a "free" full-HP body. Either: caught mons cost a lot (catch cost == revive cost + ball price), or the PC heals slowly (1 mon/city), or both.
6. **Mystery Figure & legendary gate ambiguity.** At City8 + 8 badges, the gate forces a swap. If your party is 5 because you're using PC strategically, the gate adds the legendary as the 6th — bypassing the swap penalty entirely. Either: gate triggers at `party + 1 ≥ 7` always (so 5+1 doesn't trigger), or gate forces an additional PC deposit.

---

## 4. The `state.playerParty` ↔ `sm.team` boundary (must respect)

This is the single most important invariant.

```
sm.team (persistent, in localStorage)
   ↓  (rebuilt every battle at line 10863)
state.playerParty (transient, lives only during a battle)
   ↓  (synced back at line 24865, 24946 after victory/defeat)
sm.team (mutated)
```

**Do not** write to `state.playerParty` from catch code — write to a `state.pendingCatch`
slot. Promote it to `sm.team` (or `sm.pcBox`) only in the post-battle sync at `24865–24961`.
This keeps every existing engine assumption intact.

---

## 5. Ordering risk in `proceedToNextBattle`

`STORY_FEATURES_INTEGRATION.md` §8 prescribes: **itinerary → wild → wager → trainer**.
Today `proceedToNextBattle` (`24593`) just finds the next Battle row and enters it.

The integration risk is that wild encounters **don't have a `STORY_EVENTS_RAW` row**.
Two implementation strategies:

- **A — Wild as a modal interrupt.** In `proceedToNextBattle`, before scanning for the
  next battle row, run `runItineraryThen(rollWildEncounter, rollWager, enterBattle)`. The
  wild encounter is an inline mini-battle that doesn't advance `sm.eventIndex`.
  **Risk:** the wild battle reuses the engine but mutates `state` — must save and restore
  the broader story save before/after, otherwise a wild loss can corrupt position.
- **B — Wild as a virtual row.** Insert a transient row with `type === 'WildBattle'` that
  isn't in `STORY_EVENTS_RAW` but processes through the same `enterBattleEvent` path.
  **Risk:** every migration / index check has to know to skip these. Complicates `eventIndex`.

Strongly recommend **A**: keep wild encounters out of the timeline; eventIndex stays
clean; saves stay simple. The trade-off is needing a save/restore wrapper around wild.

---

## 6. Recommended sequencing (4 milestones, each shippable)

The point is that you can ship in stages and never have a half-broken save format.

### M0 — Schema only (no behavior change). 1 day.
- Bump `SAVE_VER` to 15.
- Add `sm.pcBox = []`, `sm.inventory.balls = {...}`, `sm.pokedex = {seen:[],caught:[]}`,
  `sm.partyEverReached4 = (sm.team.length >= 4)`.
- Migrate older saves (set fields to defaults; backfill `partyEverReached4` from current
  party).
- Refactor `storyStripGrade4IfPartyMature` (`22480`) to read `sm.partyEverReached4`
  instead of `sm.team.length`.
- Refactor every `length`-based difficulty/balance check (the §2 table) to use the new
  monotonic flag or `badges` instead.

This single milestone eliminates **failure mode #1** (G4 oscillation) before catch even
ships.

### M1 — PC Box only (no catching yet). 1–2 days.
- New screen `#screen-story-pcbox` with deposit/withdraw flow.
- City hub button: "PC Box `(${sm.pcBox.length})`" — visible iff `sm.pcBox.length > 0`
  OR `sm.settings.catchMode === true`.
- Allow Tutor / Colress / Link / EV Trainer to access PC mons (withdraw + tutor + deposit
  in one flow).
- Define **stasis policy** for PC: HP / status / PP frozen on deposit, restored on
  withdraw. Consistent with hardcore intent.

This unblocks the fix to **failure mode #5** (catch-as-infinite-revive).

### M2 — Catching. 2–3 days.
- Add Poké Balls to mart when `catchMode` is on (`21528`).
- Add ball-throw flow to wild encounter UI (CSS already exists `2875–2886`).
- Catch formula: standard Pokémon-style with grade modifier (G1 hardest to catch).
- Caught mon → if party has room AND player chose "to party" → push; else → `pcBox`.
- If party full + PC full → catch fails with explicit modal ("PC and party are full").
- Caught mons get a `caughtAt: cityIdx` and a generated build (use `makeBuild` `5974`),
  but **flag as `wild: true`** so rival adaptation can de-weight them.
- Update `_rivalScoreAttackTypeVsParty` (`22706`) to filter `slot.wild === true`.

### M3 — Wild encounters in the route loop. 2 days.
- Add `runItinerary()` queue (the spec'd structure).
- In `proceedToNextBattle` (`24593`), before finding the next Battle row, run:
  `await runItinerary(); await maybeRollWildEncounter(); await maybeOfferWager();`
- Wild encounters use **strategy A** above: save story state, run mini-battle in same
  engine, restore on exit, promote any catch from staging to `sm.team`/`pcBox` only on
  successful exit.

After M3, the mart-balls + PC + catching loop is fully online with no breakage to
existing code paths.

---

## 7. General recommendations — max fun, max replayability, max fanservice

(Distilled from the prior six-agent audit + this conflict pass.)

### Max fun

1. **Adaptive opponent switch in league fights** (story-only AI rule). Today no foe
   voluntarily switches. Adding "switch if incoming move is 4× resisted and bench has
   SE coverage" makes E4 / Champion feel sharp without rewriting the AI.
2. **Per-leader victory callbacks** — see §3.1 of the main audit. 15 lines of code,
   high felt-quality lift.
3. **Risk tokens before route battles.** Optional pre-battle modifier ("foe is 1.2×
   faster, you get 2× coins"). Stack across a city. Adds player agency in pacing.
4. **Slot machine in the casino** with a small prize pool (Rare Candy clone, +1 Link
   reroll voucher, type-themed orb). The current 50/50 coin flip is deadweight.
5. **Catch-mode gimmick: "wild mon's first move is announced"** — gives player a real
   tactical decision pre-throw (X Defense first? lead with a status absorber?).
6. **Egg from the Trader.** A bonus offer that hatches over N battles. Pure dopamine.

### Max replayability

7. **NG+ counter + run-clear achievements** (~20 binary milestones). All localStorage,
   no backend.
8. **Daily seed mode.** `?dailySeed=YYYY-MM-DD` → seeded run. Hash to `sm.runSeed` at
   `23304`. Players will share seeds organically.
9. **Speedrun timer** in the HUD with persistent best time.
10. **Starter-locked / monotype / no-evo run toggles** in the run setup screen. Most of
    the plumbing already exists (gen filters + `noItemRun`).
11. **A small set of post-HoF unlocks** that carry across runs (NG+ relic from Mystery
    Figure clear, "Mark of the Wanderer" 5%-shop-discount cosmetic, etc.). Anchors
    repeated runs to forward progress. Storage: a tiny `localStorage` key separate from
    `pbs_story_save`.
12. **Run seed share-card on the HoF screen.** Copy-paste blob with seed + team + badges
    + time. Almost free to ship; players use it as social glue.

### Max fanservice

13. **Catch table per route uses canonical regional pools.** Route 1 = Pidgey/Rattata
    energy, Safari = Tauros/Chansey/Kangaskhan, Lavender = ghost-only. Doesn't have to
    be exactly canonical; the *flavor* matches.
14. **Lock named E4 / Champion to slots.** Lance/Karen/Wallace/Iris/Diantha/Leon
    rotated by run, not generic "E1". Code already has the names in
    `TRAINER_QUOTES_BY_NAME` (`21782`).
15. **Mystery Figure as rotating cameo** (Red, Cynthia, N, Steven, Leon, Marnie, Hop,
    etc.) with a unique 4–6 line script per identity. See §15 of the main audit for the
    3-layer plan.
16. **Rival skin chooser** at run start — `pickStoryRivalSpriteFile` (`23199`) already
    has the mapping.
17. **Starter homage roll.** Bias `City0` Professor to occasionally offer a canonical
    starter trio (Bulbasaur/Charmander/Squirtle, etc.).
18. **Gym TM rewards** (Brock → Rock Tomb, Misty → Water Pulse, …). Drops into the
    bag on badge clear.
19. **Trainer-class flavor item drops.** Rocket Grunt → Black Sludge; Bug Catcher →
    Silver Powder. Tiny, beloved.
20. **Master Ball as a once-per-run crown jewel.** Cap at 1, gate behind a side quest
    or behind beating a hidden trainer. Fans love that the most powerful tool is also
    the rarest.

### Cross-cutting

- **Always-on pokedex panel in the city hub** once catch ships — flips a roguelike into
  a *collection* roguelike. Adds long-tail engagement at near-zero balance cost.
- **Show the next event in the hub** ("Next: Gym 4 — Erika"). Trivial; massively
  improves felt pacing.
- **Tooltip on the foe sprite during battle**: type advantages and current speed
  comparison. The single highest-impact "competitive info" upgrade and zero balance
  change.
- **A `oneTimeTip(key, body)` helper** wired to first encounter of every new system.
  Without this, the new mechanics will land unexplained on top of an already
  dense-screened game.

---

## 8. The single most important rule

**Decouple every difficulty / AI / balance signal from `sm.team.length`.**

The codebase has spent its life under a static-party assumption, so length means
"progression". The moment catch ships, length is just inventory. Every system that
keys off length needs to switch to `badges`, `eventIndex`, or a monotonic flag like
`partyEverReached4`. That refactor is M0 above and unlocks everything else cleanly.

If you do nothing else from this document, do that.

---

*Generated by direct grep-and-trace of `battle.html` (94 `sm.team` references audited),
cross-checked against the prior six-agent story-mode audit (`STORY_MODE_AUDIT.md`) and
the unimplemented-features spec (`STORY_FEATURES_INTEGRATION.md`). No code modified.*
