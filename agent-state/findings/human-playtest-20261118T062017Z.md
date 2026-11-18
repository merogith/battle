---
severity: P1
category: bug
anchor_symbol: profAccept
file: battle.html
agents: [story, newcomer, collector]
fingerprint: 86f4fa120923
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Starter choices advertise moves replaced before the first battle

**Evidence**: `await _storyFilterBuildMovesForCity(picked.build, picked.name);`. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: Preview a fresh Horsea, Togepi or Electrike, claim it, then open Fight against the Rival. Compare the card and battle moves.

**Blast radius**: Starter trust and early battle balance.

**Fix sketch**: Prepare the eligible build before rendering the offer and save that same build when accepted.

**Verification**: Compare ordered names and types across the offer, claimed party, reload and Rival Fight menu.

---
severity: P1
category: a11y
anchor_symbol: __pbsGlobalTabTrapBound
file: battle.html
agents: [accessibility]
fingerprint: faa9f9df7811
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: New Settings dialogs trap Tab on the container

**Evidence**: `const modals = document.querySelectorAll('.modal:not(.hidden)');`. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: Use a keyboard to open Settings → Reading & accessibility. Tab stays on the overlay container. The same path traps Save & recovery and the Notebook.

**Blast radius**: Keyboard access to preferences, documentation and backups.

**Fix sketch**: Let the top dialog own Tab, Escape and browser Back. Restore focus to the visible opener.

**Verification**: Activate a checkbox, open and cancel a recovery review, and navigate Notebook pages by keyboard on desktop and narrow widths.

---
severity: P1
category: bug
anchor_symbol: _showErrandOffer
file: battle.html
agents: [collector]
fingerprint: b2916045387a
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: First-city errand invitation throws on click

**Evidence**: `window.StoryMode.showErrandOffer is not a function`. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: Reach the first city with the errand invitation visible, then click Someone here needs a hand.

**Blast radius**: Optional errand discovery from city hubs.

**Fix sketch**: Route the button to the existing errand offer entry point.

**Verification**: Open, dismiss and accept a real arrived-city errand using the invitation.

---
severity: P1
category: bug
anchor_symbol: showMoves
file: battle.html
agents: [newcomer]
fingerprint: 2bc79e4b51b3
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Move inspection instructions can cause an accidental turn

**Evidence**: `Tip: Tap moves or "i" for info. ▲▼ = damage matchup. Tap names for stats.`. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: Open Fight in the first Rival battle at 390×844. Tap Mud-Slap following the information instruction. The turn advances.

**Blast radius**: Touch battles and first-fight teaching.

**Fix sketch**: Provide distinct inspect and commit targets with language that describes each action.

**Verification**: Inspect from touch, assert intact PP and turn, dismiss, then submit the move normally.

---
severity: P1
category: a11y
anchor_symbol: openPermBoostPicker
file: battle.html
agents: [collector]
fingerprint: 89410b9cf122
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Vitamin targets are skipped by keyboard focus

**Evidence**: `window.StoryMode.openPermBoostPicker`. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: Open City Bag, choose Protein and Use, then Tab through the target dialog. Pointer selection applies the vitamin.

**Blast radius**: The city item picker for stat allocation.

**Fix sketch**: Render the eligible Pokémon as real keyboard-focusable buttons with clear names and effects.

**Verification**: Choose a target by keyboard and assert item and stat changes match a pointer selection.

---
severity: P2
category: a11y
anchor_symbol: story-create-name
file: battle.html
agents: [visual, newcomer]
fingerprint: ae803ff9a22b
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Small openings hide avatar or starter action controls

**Evidence**: `story-create-sprite-controls`. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: Open New Adventure at 320×568 and 568×260. Try the visible avatar controls on first paint. Then select a starter by name at 390×844 and find its Take action.

**Blast radius**: First-session forms, scroll and starter selection.

**Fix sketch**: Give the form and lab one reachable action area. Decouple move and item inspection from starter selection.

**Verification**: Exercise real taps and swipes with large text and long starter cards at all three widths.

---
severity: P2
category: inconsistency
anchor_symbol: openDownloadOfflineFlow
file: battle.html
agents: [returning]
fingerprint: c714cd17a982
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Reopened offline download shows a stale start action

**Evidence**: `An offline download is already running.`. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: Start the full download, close the tab partway through, reopen the app and choose Download all while the original job is still running.

**Blast radius**: Portable play and trust in a large transfer.

**Fix sketch**: Show the download section directly, reattach the reopened panel to existing progress and use explicit completion text.

**Verification**: Interrupt a real download, reopen, observe continuous status and start the saved game offline.

---
severity: P2
category: a11y
anchor_symbol: showMoves
file: battle.html
agents: [accessibility, newcomer]
fingerprint: a1f95477a1ae
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Narrow battle advertises shortcuts it does not handle

**Evidence**: `Fight (F)`. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: In the first battle at 390×844 focus Fight and press F. Open by Enter and press Escape. The narrow view ignores the displayed shortcut and leaves its move picker open.

**Blast radius**: Keyboard and narrow-window battle navigation.

**Fix sketch**: Enable the advertised commands for keyboard input independent of layout and restore focus after Back.

**Verification**: Use F, Escape and visible Back in both layouts while checking which action has focus.

---
severity: P2
category: inconsistency
anchor_symbol: renderMoves
file: competitive/arena.js
agents: [competitive]
fingerprint: 7f7d0636b768
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Competitive moves offer no pre-commit power or accuracy detail

**Evidence**: ``${move.type} · ${move.category}${pp}``. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: Enter a legal imported Gen 9 or Gen 1 battle. Try to learn a move’s power or effect from the buttons without submitting the turn.

**Blast radius**: Competitive onboarding and decision quality.

**Fix sketch**: Offer a read-only move inspector and use consistent species, nickname and form labels throughout the match.

**Verification**: Compare action details and species names across lead, switch, log and committed turn.

---
severity: P2
category: inconsistency
anchor_symbol: showBattleIntro
file: battle.html
agents: [story, accessibility]
fingerprint: 7a5797e8a76a
confidence: high
status: fixed-codex/battle-foundations
---

**Title**: Skip the talk adds another battle confirmation

**Evidence**: `Read them right for an edge — or skip straight to battle.`. See the build and screenshots in [Human-style playtest](../../docs/HUMAN_STYLE_PLAYTEST.md).

**Repro**: During a live road battle introduction, choose Skip the talk. The game shows a response and a Battle button.

**Blast radius**: Story pacing for players trying to advance quickly.

**Fix sketch**: Make Skip start the encounter directly or change the call to say that it skips just the choice.

**Verification**: Choose the neutral option in a fresh Rival and trainer introduction and check the next visible state.
