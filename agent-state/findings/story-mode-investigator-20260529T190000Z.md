---
severity: P1
category: bug
anchor_symbol: casinoFlipSpin
current_line_hint: ~50830
file: battle.html
agents: [story-mode-investigator]
fingerprint: af2dc4e3be42
confidence: high
status: open
---

**Title**: Casino Coin Flip outcome uses Math.random(), not seeded storyRngNext()

**Evidence**:
```js
const win  = Math.random() < CASINO_FLIP_WIN_P;   // casinoFlipSpin (~50830)
```

**Repro**: Casino → Flip tab → press Flip. Win/loss is `Math.random()`.

**Blast radius**: CLAUDE.md rule: "Use seeded RNG (storyRngNext) everywhere user-visible, never bare Math.random(). Deterministic replays are part of the product." Casino is user-visible, gold- and prize-affecting. story-replay.mjs diverges at any casino visit. All 3 games + prize roller share this.

**Fix sketch**: Replace Math.random() with storyRngNext() in the flip win check.

**Verification**: Same-seed replay → identical flip outcomes; grep casino block 50813-51470 for Math.random → 0.

---
severity: P1
category: bug
anchor_symbol: _slotsPickSymbol
current_line_hint: ~50954
file: battle.html
agents: [story-mode-investigator]
fingerprint: cbeb827d7355
confidence: high
status: open
---

**Title**: Casino Slots reel symbols rolled with Math.random(), breaking seeded determinism

**Evidence**:
```js
function _slotsPickSymbol(reelIdx) {
    const strip = CASINO_SLOTS_REEL_STRIPS[reelIdx];
    return strip[(Math.random() * strip.length) | 0];   // ~50954
}
```

**Repro**: Casino → Slots → Spin. Outcome-determining (casinoSlotsSpin → rolled.push(_slotsPickSymbol(i))).

**Blast radius**: Same seeded-RNG rule. _slotsPickSymbol is the payout determinant.

**Fix sketch**: Route _slotsPickSymbol through storyRngNext(). Cosmetic spin-strip filler may stay on Math.random.

**Verification**: Same-seed → identical reel results.

---
severity: P1
category: bug
anchor_symbol: casinoRoulSpin
current_line_hint: ~51392
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2fd9ec729600
confidence: high
status: open
---

**Title**: Casino Roulette winning cell chosen with Math.random(), not seeded RNG

**Evidence**:
```js
const winIdx = (Math.random() * cells.length) | 0;   // casinoRoulSpin (~51392)
```

**Repro**: Casino → Roulette → stake → Spin.

**Blast radius**: Same seeded-RNG rule; 11x payouts feed gold + prize roller.

**Fix sketch**: const winIdx = (storyRngNext() * cells.length) | 0;

**Verification**: Seeded replay parity.

---
severity: P1
category: bug
anchor_symbol: _casinoRollPrize
current_line_hint: ~50617
file: battle.html
agents: [story-mode-investigator]
fingerprint: 8e80374d06cc
confidence: high
status: open
---

**Title**: Casino prize roller (_casinoRollPrize / _randPick) uses Math.random for vitamin/voucher drops

**Evidence**:
```js
function _randPick(arr) { return arr[(Math.random() * arr.length) | 0]; }   // ~50613
// _casinoRollPrize: if (Math.random() > 0.20) return null; (small tier) etc.
```

**Repro**: Win any casino game; SMALL/BIG/JACKPOT gate + vitamin/voucher selection are Math.random.

**Blast radius**: Prizes grant IVs (vitamins) + tutor/dojo vouchers — PERMANENT progression in save state. Higher impact than spin RNG: same-seed replay yields different durable rewards.

**Fix sketch**: Convert all Math.random() in _casinoRollPrize + _randPick (casino use) to storyRngNext().

**Verification**: Same-seed replay grants identical bundles.

---
severity: P3
category: inconsistency
anchor_symbol: casinoRoulSpin
current_line_hint: ~51226
file: battle.html
agents: [story-mode-investigator]
fingerprint: 450dbd3ab949
confidence: high
status: open
---

**Title**: Roulette doc comment promises a color-row payout the code never pays

**Evidence**:
```js
//   • Color row (any cell of that color, 3 cells, by cell stake): resolved per-cell...
const winningStake = (_casinoUI.roul.stakes[winCell.id] | 0);
if (winningStake > 0) payout += winningStake * 11;   // ONLY direct cell hit
```

**Repro**: Compare casinoRoulSpin header (~51226) to the payout loop (~51400). No color-aggregation logic exists.

**Blast radius**: Stale comment; UI only stakes discrete cells so no player-facing payout bug. Misleads maintainers.

**Fix sketch**: Delete the color-row comment lines, or implement per-color aggregation if intended.

**Verification**: Comment matches code.

---
severity: P2
category: bug
anchor_symbol: sellItem
current_line_hint: ~52759
file: battle.html
agents: [story-mode-investigator]
fingerprint: fe7148ad7ab0
confidence: medium
status: open
---

**Title**: sellItem trusts caller-supplied sellPrice instead of re-deriving from the catalog

**Evidence**:
```js
function sellItem(itemId, sellPrice) {
    if (!sm.inventory[itemId] || sm.inventory[itemId] <= 0) return;
    if (PERM_BOOST_IDS.has(itemId)) return;
    sm.inventory[itemId]--;
    sm.gold += sellPrice;   // credited verbatim, never validated
```

**Repro**: A DOM-edited onclick (or future caller) can pass an arbitrary sellPrice and credit unlimited gold. buyItem re-validates price vs catalog; sellItem does not — asymmetric trust.

**Blast radius**: Gold accounting integrity.

**Fix sketch**: In sellItem, look up the row in [...POKEMART_ITEMS, ...DEPT_ITEMS, ...getStoryFeaturedItems()], recompute Math.floor(row.price/2) server-side, ignore the passed arg.

**Verification**: StoryMode.sellItem('potion', 999999) → gold rises only by catalog-derived value.

---
severity: P2
category: bug
anchor_symbol: buyArtifact
current_line_hint: ~50126
file: battle.html
agents: [story-mode-investigator]
fingerprint: ae5df95da412
confidence: medium
status: open
---

**Title**: buyArtifact has no interaction lock; double-submit safety rests solely on confirm-modal z-order

**Evidence**:
```js
async function buyArtifact(artId, price) {
    if (sm.artifactShopPurchasedByCity[cKey]) return;   // checked BEFORE the await
    const ok = await _storyConfirmTutorChange(...);      // no _storyTryBeginInteraction()
```

**Repro**: Per-city lock read before await showGameConfirm. Sibling facilities (enterTutor/enterLink/enterCasino/tutorChange*) all use _storyTryBeginInteraction; buyArtifact relies on the full-screen confirm modal (z-index 1200) to block a second click.

**Blast radius**: If confirm becomes non-blocking, or a second relic button is clicked before the modal renders, two purchases could pass the lock, double-debit, push two artifacts. Combined with the showGameConfirm clobber, the first awaiter can orphan.

**Fix sketch**: Wrap buyArtifact + buyItem body in if(!_storyTryBeginInteraction())return; try{...}finally{_storyEndInteraction();}.

**Verification**: Two buyArtifact calls in one tick → only one debits.

---
severity: P3
category: dx
anchor_symbol: enterArtifactShop
current_line_hint: ~50164
file: battle.html
agents: [story-mode-investigator]
fingerprint: e6e64f34eac5
confidence: medium
status: open
---

**Title**: enterArtifactShop and enterShop lack the _storyTryBeginInteraction guard used by other facility entries

**Evidence**:
```js
function enterArtifactShop() {   // no _storyTryBeginInteraction()
function enterShop(type) {       // no _storyTryBeginInteraction()
// vs enterCasino/enterTutor/enterLink/enterStoneShop which all wrap in the lock
```

**Repro**: Shop + Artifact-shop are the only commerce facilities without the entry interaction lock.

**Blast radius**: Consistency/robustness; currently harmless (idempotent renders).

**Fix sketch**: Add the guard wrapper for parity, or document why shop entries are lock-free.

**Verification**: All enter<Facility> follow the same pattern.

---
severity: P3
category: inconsistency
anchor_symbol: buyItem
current_line_hint: ~50053
file: battle.html
agents: [story-mode-investigator]
fingerprint: 54ba972f489e
confidence: medium
status: open
---

**Title**: buyItem cheap-consumable path is unguarded but synchronous; only the confirm-gated branch can interleave

**Evidence**:
```js
const needsConfirm = (st==='dept' && _isFeatured) || (!_isBall && price>=1500);
if (needsConfirm) { const ok = await _storyConfirmTutorChange(...); if(!ok) return; }
sm.gold -= price;
```

**Repro**: Cheap buys (balls, <1500G non-balls) run fully sync — single-threading prevents double-submit. Only the confirm branch yields control.

**Blast radius**: Low under current modal blocking; documented so the buyItem lock fix is scoped to the confirm-gated branch and this isn't read as an active exploit.

**Fix sketch**: Same interaction-lock wrapper as buyArtifact; no change to the sync path.

**Verification**: Two confirm-gated buys in one tick → second rejected by lock.

---
severity: P3
category: dx
anchor_symbol: getStoryFeaturedItems
current_line_hint: ~52715
file: battle.html
agents: [story-mode-investigator]
fingerprint: d751963ad1f8
confidence: low
status: fixed-claude/gifted-fermat-yfnqq5
---

**Title**: Featured Mega/Ultra stones (bought one-per-city at 5x/3x) are sellable from the bag at half list price

**Evidence**:
```js
// openCityBag: allItems includes getStoryFeaturedItems() (mega_/ultra_ ids, price=base*5 / base*3)
const sellPrice = Math.floor(item.price / 2);   // mega -> floor(base*5/2)
// rendered Sell button -> sellItem('mega_<id>', sellPrice)
```

**Repro**: Buy a featured Mega stone (locks city via deptShopPurchasedByCity), open Bag → stone shows a Sell button. Selling does NOT unlock the city → no re-buy loop → no exploit, but a player can accidentally sell a needed Mega Stone at a net loss.

**Blast radius**: Footgun, not an economy exploit (sell < buy, lock persists). Design-intent question.

**Fix sketch**: Suppress the Sell button for featured mega_/ultra_ ids in openCityBag (treat like PERM_BOOST_IDS), or confirm intent. No number change.

**Verification**: Featured stones render without a Sell button (or behind a confirm).

---
severity: P2
category: bug
anchor_symbol: showGameConfirm
current_line_hint: ~13763
file: battle.html
agents: [story-mode-investigator]
fingerprint: 7ef723c1942f
confidence: medium
status: open
---

**Title**: showGameConfirm overwrites a pending _gameConfirmResolve, orphaning the first awaiter

**Evidence**:
```js
window.showGameConfirm = function(message) {
    return new Promise(function(resolve) {
        window._gameConfirmResolve = resolve;   // clobbers any prior pending resolve
        ...
    });
};
```

**Repro**: Two overlapping confirm-gated commerce actions (see buyArtifact/buyItem missing-lock findings): the second clobbers _gameConfirmResolve; the first Promise never resolves and its await hangs (that purchase silently aborts mid-flow). _storyTryBeginInteraction guards via the _gameConfirmResolve check, but commerce buy paths don't call it.

**Blast radius**: Any two async confirm consumers not both behind the interaction lock. The "one confirm in flight" invariant is enforced by convention, not by showGameConfirm.

**Fix sketch**: Make showGameConfirm defensive — if _gameConfirmResolve already set, settle the prior promise (resolve(false)) before reassigning. Belt-and-suspenders alongside locking the buy paths.

**Verification**: Call showGameConfirm twice without resolving the first → first settles to false rather than hanging.

---
severity: P3
category: dx
anchor_symbol: _refreshCasinoGoldPill
current_line_hint: ~50833
file: battle.html
agents: [story-mode-investigator]
fingerprint: 39587f58cfe0
confidence: low
status: open
---

**Title**: Casino debits floor gold at Math.max(0, gold-bet), which would silently mask a future bet-validation regression

**Evidence**:
```js
sm.gold = Math.max(0, (sm.gold | 0) - bet);   // flip / slots / roulette
```

**Repro**: Bets are pre-validated (_casinoTryBet: bet<=have; slots/roul check have<stake), so the clamp never fires today. A future over-bet (e.g. multi-stake roulette rounding) would be silently swallowed into a free spin instead of a detectable underflow.

**Blast radius**: Defensive hygiene only; no current incorrect behavior.

**Fix sketch**: Rely on upstream validation and drop the clamp, or add a dev-mode assert when gold-bet<0 so a regression is loud.

**Verification**: Inject an over-bet in a test → assert/log fires instead of a silent clamp.

