---
severity: P1
category: a11y
anchor_symbol: _buildProfPickCardElement
current_line_hint: ~45388
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a448d3578603
confidence: high
status: fixed-claude/focused-cori-sGNzn
---

**Title**: Professor "Choose This Pokémon" pick cards are click-only divs — keyboard/SR users can't select a starter/team mon

**Evidence**:
```js
const card = document.createElement('div');
card.className = `draft-card prof-pick-card tier-${tier}`;
card.innerHTML = `...`;
card.onclick = (e) => { if (e.target.closest('button, .hover-text, .type-badge, .draft-card-moves')) return; profSelectChoice(idx); };
return card;
```

**Repro**: Story → reach a Professor pick (any city prof choice, multi-choice mode). Tab through the screen: focus lands on the per-card ℹ button, the Accept button (disabled until a card is picked), and Back — but never on the cards themselves. With keyboard/SR only you cannot select a choice, so Accept stays disabled and the required action is unreachable.

**Blast radius**: Every Professor team-add event (the main way the team grows mid-run). Note the regular draft (`renderDraft`) already sets `role="button"`, `tabIndex=0`, `aria-label`, and an Enter/Space keydown — the professor card is the un-migrated twin, so this is a fixable inconsistency, not new design.

**Fix sketch**: Mirror `renderDraft`: give the card `role="button"`, `tabIndex=0`, an `aria-label` (name + grade + "select for your team"), and an Enter/Space keydown that calls `profSelectChoice(idx)`. Keep the inner ℹ/hover-text exclusions.

**Verification**: Tab to a prof card, press Enter — Accept enables and `prof-pick-card-selected` highlights. Re-run with a screen reader to confirm the card announces as a button.

---
severity: P2
category: a11y
anchor_symbol: _renderNarrativeOverlay
current_line_hint: ~46103
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: c1383b391838
confidence: high
status: open
---

**Title**: Cold-open / intro-rival narrative overlay is not a dialog — no role/aria-modal/label, no ESC, no focus management

**Evidence**:
```js
const ov = document.createElement('div');
ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.94);z-index:9998;...';
if (toneClass) ov.classList.add(toneClass);
// ... innerHTML built, onclick wired, then:
document.body.appendChild(ov);   // no role/aria-modal/aria-label, no keydown, no focus()
```

**Repro**: Start a new story run. The intro-rival cold-open (and every per-variant narrative scene / cold-open routed through `_renderNarrativeOverlay`) appears as a fullscreen layer. A screen reader announces nothing; keyboard focus stays on whatever was behind it. Compare with `_showStoryTutorialScene`, `_renderVictoryOverlay`, the city-arrival overlay, and the Hall-of-Fame overlay — all of which set `role="dialog"`, `aria-modal`, `aria-label`, and ESC/focus.

**Blast radius**: The single most prominent narrative moment of every run plus all choice-prompt scenes. SR users get a silent screen; keyboard users must blind-Tab to the Continue button (which is never auto-focused) to advance.

**Fix sketch**: Copy the pattern already used by `_showStoryTutorialScene`: set `role="dialog"`, `aria-modal="true"`, `aria-label` from the scene name/banner, `tabIndex=-1`, add an Escape keydown that calls `dismiss()` (when no choices pending), and focus the Continue button after append.

**Verification**: Open the intro cold-open with a screen reader — it should announce as a dialog with the speaker name; press Escape to dismiss; Tab should land on Continue first.

---
severity: P2
category: a11y
anchor_symbol: openModal
current_line_hint: ~13586
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: aedce7c75c51
confidence: high
status: open
---

**Title**: openModal saves/restores trigger focus but never moves focus INTO the dialog, and no modal has a focus trap

**Evidence**:
```js
window.openModal = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    try { const prev = document.activeElement;
        if (prev && prev !== document.body) window._modalFocusStack.set(id, prev); } catch (e) {}
    el.classList.remove('hidden');   // dialog shown; focus stays on the trigger button outside it
};
```

**Repro**: Open Settings, Help, Story Bag, Story Party, or any `.modal` from a button. Focus remains on the trigger (outside the now-`aria-modal` dialog). Tab keeps cycling through the background page behind the overlay — nothing constrains focus to the modal. SR users are told a modal is open but their reading cursor is still on the page.

**Blast radius**: All ~17 `.modal` overlays. They correctly declare `role="dialog"`/`aria-modal="true"` and restore focus on close, but the open path is half-finished: no focus-in, no trap. Same trap gap exists on the fullscreen overlays (`_showStoryTutorialScene`, victory, HoF) which focus a button but still let Tab leave.

**Fix sketch**: In `openModal`, after un-hiding, focus the first focusable element inside `el` (or `el` itself with `tabIndex=-1`). Add a shared focus-trap keydown (Tab/Shift+Tab wrap within the modal) keyed off the topmost open `.modal`.

**Verification**: Open Settings, confirm focus lands inside the sheet; Tab repeatedly and confirm focus never reaches background controls; close and confirm focus returns to the gear button.

---
severity: P3
category: a11y
anchor_symbol: _showStoryTutorialScene
current_line_hint: ~40327
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 3d270f248237
confidence: medium
status: open
---

**Title**: Story tutorial overlay is a proper dialog but lacks a focus trap (Tab escapes to background)

**Evidence**:
```js
ov.setAttribute('role', 'dialog');
ov.setAttribute('aria-modal', 'true');
ov.setAttribute('aria-label', npcName || nameplate || 'Story Tutorial');
ov.tabIndex = -1;
// ... focuses Continue button on append, ESC/Enter dismiss — but no Tab trap
```

**Repro**: Trigger any STORY_TUTORIAL_SCENES overlay (e.g. firstWild catch tutorial). It correctly announces as a dialog and focuses Continue, but pressing Tab moves focus to background controls behind the dim layer instead of staying on the single Continue button.

**Blast radius**: All tutorial scenes. Lower impact than the narrative-overlay finding because the dialog semantics + Continue focus + ESC are already present; only the trap is missing. The same shared trap from the `openModal` finding would resolve this.

**Fix sketch**: Reuse the shared focus-trap helper proposed for `openModal` on the tutorial overlay (and the other fullscreen `role="dialog"` overlays) so Tab/Shift+Tab cannot leave while it is open.

**Verification**: Open a tutorial scene, press Tab several times, confirm focus stays on Continue (or cycles only within the overlay).

---
severity: P3
category: dx
anchor_symbol: _modalEscapeBound
current_line_hint: ~13649
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 3aee2ffaaeaa
confidence: high
status: open
---

**Title**: Two near-duplicate global Escape keydown handlers both close the topmost modal

**Evidence**:
```js
if (!window.__pbsGlobalEscBound) { window.__pbsGlobalEscBound = true;
    document.addEventListener('keydown', function (e) { /* close topmost .modal:not(.hidden) */ }); }
// ...40 lines later...
if (!window._modalEscapeBound) { window._modalEscapeBound = true;
    document.addEventListener('keydown', function(e) { /* also close topmost .modal:not(.hidden) */ }); }
```

**Repro**: Read battle.html ~13610 and ~13649 — two separate guard flags register two document-level Escape listeners with overlapping logic (the second adds a game-confirm Promise carve-out; the first adds a `data-no-escape` carve-out). Both fire on every Escape.

**Blast radius**: Behavior is currently correct (both call closeModal, double-close is idempotent), but the two handlers respect different opt-out conventions (`data-no-escape` vs game-confirm), so a future modal that sets `data-no-escape` will still be closed by the second handler. Maintenance/drift hazard.

**Fix sketch**: Merge into one Escape handler that honors both the game-confirm Promise resolver and `data-no-escape`, behind a single guard flag.

**Verification**: Add `data-no-escape="true"` to a test modal, press Escape — it should stay open. Confirm game-confirm still resolves false on Escape.

