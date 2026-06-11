---
severity: P2
category: inconsistency
anchor_symbol: PERM_BOOST_ITEMS
current_line_hint: ~32685
file: battle.html
agents: [consistency-auditor]
fingerprint: 51dd9b25936e
confidence: high
status: fixed-main
---

**Title**: "Vitamin" names three distinct systems — IV items, casino prize, EV voucher

**Evidence**:
```js
// 32690: const PERM_BOOST_ITEMS = [...]  (protein/iron/... = IV-boost "vitamins")
// 32690 comment: "Distinct from the EV Trainer's Vitamin Pack voucher"
// 9196: casino subtitle "...guarantees a Rare Voucher + Vitamins!" (+1 IV)
// 59247: "Use 1 Vitamin Pack to apply EVs ... Vitamins left after use" (EV voucher)
```

**Repro**: grep -niE 'vitamin' battle.html — three referents in UI copy.

**Blast radius**: EV Trainer screen, casino prize copy, bag, IV item tooltips. Player reads "Vitamins" in casino, expects the EV "Vitamin Pack", gets IV items.

**Fix sketch**: Pure-text. Rename the IV-boost class to "IV Tonic/Supplement" in copy (keep `PERM_BOOST_ITEMS` id), or rename the EV voucher to "EV Pack". Casino prize copy should name whichever it actually drops. No mechanics change.

**Verification**: Each UI string referencing "vitamin" maps to exactly one system.

---
severity: P2
category: inconsistency
anchor_symbol: enterArtifactShop
current_line_hint: ~42922
file: battle.html
agents: [consistency-auditor]
fingerprint: a43436a263d4
confidence: high
status: open
---

**Title**: Relic vs Artifact used interchangeably for one object across label/key/fn/state

**Evidence**:
```js
// 42922: makeActionBtn('✨ Relic Annex','relic',...enterArtifactShop()...)  // buy
// 42963: makeActionBtn('✨ Artifact Hall','artifacts',...enterArtifactHall()...) // toggle
// state: sm.artifactShopOffersByCity, sm.artifactFreeClaimUsed; icon story_artifacts.png
// 50172 copy: "The Relic Annex. ... If you want one off the field, the Artifact Hall..."
```

**Repro**: grep -niE 'relic|artifact' battle.html — same noun, two words; key=relic but fn/state=artifact.

**Blast radius**: Two facility names ("Relic Annex" buys, "Artifact Hall" toggles) share one ✨ emoji and one icon; players can't tell them apart. Internal key/fn mismatch (relic key → enterArtifactShop) is a maintenance hazard.

**Fix sketch**: Pick ONE noun for the object (e.g. "Relic"). Keep distinct facility names by role: "Relic Shop" + "Relic Vault/Toggle". Pure-text for labels; internal rename (key vs fn) is a behavior-preserving refactor.

**Verification**: One canonical noun in all player copy; key/fn/state names agree.

---
severity: P3
category: inconsistency
anchor_symbol: makeActionBtn
current_line_hint: ~16580
file: battle.html
agents: [consistency-auditor]
fingerprint: 4dca97446477
confidence: high
status: fixed-main
---

**Title**: Grade badge prefix differs — `G{tier}` on draft cards vs `T{grade}` on swap/daycare slots

**Evidence**:
```js
// 16580 / 28634 / 28674 (Professor draft): <span class="tier-badge bg-tier-${tier}">G${tier}</span>
// 43748 / 44066 / 44212 (swap/daycare/MF):  <span ...>T${grade}</span>
// 44749: <span class="tier-badge bg-tier-${g}" title="Power tier...">T${g}</span>
```

**Repro**: grep -nE "G\${tier}|T\${grade}" battle.html — same underlying grade value, two letter prefixes, same bg-tier CSS class.

**Blast radius**: Player sees "G3" on the Professor pick and "T3" on the Daycare/swap for the same power band. Also "G" collides with the gold suffix (`amount + 'G'`).

**Fix sketch**: Pure-text. Pick one prefix (the CSS class is `tier-badge`/`bg-tier-N`, so "T#" is the more consistent choice and frees "G" for gold). Sweep all 8 sites.

**Verification**: One prefix everywhere a grade/tier badge renders.

---
severity: P2
category: inconsistency
anchor_symbol: _costBadge
current_line_hint: ~42956
file: battle.html
agents: [consistency-auditor]
fingerprint: e9291216e754
confidence: high
status: fixed-main
---

**Title**: Nature Rater cost badge shows "2000+" but TUTOR_COST_NATURE is a flat 2000

**Evidence**:
```js
// 42956: _facOpts('nature', [_costBadge(2000, '+')] ...)   // "+" implies it varies
// 53853: const TUTOR_COST_NATURE = 2000;                    // flat
// vs 42939 Move Tutor _costBadge(_moveCostForStage(), '+')  // genuinely staged → '+' correct
```

**Repro**: enter a Nature Rater in any city; charge is always 2000G regardless of stat/mon.

**Blast radius**: "+" suffix elsewhere (Tutor, Dojo, evolab, Link) signals "starting price, scales up." On Nature Rater it's misinformation. Dojo `_costBadge(500,'+')` and evolab `_costBadge(1500,'+')` should be re-checked the same way.

**Fix sketch**: Pure-text. Drop the "+" for facilities with a flat constant cost; keep it only where the cost is computed/staged.

**Verification**: A "+" badge appears only where the underlying cost can change.

---
severity: P2
category: inconsistency
anchor_symbol: _colressConfirm
current_line_hint: ~58357
file: battle.html
agents: [consistency-auditor]
fingerprint: 82b8202f5d43
confidence: high
status: fixed-claude/gifted-fermat-yfnqq5
---

**Title**: Colress Signature-Z silently overwrites the last move; confirm warns only about item/gimmick

**Evidence**:
```js
// 58357: confirm text = "Awaken Signature Z — equip ${sigZ}" → "...Replaces current held item / gimmick."
// 58366: const injIdx = mon.build.m.length < 4 ? mon.build.m.length : mon.build.m.length - 1;
// 58367: mon.build.m[injIdx] = reqMove;   // when 4 moves are full, drops the last move with no warning
```

**Repro**: give a 4-move mon a signature Z whose required move it doesn't know → a move is replaced; the dialog never said so.

**Blast radius**: Destructive-action consistency. Release/Sell (48440/48458) warn "This cannot be undone" + shiny/EV notes; move-overwrite teaches at Tutor warn ("Replaces \"oldMove\""). Colress Sig-Z is the one destructive path with no move-loss warning.

**Fix sketch**: When `m.length === 4` and reqMove absent, surface the dropped move name in the confirm ("This will replace <lastMove> with <reqMove>"). Mechanics-adjacent (touches build.m) — needs sign-off; the copy add alone is safe.

**Verification**: Confirm names the move being dropped before it happens.

---
severity: P3
category: inconsistency
anchor_symbol: makeActionBtn
current_line_hint: ~42945
file: battle.html
agents: [consistency-auditor]
fingerprint: 7c871a337924
confidence: high
status: open
---

**Title**: Button label patterns inconsistent — Professor uses verb+noun, all others noun-only; Evolution facility has 3 names

**Evidence**:
```js
// Noun-only: 'Move Tutor', 'Battle Dojo', 'Nature Rater', 'EV Trainer', 'Game Corner', 'Relic Annex'
// Verb+noun: 'Professor — Swap a Team Member'
// Evolution facility: action-list 'Evolution Tutor' (30046) | screen head 'Evolution Tutor' (9112)
//                     | button _npcStageName('evolab') = 'Evolution Teacher'/'Evolution Master' (53902)
```

**Repro**: scan city action buttons in one playthrough; Professor reads as an instruction, siblings as place names; the Evolution facility's button title differs from its screen title.

**Blast radius**: Reads as drift. Emoji prefixes ARE consistent (every facility has one). Pure-text.

**Fix sketch**: Decide one convention (recommend noun-only place names) and align the Professor label + the Evolution facility's three names to a single display string.

**Verification**: All facility buttons follow one verb/noun convention; Evolution facility shows one name in button + header.

---
severity: P3
category: inconsistency
anchor_symbol: makeActionBtn
current_line_hint: ~47531
file: battle.html
agents: [consistency-auditor]
fingerprint: 5ccebd126a71
confidence: high
status: open
---

**Title**: Empty-state copy varies across facilities for the same "no party member" condition

**Evidence**:
```
47531: "No Pokémon in your party. Visit the Professor or withdraw from..."
51998: "No Pokémon in your party. Visit the Professor to get one."
58750: "No Pokémon in your party. Visit the Professor first."
51532 / 57436 / 57984 / 58996: "No Pokémon in your party."  (no CTA)
52827 / 52925: "No party mons."     38613: "No team data."
```

**Repro**: open each facility with an empty party; trailing CTA + phrasing differ per screen.

**Blast radius**: Voice drift; "No party mons." / "No team data." read as dev-stub copy next to the polished strings. Pure-text.

**Fix sketch**: Single shared empty-party helper string (one phrasing + one CTA). Replace "No party mons."/"No team data." with it.

**Verification**: Every empty-party facility shows identical copy.

---
severity: P3
category: inconsistency
anchor_symbol: _costBadge
current_line_hint: ~42920
file: battle.html
agents: [consistency-auditor]
fingerprint: fadd94654030
confidence: medium
status: open
---

**Title**: "Free" badge wording inconsistent — "1st Free" vs "Free" vs "Claimed" vs "Locked"

**Evidence**:
```js
// 42920 relic / 42997 safari: label:'1st Free'
// 42770 / 42952 / 42968: label:'Free'
// 49981: 'Claimed'   38554 / 52102 / 52121 / 56811: 'Locked'
```

**Repro**: scan facility badges across cities; first-free facilities use "1st Free", others "Free"; post-claim states split "Claimed"/"Locked".

**Blast radius**: Minor visual drift in the badge strip. Pure-text.

**Fix sketch**: Standardize: "Free" for a free action, "1st Free" only where literally the first is free, one of {Claimed|Locked} for spent/gated. Document the vocabulary near `_costBadge`.

**Verification**: Badge strings drawn from one documented vocabulary.

