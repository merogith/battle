# Story Mode — Loot & Reward System Overhaul (Design Recommendation)

> **Status:** Design proposal for maintainer sign-off. **No gameplay code changed yet.**
> Scope: Story mode (normal) only — PvP / Quick Play / Frontier are out of scope.
> Anchors are `battle.html:LINE` (line numbers drift; the symbol is the durable anchor).
> Prepared 2026-06-02. Supersedes the reward sections of `PROGRESSION_CURVE_MASTER.md`
> §2h/§3.3 (which predate the 2026-05-26 facility reshuffle — see §1.4).

---

## 0. The ask, in one line

> "All drop loot tables and drop chances need an update… according to each trainer
> type and stage of story, a city-based full-spec loot system… overhaul all systems
> into a single holistic, dynamic, best-practice, optimized, polished system."

This doc maps what exists, diagnoses why it drifts, and proposes one unified,
data-driven loot engine keyed on **(trainer-type × story-stage × city)** with a
rarity model, a reward budget per stage, anti-frustration gating, and a phased,
reversible rollout.

---

## 1. Current state — what actually ships today

### 1.1 Ten disjoint reward systems, all hardcoded in JS

| # | System | Anchor | Trigger | Grants | Data-driven? |
|---|---|---|---|---|---|
| 1 | **Gym/Elite/Champion bundles** | `GYM_VICTORY_REWARDS` 46421 · `_storyApplyVictoryReward` 46669 | win a boss (one-time per save) | balls + IV vitamins + gold + `voucherRolls` + gateway vouchers | ❌ JS object |
| 2 | **Pokédex milestones** | `POKEDEX_CAUGHT_MILESTONES` 46681 | caught count 25/50/75/100 | balls + vouchers + vitamins + gold | ❌ JS array |
| 3 | **Casino prizes** | `_casinoRollPrize` 51976 | any casino win, tiered by multiplier | vitamins + vouchers (weighted) | ❌ JS, inline % |
| 4 | **Intro facility gifts** | `STORY_TUTORIAL_SCENES` 40544 | first visit to each facility | one themed voucher/ball | ❌ JS object |
| 5 | **NPC stage-up gifts** | `_NPC_STAGE_GIFT` 55470 | facility tier unlock by badges | voucher(s) | ❌ JS object |
| 6 | **Mid-game route find** | inline 47948 | first Basic/Elite after badge 4 | `vitamin:1` (EV Voucher) | ❌ inline |
| 7 | **Per-trainer faucet loot** | `_storyTrainerLootVitamins` 46601 | every non-boss victory | 3/5 IV vitamins by class; Rival 3→8 | ❌ `VITAMIN_LOOT_BY_CLASS` 50085 |
| 8 | **Post-HoF Mystery reward** | inline 49275 | beat Mystery Figure | balls + vouchers + vitamins + 5,000G | ❌ inline |
| 9 | **Caged God capture** | inline 50938 | catch the legendary | rareCandy + vitamins + 10,000G | ❌ inline |
| 10 | **Roaming legendary** | `SUB_LEGENDARY_POOL` 46709 | after GL8 | an *encounter* (not an item grant) | ❌ JS array |

Plus two **inline grants that bypass the central helper** `_storyGrantBundle` (46642):
the Fan Club welcome vitamins (60843) and the Pokémon Center first-visit Potion (40620).

**Headline:** reward amounts and drop chances are **100% hardcoded in JS**. There is
no `data/` reward file. Every rebalance is a code edit — the opposite of the
"data-driven over code-driven" rule in `CLAUDE.md`.

### 1.2 The trainer-type vocabulary already exists

`_classifyTrainerEvent(en)` (50106) collapses every encounter to three ranks, and EV +
faucet loot already speak this vocabulary:

| Class | Members | EV (`EV_GAIN_ACTIVE` 50072) | Faucet vitamins (`VITAMIN_LOOT_BY_CLASS` 50085) |
|---|---|---|---|
| `REGULAR` | Basic Trainer, Gym Trainer 1/2 | 9 | 3 |
| `ACE` | Elite Trainer | 14 | 5 |
| `BOSS` | Gym Leader N, E1–4, Champion, Rival, Mystery | 18 | 0 (bundled instead) · Rival 3→8 special |

At the post-victory reward hook (**~47885**), all the levers a matrix needs are in
scope: `en`, `_classifyTrainerEvent(en)`, `sm.badges`, `cityIndexFromEventIndex(sm.eventIndex)`,
`idx`. **This is the single clean injection point for a (class × city) resolver.**

### 1.3 The economy it has to fit (from `PROGRESSION_CURVE_MASTER.md`, verified live)

- **10 cities (C0–C9), 8 badges, 4 stages.** Flat Lv50 — progression is Grade (G4→G1) ×
  Build-tier (T1→T4) × Team-size (2→6), all keyed to `sm.badges`.
- **Gold sources:** start 2,000 + diff bonus; per-battle `floor(baseCoins × diffMult ×
  progressTaper × basicTrainer0.82)`. Base coins GL1 2,350 → GL8 5,950; E1–4 5,000 flat;
  Champion 7,500; Mystery 12,000. Wild routes pay 0.
- **Gold sinks:** Poké Ball 300, Great Ball 1,000, Max Revive 4,000; Move Tutor 1,000–5,000,
  Nature Rater 2,000, Dojo 500–3,000, **EV Trainer 5,000**, **Colress 5,000**, Stone Sage
  1,500/6,000/16,000, Cable Link 5,000–22,000, Safari entry 10,000.
- **Diagnosed economy faults (curve doc §3.3):** **R2** late economy too tight (~560G net
  per leader after one Max Revive + potions); **R3** the two biggest power facilities
  (EV Trainer, Colress) are paywalled exactly when the player is cash-starved; **R4**
  Frontier pays nothing. These are *open*, unresolved (decision **D3c** never taken).

### 1.4 Facility map was reshuffled — docs are stale, gate drifted

The live `FACILITY_DEBUT_CITY` (30653) differs from every design CSV and from
`PROGRESSION_CURVE_MASTER.md §2i`:

| Facility | Doc/CSV (old) | **Live** | Redeems voucher |
|---|---|---|---|
| Battle Dojo (`dojo`) | C4 | **C1** | abilityCapsule, emblemHonor |
| Department Store (`dept`) | C6 | **C4** | — |
| Safari (`safari`) | C4 | **C5** | — |
| **EV Trainer (`evtrainer`)** | C4 | **C7** | **vitamin (EV Voucher)** |
| Colress (`colress`) | C6 | **C7** | wishingPiece |

The EV Trainer is now consistently **C7** in live code (FACILITY_DEBUT_CITY +
`STORY_EVENTS_RAW` action lists 30620+ + the `firstEVTrainer` intro gate 44032). Only
docs are stale.

**But `VOUCHER_DEBUT_CITY` (46519) was never updated to match** — it is hand-maintained
and now wrong in 5 places:

| Voucher | Live gate (46519) | Correct (facility debut) | Drift |
|---|---|---|---|
| `vitamin` (EV Voucher) | **4** | **7** (evtrainer) | **leak — droppable C3, usable C7** |
| `abilityCapsule` | 4 | **1** (dojo) | over-gated 3 cities (too stingy) |
| `emblemHonor` | 4 | **1** (dojo) | over-gated 3 cities |
| `stoneToken` | 2 | **3** (stoneShop) | 1 city early |
| `mint` | 0 | **1** (nature) | 1 city early |
| heartScale / rareCandy / link / casino / wishingPiece | 0/2/2/5/6 | 0/2/2/5/6 | ✅ |

This is the root defect behind "vouchers arrive too early or independent of where used."

### 1.5 Where the EV-Voucher leak actually fires

`vitamin` (EV Voucher) is granted **before C7** at three sites; with the gate corrected to
7 these would *silently swallow* (and the messages would lie):

1. **Dex-50 milestone** (46684) — `vitamin:1`, fires whenever 50 caught (often C3–C5).
2. **Casino big/jackpot** (51976) — `vitamin` in the weighted pool, from C5.
3. **Mid-game route find** (47948) — `vitamin:1` at badge 4 (~C5), the "tall grass" beat.

Today these *do* grant — and the player then **holds an unusable EV Voucher for 2–3
cities**. That is the exact complaint. Fixing the gate without redesigning these sites
just converts "held unusable" into "silently swallowed." Both are wrong; §5 fixes the
class.

### 1.6 Other consistency / quality gaps found in the census

- **Naming collision:** the key `vitamin` *is the EV Voucher*, while `hpUp/protein/iron/
  calcium/zinc/carbos` are "perm-boost vitamins" (+3 IV each). Two different things both
  called "vitamin." Confusing in code, copy, and the milestone messages.
- **Determinism gap:** `_storyRollVouchers` / `_storyGrantRandomVitamins` fall back to
  `Math.random()` whenever `!sm.active` (i.e., the milestone/casino/city paths that fire
  outside a battle) — violating the "seeded RNG everywhere user-visible" rule. Replays
  diverge.
- **Inline % magic numbers:** casino tiers (20/65/100 %, and 55/35/10 sub-rolls) live in
  code with no central table.
- **Two bypass sites** (Fan Club 60843, Center potion 40620) skip `_storyGrantBundle`, so
  they dodge gating + the inventory-repaint refresh.
- **`masterBall:0` markers** in bundles (49275) — dead keys that read as "grant 0."

---

## 2. Design principles (best practice → this codebase)

1. **One source of truth, data-driven.** All amounts, weights, chances, and the matrix
   live in `data/story/loot.json`. Code holds *mechanics*, JSON holds *numbers* — per
   `CLAUDE.md`.
2. **Separate the four reward layers** so each has one job:
   - **Progression** (guaranteed bundles at bosses/milestones) — the backbone.
   - **Faucet** (small, every-encounter drip — the IV-vitamin trickle) — steady growth.
   - **Bonus** (RNG extras on top of faucet) — variance & delight.
   - **Trophy** (one-time set-pieces — Dex-100, Caged God, Mystery) — memorable peaks.
3. **Rarity tiers, one ladder.** `common / uncommon / rare / epic`, with weights defined
   once and reused by every RNG draw (casino, bonus drops, voucher rolls). Tuning a
   probability touches one row.
4. **Reward budget per stage.** Each stage has a target gold-equivalent value; the matrix
   is filled to the budget, so loot scales *with* the curve instead of by hand-feel. Fixes
   R2 structurally.
5. **Gating = derive from facility, never hand-maintain.** `VOUCHER_DEBUT_CITY` becomes a
   computed projection of `FACILITY_DEBUT_CITY` through a `redeemer` map. Drift becomes
   impossible by construction.
6. **Nothing is granted-but-unusable, nothing is swallowed.** A reward earned before its
   facility opens goes to a **held-reward mailbox** and is auto-delivered, with a toast,
   the moment its city is reached.
7. **Honest messages.** The reward summary is built from what was *actually* granted
   (post-gating, post-mailbox), never from the request.
8. **Determinism.** Every draw uses a seeded `storyRngNext`-derived stream, even outside
   battle.
9. **Bad-luck protection.** Rare/epic bonus drops carry a pity counter so variance can't
   starve a player across a whole run.
10. **Reversible & tested.** Every phase ships behind a 1:1 behavior check or an approved
    number change, with a jsdom test that the next session can't silently regress.

---

## 3. Proposed architecture

### 3.1 Data: `data/story/loot.json`

```jsonc
{
  "rarity": {                      // one ladder, reused everywhere
    "common":   { "weight": 60 },
    "uncommon": { "weight": 28 },
    "rare":     { "weight": 10 },
    "epic":     { "weight": 2  }
  },
  "items": {                       // catalog: redeemer drives the gate
    "hpUp":          { "label": "HP Up",        "cat": "ivVitamin", "rarity": "common"   },
    "greatBall":     { "label": "Great Ball",   "cat": "ball",      "rarity": "uncommon" },
    "rareCandy":     { "label": "Rare Candy",   "cat": "voucher", "redeemer": "evolab",   "rarity": "rare", "noRandomPool": true },
    "vitamin":       { "label": "EV Voucher",   "cat": "voucher", "redeemer": "evtrainer","rarity": "rare" },
    "abilityCapsule":{ "label": "Ability Capsule","cat":"voucher", "redeemer": "dojo",     "rarity": "rare" },
    "wishingPiece":  { "label": "Wishing Piece","cat": "voucher", "redeemer": "colress",  "rarity": "epic" }
    // …full catalog…
  },
  "pools": {                       // named weighted draw pools (rarity-tagged)
    "faucet":      ["hpUp","protein","iron","calcium","zinc","carbos"],
    "bonus.early": ["greatBall","heartScale","mint"],
    "bonus.mid":   ["ultraBall","abilityCapsule","emblemHonor","rareCandy","heldItemToken"],
    "bonus.late":  ["rareCandy","vitamin","heldItemToken","goldCache.l"]
  },
  "matrix": { /* see §4 — (class × stage) → loot spec */ },
  "bundles": { /* GYM_VICTORY_REWARDS + milestones, moved verbatim then tuned */ },
  "stageBudget": { "1": 1500, "2": 2500, "3": 4000, "4": 6000 }  // gold-equiv / city, user-owned
}
```

The `redeemer` field replaces `VOUCHER_DEBUT_CITY` entirely: a voucher's debut city =
`FACILITY_DEBUT_CITY[items[k].redeemer]`. One projection, computed at load.

### 3.2 Code: one resolver, one grant path

```
loadGameData()  ──►  LOOT  (early-let placeholder, Object.assign per sloppy-mode rule)
                         │
_storyResolveLoot(ctx)   │  ctx = {class, eventName, city, badges, source}
   → reads matrix + pools, rolls seeded RNG, returns a normalized {items, gold, vouchers}
                         │
_storyGrantLoot(result)  │  the ONLY grant path (replaces _storyGrantBundle + 2 bypasses)
   → gate each item by redeemer-debut; ungated→inventory, gated→mailbox; build honest msg
                         │
_storyDeliverHeldRewards(city)  ──► on every city enter: flush mailbox items now usable
```

- `_storyGrantBundle` becomes a thin shim over `_storyGrantLoot` so the 23 existing call
  sites keep working during migration.
- The mailbox is `sm.heldRewards` (`{ itemKey: count }`) — one additive save field.

### 3.3 Save migration

`SAVE_VER` +1, `migrateStoryPreV<n>`: default `sm.heldRewards = {}`. Existing saves that
already hold an early EV Voucher keep it (no loss). Strictly additive — safe per the
`STORY_MODE_FLOW.md` save rules.

---

## 4. The centerpiece — (trainer-type × story-stage) loot matrix

Stages from the curve canon: **1** = C0–C1 (pre-GL2, T1/G4) · **2** = C2–C5 (GL3–5, T2/G3)
· **3** = C6–C8 (GL6–8, T3/G2) · **4** = C9 (E4→Mystery, T4/G1).

Each cell is a **loot spec**: `faucet` count from `pools.faucet`, plus a `bonus` roll
(`chance` → draw 1 from a rarity-tiered `pool`). **All numbers below are proposed
starting points — user-owned, tune freely.**

| Class \ Stage | **1 (C0–1)** | **2 (C2–5)** | **3 (C6–8)** | **4 (C9)** |
|---|---|---|---|---|
| **REGULAR** (Basic, Gym Trainer) | 2 faucet | 3 faucet · 12% `bonus.early` | 3 faucet · 18% `bonus.mid` | 3 faucet · 22% `bonus.mid` |
| **ACE** (Elite Trainer) | — | 5 faucet · 30% `bonus.mid` | 5 faucet · 40% `bonus.mid` · 8% rare | 5 faucet · 1 `bonus.mid` guaranteed · 12% rare |
| **BOSS — Gym Leader** | bundle (S1) | bundle (S2) | bundle (S3) | — |
| **BOSS — E4 / Champion** | — | — | — | bundle + 2 voucher rolls |
| **BOSS — Rival** | 3 faucet | 8 faucet · 25% `bonus.mid` | 8 faucet · 1 rare | 8 faucet · 1 rare |
| **BOSS — Mystery** | — | — | — | trophy bundle (§5.3) |

Reading: a `REGULAR` win in Stage 3 = 3 IV vitamins + an 18% chance at one `bonus.mid`
item (Ultra Ball / a Dojo voucher / Rare Candy / a held-item token). The faucet keeps the
EV/IV economy flowing (~120–150/run, matching the curve's §5c target); the bonus layer is
where "what can be additional gifts" lands.

Bosses keep authored bundles (the backbone), but those bundles move into `loot.json` and
are validated against `stageBudget` so they scale smoothly instead of by hand-feel.

---

## 5. Anti-frustration: gating, mailbox, pity, honesty

### 5.1 Derived gate (kills the leak + the drift)

```
voucherDebutCity(k) = FACILITY_DEBUT_CITY[ LOOT.items[k].redeemer ]   // computed, not typed
giftable(k)         = city >= voucherDebutCity(k) - 1                  // 1-city gateway grace
```

Result: `vitamin`→7, `abilityCapsule`/`emblemHonor`→1, `stoneToken`→3, `mint`→1 — all
correct, forever, with zero hand-maintenance.

### 5.2 Held-reward mailbox (kills the swallow)

When `_storyGrantLoot` meets an item whose `giftable` city isn't reached yet, it adds to
`sm.heldRewards` instead of dropping it, and the message says **"📦 held until <Facility>
opens"** rather than claiming the item. On entering the redeemer's city,
`_storyDeliverHeldRewards` moves it to inventory with a toast: **"📬 A held EV Voucher
arrived — the EV Trainer is open."** Nothing is lost; everything arrives exactly when it
becomes usable — the general solution to the whole "arrives too early" class.

> This subsumes the earlier open question about the 3 early EV-Voucher sites. With the
> mailbox, Dex-50 / casino / route-find can keep dropping an EV Voucher — it's simply
> *held and delivered at C7* instead of swallowed or carried-dead.

### 5.3 Trophy set-pieces stay special

Dex-100, Caged God, post-HoF Mystery remain distinct, high-value one-offs (moved to JSON,
messages corrected, `masterBall:0` dead-keys removed). The Master Ball stays uniquely tied
to the Caged God / villain arc.

### 5.4 Pity & determinism

- Rare/epic bonus draws increment `sm.lootPity`; after a tunable miss-streak the next
  eligible drop is forced. Prevents a player going a whole stage with no bonus.
- One seeded stream (`storyRngNext`-derived, salted by `sm.eventIndex`) for *all* draws —
  battle and non-battle alike — so replays are bit-identical.

---

## 6. "What can be additional gifts" — proposed new reward types

New entries for the bonus/trophy pools, chosen to **also** repair R2/R3 (tight economy,
paywalled facilities). All amounts user-owned.

| New gift | What it does | Fixes | Where it drops |
|---|---|---|---|
| **Held-Item Token** | redeem one held item (orb / choice / berry) free at Dept Store | held items are buy-only today | `bonus.mid`/`late` |
| **Service Pass — EV Trainer** | one free EV-Trainer session (= today's EV Voucher, renamed for clarity) | R3 paywall | mid/late bonus, gated→mailbox |
| **Service Pass — Colress** | one free battle-form awakening (= Wishing Piece) | R3 paywall | late bonus |
| **Safari Pass** | one free Safari entry (saves 10,000G) | R3 + catch variety | Stage-2/3 bonus |
| **Gold Cache (S/M/L)** | scaled coin drop, value from `stageBudget` | **R2** late tightness | route finds, ACE/Rival bonus |
| **Care Package** | small potion/revive kit | R2 (stops gold bleeding on consumables) | REGULAR bonus, late stages |
| **Ball Pouch** | tier-appropriate ball bundle (Great/Ultra by stage) | catch economy | Stage bonus |
| **EV Reset Charm** | wipe EVs (buy-only 3,000G today) | respec friction | rare trophy |
| **TM / Move-Tutor Voucher** | one free Move-Tutor lesson (= Heart Scale, renamed) | clarity | early/mid bonus |

The two **renames** (EV Voucher→"EV-Trainer Pass", Heart Scale→keep, but disambiguate the
`vitamin` *key*) also resolve the §1.6 naming collision.

---

## 7. Economy rebalance (resolves the open D3c)

Recommend **both** levers, lightly, rather than one hard one:
- **Faucet of gold caches** in the bonus layer (above) — a soft, RNG-smoothed faucet that
  scales by `stageBudget`, so late game stops being net-~560G/leader.
- **Care Packages** so consumables stop eating purses (the real cause of R2).
- Leave base purses mostly as-is (Champion/Mystery already peak); optionally nudge E1–4
  from 5,000 (user call). This keeps the curve's intended "league wall" intact while giving
  the player room to *experiment* with the 5,000G facilities (R3).

Exact budget numbers in `stageBudget` are yours to set; the system reads them.

---

## 8. Migration & test plan (sustainability rule)

New jsdom tests under `tests/` (the next session can't silently regress these):

1. **Gate correctness (property test):** for every item with a `redeemer`, it is never
   granted to inventory before `FACILITY_DEBUT_CITY[redeemer] - 1`. Sweeps the whole matrix.
2. **Mailbox delivery:** an item earned pre-facility lands in `sm.heldRewards`, then moves
   to inventory exactly on entering the redeemer city; never lost, never double-delivered.
3. **Message honesty:** the announced summary string equals the actually-granted delta.
4. **Determinism:** same seed + same path ⇒ identical loot sequence (battle and city paths).
5. **Budget sanity:** each stage's expected loot value is within tolerance of `stageBudget`.
6. **Save migration:** a pre-bump save loads, gains `sm.heldRewards = {}`, keeps existing
   inventory.

---

## 9. Phased, reversible rollout

| Phase | Content | Risk / approval |
|---|---|---|
| **A — Structural (no balance change)** | Extract all 10 systems' numbers to `loot.json` **1:1**; route everything through `_storyResolveLoot`/`_storyGrantLoot`; derive the gate from facility; add the mailbox + migration; fold in the 2 bypass sites; seed all RNG. | Behavior-preserving except the gate fix + mailbox (which *prevent* the leak/swallow). Diff-level sign-off; no number changes. |
| **B — Matrix & rarity** | Replace flat faucet/casino logic with the (class × stage) matrix + rarity ladder + pity. | Balance change → number sign-off. |
| **C — New gifts & economy** | Add the §6 gift types + `stageBudget` gold/care-package faucet (R2/R3). | Balance change → number sign-off. |
| **D — Polish** | Renames (naming collision), copy pass, casino %→JSON, validation/telemetry harness, docs refresh (curve doc §2h/§2i, the stale CSVs). | Low risk. |

Each phase is independently shippable and revertible. Phase A alone already fixes the
user's original complaint (leak + arrives-too-early) the *right* way.

---

## 10. Decisions needed from the maintainer

- **D1 — Build depth:** full data-driven engine (A→D), or stop after Phase A (just fix the
  leak + mailbox, keep the rest as-is)?
- **D2 — Matrix granularity:** 3 classes (REGULAR/ACE/BOSS) × 4 stages (12 cells, simplest),
  or finer rows (split Gym-Leader / E4 / Champion / Rival / Mystery)?
- **D3 — Mailbox vs re-item** for pre-facility rewards: hold-and-deliver (recommended), or
  re-item those sites to stage-appropriate gifts so nothing is ever deferred?
- **D4 — Economy:** add the gold-cache + care-package faucet (recommended), bump base
  purses, or leave the late economy as-is?
- **D5 — New gift types:** which of the §6 list to adopt (all / a subset)?
- **D6 — Determinism & pity:** adopt seeded-everywhere + bad-luck protection now, or defer
  to Phase D?
