---
severity: P2
category: a11y
anchor_symbol: _maybeShowSaveToast
current_line_hint: ~30847
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: b17b3f418817
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Story autosave "💾 Saved" toast bypasses the polite live region — screen readers miss it

**Evidence**:
```js
// _maybeShowSaveToast at ~30847
const el = document.createElement('div');
el.className = 'story-save-toast';
el.textContent = '💾 Saved';
el.style.cssText = 'position:fixed;left:50%;bottom:18px;…';
document.body.appendChild(el);   // ← appends to <body>, NOT #toast-host
```

The toast helper that the rest of the game uses (`window.showToast`, ~8722) appends into `#toast-host` (line 7389) which has `aria-live="polite"`. `_maybeShowSaveToast` constructs its own DOM and appends straight to `document.body`, so the toast is never inside a live region and never announced. The visual styling also bakes in `pointer-events:none` so SR users can't even pull focus to it.

**Repro**: Run a story battle to completion with a screen reader on; the visual "💾 Saved" toast renders, but VoiceOver/NVDA stays silent.

**Blast radius**: Save events are the only confirmation a player gets that their progress persisted (the localStorage write is fire-and-forget). Blind story-mode players have no audible confirmation of autosave. Affects every transition: battle end, enterCity, renderActions, etc.

**Fix sketch**: Append the toast element into `document.getElementById('toast-host')` instead of `document.body`, or add `role="status" aria-live="polite"` directly on the element before appending. Keep the throttle + `pointer-events:none`.

**Verification**: After fix, `grep -A2 _maybeShowSaveToast battle.html` shows the host insertion. Run with a screen reader → "Saved" is announced once per ≥3s window.

---
severity: P2
category: a11y
anchor_symbol: _showStoryTutorialScene
current_line_hint: ~34943
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 3bc8f10d137b
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Story tutorial overlay (STORY_TUTORIAL_SCENES) is not a dialog — no role, focus trap, or ESC

**Evidence**:
```js
// _showStoryTutorialScene at ~34943
const ov = document.createElement('div');
ov.className = 'story-tutorial-overlay';   // no role, no aria-modal
…
ov.querySelector('button').onclick = function (e) { e.stopPropagation(); dismiss(); };
ov.onclick = function (e) { if (e.target === ov) dismiss(); };
document.body.appendChild(ov);             // no autofocus on Continue
```

The full-screen tutorial overlay (Prof. Oak intros for first-trainer-battle, first-wild, first-mart, etc. in `STORY_TUTORIAL_SCENES`) is a `<div>` with no `role="dialog"`, no `aria-modal="true"`, no `aria-labelledby` pointing at the nameplate, no focus management (focus stays on whatever button triggered the overlay), and no `Escape` key handler. Click-outside dismiss + auto-focus + ESC are the standard expectations for a story-blocking modal.

**Repro**: Trigger `playStoryTutorial('firstWild', …)` (first wild encounter). Open with keyboard — Tab does not enter the dialog; Esc does nothing; SR sees a context-less paragraph dropped into the page.

**Blast radius**: All 10+ first-time-mechanic scenes (firstTrainerBattle, firstWild, firstSafariCatch, firstMart, firstDept, firstSafari, firstCasino, firstPokemonCenter, …). These are the first impression for new players, so the keyboard/SR experience here is load-bearing for onboarding.

**Fix sketch**: Set `ov.setAttribute('role','dialog')` and `aria-modal="true"`; give the nameplate `id="story-tutorial-name-<uid>"` and `aria-labelledby` the overlay; `requestAnimationFrame(() => ov.querySelector('button').focus())`; add a keydown listener for `Escape`/`Enter` that calls `dismiss()`. Remove the listener on dismiss.

**Verification**: Tab into the overlay; SR announces "Your First Fight, dialog". Esc closes. Focus returns to the previously-focused element.

---
severity: P2
category: a11y
anchor_symbol: showVictoryOverlay
current_line_hint: ~38410
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 7196d6421a81
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Victory overlay is a plain `<div>` — no dialog role, no focus on Continue, ESC ignored

**Evidence**:
```js
// showVictoryOverlay at ~38410
const ov = document.createElement('div');
ov.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:9999;…';
const contBtn = document.createElement('button');
contBtn.textContent = 'Continue →';
…
const autoClose = setTimeout(dismiss, 6000);
contBtn.onclick = (e) => { e.stopPropagation(); dismiss(); };
…
ov.onclick = () => dismiss();
document.body.appendChild(ov);
```

The post-battle victory overlay is the highest-pomp moment of the run (badges, gold, mystery reveals, "First time ever" banner). It's a fullscreen layer with no `role="dialog"`, no `aria-modal`, no `aria-labelledby` on "VICTORY!", no `Escape`/`Enter` to dismiss before the 6 s autoclose, no focus on `Continue →`. SR users hear nothing announce. Sighted keyboard users can't dismiss early without finding the button with Tab.

**Repro**: Win any story battle → overlay opens. Hit Esc/Enter → nothing. Hit Tab → focus may or may not land on Continue (depends on prior focus).

**Blast radius**: Every story victory, every gym clear, every Elite/Champion celebration. Combined with the tutorial dialog gap (sibling finding), the highest-emotion story beats are also the least accessible.

**Fix sketch**: Same pattern as tutorial: `role="dialog"`, `aria-modal="true"`, label by the VICTORY heading, autofocus `contBtn` next frame, add Esc/Enter keydown that calls `dismiss()`. Keep the auto-close.

**Verification**: Esc after victory closes the overlay; SR announces "VICTORY!, dialog" on open.

---
severity: P2
category: a11y
anchor_symbol: modal-dialog-roles
current_line_hint: ~7519
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a8ccc1946cb8
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: 10 of 12 `.modal` overlays lack `role="dialog"` / `aria-modal` / labelledby

**Evidence**:
```
$ grep -nE 'role="dialog"' battle.html
7683:    <div id="modal-help" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="help-title">
7760:    <div id="modal-summary" class="modal hidden" role="dialog" aria-labelledby="sum-header-name" aria-modal="true">

$ grep -nE 'class="modal' battle.html | wc -l
12
```

Only `modal-help` and `modal-summary` declare themselves as dialogs. The remaining ten — `modal-settings`, `modal-story-run-summary`, `modal-story-abandon-confirm`, `modal-game-alert`, `modal-game-confirm`, `modal-online-host`, `modal-gauntlet-leaderboard`, `modal-online-pvp` (+ two more) — render as plain `<div class="modal">`. They function as modal dialogs (background blocks pointer events; titles like "Abandon this run?", "Host online battle"), so SR users get no context when they pop. `modal-game-alert` and `modal-game-confirm` are the in-page replacements for native `alert()`/`confirm()` (per the comment at line 7619) — these specifically must be dialogs.

**Repro**: Click ⚙ settings; open Story → Abandon Run; open Online → Host. SR announces "button" instead of "dialog, Settings / Abandon this run? / Host online battle".

**Blast radius**: Settings is the highest-frequency entry point. Abandon-Run is destructive. Both being unannounced is a real safety concern.

**Fix sketch**: Add `role="dialog" aria-modal="true"` to each `<div class="modal">`. Ensure the `<h2>` inside each has an `id`, and reference it via `aria-labelledby`. Centralise via `class="modal"` selector + a tiny `connectedCallback`-style init in JS so future modals inherit it.

**Verification**: `grep -cE 'class="modal[^"]*" *[^>]*role="dialog"' battle.html` returns 12.

---
severity: P2
category: a11y
anchor_symbol: modal-escape-key
current_line_hint: ~16555
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 44450b67ba55
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Only `modal-summary` handles Escape — settings, abandon, alert, confirm modals trap keyboard users

**Evidence**:
```
$ grep -nE "e.key === 'Escape'" battle.html
13021: moveOpen — closes move tooltip
16555: closes #modal-summary only
27015: closes a casino sheet (b / B / Escape)
29833: closes a one-off overlay
```

`closeModal('modal-X')` is wired up to a close button or click-on-backdrop on each modal, but the document-level Escape handler exists only for `modal-summary` (party summary). Keyboard-only players cannot dismiss `modal-settings`, `modal-game-alert`, `modal-game-confirm`, `modal-online-host`, `modal-online-pvp`, `modal-story-abandon-confirm`, `modal-story-run-summary`, or `modal-gauntlet-leaderboard` without hunting for the close button by Tab. `modal-game-alert` in particular blocks the entire game and is the in-page replacement for native `alert()` — native alerts close on Esc.

**Repro**: Open ⚙ Settings via keyboard, press Esc → nothing happens. Open Abandon Run, press Esc → nothing. Native-alert convention violated.

**Blast radius**: Every modal except summary. Pairs with the dialog-role finding (a11y users need both role + Esc).

**Fix sketch**: Generalise the `modal-summary` Escape handler into a single document-level `keydown` listener that finds the topmost non-hidden `.modal:not(.hidden)` and calls `closeModal(modal.id)`. Make sure `modal-game-confirm`'s Cancel path is invoked on Esc (since closing == cancelling).

**Verification**: Open each modal, press Esc → closes. `closeModal` runs.

---
severity: P3
category: a11y
anchor_symbol: screen-landmarks
current_line_hint: ~7400
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: ade33e34d4e7
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: All 24 `#screen-*` containers are plain `<div>` — no `<main>` or `role="region"`

**Evidence**:
```
$ grep -nE 'id="screen-[a-z-]+"' battle.html | head -5
7400:    <div id="screen-menu" class="screen active">
7490:    <div id="screen-draft" class="screen hidden" …>
7786:    <div id="screen-story-menu" class="screen hidden story-screen-outer">
7811:    <div id="screen-story-city" class="screen hidden story-screen-root" …>
7856:    <div id="screen-story-professor" class="screen hidden story-screen-root" …>
…
8496:    <div id="screen-battle" class="screen hidden">
```

24 top-level screens (menu, draft, story-menu, story-city, story-shop, story-tutor, story-evtrainer, story-pokemoncenter, story-casino, story-catch, story-link, story-evolab, story-gameover, story-artifacts, story-tester, story-trainercreate, collection, battle, plus 6 more). None use a landmark element. Screen readers see "main content" as one undifferentiated blob: the assistive nav-by-landmark shortcut produces zero hits.

**Repro**: Open VoiceOver rotor (VO+U) → Landmarks. Nothing for any screen.

**Blast radius**: One of the cheapest a11y wins available — affects landmark navigation across the entire game.

**Fix sketch**: At minimum, change the currently-active `#screen-*` to behave as `<main>` (only one main per page). Mechanically: keep the `<div>` tag but add `role="main"` to whichever screen is active (toggle in the existing show-screen helper), and `role="region" aria-labelledby="<screen-heading-id>"` on the rest. Each screen already has an `<h1>`/`<h2>` near the top — give it an id and label by it.

**Verification**: VoiceOver landmark count ≥ 1; rotor labels match the active screen name.

---
severity: P3
category: a11y
anchor_symbol: prefers-reduced-motion
current_line_hint: ~58
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: b14deb83ca98
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: 129 `@keyframes` definitions but only 5 `prefers-reduced-motion` overrides — sprite-in, dialog-in, master-pulse, badge-pulse all unguarded

**Evidence**:
```
$ grep -cE '@keyframes' battle.html
129
$ grep -cE 'prefers-reduced-motion' battle.html
5
$ grep -nE 'prefers-reduced-motion' battle.html
58:        @media (prefers-reduced-motion: reduce) {           # confetti, badge, rotate icon, hp-critical (4 rules)
5383:       @media (prefers-reduced-motion: reduce) {           # casino flip/wheel/slots/jackpot
6206:       @media (prefers-reduced-motion: reduce) {           # screen-trans + bottom-sheet
8696:        if (… '(prefers-reduced-motion: reduce)').matches) return;   # one-off in JS
26796:                try { return !!(… '(prefers-reduced-motion: reduce)').matches); }  # StoryFx isReduced flag
```

Storage of the StoryFx flag (line 26796) covers JS-driven sequences nicely, but pure CSS animations escape it. Examples of unguarded multi-second animations: `storyTutorialOverlayIn` / `storyTutorialSpriteIn` / `storyTutorialNameIn` / `storyTutorialDialogIn` (tutorial reveal cascade, lines ~4267-4296), `storyCatchMasterPulse` (Master Ball, infinite 2.2s loop, line ~1912), `storyBadgePulse` (victory badge — the line-60 override hits `.story-victory-badge-slot` but the `@keyframes storyBadgePulse` continues running on any other element that uses it).

**Repro**: macOS System Settings → Accessibility → Reduce Motion → On. Trigger first wild — sprite still scales & translates from off-screen; Master Ball still pulses every 2.2 s.

**Blast radius**: Vestibular-disorder users get the same motion onslaught as the default theme. Infinite pulse loops are particularly hostile.

**Fix sketch**: Wrap CSS animation declarations in a single `@media (prefers-reduced-motion: reduce) { *[class*="story-tutorial-"] { animation: none !important; } .story-catch-ball--master { animation: none !important; box-shadow: 0 0 14px rgba(206,147,216,0.55) !important; } … }` block. Audit the 129 keyframes and short-list the ≥800 ms / infinite ones (probably ~25 selectors).

**Verification**: With reduced-motion on, no element on the catch screen or tutorial overlay animates for >100 ms.

---
severity: P2
category: a11y
anchor_symbol: type-badge
current_line_hint: ~14906
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 2c0ca902ef08
confidence: high
status: open
---

**Title**: Tooltip-only data (type chart, move info, status terms) is `onmousemove`-gated — keyboard & touch get nothing

**Evidence**:
```js
// getTypeHTML at ~14906
let html = `<span class="type-badge type-${t1}" onmousemove="window.showTypeTooltip('${t1}', event)" onmouseleave="window.hideTextTooltip()" style="cursor:help;">${t1}</span>`;

// Battle-log move link at ~12958
return `used <span class="log-move-link tip-move-cell" data-mn="${enc}" onclick="…showMoveTooltipTap(…)" onmousemove="…showMoveTooltip(…)" onmouseleave="…">${moveName}</span>!`;
```

The defensive/offensive type chart, raw move stats (BP/Acc/PP/effect), and inline tip-term glossary are *only* surfaced via tooltip. The triggers are `onmousemove` + `onclick` — there is no `onfocus`/`onblur` pair, so keyboard users tabbing through battle log spans get no tooltip even if the element is focusable. Touch users hit the `onclick` "tap mode" branch (good) but only on terms that have an `onclick` handler; many decorative type badges (`getTypeHTML` above) lack one entirely.

**Repro**: Tab to a "burned" / "leech-seeded" status word in the battle log → nothing. Press Enter on a type badge in the foe's stat box → nothing.

**Blast radius**: Type chart is critical learning content. Hover-only delivery makes it inaccessible to keyboard, touch on decorative badges, and many SR users.

**Fix sketch**: For each tooltip helper, mirror `onmousemove` with `onfocus` (using the same handler) and `onmouseleave` with `onblur`. Add `tabindex="0"` + `role="button"` to type badges and tip-term spans that don't already have them. The existing `showFieldTooltipFromData` at line 16034 already uses both `onclick` and `onkeydown` — replicate that pattern globally.

**Verification**: Tab to a type badge → tooltip shows on focus; type chart announces via SR.

---
severity: P3
category: a11y
anchor_symbol: storyCatchMasterPulse
current_line_hint: ~1908
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 679f436786d4
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Master Ball purple pulse runs forever with no reduced-motion override; surrounding text/glow stays readable but the loop is hostile

**Evidence**:
```css
.story-catch-ball--master {
    box-shadow: 0 0 14px rgba(206, 147, 216, 0.55), inset 0 0 14px rgba(206, 147, 216, 0.18) !important;
    animation: storyCatchMasterPulse 2.2s ease-in-out infinite;
}
@keyframes storyCatchMasterPulse {
    0%, 100% { box-shadow: 0 0 14px rgba(206, 147, 216, 0.55), inset 0 0 14px rgba(206, 147, 216, 0.18); }
    50%      { box-shadow: 0 0 22px rgba(206, 147, 216, 0.85), inset 0 0 18px rgba(206, 147, 216, 0.32); }
}
```

Contrast itself is fine: `#ce93d8` text on `rgba(20,28,40,0.6)` over a dark battle background gives ~7:1, passes WCAG AA. The accessibility issue is that the pulse is `infinite` with no `prefers-reduced-motion` carve-out. The catch screen typically holds the player's attention for 30-90 s while they read flee/catch percentages — that's ≥15 pulses of an eye-catching glow loop.

**Repro**: With reduced motion enabled (macOS / Windows / Firefox flag), open any wild encounter where you hold ≥1 Master Ball → button still pulses every 2.2s.

**Blast radius**: Vestibular / photosensitivity-sensitive users. Pairs with the broader reduced-motion finding.

**Fix sketch**: Inside an existing `prefers-reduced-motion` block (or a new one): `.story-catch-ball--master { animation: none !important; }`. Keep the static box-shadow so the affordance ("this ball is special") still reads.

**Verification**: Open catch screen with reduced motion → glow holds static.

---
severity: P3
category: a11y
anchor_symbol: story-shop-buy-btn
current_line_hint: ~2267
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a93e15e90227
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Mobile touch targets in story shops top out at 42px — under the WCAG 44×44 baseline

**Evidence**:
```css
.story-shop-buy-btn {
    min-height:34px; padding:6px 14px; font-size:12px; …
}
/* mobile override at ~5667 */
@media (max-width: 480px) {
    .story-shop-buy-btn { min-height: 42px !important; padding: 8px 18px !important; … }
}
```

The Mart, Department Store, Artifact Shop, Tutor, Colress, Event Trainer, Fanclub buy buttons all share `.story-shop-buy-btn` — 34 px desktop, 42 px mobile. The 42 px is short of the WCAG 2.1 SC 2.5.5 (AAA) target-size 44×44 minimum and the more recent SC 2.5.8 (AA) 24×24 floor for "no spacing exemption". Adjacent rows make accidental taps likely. Compare to the battle command grid (60 px) and the modal-summary tabs (44 px) — both meet the bar.

**Repro**: Open Mart on a phone, tap "Buy" — possible to hit the adjacent item's button when scrolling.

**Blast radius**: Every shop. The mobile shop experience is a P2 surface (story mode is the polish target, and most run time outside battles is spent in shops).

**Fix sketch**: Bump the `@media (max-width: 480px)` override to `min-height: 44px`. Also widen the row gap from `10px` to `12px` so the spacing exemption applies.

**Verification**: DevTools mobile mode at 360px width → measure the buy button bounding box ≥ 44×44.

---
severity: P3
category: a11y
anchor_symbol: modal-online-host
current_line_hint: ~7637
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: bdcd17777e9c
confidence: high
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Online Host/Join form labels are not programmatically associated with their inputs

**Evidence**:
```html
<!-- modal-online-host at ~7637 -->
<label style="display:block;font-size:12px;margin:10px 0 4px;">Your display name</label>
<input id="online-host-name" maxlength="24" placeholder="Host" style="…">

<!-- modal-online-pvp at ~7673 -->
<label style="display:block;font-size:12px;margin:8px 0 4px;">Your name (leaderboard)</label>
<input id="online-join-name" maxlength="24" placeholder="Trainer" style="…">
<label style="display:block;font-size:12px;margin:10px 0 4px;">Room code</label>
<input id="online-join-code" maxlength="8" style="…">
```

The `<label>` elements are visually adjacent to the inputs but missing `for="online-host-name"`/etc., and the inputs lack `aria-labelledby`/`aria-label`. SR users hear "edit text" with no name; clicking the label does not focus the input. Contrast with the trainer-create form at ~8370 which uses the wrapping-`<label>` pattern correctly.

**Repro**: Open Online → Host with VoiceOver → Tab to first text field → announced as "edit text" with no name.

**Blast radius**: Two modals, three inputs. Small surface but trivial to fix and a common heuristic that linting catches.

**Fix sketch**: Either add `for="online-host-name"` (etc.) on the labels, or wrap each label/input pair into a single `<label>` element following the pattern used in `screen-story-trainercreate`.

**Verification**: SR announces "Your display name, edit text" on focus; clicking the label focuses the input.

---
severity: P3
category: dx
anchor_symbol: STORY_TUTORIAL_SCENES
current_line_hint: ~34785
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 92a8d59337aa
confidence: medium
status: open
---

**Title**: Tutorial scenes are text-only walls of 60-120 words — no audio, no progressive reveal, no skip-to-end affordance

**Evidence**:
```js
// STORY_TUTORIAL_SCENES.firstTrainerBattle at ~34786
firstTrainerBattle: {
    metaKey: 'tutorial-first-trainer-battle',
    sprite: 'Oak', name: 'Prof. Oak', nameplate: 'Your First Fight',
    lines: [
        '"Two trainers, two teams, one road. That\'s a battle."',
        '"Tap ⚔ FIGHT to pick a move. Each one has its own PP, so the strongest hit isn\'t always the right one. Physical, Special, and Status all read off different stats — type matters more than raw level. Super-effective doubles your damage; the wrong type can half it."',
        '"🔴 POKÉMON swaps your active partner — it costs your turn, so use it on a read. 🎒 BAG burns an item. 🏃 RUN forfeits the fight and a slice of gold. Keep that HP bar green."'
    ]
}
```

Each tutorial dumps three multi-clause sentences in one frame with no per-line "Next" pacing — the player gets all 60-100 words at once and a single "Continue →" button. There's no voice/SFX channel, no incremental reveal, no "I've read this, don't show again" toggle (the dedupe is automatic via `tipsShown`, which is good, but means the player can't *intentionally* re-read a tutorial). For users who read slowly or use a screen reader, the text dump is announced as one block; SR users can't pause within it.

**Repro**: Trigger `firstTrainerBattle` — read it in <5s; nothing tracks reading progress.

**Blast radius**: 10+ first-time scenes. The tutorial is the single most important touchpoint for player retention; a text-wall here is also a missed opportunity to teach type matchups via demo animation.

**Fix sketch**: Convert `lines:` into a per-line reveal — render only the first line, advance on Continue/Tap. Add an SR-friendly `aria-live="polite"` announcement per line. Optionally: a "Re-show last tutorial" entry in Settings (the `tipsShown` flag is already keyed by `metaKey` so this is one-line). A subtle 8-bit "blip" SFX per line would also help engagement (already in use elsewhere for shop chimes — `StoryFx`).

**Verification**: Open a tutorial → only line 1 visible; Continue advances; final continue dismisses.

---
severity: P3
category: a11y
anchor_symbol: story-tutorial-overlay
current_line_hint: ~4256
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: dcc6311c0e55
confidence: medium
status: fixed-claude/sharp-keller-eZEDN
---

**Title**: Tutorial overlay's four-stage entrance animation has no reduced-motion fallback

**Evidence**:
```css
.story-tutorial-overlay { …animation: storyTutorialOverlayIn 0.32s ease-out both; }
.story-tutorial-sprite  { …animation: storyTutorialSpriteIn 0.55s cubic-bezier(0.18,0.9,0.32,1.18) both; }
.story-tutorial-name    { …animation: storyTutorialNameIn 0.4s ease-out 0.25s both; }
.story-tutorial-dialog-host { …animation: storyTutorialDialogIn 0.5s ease-out 0.4s both; }
.story-tutorial-continue { animation: storyTutorialNameIn 0.4s ease-out 0.7s both; }
```

The tutorial cascade plays four staggered animations totaling ~1.1s before the Continue button is even visible (it animates in last at 0.7s delay). With `prefers-reduced-motion: reduce`, none of these collapse — Sprite scaling/translate, fade-in cascades, all play at full intensity. The existing line-58 reduced-motion block targets confetti / victory-badge / rotate-icon / hp-critical only.

**Repro**: Reduced motion on, trigger any first-time tutorial → sprite still bounces in, name slides down, dialog scales up, button fades in.

**Blast radius**: Pairs with the broader prefers-reduced-motion finding but is highlighted separately because tutorials are the load-bearing on-boarding moment.

**Fix sketch**: Add to existing line-58 block: `.story-tutorial-overlay, .story-tutorial-overlay * { animation: none !important; opacity: 1 !important; transform: none !important; }`. Or scope a fresh `@media (prefers-reduced-motion: reduce) { .story-tutorial-overlay { animation: none; } .story-tutorial-sprite, .story-tutorial-name, .story-tutorial-dialog-host, .story-tutorial-continue { animation: none; } }` block near line 4308.

**Verification**: With reduced motion on, all four elements render instantly when the overlay mounts.

