# Story-Mode Item System Overhaul — design spec

> **Status:** Phase 1 **IMPLEMENTED** (Potion-line regen + Ether/Elixir cut + Ultra Ball
> featured; tests in `tests/suites/potion-regen.test.js`). Decisions resolved in §11.
> Phase 2 (enemy item scaling) is outlined in §10 and is NOT started yet.
> Prices kept at current values; any reprice is the maintainer's call (per CLAUDE.md).
>
> **How to edit the catalog:** the shop catalog is data-driven. Edit
> `docs/story-design/story-shops.csv`, then run
> `node scripts/build/generate-shop-catalogs.mjs` to regenerate
> `data/story/shops.json`. Do **not** hand-edit the JSON. Item *effects* (the
> `effect` string) resolve in `applyBagItem` (battle.html:53944); over-time effects
> add an end-of-turn tick in `endOfTurnEffects` (battle.html:28690), modeled on the
> Aqua Ring block (28818).

---

## 1. The loop — why items live or die here

Three facts govern whether any consumable is fun or dead weight:

1. **Auto-heal between fights is by design.** `_storyFullHealPartySlots()` wipes
   HP / PP / status / consumed-items to full on every city return and after every
   win. → **Out-of-battle healing is worthless.**
2. **There is a working in-battle bag.** `BAG` → `openBag()` → `openBattleBag()`.
   Using an item **costs your turn**, **one item per turn**
   (`state.storyItemUsedThisTurn`). The one exception is the `mega` (instant-use)
   tier, which does **not** cost the turn.
3. **Flat Lv50, no levels.** Battles are won on tempo / type / build, not attrition.
   A heal that restores less than a turn of incoming damage is a losing trade.

**Corollary:** every item must be worth more than *a turn of attacking or
switching*. Small flat instant heals (20, 60 HP) fail this test — which is exactly
why Potion / Super Potion are dead weight today.

## 2. The naming constraint (what we may and may not call things)

Three whole item layers are **already implemented** and own their names. New
consumables must **not** collide with them:

| Layer | Where | Examples — DO NOT reuse as consumables |
|---|---|---|
| **Held items + Berries** | `data/items.json` (Showdown dex), equipped at the **Battle Dojo** | Leftovers, Big Root, Light Clay, Focus Sash, Focus Band, Shell Bell, Life Orb, Choice items, Eviolite, **every berry** (Sitrus, Lum, Oran, Leppa, Cheri…) |
| **Vitamins → repurposed to IV** | story training | HP Up, Protein, Iron, Calcium, Zinc, Carbos |
| **Rare Candy → repurposed to voucher** | story economy | Rare Candy |
| **Evolution / trade items** | Stone shop (`story-shops.csv`) | Fire/Water/Thunder/Leaf/Moon/Sun/Ice/Shiny/Dusk/Dawn Stone, Metal Coat, King's Rock, … |

→ **The earlier draft of this doc was wrong:** it proposed "Sitrus Berry / Lum
Berry / Focus Sash / Big Root / Light Clay" *consumables* and generic "Salve"
names. All five collide with held items, and their mechanics (%-regen, cleanse,
endure, lifesteal, shield) are **already covered by the held-item layer**. Per the
maintainer rule *"don't add things for the sake of adding,"* those mechanics are
**dropped** from the consumable system. New consumables use **real Pokémon bag
items we don't have yet** (Appendix A).

## 3. What ALREADY exists (do not rebuild)

- **Mega / Ultra "featured" items.** `getStoryFeaturedItems()` (battle.html:33612)
  generates `mega_<id>` (instant-use, does not end turn) and `ultra_<id>` (effect
  ×2 via `effMul`) from `FEATURED_MEGA_ITEM_IDS` / `FEATURED_ULTRA_ITEM_IDS`
  (33588 / 33594).
- **Featured = a random pool, one buy per city.** `_ensureDeptItemOfferForCity()`
  (battle.html:51342) draws a few featured items per city; the player buys from
  that roll. Purchases tracked in `sm.deptShopPurchasedByCity`. Featured price =
  **base × 2** (test: `tests/suites/dept-featured-pricing.test.js`).
- **Enemy trainers use items mid-battle.** `buildFoeStoryInventoryForBattle()`
  builds `{maxPotion, fullRestore, fullHeal, revive, maxRevive}` per battle —
  badge-gated, difficulty-scaled, boss-specific; `tryFoeStoryBattleItem()` spends
  them (and the foe's turn). Enemies do **not** use Mega/Ultra yet → Phase 2 (§10).
- **The tier engine.** `applyBagItem` already reads `item.tier`: `ultra` ⇒
  `effMul = 2`; `mega` ⇒ `instantUse = true`. New effects only need to *respect
  `effMul`* and they get Ultra/Mega versions for free.

## 4. Design principles

1. **Every item beats a turn.** No filler heals.
2. **Diversity = different mechanical *shapes*,** not more numbers: over-time vs
   instant, flat vs %-of-maxHP, single-target vs party-wide.
3. **Real Pokémon names only.** A new mechanic ships on a recognizable bag item we
   don't already have — never a generic name, never a held-item dupe.
4. **Gold-sink pricing** scaled by usefulness; staples affordable, premium scarce,
   the featured roll *accessible* (×2) so it stays exciting.
5. **Data-driven catalog** (CSV), mechanics in code with a deterministic test.

## 5. The healing system — two real shapes

The maintainer's final call (after weighing flat vs %, and one line vs two):
**repurpose ONLY the Potion line into a %-of-maxHP regen; drop the drink/herbal line
entirely.** Flat *instant* healing is dead (Max Potion / Full Restore own the burst
niche), and a second regen line was "complexity for little gain." **% over flat**
because it scales with max HP, and a *static flat* 1/16 would just clone Leftovers
(a held item).

**The one mechanic — `bagRegen`:** each Potion restores a **fixed fraction of max HP
at the end of every turn, equally, for 3 turns.** The *tiers* double:

| Item | Per-turn heal | 3-turn total | Effect string |
|---|---|---|---|
| **Potion** | 1/16 max HP | ~19% | `regen16` |
| **Super Potion** | 1/8 max HP | ~37% | `regen8` |
| **Hyper Potion** | 1/4 max HP | ~75% | `regen4` |

- Stored as `mon.volatile.bagRegen = {pct, turns:3}`; set in `applyBagItem`; ticks in
  `endOfTurnEffects` right after the Aqua Ring block; **clears on switch-out**
  (`clearVolatileOnSwitch`) so it can't be banked. Ultra ⇒ `pct × 2` (effMul); Mega ⇒
  apply without ending the turn. Status chip + summary pill mirror Aqua Ring's.
- Hyper tops out at ~75% over 3 turns, so it never steps on Max Potion's instant-full.
- Distinct from the held **Leftovers** (flat 1/16, permanent, passive): this is a bag
  consumable that costs a turn, scales by tier, and lasts only 3 turns.

**Why this is enough (no filler):** regen (sustain — Potion line), instant-full burst
(Max Potion), full + cure (Full Restore), cure (Full Heal), the revive ladder. The
drink/herbal %-heal line, Sacred Ash, and Lava Cookie were each considered and **cut**
to keep the system lean (§11); the held-item layer already owns cleanse / endure /
lifesteal / shield / berries (§2).

## 6. New non-healing addition (the one that shipped)

| Item | Effect | Placement | Notes |
|---|---|---|---|
| **Ultra Ball** | catch 2× vs Poké Ball | **Featured pool**, price **1500** | `_CATCH_BALL_MULT.ultra = 2.0` already exists; `sm.balls.ultra` is already a reward currency. This just adds a gold purchase path, isolated to `_getDeptFeaturedCatalogItems()` so it never leaks into the battle/city bag. One-per-city (the `ultra_` id prefix marks it featured for the purchase lock). **Master Ball stays gift-only** (villain-story reward) — *not* in any shop. |

**Considered and cut** (kept lean per the maintainer): **Sacred Ash** (mass-revive — even
the "1 HP" variant judged not worth it), **Lava Cookie** (Safeguard-in-a-treat — Full
Heal + Guard Spec already cover status utility), and the whole **drink/herbal %-heal
line** (Soda Pop / Moomoo Milk / Energy Root — a second healing shape was "complexity
for little gain"). Their research notes live in Appendix A.

### 6.1 Catch / encounter items — investigated, not adopted (with reasons)
Maintainer floated catch-rate boosters ("incense +25% catch for 3 throws") and
force/increase-encounter items. The code says these don't fit:
- **Catch math = `baseRate(grade) × ballMult`** (battle.html:50616) — **no HP, status,
  or turn factor.** The only catch lever is the *ball*. A "+25% catch" consumable
  would be a brand-new multiplier with **no real-item name** (catch boosters are GO
  berries / held items, both 🔒 taken), and it would overlap the ball lineup.
  → **Met by Ultra Ball instead** (real name, already-plumbed ×2). Master Ball
  (guaranteed) remains the boss-reward top end.
- **Encounter-rate / force-encounter** (Lure / White Flute / Honey): **each wild
  route surfaces exactly one curated Pokémon** (`STORY_MODE_FLOW` canon) and the
  Safari Zone is a self-contained session with its own balls + Bait/Rock. There is
  **no encounter-spam loop** for these to modify, and a "re-roll the wild" item
  would touch story flow (a sensitive area). → **Skip.**
- **Incenses** specifically are **held items** in `data/items.json` (🔒 taken).

## 7. Cut

- **Ether, Elixir** — dead in single-battle play (you never run out of PP in a Lv50
  sprint). **Max Elixir retained** as the lone niche PP item.

## 8. Final catalog (as shipped)

### PokéMart — *common, spammable staples*
| Item | Effect string | Price | Change |
|---|---|---|---|
| Poké Ball | `ball` | 300 | unchanged (reprice to 500 is an open suggestion — §11.3) |
| Potion | `regen16` (1/16 ×3) | 200 | effect changed (was `heal20`), **price kept** |
| Super Potion | `regen8` (1/8 ×3) | 500 | effect changed (was `heal60`), price kept |
| Hyper Potion | `regen4` (1/4 ×3) | 1000 | effect changed (was `heal120`), price kept |
| Max Potion | `healFull` | 1500 | kept |
| Full Restore | `fullRestore` | 2000 | kept |
| Full Heal | `cureStatus` | 300 | kept |
| Max Elixir | `elixirFull` | 1500 | kept (lone PP item) |
| X Attack / Defense / Sp.Atk / Sp.Def / Speed / Accuracy | `x*` (+2 stage) | 1000 ea | kept |
| Dire Hit | `direHit` | 400 | kept |
| Guard Spec. | `guardSpec` | 450 | kept |
| ~~Ether~~ / ~~Elixir~~ | — | — | **cut** |

*(Max Potion / Full Restore live in the `pokemart` CSV section; the Department Store
shows PokéMart + Dept items together, so they appear in both.)*

### Department Store — *rarer, premium (unchanged this pass)*
Great Ball 1000 · Revival Herb 1200 · Revive 2500 · Max Revive 4000 · 8 Orbs 1000 ea ·
Emergency Teleporter 800 · EV Reset Charm 3000.

### Featured — *random pool of 3/city, 1-buy, Dept only (price = base × 2)*
- Mega/Ultra versions of the eligible items (existing engine, unchanged).
- **Ultra Ball @ 1500** — added to `_getDeptFeaturedCatalogItems()` (routes to `sm.balls.ultra`).
- **No Master Ball.**

## 9. Pricing rationale
- **Prices kept at current values this pass.** The only behavioural change is the
  Potion *effect* (regen); balance numbers are maintainer-owned, so the regen Potions
  stay at 200 / 500 / 1000 until the maintainer picks new ones.
- **Open suggestions** (one-line CSV edits when wanted): Poké Ball 300→500 (gold
  pressure); reprice the now-stronger regen Potions (e.g. 350 / 700 / 1400).
- **Featured stays ×2**; Ultra Ball is a flat **1500** (no base shelf price).

## 10. Phase 2 — enemy item usage & difficulty scaling (outline, not started)
Extends `buildFoeStoryInventoryForBattle()` / `tryFoeStoryBattleItem()`:
- **Item access:** today HP/cure/revive only. Add a curated subset (regen Potion,
  %-heal, X-items) so enemies feel smarter, gated by city/badge.
- **Unlock timing:** mirror the existing badge curve (first heal at 4 badges); layer
  new items in mid-game so challenge ramps city-by-city.
- **Mega/Ultra for enemies:** the new "difficulty layer" — let late bosses (E4 /
  Champion / Mystery, or Hard+) draw a single instant/double item. **Never** give
  enemies Sacred Ash (no enemy mass-revive).
All Phase-2 numbers are maintainer-owned and get their own decision pass.

## 11. Decisions — resolved

- **11.1 Healing shape → %-of-maxHP regen, Potion line ONLY.** Static per-turn (equal
  each turn), 3 turns; tiers double (Potion 1/16 · Super 1/8 · Hyper 1/4). The
  drink/herbal %-heal line (Soda Pop / Moomoo Milk / Energy Root) was **cut** — a second
  healing shape was "complexity for little gain." Flat rejected (clones the held
  Leftovers, trivial on bulky mons).
- **11.2 Sacred Ash → cut.** Even the 1-HP anti-wipe variant was judged not worth it.
- **11.3 Cuts & prices.** Ether + Elixir **cut**, Max Elixir kept. Prices **kept**;
  Poké Ball 300→500 and regen-Potion repricing remain optional maintainer tweaks.
- **11.4 Lava Cookie → cut.** Full Heal (cure) + Guard Spec (stat-drop block) already
  cover status utility.
- **11.5 Catch / encounter items → skip.** No formula/loop hook (catch = grade × ball;
  one wild per route). **Ultra Ball** is the real-named catch lever. See §6.1.

---

## Appendix A — Staple Pokémon consumables inventory (the full menu)

Every well-known consumable bag item from the main-series games, with its status
here. Legend: ✅ have · 🔒 taken (held/repurposed) · 🆓 free to adapt · ➖ N/A to our
single-battle loop.

> **Note:** the "Plan" cells below capture the *initial research* (candidates we
> considered, e.g. the drink/herbal %-heal line and Sacred Ash). The **final, shipped
> decisions are in §11** — most of these candidates were cut to keep Phase 1 lean. Only
> the Potion-line regen, the Ether/Elixir cut, and the Ultra Ball shipped.

### A1. HP restore — instant flat
| Item | Real effect | Status | Plan |
|---|---|---|---|
| Potion | 20 HP | ✅ | → **flat regen 20×3** (§5A) |
| Super Potion | 50–60 HP | ✅ | → **flat regen 40×3** |
| Hyper Potion | 120–200 HP | ✅ | → **flat regen 60×3** |
| Max Potion | full HP | ✅ | keep (instant full) |
| Full Restore | full HP + cure | ✅ | keep |
| Fresh Water | 50 HP | 🆓 | drink line — alt %-heal candidate |
| Soda Pop | 60 HP | 🆓 | → **%-heal ¼** (§5B) |
| Lemonade | 80 HP | 🆓 | drink line — alt %-heal candidate |
| Moomoo Milk | 100 HP | 🆓 | → **%-heal ½** (§5B) |
| Berry Juice | 20 HP | 🆓 | obscure; skip |
| Sweet Heart | 20 HP | 🆓 | obscure; skip |

### A2. HP restore — herbal (bitter)
| Item | Real effect | Status | Plan |
|---|---|---|---|
| Energy Powder | 50–60 HP | 🆓 | herbal; redundant w/ Soda Pop; skip |
| Energy Root | 120–200 HP | 🆓 | → **%-heal ¾** (§5B); pairs w/ Revival Herb's herbal flavor |
| Heal Powder | cure status | 🆓 | redundant w/ Full Heal; skip |
| Revival Herb | revive + full HP | ✅ | keep (our version revives to 30%) |

### A3. Revive
| Item | Real effect | Status | Plan |
|---|---|---|---|
| Revive | revive 50% | ✅ | keep |
| Max Revive | revive 100% | ✅ | keep |
| **Sacred Ash** | revive **all** party + full | 🆓 | **ADD** (§6, §11.2) |

### A4. PP restore
| Item | Real effect | Status | Plan |
|---|---|---|---|
| Ether / Max Ether | restore PP, one move | ✅ (Ether) | **cut Ether** |
| Elixir | restore PP, all moves | ✅ | **cut** |
| Max Elixir | full PP, all moves | ✅ | keep (lone PP item) |
| PP Up / PP Max | permanent +max PP | ➖ | not battle-use |

### A5. Status cure
| Item | Real effect | Status | Plan |
|---|---|---|---|
| Full Heal | cure all status | ✅ | keep |
| Antidote / Burn Heal / Ice Heal / Awakening / Paralyze Heal | cure one status | 🆓 | redundant w/ Full Heal; skip |
| **Lava Cookie** | cure all status (regional treat) | 🆓 | **ADD with a twist** → `statusImmune5` (Safeguard, no cure) instead of a Full Heal dupe (§6) |
| Old Gateau / Casteliacone / Lumiose Galette / Shalour Sable / Big Malasada / Rage Candy Bar / Pewter Crunchies | cure all status (regional treats) | 🆓 | flavor-only dupes of Full Heal; skip (a *second* treat could be cure+stat-buff later — §11.4) |

### A6. In-battle stat items (X-items)
| Item | Real effect | Status |
|---|---|---|
| X Attack / Defense / Sp.Atk / Sp.Def / Speed / Accuracy | +stage, one battle | ✅ complete |
| Dire Hit | +crit ratio | ✅ |
| Guard Spec. | block stat drops | ✅ |
| Ability/Item/Reset Urge, Item Drop | obscure | ➖ skip |

### A7. Poké Balls
| Item | Status | Plan |
|---|---|---|
| Poké Ball / Great Ball | ✅ in shop | keep |
| **Ultra Ball** | gift-only today | **ADD to featured @1500** (§6) |
| Master Ball | villain-story gift | **keep gift-only** (not in shop) |
| Premier / Net / Dive / Nest / Repeat / Timer / Luxury / Dusk / Heal / Quick … | ➖ | not in scope |

### A8. Held items / Berries / Vitamins / Rare Candy — 🔒 TAKEN (§2)
All berries, Leftovers, Big Root, Light Clay, Focus Sash, Focus Band, Shell Bell,
Life Orb, Choice items, Eviolite, Assault Vest, Rocky Helmet, etc. = **held items**
(Battle Dojo). Vitamins = **IV training**. Rare Candy = **voucher**. Evolution &
trade-evo items = **Stone shop**. None are available for the consumable system.

### A9. Field / overworld — ➖ N/A to a single-battle loop
Repel / Super Repel / Max Repel, Escape Rope, Poké Doll / Fluffy Tail / Poké Toy
(flee — we have Emergency Teleporter), Lure line, Honey.
