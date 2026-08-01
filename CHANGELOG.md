# Changelog

All notable user-visible changes land here. Sessions append entries under
`## Unreleased` and a date/branch heading.

## Unreleased — Legends: Z-A Mega Evolutions 2026-08-01 (`claude/missing-mega-evolutions-5xf4ab`)

### Added — 49 missing Mega formes, with sprites

The dex files already carried every Legends: Z-A mega (stats, typings, abilities, and
the stones that trigger them) but the engine's four hand-written gimmick tables only
listed the Gen 6 ORAS wave, so none of them were reachable. All of them are now wired:

- **48 more species can Mega Evolve** — Dragonite, Feraligatr, Meganium, Clefable,
  Victreebel, Starmie, Skarmory, Froslass, Emboar, Excadrill, Scolipede, Scrafty,
  Eelektross, Chandelure, Golurk, Chesnaught, Delphox, Greninja, Pyroar, Malamar,
  Barbaracle, Dragalge, Hawlucha, Drampa, Falinks, Baxcalibur, Crabominable,
  Golisopod, Magearna, Zeraora, Scovillain, Glimmora, Tatsugiri, Chimecho, Staraptor,
  Heatran, Darkrai, Meowstic (both genders), Floette-Eternal and Zygarde-Complete —
  plus second formes for Raichu (X/Y) and Absol / Garchomp / Lucario (Mega-Z).
- **They work everywhere megas already worked**: enemy trainers roll them, Colress
  offers them as an awakening, and the Battle Options mega toggle gates them.
- **Sprites ship locally** for all of them — front, back, shiny and shiny-back.
- **A stone now only fits its own species.** The old check compared the forme name's
  prefix to the species name, which let some legal pairings through only by accident
  and would have rejected Floette-Eternal → Floette-Mega and Zygarde-Complete →
  Zygarde-Mega outright. Stones shared by several formes of one species (Meowsticite,
  Magearnite, Tatsugirinite) now resolve to the forme actually holding them.

### Changed — a build's own Mega Stone now wins over the random roll

Assigning the MEGA gimmick used to overwrite the held item with a stone picked at
random from the species' list, even when the build already carried a legal one.
For a dual-stone species that meant a set could get the forme it wasn't written
for — Smogon's Charizardite Y sets are built around Drought, its Charizardite X
sets around Tough Claws. A build that names its own legal stone now keeps it, and
only builds without one take the roll. Builds holding another species' stone are
still corrected, and the roll stays seeded so story battles replay identically.

### Added — four alternate formes are draftable, so their Megas are reachable

`Floette-Eternal`, `Magearna-Original`, `Tatsugiri-Droopy` and `Tatsugiri-Stretchy`
had no competitive sets anywhere, and the draft pool is built from the set list —
so they never appeared, and four of the new Megas could never be seen. A new
project-owned `data/builds/custom.json` fills the gap: the three formes that are
mechanically identical to their base forme inherit its sets outright, and
Floette-Eternal gets two sets drawn from its real move pool. Every Mega-capable
species can now actually turn up.

### Fixed

- Mega stones with a suffixed name (`Charizardite X`, `Mewtwonite Y`, and now
  `Absolite Z` / `Raichunite X` …) were filtered out of builds even with Mega
  Evolution enabled, because the allow-check tested for an "…ite" ending instead of
  asking whether the item was a mega stone.
- A mega forme missing from the `@pkmn/dex` bundle silently fell back to a flat +20%
  stat bump. It now reads the game's own species table first, so the transformation
  always matches the real forme.
- Knock Off could strip a `Absolite Z` / `Garchompite Z` / `Lucarionite Z` (and take the
  bonus damage for it), Fling could throw one, and Trick could swap one away. Mega stones
  are none of those things — the check tested for an "…ite" or "…ite X/Y" ending, which
  can't see a Z-suffixed stone. It now asks the authoritative stone list.
- 19 of the newer mega stones hovered with an empty tooltip — the upstream Showdown
  item export ships them with no description. Their tooltip is now generated from the
  stone table ("If held by a Baxcalibur, this item allows it to Mega Evolve in
  battle."), so it survives the next data re-sync.
- Cries were silent for formes whose suffix the fallback chain didn't recognise:
  the new Mega-Z formes, and any gender-tagged forme without its own vendored cry
  (Meowstic-F and its mega, Basculegion-F). They now fall back to the base
  species' cry like every other forme.

## 1.7.0 — Story text reveal, speaker dialogue tones & build-generation engine 2026-07-07

Story-mode (normal) presentation polish and a balance pass on enemy/player build generation.
Out-of-scope modes (Quick Play / PvP / draft) are unchanged.

### Story text reveal & per-speaker dialogue tones (branch claude/story-text-reveal-and-speaker-tones)

Presentation only — no mechanics, balance, saves, or out-of-scope modes touched, all gated by
reduced-motion.

- **Story dialogue now reveals with reading tempo.** Narrative beats type out letter-by-letter
  by default instead of dumping all text at once, giving the writing pacing. A new **Settings →
  "Story text reveal"** toggle turns it off (full text instantly), and reduced-motion always
  shows instant text. Tapping once completes the current line; tapping again advances.
- **Characters now read in their own colour.** The dialogue nameplate tints by speaker — the
  **Professor** warm gold (mentor), the **rival** burnt orange (matching their battle-intro
  accent), villains oxblood, and the uncanny "anomaly" beats cold blue-grey — so you recognise
  who's talking at a glance. Applies to both the full-screen story overlay and the city hub
  quote box. Default gold-on-dark is unchanged where no speaker tone applies.

### Build-generation engine & early-game balance (branch claude/jolly-lovelace-gwa2b7)

Story-mode (normal) balance pass focused on enemy/player build generation and the
early-game curve. Every new path is gated behind an active story run or an opt-in flag.

- **No more early power spikes.** Added an early-game enemy **grade ceiling** that tracks
  your evolution availability — enemies can't field a G3 (evolved-tier) Pokémon before
  City 2, where the Evolution Tutor opens. Fixes the "a fully-evolved tank shows up at Gym
  1" cases (e.g. Lapras). Grade then opens to G2 by mid-game and unrestricted from City 6.
- **No more weak/odd enemy sets.** Enemy Smogon sets are now picked by **competitive power
  scaled to the stage**: humble early, and **only very good sets in the Elite Four, Champion,
  and everything after** — so a Champion never rolls a weak set, and mid-game trainers stop
  rolling unviable ones.
- **No more "Tackle from a Gym 6 leader."** Designed builds that ran short on moves used to
  pad with literal Tackle; they now fill the species' typed STAB.
- **Livelier, more coherent builds.** A new data-driven **archetype engine** gives designed
  builds (enemy *and* your wild catches) real move distributions (STAB / coverage / status /
  setup / recovery / hazard), **combo synergy** (Protect+Toxic, Rest+Sleep Talk, …), and
  **stat-sensitive EV spreads** instead of a frozen 252/252 + greedy four attacks.
- **Smoother mid-game.** City 5 steps up slightly (foe stat curve 1.00 → 1.03) so Gyms 4→5→6
  read as a gradual climb instead of three identical fights.

## 1.4.0 — Narration system, facility polish, party UI, Evolution Tutor & engine fixes 2026-06-03

### Story narration system — all 198 scenes converted to structured acts

Every pre-battle and mid-battle story scene (villain arcs, horror species
encounters, mid-raid interrupts, the full 14-scene main spine) has been ported
from bare dialogue strings to the **structured acts schema**: each scene is a
list of `{ speaker, lines, sfx? }` acts that the overlay steps through one card
at a time. Scenes can now chain multiple speakers, play per-act SFX, and support
a "continue" beat between acts rather than dumping all lines at once. End-to-end
DOM render and interaction tests verify that every scene renders at least one
card, advances correctly, and dismisses without errors (198 / 198 scenes verified).

### Story facilities — unified Pokémon header + shared ℹ info button

Every training facility (Move Tutor, Battle Dojo, EV Trainer, Nature Rater,
Cable Link, Evolution Lab, Pokémon Center) now opens **all party slots closed**
on entry — no more jumping to the last-expanded mon on re-entry. Every facility
also gains a consistent **ℹ** info button in the slot header that opens a
read-only summary modal (same as the draft-pick inspect modal), so players can
review a mon's full build without leaving the trainer screen.

### Party reorder UI — compact rows + drag auto-scroll

The party reorder modal was rebuilt from scratch. Rows are now **compact** (44 px
each, sprite + name + type chips in one line) so all six slots fit without
scrolling on a typical phone. Drag auto-scroll activates when a held row is
dragged within 48 px of the top or bottom edge, enabling smooth reorders on small
viewports. Drop zones are larger (full-row hit target) to reduce mis-drops.

### Evolution Tutor — flat pricing + Master PC evolution

- **Flat fee per tier, no ramp.** The old "first evo cheaper, each repeat costs
  ×1.5 more" ramp is gone — every evolution costs the same, every time:
  **G3 (first-stage) 3,000G · G2 (mid) 6,000G · G1 (final) 12,000G**, on every
  difficulty. The easy / very-easy first-use discount was also removed for
  consistency. A 🍬 Rare Candy still evolves for free, one candy per evolution.
- **Evolution Master can now evolve directly from the PC.** From the 5th city
  onward, the Evolution Master shows an "Evolve from PC" section listing every
  boxed Pokémon ready to evolve — evolve it in place without pulling it to your
  party first. Before the Master, a one-line hint explains the restriction.

### Department Store prices reduced

Orbs: **500G** (was higher) · Teleporter: **300G** · EV Reset Charm: **500G** ·
Max Elixir: **500G**.

### Battle engine fixes (Stage 1)

- **Speed Boost / Stakeout timing** — ability triggers that should fire at
  turn-start were firing at turn-end; fixed to the correct phase.
- **Semi-invulnerable self-target** — a Pokémon using a two-turn dive/fly move
  could incorrectly be targeted by its own recoil/crash check during the
  invulnerable turn; patched.
- **Gravity move-ban** — Gravity now correctly prevents Fly, Bounce, and other
  airborne moves on both sides for the full duration.
- **Facade + burn damage** — Facade now correctly doubles its base power when the
  user is burned (matching the gen-5+ ruling), instead of being suppressed by the
  burn's physical-move penalty.

## 1.2.2 — Evolution staging, required intros, bag polish & egg animation 2026-05-26 (`claude/early-game-pacing-finish`)

- **Evolution staging** — Stage-1 evolutions from the first gym city, Stones from the
  second, and **final (Stage-2) evolutions from City 4** — you evolve a bit ahead of
  what you fight.
- **One-time intros** for the Bag (start town) and Party + Fan Club (first gym city).
- **Bag** now shows your **Poké Balls** and trims the voucher/vitamin text; the first
  **Pokémart gifts 5 Poké Balls** and the first **Poké Center gives a Full Restore**.
- **Egg-hatch animation** — the egg wiggles, cracks, and the hatchling pops in.
- Verified the facility NEW / visited badges and the starter-city Artifact Hall work
  as intended (regression test added).

## 1.2.1 — Early-game pacing, placement & clarity 2026-05-26 (`claude/early-game-pacing-patch`)

- **Tutors are always available.** Move Tutor + Nature Rater (and the Fan Club) now
  appear in every city — the first gym city no longer ships without them.
- **The Professor gives a basic.** Your gift is always an unevolved Pokémon (never a
  fully-evolved one), so you raise and evolve it yourself.
- **Wilds are base forms only**, with IVs that climb as the run goes on; legendary /
  special offers are always perfect (31), and enemy IVs cluster around a rising
  average instead of swinging wildly.
- **Cleaner city menu** — required steps and your team up top; Cable Link, Bag, and
  Artifacts tucked to the bottom.

## 1.2.0 — Story balance pass, daycare & Fight Club rework 2026-05-26 (`claude/kind-goodall-NeTyO`)

- **Smoother difficulty curve.** Enemy strength now rises every gym instead of
  flat-lining: the old Gym 1≡Gym 2 start and the Gym 4≡Gym 5 "dead zone" are
  gone (enemy stat multiplier ramps 0.95→1.10 across the eight gyms).
- **Daycare eggs hatch on your schedule.** An egg now hatches about **two towns
  after you pick it up** instead of waiting for the 7th badge, and the belt
  gives an "egg is stirring…" nudge the town before it hatches.
- **Fight Club is a 5-round gauntlet.** Sweeping all five now lifts your whole
  team by **+5** to every stat (the intended one-time power catch-up).
- **Rivalry journal moved** out of the Pokémon Center into **Collection**,
  alongside the Pokédex / Achievements / Hall of Fame.
- **Cries play from local files** (work offline; no third-party fetch).
- **Fixes:** "Pokémon League" / "Pokémon Fan Club" buttons show the accent;
  paralysis tooltip now correctly says Speed is *halved*; PC storage help reads
  cap 30; the Colress price reads **5,000G** everywhere (matching the charge).
- **Accessibility:** draft pick cards are keyboard/screen-reader operable, and
  screen transitions move focus into the new screen.

## Unreleased — Fatigue, Daycare egg quest, Underground Pits, PC click-to-detail 2026-05-22 (`claude/dreamy-goodall-5A3lZ`)

### Reworked — Daycare Inn + Fight Club: one dark one-time storyline 2026-05-23 (`claude/dreamy-goodall-5A3lZ`)

The Daycare/Pits pair from the entry below is **superseded** by a single
authored, one-time arc. The mechanics that changed:

* **Renamed** "Underground Pits" → **"Fight Club"** (with a tasteful film
  nod on first entry — *"first rule: you don't talk about it"*).
* **Daycare Inn is now a front.** Drop a partner off and **they don't come
  back** — you walk out with a **real, carryable Egg** (🥚 icon, sits in a
  party or PC slot, deposit/withdraw like any mon, can't battle or be sold).
  When you ask where your Pokémon went, the matron gets shaky and evasive —
  a cruise, an island, a "different career," a bald man with a plane and a
  Persian, *"making money."* A water-stained *"120 Days of Pika"* poster by
  the staff door. Dark-comic, played as innuendo — nothing graphic. The
  drop-off is **one-time**.
* **Eggs hatch in place after Gym 7** (the slot becomes the typed, +1-grade
  hatchling wherever it sits — party or PC). The parent is gone; the egg is
  what you get.
* **Fight Club unlock is narrative-gated.** At 6 badges the matron offers a
  **secret** → a basement door → you choose to **go down** (one-time; "walk
  away" leaves it re-offerable). Replaces the old auto-unlock toast.
* **Entry requires a full stable of six fighters** (eggs don't count).
* **Win = nobody is released.** The old "bonded mons auto-release on city
  return" rental model is **removed**. Clear all three fights and **all six**
  (fighters and witnesses) keep a permanent **+1 to every stat** (capped;
  buildPokemon hardcaps IV+bonus at 36) — plus gold. The cost is a single
  dark line in the result, not a mechanical loss. The story club is **one-time**.
* **Lose** → retry is free and unlimited; the only way to lose a mon is to
  **crawl home beaten**, which kills **all three** of your fighters
  (to-the-death) — you don't leave the Fight Club whole.
* **Endgame Fight Club** (post-Champion): a repeatable, **money-only** loop —
  no Daycare, no egg, no permanent buff. The Daycare Inn is shuttered.

Eggs are filtered out of the battle draft and preserved across the
post-battle team rebuild; every party-rendering facility (PC, Cable Link,
Evolution Lab, EV Trainer, Colress, tutors, Professor swap) skips eggs so a
buildless egg slot can never crash a screen. Tests:
`tests/suites/story-daycare-pits.test.js`.

### Added — Pokémon Fatigue (1% stat / start-HP debuff, capped at 3 stacks)

Every random / route trainer / wild fight now leaves the **whole team** with
+1 stack of Fatigue (capped at 3). Each stack docks **−1% to all combat
stats** and **−1% to starting HP** when a mon enters its next battle. Max
HP is unchanged, so a tired mon enters a fight at 97-99% but still heals to
the normal full at the Pokémon Center.

Fatigue **clears in three places**:

* Visiting a **Pokémon Center** — wipes status, refills PP, AND clears
  all fatigue stacks. Now the only "clean rest" you need to plan around.
* Walking into **any iconic fight** — Gym Trainer, Gym Leader N, E1–E4,
  Champion, Rival, Mystery Figure, Boss Arc, **Pit fights**, Crucible /
  Frontier. The auto-clear is bilateral: cleared on entry, cleared on
  exit. Iconic fights never feel "stale" or punish you for grinding up
  to them.
* The first time a stack lands, a one-shot **bulletin overlay** explains
  the system (saved under `sm.flags.seenTirednessIntro`).

Implementation: `build.tired` 0..3 on every persisted mon; `buildPokemon`
applies a single multiplier after the standard stat formula; full IV/EV/
Nature math is unaffected so move damage / Trick Room / IV reads all
behave normally.

### Added — Pokémon Daycare (egg quest, Gym 1 unlock / Gym 7 hatch)

Beat **Gym 1** and the Daycare facility opens in every city's `Heal &
Team` strip. Drop off **any Pokémon** (party or PC) and they board the
"cruise." A postcard arrives by Gym 7 — and they come back with a freshly
hatched partner that shares ≥1 of their typing and sits **one grade tier
higher** than the parent.

Both mons go back to your party (overflow to PC). The drop-off is the only
"sacrifice" — the daycare matron has a knowing grin and the postcards are
worded with deliberate dark-comic awkwardness ("Subject Zero is doing…
*very* well, apparently") — but mechanically the parent always returns
alongside their kid.

After **Hall of Fame**, the Daycare flips into its **Crucible Daycare**
variant — the loop repeats with the higher-grade tier curve, and the
matron's flavor lines acknowledge that you're no longer a rookie.

### Added — The Underground Pits (post-Gym-6 illegal bracket arena)

Beat **Gym 6** and a new "off-grid" facility appears in the `Next Step`
section: **The Underground Pits**. The Pit is a 3-fight bracket. You
pick **3 mons** from your party; the engine rolls a foe roster keyed to
your most recent **team snapshot** (Gym 6 snapshot for pre-League runs,
post-Champion snapshot for the Crucible loop):

* **Fight 1** — warm-up: foe tier ≈ player tier + 1 (weaker)
* **Fight 2** — mid: foe tier = player tier
* **Fight 3** — boss: foe tier ≈ player tier − 1 *and* every foe stat
  carries a flat +2 bonus to represent the bracket's top dog.

Foe builds run through the standard `_applyStoryBuildPowerTier` pass
with a synthetic `Gym Leader N` event name (N = current badge count) —
so Pit foes get the same tier polish, IV roll, and move/EV depth a
same-stage Gym Leader fight would have. No special "Pit power curve"
to balance, the bracket inherits the legitimate gym ladder directly.

Auto-heal between fights; fatigue never accrues. Win all three and:

* **Every team member** (witnesses) gains a permanent **+1 on EVERY
  stat** (HP / Atk / Def / SpA / SpD / Spe), capped at **+5 per stat**.
  The bonus stacks ON TOP of the 0–31 IV range, with a hardcap at
  **effective IV 36** — `min(36, ivs[stat] + bonus[stat])` enforced
  at the single `getIV` site in `buildPokemon`. Five winning brackets
  bring every stat to the 36 ceiling and further wins can't push past.
* Gold payout = **50% of the next Gym Leader's reward** (floor 1000G).
  Pre-League: ~2,775G at 6 badges, ~2,900G at 7, ~2,975G at 8. The Pit
  is a half-pay shadow of the legitimate ladder; the *risk*, not the
  *purse*, is what makes the bracket worth running.
* The 3 bracket Pokémon become **BONDED** — they're branded for the
  Underground and auto-release the moment you walk back into a clean
  city. (Streets are streets, the alleys claim their own.)

### Added — Pit defeat: retry overlay + battle-to-death forfeit

Losing any of the three bracket fights surfaces a dedicated **Pit
Defeat overlay** with two paths:

* **Try Again** — free, unlimited. Heals the team to full and relaunches
  the same fight at the same bracket index. The Pit doesn't care how
  many tries it takes.
* **Forfeit** — exits the bracket and rolls the death. One random
  Pokémon out of the three you picked **dies permanently** — removed
  from the save outright. The other two "barely" make it out and are
  released to your **PC** (they survive but they're not playing the
  next fight). No win bonus, no gold, no bonded list.

Forfeit gates behind a `confirm()` dialog so an accidental click can't
delete a mon. The death roll is a uniform random pick across the 3
bracket ids. Whoever it lands on disappears from team / PC entirely
— there is no funeral screen, no Pokédex tombstone. The Pit doesn't
keep records.

### Added — Champion snapshot powers the endgame Pit ladder

When you clear the **Champion**, the engine takes a second team snapshot
that becomes the strength reference for **all Crucible Pit fights**. So
the Pits stay interesting in the post-game loop without being trivially
overscaled.

### Added — Click any party / PC / Underground row to view its full build

The PC's three lists (Party, PC Box, Underground sell-table) now treat
the whole row as a clickable summary opener — same draft-pokemon modal
the team panel and Professor flow use. The buttons (Deposit / Withdraw /
Release / Sell) keep their original behavior via `event.stopPropagation`,
and the row gets a subtle `ⓘ` cue + `cursor:pointer` so the affordance
is obvious without changing the layout.

### Schema

Save version bumped to **20**. Per-mon fields added on every build:
`bonus: { hp, atk, def, spa, spd, spe }` (0..5 per stat) and `tired: 0..3`.
Top-level state additions: `sm.daycare`, `sm.pits`, `sm.flags`. All have
in-place migration so v19 saves come forward without losing progress.

## Unreleased — Rival overhaul: a counter-team that's built around YOU 2026-05-23 (`claude/keen-euler-lfmeB`)

### Changed — The Rival now plays like a GB-era rival, not an Elite Trainer with themed aces

The Rival's team is now fundamentally a **live counter** to your six, with
signature Pokémon demoted to occasional flavor cameos rather than the team's
backbone. A new per-phase counter plan (`_rivalCounterPlan`) drives the roll:

* **Intro (starter duel):** the rival's lone Pokémon mirrors the GB starter
  triangle — pick Bulbasaur and the rival leads Fire, pick Charmander and it
  leads Water, pick Squirtle and it leads Grass. Non-classical starters fall
  back to the highest super-effective type vs your starter.
* **Early / Mid / League:** 1 / 2 / 3 slots are now *forced* raw counter-picks
  that never roll a signature; the remaining slots roll a signature only on a
  reduced probability (0.45 / 0.40 / 0.35), otherwise they too become
  type-counter picks. So at the League rival you face ~3 hard counters, ~1–2
  signature cameos, and ~1–2 type-weighted picks instead of five fixed aces.
* **Punchier counters:** the per-pick type-weight floor dropped 0.35 → 0.10
  (weak types stop nudging in), the League rival decays a used counter-type
  harder (÷15 vs ÷10) so a single answer doesn't repeat across all six, and the
  anti-monotony cap rose 2 → 3 so a dominant counter (vs a monotype party) can
  land on three mons and read as deliberate rather than coincidence.

Measured behavior: vs a Fire monotype party the League rival now fields ~63%
Water/Ground/Rock mons; vs a Water party its Grass/Electric coverage jumps to
~41% (and falls to ~12% vs a Fire party) — the picks track *your* typing.

### Verified — Signature-Pokémon logic audited, no mutation bug

Confirmed the signature pool (`S`) is a fresh `.slice()` copy, so the
`S.splice()` consumption during a roll can never corrupt the source
`trainer.sigs` array across rematches; sigs are de-duplicated within a team and
never appear twice. Covered by the new test suite below.

### Added — Rival identity: pre-battle banner, darker league dialogue, aftermath voice

* **Phase banner.** Rival battles now open with a phase tagline above the intro
  quote — *Starter Duel · First Rematch · On the Way Up · Title Match*.
* **Shadow dialogue.** At the title match, if you've lost ≥2 prior rival fights
  the league rival's pre-battle line turns cold and Silver-toned.
* **Aftermath voice.** A new standing-aware post-battle line
  (`getRivalAftermathLine`) plays in the victory overlay when you win and in the
  concede flow when you lose — grudging respect, escalating taunts on a loss
  streak, and a Champion concession/claim at the league.

### Added — Persistent rival journal (Pokémon Center → "Rivalry" tab)

Every rival encounter is now recorded to `sm.rivalEncounterLog` (phase, win/loss,
badge count, and a snapshot of the team the rival brought). A new third tab in
the Pokémon Center shows your head-to-head standing and one card per past fight,
the rival's team rendered as sprite chips — a GB-style pause-screen memory that
makes the rivalry feel persistent and personal. Read-only; persists via `save()`.

### Added — Phase-aware "Next: Rival" city chip + passive rival cameo

* The city tip rail's "Next:" chip now flags an upcoming rival with 🏁 and a
  phase tease (*starter duel at the gate / tracked you down / been training hard
  / title rematch*).
* Between rival fights, the run's rival makes a passive cameo in two hub cities
  (5 and 8): when only the flavor City Guide would appear, the rival walks the
  same town with an ambient line. Pure presence — no battle, no actions, and the
  Professor's gameplay slot is never displaced.

### Verified — Crucible rival rematch routes through the same pipeline

The Crucible "Rival Rematch" sets the league rival row and goes through the same
`rollTrainerTeam('Rival', …)` path, so the counter rework, banner, dialogue, and
aftermath all apply to it automatically — no separate code path.

### Changed — Faster team rolls: hoisted the per-call grade-override Sets

`getMonGrade` allocated two override `Set`s on every call; since a single team
roll calls it for all ~1,400 species, those Sets are now module constants
(`_GRADE1_OVERRIDE` / `_GRADE2_OVERRIDE`) instead of per-call garbage.

### Tests

`tests/suites/rival-generation.test.js` grew to 11 tests covering the per-phase
counter plan, starter-triangle mapping, party-responsive counter dominance,
species dedup, signature cameo rate, the `trainer.sigs`-not-mutated invariant,
phase taglines, the league shadow branch, the standing-aware aftermath voice,
and journal logging + render. A test-only `__rivalTest` handle exposes the
inner-scope rival functions to the jsdom harness (inert in normal play). Full
suite (`npm test`, 544 active) and the headless story walkthrough stay green.

### Scoped out (intentionally)

* **Distinct rival BGM** — there is no per-event battle-music selection in the
  engine today (battles share the field BGM), so there was no differentiation
  point to hook; adding a dead track-id stub would be a half-feature.
* **Text-only "rival was seen in town" mentions** — the passive cameo above
  delivers the same off-screen-presence beat more vividly, so the redundant
  text mentions were dropped.
* **Grade-pool build cache** — the team-roll pool build was left uncached: a
  keyed cache adds a stale-pool failure mode on the exact path this overhaul
  reworked, and the Set hoist above already removes that loop's per-call
  allocation churn.

## Unreleased — Per-battle EV training + EV Trainer fill-to-target 2026-05-22 (`claude/laughing-planck-9DK9U`)

### Added — Battle EVs (training without the optimizer)

Winning a trainer battle now grants a small, flat EV training reward to
the player's team (per battle — not per defeated foe):

* **Regular trainers** (Basic Trainer, Gym Trainer, Elite Trainer) →
  **+4 EV** to each active mon, **+2** to each bench mon.
* **Boss fights** (Gym Leader, Rival, Elite Four, Champion, Mystery
  Figure) → **double**: **+8 EV** active, **+4** bench.
* Wild Pokémon → unchanged (wild catches still get the existing 170 EV
  archetype head-start; defeated wilds don't drip into the team).
* Crucible / Frontier / Mystery rerun battles → no EVs (the entry-point
  check uses `sm.crucibleBattleSource`, so post-HoF rematches don't
  trivialize the cap).

**Active vs bench:** mons that took a turn (lead + any switch-in) get
the full amount; everyone else gets half. The active-mon set lives on
`window._battleActiveStoryIdxSet`, populated by `startBattle`, the
voluntary-switch path, and the forced-switch (faint-replacement) path.
(No per-foe faint counting — the flat-per-battle model dropped that
fragile bookkeeping entirely.)

**Stat distribution:** deterministic per species so an active mon's EVs
*converge* on the same two stats every fight instead of scattering —
the story RNG only breaks exact atk==spa / def==spd ties (seeded runs
still reproduce). The two stats follow base-stat identity:

* Offensive mons → best of Atk/SpA + Speed (sweeper).
* **Bulky high-attack mons → HP + their best attacking stat** — so a
  Snorlax or Tyranitar trains offense, not pure walling. (This was the
  one real hole in the first cut: bulky attackers were flagged
  "defensive" and got HP/SpD with zero Attack.)
* Pure walls → HP + best defense (Blissey → HP/SpD, Shuckle → HP/Def).

The same `_pickBattleEVStats` helper drives both the player gain and the
post-Gym-4 enemy nudge.

**Caps:** each grant respects 252 per stat and 510 total. Once a mon is
fully trained, further battles silently no-op.

By the time a player clears the league, an always-active lead earns
~200 EV (≈40% of cap) from natural battling — noticeable progress, but
the EV Trainer still matters for the final polish.

### EV Trainer overwrites the spread (commit to a clean preset)

The EV Trainer applies the chosen preset by **overwriting** the mon's
EVs — discarding any prior spread, including battle training. This is
deliberate: it's the "I know exactly what I want" path. A mon that
drifted into the wrong stats from natural battling can be re-pointed to
a clean competitive spread in one step.

(An earlier draft made the trainer *additively fill toward* the preset
to preserve battle training, but that couldn't reach a clean spread
once off-target battle EVs had eaten the 510 budget — the new EVs
wouldn't "write". Overwrite is the correct, predictable behavior:
pick "Special Sweeper" and you get exactly 252 SpA / 252 Spe / 4 HP.)

* Flat **5,000G per preset** (or free with a Vitamin Pack).
* Presets already matching the current spread show "Applied" and are
  disabled.
* To keep battle training and *also* commit a preset, use the EV Trainer
  first, then re-battle — or wipe and restart with the EV Reset Charm.

### Added — EV Reset Charm (Department Store, 3,000G)

A consumable item that wipes all EVs from a single Pokémon. Use case:
a mon whose top 3 base stats made for a suboptimal random EV
distribution (e.g. a Slaking that landed EVs in HP/Atk instead of
Atk/Spe). Buy from any Department Store (Cities 6 + 8) for 3,000G,
use from the city bag. Single-use, confirmation gate, no refund.

### Changed — Mid-game enemy trainers get a tiny EV nudge from Gym 4+

To counterbalance the player's natural training, T2 (Novice) and
T3 (Competent) trainer mons get **+20 EV in their archetype's top 2
stats** once the player clears Gym 4. T1 untrained route fodder still
runs at 0 EVs (the "you're starting out" signal stays intact). T4
tournament builds are already at the cap and are unchanged. The
existing pre-Gym-4 stat softening (×0.82 → ×0.95 → ×1.00 at Gym 3+)
is **not** touched — early game stays gentle.

### Files touched

* `battle.html`:
  * `_pickBattleEVStats` helper next to `_wildPickEVs` (deterministic
    spread + bulky-attacker handling, seeded-RNG tiebreak only)
  * `EV_GAIN_ACTIVE`, `_classifyTrainerEvent`, `_grantBattleEVs` in
    the StoryMode IIFE (flat per-battle, REGULAR/BOSS tiers)
  * `onBattleEnd` hook (post-coin grant) — fires the EV grant and
    surfaces a `🏋️ Training: …` toast
  * `startBattle` / voluntary switch / `selectPartyMember` forced
    switch → populate `window._battleActiveStoryIdxSet`
  * `evTrainerApplyPreset` / `evTrainerApplyPresetWithVitamin` overwrite
    the spread with the chosen preset (flat 5,000G, or free with a
    Vitamin Pack); preset cards show flat cost / "Applied"
  * `DEPT_ITEMS` → new `evResetCharm` entry, custom bag-render handler,
    `openEvResetPicker` + `applyEvReset` functions, public API export
  * `_storyMaybeNudgeFoeEVs` called from the trainer-team roll pipeline
    after the tier downgrade
  * Save-load (`load()`) — backfill `build.evs` for any team / pcBox
    mon missing the object

### Tests

* All 546 existing tests still pass.
* Story walkthrough (`tests/story-walkthrough.mjs`) clears through to
  the post-HoF Mystery Figure with the new EV grants firing on every
  trainer win.
* In-process smoke test verified: +4 active / +2 bench from a regular
  trainer, +8 active from a boss fight, Snorlax (bulky attacker) trains
  HP+Atk while Blissey (pure wall) trains HP+SpD, an always-active
  Garchomp converges on exactly Atk+Spe over 10 fights (no scatter),
  EV Reset Charm wipes cleanly, EV Trainer fill-to-target preserves
  prior training.

## Unreleased — Evolution flow rebuild: Stone Emporium, Bill/Granny intros, intro-once gates 2026-05-22 (`claude/gracious-mayer-H31zi`)

### Added — Stone Emporium, Bill, Stonewise Granny, and a voucher per facility

The evolution path is no longer a black box where the Stone Sage absorbs
stones and trade-memory into the gold fee. Players now own the
consumables and meet the people who hand them out.

* **Stone Emporium (new facility, City 2+ onward, always available).** A
  flat 500G-each catalog of every evolution stone (10) and every
  trade-method item (14) the Stone Sage needs — Fire Stone, Metal
  Coat, Dragon Scale, Reaper Cloth, all of them. Every purchase shows a
  confirmation dialog so a misclick never burns gold. `sm.inventory.<id>`
  tracks owned counts; items consume on evolution, not on hold.
* **Bill — Cable Link intro on first arrival at City 2.** New
  `firstCableLink` tutorial scene introduces the Cable Link Station
  network, explains why trade evolutions need a visit, and hands the
  player a **"Bill's Discount Card"** voucher (`linkDiscount50`) — a
  one-time 50% off on any single Cable Link action (Reroll / Upgrade /
  Rebuild). The Link Station UI now renders sibling "🎟 Half-Price"
  buttons whenever the voucher is held.
* **Stonewise Granny — Stone Sage intro on first arrival at City 2.**
  New `firstStoneSage` tutorial chained right after Bill. Granny
  explains how the new Stone Sage works (bring me a stone, I'll wake
  the partner up) and hands over a **Stonewise Token** voucher
  (`stoneToken`). The token redeems at the Stone Emporium for one free
  stone of choice (not trade items).
* **Stone Sage rewire.** Stone evolutions now consume a stone from
  inventory; trade evolutions require the Cable Link in this city has
  been visited at least once; held-item trade evolutions also consume
  the item. Rare Candy still skips gold + stone/trade-item ownership
  but **does not** skip the Cable Link visit — the lore is the
  friction, the wallet is the override. Each evo card now shows a
  specific "Need Fire Stone" / "Visit Cable Link" / "Need Metal Coat"
  hint with the full reason in the title hover.
* **Welcome voucher on every facility intro.** Each existing first-visit
  tutorial gains a one-shot themed gift on Continue, sized to ~one
  free use of that facility:
  - Pokémart → +1 Poké Ball
  - Pokémon Center → +1 Potion (battle bag)
  - Department Store → +1 Great Ball
  - Move Tutor → +1 Heart Scale
  - Nature Rater → +1 Mint
  - Battle Dojo → +1 Emblem of Honor
  - EV Trainer → +1 Vitamin Pack
  - Game Corner → +1 Lucky Chip (new `casinoChip500`, 500G bet credit)
  Vouchers fire only on the tutorial's Continue, so they can never
  appear before the player has actually seen the mechanic taught.
* **Introduce-once Leave-City gate.** On the debut city for each
  facility (City 0 for the basics, City 2 for the new evolution
  trio, City 4–6 for the late-game facilities), the Leave-City button
  blocks until the player has tapped each unfamiliar facility at
  least once. Once introduced, the gate releases for the rest of the
  run. A new red pulsing **🔴 Required** badge marks the facility
  buttons that still need a first visit; the disabled Continue Route
  button names them ("Visit Bill's Cable Link, Stone Emporium, and
  Stone Sage first").

### Changed — City 0 and City 1 no longer carry evolution facilities

`STORY_EVENTS_RAW` drops `Link Station` and `Evolution Tutor` from the
City 0 and City 1 action lists. Stone Shop is added to every City 2+
entry. The evolution mechanic now debuts as a coherent moment instead
of being available on the very first hub.

### Files touched

* `battle.html` — new Stone Emporium screen markup + `enterStoneShop` /
  `buyStoneItem` / `redeemStoneToken` functions, `STONE_SHOP_ITEMS`
  catalog (24 entries), `STONE_NAME_TO_ID` + `TRADE_ITEM_NAME_TO_ID`
  lookups, `FACILITY_DEBUT_CITY` map, `sm.facilityIntros` state +
  init + migration, `_isFacilityRequiredHere` / `_pendingFacilityIntrosHere`
  helpers, Leave-City branch + 🔴 Required badge + CSS pulse, Bill /
  Granny / Emporium Keeper tutorial scenes, `onContinue` voucher
  hooks on every existing first-visit scene, Stone Sage requirement
  gating in `renderEvoLabTeam` + `evoLabEvolve` / `evoLabEvolveWithCandy`,
  half-price voucher support on `linkReroll` / `linkUpgrade` /
  `linkRebuild`, 24 thematic substitute sprite slugs for the new items.
* `docs/EVOLUTION_FLOW_REBUILD.md` — full design doc and agent fan-out spec.

## Unreleased — Storyline-variant prose density pass 2026-05-22 (`claude/bold-maxwell-KATFd`)

A single multi-surface pass that takes the 8 narrative storylines from
"cosmetic prose at 9 cold-open beats" to "ambient variant presence
across the whole run". Pure additive — no engine changes, no
timeline/structure changes, no save schema bump, no new mechanics.
Every existing variant continues to fire its 9 cold-opens; this layer
adds variant-tinted prose to the *gaps between* them.

### Added

* **Variant-aware City Guide and Professor quotes.** When the active
  storyline has a line for the current city, the city's NPC pool draws
  from the variant pool 50–65% of the time. Tables at
  `_VARIANT_CITY_GUIDE` and `_VARIANT_CITY_PROFESSOR` in `battle.html`.
* **Variant-aware city arrival scenes.** `_showCityArrivalScreen` now
  consults `_VARIANT_CITY_ARRIVAL` for a per-variant pair of arrival
  lines, falling through to the base `CITY_ARRIVAL_LINES` when absent.
* **Variant-aware Pokémart greeter.** First mart entry per city per
  variant fires a one-shot variant flavor toast via `showGameAlert`.
  Sparse — classic stays silent; pasta-tier variants get the loudest
  greeters.
* **Variant-aware Gym Leader victory cards.** `showVictoryOverlay`
  appends a third beat under the leader's line + reflection when the
  variant has an entry for that gym index (1–8). Yellow-tinted,
  italic, leader name substituted.
* **Variant-aware Rival quote pool.** `getTrainerQuoteForBattle` draws
  from the per-variant Rival pool 50% of the time when the active
  variant has an entry for the current rival phase (0–4).
* **Variant-aware generic trainer-class pool.** Same function, 35%
  bias toward the per-variant pool for `Youngster`, `Lass`, `Hiker`,
  `Bug Catcher`, `Fisherman` when the variant has an entry.
* **Variant-aware wild-catch intro line.** Plain wild route catches
  (not Safari / boss / tutorial / roaming) get a one-line
  variant-tinted opener prepended to the standard "A wild X appeared!"
  framing.
* **Variant-aware retreat / game-over banner.** Both the standard
  loss and the rival concede paths surface a single italic
  variant-tinted line under the buttons. Silent on classic.
* **Variant-aware Hall of Fame card.** First-clear HoF flow renders
  a per-variant card (banner + 3 lines + tone class) before the grid
  slides in. Once per variant per save (cross-run deduped).
* **Per-variant post-HoF Mystery Figure pre-fight beat (row 67).** A
  new `mystery67` cold-open dispatched through the standard cold-open
  pipeline, with a per-variant scene table at `_MYSTERY67_BY_VARIANT`
  (banner, tone class, nameplate, lines). Fires once per variant per
  save before the climax mask reveal.
* **Per-variant audio motif on cold-open dismiss.** New
  `_VARIANT_SFX_MOTIF` map; `_renderNarrativeOverlay` defaults the
  dismiss SFX to the active variant's motif when no scene-specific
  SFX is set. `classic` / `second_sun` / `dead_raticate` stay silent;
  `bone_keepers` rings a chime, `project_mewtwo` clicks, etc.

### Added — Choice moments (mild player agency)

* **`_renderNarrativeOverlay` now supports `choices: [{label, reply,
  value, persistKey}]`.** When choices are present the Continue button
  is replaced with a vertical stack of choice buttons; picking one
  swaps the dialog body to the reply lines and exposes a single
  Continue. Picks persist to `sm.storyChoices[persistKey]` so future
  prose can optionally reference them.
* **One multi-choice moment per pasta / mature variant** (row 33,
  mid-late beat). `_VARIANT_CHOICE_R33` + new `choice_r33` cold-open
  scene. Variants that had a base `<variant>_npc_r33` cold-open
  re-point their row-33 beat to `choice_r33`; classic and second_sun
  stay with their existing prose-only beat. Each variant's choice is
  a 3-option prompt with 2-line replies. **No outcome change** — the
  choice purely tints the scene and stamps `sm.storyChoices`.

### Added — Save / RNG / NG+ hygiene

* **Seeded variant roll.** `_pickRandomStorylineVariant` now uses the
  active story RNG when called mid-run so shared seeds reproduce the
  rolled variant; falls back to `Math.random` for the pre-run picker
  (no active sm yet).
* **NG+ smart default.** When `'Surprise Me'` rolls, the function
  prefers variants the player hasn't yet cleared on this profile,
  drawing from `meta.clearedVariants`. Falls back to uniform when
  every variant is cleared.
* **Variant clear tracking.** `recordStoryClearInMeta` (fires on
  Hall of Fame entry) now stamps `meta.clearedVariants[sm.storyLine]
  = true`. New field added to `_emptyStoryMeta` schema and the
  `readStoryMeta` whitelist.
* **`sm.storyChoices`** added to the `sm` defaults and to
  `migrateStoryPreV17` so old saves get an empty object on load. No
  `SAVE_VER` bump — defensive init in the v17 migration covers older
  saves (the field is additive).

### Changed

* **Cold-open beat row table in `docs/STORY_NARRATIVE_VARIANTS.md`
  rewritten** to match the shipped variant rows (7 / 20 / 26 / 33 /
  48 / 53 / 56 / 64 / 67 / 68) — the earlier spec drafts referenced
  5 / 24 / 53 / 64 / 68 against a pre-v18 `STORY_EVENTS_RAW` layout
  and had drifted.

### Why this matters

Before this pass: a `static` run and a `classic` run played the same
68-row timeline, fought the same trainers, traded with the same shop,
and only differed at 9 cold-open scenes per variant (totalling ~5
minutes of variant-tinted dialogue across a ~10-hour run). Between
beats the storyline was invisible. After this pass: the variant
texture leaks into city arrivals, City Guide / Professor patter, mart
greeters, every rival fight, every gym victory card, every wild catch,
every retreat. The structure of the run is unchanged — the player still
walks the same path — but the road sounds and looks different the whole
way through.

---

## Unreleased — Mechanics unlock gate closed on every pre-unlock leak 2026-05-21 (`claude/funny-albattani-DNkt0`)

### Fixed — Wild catches, Professor-sized pre-unlock mechanic leaks

The previous unlock gate (`_pbsStoryUsePlayerGimmickGate` +
`sm.unlockedGimmicks`) was wired into Professor gifts, Cable Link
reroll/upgrade/rebuild, and Evolution Lab — but three player-side
acquisition paths called `makeBuild()` raw and silently bypassed it:

* **Route wild encounters** — `makeWildBuild()` rolled gimmicks straight
  from `settings.mechanics`, so a player at Gym 2 could catch a Mega
  Charizard before any mechanic was supposed to exist in the run.
* **Roaming Legendary** spawns triggered by Gym Leader 5 / 7 victories.
* **Boss Arc / Subject Zero** legendary capture in the Cage.

A single `_withStoryPlayerGimmickGate(fn)` helper wraps each of these
sites with the same `try / finally` gate the Professor path already used.
Pre-Gym-5 the unlocked list is `[]` so every wild/roaming/cage catch
stays STANDARD; from Gym 5 onwards the catches can only roll from the
mechanics the player has actually earned. **Cable Link is deliberately
left ungated** — its premium "another trainer's mon" vibe (high reroll
cost, can surface pre-unlock gimmicks) is the only sanctioned shortcut.

### Changed — Enemy trainer mechanics now also follow the global unlock

Enemy trainers used to pull candidate mechanics directly from the
settings toggles (`sm.settings.megaOn` etc.) via `_storyEnemyMechKeys()`,
softly attenuated by `_storyProgressFactor`. The soft ramp meant a Gym 3
or Gym 4 enemy could occasionally surface a Mega even though the player
couldn't equip one yet — and Gym 5's boss (the unlock-reveal fight)
could already use the mechanic it was meant to introduce.

`_storyEnemyMechKeys()` now filters by `sm.unlockedGimmicks`, so the
enemy candidate pool is empty until Gym 5 clears. Result: **GL1–4 and
the GL5 reveal fight are STANDARD-only for both sides; from GL6
onwards each newly-unlocked mechanic enters the enemy pool**, lining
up with the existing `_minGuaranteedMechsForEvent` curve (GL6 = 1
guaranteed ace, GL7 = 2, GL8 = 3, E4/Champion ramp). Mechanics now
appear in the world only after they're globally available — no more
"the leak that taught you Mega existed before the game wanted to".

### Files touched

* `battle.html` — new `_withStoryPlayerGimmickGate` helper next to
  `_mechForGimmickRoll`; `makeWildBuild`, the roaming legendary
  `prepare()`, and `_bossArcRollLegendary` each wrap their `makeBuild`
  call with the helper; `_storyEnemyMechKeys` filters by
  `sm.unlockedGimmicks`. Already-caught Pokémon with pre-unlock
  mechanics are left alone (forward-looking fix only).

## Unreleased — UX polish: autosave toast, Master Ball glow, move-key hints 2026-05-20 (`claude/pokemon-mature-storyline-Xk3ut`)

### Added — Three small "feel" wins on top of the deepening pass

A focused, low-risk UX polish round shipped after the narrative
deepening. Each item solves a single piece of player friction
identified in the story-mode UX audit. Larger items from the audit
(catch-miss animation, damage preview, story journal screen, city
action reorder, Crucible first-entry cinematic, tutorial batching,
per-variant BGM) are deferred to a follow-up PR — they need live
browser testing to land cleanly and the variant work in this branch
is shippable on its own.

* **Autosave "💾 Saved" toast** — every `save()` call in the story
  IIFE now flashes a bottom-center confirmation toast, throttled to
  one per 3 seconds. Closing the tab mid-route used to be silent —
  the player had no idea their last action had persisted. Now
  there's a small visible signal. The throttle is on the toast only;
  the underlying localStorage write is unchanged. CSS animation
  (`@keyframes storySaveToastIn`) reuses the existing story tone
  palette.
* **Master Ball visual identity** — the catch screen's Master Ball
  button now carries a purple glow pulse (`@keyframes
  storyCatchMasterPulse`) and a ✨ marker beside the name. The other
  three balls (Poké, Great, Ultra) render unchanged. A guaranteed-
  catch throw reads distinct *before* the player clicks, not after
  the outcome resolves.
* **Move button keyboard shortcut hints** — every battle move tile
  now shows a small `1` / `2` / `3` / `4` chip in the top-right
  corner so new players discover the keyboard shortcuts that have
  always worked. The chip uses a monospace font, dim color, doesn't
  compete with the move name, and is hidden on coarse-pointer (touch-
  only) devices where the hint is irrelevant. The aria-label gains
  "keyboard shortcut N" for screen readers.

### Deferred to a follow-up pass

The story-mode UX audit identified five other improvement vectors.
All are skipped on this branch because they need live browser
verification and touch larger surfaces:

* **Catch screen miss / flee animations** — sprite shake on miss,
  slide-out on flee. Needs visual tuning in the browser.
* **Damage preview on FIGHT** — estimated HP range per move vs. the
  current foe. Touches the battle pipeline's `calculateDamage` hot
  path; risk of side-effects without careful preview-flag plumbing.
* **City action reordering by urgency + "NEW" badges on facility
  unlocks** — needs in-game playthrough to verify ordering is right
  for every city / progression state.
* **Per-run story journal screen** — new tab in the Collection
  screen. New HTML, new render path. Larger scope; non-trivial diff
  on its own.
* **Crucible first-entry cinematic** — single cold-open scene; easy
  to add but needs the Crucible flow tested live to confirm the
  trigger fires correctly.
* **Per-variant BGM via existing music tracks** — audio mixing
  needs verification across the 8 variants.
* **Tutorial-queue batching** — changes the dispatch behavior of
  every `_storyShowOneTimeTip` and `playStoryTutorial` call. Higher-
  risk refactor; deserves its own commit + verification round.

### Implementation notes

| Touchpoint | What changed | LOC |
|---|---|---|
| `save()` (~28663) | Calls `_maybeShowSaveToast()` after localStorage write | ~2 |
| `_maybeShowSaveToast` + state (new) | Throttled toast renderer | ~48 |
| `@keyframes storySaveToastIn` (CSS ~1643) | Toast slide-in animation | ~5 |
| Catch ball-button render (~37515) | `data-ball-type` + `.story-catch-ball--master` class + ✨ marker | ~12 |
| `.story-catch-ball--master` + `@keyframes storyCatchMasterPulse` (CSS) | Master Ball purple glow pulse | ~14 |
| Battle move tile render (~15752) | Adds `<span class="move-tile-shortcut">N</span>` in head, updates aria-label | ~7 |
| `.battle-btn-move .move-tile-shortcut` + touch media query (CSS) | Shortcut chip styling | ~25 |

Touched: `battle.html` only. Zero new asset files. No save-schema
bump. No new dependencies.

## Unreleased — Storyline depth pass: recurring NPCs, plot twists, per-variant Champion + Mystery outros 2026-05-20 (`claude/pokemon-mature-storyline-Xk3ut`)

### Changed — Each of the 8 storyline variants now carries 15+ beats with a recurring character and a Gym-8 plot twist

The 8-variant narrative system from the prior commit was thin — each
storyline had 5 cold-open beats totalling ~15 lines of dialogue.
Players who picked a variant felt the tone for the first 30 minutes,
then the variant faded into background flavor. This pass deepens every
variant so it carries the whole run.

* **Recurring NPC per variant** — each storyline now has a single
  character who appears in 3 mid-route scenes (rows 20, 33, 48 of
  `STORY_EVENTS_RAW`). The NPC grows across appearances; the player
  recognizes them by the third scene. Classic stays Prof. Oak; the
  rival deepens for `second_sun`, `dead_raticate`, and `hypnos_lullaby`;
  bone_keepers gets a Tower Attendant; project_mewtwo gets Colress;
  the pasta variants get a "figure who watches you" / "your inverted
  trainer sprite" that closes the gap to the player across the run.
* **Plot twist per variant at row 53** — every storyline gets a single
  recontextualizing moment between Gym 7 and Gym 8 that reframes the
  whole journey. Project Subject Zero's starter paperwork; Bone
  Keepers' ridge-Marowak as your starter's parent; Dead Raticate's
  empty slot being for *you*; Lavender Frequency's third Champion
  plaque; Static's "you have been playing inverted for three rows."
  Each is a single cold-open scene; metaKey-deduped; ~5 lines.
* **Per-variant Rival rebattle dialogue at rows 12, 39, 65** — the
  three Rival rebattles after the intro duel are now voiced
  per-storyline. 24 entries × ~3-5 lines = ~120 new lines. Variant
  lines are weighted ~2× in the merged pool so the variant's voice
  wins on the picker, but doesn't lock out the per-character pool.
  `classic` falls through to the existing merged pool unchanged.
* **Per-variant Champion intro + outro at row 64** — extends the
  Champion fight's randomized intro pool with 3 variant lines, and
  overrides the post-victory outro with a single variant-specific
  finale line. The classic name pool stays intact when there's no
  variant override.
* **Per-variant Mystery Figure outro** — `MYSTERY_FIGURE_IDENTITIES`
  outros were single lines per identity, the same regardless of
  storyline. Each variant now overlays its own outro for the
  identities that fit its tone (e.g. Project Subject Zero reframes
  Cyrus's mask-drop around the lab director's handoff; Lavender
  Frequency overlays `buried_alive`'s lines through the radio
  song; Static overlays `cartridge_self` through the save-file log).
  Falls through to the identity's default outro otherwise.
* **Per-variant Subject Zero capture epilogue** — the Caged God boss
  capture used to print one generic "Subject Zero is yours" message.
  Each variant now closes the boss arc in its own voice: rival hands
  you the cage at the door (`dead_raticate`); rival's sister awake
  (`hypnos_lullaby`); Colress folding his lab coat (`project_mewtwo`);
  the save file logging RESOLVED with loop count: 1 (`static`).
* **Per-variant post-Hall-of-Fame epilogue** — first post-HoF city
  re-entry now fires a one-shot cinematic scene closing the variant's
  arc — the recurring NPC's last word, the rival's last visit, the
  radio falling silent. Chains in front of the existing post-HoF
  orientation tip; metaKey-deduped per (variant × save). The
  recurring NPC across the run ends here.

### Coverage per variant now

Each of the 8 variants currently carries:

* 1 intro cold-open (row 68) — already shipped on prior commit
* 4 gym-milestone cold-opens (rows 7, 26, 56, 64) — already shipped
* **3 new mid-route NPC scenes (rows 20, 33, 48)** — this pass
* **1 new plot-twist scene (row 53)** — this pass
* **3 new Rival rebattle dialogue overrides (rows 12, 39, 65)** — this pass
* **1 new Champion intro pool + outro** — this pass
* **1 new Mystery Figure outro override** — this pass
* **1 new Subject Zero boss-arc epilogue** — this pass
* **1 new post-Hall-of-Fame epilogue** — this pass
* Plus passive flavor (per-variant roaming legendary sighting,
  first-sighting Pokédex lore on mature+ tiers) — already shipped

Total: **~16 distinct narrative moments per variant** across a single
run. A player who clears the game on all 8 variants reads roughly
~120 unique scenes' worth of dialogue.

### Implementation notes

| Touchpoint | What changed | LOC |
|---|---|---|
| `_RIVAL_DIALOGUE_BY_VARIANT` (new, ~27050) | 8 variants × 3 rebattle rows × ~5 lines | ~90 |
| `mergeRivalQuotePools` (~27062) | Variant lines weighted 2× into the pool | ~5 |
| `_CHAMPION_DIALOGUE_BY_VARIANT` (new, ~26515) | Per-variant intros + outro | ~80 |
| `getTrainerQuoteForBattle` (~27170) | Champion intro override on row 64 | ~10 |
| Champion outro resolver (~35012) | Variant outro wins on row 64 | ~5 |
| `_MYSTERY_OUTRO_BY_VARIANT` (new) + `_variantMysteryOutro` | Per-variant identity outros | ~50 |
| Mystery Figure render path (~35165) | Variant outro override hook | ~5 |
| `_SUBJECT_ZERO_EPILOGUE_BY_VARIANT` (new) + `_variantSubjectZeroEpilogue` | Per-variant boss-arc capture epilogue | ~25 |
| Subject Zero capture message (~37081) | Reads variant epilogue | ~2 |
| `STORY_COLD_OPENS` (~31610) | 24 new NPC scenes + 8 new plot-twist scenes | ~280 |
| `STORYLINE_VARIANTS.*.beatOverrides` (~31470) | Add rows 20, 33, 48, 53 to each | ~32 |
| `_POSTHOF_EPILOGUE_BY_VARIANT` (new) + `_showVariantPostHofEpilogue` | Per-variant Hall-of-Fame epilogue | ~110 |
| `continuePostGame` (~39651) | Chains epilogue → orientation tip → enterCity | ~15 |

Touched: `battle.html` (12 sections, all additive). Zero new asset
files. No save-schema bump (`sm.storyLine` already at v17).
Existing saves migrate cleanly — variant lines fall through to the
classic pool when not overridden, and the new metaKeys are unique so
already-stamped tips never collide.

## Unreleased — Eight-storyline narrative system + roaming legendary cinematic 2026-05-20 (`claude/pokemon-mature-storyline-Xk3ut`)

### Added — Pick your storyline at New Adventure, four tones from Classic to Creepypasta

The story-mode timeline (`STORY_EVENTS_RAW`) used to play exactly the
same way every run, with one cold-open scene (the intro rival) and a
single-line "📡 Sightings report" toast as the only ceremony around a
roaming legendary. Eight badges, an Elite Four, a Champion, and the
post-game Caged God all read the same regardless of who the player
was. The narrative bus (`STORYLINE_VARIANTS`, added in v17) was wired
for variants — it just only had one entry.

This pass populates the bus with **eight storylines** across four
tonal tiers, plus a randomized "Surprise Me" sentinel. Every variant
re-skins the same iron 68-row spine — no new events, no new
mechanics, no save schema change — by re-routing the existing beat
overrides, broker dialogue, and Mystery Figure identity:

* `classic` — **The Champion's Road**. The standard journey,
  preserved verbatim for existing saves.
* `second_sun` — **The Second Sun**. You and the rival picked up
  starters the same morning. They picked first. The whole road is
  catching up.
* `bone_keepers` — **Bone Keepers**. *Mature canon.* Lavender's
  tower casts shadows north and south of the eight-gym route. The
  Marowak murder is canon; this is the journey that walks past it.
* `project_mewtwo` — **Project Subject Zero**. *Mature canon.* The
  Cinnabar lab never officially closed. Your starter has a serial
  number on its paw. The Caged God arc is the spine, not subtext.
* `hypnos_lullaby` — **Hypno's Lullaby**. *Soft creepypasta.* The
  radio in every gym town reads the same missing-children names.
  So does the broker. Pendulum sightings escalate by gym.
* `dead_raticate` — **The Empty Slot**. *Soft creepypasta.* Your
  rival has six Pokémon. After Lavender Town, they have five. They
  never bring it up. Neither does the game.
* `lavender_frequency` — **Lavender Frequency**. *Full creepypasta.*
  Visual: hue shift + scanlines on every overlay. The Pokémart
  radio plays the Lavender theme. The Champion's plaque has your
  name on it, weathered. The Mystery Figure is `BURIED ALIVE`.
* `static` — **STATIC**. *Full creepypasta.* Visual: text shake +
  corrupted glyphs on overlays. Save File B, loop count unknown.
  Your starter says one line in a font the game shouldn't have.
  The Mystery Figure is your trainer sprite in inverted colors.
* `surprise_me` — sentinel. Rolls one of the eight at run start.
  The variant-specific intro cold-open is the reveal.

### Added — Cinematic roaming-legendary "sighting" before the catch screen

After Gym 5 / Gym 7 victories, a sub-legendary is queued for the
next route. Today the player saw a one-line toast and walked
straight onto the catch screen. The new flow inserts a
**sighting cinematic** in front:

* Dark fade-in, type-themed background (the legendary's primary
  type drives the BG pick from the existing `menu_bg_*.png`
  library).
* Pulsing legendary sprite with gold drop-shadow.
* Per-species **canonical lore line** — drawn from real Pokédex
  flavor, not invented horror. ~50 entries cover the entire
  `SUB_LEGENDARY_POOL`: Suicune purifying poisoned water, Mewtwo's
  Specimen 0002 lab note ("there was a 0001"), Spiritomb's 108
  grudges, Mimikyu wanting to be loved like the friend on the
  box, etc.
* Per-variant **narrator block** above the species line — same
  two-line stanza, but rewritten 8 different ways for each
  storyline's voice.
* `sparkle.wav` + `danger.wav` mix on appearance, `shine.wav` on
  dismiss. All from the existing `music/ui_sfx` library.
* "Approach the legend →" button drops into the existing catch
  screen unchanged. Catch mechanics, flee chance, ball rules — all
  untouched.

This is the user-facing improvement that started the pass: making
the legendary appearance feel like a *moment*, not a toast.

### Added — First-sighting Pokédex lore overlay on mature+ storylines

On the four mature/soft/full storylines, the first time the player
encounters certain species on a save, a one-shot overlay fires
between the encounter slide-in and the first ball throw. Each entry
is a two-line in-world quote drawn from canonical Pokédex flavor.
~24 species are covered, with restraint over horror:

> **Cubone.** "It wears the skull of its mother. The crying never quite stops."
> **Yamask.** "It carries a mask that was once its face. It looks at it sometimes, and weeps."
> **Drifloon.** "Children's stories warn against grabbing its string. Some children don't come back."
> **Hypno.** "Lavender Town keeps a missing-persons board. Three of them last saw a pendulum."
> **Mewtwo.** "The lab notes call it Specimen 0002. There was a 0001."
> **Porygon.** "Code can be killed. They wrote it that way on purpose."

The classic tier never sees these overlays — the line gates on the
variant's `tier` ∈ `mature` / `soft_pasta` / `pasta`. Dedupe uses
the existing `tipsShown[firstsighting-<species>]` bucket so a
playthrough on `bone_keepers` doesn't replay the same lines on a
later `static` run.

### Added — Caged God broker scenes promoted from `window.alert()` to cinematic overlay

The three Caged-God leads (Ledger at City 2, Recording at City 5,
Key at City 8) used to fire as plain browser `alert()` boxes. They
now use the same narrative overlay as the cold-opens, with a
**per-variant broker voice** for the six variants where it makes
sense to override:

* `bone_keepers` — tower attendant lineage, kind but tired.
* `project_mewtwo` — locked door, redacted ledger, magnetic key
  with a barcode.
* `hypnos_lullaby` — missing-persons binder, child's voice memo,
  pendulum on a chain.
* `dead_raticate` — stuffed Raticate on the broker's shelf, "kid
  who couldn't keep going" returns list.
* `lavender_frequency` — the broker is in the room but you can't
  look at them directly.
* `static` — the iron box has *your* trainer name engraved on the
  lid.

`classic` and `second_sun` use the existing prose verbatim.

### Added — Two Mystery Figure identities + per-variant identity bias

`MYSTERY_FIGURE_IDENTITIES` adds two storyline-exclusive entries:

* `buried_alive` — the Lavender Frequency mask-drop. Sprite reuses
  the existing Hiker; the variant's tone class on the cold-open
  carries the visual distortion.
* `cartridge_self` — the STATIC mask-drop. Sprite reuses Red; the
  variant's tone class flips the rendering effect.

`_storyPickMysteryIdentity` now reads `variant.mysteryBias` —
`{ identityKey: weight }`. The full Pasta variants 100%-bias to
their exclusive identity; mature variants nudge toward
canonical-feeling matches (e.g. Bone Keepers → cyrus / ghetsis /
red); classic and second_sun stay uniform.

### Added — Storyline picker card in New Adventure → step 3

The trainer-create screen grows a new "3 — Storyline" section
between Difficulty and Pokémon generations. Card grid mirrors the
existing `.story-create-diff-card` style, with a color-coded tier
bar (gold for classic, gray for mature, purple for soft pasta, red
for full pasta, blue for random) and a one-line tagline per
variant. Cards on the pasta tiers carry an inline warning.

The user's pick persists in `pbs_story_run_menu_defaults.storyLine`
so the next New Adventure remembers the last storyline used.

### Implementation notes

| Touchpoint | What changed | LOC |
|---|---|---|
| CSS (`battle.html` near line 1523) | Eight `.story-tone-*` classes + sighting-overlay layout + storyline picker grid | ~120 |
| `STORYLINE_VARIANTS` (~31470) | 1 entry → 9 entries, each with `beatOverrides` / `mysteryBias` / `toneClass` | ~150 |
| `STORY_COLD_OPENS` (~30810) | 1 entry → 33 entries (1 intro + 32 per-variant beat scenes) | ~330 |
| `_renderNarrativeOverlay` (~33420) | New shared overlay helper | ~80 |
| `_STORY_INTRO_SCENES` (~33575) | Per-variant intro-rival rewrites | ~85 |
| `_LEGENDARY_LORE` (~33470) | ~50-entry canonical lore table | ~60 |
| `_LEGENDARY_SIGHTING_FRAMES` (~33530) | Per-variant narrator framing | ~30 |
| `_showRoamingLegendarySighting` (~33540) | Cinematic overlay function | ~70 |
| `_FIRST_SIGHTING_LORE` (~33495) | ~24-species canonical Pokédex flavor | ~50 |
| `_showFirstSightingLoreOverlay` + gate (~33575) | First-sighting overlay + tier gate | ~70 |
| `_runFirstStoryInterrupt` (~31830) | `preRender` hook so roaming sighting fires before catch screen | ~15 |
| `MYSTERY_FIGURE_IDENTITIES` (~26555) | `buried_alive` + `cartridge_self` entries + biased picker | ~45 |
| `_BOSS_LEAD_FLAVOR_BY_VARIANT` (~35590) | Per-variant broker voice override table | ~60 |
| `bossCollectLead` (~35680) | `window.alert()` → `_renderNarrativeOverlay()` | ~25 |
| `enterCatchEncounter` (~36195) | First-sighting overlay hook | ~10 |
| `_tcState` + handlers (~30075) | `storyline` field + `trainerCreateSetStoryline` + grid renderer | ~75 |
| HTML — trainer-create screen (~6925) | New "3 — Storyline" section + picker grid | ~10 |
| `_readStorylineFromUI` + `_pickRandomStorylineVariant` (~30855) | Surprise-me roll + picker fallback | ~30 |
| `persistStoryMenuDefaultsFromRun` (~28358) | Persist `storyLine` to menu defaults | ~2 |
| `docs/STORY_NARRATIVE_VARIANTS.md` | Full design spec (new file) | ~360 |

Existing saves: `sm.storyLine` already migrates to `'classic'` from
the v16→v17 pass. No new save schema. The 14 existing tutorial scenes
keep their copy. The 7 existing Mystery Figure identities are
untouched; the two new ones are additions.

**Touched:** `battle.html` (CSS + 13 JS sections, all additive except
the `bossCollectLead` and `_runFirstStoryInterrupt` edits which
preserve their existing fall-through behaviour), `CHANGELOG.md`,
`docs/STORY_NARRATIVE_VARIANTS.md` (new design doc).

## Unreleased — trainer NPC mobile UX + richer recommendations 2026-05-18 (`claude/improve-move-tutor-mobile-HevcJ`)

### Changed — Tutor / Dojo / Nature / EV Trainer dropdowns round-trip on tap

Tapping the highlighted mon card now collapses it (previously the tap was a
no-op, so the only way to "close" a card was to open another one). The EV
Trainer also gains the same accordion: one mon at a time, tap to toggle,
header sticky to the top of the screen as you scroll the preset grid.

### Changed — Recommendations are categorized by purpose, not just "top one"

The single "★ Recommended" strip was the most common feedback target — players
asked for more than one pick because a single move (or item, ability, nature,
preset) doesn't cover the actual build decision. Each facility now shows three
to four picks, each labelled with its purpose:

- **Move Tutor** — STAB · Coverage · Setup · Status · Recovery · Priority ·
  Speed · Hazards · Pivot · Screens. The engine looks at the mon's type, base
  stats, and existing slots, then surfaces the best move from each purpose.
- **Battle Dojo (items)** — Offensive · Defensive · Speed/Insurance · Power.
  The "Defensive" pick prefers Heavy-Duty Boots when the mon is hazard-prone.
- **Battle Dojo (abilities)** — Offensive · Defensive · Utility · Niche, with
  the Hidden Ability tag on rows that match.
- **Nature Rater** — Power · Speed · Bulk · Trick Room, with the +stat / -stat
  spread inline.
- **EV Trainer** — Offensive · Defensive · Meta · Speed/Balanced. Tap a
  recommendation to scroll to that preset card; the destination card flashes
  briefly so it's clear which preset you landed on.

Each recommendation row is tappable: tapping pre-selects the pick in the
confirm bar so the player can preview the trade before paying.

### Changed — Mobile UX pass across all training facilities

Phone players were doing too much scrolling. The pass tightens every trainer
screen:

- **Filter drawer** — type and category chips (which can spill to 3+ rows on
  phones) are now hidden behind a "Filters" button with an active-count badge.
  Always-open on desktop. A "✕ Clear" button appears next to the toggle when
  any search or filter is set.
- **Toolbar sticks below the mon header**, so search / sort / filter buttons
  stay reachable as the player scrolls the option grid.
- **Recommendations panel sits above the toolbar** so the top three or four
  picks are the first thing on screen — most builds resolve here without ever
  touching the long list.
- **Tighter spacing** — slot cards, recs panel, confirm bar, and tab buttons
  all use the Material 44-48px touch-target spec with reduced padding so more
  options fit per viewport.
- **Horizontally-scrollable chip rows** on phones (instead of vertical wrap),
  preserving discoverability without spending vertical space.
- **Nature cells** bumped to a 44px minimum tap target.

### Changed — EV Trainer adds three universal spreads, drops duplicates

The Roles section grew from six presets to nine so every species can pick a
Mixed Sweeper, Mixed Wall, or Fast Utility spread without waiting on a
species-specific Meta spread. Renamed "Physical Tank" → "Physical Wall" for
consistency with "Special Wall", and "Bulky Attacker" → "Bulky / TR Attk"
(same spread; the 0 Spe doubles as a Trick Room set, now called out
explicitly).

Duplicate spreads across Universal / Role / Meta are now filtered at build
time: a meta spread with EVs identical to "Physical Sweeper" no longer
appears twice in the list. The recommender also picks the *best* preset
within each purpose (scored against the mon's base stats), not just the
first matching label.

### Added — "Close all" affordance on the mon-switcher pill bar

A sticky red "▾ CLOSE" chip lives at the left edge of the pill bar
whenever one mon is expanded — one tap collapses the whole accordion
back to the compact picker so the player can scan the full team. The
active gold pill also toggles closed when re-tapped. While everything
is collapsed the chip swaps in for a "Tap a Pokémon →" hint so the bar
still communicates its purpose.

## Unreleased — IVs become a real progression layer, Pokémon Fan Club opens 2026-05-20 (`claude/add-stats-guide-R3MMO`)

### Changed — Player Pokémon roll random IVs at catch time

Every Pokémon you acquire — starter, professor gift, wild catch, even the
Crucible mystery offers — now rolls a fresh **0-31 IV spread** for each of
its six stats instead of silently defaulting to a perfect 31/31/31/31/31/31.
A starter with 7 Attack is real now, and so is a Lapras you fished out of
the Safari Zone with 30 Speed.

Enemy trainers scale their IVs to their training tier:

* **T1 Untrained** (route fillers, early gym trainers): 0-15 per stat.
* **T2 Novice** (mid-game trainers, early gym leaders): 10-22.
* **T3 Competent** (late-game leaders, Elite Trainers): 18-28.
* **T4 Tournament** (Champion, Elite Four, Rival post-G8, Mystery Figure,
  Frontier Round 4+): 26-31.

Signature aces (every leader's identity mon) take the **top quartile** of
their tier's range — so Misty's Starmie still feels like Misty's Starmie
within its tier. Subject Zero (boss-arc capture) is the lone exception
and lands at a fixed perfect 31s.

### Changed — Vitamins are now IV training, not a flat +10 stat layer

`HP Up`, `Protein`, `Iron`, `Calcium`, `Zinc`, `Carbos` no longer stamp
a separate `+1 stat` permBoost layer on top of the EV-derived stat. Each
application now lifts the matching **IV by +3** directly, capped at the
natural 31. The drop economy is unchanged — vitamins remain rare gym /
milestone rewards — but they now have a clear purpose: rescue a
weak-rolled stat back toward the cap.

### Added — Pokémon Fan Club facility (every city)

A new 💖 Pokémon Fan Club facility opens in **every city**, positioned
between the Pokémart and the training row in the action grid. The
Chairman runs a roster-level IV viewer: each of your six party mons gets
a card showing all six stat IVs with a coloured progress bar (red <10,
amber 10-20, green 21-30, gold 31). A `+3` button beside each stat
applies a vitamin from your bag right there — no need to dig into the
bag menu.

* **First visit gift**: the Chairman hands you 1 of each vitamin
  (HP Up / Protein / Iron / Calcium / Zinc / Carbos) so brand-new runs
  have ammo to use immediately.
* **Tutorial cameo**: a short three-line scene explains IVs and vitamins
  the first time you enter, then never fires again.
* The bag's vitamin Use buttons still work and route through the same
  picker, which now shows IV X/31 + a preview of the post-apply value.

### Added — Save migration v18 → v19 (grandfather + refund)

Existing saves preserve their stats. The migration:

1. **Grandfathers** every team/PC mon to the perfect 31/31/31/31/31/31
   IV spread so no loaded mon loses stats it had before the patch.
2. **Refunds** every leftover `permBoosts` point as one vitamin of the
   matching stat (e.g. a mon with +4 HP / +7 Atk pre-patch gets back
   4 HP Up + 7 Protein in your bag). Old `permBoosts` fields are then
   removed.
3. Caught explicitly **after** loading, all new wild / gift / starter
   acquisitions go through the new random IV roll.

Net effect: a loaded save has the same combat power it had pre-patch
plus a generous fresh budget of vitamins to spend on freshly-caught
wilds.

## Unreleased — Cable Link Station repriced as a flat premium over manual training 2026-05-20 (`claude/cable-link-pokemon-pricing-bb96A`)

### Changed — Cable Link Station: Reroll / Upgrade / Rebuild prices bumped, intra-city ×1.5 ramp removed

The Cable Link Station still ships fully battle-ready Pokémon — Reroll
and Rebuild at Competent (T3), Upgrade at Tournament (T4) — but the old
prices badly undercut the manual Tutor + Dojo + EV-Trainer path. A
Same-Tier Swap on a Grade 4 mon was **400G**, less than a single Move
Tutor visit (1,500G), yet it returned a full T3 build (moves, item,
ability, nature, EVs). An Upgrade G4 → G3 at **3,500G** replaced
roughly **17,000G** worth of training-NPC visits, and on top of that the
**×1.5ⁿ intra-city ramp** punished any second use of the Link in the
same city — a mechanic that made sense when first uses were near-free
but turned vicious once base prices climbed. The "Spend it on a keeper"
framing from the first-time tip wasn't holding up either: Cable Link
was the keeper, the tutoring ladder was the trap.

Repriced so the Link is the premium one-click route — flat per-action,
with the gold floor as the only spam-deterrent:

* `REROLL_COSTS` — was `{ 1:4000, 2:2000, 3:900, 4:400 }`, now
  `{ 1:14000, 2:12000, 3:9000, 4:6000 }`. G1 species rolls cost the most
  because the pool is rarer; G4 at 6,000G is reachable after a handful
  of early-route wins.
* `UPGRADE_COSTS` — was `{ 4:3500, 3:9000, 2:22000 }`, now
  `{ 4:9000, 3:13000, 2:22000 }`. G2 → G1 (the late-game luxury anchor)
  is untouched at 22,000G. The lower ramps climb more gently than the
  old curve — you're paying for the grade lift + T4 build + random
  species roll, so the tax stays proportional to what's at risk if the
  rolled species doesn't fit your team's typing.
* `REBUILD_COST` — was `1,200G`, now `5,000G`. Still the cheapest Cable
  Link option (no grade lift, same species, no typing-clash risk).
* **Removed the per-city ×1.5ⁿ price ramp** from all three Link actions.
  The first use, second use, and tenth use within a city now all cost
  the same flat amount. The `cityRerollsUsed` counters still increment
  to drive the Casual first-use discount, but no longer feed the price
  formula. (Evolution Tutor's ramp is unchanged — that's a separate NPC
  with its own pricing model.)

What didn't change:

* **Build tier output is the same.** Reroll and Rebuild still return T3
  (capped EVs, polish at Tutor / Dojo / EV Trainer for full T4). Upgrade
  still returns T4 with full EVs, top-pool ability, and top-pool item.
  No quality nerf — only the price.
* **Per-city counter reset stays.** Each new city starts fresh for the
  Casual first-use discount.
* **Casual difficulty discount stays** — first Reroll in a city is
  still 22% off on Casual.
* **Stone Sage / Move Tutor / Battle Dojo / EV Trainer prices are
  unchanged.** Only the Link is repriced; the manual path is now the
  cheaper one if the player has the patience to walk it.

Header text on the Cable Link screen and the first-time tip were
rewritten to call out the new pricing logic — flat prices, random
species means random typing, and the Link's job is "one click instead
of five visits, at a markup", not "the cheap shortcut".

## Unreleased — Battle-form pacing rebalanced + Wishing Piece introduces Colress 2026-05-20 (`claude/balance-encounter-pacing-T4FyA`)

### Changed — Enemy gimmick distribution: guaranteed mech-aces + smoother progress curve

The per-mon mechanic chance (`_perMonMechChance`) used to multiply a flat
trainer-tier weight by a `_storyProgressFactor` that was **0% at badges
0–3 and then jumped to 40% at badge 4**. Combined with the independent
per-mon roll, the same Gym Leader 6 fight could roll 0, 1, 2, or 3
gimmick mons across consecutive attempts — gimmicks felt like static
RNG, not story progression.

The fix is two parts:

* `_storyProgressFactor` is now a smooth ramp:
  `0/0/0, 0.15, 0.35, 0.55, 0.75, 0.90, 1.00` across badges 0–8.
  No more cliff at badge 4; the first feathering of gimmicks now starts
  on the Gym Leader 4 fight (badge 3) at ~3–4% per non-ace mon, then
  climbs.
* New `_minGuaranteedMechsForEvent(eventType)` returns a floor of
  guaranteed gimmick mons that bypass the random roll entirely:
  GL6 = 1 (the ace), GL7 = 2, GL8 = 3, E1/E2 = 2, E3/E4 = 3, Victory
  Road = 3, post-G8 League Rival = 3, Champion = 4, post-HoF Mystery
  Figure = 6 (full team). `_applyEnemyGimmickDistribution` walks the
  team in slot order (slot 0 = signature ace by composition) and forces
  the highest-priority eligible mechanic onto each of those mons before
  the random roll fires for the remaining slots.

Net effect: a Gym 6 fight is no longer "roll the dice and hope" — the
leader's ace **always** comes out swinging with a Mega / Z / Dynamax /
Tera, and the rest of the team rolls on a smoothed curve that ramps
predictably toward the Champion.

### Added — Wishing Piece voucher + Gym Leader 5 intro beat

Gym Leader 5 victory now drops one **Wishing Piece** (canonical SwSh
item, slotted into the existing voucher framework alongside Rare Candy,
Vitamin Pack, Heart Scale, Mint, Ability Capsule, Emblem of Honor). The
gym leader's victory message has been extended with a flavor line
pointing the player to Colress in the next city.

City 6 is the first city to host Colress, so the voucher is immediately
redeemable on arrival. The Colress screen renders a purple "🌠 Wishing
Piece ×N" banner at the top whenever the voucher is in inventory, and
every Mega / Dynamax / Z-Move button shows a `🌠 Use Wishing Piece`
sibling button that consumes one voucher instead of charging 7,500G.
For Tera, where each type would otherwise need its own paired button,
the buttons stay single but **shift-click** spends a voucher.

The `firstColress` tutorial scene now reads `sm.inventory.wishingPiece`
dynamically — when the player walks in carrying a Wishing Piece, an
extra line of Colress dialogue is inserted that calls out the voucher
explicitly. The base tutorial copy has also been expanded from 3 lines
to 4 to introduce the "first door opens at Gym 5" rule.

### Changed — Player gimmick unlock now aligns with Colress availability

Previously, gimmicks unlocked one-per-badge starting at Gym 1, but the
player had no way to **equip** any of them until Colress at City 6
(after Gym 5). The result was a 4-badge stretch of "unlocked but
useless" status. The unlock now gates on `badges >= 5`:

| Badge | Unlocked mechanics |
|---|---|
| 0–4 | none |
| 5 | mega |
| 6 | mega + dmax |
| 7 | mega + dmax + tera |
| 8 | mega + dmax + tera + z |

The fixed order (mega → dmax → tera → z, filtered by which mechanics
the player enabled in run setup) is unchanged; only the start point and
gating logic moved. Cable Link rebuilds, Professor gifts, and the
`?testmega=1` debug seed pick this up automatically. The testmega seed
now also explicitly stamps `unlockedGimmicks` to match `badges = 6` and
seeds 2 Wishing Pieces for voucher-path verification.

### Files touched

* `battle.html` — `_storyProgressFactor` rewrite, `_minGuaranteedMechsForEvent`
  + ace-pass in `_applyEnemyGimmickDistribution`, player unlock rewrite,
  `VOUCHER_KEYS` + `wishingPiece` entry, `GYM_VICTORY_REWARDS['Gym Leader 5']`
  msg, city-bag voucher row, `firstColress` tutorial with `getLines`
  callback, `_showStoryTutorialScene` `getLines` support, Colress
  voucher banner + `_colressPay` + `_colressConfirmPay` helpers, all
  five `colressApply*` functions take a `useVoucher` arg, testmega seed
  wires up the voucher loadout.

## Unreleased — Poké Casino overhaul: coins currency + Coin Flip / Slots / Roulette 2026-05-20 (`claude/pokemon-casino-overhaul-0ssdb`)

### Changed — Casino is now a real Game Corner

The casino used to be a single screen with three abstract one-shot bets
(Coin / Color / Jackpot) that all shared a `Math.random()*10` roll, no
animation past a small ASCII reel, and no progression beyond `sm.gold`
debited or credited per click. The Game Corner Manager is now actually
running a building.

**Coin wallet.** Gold no longer plays at the tables. A Cashier panel
collapses out of the header — buy in at **100🪙 = 1,000G**, cash out at
**100🪙 = 800G**. The 20% spread is the only house edge in the building;
every individual table plays close to fair. Min buy 10G, min cash-out
100🪙. `sm.casinoCoins` persists across sessions and migrates onto old
saves as 0.

**Three tabs, three games.**

- **🪙 Coin Flip.** Big 3D coin tumbles 1.1s and lands on Heads or Tails.
  Pick a side, bet 1+ coins, win pays 2×. ~49% win rate, low volatility,
  streak counter for flavor. The coin preview shows your current pick
  even before you spin.
- **🎰 Slots.** Three reels with Pokémon symbols (7 · ★ · ⚡ Pika · ◓
  Great · ● Poké · 🍒 Cherry · ↻ Replay). Bet 1, 2, or 3 coins to light
  one to three paylines. Reels slide with eased deceleration and a
  cubic-bezier bounce on each stop. **777** pays 300×, **★★★** pays 100×,
  Pikachu line pays 50×, and **↻↻↻** awards a free re-spin where you can
  hold any reel for the follow-up.
- **🎯 Roulette.** Twelve-cell board (4 colors × 3 Pokémon icons) plus a
  cumulative-rotation wheel that doesn't snap back between spins. Place
  any number of chips on any cells, or Repeat your last spread.
  Cell-direct hit pays **11×**. A pointer marks the winning slot; the
  cell flashes gold when it pays.

**First-visit walk-through.** The Game Corner Manager (Gambler sprite)
now opens with four beats on first entry — intro → cashier → tab guide
→ closer — replacing the old single 3-line cameo. Subsequent visits
skip the tutorial via the existing `tutorial-first-casino` meta key.
The cashier panel auto-opens on entry only while the player has zero
coins, so the buy-in flow is one tap away the first time.

**UI / polish.**

- New Game Boy Game Corner palette: cream/mauve panels over dark felt
  green, pixel borders matching the existing shop / tutor language.
- Twin gold + coin balance pills in the header pulse on every gain or
  spend.
- All buttons keep the ≥44 px touch target on mobile; cashier inputs
  and bet chips inherit the existing phone-tuned sizes.
- Reduced-motion mode collapses 1-2 second spins to ~300 ms fades.
- Five-and-a-half new SFX cues per table reuse the shipped wav library
  (`gachaDial`, `pbBounce1/2`, `pbLock`, `achv`, `sparkle`, `danger`).

**Internals.**

- New `window.StoryFx.coinFlip()`, `.slotsSpin()`, `.slotsFlashWin()`,
  `.rouletteSpin()` animation helpers, plus `casinoSpin` retained as a
  back-compat shim.
- Single `_casinoTryBet()` / `_casinoRefreshBetCaps()` chokepoint for
  every wager; per-tab spin-in-flight lock prevents double-spend races.
- Lifetime `sm.casinoStats[game]` (`spins`, `wins`, `losses`, `coinsWon`,
  `coinsLost`, `biggestWin`, etc.) is tracked but not yet surfaced in
  UI — kept extensible for a future stats panel or achievement layer.
- Old `casinoSetBetChip` / `casinoPlay` API kept as shims that reroute
  to the new tab/bet flow.

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

## Unreleased — Closing the game autosaves a retreat to the last city 2026-05-18 (`claude/autosave-city-return-u7rTa`)

### Changed — `pagehide` now writes the same warp-to-last-city the gameover button does

Before this change, closing the tab (or refreshing) mid-battle or mid-route
left the save pointing at the active row, so the next session resumed
right where the player left off. That made the existing "Return to Last
City" button — which charges half the player's gold (rounded up to 100G,
min 100G) to teleport back to amenities — pointless: anyone could just
close the tab and rejoin in place, free.

Closing the game now forces the same retreat outcome:

* `_storyApplyRetreatToCity()` was extracted from
  `retreatToLastPokemonCenter()` and now holds the shared mutation —
  pulls the in-battle party snapshot into `sm.team`, full-heals every
  slot, deducts the gold fee, snaps `sm.eventIndex` to
  `lastStoryCityEventIndexAtOrBefore(sm.eventIndex)`, and clears the
  mid-battle locks / retry inventory snapshot. The manual gameover
  button calls this helper and then handles its own UI (`hide all
  screens` + `enterCity()`).
* A `pagehide` listener inside the StoryMode IIFE calls a new
  `_storyAutosaveOnClose()` which runs the same mutation and saves to
  `pbs_story_save`. The handler bails when the current row is already
  a `City` or `Hall of Fame` (no warp, no fee — just persist), and when
  `event.persisted === true` (bfcache transition: the page can be
  restored without a reload, so the live DOM must not be desynced from
  `sm`).
* The gold fee is computed by the existing `_storyCalcRetreatGoldFee()`,
  which already returns `0` when `_storyDifficultyIsCasual()` is true.
  Easy / very easy keep their free-retreat semantics — closing on those
  difficulties warps back to the city for free, no per-close penalty.
* `pagehide` does *not* fire on tab switch or minimize (those go through
  `visibilitychange`), so this doesn't bleed gold every time the player
  alt-tabs. The existing `load()`-time sanitizer at battle.html:28156
  clears any transient `crucibleBattleSource` left over from a mid-fight
  close, so post-game Crucible / Frontier / rematch flows recover
  cleanly on reload.

Touched: `battle.html` (new `_storyApplyRetreatToCity` helper near
`_storyFullHealPartySlots`, refactored `retreatToLastPokemonCenter`,
new `_storyAutosaveOnClose`, and a `pagehide` listener registered just
before the StoryMode IIFE's public-API return).

## Unreleased — Data-driven recommendations across tutor / dojo / nature rater / EV trainer 2026-05-18 (`claude/data-driven-recommendations-OvBV7`)

### Changed — Tutor / Dojo / Nature Rater / EV Trainer recommendations now read directly from Smogon usage

The "★ Recommended" strip on every facility used to score options with a
fixed heuristic table — Choice Band = 85 if physical, Leftovers = 75
flat, Magic Guard = 90, etc. The picks were sensible but generic: every
physical sweeper got the same top items regardless of what Smogon
players actually use on the species. Tyranitar's heuristic preferred
Magic Guard ahead of Sand Stream; Garchomp's "top moves" were ranked by
raw BP × accuracy, not by what 99% of Garchomp sets actually carry.

The pickers now compute a per-species **popularity table** from the
loaded `data/builds.csv` (16,744 Smogon sets across gens 1–9, the same
file the EV-trainer Meta Spreads already used). Every blank-ability row
resolves to the species' default — that was 56% of the dataset, so the
old counts buried Sand Stream, Intimidate, Flash Fire, Levitate, and
every other implicit-default ability under sub-1% explicit-tech picks.
A composite score blends Smogon usage with the existing heuristic
(65% data / 35% heuristic when the species has ≥ 5 builds; 40 / 60
when falling back to the global pool; pure heuristic when csvBuilds
hasn't loaded yet).

What changed in each surface:

* **Move Tutor** — Strip now lists the **top 10** moves by Smogon usage
  for the active mon (Garchomp → Earthquake · Swords Dance · Outrage ·
  Stealth Rock · Stone Edge · Fire Blast · Dragon Claw · Fire Fang ·
  Scale Shot · Dragon Tail). The first 5 still get the "★ Pick" pill on
  their cards, and the "Recommended" sort uses the same composite score
  so the grid orders correctly even after filter chips are applied.
* **Battle Dojo / Held Item** — Strip shows the **top 3** items by
  species usage (Heatran → Leftovers · Air Balloon · Choice Scarf).
  Currently-equipped item is excluded from the strip but stays in the
  grid.
* **Battle Dojo / Ability** — Strip shows the **top + runner-up**
  (Garchomp → Rough Skin · runner-up: Sand Veil; Tyranitar → Sand
  Stream · runner-up: Unnerve). Blank-ability resolution means default
  abilities now win against scattered tech picks the way they should.
* **Nature Rater** — Strip shows the **top 3** natures with their
  stat axes (Volcarona → Timid (+Spe/−Atk) · Modest (+SpA/−Atk) ·
  Bold (+Def/−Atk)).
* **EV Trainer** — The "★ Pick" recommendation is now tiered by Smogon
  rank for meta spreads. `meta_0` (the single most-used spread for the
  species) gets a +60 score bonus, `meta_1` +40, `meta_2` +25,
  `meta_3` +15 — so the top recommendation tracks the actual most-popular
  real-world build instead of falling back to the universal "Physical
  Sweeper" template.

Obscure forms with no Smogon coverage (Pikachu-PhD, fringe gen-1 rows)
fall back through the same form-resolution chain as
`resolveCsvBuildEntry`, and finally to a one-time global aggregate (all
species blended) so the strip is never empty.

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
