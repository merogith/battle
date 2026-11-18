---
severity: P1
category: bug
anchor_symbol: abandonAndReturn
file: battle.html
agents: [ui-screenshot-audit]
fingerprint: fbea2b4b424f
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Hall of Fame End Run deletes the active save immediately

**Evidence**: `btnEnd.onclick = function() { if (myTok === window._storyHofToken) window.StoryMode.abandonAndReturn(); };`.

**Repro**: In an isolated Chromium profile, open the Hall of Fame using the post-Hall debug checkpoint. The fixture has an active save. Tap End Run once. The title opens, the save key is gone, and no confirmation was displayed. [Before and after save state](../playthrough/human-qa/screenshot-audit/hall-end-run-report.json) · [Screenshot](../playthrough/human-qa/screenshot-audit/hall-end-run-before.png)

**Blast radius**: Completed campaigns, their active team, and access to the subsequent postgame.

**Fix sketch**: Make Save & Quit the exit that preserves progress. An explicit Delete Run action should use the existing confirmation and name what will be removed.

**Verification**: Reach the Hall of Fame with an active save. Exit, reload, and resume the postgame. Cancel the Delete Run confirmation and verify the same save survives.

---
severity: P1
category: bug
anchor_symbol: showMoves
file: battle.html
agents: [ui-screenshot-audit]
fingerprint: 4441ebc4111f
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Back intercepts attack taps in the touch battle move picker

**Evidence**: `#screen-battle[data-battle-layout="arena"] #move-menu .move-menu-scroll { overflow: visible; }`.

**Repro**: Use Jump In from the title in touch Chromium at 844×390. Open Fight and tap the center of Waterfall. Back receives the tap and returns to commands. At 320×568 the transformation and Back controls leave most of the move grid hidden. [Tap trace](../playthrough/ui-audit-engine/wrong-target-tap.json) · [Portrait](../playthrough/ui-audit-engine/main-320x568-moves.png)

**Blast radius**: Legacy Story and quick battles sharing the move picker, especially when a battle form is available.

**Fix sketch**: Reserve layout space for Back and the transformation controls. Make only the move list scroll, and surface a scroll cue when choices are below the fold.

**Verification**: Test actual center taps and scroll recovery on all four moves and their details at 320×568, 568×260 and 844×390, with and without a transformation available.

---
severity: P1
category: a11y
anchor_symbol: notice
file: game-upgrades.js
agents: [ui-screenshot-audit]
fingerprint: 1fca1541b4d0
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Invalid backup feedback sits below the visible file picker

**Evidence**: `function notice(text) { const n = element('p', text, 'upgrade-feedback'); n.setAttribute('role','status'); panel.appendChild(n); return n; }`.

**Repro**: Select an invalid JSON backup in Save & recovery. At 390×844 the file field starts at y636 and the error starts at y1414. At 844×390 the error starts at y848. [Screenshot](../playthrough/human-qa/fix-retest/progress/025-invalid-backup-feedback.jpg)

**Blast radius**: Recovery from invalid or damaged backup files.

**Fix sketch**: Show the reason inline with the file input and leave it ready for another choice.

**Verification**: Select an invalid file in portrait and landscape. The error should be visible at the input without scrolling and announced to assistive technology.

---
severity: P1
category: a11y
anchor_symbol: applyPreferences
file: game-upgrades.js
agents: [ui-screenshot-audit]
fingerprint: ad8e89a175f4
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Readable font preference leaves interface text in Press Start 2P

**Evidence**: `body, button, input, select, textarea, pre, code, kbd, samp { font-family: var(--ui-font) !important; }`.

**Repro**: Enable the readable font in a current 390×844 Chromium profile. The body, settings labels, heading and Close still compute to Press Start 2P. The Close word wraps over two lines. [Screenshot](../playthrough/human-qa/fix-retest/progress/022-reading-and-accessibility.jpg)

**Blast radius**: Reading preferences and all management controls using the shared interface font.

**Fix sketch**: Drive the readable font through the shared CSS variable. Give management controls a readable default and keep Close on one line.

**Verification**: Compare computed fonts before, after, and after reload at normal and larger text sizes.

---
severity: P2
category: a11y
anchor_symbol: upgrade-primary
file: game-upgrades.css
agents: [ui-screenshot-audit]
fingerprint: 7ec71dc88548
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Primary dialogue button focus drops contrast to 1.81:1

**Evidence**: `.upgrade-dialog .upgrade-primary,.upgrade-tabs button[aria-current="page"] { background:#a9efbc; border-color:#a9efbc; color:#092217; }`.

**Repro**: Focus Download complete backup by keyboard or hover it. The foreground remains #092217 while the background changes to #294b60. [Actual keyboard focus](../playthrough/human-qa/screenshot-audit/backup-primary-focused.png)

**Blast radius**: Download, restore, and Notebook primary actions.

**Fix sketch**: Define paired foreground and background colors for primary hover and keyboard focus.

**Verification**: Measure at least 4.5:1 contrast for button text in default, hover, active and focus states.

---
severity: P2
category: inconsistency
anchor_symbol: applyPreferences
file: game-upgrades.js
agents: [ui-screenshot-audit]
fingerprint: b82c05eacff4
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Cycling reduced motion overwrites three individual visual settings

**Evidence**: `function applyPreferences() {`.

**Repro**: In a fresh profile, note that battle animations, weather animation and particles are enabled. Turn Reduce interface motion on, then off. On reopening Visuals, all three individual settings are off. [Preferences](../playthrough/human-qa/screenshot-audit/accessibility-readable-font.png)

**Blast radius**: Stored per-effect preferences and reduced motion.

**Fix sketch**: Apply reduced motion as an effective override and preserve the individual switches.

**Verification**: Cycle reduced motion with a deliberately mixed set of visual preferences and verify the set survives the cycle and a reload.

---
severity: P2
category: inconsistency
anchor_symbol: reviewRestore
file: game-upgrades.js
agents: [ui-screenshot-audit]
fingerprint: af547956330a
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Restore review gives too little information before replacing progress

**Evidence**: `Restore this backup`.

**Repro**: Review an incoming backup. Badges and party are visible, but the choice can also replace Collection and settings. A fresh profile still offers to back up its current progress despite having no active run. [Screenshot](../playthrough/human-qa/fix-retest/progress/026-review-backup-on-a-fresh-landscape-profile.jpg)

**Blast radius**: Restore from files, save slots and checkpoints.

**Fix sketch**: Show the incoming trainer, timestamp, location and data being replaced. Compare with the current run when one exists and keep Cancel beside Restore.

**Verification**: Review distinct saved runs with the same badge and party counts, then review again in an empty profile.

---
severity: P2
category: a11y
anchor_symbol: enterColress
file: battle.html
agents: [ui-screenshot-audit]
fingerprint: 356e12e598e3
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Colress type labels cross neighboring buttons on phones

**Evidence**: `#screen-story-colress`.

**Repro**: At 390×844 the opening header occupies roughly one third of the viewport and the four-column grid cuts labels such as Electric, Fighting and Psychic into adjacent cells. [Screenshot](../playthrough/human-qa/fix-retest/facilities/13-colress-tera-purchase.png)

**Blast radius**: Tera training and other dense training facilities with the same typography constraints.

**Fix sketch**: Compact the facility heading and use a two- or three-column grid with readable type names. Use a narrow layout for Nature Rater and keep purchase confirmations clear of choices.

**Verification**: At 320 and 390 px, inspect every type label and purchase target with normal and larger text.

---
severity: P2
category: a11y
anchor_symbol: enterCasino
file: battle.html
agents: [ui-screenshot-audit]
fingerprint: 06cfb1d8d180
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: At 568×260 the Game Corner leaves about 70 px for play

**Evidence**: `#story-casino-panel-flip`.

**Repro**: Open the Game Corner on a short touch landscape screen. The coin choice, bet field and Flip button all start below the visible Coin Flip pane. With Roulette stats open, the table and Spin are below a roughly 60 px visible pane. [Screenshot](../playthrough/human-qa/screenshot-audit/game-corner-568x260.png) · [Measurements](../playthrough/human-qa/screenshot-audit/measurements.json)

**Blast radius**: Coin Flip, Roulette and their short-landscape panels.

**Fix sketch**: Use compact top chrome at short heights. Move the croupier tip to optional help and reserve a visible area for the primary game action.

**Verification**: Test the initial viewport and normal swipes with stats both closed and open at 568×260 and 844×390.

---
severity: P2
category: inconsistency
anchor_symbol: renderCityActions
file: battle.html
agents: [ui-screenshot-audit]
fingerprint: cd00858d38bb
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Chapter invitations sit below generic city guidance and overlap toasts

**Evidence**: `function renderCityActions(ev) {`.

**Repro**: Arrive in chapter towns. Help, rumors, training suggestions and the City Guide push down the story invitation. The First Catch toast covers the Empty Circle and Field Archive labels in Snowpoint. [Screenshot](../playthrough/human-qa/fix-retest/story/screenshots/045-chapter-open-chapter-1.png) · [League](../playthrough/human-qa/fix-retest/story/screenshots/462-chapter-open-chapter-9.png)

**Blast radius**: Visibility of optional scenes, Field Archive, and the player’s first look at new towns.

**Fix sketch**: Put one relevant story invitation immediately after the gold objective. Group recommendations below and move notifications clear of both actions.

**Verification**: Enter a chapter town with a pending achievement notification at 390×844 and short landscape. Check that the two next choices can be read and tapped.

---
severity: P2
category: inconsistency
anchor_symbol: menu-offline-entry
file: battle.html
agents: [ui-screenshot-audit]
fingerprint: de98842553ad
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Mobile title hides Offline play below equally prominent play tiles

**Evidence**: `id="menu-offline-entry"`.

**Repro**: On fresh title load, 2 px of the 60 px Offline play row is visible at 390×844, and none is visible at 844×390. At 844×390 the Competitive Arena tile is also fully below the fold. Desktop 1280×800 keeps the whole Offline row in view. [Measurements](../playthrough/human-qa/screenshot-audit/measurements.json) · [Screenshot](../playthrough/human-qa/screenshot-audit/title-390x844.png)

**Blast radius**: Discoverability of installation and secondary modes.

**Fix sketch**: Keep Story and Continue or Jump In up front, group other modes under one entrance, and move Offline play beside Settings as a utility.

**Verification**: Compare first-load title views in portrait, short landscape, and desktop with an active save and a fresh profile.

---
severity: P2
category: inconsistency
anchor_symbol: renderMoves
file: competitive/arena.js
agents: [ui-screenshot-audit]
fingerprint: 89a3a45a5214
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Competitive move details omit current weather-adjusted values

**Evidence**: `function renderMoves() {`.

**Repro**: Lead with Drizzle Pelipper. The log uses RainDance, the battlefield has no persistent Rain label, and the guide shows Weather Ball as Normal with base 50 and Hurricane at 70% alongside its never-miss-in-rain description. The simulator applies rain on resolution. [Screenshot](../playthrough/ui-audit-engine/arena-rain-guide-844x390.png) · [Turns and guide text](../playthrough/ui-audit-engine/rain-evidence.json)

**Blast radius**: Decisions that depend on current public weather and move properties.

**Fix sketch**: Show readable active weather on the field and label known effective values separately from base stats.

**Verification**: Compare the guide in rain and after weather ends, checking type, power and accuracy against the public simulator state.

---
severity: P2
category: a11y
anchor_symbol: collection-body
file: battle.html
agents: [ui-screenshot-audit]
fingerprint: 7012c851a639
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Collection navigation consumes most of the first phone view

**Evidence**: `id="collection-body"`.

**Repro**: Open Collection at 390×844. Three rows of tabs and five rows of Generation buttons leave about one row of Pokédex entries visible. The short landscape view cuts off Memorial without a clear overflow cue. [Screenshot](../playthrough/human-qa/fix-retest/modes/collection-help.png) · [Landscape](../playthrough/human-qa/fix-retest/postgame/safari-underground-pokedex-entry-landscape.png)

**Blast radius**: Pokédex browsing and access to alternate Collection pages.

**Fix sketch**: Keep the primary pages prominent and make secondary pages discoverable. Put the generation filter in one labeled control.

**Verification**: At 390×844, browse several entries from the first view and reach every Collection page using tap and keyboard.

---
severity: P2
category: inconsistency
anchor_symbol: showHallOfFame
file: battle.html
agents: [ui-screenshot-audit]
fingerprint: 75dc294a7273
confidence: medium
status: fixed-codex/battle-foundations
---

**Title**: League and chapter reveals flatten important beats into repeated panels

**Evidence**: `function showHallOfFame() {`.

**Repro**: Compare the illustrated Pallet and Victory Road shots to the Champion’s black stage, Hall of Fame roster, and immediate number pad. In Names Under Glass, arrival and evidence share framing and the clue lands near the footer. [Victory Road](../playthrough/human-qa/fix-retest/story/screenshots/459-road-scout-city9.png) · [Champion](../playthrough/human-qa/fix-retest/story/screenshots/488-vs-start-champion.png) · [Evidence reveal](../playthrough/human-qa/fix-retest/story/screenshots/384-chapter-secret-chapter-8.png)

**Blast radius**: Visual hierarchy, narrative payoff, and consistency of story presentation.

**Fix sketch**: Carry the setting into the confrontation, give the team one Hall of Fame ceremony, and stage evidence or aftermath as its own visual beat.

**Verification**: Run the key sequences on phone and desktop and check that the choice, clue and ceremony each have a clear focal point.
