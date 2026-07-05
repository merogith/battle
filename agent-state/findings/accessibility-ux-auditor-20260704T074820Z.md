---
severity: P2
category: a11y
anchor_symbol: logMsg
current_line_hint: ~16719
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 5dd229e31c03
confidence: high
status: open
---

**Title**: Tooltip spans (moves/abilities/items/nature) are mouse/tap-only — no keyboard access

**Evidence**:
```js
// logMsg, ~16728 — same pattern in draft cards (~19200-19252), summary (~21527-21630),
// prof screen (~53890-53909), collection (~63096+):
return `used <span class="log-move-link tip-move-cell" data-mn="${enc}"
  onclick="...showMoveTooltipTap(...)" onmousemove="...showMoveTooltip(...)"
  onmouseleave="window.hideTextTooltip()" style="...cursor:help;...">${moveName}</span>!`;
```

**Repro**: Tab through the battle screen or draft grid — the underlined move/ability/item/nature terms never receive focus; their tooltip content (move power/acc/effect, ability text) is unreachable by keyboard and invisible to screen readers.

**Blast radius**: Battle log, draft cards (Quick Battle draft), party/summary modal, professor starter picker, collection screen, tera chips — every `tip-move-cell` / `hover-text` / `log-move-link` / `tera-tip-hover` emission site (~30+). Inconsistent with `.field-pill` (~20490), which already got `role="button" tabindex="0"` + Enter/Space keydown in a prior fix.

**Fix sketch**: Extend the field-pill treatment to the shared tooltip-span emitters: add `tabindex="0" role="button"` and a keydown (Enter/Space) that reuses the existing tap handler; ideally centralize the span construction in one helper since the markup is already duplicated ~10 times.

**Verification**: Keyboard-only pass: Tab reaches a move name in the battle log, Enter opens the tooltip, Escape/blur closes it. Add a jsdom assertion that `logMsg('X used Tackle!')` output contains `tabindex`.

---
severity: P2
category: a11y
anchor_symbol: showMoveEffect
current_line_hint: ~15433
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 030937efa68f
confidence: high
status: open
---

**Title**: MoveAnimEngine + showStatArrow ignore prefers-reduced-motion (anime.js bypasses CSS catch-all)

**Evidence**:
```js
function showMoveEffect(moveName, type, cat, isPlayerTarget) {
    if (!settings.animations) return;              // no StoryFx.isReducedMotion() gate
    ...
}
function showStatArrow(isUp, isPlayer) {           // ~15460 — same
    if (!settings.animations) return;
```

**Repro**: Enable OS "reduce motion", keep Battle animations ON, use any move — full-screen-area particle bursts, beams, scaling/translating elements still animate. Compare `_battleHitShake` / `_applyHitImpact` / `_battleStatusFlash` (~14525-14612), which all early-return on `StoryFx.isReducedMotion()`.

**Blast radius**: All 118 anime.js call sites inside MoveAnimEngine's `typeAnims` + `playPhysicalImpact` / `playSpecialBeam` / `renderPerMoveAnim`, plus `showStatArrow`. The CSS `@media (prefers-reduced-motion)` catch-all (`animation-duration:1ms`) only tames CSS keyframes — anime.js drives inline styles via rAF, so it is unaffected.

**Fix sketch**: Add the same `if (window.StoryFx && StoryFx.isReducedMotion()) return;` guard at the top of `MoveAnimEngine.showMoveEffect` and `showStatArrow` (one line each, mirrors the four sibling battle-FX gates).

**Verification**: jsdom test with a `matchMedia` stub returning `matches:true` for reduced-motion asserts `showMoveEffect` spawns no child elements in the sprite container.

---
severity: P3
category: bug
anchor_symbol: storyCatchMasterPulse
current_line_hint: ~8004
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 0bf813761b2c
confidence: high
status: open
---

**Title**: Reduced-motion override list targets 7 nonexistent CSS classes (stale selectors)

**Evidence**:
```css
/* @media (prefers-reduced-motion: reduce), ~8004 */
.story-master-ball-glow, .story-master-ball-pulse, .badge-pulse,
.story-save-toast, .story-tutorial-enter-1, .story-tutorial-enter-2,
.story-tutorial-enter-3, .story-tutorial-enter-4 {
    animation: none !important;
```

**Repro**: `grep -c 'story-master-ball-glow\|badge-pulse\|story-tutorial-enter-1' battle.html` — each appears exactly once (this block only). The real Master Ball class is `.story-catch-ball--master` (~2815, infinite `storyCatchMasterPulse`); it is NOT in the list.

**Blast radius**: Currently masked by the `*` catch-all below (`animation-iteration-count:1; animation-duration:1ms`), so no user-visible motion leak today — but the "keep the static end-state" intent documented in the comment is dead code, and if the risky `*` catch-all is ever narrowed the infinite Master Ball pulse escapes reduced-motion. Of the 8 selectors only `.story-save-toast` matches anything real.

**Fix sketch**: Replace the stale selector list with the live class names (`.story-catch-ball--master`, current tutorial-overlay entrance classes) or delete the dead entries and add a comment noting the catch-all is the operative guard.

**Verification**: Grep each selector in the block resolves to ≥2 occurrences (definition + override).

---
severity: P3
category: a11y
anchor_symbol: openModal
current_line_hint: ~9502
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 5bcaad15ca33
confidence: high
status: open
---

**Title**: 14 static modal dialogs have no accessible name (aria-label/aria-labelledby)

**Evidence**:
```html
<div id="modal-game-alert" class="modal hidden" role="dialog" aria-modal="true" ...>
<div id="modal-game-confirm" class="modal hidden" role="dialog" aria-modal="true" ...>
<div id="modal-end-screen" class="modal hidden" role="dialog" aria-modal="true">
```

**Repro**: `grep -nE '<div id="modal-' battle.html | grep -v aria-label` — modal-settings, modal-story-run-summary, modal-story-abandon-confirm, modal-game-alert, modal-game-confirm, modal-online-host, modal-gauntlet-leaderboard, modal-online-pvp, modal-enemy-pool, modal-gauntlet-swap, modal-end-screen, modal-party, modal-story-bag, modal-story-party, modal-story-artifact. Only modal-help and modal-summary carry `aria-labelledby`.

**Blast radius**: Every unnamed dialog is announced as just "dialog" when `_a11yFocusIntoModal` moves focus in — the victory/end screen, settings sheet, and confirm prompts are the worst offenders since focus lands there automatically. Focus trap + ESC + focus restore are already excellent (ISSUE-144/190); the name is the last missing piece.

**Fix sketch**: Each modal already has a visible header element — add `id` + `aria-labelledby` per modal (pattern already proven on modal-help). For headerless confirms, a static `aria-label` ("Confirm", "Alert") suffices.

**Verification**: `grep -nE '<div id="modal-' battle.html | grep -vE 'aria-label'` returns 0 rows.

---
severity: P3
category: a11y
anchor_symbol: applySettingSwitch
current_line_hint: ~9544
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 7867c5a5f58c
confidence: high
status: open
---

**Title**: 7 selects/sliders labeled by adjacent <span> only — no programmatic association

**Evidence**:
```html
<span>vs AI style</span>
<select id="setting-ai-profile" onchange="window.setMenuAiProfile ? ..." style="...">
```

**Repro**: Screen reader on the Settings sheet / home-screen Battle Options announces bare "combo box" / "slider" for: `party-size-select` (~9424, Battle Options), `setting-gimmick-anim-speed` (~9512), `setting-display-mode` (~9522), `music-vol-slider` (~9532), `sound-vol-slider` (~9538), `setting-ai-profile` (~9544), and the generated `.tx-search-input` (~68782, placeholder-only). The sibling `<span>` text is not associated.

**Blast radius**: Settings modal + home-screen Battle Options panel (Quick Battle / Gauntlet config, back in scope) + tutor search. Contrast with the checkbox rows in the same modal, which correctly wrap in `<label class="settings-row" for=...>`.

**Fix sketch**: Give each descriptive span an `id` and add `aria-labelledby` on the control (or convert the row to the existing `<label>`-wrap pattern); give `.tx-search-input` an `aria-label` mirroring its placeholder.

**Verification**: Each listed control resolves an accessible name in devtools' accessibility pane; grep confirms no bare `<select`/`<input type="range"` without label association.

---
severity: P3
category: a11y
anchor_symbol: _catchRender
current_line_hint: ~60866
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 978f05ccbea7
confidence: medium
status: open
---

**Title**: Catch-screen ball buttons ~38px tall — below 44px touch-target floor on mobile

**Evidence**:
```js
return `<button type="button" onclick="window.StoryMode.catchThrow('${k}')" ...
  class="story-catch-ball${masterCls}"
  style="...padding:8px 12px;...font-size:12px;...">`;
```

**Repro**: 22px icon + 2×8px padding ≈ 38px computed height; `grep -n 'story-catch-ball' battle.html` shows no coarse-pointer `min-height` rule, unlike the systematic 44px bumps for `.sum-tab`, `.tx-*`, `.story-tutor-btn` under `@media (hover:none) and (pointer:coarse)`. Safari "Skip to Next" / "Leave Safari" buttons (~60843) are worse: padding 8px, font 10px ≈ 30px.

**Blast radius**: The catch screen is one of the highest-frequency tap surfaces in story mode (every wild/Safari encounter); a mis-tap on the wrong ball spends a consumable (Ultra vs Master Ball) irreversibly.

**Fix sketch**: Add `.story-catch-ball` and the Safari action buttons to the existing coarse-pointer 44px min-height block; purely CSS.

**Verification**: DevTools mobile emulation: computed height of each ball button ≥44px; desktop layout unchanged.

---
severity: P4
category: a11y
anchor_symbol: showScreen
current_line_hint: ~9989
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a6e066b6fc97
confidence: high
status: open
---

**Title**: Screen region aria-labels are raw identifiers ("story evtrainer", "story pokemoncenter")

**Evidence**:
```html
<div id="screen-story-evtrainer" ... role="region" aria-label="story evtrainer" ...>
<div id="screen-story-pokemoncenter" ... role="region" aria-label="story pokemoncenter" ...>
<div id="screen-story-trainercreate" ... role="region" aria-label="story trainercreate" ...>
```

**Repro**: showScreen() focuses the region on every transition (good), so a screen reader announces the label each time — "story evtrainer region", "story trainercreate region", "menu region". The labels read as machine-generated id fragments, not names.

**Blast radius**: All ~26 `#screen-*` regions; cosmetic for sighted users, but it is the FIRST thing announced on every screen transition for SR users because of the focus delivery.

**Fix sketch**: One-pass rename to human labels ("EV Trainer", "Pokémon Center", "Create your trainer", "Main menu"). Pure attribute edit, no behavior change.

**Verification**: `grep -nE 'aria-label="[a-z]+ [a-z]+"' battle.html` shows human-cased names for all screen roots.

