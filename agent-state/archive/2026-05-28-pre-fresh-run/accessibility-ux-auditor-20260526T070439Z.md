---
severity: P1
category: a11y
anchor_symbol: renderDraft
current_line_hint: ~15848
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 27b0bb57fb3a
confidence: high
status: open
---

**Title**: Draft pick cards are click-only <div>s — keyboard/SR users cannot select a Pokémon

**Evidence**:
```js
let btn = document.createElement('div'); btn.className = `draft-card tier-${tier}`;
// ...no tabindex, no role, no keydown added...
btn.onclick = () => { btn.onclick = null; selectDraft(draftItem); }; grid.appendChild(btn);
```

**Repro**: Open Draft screen (PvP / gauntlet). Tab through the grid — the cards never receive focus; Enter/Space do nothing. Only the inner info `<button>` is reachable. Drafting is impossible without a mouse/touch.

**Blast radius**: REDESIGN_PLAN §6 explicitly reuses this exact pipeline (`renderDraft`) for the new Fight Club 5-round gauntlet draft — the operability blocker propagates into the new screen unless fixed here.

**Fix sketch**: Build the card as `<button type="button">` (or add `role="button" tabindex="0"` + a keydown handler firing on Enter/Space). Keep the inner info button as a real nested control or move it out to avoid nested interactive elements.

**Verification**: Tab reaches each card, focus ring shows (global :focus-visible at L54 already covers it), Enter selects. Re-test in the new Fight Club draft.

---
severity: P1
category: a11y
anchor_symbol: showScreen
current_line_hint: ~48565
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 00376bc90497
confidence: high
status: open
---

**Title**: showScreen() does no focus management on story-screen transitions — focus is orphaned

**Evidence**:
```js
function showScreen(id) {
    document.querySelectorAll('.screen,.modal').forEach(el=>el.classList.add('hidden'));
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}
```

**Repro**: With a screen reader / keyboard, move between any story service screens (city → shop → professor → catch). The previously focused control gets `.hidden`; focus falls back to `<body>`, so SR users lose their place and keyboard users must re-Tab from the top of the document on every transition.

**Blast radius**: Every `#screen-story-*` navigation (15+ screens), plus the new daycare/hatch and Fight Club screens that will route through the same `showScreen`. Regions already carry `role="region" aria-label`, so the labeling exists — only focus delivery is missing.

**Fix sketch**: After unhiding, move focus to the new screen's heading or first interactive element (e.g. give the screen `tabindex="-1"` and `.focus()`, or focus its `h2/h3`). Optionally announce via an `aria-live` status.

**Verification**: SR announces the new screen's name/heading on each transition; keyboard Tab starts inside the new screen.

---
severity: P2
category: a11y
anchor_symbol: openModal
current_line_hint: ~12995
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: c0f4bce71793
confidence: high
status: open
---

**Title**: Modals restore focus on close but never move focus INTO the dialog on open

**Evidence**:
```js
window.openModal = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    try { const prev = document.activeElement;
          if (prev && prev !== document.body) window._modalFocusStack.set(id, prev); } catch (e) {}
    el.classList.remove('hidden');   // <-- focus stays on the trigger behind the modal
};
```

**Repro**: Open Settings / Run Summary / any `role="dialog"` modal. Focus remains on the launching button behind the overlay; SR users aren't moved into the dialog and may keep reading the (now-inert) page beneath.

**Blast radius**: All `role="dialog" aria-modal="true"` modals (~20). Close-side focus *return* (L13009) and the global Escape handler (L13019) are already correct — this is only the open-side gap. The new gauntlet leaderboard/swap modals inherit this.

**Fix sketch**: In `openModal`, after unhiding, focus the dialog container (`tabindex="-1"`) or its first focusable control / close button.

**Verification**: On open, focus lands inside the dialog; on close it returns to the trigger (already works).

---
severity: P2
category: a11y
anchor_symbol: story-dialog-text
current_line_hint: ~8318
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: b724187dc264
confidence: medium
status: open
---

**Title**: Story dialogue/NPC quote text is not in a live region — narration is silent to screen readers

**Evidence**:
```html
<div class="story-dialog-box">
    <p class="story-dialog-text" id="story-city-quote"></p>
</div>
<div id="story-city-tips" class="story-city-tips"></div>
```

**Repro**: Battle text is announced (`#battle-log` has `role="log"`, L9054), but story NPC dialogue (`#story-city-quote`, `#story-prof-quote`, `#story-prof-status`, shop quotes) updates silently — SR users get no story narration or event-result feedback outside battle.

**Blast radius**: All story service screens' dialogue/status text. REDESIGN_PLAN §6 wants gauntlet round results announced — same live-region need applies there.

**Fix sketch**: Add `aria-live="polite"` (and `aria-atomic="true"`) to the dialogue/quote/status containers, mirroring the casino result strips (L8649) that already do this correctly. For gauntlet round results, announce win/loss via a `role="status"` region.

**Verification**: SR speaks NPC quote and event-status changes as they render; Fight Club round results announce.

---
severity: P2
category: a11y
anchor_symbol: story-dialog-nameplate
current_line_hint: ~2216
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 95a0a3a5f2ea
confidence: high
status: open
---

**Title**: Story tone variants recolor nameplate text but not its yellow background — fails WCAG AA contrast

**Evidence**:
```css
.story-dialog-nameplate { color:#111 !important;
    background: linear-gradient(180deg,#ffd54f 0%,#ffb300 100%) !important; }
.story-tone-amber  .story-dialog-nameplate { color:#ffcc80; }  /* light-orange on yellow */
.story-tone-cold   .story-dialog-nameplate { color:#80deea; }  /* cyan on yellow */
.story-tone-purple .story-dialog-nameplate { color:#ce93d8; }  /* lavender on yellow */
```

**Repro**: The base rule sets a yellow gradient bg with `!important`; tone variants override only `color`/`border-color`, leaving the yellow bg. Cyan #80deea on yellow #ffd54f ≈ 1.6:1 and amber #ffcc80 on #ffd54f ≈ 1.3:1 — far below the 4.5:1 AA text threshold. The base dark-on-yellow (#111) passes; only the tone overrides fail. (Body `.story-dialog-text` stays #e8e8e8 on #1e2030 dark box — passes.)

**Blast radius**: amber/cold/purple/mourning/ash/static tone scenes (cutscene NPC nameplates).

**Fix sketch**: For tone variants, override the nameplate `background` to a dark fill (matching the box) when using light text, or keep `color:#111` and only tint the border. Verify each tone pair hits 4.5:1.

**Verification**: Contrast checker on each tone's nameplate text/bg pair ≥ 4.5:1.

---
severity: P2
category: a11y
anchor_symbol: _storyHatchRevealScene
current_line_hint: ~39815
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: bbbcf8f348ca
confidence: medium
status: open
---

**Title**: Planned hatch animation + Fight Club transitions need reduced-motion + live-region design up front

**Evidence**:
```js
function _storyHatchRevealScene(names) {
    // current reveal is TEXT-ONLY (_storyScene), SR-safe today
    _storyScene([{ accent:'#ffd54f', title:'Your Egg Hatched!', html:`The egg shudders, cracks...` }], ...);
}
```

**Repro**: Forward-looking. REDESIGN_PLAN §3b/§8b replaces this text reveal with an egg wiggle→crack→sprite-pop *animation* and adds Fight Club draft transitions, with no a11y constraints noted. Today's text reveal is accessible; the animation risks regressing it.

**Blast radius**: New daycare hatch scene + Fight Club draft/gauntlet screens. The existing global reduced-motion catch-all (L6660: `*{animation-duration:1ms}`) covers CSS keyframes, but a JS-driven sprite-pop sequence (cf. L9185 which already checks `prefers-reduced-motion`) must opt in explicitly.

**Fix sketch**: (a) Hatch animation: gate on `matchMedia('(prefers-reduced-motion: reduce)')` and fall back to the current text reveal (keep it, don't delete it); ensure the hatched-species name is announced via `role="status"`. (b) Draft picker: build as real buttons (see renderDraft finding) with focus moved to the grid on entry. (c) Gauntlet: announce each round result through a polite live region.

**Verification**: With reduced-motion on, hatch shows the still text reveal; draft is fully keyboard-operable; round wins/losses are announced.

---
severity: P3
category: a11y
anchor_symbol: online-host-format
current_line_hint: ~8113
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 8407ee14cfc4
confidence: medium
status: open
---

**Title**: A cluster of form controls lack accessible names (online host/join, casino bet, gauntlet opt-in)

**Evidence**:
```html
<select id="online-host-format" ...>           <!-- no label / aria-label -->
<input id="online-join-code" maxlength="8" ...> <!-- no label, no placeholder -->
<input id="story-casino-flip-bet" type="number" value="50"> <!-- no label -->
```

**Repro**: SR announces these as unlabeled "edit text" / "combo box". Affects online host format/timer selects (L8113/8119), join name/code inputs (L8146/8148), casino flip/roulette bet inputs (L8640/8701), gauntlet leaderboard opt-in (L8212). Note: Settings rows (L7996+), trainer-create name (L8919) and gen/mech checkboxes are correctly labeled — this is a contained cluster, mostly in the online/casino surfaces.

**Blast radius**: Online lobby, casino mini-games, gauntlet leaderboard. Low story-mode-core impact but trivial to fix.

**Fix sketch**: Add `aria-label` (or wrap/associate a visible `<label for=…>`) on each listed control. Mirror the already-correct pattern used in `#modal-settings`.

**Verification**: SR speaks a meaningful name for every input/select on these screens.

---
severity: P3
category: a11y
anchor_symbol: __pbsGlobalEscBound
current_line_hint: ~13019
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 587b740ecf41
confidence: medium
status: open
---

**Title**: Modals have aria-modal + Escape but no Tab focus trap — keyboard focus can leave the dialog

**Evidence**:
```js
document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;            // Escape closes topmost modal — good
    const modals = document.querySelectorAll('.modal:not(.hidden)');
    // ...no Tab-key containment anywhere...
});
```

**Repro**: Open any modal and press Tab repeatedly. `aria-modal="true"` is advisory only; without a trap, focus walks out to controls on the screen behind the overlay (which is not `inert`/`aria-hidden`), so a sighted keyboard user can operate background controls through the modal.

**Blast radius**: All `.modal` dialogs. Escape-to-close and focus-return are already handled, so this is the remaining piece of correct dialog semantics.

**Fix sketch**: On open, set the background (`#game-stage`/screens) to `inert` or `aria-hidden="true"`; or add a Tab handler that cycles focus within the dialog's focusable set. Pair with the openModal "focus into" fix.

**Verification**: Tab/Shift+Tab stay within the open dialog; background controls are unreachable until close.

