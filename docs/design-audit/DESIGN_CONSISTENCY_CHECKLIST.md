# Design Consistency Checklist (20 Steps)

A safe, agent-runnable plan to make the battle game look consistent across phone portrait, phone landscape, and desktop — without touching game logic.

Each step is **self-contained, reversible, and verifiable**. Run them one at a time. Do not skip ahead.

---

## Global guardrails (read before every step)

These are non-negotiable. Any step that violates them must be aborted.

1. **Touch only design surface.** Allowed edits:
   - Inside the `<style> … </style>` block in `battle.html` (lines 16–4156).
   - HTML class names, `aria-*`, `role`, `tabindex` attributes on existing elements.
   - New files only inside `docs/design-audit/`.
2. **Never touch:**
   - JavaScript (`<script>` blocks, `move-anim-map.js`, `move-sfx-map.js`, `online-pvp.js`, `online-config.js`).
   - Asset folders (`sprites/`, `music/`, `icons/`, `data/`).
   - Build scripts (`scripts/`, `hooks/`, `supabase/`, `package.json`).
   - Element `id` attributes (JS reads them). Element ordering in the DOM.
3. **Per-step workflow:**
   1. `git checkout claude/design-consistency-checklist-8I31O && git pull` (only on first step of a fresh worktree).
   2. Re-read this file. Read the step's *Scope* and *Forbidden zones*.
   3. Make the change. Keep diff minimal — never reformat unrelated CSS.
   4. Run the **smoke test** below.
   5. Run the step's **acceptance check**.
   6. Commit on `claude/design-consistency-checklist-8I31O` with subject `design(NN): <step title>` where NN is the step number.
   7. Do not open a PR. Stop and report to user.
4. **Smoke test (mandatory after every step):**
   1. `npm start` (dev server on `:5173`).
   2. Open `http://localhost:5173/battle.html`.
   3. Title screen renders, click into a battle, confirm one full turn (select a move, see HP change), open the Pokémon summary modal, open Settings, close both. No console errors.
   4. If any of the above fails: `git reset --hard HEAD~1` and report which step + what broke. Do not try to patch over.
5. **Visual regression:** before any write-step, capture screenshots at these five viewports and save under `docs/design-audit/screenshots/before-stepNN/`:
   - `360×640` phone portrait
   - `414×896` phone portrait (larger)
   - `844×390` phone landscape
   - `1280×720` desktop (design canvas)
   - `1920×1080` desktop large
   After the step, capture the same five into `screenshots/after-stepNN/`. Diff visually before committing.
6. **Token-only changes are preferred.** When in doubt, add a CSS variable to `:root` and reference it — never hard-code a new px value.
7. **One step = one commit.** Never bundle.

---

## Phase 1 — Baseline & token system (read-only / additive)

### Step 1 — Token & one-off inventory
- **Goal:** Produce a frozen baseline of every design value in use so later steps have measurable targets.
- **Touch:** Read-only. Output a new file only.
- **Scope:** `battle.html` lines 16–4156 (CSS block).
- **Forbidden zones:** Everything outside the CSS block.
- **Do:**
  1. Grep and tally every `font-family`, `font-size`, `border-radius`, `border-width`, `padding`, `min-height`, `height`, `z-index`, and `@media` value inside `<style>`.
  2. For each, write a table: `value → count → example selectors → file:line refs`.
  3. List existing `--*` custom properties in `:root` and which selectors use them vs. ignore them.
- **Output:** `docs/design-audit/01-inventory.md`.
- **Acceptance:** File exists, includes counts, includes at least 10 example selectors per category, no code changes elsewhere.
- **Commit:** `design(01): baseline inventory of CSS values`.

### Step 2 — Define the missing tokens (additive only)
- **Goal:** Extend `:root` with the missing scales. Do **not** apply them yet.
- **Touch:** CSS-only, inside the existing `:root { … }` block.
- **Scope:** Add the following groups if absent (use values that match what the inventory shows is most common):
  - `--font-size-xs / -sm / -md / -lg / -xl / -2xl` (target scale: 10/12/14/16/20/26).
  - `--radius-sm / -md / -lg` (target: 4/6/10).
  - `--border-thin / -med / -thick` (target: 1/2/3).
  - `--btn-h-sm / -md / -lg` (target: 36/44/52 — 44 is the WCAG minimum touch target).
  - `--btn-pad-sm / -md / -lg` (target: `4px 8px` / `8px 12px` / `12px 16px`).
  - `--z-base / -ui / -overlay / -tooltip / -modal / -toast / -top` (target: 0/10/100/500/1200/2000/9999).
  - `--touch-min: 44px`.
- **Forbidden zones:** Any existing variable's value. Any selector other than `:root`.
- **Acceptance:** New variables exist. Smoke test passes (game looks identical — nothing yet references the new tokens).
- **Commit:** `design(02): add missing design tokens to :root`.

### Step 3 — Write the design contract
- **Goal:** A short doc agents will consult before touching CSS in later steps.
- **Touch:** Read/write a new doc only.
- **Do:** Produce `docs/design-audit/03-design-contract.md` listing:
  - The canonical font stack (`var(--ui-font)`).
  - Permitted font-size tokens and what each is for.
  - Permitted button sizes and where each is used.
  - Permitted radius tokens.
  - The z-index tiers and what may live in each.
  - Rule: "any new px value must be justified in the commit message, otherwise use a token".
- **Acceptance:** File exists, all tokens from step 2 documented.
- **Commit:** `design(03): write design contract`.

### Step 4 — Define a "design diff budget"
- **Goal:** Bound risk per step.
- **Do:** In `docs/design-audit/04-diff-budget.md` declare:
  - Max **40 lines changed** per future step (excluding pure token replacements which may be larger but must use exact string replace).
  - Max **3 selectors restructured** per step.
  - Forbidden: deleting selectors, renaming classes used by JS, changing element nesting.
- **Acceptance:** File exists, agents reference it from each future step.
- **Commit:** `design(04): add per-step diff budget`.

---

## Phase 2 — Mechanical token application (low risk)

These steps are **exact string replacements** of hardcoded values to token references. They should produce **zero visual change**.

### Step 5 — Unify font-family to `var(--ui-font)`
- **Goal:** Every `font-family:` rule inside `<style>` resolves to the same token.
- **Touch:** CSS-only, inside `<style>`.
- **Do:**
  1. Find every `font-family: …;` line. If it already says `var(--ui-font)`, skip.
  2. If it says `'Press Start 2P', …` (or equivalent), replace with `var(--ui-font)`.
  3. If it says `inherit` and lives on a child of `<body>`, leave it alone (inherit is fine).
  4. If it's an outlier stack (e.g., `Arial`, `system-ui`), replace **only after** confirming no functional reason (e.g., emoji rendering).
- **Acceptance:** No raw `'Press Start 2P'` string remains except in `:root`. Smoke test: text still renders the pixel font everywhere.
- **Commit:** `design(05): unify font-family via --ui-font`.

### Step 6 — Map font-sizes onto the scale
- **Goal:** Replace ~536 hardcoded px font-sizes with the `--font-size-*` tokens added in step 2.
- **Touch:** CSS-only.
- **Do:**
  1. Build a mapping: `10px → var(--font-size-xs)`, `12px → -sm`, `14px → -md`, `16/17/18 → -lg`, `20–24 → -xl`, `26+ → -2xl`.
  2. Apply mechanically. **Skip** any `clamp(…)` value — fluid sizes stay.
  3. For oddball sizes (`6/7/8/9/11/13/15`) snap to the **nearest** scale token and note any exception in the commit message.
- **Forbidden zones:** Anything inside `clamp(…)`. Anything in `@keyframes`. Inline styles in HTML (leave for step 11).
- **Acceptance:** Diff is mostly `Npx → var(--font-size-X)`. Smoke test: no visible jump >2px on any label at desktop 1280×720.
- **Commit:** `design(06): map font-sizes onto scale tokens`.

### Step 7 — Unify button border-radius
- **Goal:** Every button uses one of `--radius-sm / -md / -lg`. The current `border-radius: 0 !important` on `.story-action-btn` must be reconciled.
- **Touch:** CSS-only.
- **Do:**
  1. List every selector that renders a clickable surface (button, `.battle-cmd-btn`, `.battle-btn-move`, `.story-action-btn`, `.sum-nav-btn`, `.sum-tab`, `.icon-btn`).
  2. Pick `--radius-md` (6px) as the default; `--radius-sm` (4px) for chip-like elements (tabs, type pills); `--radius-lg` (10px) only for hero buttons if explicitly designed.
  3. Replace each `border-radius:` accordingly. **Remove `!important` only where it isn't fighting another rule** — verify with DevTools first.
- **Acceptance:** No raw `border-radius: 5px|6px|4px` on button-like selectors. Story action buttons now match other buttons. Smoke test passes.
- **Commit:** `design(07): unify button radius via --radius-* tokens`.

### Step 8 — Unify border-width
- **Goal:** Buttons use `--border-med` (2px). Inputs/cards use `--border-thin` (1px). Pressed/accented states use `--border-thick`.
- **Touch:** CSS-only.
- **Do:** Same mechanical replace as step 7.
- **Acceptance:** No raw `border: …px solid …` for button selectors except via tokens.
- **Commit:** `design(08): unify border-widths via tokens`.

### Step 9 — Z-index tiering
- **Goal:** Replace 45+ ad-hoc z-index values with the `--z-*` tier tokens.
- **Touch:** CSS-only.
- **Do:**
  1. Map current uses by intent: battle field/sprites → `--z-base` (0). HUD/move menu/party strip → `--z-ui` (10). Tooltips → `--z-tooltip` (100). Icon buttons (settings/fullscreen) → `--z-overlay` (500). Modals → `--z-modal` (1200). Toasts → `--z-toast` (2000). Fullscreen / rotation overlay → `--z-top` (9999).
  2. Replace each declaration.
  3. **Do not** change the relative ordering of any two elements — verify by inspecting overlap before/after in DevTools.
- **Acceptance:** Modals still cover battle UI. Toasts still cover modals. Tooltips still appear above move buttons. Smoke test passes.
- **Commit:** `design(09): tier z-index via --z-* tokens`.

---

## Phase 3 — Buttons & touch targets

### Step 10 — Enforce minimum touch target
- **Goal:** Every interactive element is at least 44×44px on touch viewports.
- **Touch:** CSS-only.
- **Do:** Add one `@media (hover: none) and (pointer: coarse) { :where(button, [role="button"], a.btn, .icon-btn, .sum-nav-btn, .sum-tab) { min-height: var(--touch-min); min-width: var(--touch-min); } }` rule near the bottom of `<style>`.
- **Acceptance:** On 360×640 portrait, no tappable element is smaller than 44px when measured in DevTools. Layout doesn't overflow as a result.
- **Commit:** `design(10): enforce 44px touch target on coarse pointers`.

### Step 11 — Normalize button sizes
- **Goal:** Each button class declares a size by tokens, not by ad-hoc padding/min-height.
- **Touch:** CSS-only.
- **Do:** For `.battle-cmd-btn`, `.battle-btn-move`, `.story-action-btn`, `.sum-nav-btn`, `.icon-btn`, `.sum-tab` — replace per-class padding/min-height with `--btn-h-*` and `--btn-pad-*` tokens chosen per role (Fight/Bag/Party/Run = md; story action = md; nav = sm icon; summary tab = sm).
- **Acceptance:** Visual diff vs. step 10 baseline is <4px on any button dimension. Mobile/desktop both look the same as before.
- **Commit:** `design(11): normalize button sizes via tokens`.

### Step 12 — Consistent interaction states
- **Goal:** Every button has matching `:hover`, `:active`, `:focus-visible` states.
- **Touch:** CSS-only.
- **Do:** For each button class, ensure all three states exist. Reuse the `:focus-visible` outline already in place (`2px solid var(--accent)`). For `:active` use a 1px translateY or reduced shadow consistent across classes.
- **Acceptance:** Tab through the title screen using the keyboard — every button shows a clearly visible focus ring. No state is missing.
- **Commit:** `design(12): unify hover/active/focus states`.

---

## Phase 4 — Layout & fit

### Step 13 — Battle screen overflow audit
- **Goal:** Capture the actual overflow points across the four `data-battle-layout` modes.
- **Touch:** Read-only. Output a doc.
- **Do:** Open `battle.html`, force each `data-battle-layout` mode in DevTools at viewport sizes from the global screenshot list. For each combination, log: does the bottom UI chrome fit? Are move buttons all visible? Is the HP bar clipped? Save findings in `docs/design-audit/13-overflow-report.md`.
- **Acceptance:** Report lists every (layout × viewport) pair with pass/fail and a screenshot reference.
- **Commit:** `design(13): overflow audit report`.

### Step 14 — Battle chrome fluid heights
- **Goal:** Resolve any overflow found in step 13 by replacing fixed `--battle-ui-h` values with `clamp()` ranges only where the audit demanded it.
- **Touch:** CSS-only.
- **Do:** Only the specific `[data-battle-layout="…"]` rules flagged in step 13. Keep fixed px on desktop where it's working.
- **Forbidden:** Changing sprite sizes, repositioning HP bars, reflowing the move grid.
- **Acceptance:** Every viewport in step 13 now passes. Desktop battle (1280×720) is pixel-identical.
- **Commit:** `design(14): fluid battle chrome where overflow occurred`.

### Step 15 — Summary modal fit
- **Goal:** Pokémon summary modal (`#modal-summary`) fits its content without inner scroll on portrait phones; tabs/nav stay reachable on landscape.
- **Touch:** CSS-only.
- **Do:** Adjust `max-height` / inner padding on the modal and its tab panels. Confirm Overview, Moves, Matchups all render the full content without horizontal scroll at 360×640.
- **Acceptance:** No horizontal scroll. Vertical scroll only when content genuinely exceeds 92vh. Smoke test: open summary in a battle and switch through all three tabs.
- **Commit:** `design(15): fit summary modal on small viewports`.

### Step 16 — Settings & story screen fit
- **Goal:** Same overflow guarantee for Settings modal and Story screens at 360×640 and 844×390.
- **Touch:** CSS-only.
- **Do:** Where rows overflow horizontally, allow wrap. Where the screen overflows vertically, ensure the container scrolls — never the page body. Verify the rotation overlay still triggers correctly.
- **Acceptance:** Each screen scrolls cleanly. Toggles, sliders, and labels stay aligned.
- **Commit:** `design(16): fit settings and story screens on small viewports`.

---

## Phase 5 — Accessibility pass

### Step 17 — ARIA labels on icon-only buttons
- **Goal:** Every button with only an icon (Settings gear, Fullscreen, Close ×, summary nav arrows, gauntlet leaderboard, etc.) has a meaningful `aria-label`.
- **Touch:** HTML attribute additions only. No CSS.
- **Do:** Find each `button` / `[role="button"]` with no text content. Add `aria-label="…"` describing the action.
- **Acceptance:** Run a quick axe-core scan (browser extension or DevTools Accessibility tab) — zero "button-name" violations.
- **Commit:** `design(17): aria-label all icon-only buttons`.

### Step 18 — Modal semantics
- **Goal:** Each modal (`#modal-settings`, `#modal-party`, `#modal-summary`, help modal) has `role="dialog"`, `aria-modal="true"`, and an `aria-labelledby` pointing to its title element. `Esc` closes (if not already wired in JS — only verify; do not patch JS).
- **Touch:** HTML attributes only. No CSS, no JS.
- **Do:** Add the attributes. If the title element lacks an `id`, add one — but only on elements that JS does **not** look up by tag/class alone (check first with a quick grep).
- **Acceptance:** Each modal announces a name when opened in a screen reader (or in DevTools Accessibility pane). No JS console errors.
- **Commit:** `design(18): dialog semantics on modals`.

---

## Phase 6 — Validation & wrap

### Step 19 — Visual regression sweep
- **Goal:** Confirm the cumulative change set produced no surprise regressions.
- **Touch:** Read-only. Output a doc.
- **Do:** Re-capture screenshots at the five viewports for title, menu, mid-battle, summary, settings, story. Compare against `screenshots/before-step01/`. List intentional changes (button radii unified, font snaps) and flag anything else as a regression.
- **Output:** `docs/design-audit/19-visual-regression.md`.
- **Acceptance:** Zero unexplained diffs. Any diff has a reference to the step that caused it.
- **Commit:** `design(19): visual regression sweep`.

### Step 20 — Final consistency report
- **Goal:** Close the loop. A single doc the next agent can read in 2 minutes to know the state of the design system.
- **Output:** `docs/design-audit/20-final-report.md` containing:
  - Token catalog (final).
  - Number of remaining hardcoded px / hex values, and where (deferred backlog).
  - Accessibility coverage summary (icon buttons labeled: X/Y; modals with dialog semantics: X/Y).
  - Known overflow cases still open (should be zero or explicitly accepted).
  - "Next 20 steps" backlog for the next pass (e.g., color contrast audit, dark/light theme split, animation timing tokens).
- **Acceptance:** File exists, all sections populated, smoke test passes.
- **Commit:** `design(20): final consistency report`.

---

## Appendix — How to invoke an agent for a single step

When delegating, give the agent only:

1. This file's path.
2. The step number.
3. The branch (`claude/design-consistency-checklist-8I31O`).
4. A reminder of the global guardrails (especially "no JS, no asset changes, one commit").

Example prompt:

> Run **step 7** from `docs/design-audit/DESIGN_CONSISTENCY_CHECKLIST.md` on branch `claude/design-consistency-checklist-8I31O`. Read the guardrails section first. Read steps 1–6 only to understand what tokens already exist; do not redo their work. Make the change, run the smoke test, commit on the branch, stop. Do not open a PR.

Run steps strictly in order. If a step's acceptance check fails, stop and report — do not bandage onto the next step.
