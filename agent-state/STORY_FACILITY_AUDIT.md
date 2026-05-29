# Story Mode — Per-Facility Audit (2026-05-29)

Collected by 13 parallel auditors (12 story-mode-investigator + 1 accessibility-ux-auditor),
each scoped to one facility cluster. Scope: **Story mode, normal difficulty only.**
PvP / Quick Play / Battle Frontier are out of scope. Balance numbers (prices, payouts,
caps, multipliers, IV/EV curves) are user/maxwell-owned — only wiring/logic/determinism/UX
issues are flagged, never the numbers themselves.

> **Cross-branch note:** `claude/peaceful-thompson-7y3Y3` is actively reworking story
> **boss mechanics / endgame** (escalating faint-phases, raid HP configs, villain bosses)
> and has rewritten `ISSUE_LEDGER.md` + ~456 lines of `battle.html`. The **Crucible /
> boss-arc P1s below may already be in progress there** — confirm before acting.

Facilities covered (all 26 from the request): Pokémon Center · PokéMart · Professor ·
Nature Rater · Link Station · Evolution (Stage 1) · Evolution Master (Stage 2) · Stone Shop ·
Department Store · Safari Zone · Poké Casino · Colress (Power-Up) · EV Trainer · Daycare ·
Fight Club · Move Tutor L1/L2/L3 · Battle Dojo L1/L2/L3 · Relic Annex · Artifact Hall ·
Pokémon Fan Club · Bag · Party.

---

## DEEP VERIFICATION RESULTS (2026-05-29, round 2)

A second pass put the top findings through repro + reachability + root-cause analysis
(6 deep dives: 4 agents w/ jsdom harness repros + 2 self-verified). **Three P1s held up;
three findings were overstated and are downgraded.** Use THIS table as the source of truth
over the original severities below.

| Finding | Verdict | Reachability | Real severity |
|---------|---------|--------------|---------------|
| **Crucible row-id/index** (P1-1/2) | **CONFIRMED** (live repro) | Every post-game player | **P1** — League Run skips E1 & ends on Rival; Rival Rematch opens Hall-of-Fame; MF rematch dead (OOB); Gym-3 bounces. 1-line chokepoint fix (`findIndex(r=>r[0]===id)` in `_crucibleBattleSetup` ~47908). *pasteur territory.* |
| **City-8 legendary gate** (P1-4) | **CONFIRMED** (repro) | Normal — any ≤5 party at City-8 (cap is a ceiling, PC lets you shrink to 1) | **P1** — legendary silently & permanently forfeited; route still opens. Debug seeder always fills to 6, hiding it. Fix: decouple `legendMysteryGate`/`_profLegendaryMysteryMode` from `!hasTeamRoom`/`isFull` (42534/42801/44984). *pasteur territory.* |
| **Safari reload data-loss** (P1-6) | **CONFIRMED** (repro) | Real — any mid-run refresh/tab-close/crash | **P1** — unused balls + (free visit) free entry lost → 10,000 G lockout. No-schema mitigation: defer `freeEntryUsed=true`/`save()` until an encounter commits (`enterSafariZone` ~47747-47763). Full fix = persist `sm.safari.session` (*pasteur schema*). |
| **Master Ball double-grant** (P1-3) | **PARTIAL → DOWNGRADE** | Not demonstrated in single-thread play | **P3** — function non-idempotent (repro: master=2), but the two callers are mutually exclusive by beat kind; `onBattleEnd` deletes its key before granting; even 2 balls = one dead un-throwable item (`bossMode` lock, not count, guards uniqueness). Latent hardening only (add `sm.trackEndGranted` guard). |
| **`sellItem` gold exploit** (P1-5) | **PARTIAL → DOWNGRADE** | **Console-only** — UI passes catalog half-price baked into a static onclick; no input feeds it | **P3** — defense-in-depth (drop the price param, re-derive internally; also `evResetCharm` is sellable via console). PC sell path is the correct hardened model. |
| **`showGameConfirm` resolver overwrite** (P2) | **PARTIAL → DOWNGRADE** | Console-only — UI blocked by `_storyTryBeginInteraction` + full-screen `.modal` overlay | **P3** — cheap single-flight guard worth adding, but no player-facing hang. |
| **Casino determinism** (P2) | **CONFIRMED** (`_casinoRollPrize`/`_randPick` 50613-50664) | Normal (City5/City9) | Stands — low player harm (RNG either way); real breakage is the **deterministic-replay contract** + prize roll writes durable save state. Seed via `storyRngNext`. |
| **Stone Shop / City2** (P1-7) | **CONFIRMED** but **recoverable** | Normal (City2 arrival) | **P2** (not data-loss) — token is a persistent voucher redeemable at City3; the bug is the misleading "shop next door" dialogue + unperformable stone-evos shown at City2. *pasteur timeline.* |

**Net verified P1 backlog:** Crucible index bug, City-8 legendary gate, Safari reload —
**all three sit in pasteur's timeline/save-schema domain** (flagged, not authored; need hand-off).
The clearly general-session-scoped items (Casino RNG seeding, `sellItem`/`showGameConfirm`
hardening, interaction-lock consistency) are lower severity than first reported but are
safe for this session to fix with sign-off.

---

## P1 — High impact (bug / progression / exploit / data-loss)

| # | Facility | file:line | Issue |
|---|----------|-----------|-------|
| P1-1 | **Crucible** | battle.html:~47905 | Row-id assigned straight into `sm.eventIndex` (an array *index* everywhere else). Gym-3 rematch (row 18 → idx 18 = City3) bounces to the city. |
| P1-2 | **Crucible** | battle.html:~47921 | League Run rows `[60..64]` resolve to E2→E3→E4→Champion→**Rival** — **Elite-1 is never fought**. |
| P1-3 | **Catch / boss reward** | battle.html:~41696 | `_storyGrantTrackEndReward` (Master Ball grant) has **no fire-once guard** and is called from two sites; reload/double-hook can grant 2+ Master Balls, breaking the Caged God unique-ball design. |
| P1-4 | **Professor** | battle.html:~42530 / ~44972 | City-8 legendary Mystery gate only fires when party is **6/6** (`!hasTeamRoom`/`isFull`). Reach the post-gym hub with ≤5 mons → normal Professor pick, legendary **never granted**, Leave City still opens. |
| P1-5 | **Bag** | battle.html:52759 | `sellItem(id, sellPrice)` credits the **caller-supplied** price and is exported on `window.StoryMode` → `sellItem('pokeBall', 9999999)` = arbitrary gold. (PC sell path correctly re-derives from catalog — see `pcSell` 48447.) |
| P1-6 | **Safari Zone** | battle.html:47766 | Session (`_safariSession`/`_catchState`) never persisted, but `freeEntryUsed=true` is saved **before** the session runs. Reload mid-session = all balls/encounters lost; if it was the free visit, re-entry now costs 10,000 G. |
| P1-7 | **Stone Shop / Evolution** | battle.html:30046-30049 | City2 surfaces the Evolution Tutor + stone-evo prompts and fires `firstStoneSage` (grants a Stonewise Token + "shop next door" dialogue), but the **Stone Shop doesn't exist until City3**. Token + redemption text for a non-existent shop; stone evos shown-but-unperformable with a misleading hint. *(pasteur timeline territory — flagged per CLAUDE.md flow-ordering rule.)* |

P1-1/P1-2 also have siblings: Rival Rematch (row 65 → idx 65 = Hall of Fame, bounces; P2) and MF Rematch (67 → out-of-bounds, silent return; P2).

---

## P2 — Medium impact

### Determinism (seeded-RNG rule violations — `Math.random()` where `storyRngNext` is required)
| Facility | file:line | Issue |
|----------|-----------|-------|
| **Casino** | 50830, 50954, 51392, 50617 | Coin-flip win, slots reels, roulette cell, **and permanent prize/vitamin/voucher drops** all use `Math.random()`. Prize drops write durable save state — worst case. (4× P1-class determinism; grouped here.) |
| **Daycare / Fight Club** | 43675, 43967, 43970 | Egg-hatch species roll + pit enemy roster use `Math.random()`. Pit snapshot stores a `seed` (43887) that is **never read** — non-seeded *and* dead. |
| **Safari Zone** | 47803, 49496, 49522, 49536, 49789, 49087 | Encounter id + flee/wobble/skip/opener flavor text use `Math.random()` (outcome rolls themselves are correctly seeded). |

### Interaction-lock / double-submit consistency (shared root cause)
| Facility | file:line | Issue |
|----------|-----------|-------|
| **(root cause)** | 13763 | `showGameConfirm` keeps a single `window._gameConfirmResolve`; a 2nd call overwrites it → first `await` orphans/hangs forever. Makes every missing interaction-lock below a real (not theoretical) risk. |
| **Shop / Mart, Artifact Shop, Artifact Hall, Fan Club** | 49908, 50164, 44831, 58769 | Skip the `_storyTryBeginInteraction()` lock that Stone Shop/Link/Tutor/Dojo/EV all use. Only saved today by the modal overlay's z-order. |
| **Colress** | 58296-58389 | The 5 apply funcs (`colressApply{Mega,Dmax,Z,ZSig,Tera}`) have no interaction guard + no try/finally. |
| **Stone Shop** | 50298, 50317 | `buyStoneItem` / `redeemStoneToken` lack the guard (entry is guarded). |

### Other P2
| Facility | file:line | Issue |
|----------|-----------|-------|
| **Shop / Bag** | 52759 | `sellItem` credits caller price without catalog re-derivation (see P1-5 — exported, so promoted to P1). |
| **Colress** | 58362-58371 | Signature-Z auto-teach **silently overwrites the 4th move**; confirm never names the dropped move. |
| **Evolution Lab** | 51765 / 51778 | Hardcoded `EVO_STONE_REQ`/`EVO_TRADE_REQ` tables miss many dex stone evos (Cloyster, Magnezone, Florges, Weavile, Gliscor, Alolan/Hisuian forms, …) → those evolve **free**, bypassing the Stone Shop gold sink. Recommend deriving from `species.json` `evoItem`. |
| **Poké Center** | 47348 | Never clears Fatigue — `enterPokemonCenter` plays SFX + opens PC but never calls `_storyFullHealPartySlots` (the only Fatigue reset), yet the in-game bulletin explicitly promises it does. |
| **Poké Center / Underground** | 47667, 42439 | Empty-state + City-0 tip claim "starters … aren't for sale," but the sell gate (`canSell`) actually **allows** selling starters. Copy is false. |
| **Move Tutor** | 56649-56667 / 57578 | Locked (above-tier) move cards are **clickable** (item/ability cards set `disabled`, move cards don't); `tutorChangeMove` only re-validates the tier gate at stage 0. During the cold-cache async window an Expert-tier player could teach an Awakened (L3) move via the gold path. |
| **Fight Club** | 43697 vs 42977 | The 6-badge secret is only offered while in **City6** (Daycare gate `[2,4,6]`); skip it there and the one-time +stat reward is **permanently unreachable** (endgame club still opens, but the *story* reward is lost). |
| **PC storage** (a11y) | 47557, 47595, 47688, 47616 | Storage rows are mouse-only `<div>`s; "view full build" has no `tabindex`/`role`/keydown → **unreachable by keyboard**. |
| **Casino** (a11y) | ~5635 | `.casino-game-subtitle`/`.casino-subtitle-note` cream `#fff5d0` on light `theme-flip`/`theme-slots` panels ≈ 1.3:1 — fails AA badly on Coin Flip + Slots tabs. |
| **Catch** (a11y) | 9079 | `#story-catch-body` has no `aria-live` — catch/flee/wobble/boss-HP outcomes silent to screen readers (Casino got this right). |
| **Bag / Party** (a11y) | 52750, 44772, 9305, 9318 | Both modals open via `classList.remove('hidden')` not `openModal`, so focus isn't restored on close (drops to `<body>`); dialogs lack accessible name; sell updates lack `aria-live`. |

---

## P3 — Polish / low risk (selected; full list in agent-state/findings/)

- **Crucible** ~47154 — victory overlay auto-dismisses at fixed 6000 ms regardless of stacked text (Champion epilogue / MF reveal can vanish mid-read).
- **PC** ~47409 / **Casino**/most facilities — every deposit/withdraw/sell rebuilds `innerHTML`, resetting scroll-to-top.
- **Professor** ~45292/45302 — mystery swap picker labels BST grade as "Power tier (1-4)" (conflates species grade with build power tier).
- **Professor** ~45024, **Evolution** 51907 — flavor-quote selection uses `Math.random()` (cosmetic determinism).
- **Colress** 57879-57913 — eligibility checks `sm.settings.*On` but not `sm.unlockedGimmicks` (latent desync vs enemy gate; masked in normal flow).
- **Colress / EV Trainer** 58022, 59114 — egg in slot 0 → opens onto a blank expanded card. (Same class as Evolution Lab egg-slot-0, battle.html:51973.)
- **Nature Rater** 42956 — cost badge "2000+" implies tiered pricing; it's a flat 2000 G.
- **Nature Rater** 57356/57367 — stat-preview delta can disagree with shown value by 1 (double-rounding; cosmetic).
- **Evolution Lab** 52178 — item carry-over preserves now-inert species-locked items (Light Ball on Raichu, Thick Club on Marowak).
- **Evolution Lab** 42945 — button reads "🧬 Evolution Master" with no role verb (siblings say "Move Tutor"/"Battle Dojo").
- **Fight Club** 44193 — pit-round draft overlay has no close/Escape/backdrop dismiss; committing to the bracket is irreversible with no on-screen warning.
- **Daycare** 42978 vs 43697 — button can read "Egg Quest" while the door delivers the Fight Club secret (silently forfeiting the egg quest).
- **Dept Store / Fan Club** 50086-50098, 52994 — affordability not re-checked post-confirm (safe today); Fan Club confirm-suppress can over-suppress on same-city backtrack.
- **EV Trainer / Fan Club** — "vitamin" terminology collides across 3 distinct systems (EV voucher vs IV `PERM_BOOST_ITEMS` vs bag copy).
- **Catch / PC / Center** 6659 — dead CSS `#story-pc-tab-journal-btn`; **Professor/PC** ~34629/34630 — `migrateStoryPreV16` hardcodes intro-rival index `>1` instead of deriving it (pasteur territory).
- **Various** — weak region aria-labels ("story pokemoncenter"), PC tab-strip color-only active state, relic toggle buttons missing relic name in accessible name, empty `<span>` header spacers should be `aria-hidden`.
- **Test** `tests/integration/catch-system.test.js:~33` — "PC cap of 10" test is stale (real cap is `PC_BOX_CAP = 30`); passes by prose-match, gives false confidence.

---

## Verified CLEAN (no action) — highlights
- **Party-cap curve** `_storyMaxPartySize = max(2, min(6, 2+badges))` — correct at all badge boundaries (verified by 4 agents).
- **Catch overflow → PC** — no mon-loss path; party-full + PC-full shows the "free a slot" message.
- **Move Tutor / Battle Dojo / EV Trainer / Link Station** — double-submit guards, decline-is-non-destructive, last-move/last-mon guards, gold checks before debit: all solid.
- **EV caps** (≤510 total, ≤252/stat, full-overwrite not additive), **Colress** eligibility re-validation, **evolution** build/IV/EV/nature/ability/moveset/gimmick/shiny preservation, **Fight-Club IV-bonus** persistence + [0,10] clamp + one-shot flag, **Dept Store** "one-per-city" lock persistence, **mid-bracket reload recovery**, **Artifact Hall vs Relic Annex** distinction — all verified correct.
- **City Party modal** rows ARE keyboard-reachable and non-destructive (reorder only, bounds-checked).
