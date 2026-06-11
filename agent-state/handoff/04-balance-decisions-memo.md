# Batch 4 — Balance decisions memo (maintainer-owned numbers)

> Per CLAUDE.md: balance numbers are user-owned. This memo extracts and exposes them;
> you pick values. No code changes until each item is decided. Anchors are current as
> of branch `claude/gifted-fermat-yfnqq5` @ 0565a2a (re-grep if drifted).

## 1. Hard-mode gold pays 77% of Normal — `8b9a943876e8`
`storyDifficultyCoinMult()` (battle.html:~36079): normal **1.30**, hard **1.00**, challenge **1.10**, easy 1.50, veryeasy 1.60.
The in-code comment says hard was *deliberately* floored at parity: "Hard/Challenge used to pay below parity while late-game prices spike; floored at parity so the coin curve stops fighting the difficulty curve." The audit predates that comment's discovery.
- **(a) Ratify 1.00** — comment shows intent; close as by-design. *(recommended)*
- (b) Raise hard to 1.10–1.15 — softer wallet pressure.

## 2. Professor C0 roll is 100% weakest grade — `1ac1fa493205`
`PROF_ROLLS` (battle.html:~36104): C0 = `{g4:100}` pure basic; curve ends C9 = `{g1:100}` legendary gate.
- **(a) Keep** — flat-weakest start is a clean curve anchor. *(recommended)*
- (b) Soften C0 to e.g. `{g3:10, g4:90}` — small chance of an early standout.

## 3. Safari curve key 3 unreachable — `a2bb5974a473`
Safari grade curve is keyed 3..8 by badges, but Safari debuts at C5 (`FACILITY_DEBUT_CITY.safari = 5`), so the first visit arrives with 4+ badges and hits key 4 (g2:15/g4:25). The gentlest key 3 (g2:5/g4:35) never fires — first visit is harsher than designed.
- **(a) Re-key (shift the table so the debut visit gets the gentlest row)** — preserves the designed on-ramp. *(recommended)*
- (b) Accept current — first visit at key 4 is fine; delete key 3 as dead data.

## 4. Facility debut schedule: code vs docs — `0d3a51e62bd1`
Code `FACILITY_DEBUT_CITY` (battle.html:31740): safari:**5**, dept:**4**, evtrainer:**7**, dojo:**1**.
Docs (CURVE §1/2i, FLOW §14c): Safari/Dojo/EVTrainer **C4**, Dept **C6**.
- **(a) Code-as-truth** — keep the shipped schedule, fix the two docs (goes in the W5-docs batch). *(recommended — players have saves against this schedule)*
- (b) Doc schedule — change code to C4/C4/C4/C6.

## 5. Basic-Trainer tier ladder duplicate arms — `c5bc08173c0c` / `8909d73d953d`
~battle.html:40614: `b>=5 → NOVICE` and `b>=2 → NOVICE` are duplicate arms (badges 2–4 and 5+ collapse to the same tier); Rival has `b>=7` and `b>=5` both → COMPETENT.
- (a) Distinct tiers — give b>=5 a higher tier (e.g. COMPETENT) so basic trainers scale past badge 4.
- **(b) Collapse + comment** — if the flat ladder is intended, merge the arms and write the intent down. *(recommended as the no-balance-change option; pick (a) only if you want basic trainers to scale)*

## 6. Starting Poké Balls: 0 in code, 5 in spec — `62820f39b02f`
Init gives `poke:0` (battle.html:~38769/~43135); FLOW §10 (~line 285) says `poke:5`; the v15 migration grants 5 to old saves; mart grants + a defensive top-up exist.
- **(a) Pick 0** — fresh runs start ball-less until the first mart; fix FLOW §10 (W5-docs). *(recommended — matches shipped behavior; migration already compensated old saves)*
- (b) Pick 5 — change init; spec stands.

## 7. Boss heal phase uncapped — `f1a46e8493d6`
Boss heals at the 0.50-HP phase trigger (battle.html:~44949) with no cap on activations.
- **(a) Cap count: once per battle.** *(recommended — simplest, matches player expectation of a "phase")*
- (b) Cap heal %: keep repeatable but smaller (you pick %).
- (c) Keep uncapped — by-design pressure.

## 8. Raid stat triple-compound — `20628d0fad96`
Raid foes multiply `_storyStatMult × _bossStatMult × _bossHpScale` (stamp at battle.html:51739, comment 15584) — three layers compound on the same mon.
- (a) Intended product — ratify and document at the stamp site.
- **(b) Exclude one factor** — most likely `_storyStatMult` (the generic story curve) so raids are tuned only by their own two knobs. *(recommended; you pick which factor)*

## 9. AI trio (normal-difficulty scope) — `1ebee7303e60` / `1b994537ce76` / `607fa56cad8d`
- AI is difficulty-blind (same policy on all difficulties).
- Spore scores 100 even when the target is already asleep.
- An all-immune matchup still throws 0-damage attacks.
- (a) Wontfix-by-design — normal-only scope, simple AI is the product.
- **(b) Small clauses only** — the Spore clause and immune-skip read as bugfixes, not balance (AI move choice still needs your sign-off per CLAUDE.md); keep difficulty-blindness. *(recommended)*
- (c) Full difficulty-aware policy — out of currently approved scope; would be a new work item.

## 10. Featured Mega/Ultra stone sellability — `d751963ad1f8`
Featured-shop Mega/Ultra stones get a Sell button, unlike `PERM_BOOST_IDS` items which are sell-locked. A player can sell a progression-relevant stone.
- **(a) Sell-lock** — add featured stones to the sell-lock set; prevents foot-gun. *(recommended)*
- (b) Keep sellable — gold-recovery escape hatch is intentional.

---

## DECIDED — 2026-06-11 (maintainer, via interactive session)

| # | Decision | Action taken |
|---|----------|--------------|
| 1 | (a) Ratify hard=1.00 | Ratification comment at `storyDifficultyCoinMult` |
| 2 | (a) Keep C0 = {g4:100} | Ratification comment at `PROF_ROLLS` |
| 3 | (a) Re-key Safari table +1 badge | Code + CURVE §2j + FLOW §15g updated |
| 4 | (a) Code-as-truth schedule | **W5-docs**: fix CURVE §1/2i + FLOW §14c to safari:5 / dept:4 / evtrainer:7 / dojo:1 |
| 5 | (b) Collapse + comment | Duplicate arms merged (Rival b>=7/b>=5, Basic Trainer b>=5/b>=2); flat ladder documented |
| 6 | (a) Starting balls = 0 | **W5-docs**: fix FLOW §10 (`poke:5` → `poke:0`) |
| 7 | (a) Heal once per battle | Already true in code (fired-key is per-battle); ratification comment added. NOTE: memo framing "uncapped" was stale — residual finding f1a46e8493d6 (heal re-opens crossed threshold) stays open as P4 |
| 8 | (b) Exclude `_storyStatMult` | Raid/miniRaid builds skipped by the enterBattleEvent stamp |
| 9 | (b) Small clauses only | All-immune switch clause added to `aiDecision`. NOTE: the "Spore vs sleeping target" guard already existed (getBestMove zeroes sleep moves vs statused/sub targets) — no change needed. Difficulty-blindness kept (1ebee7303e60 → wontfix-by-design) |
| 10 | (a) Sell-lock featured stones | Sell button suppressed in `openCityBag` + guard in `sellItem` for `mega_*`/`ultra_*` |
