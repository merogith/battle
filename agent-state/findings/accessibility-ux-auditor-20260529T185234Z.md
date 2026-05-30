---
severity: P2
category: a11y
anchor_symbol: renderCatchScreen
current_line_hint: ~9079
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a90d80077070
confidence: high
status: open
---

**Title**: Catch screen result/throw text has no aria-live; outcomes silent to screen readers

**Evidence**:
```html
<!-- screen-story-catch: body is rebuilt every throw, no live region -->
<div id="story-catch-body" style="flex:1;overflow-y:auto;...background:rgba(6,16,10,0.35);..."></div>
```
`renderCatchScreen()` injects `_catchState.message` (e.g. "It broke free!", "Gotcha!", boss-HP changes) into `#story-catch-body` as a plain `<div>` via `innerHTML`. The casino result strips all carry `aria-live="polite"` (lines 9184/9224/9265) but the catch flow — the single most outcome-driven Story screen — has none. A blind player throws a ball and gets no announcement of catch/break-free/flee.

**Repro**: VoiceOver/NVDA on, enter a Wild Encounter, throw a ball. Result text appears but is not announced.

**Blast radius**: Catch screen, Safari mode, Caged God boss (`bossMode` HP attrition messages also live here).

**Fix sketch**: Add `aria-live="polite" aria-atomic="false"` to `#story-catch-body` (HTML line 9079), or wrap the `${message}` block in a dedicated `role="status"` element. Mirror the casino pattern.

**Verification**: With a screen reader, each throw outcome is spoken once.

---
severity: P2
category: a11y
anchor_symbol: pcRenderStorage
current_line_hint: ~47557
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: d7eb819e92a0
confidence: high
status: open
---

**Title**: Pokémon Center storage rows are mouse-only clickable divs (no keyboard access)

**Evidence**:
```html
<div data-pc-row="team" data-pc-id="..." style="...cursor:pointer;" title="Click to view full build">
  ...<span ...>... <span ...>ⓘ</span></span>
  <button ...>Deposit</button>
</div>
```
The row `<div>` (lines 47557, 47595, and Underground 47688) carries a click handler delegated via `closest('[data-pc-id]')` at 47616 to open the full build summary, but has no `tabindex`, no `role="button"`, and there is NO keydown handler. The "view build" affordance is signalled only by a tiny `ⓘ` glyph. Keyboard/SR users can reach the Deposit/Withdraw/Release buttons but can never open a Pokémon's full build. Contrast the field-pill at line 17626 which does it correctly (`role="button" tabindex="0"` + Enter/Space keydown).

**Repro**: Pokémon Center → PC Storage tab. Tab through; the row itself is never focusable, only the inner buttons.

**Blast radius**: PC Storage tab + The Underground tab (`screen-story-pokemoncenter`).

**Fix sketch**: Add `role="button" tabindex="0"` to the row div and an `onkeydown` (Enter/Space) that fires the same `data-pc-id` handler, or move the click affordance onto a dedicated info `<button>` next to the action buttons.

**Verification**: Tab to a PC row, press Enter — build summary opens.

---
severity: P2
category: contrast
anchor_symbol: casino-game-subtitle
current_line_hint: ~5635
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: e06202f65435
confidence: high
status: open
---

**Title**: Casino subtitle cream text on light-gold/rose panels fails WCAG AA contrast

**Evidence**:
```css
.casino-panel.theme-flip  { background-color: #f3d873; }  /* light gold */
.casino-panel.theme-slots { background-color: #e85e7a; }  /* light rose */
.casino-panel .casino-game-subtitle { color: var(--gc-cream); /* #fff5d0 */ font-size: 11px; text-shadow: 0 1px 0 rgba(0,0,0,0.6); }
.casino-subtitle-note { color: var(--gc-cream); opacity: 0.85; font-size: 10px; }
```
`.casino-game-subtitle`/`.casino-subtitle-note` are direct children of the panel (HTML 9158, 9192). Cream `#fff5d0` on light-gold `#f3d873` is ~1.3:1 — far below the 4.5:1 AA threshold for 10–11px text. A 1px dark text-shadow does not compensate at this size. The roulette panel (dark felt) is fine; flip + slots fail.

**Repro**: Open Game Corner → Coin Flip and Slots tabs; read the rules subtitle on the light panel.

**Blast radius**: `screen-story-casino` Coin Flip + Slots tabs.

**Fix sketch**: Use a dark ink color (`var(--gc-ink)` #2c1c14) for subtitles on the light theme panels, or give the subtitle a translucent dark plate background like the prize/result strips already use.

**Verification**: Contrast checker reports >=4.5:1 for subtitle text on both flip and slots panels.

---
severity: P3
category: a11y
anchor_symbol: story-catch-ball
current_line_hint: ~49299
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 8a390bc3cd95
confidence: medium
status: open
---

**Title**: Catch ball buttons lack accessible name reading the success %; bare-icon img alt empty

**Evidence**:
```html
<button type="button" onclick="...catchThrow('master')" ... class="story-catch-ball...">
  <span ...><img src="${display.icon}" alt="" ...><span><strong>${display.name}</strong>... ×${have}</span></span>
  <span style="color:#fff;">${pct}%</span>
</button>
```
The ball buttons are real `<button>`s (good) and the % is text (good, not color-only). But the accessible name concatenates as e.g. "Master Ball ✨ (∞ (guaranteed)) ×1 100%" with no label tying the trailing number to "catch chance", and the locked Master Ball shows "🔒 boss" with the lock emoji as the only state cue. An `aria-label` summarizing "Great Ball, 3 left, 55% catch chance" would read far cleaner.

**Repro**: Screen reader over the ball list in a Wild Encounter.

**Blast radius**: `screen-story-catch` ball list (regular + Safari Ball row).

**Fix sketch**: Add a computed `aria-label` per button: `"${display.name}, ${have} left, ${pct}% catch chance"` (or "locked, reserved for boss"). Keep `alt=""` on the decorative icon.

**Verification**: SR announces a single coherent label per ball button.

---
severity: P3
category: a11y
anchor_symbol: story-pc-tab-storage-btn
current_line_hint: ~9030
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 6b35ed82452d
confidence: medium
status: open
---

**Title**: Pokémon Center tab buttons not exposed as a tablist (no role=tab/tabpanel)

**Evidence**:
```html
<div style="display:flex;gap:0;...">
  <button id="story-pc-tab-storage-btn" onclick="...pcSwitchTab('storage')" ...> PC Storage</button>
  <button id="story-pc-tab-underground-btn" onclick="...pcSwitchTab('underground')" ...> The Underground</button>
</div>
<div id="story-pc-body" ...></div>
```
These are real focusable buttons (keyboard-OK) but the active tab is signalled only by a colored bottom-border + text color (`#4caf50` vs `#888`) — a color-only state with no `aria-selected`/`role="tab"`. The casino does this correctly with `role="tablist"/tab/tabpanel"` + `aria-selected` (lines 9149-9153). The PC tab strip is inconsistent and the active state is invisible to SR + low-vision users.

**Repro**: Pokémon Center; SR gives no "selected" state for the active tab.

**Blast radius**: `screen-story-pokemoncenter` tab strip.

**Fix sketch**: Wrap in `role="tablist"`, add `role="tab" aria-selected` to each button and `aria-controls` to `#story-pc-body`; toggle `aria-selected` in `pcSwitchTab`. Mirror the casino implementation.

**Verification**: SR announces "PC Storage, selected, tab" vs "The Underground, tab".

---
severity: P3
category: a11y
anchor_symbol: story-crucible-header
current_line_hint: ~9044
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 48fe61e2f764
confidence: medium
status: open
---

**Title**: Crucible & Catch headers use empty spacer spans instead of a back control; no escape from Crucible header

**Evidence**:
```html
<div class="story-shop-header-row" ...>
  <span style="width:32px;"></span>   <!-- placeholder where a back button sits on other screens -->
  <h3 ...>...The Crucible</h3>
  <span id="story-crucible-gold" ...>...0G</span>
</div>
```
`screen-story-crucible` (9044) and `screen-story-catch` (9075/9077) use empty `<span style="width:32px">` placeholders for header symmetry where every other facility screen puts an `aria-label`'d back `<button>`. Harmless visually, but the Crucible's only exit is the footer "Back to City" — a keyboard user landing on the region focus (showScreen focuses the region) must tab past the whole body to reach it. Minor; flagged for consistency with the other facility headers.

**Repro**: Tab order in Crucible/Catch headers; no header-level back affordance.

**Blast radius**: `screen-story-crucible`, `screen-story-catch`.

**Fix sketch**: Either accept the footer-only exit (catch screen intentionally has no header back — fleeing is via Run) or mark the spacer `aria-hidden="true"`. Lowest priority of the set.

**Verification**: N/A behavioral; consistency review.

---
severity: P3
category: a11y
anchor_symbol: story-pc-pokedex-strip
current_line_hint: ~9026
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 375f7f36e4de
confidence: medium
status: open
---

**Title**: Pokédex counts strip updates live (seen/caught) but is not an aria-live region

**Evidence**:
```html
<div id="story-pc-pokedex-strip" ...>
  <span>📖 Pokédex — Seen <strong id="story-pc-pokedex-seen">0</strong> · Caught <strong id="story-pc-pokedex-count">0</strong></span>
  <span id="story-pc-balls-summary" ...></span>
</div>
```
These counters change after deposits/withdrawals/releases inside the same screen, but the strip is a static `<div>` — no announcement. Low priority (informational, not action-critical), but inconsistent with the casino/menu live-region treatment.

**Repro**: PC release a Pokémon; the Caught count silently changes for SR users.

**Blast radius**: `screen-story-pokemoncenter` header strip.

**Fix sketch**: Add `aria-live="polite"` to `#story-pc-pokedex-strip` (or leave as-is — counters are ambient, not primary feedback).

**Verification**: Count change is announced once after a release.

---
severity: P3
category: contrast
anchor_symbol: safariActionRow
current_line_hint: ~49255
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: c8afef0751b9
confidence: low
status: open
---

**Title**: Safari flee-risk surfaced in color (orange #ff7043) and small 10px text only

**Evidence**:
```html
<span style="font-size:10px;">→ <span style="color:#aed581;">${_baitProjPct}%</span> · <span style="color:#ff7043;">flee ${_baitTurnPct}%</span></span>
```
The Safari bait/rock buttons encode upside (green `#aed581`) vs risk (orange `#ff7043`) purely by color at 10px. Both are prefixed with text labels ("flee N%") so it is NOT strictly color-only (passes the colorblind bar), but `#ff7043` on the `rgba(20,28,40,0.6)` button is ~3.1:1 — under AA for 10px text. The green `#aed581` passes. Minor; the literal word "flee" carries the meaning regardless.

**Repro**: Safari Zone encounter; inspect bait/rock projected-stat text.

**Blast radius**: `screen-story-catch` Safari mode action buttons.

**Fix sketch**: Bump the orange toward `#ff8a65`/`#ffab91` (already used for the Rock border at 3.5:1+) or raise font-size to 11px.

**Verification**: Contrast checker on the orange flee text >=4.5:1.

