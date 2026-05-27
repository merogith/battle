# Evolution Flow & Onboarding Rebuild — Plan Doc

> **Status:** Plan — review before implementation
> **Author session:** 2026-05-22, branch `claude/gracious-mayer-H31zi`
> **Scope:** Restructure the evolution path (Stone Sage + Cable Link + new Stone
> Shop), tie every facility to a one-shot themed intro + voucher reward, and gate
> route progression on having ticked the new intros at least once.

This doc is the single source of truth for the rebuild. It is sized to be
fanned out to multiple agents — each section below has an explicit owner-agent
contract, the files/lines to touch, and a "definition of done" so independent
work doesn't collide.

---

## 1. One-screen summary

| System | Before | After |
|---|---|---|
| Stone Sage | Every city from City 0. Sage "provides" stones / handles trades as part of the gold fee. | Unlocks at **City 2** onward. Requires **player-owned stone** in inventory for stone evos. Requires **Cable Link visited this city** for trade evos. |
| Cable Link Station | Every city from City 0. Premium reroll/upgrade/rebuild. | Unlocks at **City 2** onward. Same premium options. Doubles as the "trade arrangement room" for Sage trade evos. |
| Stone Shop ("Stone Emporium") | Does not exist. | New facility. **Always available from City 2 onward.** Sells 8 stones + 11 trade items at **500G each** with a buy-confirm modal. |
| Trade-evo flow | One-click at Sage, gold-only. | Sage gates the button if Cable Link hasn't been visited this city. Player walks over, opens Link Station (auto-marks), walks back. Sage unlocks the trade evo. |
| Pre-City 2 NPCs | None. | Two cold-open tutorial scenes: **Bill** (Cable Link intro + 50% discount voucher) and **Stonewise Granny** (Stone Sage intro + free-stone voucher). Both fire on first arrival at City 2. |
| Per-facility first-use rewards | Spot rewards exist for Artifact (City 0 free relic) and Fan Club (welcome vitamin pack). | Every facility intro grants a single themed voucher: "first free X" or "1-time 50% discount." See §3 voucher table. |
| Force-visit gates | "Visit Professor first" blocks Leave City. | New: "Visit Cable Link + Move Tutor" (and Stone Shop the first time it unlocks) blocks Leave City **once**, per facility, on the city where it first appears. After the one-time intro, no further gating — players are introduced exactly once. |
| Free-first-of-its-kind | Artifact = first free in City 0. | Pokémart (City 0): one free Poké Ball. Pokémon Center (City 0): one free Potion. Artifact (City 0): first free relic (unchanged). Cable Link (City 2): 50% discount voucher one-time. Stone Shop (City 2): 1 free stone voucher. Move Tutor (City 2): 1 free TM. Same for every other facility on its debut city. |

---

## 2. City-by-city facility map (after the change)

`STORY_EVENTS_RAW` (`battle.html:27975-28043`) drives which facility buttons
render per-city. The *deltas* below are the only edits to that array.

| City idx | Hub kind | Action list (after) |
|---|---|---|
| 0 (Pallet) | Pre-gym | Professor, **Pokemart**, Move Tutor, Nature Rater, Leave City |
| 1 (Gym 1 pre) | Pre-gym | Professor, **Pokemart**, Gym Battle, Leave City |
| 1 (Gym 1 post) | Post-gym | Pokemart, Leave City |
| **2 (Gym 2 pre)** | **Pre-gym — DEBUT BAND** | Professor, **Cable Link**, **Evolution Tutor**, **Stone Shop**, Pokemart, Move Tutor, Gym Battle, Leave City |
| 2 (Gym 2 post) | Post-gym | Cable Link, Evolution Tutor, Stone Shop, Pokemart, Move Tutor, Leave City |
| 3..8 | Pre/post gym | (unchanged where Cable Link / Evolution Tutor / Stone Shop already eligible — Stone Shop is added to every City 2+ entry) |
| 9 (League) | League hub | Add Stone Shop |

**Removals (strict):**
- City 0 (idx 0): remove `Link Station`, `Evolution Tutor`.
- City 1 pre & post (idx 3 & 6): remove `Link Station`, `Evolution Tutor`.

**Additions (strict):**
- City 2 pre & post: add `Stone Shop`.
- City 3..9 (every entry): add `Stone Shop`.

`getCityIndex` / `cityIndexFromEventIndex` remain unchanged. Nothing in the gym
curve, badge cap, or Professor visibility logic needs touching — we are
strictly adding/removing strings to action arrays.

---

## 3. Voucher economy table

All vouchers are **earned-not-bought**, **one-time per run**, **balanced to one
free use of the facility**. Naming leans on Pokémon canon for flavor.

| Voucher id | Display name | Granted on | Effect | Owner system |
|---|---|---|---|---|
| `pokeBall` (×1) | Welcome Poké Ball | First visit, Pokémart City 0 | Adds 1 Poké Ball. | Pokémart intro |
| `potion` (×1) (battle bag) | Welcome Potion | First visit, Pokémon Center City 0 | Adds 1 Potion to battle bag. | Pokémon Center intro |
| (existing) Artifact free | Pallet Relic | First Artifact purchase, City 0 | Free relic claim. | Unchanged (`artifactFreeClaimUsed`). |
| **`linkDiscount50` (new)** | **"Bill's Discount Card"** | Bill's cold-open at City 2 entry | Halves the gold cost of **one** Cable Link action (Reroll / Upgrade / Rebuild). Consumed on use. | Cable Link intro |
| **`stoneToken` (new)** | **"Stonewise Token"** | Granny's cold-open at City 2 entry | Redeem at Stone Shop for **1 free item of choice** (any stone or trade item). Consumed on redemption. | Stone Shop intro |
| **`tutorVoucherTM` (rename of existing flow)** | "Move Tutor Pass" | First visit, Move Tutor City 2 | Free single Move Tutor lesson. *(Already covered by `heartScale` semantics; we just gift one on first visit instead of via gym-drop.)* | Move Tutor intro |
| (existing) `mint` | Nature Mint | First visit, Nature Rater City 3 | Waives one Nature change. (Already exists in inventory; just gift one on first visit.) | Nature Rater intro |
| (existing) `emblemHonor` | Dojo Emblem | First visit, Battle Dojo City 4 | Waives one item/ability swap. (Already exists; gift one on first visit.) | Battle Dojo intro |
| (existing) `vitamin` | EV Welcome Pack | First visit, EV Trainer City 4 | Waives one EV preset application. (Already exists; gift one.) | EV Trainer intro |
| (existing) Safari free first | Already exists — first Safari run is free. | First visit, Safari Zone City 4 | Free entry. | Safari intro (unchanged). |
| **`casinoChip500` (new)** | **"Lucky Chip"** | First visit, Game Corner City 5 | Free 500G spin/bet credit (one-shot). | Casino intro |
| (existing) `wishingPiece` | Wishing Piece | Gym 5 (existing) + first Colress visit | Mega/Z/Dyna voucher. Unchanged. | Colress intro (unchanged). |
| (existing) Pokédex milestones | Unchanged. | Catching 25 / 50 / 75 / 100 species. | (Unchanged) | Unchanged. |

> **Rule:** Every voucher is granted **inside the intro tutorial overlay's Continue
> handler**, so it never fires before the player has seen the corresponding
> mechanic taught. This satisfies the user's "no EV gift before EV Trainer
> unlocked" constraint.

### Two new voucher keys

Add to `VOUCHER_KEYS` (`battle.html:37361`):

```js
const VOUCHER_KEYS = ['rareCandy', 'vitamin', 'heartScale', 'mint',
                      'abilityCapsule', 'emblemHonor', 'wishingPiece',
                      'linkDiscount50', 'stoneToken', 'casinoChip500'];
```

Add display name + sprite icon entries to the `VOUCHER_LABELS` / sprite map
near `battle.html:41364-41385`. Reuse existing item sprites where possible
(linkDiscount50 → existing `link-cable` icon; stoneToken → `everstone.png`;
casinoChip500 → coin icon).

---

## 4. Stone Shop — new facility

### 4.1 Data tables (new)

Add near `POKEMART_ITEMS` (`battle.html:28882`):

```js
const STONE_SHOP_ITEMS = [
  // Evolution stones (Stone Sage stone-evo requirements)
  { id:'fireStone',     name:'Fire Stone',     price:500, kind:'stone', stone:'Fire Stone',     desc:'A stone that radiates heat. Used to evolve certain Pokémon.' },
  { id:'waterStone',    name:'Water Stone',    price:500, kind:'stone', stone:'Water Stone',    desc:'A clear, cool stone. Used to evolve certain Pokémon.' },
  { id:'thunderStone',  name:'Thunder Stone',  price:500, kind:'stone', stone:'Thunder Stone',  desc:'A stone that crackles with energy. Used to evolve certain Pokémon.' },
  { id:'leafStone',     name:'Leaf Stone',     price:500, kind:'stone', stone:'Leaf Stone',     desc:'A stone with a leaf pattern. Used to evolve certain Pokémon.' },
  { id:'moonStone',     name:'Moon Stone',     price:500, kind:'stone', stone:'Moon Stone',     desc:'A stone that glows under moonlight. Used to evolve certain Pokémon.' },
  { id:'sunStone',      name:'Sun Stone',      price:500, kind:'stone', stone:'Sun Stone',      desc:'A stone shaped like the sun. Used to evolve certain Pokémon.' },
  { id:'iceStone',      name:'Ice Stone',      price:500, kind:'stone', stone:'Ice Stone',      desc:'A stone with an icy aura. Used to evolve certain Pokémon.' },
  { id:'shinyStone',    name:'Shiny Stone',    price:500, kind:'stone', stone:'Shiny Stone',    desc:'A radiant stone. Used to evolve certain Pokémon.' },
  { id:'duskStone',     name:'Dusk Stone',     price:500, kind:'stone', stone:'Dusk Stone',     desc:'A stone full of dark night. Used to evolve certain Pokémon.' },
  { id:'dawnStone',     name:'Dawn Stone',     price:500, kind:'stone', stone:'Dawn Stone',     desc:'A stone that sparkles like the dawn. Used to evolve certain Pokémon.' },
  // Trade-item evolutions (Stone Sage trade-evo requirements)
  { id:'metalCoat',     name:'Metal Coat',     price:500, kind:'tradeItem', tradeItem:'Metal Coat',       desc:'A metallic film. Held while traded, it triggers evolution.' },
  { id:'dragonScale',   name:'Dragon Scale',   price:500, kind:'tradeItem', tradeItem:'Dragon Scale',     desc:'A tough scale. Held while traded, it triggers evolution.' },
  { id:'kingsRock',     name:"King's Rock",    price:500, kind:'tradeItem', tradeItem:"King's Rock",      desc:'A regal stone. Held while traded, it triggers evolution.' },
  { id:'upGrade',       name:'Up-Grade',       price:500, kind:'tradeItem', tradeItem:'Up-Grade',         desc:'A peculiar disc. Held while traded, it triggers evolution.' },
  { id:'dubiousDisc',   name:'Dubious Disc',   price:500, kind:'tradeItem', tradeItem:'Dubious Disc',     desc:'A suspicious disc. Held while traded, it triggers evolution.' },
  { id:'protector',     name:'Protector',      price:500, kind:'tradeItem', tradeItem:'Protector',        desc:'A heavy plate. Held while traded, it triggers evolution.' },
  { id:'electirizer',   name:'Electirizer',    price:500, kind:'tradeItem', tradeItem:'Electirizer',      desc:'A boxed electric charge. Held while traded, it triggers evolution.' },
  { id:'magmarizer',    name:'Magmarizer',     price:500, kind:'tradeItem', tradeItem:'Magmarizer',       desc:'A boxed magma core. Held while traded, it triggers evolution.' },
  { id:'reaperCloth',   name:'Reaper Cloth',   price:500, kind:'tradeItem', tradeItem:'Reaper Cloth',     desc:'A torn cloth. Held while traded, it triggers evolution.' },
  { id:'deepSeaTooth',  name:'Deep Sea Tooth', price:500, kind:'tradeItem', tradeItem:'Deep Sea Tooth',   desc:'A fang from the deep. Held while traded, it triggers evolution.' },
  { id:'deepSeaScale',  name:'Deep Sea Scale', price:500, kind:'tradeItem', tradeItem:'Deep Sea Scale',   desc:'A scale from the deep. Held while traded, it triggers evolution.' },
  { id:'prismScale',    name:'Prism Scale',    price:500, kind:'tradeItem', tradeItem:'Prism Scale',      desc:'A rainbow scale. Held while traded, it triggers evolution.' },
  { id:'sachet',        name:'Sachet',         price:500, kind:'tradeItem', tradeItem:'Sachet',           desc:'A fragrant pouch. Held while traded, it triggers evolution.' },
  { id:'whippedDream',  name:'Whipped Dream',  price:500, kind:'tradeItem', tradeItem:'Whipped Dream',    desc:'A sweet cream. Held while traded, it triggers evolution.' },
];
```

> **Note:** stones / trade items use **new inventory ids** in `sm.inventory.*`.
> They are *not* held items — they are consumed by Stone Sage on evolution.

### 4.2 UI screen

New screen `screen-story-stone-shop` (HTML markup follows the
`screen-story-artifact-shop` template at `battle.html:7864`). Single grid of 24
items, each with:

- Sprite (32×32, reuses `sprites/pokesprite/items/<id>.png`)
- Name, type tag (Stone / Trade Item), description
- Price (500G) and Buy button
- **Always shows confirm dialog** via `_storyConfirmTutorChange('Buy Fire Stone for 500G?', 500)` — no silent buys.

If player has `stoneToken` voucher, render a **"Redeem Token"** button on each
item (stones and trade items) — opens the same confirm dialog with the voucher
consumed instead of gold. Token cost = 0, cost text reads `Free — Stonewise
Token` in purple.

### 4.3 Wire-in

- New `enterStoneShop()` function next to `enterArtifactShop()` (`battle.html:41063`)
- New `_markFacilitySeen('stoneShop')` + tutorial intro
- `renderCityActions` (`battle.html:36193+`): add `if (actions.includes('Stone Shop')) { _push('shop', makeActionBtn('💎 Stone Emporium', ...)) }`
- Action lists in `STORY_EVENTS_RAW`: see §2 above.

### 4.4 Always-available rule

The user requirement is "always available after 2nd city". The action list
already enumerates per-city, so adding `'Stone Shop'` to every city from idx 2
onward is the literal implementation — there is no global toggle. Post-gym
hubs included.

---

## 5. Stone Sage — flow rewire

### 5.1 Stone-evo flow

**Before:** Sage absorbs the stone cost into the gold fee.
**After:** Sage requires the player to **own the stone** in inventory.

In `enterEvolutionLab` → `renderEvoLabTeam` (`battle.html:42603+`), for each
evo card whose target is in `EVO_STONE_REQ`:

```js
const stone = EVO_STONE_REQ[e.name]; // 'Fire Stone' etc.
const stoneId = STONE_NAME_TO_ID[stone]; // 'fireStone' etc.
const haveStone = (sm.inventory[stoneId] | 0) > 0;
if (!haveStone) {
  // Render the card with a "Need: Fire Stone — Buy at Stone Emporium" badge.
  // Button is disabled with title "You need a Fire Stone. Pick one up at the Stone Emporium (500G)."
}
```

On Evolve click for a stone evo: consume `sm.inventory[stoneId]--`, then pay
gold cost (already computed by `_evoCostFor`), then proceed with the existing
`_evoLabApplyEvolutionWithAnim` flow.

### 5.2 Trade-evo flow

**Before:** Sage absorbs the trade item / trade handshake into the gold fee.
**After:** Sage requires `_isFacilitySeen(cityIdx, 'link')` to be true for this
city. For trade-while-holding (e.g., `EVO_TRADE_REQ[Steelix] = 'Metal Coat'`),
ALSO requires the trade item in inventory.

```js
const trade = EVO_TRADE_REQ[e.name];
const linkSeen = _isFacilitySeen(cityIdx, 'link');
if (trade && !linkSeen) {
  // Render card disabled with badge "Visit Cable Link this city to arrange the trade."
}
if (typeof trade === 'string') {
  const tradeId = TRADE_ITEM_NAME_TO_ID[trade];
  const haveItem = (sm.inventory[tradeId] | 0) > 0;
  // gate on linkSeen AND haveItem, both badges shown.
}
```

On Evolve click for a trade evo: consume trade item if applicable, pay gold,
proceed.

### 5.3 Lookup maps

New const tables next to `EVO_STONE_REQ`:

```js
const STONE_NAME_TO_ID = {
  'Fire Stone':'fireStone', 'Water Stone':'waterStone', 'Thunder Stone':'thunderStone',
  'Leaf Stone':'leafStone', 'Moon Stone':'moonStone', 'Sun Stone':'sunStone',
  'Ice Stone':'iceStone', 'Shiny Stone':'shinyStone',
  'Dusk Stone':'duskStone', 'Dawn Stone':'dawnStone',
};
const TRADE_ITEM_NAME_TO_ID = {
  'Metal Coat':'metalCoat', 'Dragon Scale':'dragonScale', "King's Rock":'kingsRock',
  'Up-Grade':'upGrade', 'Dubious Disc':'dubiousDisc', 'Protector':'protector',
  'Electirizer':'electirizer', 'Magmarizer':'magmarizer', 'Reaper Cloth':'reaperCloth',
  'Deep Sea Tooth':'deepSeaTooth', 'Deep Sea Scale':'deepSeaScale',
  'Prism Scale':'prismScale', 'Sachet':'sachet', 'Whipped Dream':'whippedDream',
};
```

### 5.4 Dialogue

`_evoFlavorLine(evoName)` (`battle.html:42516`) already produces themed lines.
Update the stone branch to read:

> Stone Sage: "Ah, Vileplume. The Leaf Stone you carry will do nicely — set it on the altar."

And the trade branch (when Cable Link not seen):

> Stone Sage: "Alakazam? The lore wants a trade — walk to the Cable Link Station, let the signal hum once. Come back and the evolution remembers."

When Cable Link IS seen and item is needed:

> Stone Sage: "Steelix? Your Metal Coat and the trade-memory the Cable Link gave you — bring both to the altar."

### 5.5 Rare Candy still works

`evoLabEvolveWithCandy` (`battle.html:42941`) bypasses gold cost. After this
rebuild, Rare Candy ALSO bypasses the stone/item requirement — the candy is
the universal "skip the lore" override. **Cable Link visit is still required
for trade evos** (the lore is the friction; candy is the wallet override, not
the lore override).

---

## 6. Cable Link intro — Bill (NPC)

### 6.1 Scene

Add to `STORY_TUTORIAL_SCENES` (`battle.html:34791+`):

```js
firstCableLink: {
    metaKey: 'tutorial-first-cable-link',
    sprite: 'Bill', name: 'Bill', nameplate: 'Cable Link Station',
    lines: [
      '"Hey hey! Name\'s Bill. I rigged up these Cable Link Stations between every gym town — punch in the line and you\'re trading mons with another trainer halfway across the region. Anonymous on both ends. Pure magic and copper wire."',
      '"Some Pokémon only evolve through a trade. Old quirk of the species — they need the moment of handover. Visit a Cable Link in any city and the Stone Sage can lean on that signal to push your trade-evo through."',
      '"Since you\'re new to the line, take this — it\'s a half-price coupon for any one Cable Link transaction. Reroll, Upgrade, Rebuild, your pick. Welcome to the network."',
    ],
    onContinue: function () {
      _storyGrantBundle({ linkDiscount50: 1 });
      try { window.showGameAlert('Received Bill\'s Discount Card — 50% off one Cable Link action!'); } catch (e) {}
    }
}
```

Sprite: `Bill` should resolve via existing `getTrainerSprite`. If not present,
fall back to `Engineer` (the existing trainer-class sprite).

### 6.2 Trigger

In `enterCity()` (`battle.html:35846+`), after the city-arrival overlay returns
for `cidx === 2`, queue the tutorial:

```js
if (cidx === 2) {
  try { playStoryTutorial('firstCableLink'); } catch (e) {}
  // Stonewise Granny fires after Bill's Continue (chained in onContinue).
}
```

Chain so Bill ends → Granny begins → city hub renders. Use a continuation
callback on `playStoryTutorial(sceneId, onDone)` — the function already accepts
one (`battle.html:34987`).

### 6.3 Discount voucher application

In `linkReroll` / `linkUpgrade` / `linkRebuild` (`battle.html` around 42357,
42416, 42441), before computing cost, check:

```js
const useVoucher = (sm.inventory.linkDiscount50 | 0) > 0;
let finalCost = baseCost;
let voucherNote = '';
if (useVoucher) {
  // Ask the player whether to spend it. UI shows two buttons in the confirm
  // dialog: "Use voucher (50% off)" and "Pay full price".
}
```

UI: render a second button in the Cable Link card whenever the voucher is
held — `"Half-Price (use Bill's Card)"` next to the regular Reroll/Upgrade/Rebuild button.
Click → consume voucher, halve cost, run the normal flow. Existing button stays for full-price.

---

## 7. Stone Sage intro — Stonewise Granny (NPC)

### 7.1 Scene

```js
firstStoneSage: {
    metaKey: 'tutorial-first-stone-sage',
    sprite: 'Aroma_Lady', name: 'Stonewise Granny', nameplate: 'Stone Sage',
    lines: [
      '"Easy there, child. Step into the warm. The old ones say every Pokémon carries a stone-memory in its bones — fire, water, leaf, the lot. My job\'s to remind them which one."',
      '"The shop next door sells the stones themselves — pebble of fire, drop of moon, that sort of thing. Bring me what your partner needs and we\'ll wake them up. For the shy ones who only evolve on a long road, you\'ll want a Cable Link first."',
      '"Here. A Stonewise Token. Take it to the Emporium, point at any stone, hand them the token. Free of charge — a welcome gift from the hearth. Now go on, the road north is colder."',
    ],
    onContinue: function () {
      _storyGrantBundle({ stoneToken: 1 });
      try { window.showGameAlert('Received Stonewise Token — redeem for 1 free stone at the Stone Emporium!'); } catch (e) {}
    }
}
```

Sprite: `Aroma_Lady` (existing trainer-class sprite) renders as a soft elderly
NPC. Fallback: `Beauty`.

### 7.2 Trigger

Chained after Bill's scene in `enterCity()` for `cidx === 2`. See §6.2.

### 7.3 Token redemption

At the Stone Shop, each item card renders a "Redeem Token (Free)" button when
`sm.inventory.stoneToken > 0`.
Confirm dialog: "Redeem Stonewise Token for 1 Fire Stone? (free)". On Yes:
`sm.inventory.stoneToken--`, `sm.inventory.fireStone++`, save, refresh.

---

## 8. Force-visit gates — once per facility

### 8.1 Existing pattern

Professor gate (`battle.html:36165+`) blocks `Leave City` button when
`gymBlocked && profUsedHere is false`. We extend the same pattern to new
facilities — but **only once, on the city where the facility first appears**.

### 8.2 New per-facility introduce-once gate

Add a tracking key to `sm`:

```js
// In _storyEnsureInventory or migrate path:
if (!sm.facilityIntros || typeof sm.facilityIntros !== 'object') sm.facilityIntros = {};
// shape: { mart:true, dept:true, link:true, stoneShop:true, evolab:true, tutor:true, ... }
```

Definition: `facilityIntros[key]` is set to `true` the first time the player
visits that facility, **across all cities, per run**. Once true, the gate
never fires again — that's the "1-time intro" rule.

### 8.3 Gate logic

In `renderCityActions`'s `Leave City` branch (~`battle.html:36166`), compute
a `routeBlockedByIntros` array of unvisited debut facilities for the *current*
city. A facility is in the "debut" set for a city if:

- The facility appears in this city's action list, AND
- `sm.facilityIntros[key]` is falsy (never visited globally), AND
- This city is the **first city in the run** where the facility appears.

If `routeBlockedByIntros.length > 0`, render the Leave City button disabled
with text:
> Continue Route (Visit [Bill's Cable Link, Stone Emporium] first)

The facility's button gets a 🔴 dot badge ("Required this city — first
intro") on its city-action tile. After the player taps the facility button
and the tutorial overlay's Continue is clicked, `facilityIntros[key]=true`
and the gate auto-unlocks. **Player can re-tap if needed; not punitive.**

### 8.4 Debut city for each facility

| Facility key | Debut city idx |
|---|---|
| `mart` | 0 |
| `tutor` (Move Tutor) | 0 |
| `nature` | 0 |
| `center` (Pokémon Center) | 0 (every city has it, but first intro fires here) |
| `relic` | 0 (artifact shop tied to Department Store + City 0 free pick) |
| `link` | **2** |
| `stoneShop` | **2** |
| `evolab` | **2** |
| `dept` | 6 |
| `casino` | 5 |
| `dojo` | 4 |
| `evtrainer` | 4 |
| `safari` | 4 |
| `fanclub` | (every city — keep as opt-in, no gate) |
| `colress` | 6 |

The debut map lives in a single const `FACILITY_DEBUT_CITY` near the city
action arrays. Tests against this map gate the Leave-City button.

### 8.5 Exclusions

- City 9 (League) doesn't gate — the player enters the League directly.
- The Professor gate already exists and continues to apply on its own.
- Post-gym hubs of debut cities inherit "already intro'd" since the player
  walked through pre-gym first (the gate fires there).

---

## 9. First-free welcome gifts per facility

| Facility | Debut city | First-free welcome |
|---|---|---|
| Pokémart | 0 | 1 Poké Ball (delta on existing intro — tutorial Continue grants it). |
| Pokémon Center | 0 | 1 Potion (delta on existing intro — tutorial Continue grants it). |
| Move Tutor | 0 | 1 `heartScale` voucher (existing). Just grant on first visit instead of relying on gym drop. |
| Nature Rater | 0 | 1 `mint` voucher (existing). Grant on first visit. |
| Artifact Annex | 0 | (unchanged — first relic free) |
| Cable Link | 2 | `linkDiscount50` voucher (granted via Bill's intro). |
| Stone Emporium | 2 | `stoneToken` voucher (granted via Granny's intro). |
| Evolution Tutor (Sage) | 2 | (no extra — Granny's token is the Sage's welcome too) |
| Game Corner | 5 | `casinoChip500` voucher (500G one-shot bet credit). |
| Department Store | 6 | 1 Great Ball (delta on existing intro). |
| Battle Dojo | 4 | 1 `emblemHonor` voucher (existing). Grant on first visit. |
| EV Trainer | 4 | 1 `vitamin` voucher (existing). Grant on first visit. |
| Power Up (Colress) | 6 | (existing wishingPiece via gym drop, unchanged) |
| Pokémon Fan Club | (any) | (existing vitamin pack, unchanged) |

Implementation: each facility's existing tutorial scene gets an `onContinue`
hook (the tutorial system already supports it — see §6.1) that calls
`_storyGrantBundle({ ... })` exactly once. Dedupe via `tipsShown[metaKey]` —
already cross-run safe.

### Cost-balance check

Total voucher value at the run's natural pace:
- Pokémart: 300G value (1 Poké Ball)
- Center: 200G value (1 Potion)
- Move Tutor: 1500G value (1 free lesson)
- Nature: 2000G value (1 free nature)
- Cable Link: ~3000G value (half of a 6000G T3 reroll)
- Stone: 500G value (1 stone)
- Casino: 500G value (free chip)
- Dept: 1000G value (1 Great Ball)
- Dojo: 2000G value (1 free swap)
- EV: 5000G value (1 free preset)
- **Total: ~16,000G distributed across the run.**

Comparison: a single Champion run earns ~120,000G in route + gym payouts.
So vouchers add **~13%** to the economy — meaningful but not breaking.
Each gift is single-use, so it doesn't compound.

---

## 10. Pre-City-2 cinematic order

When the player first reaches City 2:

1. `_showCityArrivalScreen(2, ...)` — existing per-city arrival overlay.
2. `playStoryTutorial('firstCableLink', ...)` — Bill scene + `linkDiscount50` grant.
3. `playStoryTutorial('firstStoneSage', ...)` — Granny scene + `stoneToken` grant.
4. City hub renders with the new "🔴 Cable Link", "🔴 Stone Emporium", and "🔴 Stone Sage" required-first badges.
5. Player taps each → intros complete → gate unlocks → Leave City re-enabled.

This is achievable via the existing `_showCityArrivalScreen(cidx, onDone)` →
`playStoryTutorial(scene, onDone)` chain pattern.

---

## 11. UI affordances

### 11.1 "🔴 New & required" badge

Reuse the existing "New" pill (`_withNew` at `battle.html:36202`). Add a
sibling helper `_withRequired(facKey)` that returns the "New" pill plus a
**🔴 Required this city** badge when the facility is in the debut-gate set
AND not yet visited.

```js
const _withRequired = (facKey, baseMeta) => {
  if (_isFacilitySeen(cityIdx, facKey)) return baseMeta.concat([{label:'✓', tone:'visited'}]);
  if (_isFacilityRequiredHere(cityIdx, facKey)) {
    return [{label:'🔴 Required', tone:'required'}].concat(baseMeta);
  }
  return [{label:'New', tone:'new'}].concat(baseMeta);
};
```

CSS — add a `.story-action-badge--required` tone (red, animated soft pulse)
in the existing badge stylesheet block (search "story-action-badge" CSS).

### 11.2 Tooltip / hint copy

Leave City disabled hint when intros pending:
> "Drop in on Bill's Cable Link and the Stone Emporium first — they're new in town."

(Pluralization / single-name handling via a tiny `_friendlyJoin(names)` helper.)

### 11.3 Confirm modal for stones

Use the existing `_storyConfirmTutorChange(text, cost)`:
> "Buy Fire Stone for 500G? (1 stone — used at the Stone Sage to evolve certain Pokémon.)"

Cancel returns to shop with no charge.

---

## 12. Files & line anchors

Single-file game — every change lands in `battle.html`. Anchors at time of
writing:

| Concern | Anchor lines |
|---|---|
| `STORY_EVENTS_RAW` action lists | 27975–28043 |
| `POKEMART_ITEMS` / `DEPT_ITEMS` | 28882–28916 |
| `STORY_TUTORIAL_SCENES` | 34791–34943 |
| `playStoryTutorial(sceneId, onDone)` | 34987 |
| `VOUCHER_KEYS` + `_storyGrantBundle` | 37361–37385 |
| `enterCity` | 35804–35870 |
| `_showCityArrivalScreen` | (search at ~35846) |
| `renderCityActions` (action button rail) | 36193–36300 |
| Leave-City gate logic | 36166–36185 |
| `_markFacilitySeen` / `_isFacilitySeen` | 36374–36386 |
| `enterShop` / `buyItem` | 40845–41020 |
| `enterArtifactShop` / `buyArtifact` | 41030–41127 |
| `enterLink` + `linkReroll`/`Upgrade`/`Rebuild` | 41197–42467 |
| `EVO_STONE_REQ` / `EVO_TRADE_REQ` | 42474–42501 |
| `_evoFlavorLine` / `_evoReqHint` | 42504–42543 |
| `enterEvolutionLab` / `renderEvoLabTeam` | 42583–42878 |
| `evoLabEvolve` / `evoLabEvolveWithCandy` | 42904–42968 |
| Voucher labels + sprites | 41364–41385 |
| Public API export | 48028–48050 |

---

## 13. Agent fan-out — definition of done per agent

Five agents, each with a self-contained slice of the rebuild. Agents must not
edit the same line ranges; if a range is genuinely shared, the doc below
designates an owner.

### Agent A — "Data & Action Lists"
- Updates `STORY_EVENTS_RAW` (§2): removes Link Station + Evolution Tutor
  from City 0/1; adds Stone Shop to City 2+.
- Adds `STONE_SHOP_ITEMS` table (§4.1) next to `POKEMART_ITEMS`.
- Adds `STONE_NAME_TO_ID` + `TRADE_ITEM_NAME_TO_ID` maps next to `EVO_STONE_REQ` (§5.3).
- Adds `FACILITY_DEBUT_CITY` const (§8.4).
- Adds new keys (`linkDiscount50`, `stoneToken`, `casinoChip500`) to
  `VOUCHER_KEYS` + voucher labels/sprites map (§3).
- **No UI / no rendering work** — just the data plumbing.
- **DoD:** Open game → load save → action lists for City 0/1 no longer show
  Cable Link/Stone Sage; City 2+ show Stone Emporium as an action button
  (even if it's a no-op for now). All maps importable from JS console.

### Agent B — "Stone Emporium screen + flow"
- New screen HTML markup `screen-story-stone-shop` (§4.2) following the
  artifact-shop template.
- `enterStoneShop()` function next to `enterArtifactShop()` (§4.3).
- Buy flow: `_storyConfirmTutorChange` → consume gold → increment
  `sm.inventory[stoneId]`. Token redemption flow as §7.3.
- `renderCityActions`: `if (actions.includes('Stone Shop'))` push button
  (§4.3).
- Public API export adds `enterStoneShop`, `buyStone`, `redeemStoneToken` to
  the `window.StoryMode` block at the bottom of the file.
- **DoD:** From City 2, the 💎 Stone Emporium button opens a working shop
  that lets the player buy 500G stones with confirm dialogs. Inventory
  counts visible via `JSON.stringify(sm.inventory)` in the console.

### Agent C — "Stone Sage rewire"
- Updates `renderEvoLabTeam` evo-card render path: stone evos require owned
  stone, trade evos require `_isFacilitySeen(cityIdx, 'link')` and (where
  applicable) owned trade item (§5.1, §5.2).
- Updates `_evoFlavorLine` + `_evoReqHint` to new copy (§5.4).
- Updates `_evoLabApplyEvolution` to consume stone/trade-item inventory
  before evolving.
- Rare Candy path: unchanged for gold, but trade-evo Cable Link visit is
  still required (§5.5).
- **DoD:** Stone-evo button is grey'd until player owns the stone, then
  Evolve consumes the stone and progresses normally. Trade-evo button is
  grey'd until Cable Link is visited this city + trade item owned (if
  applicable). Tested by manually setting `sm.inventory.fireStone=1` and
  evolving Vulpix → Ninetales.

### Agent D — "Tutorial scenes + voucher grants"
- Adds `firstCableLink` (Bill) + `firstStoneSage` (Granny) to
  `STORY_TUTORIAL_SCENES` (§6.1, §7.1).
- Wires `onContinue` voucher grants for Bill's discount + Granny's token.
- Updates every existing scene (`firstMart`, `firstMoveTutor`, etc.) to add
  an `onContinue` that grants the matching welcome voucher per §9.
- Hooks `enterCity()` to chain Bill → Granny on first arrival at City 2 (§10).
- Adds welcome-gift wiring: Pokémart (Poké Ball), Center (Potion), Dept
  (Great Ball).
- Adds linkDiscount50 / stoneToken / casinoChip500 to voucher sprite +
  label maps (§3).
- **DoD:** On a fresh save, completing each facility's first-visit intro
  drops the welcome voucher into inventory. Inventory survives reload. No
  voucher fires before its mechanic exists in the run (gated by tutorial
  metaKey).

### Agent E — "Force-visit gates + voucher UI"
- Adds `sm.facilityIntros` to the save-state init + migration (§8.2).
- New helper `_isFacilityRequiredHere(cityIdx, key)` reading
  `FACILITY_DEBUT_CITY` (§8.3, §8.4).
- Updates the Leave-City branch in `renderCityActions` (§8.3) to gate on
  the new intros-pending list with a friendly tooltip (§11.2).
- Adds "🔴 Required" badge + CSS pulse animation (§11.1).
- Hooks each facility's tutorial Continue to set `sm.facilityIntros[key]=true`
  and trigger a re-render of the city actions so the gate unlocks live.
- **DoD:** Leaving City 2 without visiting Cable Link OR Stone Shop is
  blocked with a clear hint. After visiting both, the Leave City button
  enables itself. Test cases:
  1. Fresh save → reach City 2 → Bill + Granny fire → try to leave → blocked
     → visit Cable Link → still blocked (need stone shop) → visit Stone Shop
     → unblocked.
  2. Restart from a save mid-City 2 → state survives.

### Coordination notes for agents

- **No two agents edit the same anchor range.** Agent A's edits are scoped
  to data tables; B owns the shop screen; C owns Stone Sage; D owns the
  tutorials; E owns the gate logic + UI badges. The handful of touches in
  `renderCityActions` are split: B pushes the Stone Shop button, E adds the
  gate logic + badge.
- **Run order:** A first (data foundations), then B/C/D/E in parallel.
- **Common test seed:** spawn a `?testevo=1` query handler analogous to the
  existing `?testmega=1` (`battle.html:35590`) that drops the player into
  City 2 pre-gym with 50,000G, empty inventory, no intros fired. Each agent
  references this seed in its DoD.

---

## 14. Changelog & docs

- Append a `## Unreleased` entry to `CHANGELOG.md` summarizing the rebuild
  under three subheads: **Added** (Stone Emporium, Bill / Granny intros,
  welcome vouchers), **Changed** (Stone Sage requires stones/trade items;
  Cable Link / Evolution Tutor moved to City 2+; per-facility intro gates),
  **Fixed** (no leak of evolutions before City 2 onboarding).
- Append to `STORY_MODE_FLOW.md` §15 a new sub-section "Evolution gating &
  onboarding" referencing this doc.

---

## 15. Out of scope (deliberate)

- New sprite art (Bill / Granny reuse existing trainer-class sprites).
- New gym battles, route fights, or balance to the gym curve.
- Online trading (Cable Link remains a single-player premium reroll/upgrade).
- Move Tutor TM library expansion.
- Mid-run difficulty re-balance (vouchers are sized to leave the curve intact).
- NG+ carry of vouchers (vouchers reset per run; tipsShown still dedupes the
  intro scenes cross-run).

---

## 16. Open questions / decisions logged

- **City 2 is "the unlock city"** for Cable Link, Stone Sage, Stone Shop.
  Confirmed via clarifying question.
- **Trade-evo gate = enter+exit Cable Link this city.** Confirmed.
- **Stone Shop = new standalone facility, always-available from City 2.**
  Confirmed.
- **Each facility intro grants a small, themed voucher.** Confirmed.
- Total voucher value ≈ 13% of run economy — see §9 cost balance.

---

## Ready to fan out

When you approve this doc:
1. Agent A runs first, alone (5–10 min). Verify data tables.
2. Agents B, C, D, E run in parallel (15–25 min each). Each commits to the
   working branch `claude/gracious-mayer-H31zi` with a self-contained patch.
3. A final integration pass verifies the full City 0 → City 2 flow end-to-end
   in a fresh save, and the changelog + docs entries are appended.
