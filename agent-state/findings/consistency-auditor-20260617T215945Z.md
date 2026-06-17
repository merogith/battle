---
severity: P3
category: inconsistency
anchor_symbol: enterShop
current_line_hint: ~56718
file: battle.html
agents: [consistency-auditor]
fingerprint: 57060fcc6914
confidence: high
status: open
---

**Title**: Facility name spelled "PokéMart" (2 sites) vs "Pokémart" (14 sites) in UI

**Evidence**:
```js
// 56718:  ${btn(fico('mart'), 'PokéMart', "window.StoryMode.enterShop('mart')", ...)}
// 58109:  ...restock at any city PokéMart.</div>
// vs 14 other user-visible sites using 'Pokémart':
//   9619 (shop header), 12375 (help text), 48600 (action btn label), 58670, 61714, ...
```

**Repro**: `grep -oE "PokéMart" battle.html` → 2 hits; `grep -oE "Pokémart" battle.html` → 14 hits. The shop header (line 9619) the player sees on entry reads "Pokémart"; the city-menu button that opens it (56718) reads "PokéMart". Internal action-id 'Pokemart' (no diacritic, ~24 sites) is a key, not user-visible — leave it.

**Blast radius**: Story-mode city menu + out-of-balls battle prompt. Cosmetic only; no logic depends on the label text.

**Fix sketch**: Normalize the two "PokéMart" string literals (56718, 58109) to "Pokémart" to match the canonical shop header and the rest of the UI.

**Verification**: `grep -oE "PokéMart" battle.html` → 0 hits after the edit.

---
severity: P3
category: inconsistency
anchor_symbol: enterShop
current_line_hint: ~35050
file: battle.html
agents: [consistency-auditor]
fingerprint: 2a8d10acc624
confidence: high
status: open
---

**Title**: Item spelled "Pokéball" in horror-arc lore vs "Poké Ball" everywhere else

**Evidence**:
```js
// 35050: "A folded photograph in a Pokéball box ... The Pokéball is empty."
// 35053: "A folded photograph inside a Pokéball box ..."
// 35152: "A diary on the route, locked in a Pokéball case."
// 35155: "...locked inside a Pokéball case..."
// vs canonical "Poké Ball"/"Poké Balls" (40 user-visible sites, e.g. 12375, 55751, 56718, 58109)
```

**Repro**: `grep -oE "Pokéball" battle.html` → 5 hits (all in extra/horror-arc STORY lore body strings); `grep -cE "Poké Ball"` → 24 + 16 "Poké Balls". The 'Vivillon-Pokeball' sprite IDs (no diacritic) are form keys, not prose — leave them.

**Blast radius**: Extra-arc (horror) story lore overlays only. Cosmetic.

**Fix sketch**: Replace "Pokéball" → "Poké Ball" in the four lore strings (lines 35050/35053/35152/35155) to match the game-wide spelling.

**Verification**: `grep -oE "Pokéball" battle.html` → 0 hits after the edit.

