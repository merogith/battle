---
severity: P2
category: a11y
anchor_symbol: showMoveEffect
current_line_hint: ~12598
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 961c3460c828
confidence: high
status: fixed-claude/relaxed-bell-2X3Ys
---

**Title**: anime.js move-FX engine ignores prefers-reduced-motion — heaviest motion bypasses the CSS catch-all

**Evidence**:
```js
function showMoveEffect(moveName, type, cat, isPlayerTarget) {
    if (!settings.animations) return;   // ONLY gate — no prefers-reduced-motion check
    // ...dispatches typeAnims[t](container, colors): particle bursts, beams,
    //    physical-impact lunges via anime({...}) (RAF inline-style interpolation)
```

**Repro**: OS "Reduce motion" ON, in-game Battle-animations toggle left ON (default). Use any move — full particle storm, beam, lunge and hit-flash still play. The global CSS guard at L6694 (`*{animation-duration:1ms}`) only neutralizes CSS keyframes/transitions; anime.js drives inline styles via requestAnimationFrame, so it is unaffected. `runScreenTransition` (L9204) already checks `matchMedia('(prefers-reduced-motion: reduce)')`, proving the pattern is known — the FX engine just omits it.

**Blast radius**: Every attack in every battle (Story/PvE/PvP/Gauntlet) routes through `showMoveEffect` → `MoveAnimEngine`; also `renderPerMoveAnim`, `playPhysicalImpact`, `playSpecialBeam`. This is the single most motion-intense subsystem in the game.

**Fix sketch**: At the top of `showMoveEffect` (and the gimmick-anim helpers), early-return or hard-cut durations when `matchMedia('(prefers-reduced-motion: reduce)').matches` — keep the damage/log outcome, drop the visual storm.

**Verification**: With OS reduce-motion on, moves resolve instantly (no particles/lunge) while the battle log still narrates the hit.

---
severity: P2
category: a11y
anchor_symbol: settings-animations-init
current_line_hint: ~10824
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 9d6f7493af32
confidence: high
status: open
---

**Title**: settings.animations defaults to true and is never seeded from prefers-reduced-motion

**Evidence**:
```js
let settings = { animations: true, musicEnabled: true, soundEnabled: true,
    weatherAnimation: true, terrainBackground: true, /* ...no reduced-motion sync... */ };
```

**Repro**: A user whose OS requests reduced motion still boots with `animations:true` and gets full battle FX, screen-shake, and gimmick (Mega/Dynamax/Tera) sequences until they manually find Settings → "Battle animations" and toggle it off. The preference is honored for screen transitions (L9204) but the master visual-FX switch ignores it on first load.

**Blast radius**: All FX gated on `settings.animations` (~25 call-sites: move FX, faint fades L20265/20284, hit-flash L21087, gimmick anims L14480+, weather). Pairs with the `showMoveEffect` finding — fixing either reduces harm, but seeding the setting fixes them all at once.

**Fix sketch**: On settings init (when no persisted value exists), seed `animations`/`weatherAnimation` from `!matchMedia('(prefers-reduced-motion: reduce)').matches`, and reflect that in the `#sw-animations` switch state. Optionally listen for changes to the media query.

**Verification**: Fresh profile + OS reduce-motion on → "Battle animations" switch is OFF by default and FX are suppressed.

---
severity: P3
category: a11y
anchor_symbol: showMoves
current_line_hint: ~18146
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 35644feb52ad
confidence: high
status: open
---

**Title**: Mobile move-details "i" is a span[role=button] with no tabindex/keydown — keyboard cannot reach it

**Evidence**:
```js
let infoHit = isMobile ? '<span class="move-info-hit" title="Move details" role="button">i</span>' : '';
// later: hit.addEventListener('click', ...openStickyMoveTooltip)  // click only — no keydown, no tabindex
```

**Repro**: On a touch+keyboard device (or mobile emulation with a BT keyboard), open Fight. The per-move "i" affordance has `role="button"` but no `tabindex="0"` and no `keydown` handler, so it never receives focus and Enter/Space do nothing. It is the only path to the full move tooltip on mobile layouts (desktop uses hover). Note: the move `<button>` itself carries a rich `aria-label` (L18148), so SR users still get the summary — this is a focusability/parity gap, not a total loss.

**Blast radius**: Mobile/portrait + tablet battle move menu. Mirrors the desktop tooltip being `onmousemove`-gated (already filed) but is a distinct element/control.

**Fix sketch**: Make it a real `<button type="button">` (preferred) or add `tabindex="0"` + a `keydown` handler firing on Enter/Space; give it an `aria-label` like "Show full details for <move>".

**Verification**: Tab reaches the "i" control inside each move tile; Enter/Space opens the sticky tooltip.

---
severity: P3
category: a11y
anchor_symbol: updateUI
current_line_hint: ~16809
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: a17922c15f4a
confidence: medium
status: open
---

**Title**: Status indicator toggles role="status" + aria-label onto a <div> at content-mutation time

**Evidence**:
```js
statBox.innerText = mon.status || '';        // content changes first
if (mon.status) { statBox.setAttribute('aria-label', _statusAriaLabel(mon.status));
                  statBox.setAttribute('role', 'status'); }   // role added same tick
else { statBox.removeAttribute('aria-label'); statBox.removeAttribute('role'); }
```

**Repro**: Live regions must exist before their content mutates to announce reliably; here the `role="status"` is added to `#player-status`/`#foe-status` in the same frame the text is written (and removed when cleared), so AT may not announce the status change. `aria-label` on a non-focusable generic `<div>` is also weakly supported and can be ignored. (Battle-log narration of status via `logMsg` partly compensates.)

**Blast radius**: Player + foe status pills every turn a status is applied/cured (BRN/PSN/TOX/PAR/SLP/FRZ).

**Fix sketch**: Put a permanent `role="status"` (or `aria-live="polite"`) wrapper in the static markup and only mutate its text; drop the per-update role toggle. Prefer visible text + the existing `_statusAriaLabel` mapping over `aria-label` on the div.

**Verification**: SR announces "Burned"/"Paralyzed" etc. on the turn the status lands, without the role being toggled.

---
severity: P3
category: a11y
anchor_symbol: gauntlet-score
current_line_hint: ~9010
file: battle.html
agents: [accessibility-ux-auditor]
fingerprint: 89ea3a3e2152
confidence: medium
status: wontfix-out-of-scope-crucible
---

**Title**: Gauntlet score readout is a plain div with no live region — score changes are silent to SR

**Evidence**:
```html
<div id="gauntlet-score" class="hidden">Score: 0</div>
```

**Repro**: In Gauntlet mode the score updates between rounds via `gauntletScore.textContent` but the element has no `aria-live`/`role="status"`, so screen-reader users never hear their score change. (Contrast with `#field-conditions` L9036 and casino result strips, which correctly use `aria-live="polite"`.) REDESIGN_PLAN §6's Fight Club gauntlet reuses this readout, so the gap propagates.

**Blast radius**: Gauntlet HUD; future Fight Club score display.

**Fix sketch**: Add `role="status" aria-live="polite"` to `#gauntlet-score` (and any new gauntlet round-result readout).

**Verification**: SR announces the new score when it updates after a round.

