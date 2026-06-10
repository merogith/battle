---
severity: P2
category: bug
anchor_symbol: enterPokemonCenter
current_line_hint: ~47348
file: battle.html
agents: [story-mode-investigator]
fingerprint: d317e1091ec7
confidence: high
status: fixed-main
---

**Title**: Poké Center never clears Fatigue, yet the in-game bulletin tells players a Center stay clears it

**Evidence**:
```js
// enterPokemonCenter() — opens PC/Underground, plays SFX, gifts one Full Restore.
// It NEVER calls _storyFullHealPartySlots() (the only thing that zeroes build.tired).
// Meanwhile _storyShowTirednessIntro() bulletin says:
//   "A short stay at a Pokémon Center restores HP, PP, status, AND clears Fatigue."
// build.tired persists across non-iconic battles (routes/Basic Trainers +1 each, cap 3)
// and is only reset by iconic fights, retreat-to-city, or pits.
```

**Repro**: Fight several non-iconic route/Basic trainers to stack build.tired, enter a Pokémon Center, reopen Party — fatigue stacks remain (each docks 1% stats + starting HP). The bulletin promised the Center would clear them.

**Blast radius**: Fatigue is a real persistent stat debuff (buildPokemon line ~14828). Players who follow the bulletin's instruction get no relief; only path is reaching the next iconic fight or retreating (which also halves gold on harder difficulties).

**Fix sketch**: Either (a) call _storyFullHealPartySlots() inside enterPokemonCenter() so the Center honors the bulletin, or (b) correct the bulletin text to say only iconic fights/retreat clear fatigue. Behavior choice is balance-owned (maxwell) — flag, don't ship.

**Verification**: After fix-a, build.tired === 0 for all party members after a Center visit; after fix-b, bulletin no longer mentions the Center clearing fatigue.

---
severity: P3
category: inconsistency
anchor_symbol: enterPokemonCenter
current_line_hint: ~42968
file: battle.html
agents: [story-mode-investigator]
fingerprint: ea3cd4d05640
confidence: high
status: fixed-main
---

**Title**: Poké Center chip sits in "Heal & Team" section with a "Free" badge but performs no heal interaction

**Evidence**:
```js
_push('recover', makeActionBtn('🏥 Pokémon Center','center','window.StoryMode.enterPokemonCenter()','center', _facOpts('center', [{label:'Free',tone:'free'}])));
// Section header: _emit('recover', ..., 'Heal & Team')
// enterPokemonCenter() only opens PC Storage + Underground tabs. No nurse-heal action exists
// in #screen-story-pokemoncenter (only Storage / Underground tabs, lines ~9030-9038).
```

**Repro**: Open a city hub; the Pokémon Center sits under "Heal & Team" labelled "Free". Click it — there is no heal button; party HP/PP/status restoration happens automatically between battles regardless.

**Blast radius**: Player mental model. New players expecting a classic "heal your party?" prompt find only PC/Underground. Compounds finding FP1 (fatigue) and the rival-gate "Heal" tip (FP5).

**Fix sketch**: If the auto-heal model is intended, retitle the chip/section to reflect "PC & Storage" or add an explicit (cosmetic-or-real) "Rest your team" affordance so the label is honest.

**Verification**: Center label/affordance matches what the facility actually does.

---
severity: P2
category: inconsistency
anchor_symbol: _pcRenderUndergroundTab
current_line_hint: ~47667
file: battle.html
agents: [story-mode-investigator]
fingerprint: b310fed6b664
confidence: high
status: open
---

**Title**: Underground claims "Starters … aren't for sale" but starters are sellable (unsellable flag stripped)

**Evidence**:
```js
// _pcRenderUndergroundTab empty-state text:
"Nothing on the table tonight. Starters and bonded partners aren't for sale here."
// But the sell gate only blocks on slot.unsellable === true:
const canSell = !!id && !unsellable && !isLastParty;
// And the load-time backfill strips unsellable from starters:
if (slot.starter === true && slot.unsellable === true) delete slot.unsellable;
// pickProfessorChoice sets starter:true with NO unsellable: "No hard restrictions — the player can ... sell it"
```

**Repro**: Pick a starter, catch a second mon, open Underground — the starter shows a Sell button (only blocked if it is the last party mon). The "Starters … aren't for sale" copy is false.

**Blast radius**: A player reassured by the copy could be surprised they sold their starter. Pairs with the welcome-tip claim (FP4).

**Fix sketch**: Either keep starters sellable and remove the "Starters … aren't for sale" clause, or re-block selling when slot.starter === true. Design-owned (pasteur) — flag.

**Verification**: Copy and sell-gate agree.

---
severity: P3
category: inconsistency
anchor_symbol: enterCity
current_line_hint: ~42439
file: battle.html
agents: [story-mode-investigator]
fingerprint: 2b18728e7602
confidence: high
status: fixed-main
---

**Title**: City0 welcome tip says the Underground "buys … never your starter" but starters are sellable

**Evidence**:
```js
// _storyShowOneTimeTip('welcome', ...): "...an Underground that buys the ones you outgrow — never your starter."
// Contradicts the unsellable-strip backfill + pickProfessorChoice comment ("can ... sell it like any other partner").
```

**Repro**: Read the City0 welcome tutorial, then sell the starter in the Underground.

**Blast radius**: Same root as FP3 — onboarding copy now disagrees with current mechanics.

**Fix sketch**: Reconcile with the FP3 decision; update the welcome tip clause to match.

**Verification**: Welcome tip matches actual sell rules.

---
severity: P3
category: dx
anchor_symbol: renderCityActions
current_line_hint: ~42674
file: battle.html
agents: [story-mode-investigator]
fingerprint: 99d6d7a2d22b
confidence: medium
status: fixed-main
---

**Title**: Rival-gate tip labelled "Heal …" deep-links to the Poké Center, which performs no heal

**Evidence**:
```js
if (rivalGateActive) {
    const _healTipLabel = _willFireWildNext ? 'Heal — your rival waits at the end of the road' : 'Heal — your rival is at the route gate';
    tips.push({ ..., label: _healTipLabel, click: 'window.StoryMode.enterPokemonCenter()' });
}
```

**Repro**: Reach a post-gym rival route (City 3 / City 6). The tip rail shows a "Heal — …" chip routing to the Center, which only opens PC/Underground. Also: rival fights are iconic and auto-heal+clear-fatigue on entry anyway, so the prompt to "heal first" is moot.

**Blast radius**: Reinforces the false Center=heal model. Minor — purely advisory chip.

**Fix sketch**: Relabel to "Prep your team" / route to Party or Tutor, or drop the chip since the rival fight starts the team fresh regardless.

**Verification**: Tip label and target match the facility's behavior.

---
severity: P3
category: dx
anchor_symbol: _pcRefresh
current_line_hint: ~6659
file: battle.html
agents: [story-mode-investigator]
fingerprint: 4540fbc5d3fe
confidence: high
status: open
---

**Title**: Dead CSS selector #story-pc-tab-journal-btn — no such tab button exists in the Poké Center

**Evidence**:
```css
#story-pc-tab-storage-btn, #story-pc-tab-underground-btn, #story-pc-tab-journal-btn { ... }
```
```js
// Poké Center HTML has only storage + underground tab buttons (no journal button).
// _pcRefresh's _tabBtns map has only { storage, underground }.
// The rival journal (_pcRenderRivalJournalTab) now renders in the Collection screen
// (_collectionTab === 'rival'), not the PC. The journal-btn selector is orphaned.
```

**Repro**: grep -n 'story-pc-tab-journal-btn' battle.html → only the CSS rule at ~6659; no matching element.

**Blast radius**: None functional — dead style. Signals the rival journal was relocated out of the PC and the CSS wasn't cleaned up.

**Fix sketch**: Drop #story-pc-tab-journal-btn from the selector list.

**Verification**: grep shows the selector removed; PC tab styling unchanged.

---
severity: P3
category: dx
anchor_symbol: enterPokemonCenter
current_line_hint: ~9018
file: battle.html
agents: [story-mode-investigator]
fingerprint: 5e12a6740351
confidence: medium
status: open
---

**Title**: Story facility regions use weak lowercase aria-labels ("story pokemoncenter", "story link")

**Evidence**:
```html
<div id="screen-story-pokemoncenter" ... role="region" aria-label="story pokemoncenter" ...>
<div id="screen-story-link" ... role="region" aria-label="story link" ...>
```

**Repro**: Screen-reader users entering these facilities hear "story pokemoncenter" / "story link" rather than the human label the screen header shows ("Pokémon Center" / "Cable Link Station").

**Blast radius**: A11y only. showScreen focuses the region on entry (line ~53292), so the aria-label is the first thing announced.

**Fix sketch**: Set aria-label to the displayed facility name ("Pokémon Center", "Cable Link Station"). Same pattern applies to sibling story-screen regions.

**Verification**: Region announces the friendly facility name on focus.

