# Story Mode — City Bag & Party management audit (2026-05-29)

Scope: Story mode, normal difficulty. Surfaces: city-hub Bag (`openCityBag`/`sellItem`)
and city-hub Party (`openPartyModal`/`moveInParty`/`renderTeamPanel`), plus the
adjacent PC modal swap/release surface that these flows hand off to. Read-only.

## P1

### 1. sellItem trusts caller-supplied sellPrice (gold credit not catalog-derived) — bug, Bag
`sellItem(itemId, sellPrice)` (battle.html:52759) does `sm.gold += sellPrice` using the
value passed by the caller, never re-derived from the catalog. `sellItem` is exported on
`window.StoryMode` (battle.html:59298), so `window.StoryMode.sellItem('pokeBall', 9999999)`
credits arbitrary gold while only decrementing one unit. Contrast the PC/Underground sell
path (`pcSell`, battle.html:48447) which re-derives server-side via
`_pcSellPriceForSlot(slot)` (battle.html:47323) and ignores any caller price. Fix: have
`sellItem(itemId)` look up the item in `[...POKEMART_ITEMS,...DEPT_ITEMS,...getStoryFeaturedItems()]`
and compute `Math.floor(item.price/2)` internally; drop the second param.
(Coordinate-check requested by task — confirmed price is caller-supplied, not catalog.)

## P2

### 2. City Bag & Party modals bypass openModal — no focus restore on close — UI/UX (a11y), both
`openCityBag` (52750) and `openPartyModal` (44772-44773) open via
`modal.classList.remove('hidden')` directly instead of `window.openModal(id)`
(battle.html:13715). `openModal` is the helper that records `document.activeElement` into
`_modalFocusStack` so `closeModal` (13724) can return focus to the opener. Because these
two bypass it, closing the Bag/Party modal drops keyboard/SR focus to `<body>` instead of
the hub action that opened it. `openPermBoostPicker` (52831) has the same direct-show.
Escape-to-close still works (global handler), only focus-restore is lost.

### 3. moveInParty loses keyboard focus after reorder — UI/UX (a11y), Party
`moveInParty(idx,dir)` (44782) and `summaryMove` (44819) call `renderTeamPanel()` which
rebuilds `#story-team-panel` innerHTML wholesale (44720-44764). The ▲/▼ button the user
just activated is destroyed and recreated; focus is not restored to the moved row's button
at its new index. A keyboard user pressing ▼ repeatedly to move a mon down the list loses
focus to body after the first press. Fix: after re-render, re-focus the
`.party-sort-btn` for the new index/dir.

### 4. Bag/Party modals lack accessible name + live region — UI/UX (a11y), both
`#modal-story-bag` (9305) and `#modal-story-party` (9318) are `role="dialog"
aria-modal="true"` but have no `aria-label`/`aria-labelledby` (the `<h3>` titles have no
`id`). Sell actions re-render `#story-bag-grid` on every click with updated qty + gold but
there is no `aria-live` region, so SR users get no feedback that the sale happened or that
gold changed (HUD update is also silent). Add `aria-labelledby` to the dialog and an
`aria-live="polite"` status node for sell/qty changes.

## P3

### 5. Bag modal h3 title swaps between "Battle Bag" and "Your Bag" via innerHTML — inconsistency, Bag
The shared `#modal-story-bag` static title is "Battle Bag" (9307). `openCityBag` rewrites
`h3.innerHTML` to "Your Bag" (52640) and the battle bag path leaves it. The two flows share
one DOM node and stomp each other's title; harmless today (only one open at a time) but
fragile, and the rewrite also blows away any future `id` you'd add for #4's aria-labelledby.

### 6. City Bag scroll position resets on every sell — UI/UX, Bag
`sellItem` calls `openCityBag()` to refresh (52769), which sets `bagEl.innerHTML=''`
(52641) and rebuilds the full list. Selling an item far down a long bag scrolls the list
back to the top each time, forcing the player to re-scroll to sell a second unit of the
same item. (Same class of issue as PC `_pcRefresh`; verify whether PC preserves scroll and
mirror the better behavior.) Consider decrementing the single row's qty in place, or
capturing/restoring `scrollTop`.

### 7. Egg-only party can be fully emptied via PC deposit — bug (edge), Party/PC
`pcDeposit` (48406) guards the last-mon case with `!found.slot.isEgg && _pcTeamHasOnlyOneMon()`
(48410), and `_pcTeamHasOnlyOneMon` counts only non-egg fighters (47336). If the party
holds exactly one slot and it is an egg, the egg-branch skips the guard and the party can be
left with zero slots. Not reachable in normal flow (you always have >=1 fighter before an
egg is granted post-badge-7) but the invariant "party never empty" is not enforced for the
egg case. Low risk; worth an explicit `sm.team.length<=1` floor in the egg deposit branch.

### 8. _selectedBagItem / story-bag-target are dead in the city flow — refactor, Bag
`_selectedBagItem` (34884) is reset by `openCityBag` (52636) and the battle path, and
`#story-bag-target` (9310) is force-hidden by `openCityBag` (52635) — neither is used by any
city-bag interaction (city bag has no "use on target" items except the dedicated
EV/perm-boost pickers which open their own roster views). Carryover from the battle bag.
Candidate for removal from the city path.

## Verified clean

- Party reorder (`moveInParty`, `summaryMove`) cannot remove a slot or empty the party — pure swap, bounds-checked (44784, 44821). The city Party modal has NO delete/release/PC button; all destructive actions live in the separate PC modal.
- Party rows ARE keyboard reachable: `renderTeamPanel` rows use `role="button" tabindex="0"` with delegated click+keydown(Enter/Space) handlers (44691-44706, 44724, 44746) — the prior "mouse-only div" a11y issue does NOT apply to these party rows. ▲/▼ are real `<button>`s.
- Last-mon-in-party guard is enforced on every destructive path: PC deposit (48410), PC sell (48453), Underground sell `isLastParty` (47676-47677), with disabled buttons + title reasons in the renderer (47549-47550, 47677-47679).
- Release (`pcRelease`, 48429) and sell (`pcSell`, 48447) both gate on `await showGameConfirm`, with extra shiny + EV-loss warning copy. Double-submit on release/sell is bounded by id re-lookup (`_pcFindSlotById`) after the await — a stale id no-ops.
- PC/Underground sell price is catalog-derived server-side (`_pcSellPriceForSlot`, 47323) — caller cannot inject price (contrast finding #1).
- Perm-boost vitamins are correctly never sellable: `sellItem` early-returns on `PERM_BOOST_IDS.has(itemId)` (52762) and they render with no Sell button (52691-52710).
- Bag empty-state message present and correct (52747-52748). Voucher items render as non-sellable "Voucher" chips (52671-52685).
- Party-cap display uses the badge curve `_storyMaxPartySize()` not a hard 6 (44712-44714); PC withdraw/deposit enforce the same cap (48422, 48411).
- Featured (Mega/Ultra) items always carry a numeric `price` (getStoryFeaturedItems, 32969/32980), so the city-bag sell price is never NaN.
- Story team slots carry no live HP field at the city level (build only) — no 0-HP/fainted display state exists in the city Party modal; mons enter battle at full.
