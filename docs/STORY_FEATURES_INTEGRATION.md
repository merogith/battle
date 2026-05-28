# Story features — placement, shops, flow, dialogue status

This doc ties **new systems** to the existing timeline in [`STORY_MODE_FLOW.md`](../STORY_MODE_FLOW.md) and [`battle.html`](../battle.html) (`STORY_EVENTS_RAW`, `POKEMART_ITEMS`, `DEPT_ITEMS`).

> ## ⚠️ STATUS — PERMANENTLY DE-SCOPED (as of v1.2.3, 2026-05; reaffirmed 2026-05-28)
>
> The sections below marked **DE-SCOPED** are **cut — not shipped and the project
> will not implement them.** They are kept here for historical / design context only.
> Owner directive: these are not on any roadmap, near or far; do not re-open without
> an explicit roadmap reversal. The corresponding ledger entries (ISSUE-008,
> ISSUE-019, ISSUE-020, ISSUE-030, ISSUE-042) are pinned `wontfix` for the same
> reason. Verified absent from `battle.html` (zero code references): **§3 Black
> Market**, **§3.5 Illegal Dealer NPC**, **§6 Battle for Pokémon (wager)**,
> **§7 Pokémon Trader**, and the **full Itinerary / `runItinerary` scaffolding**
> woven through §§3–10 and the §9 readiness table.
>
> **Shipped and live:** §1 Poké Balls, §2 PC Box, §4 Safari Zone, and the §9 dialogue work.

---

## 1. Poké Balls (cheap, catch-mode only)

| Item | Price | Role |
|------|-------|------|
| Poké Ball | **200** | Default; fine for G3–G4 wild rolls |
| Great Ball | **300** | Mid tier |
| Ultra Ball | **500** | Best standard ball; keep farming affordable |
| Master Ball | **~2000–3000** (tune) | Guaranteed; still cheap vs old 50k — limit **1 per run** or **2** if too easy |

**Sold at:** Poké Mart (every hub). The shipped catch system is **interrupt-driven** (see `STORY_BATTLE_INTERRUPTS` + `_shouldFireWildBeforeBattle`) — there is no `catchMode` global toggle; route slots roll wild encounters whenever the interrupt rule fires. Department Store does **not** stock balls (keeps mart = consumables + balls).

**Inventory:** `sm.balls.{poke,great,ultra,master}` (NOT `sm.inventory.pokeball / greatBall / …`). `bag` UI + `catchThrow(ballKey)` already consume from `sm.balls`.

---

## 2. PC Box — where and when

| Access | Rule |
|--------|------|
| **Every city hub** | Button: `PC Box` is always available in city actions (catching is interrupt-driven, not gated by a `catchMode` flag). |
| **Not** on route / in battle | Same pattern as Mart — city `renderCityActions` only. |

**Flow fit:** After any catch, if party is 6 and PC has space → auto-deposit; if **PC full + party full** → catch **fails** (already decided).

---

## 3. Black Market — where, unlock, uniqueness  ·  ⚠️ DE-SCOPED (not shipped)

### Placement (recommended)

| Unlock | Cities with button |
|--------|---------------------|
| After **itinerary beat** “black market unlock” (e.g. end of **chain Act 2** ≈ post–**badge 4**, story-wise) | **City5** onward **and** **City8** post-gym (Victory Road tone), **or** only **City6 + City8** to match “no Professor” seedy hubs |

Use **one** rule in code: e.g. `sm.blackMarketUnlocked && cityIdx >= 5` (0-based City5 = sixth hub row in flow — align with `getCityIndex`).

### Strong differentiation vs Mart / Department Store

| Shop | Identity | Examples (IDs are illustrative) |
|------|----------|-----------------------------------|
| **Poké Mart** | Legal trainer supplies + **balls** (if catch on) | Max Potion, Full Restore, X items, Dire Hit, **Poké/Great/Ultra Ball** |
| **Department Store** | Premium **legal** + **meta** (weather, terrain, revive, teleporter) | Revive line, orbs, Emergency Teleporter, featured Mega/Ultra variants |
| **Black Market** | **Illegal / gray market** — nothing that is a 1:1 duplicate of mart/dept SKUs | **Rare Candy**; **Mystery Egg** (random species, enabled gens); **Forged Pass** (skip next **route** block or one **gym** — dangerous, one-time); **Black Market TM** (high-power or illegal-flavor move); **Intel Dossier** (reveal **next** fixed trainer team names/species); **Fence** (sell a party/PC mon for gold); **Shady Repel** (flavor: fewer wild rolls for N routes); **Legend Chip** (one reroll on legendary catch phase — optional); **no** standard Max Potion/revive/orbs here |

If an item exists in `POKEMART_ITEMS` / `DEPT_ITEMS`, **do not** resell it in Black Market (or only at **2× price** as “smuggled” — worse UX; prefer **unique IDs** only).

**UI:** Separate screen/modal `enterBlackMarket()` — dark palette, different NPC sprite (e.g. `Rocket` / `Collector` / custom), not the same layout as `screen-story-shop`.

---

## 3.5 Illegal Dealer NPC (unique from Black Market)  ·  ⚠️ DE-SCOPED (not shipped)

This is a **single NPC encounter system**, not a full shop. It gives high-risk one-off deals and story flavor.

### Placement

| Trigger | Location |
|--------|----------|
| Unlocked after itinerary beat `blackMarketUnlock` | Appears in **City6** and **City8** only (night/seedy hubs), plus rare route pop-in if desired |

### What this NPC does (unique loop)

| Mechanic | Behavior |
|----------|----------|
| **One deal per city visit** | Dealer generates 1 offer when you enter the city; if you decline, it is gone until next city visit |
| **No normal inventory** | Never sells Potions/Revives/Orbs/Balls (those stay Mart/Dept) |
| **High-risk contracts** | Example contracts: `Trade one random party mon for two random mons of same total grade budget`, `Pay gold to reroll next Battle-for-Pokemon opponent quality`, `Sell one mon for large gold instantly` |
| **Illegal token item** | Can sell `Contraband Capsule`: one-use effect like forcing next wild encounter grade floor (e.g., min G3) |
| **Story-only services** | Can reveal hidden itinerary clue text (flavor + tactical hints) |

### Differentiation summary

| System | Identity |
|--------|----------|
| Poké Mart | Cheap legal consumables + balls |
| Department Store | Premium legal combat tools + utility |
| Black Market | Broad illegal catalog (multi-item shop) |
| **Illegal Dealer NPC** | **Single shady contract per visit** (event-like, not catalog) |

---

## 4. Safari Zone (type-themed)

| Trigger | From **run itinerary** (not random %): e.g. after **badge 3** or **City3** segment |
|--------|----------------------------------|
| **Fee** | ~500G entry (tune) |
| **Twist** | **Type restriction** (e.g. only Fire / only Water / “cave” = Rock+Ground pool) — **good grade odds** (bias G2–G3 in pool) |
| **Mechanic** | Bait / Mud / Ball **or** quick-catch — pick one and stick to it for v1 |

Resolves **before** the next `STORY_EVENTS_RAW` battle on that segment.

---

## 5. Wild encounters

Shipped model is **interrupt-driven**, not gated by a global toggle. `STORY_BATTLE_INTERRUPTS` + `_shouldFireWildBeforeBattle` (in `proceedToNextBattle`) roll a wild on eligible route slots; see `enterCatchEncounter` for the resulting `#screen-story-catch` flow.

| Roll | Per-route configured probability (per `STORY_BATTLE_INTERRUPTS`) — typically 50% on the route slots listed in `STORY_EVENTS_RAW` |
|------|----------------------------------|
| Species | Grade from current event weights ∩ **enabled gens** |

Runs **before** trainer fight on that `proceedToNextBattle` hop; itinerary beat can run **first** if both scheduled (define order: **itinerary → wild → trainer**).

---

## 6. Battle for Pokémon (wager)  ·  ⚠️ DE-SCOPED (not shipped)

| Player | Needs **≥2** party members to accept |
|--------|----------------------------------------|
| Win | Gain foe **worst** (grade ↑ number = worse; tie BST ↓; random) |
| Lose | Lose player **best** (grade ↓ better; tie BST ↑; random / type tiebreak) |
| Foe | May wager with **1** mon |
| Triggers | **Itinerary** scripted duels + **~15%** on **Basic Trainer** route battles after unlock |

**Decline wager:** still fight same trainer, normal rewards, no swap.

---

## 7. Pokémon Trader (same grade, fixed offer)  ·  ⚠️ DE-SCOPED (not shipped)

| City | **City4** first visit (event idx **26**), or **29** post-gym — pick **one** index for `traderOfferByCity[4]` |
|------|----------------------------------|
| Rule | 1:1 same **grade**, both species from **enabled gens**; offer **frozen** when first generated |

---

## 8. Flow checklist (integration issues to close)

| Issue | Mitigation |
|-------|------------|
| `proceedToNextBattle` order | Queue: **wild interrupt** → set `eventIndex` to route battle → `enterBattleEvent`. (Itinerary / wager queued items are de-scoped — see §3/§6/§10.) |
| Save mid-beat | Persist whatever the live flow actually uses (`sm.currentEnemyLock`, `sm.scenesShown`, …). The de-scoped `itineraryProgress` / `pendingWager` / `traderOfferByCity` fields are NOT in the live save. |
| Full PC + party | Wild catch fails (the live behavior). |
| Mystery Figure / Rival | Unchanged vanilla flow; new buttons only add **parallel** actions on city screen. |
| Professor forced in City6–8 | PC does not replace Mystery gate; **legendary gate** still blocks route until visited. |

---

## 9. Dialogue & story — **readiness**

| Area | Status |
|------|--------|
| **STORY_EVENTS_RAW** | Already drives cities/battles — **no** new dialogue there. |
| **Villain arcs (3 acts)** | **Not written** — only outlines; need full `STORY_SCRIPT` nodes (speaker, narrator, lines, choices, `battleRef`) per **primary arc** × 3 acts × beats. |
| **Itinerary beats** | **Not authored** — need JSON/JS list: safari type, black market unlock line, raid intro, wager tutorial NPC. |
| **Black Market vendor** | **Not written** — 3–5 bark lines + buy/sell confirm strings. |
| **Illegal Dealer NPC** | **Not written** — intro barks, 6–10 contract templates, accept/decline outcome lines. |
| **Safari announcer** | **Not written** — entry fee, type theme, rules reminder. |
| **Trader NPC** | **Not written** — offer line + accept/decline. |
| **Battle for Pokémon** | **Not written** — pre-battle wager text + win/lose outcome lines. |
| **Existing** | `TRAINER_QUOTES`, city guide, professor — **already in game**; extend, don’t replace. |

**Conclusion:** Mechanics are **specified**; **all** new narrative content is still an **authoring pass** after code hooks exist. Count on **hundreds of lines** for one complete arc; stub with 1–2 lines per beat for first playable build.

---

## 10. Implementation order (reminder)

1. ✅ **SHIPPED** — Balls + inventory + mart + wild encounter + PC modal.  
2. ⚠️ **DE-SCOPED** — `runItinerary` + one arc stub + script screen.  
3. ⚠️ **DE-SCOPED** — Black Market unique SKUs + UI + unlock flag.  
4. ✅ **SHIPPED** — Safari (type pool) + fee.  
5. ⚠️ **DE-SCOPED** — Wager flag + worst/best helpers + route %.  
6. ⚠️ **DE-SCOPED** — Trader City4.  
7. ✅ **SHIPPED** — Full dialogue fill per arc.
