# Loot Overhaul — Master Decision Ledger

> Companion to `LOOT_SYSTEM_OVERHAUL.md`. Every decision we need to make for the full
> engine, grouped by area. Each: **options → ★ my recommendation → why → trade-offs.**
> Balance scope: **C0 → Mystery Figure only** (post-HoF Frontier is the open infinite loop —
> out of scope). Saves are disposable per maintainer, so schema changes are unconstrained.
> Nothing here is built until you sign off per batch.

---

## Guiding philosophy (from your brief)

> "I always end up money-stacked playing optimally. Nerf gold gain, improve rewards, make
> looting fun and 'getting what you need' — tighter economy, but overall a *similar*
> challenge."

So the north star: **shift value out of raw gold and into earned items.** Gold becomes a
real constraint (consumables, the occasional big purchase); *power* (EV access, abilities,
forms, held items) is earned through fun, varied loot rather than bought with a fat wallet.
Net difficulty stays ~the same; the *feel* becomes scrappier and more reward-driven.

### Value-anchored rarity (maintainer principle, originated by you)

Every loot item carries an **effective-value score** = *(gold saved per use) × (how often you'd
actually use it)*. Rarity tier follows from value bands; drop weight follows from rarity tier.
Why it matters: Colress (~5,000G but a rare need) and a Heart Scale / Move-Tutor pass
(~1–2,500G but used constantly) land closer in real worth than their sticker prices suggest.
The payoff is **adjustability** — retuning is a one-number change (an item's value, a band
edge, or a tier weight), and the table stays coherent. This is the backbone of the loot data.

---

## ✅ Decisions locked (running log)

- **D1** — Nerf gold via **mid/late purses only** (badge ≥ ~3); early game untouched.
- **D2** — Removed gold value flows **into loot** (bosses give items/passes, not cash).
- **D3** — Facilities reached via **earned passes + modest fallback price**; pass/item rarity
  set by the **effective-value anchor** above.
- **D4** — Optimal C0→Mystery run ends with a **small cushion (~3,000–6,000G)** in reserve.
- **D5** — Casino is **contained** (pays items, not net gold).
- **D6+D9** — Bonus-layer generosity = **Balanced**: common 60 / uncommon 28 / rare 10 /
  epic 2, moderate per-cell bonus chances. Weights are stage-indexed.
- **D7** — Faucet = **flat 5 IV-vitamins per fight, every tier** (REGULAR 3→5; ACE already 5;
  Rival 3→8 ramp → 5). BOSS stays **0 here** — Gym Leaders / E4 / Champion / MF deliver their
  vitamins via the `GYM_VICTORY_REWARDS` bundle (D2), sized when we build the boss tables.
  *Why generous-flat, not a per-stage taper:* vitamins are the **only** IV-training path and
  demand is **front-loaded** — a C0 catch needs ~9 vitamins/stat to reach 31, a C7 catch ~1
  (`STORY_IV_CITY_WILDPROF`) — so a fat faucet keeps the early low-IV team from starving, while
  the taper happens **on its own** (high-IV late catches barely need vitamins) as the bonus
  layer rises. Keeps the "stat-juice early → real gear late" crossover with one number, no curve.
- **D8** — Loot is **flat across difficulty** (difficulty changes foe strength only).
- **D10** — Voucher gate is **derived from the facility map** so it can't drift (taken as recommended).
- **D11** — **No mailbox.** Loot tables are **stage-structured**: any reward referencing a
  not-yet-existing facility moves to the stage where that facility exists. Early tables draw
  from *already-unlocked* facility vouchers (free uses) + commons.
- **D12** — Keep the **1-city grace** so a hand-placed gift can arrive just before its
  facility opens (taken as recommended).

## 📋 Verified ground truth (code sweeps, 2026-06-02)

### Voucher set — 12 tokens (canonical list: `VOUCHER_KEYS` battle.html:46510)

| Token (label) | item id | Redeems at | Waives / effect | Gate (debut city) |
|---|---|---|---|---|
| Rare Candy | `rareCandy` | Evolution Tutor | free evolution | C2 *(hand-placed; excluded from random draw)* |
| EV Voucher | `vitamin` | EV Trainer (Buck) | 5,000G EV preset | C4 ⚠ *(drift — see below)* |
| Heart Scale | `heartScale` | Move Tutor | 1,500G move teach | C0 |
| Mint | `mint` | Nature Rater | 2,000G nature change | C0 |
| Ability Capsule | `abilityCapsule` | Battle Dojo | 2,500G ability swap | C4 |
| Emblem of Honor | `emblemHonor` | Battle Dojo | 2,000G item swap | C4 |
| Wishing Piece | `wishingPiece` | Colress (Power-Up) | 5,000G form awakening | C6 |
| Bill's Discount Card | `linkDiscount50` | Cable Link Station | 50% off one transaction | C2 |
| Stonewise Token | `stoneToken` | Stone Shop | free stone / trade item | C2 |
| Lucky Chip | `casinoChip500` | Poké Casino | 500G first-bet credit | C5 |

Plus **2 one-time boolean free-use flags** (not counters): `sm.artifactFreeClaimUsed`
(Artifact Shop — 1 free relic) and `sm.safari.freeEntryUsed` (Safari — 1 free entry).

### Corrections to the working mental model

- **"Dojo vouchers" = two, not one** — `abilityCapsule` (ability swap) + `emblemHonor` (item
  swap). There is no single `dojoVoucher`.
- **"Nature voucher" = `mint`** (Nature Rater, waives 2,000G).
- **Naming trap:** item id `vitamin` is the **EV Voucher** (waives the EV-Trainer fee) — it is
  NOT an "IV vitamin." The IV vitamins are a *separate* six-item set `_IV_VITAMIN_KEYS`
  (hpUp/protein/iron/calcium/zinc/carbos, 46529), each **+3 to one IV** (cap 31, `applyPermBoost`
  54224), handed out & applied at the Pokémon Fan Club. The tables must keep these two
  "vitamins" strictly apart.

### Mechanics — confirmed (anchors)

1. **EV training** — per-battle gain is **always on from fight #1** (whole team; REGULAR 9 /
   ACE 14 / BOSS 18, `EV_GAIN_ACTIVE` 50072; into 2 identity stats, cap 252/510). The **EV
   Trainer (Buck)** is a *re-spec/optimizer* that overwrites the spread
   (`evTrainerApplyPreset` 61265) — not "more training."
2. **IVs** — random, but the wild/gift IV band **floor rises by city**: `[0,10]` C0 → `[25,31]`
   C7 (`STORY_IV_CITY_WILDPROF` 33326). Wild EV-yield ramps `[0,50]`→`[508,508]`
   (`STORY_EV_CITY_TOTAL` 33364). Scaling input is story stage, **not** difficulty.
3. **IV vitamins @ Fan Club** — confirmed. Fan Club (debut C1, recurring) gifts one of each on
   first visit (`enterFanClub` 60832) and is where they're applied (also reachable from the bag).
4. **Poké Mart** — `firstMart` gifts **5 Poké Balls** at C0 (40562).
5. **Department Store** — `firstDept` gifts exactly **1 Great Ball** at C4 (40575), nothing else.
6. **Faucet (IV-vitamin drops)** — REGULAR 3 / ACE 5 / BOSS 0 (bosses bundle via
   `GYM_VICTORY_REWARDS`) / **Rival 3→8** (`VITAMIN_LOOT_BY_CLASS` 50085). *(This is the faucet
   D7 revises to a flat 5; the parallel EV-gain faucet in #1 is a mechanic, not loot.)*

### Already implemented — D10 & D12 need no work

- **D10** — voucher gate already mirrors the facility map: `VOUCHER_DEBUT_CITY` (46519).
- **D12** — 1-city giftable grace already exists: `_storyVoucherGiftable` (46544, `debut − 1`).

### ⚠ Flagged drift (redesign must reconcile)

- **EV Voucher out-of-time by 3 cities.** `VOUCHER_DEBUT_CITY.vitamin = 4`, but the EV Trainer
  debuts **C7** (`FACILITY_DEBUT_CITY.evtrainer: 7`, 30656). The comment at 46516 still says
  "EV Trainer debuts City 4" — stale since the 2026-05-26 reshuffle. A player can hold an EV
  Voucher for 3 cities with nowhere to spend it. *(Minor siblings: `mint` C0 vs Nature Rater C1;
  `stoneToken` C2 vs Stone Shop C3 — each 1 city, softened by the giftable grace.)*
- **Revive already exists** — buyable Dept item (`revive`, 2,500G, `revive50`) with Max Revive
  (4,000G) and Revival Herb (1,200G), `data/story/shops.json:144-158`. It is **never *gifted***
  in story (only the CPU foe AI + a debug seed receive `revive:N`). So "introduce Revive" means
  introduce a *gifted* one — the item itself already ships.

## ✅ Voucher decisions resolved (2026-06-02)

- **Q1 — EV Voucher drift → gate to C7.** `VOUCHER_DEBUT_CITY.vitamin: 4 → 7` (match
  `FACILITY_DEBUT_CITY.evtrainer`); refresh the stale comment at 46516. Accepted the thin late
  window; the voucher's *value* (is it worth dropping at all that late?) is deferred to the
  matrix pass.
- **Q2 — Department Store gift → add a gifted Revive.** `firstDept` bundle becomes
  `{ greatBall: 1, revive: 1 }` + toast update. Introduces the first *gifted* Revive (the item
  is already buyable here).
- **Q3 — No new voucher designs.** Early tables (C0–C1) draw only from existing tokens (Heart
  Scale, Mint) + IV vitamins + balls + consumables. Zero new redeem-wiring.
- **Q4 — Rival faucet → flat 5.** Drop the badge-scaled 3→8 ramp; the rival drips a flat 5 per
  fight like every other tier. (The old ramp was *backwards* — it paid most late, exactly when
  high-IV catches need vitamins least.)

### ✅ Implementation log — Story rewards Step 2 + 3 (shipped, branch `claude/story-rewards-step2`)

| # | Site | Change | Status |
|---|---|---|---|
| Q1 | `VOUCHER_DEBUT_CITY.vitamin` + comment | `4 → 7` (match EV Trainer C7) | ✅ done |
| Q2 | `firstDept` gift + `_storyGrantBundle` (new `revive` branch) + dialogue/toast | `{greatBall:1}` → `{greatBall:1, revive:1}` | ✅ done |
| D7 | `VITAMIN_LOOT_BY_CLASS` | flat **5** for **every** rank — REGULAR / ACE / **BOSS** all 5 | ✅ done |
| Q4 | Rival faucet | `3→8` ramp → flat `5`, now its own `VITAMIN_LOOT_RIVAL` knob | ✅ done |
| — | **Faucet structure** | 4 independent knobs (REGULAR/ACE/BOSS + RIVAL) — all 5 today, separately tunable | ✅ done |
| — | **`GYM_VICTORY_REWARDS`** | **stripped of IV-vitamins** — bosses drip 5 via the faucet; bundles keep balls / candy / vouchers / gold / Wishing Piece (no double-dip) | ✅ done |
| — | **Fan Club welcome gift** | `1 of each` → **`5 of each`** IV vitamin (`FANCLUB_WELCOME_VITAMINS_PER_STAT = 5`; 30 total) to front-load early IV training | ✅ done |
| — | **Pokédex milestone rewards** (const + fn + 3 call sites) | **removed** — per-run loot didn't fit the cross-run Achievements model; EV-Voucher tiers mis-timed vs C7 | ✅ done |
| — | **Mid-game route-find** (badge-4 EV-Voucher) | **removed** — premature vs C7 + silently dropped under Q1; EV Trainer's welcome voucher covers it | ✅ done |

Guard test: `tests/suites/story-vitamin-faucet.test.js` (faucet 5 for every rank incl. bosses ·
gate C7 · rival badge-independent). Full suite green. Cross-run **Achievements / Hall of Fame**
untouched.

**Still deferred (needs your numbers):** the **boss bundle RESCALE** — the *non-vitamin* spoils
(balls / vouchers / gold) re-tuned so each boss matches the gym-leader reward level for its city
stage (E1–4 / Champion all sit at **City 9** → top band; today's stripped bundles are thin and
not yet stage-matched). Built together as the **universal stage×rank loot matrix** (layered:
flat-5 faucet · rarity-weighted bonus pool · per-boss signature). Plus the **purse-nerf**
numbers (D1, sized to the ~3–6k finale cushion per D4).

---

# AREA 1 — ECONOMY (your #1 concern)

### D1. How do we nerf gold *income*?
- (a) Cut base battle purses across the board.
- ★ **(b) Cut purses mid/late only (badge ≥ 3), leave early intact.** Early game is already
  tight; the surplus accumulates in the mid/late stretch, so that's where to trim.
- (c) Keep purses, raise sink prices instead.

**Why (b):** the surplus is an *accumulation-rate* problem in the mid/late journey, not an
early one. Trimming where the money piles up fixes the end-state without making the first
hour punishing. **Trade-off:** two different purse regimes to tune (vs one flat cut).

### D2. Where does the *removed* gold value go?
- ★ **(a) Into loot.** Boss bundles drop their gold and gain items/passes of equal "feel"
  value; battle income drops; the gap is filled by richer drops you actually use.
- (b) Just disappears (pure nerf, no compensation) — simplest, but reduces total rewards
  and may feel stingy.

**Why (a):** matches "improve rewards but nerf gold." You earn *power* directly instead of
the cash to buy it. **Trade-off:** loot must be well-targeted or you get items you don't
need (mitigated by the gating + mailbox + a smarter pool, see Area 3/4).

### D3. How do players afford the two big power facilities (EV Trainer 5,000G, Colress 5,000G) under a tighter economy?
- (a) Cut their gold price.
- (b) Rely purely on the existing one free voucher each.
- ★ **(c) Make facility *passes* a normal loot drop** (EV-Trainer Pass, Colress Pass), so
  repeated free uses are *earned*, and keep a modest gold price as the fallback.

**Why (c):** decouples "can I use my power tools" from "am I cash-rich." A loot-driven
player stays powered up even while gold-poor — exactly your vision. **Trade-off:** must rate-
limit passes so facilities don't become free-spam (cap per stage / pity-gated).

### D4. What's the target end-state at Mystery Figure for an optimal player?
- (a) Net-zero (spend ≈ earn; you finish with pocket change).
- ★ **(b) Small cushion (~one big purchase in reserve), not a stockpile.** You always have
  a *choice* to make, never "money is irrelevant."
- (c) Keep today's stockpile (no change).

**Why (b):** "money-stacked" is the complaint; "constant anxiety" is the opposite failure.
A small reserve keeps decisions meaningful without trivializing them. **Trade-off:** needs a
gold-flow simulation to verify (I'll add a test that prints cumulative gold per city).

### D5. Casino — net gold faucet or contained?
- ★ **(a) Contained / break-even-ish.** Under a tight economy the casino can't be a money
  printer; keep it as a *loot* sidegame (pays items, not net gold).
- (b) Leave as a gold faucet (undercuts D1).

**Why (a):** consistent with nerfing gold; the casino stays fun for *item* gambling.
**Trade-off:** high-rollers lose a gold exploit (probably intended).

---

# AREA 2 — THE LOOT MATRIX (Coarse 3×4, locked)

### D6. Rarity ladder weights (base, before per-stage tuning)
- ★ **common 60 / uncommon 28 / rare 10 / epic 2.** Standard, readable curve.
- (b) flatter (more rares) — more dopamine, less scarcity.
- (c) steeper (fewer rares) — scarcity-forward.

**Why (a):** proven feel; easy to shift per stage later. **Trade-off:** none structural —
it's one row in JSON.

### D7. The faucet (the per-encounter drip) — keep IV vitamins as the base?
- ★ **(a) Yes, keep IV-vitamin drip as the faucet**, but slightly *reduce* volume (e.g.
  REGULAR 3→2, ACE 5→4) now that a real bonus layer exists on top.
- (b) Keep current volume (3/5).
- (c) Replace faucet with mixed common drops (vitamins + small consumables).

**Why (a):** IV vitamins are the "steady growth" backbone and are always usable (no gate).
Trimming a bit makes room for the bonus layer without flooding. ★ leans (a). **Trade-off:**
slightly slower IV maxing — fits "tighter."

> ✅ **RESOLVED — see running log (D7, revised 2026-06-02).** Reversed the "trim" instinct: the
> faucet goes **flat 5**, not down to 2. Vitamins are the *only* IV-training path and demand is
> front-loaded (C0 catch ~9 vitamins/stat vs C7 ~1), so the early team would starve under a cut.
> The taper is automatic (late catches roll high) — no per-stage curve needed.

### D8. Do loot chances scale with difficulty mode (Easy…Challenge)?
- ★ **(a) No — loot is flat across difficulty.** Difficulty changes *foe strength*, not
  reward generosity; keeps balance reasoning clean.
- (b) Yes — harder modes drop better (risk/reward).

**Why (a):** one fewer multiplicative axis to reason about; matches how the curve doc treats
difficulty (stat-only). **Trade-off:** no extra carrot for Challenge (could add later).

### D9. Bonus-drop chances per cell — use my §4 starting table?
- ★ **(a) Yes, start from §4 and tune via simulation.**
- (b) You hand-set each of the 12 cells now.

**Why (a):** faster to a playable baseline; the test harness will report actual drop value
per stage so we tune from data. **Trade-off:** initial numbers are mine (you own final).

---

# AREA 3 — GATING & MAILBOX

### D10. Voucher gate source
- ★ **(a) Derive from `FACILITY_DEBUT_CITY` via a `redeemer` map** — drift becomes
  impossible. (Already designed.)
- (b) Keep a hand-maintained table (status quo — the thing that broke).

**Why (a):** the root-cause fix. **Trade-off:** none.

### D11. Pre-facility rewards — mailbox or re-item?
- ★ **(a) Held-reward mailbox** — earn it now, auto-delivered with a toast when the facility
  opens. General, nothing lost, reads as a feature.
- (b) Re-item those sites to stage-appropriate gifts (no deferral system).
- (c) Both — re-item the obvious ones, mailbox as the safety net.

**Why (a/c):** the mailbox solves the *whole class* permanently; re-iteming is per-site
whack-a-mole. **Trade-off:** mailbox is a small new system + UI surface (a "held" line in
the bag). Given "saves not important," cost is low.

### D12. Gateway grace (gifts 1 city before the facility)
- ★ **(a) Keep the 1-city grace** for hand-placed gateway gifts (e.g. Wishing Piece at GL5 →
  Colress C6) so you're holding it when the door opens.
- (b) Remove grace — strictly no item before its facility.

**Why (a):** it's the intended "arrive ready" beat; the mailbox covers anything earlier.
**Trade-off:** none.

---

# AREA 4 — NEW & CREATIVE GIFTS (you welcomed diversity)

> You asked for *fun, diverse, Pokémon-world-fitting* items. Here's a creative menu. We'll
> pick which to adopt; each is a JSON entry + a small redeem hook.

### D13. Facility / service passes
- EV-Trainer Pass, Colress Pass, Move-Tutor Pass, Nature Pass, Safari Pass (free entry),
  Stone voucher (exists), Link discount (exists).
- ★ **Adopt EV/Colress/Safari passes** (the expensive trio); fold existing vouchers in.

### D14. Held-item economy (held items are buy-only today)
- ★ **Held-Item Token** → redeem one held item free (weather/terrain orb, choice band, etc.)
  at the Dept Store. Makes the held-item layer reachable through play.
- Trade-off: needs a small redeem screen (reuse the stone-token picker pattern).

### D15. Brand-new fun mechanics (opt-in, pick any)
- ★ **(a) Route "hidden item" finds (Dowsing):** occasional found-item pickups on routes —
  the classic overworld treasure feel, seeded so it's deterministic.
- ★ **(b) "Loot bag / Mystery Gift" reveal:** some drops are wrapped — a small reveal
  animation when opened. Pure delight, no balance cost.
- (c) **Berry trees / consumable held items:** Pokémon-flavored healing/utility berries as
  held items, droppable.
- (d) **Set-collection bonus:** complete a themed set (e.g. all four weather orbs) → a one-
  time reward. Encourages engaging with niche items.
- (e) **Type-token / "TM voucher":** a token for a free Move-Tutor teach of any move.

**Why ★ a+b:** they add texture and joy without touching balance (finds are seeded & budget-
counted; the reveal is cosmetic). c/d/e are great but each is more scope — adopt as you like.

### D16. Should new gifts ever be *consumable held items the player equips*, or only bag items?
- ★ **(a) Mix:** some bag (passes, tokens), some equippable (orbs, berries).
- (b) Bag-only (simplest).

**Why (a):** equippable drops deepen team-building. **Trade-off:** equippable items need the
held-item slot UI (already exists for orbs).

---

# AREA 5 — INTEGRITY, DETERMINISM, POLISH

### D17. Seeded RNG everywhere (incl. non-battle: milestones, casino, city)
- ★ **(a) Yes — one seeded stream for all draws.** Replays/tests become deterministic.
- (b) Leave `Math.random()` fallbacks.

**Why (a):** it's a stated codebase rule; tests depend on it. **Trade-off:** must thread a
seed into the non-battle paths (minor).

### D18. Bad-luck (pity) protection on rare/epic
- ★ **(a) Yes — a miss-streak counter forces an eligible rare after N misses.**
- (b) No — pure RNG.

**Why (a):** prevents a player going a whole stage starved; smooths the tighter economy.
**Trade-off:** one more counter in save (cheap).

### D19. Naming cleanup — the `vitamin` key *is* the EV Voucher (collides with "vitamins")
- ★ **(a) Rename for clarity** (`vitamin`→`evVoucher` key; UI "EV-Trainer Pass"); keep IV
  items as hpUp/protein/…
- (b) Leave it (risk of ongoing confusion).

**Why (a):** removes a real footgun in code + copy. **Trade-off:** touch the key everywhere
(safe with saves disposable).

### D20. Consolidate the 2 bypass grants (Fan Club, Center potion) through the resolver?
- ★ **(a) Yes** — one grant path, consistent gating + repaint.
- (b) Leave inline.

**Why (a):** kills the consistency gap. **Trade-off:** none.

---

# AREA 6 — ARCHITECTURE

### D21. Data file shape
- ★ **(a) One `data/story/loot.json`** (rarity + items + pools + matrix + bundles + budget).
- (b) Split into several files.

**Why (a):** one place to reason about the whole economy. **Trade-off:** a biggish file
(fine; smaller than the other data files).

### D22. Migration path for the 23 existing `_storyGrantBundle` callers
- ★ **(a) `_storyGrantBundle` becomes a thin shim over the new `_storyGrantLoot`** so callers
  keep working; migrate call sites opportunistically.
- (b) Rewrite all 23 callers at once.

**Why (a):** lower-risk, incremental, each step testable. **Trade-off:** a shim lingers
briefly (removed in Phase D).

---

## Suggested order of decisions

1. **Economy batch (D1–D5)** — your priority; unblocks the whole value model.
2. **Matrix & gating batch (D6–D12)** — the engine core.
3. **Creative gifts batch (D13–D16)** — the fun layer.
4. **Polish batch (D17–D22)** — mostly "yes, do it."

I'll bring these as multiple-choice batches, recommendation-first, and we lock them in order.
