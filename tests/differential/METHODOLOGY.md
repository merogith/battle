# Methodology — Testing Every Move / Ability / Item for Showdown Parity

> **Goal.** Prove the in-house battle engine (`battle.html`) is a *functional replica* of
> Pokémon Showdown across **all** ~954 moves, ~314 abilities, and ~583 items — and keep it
> that way. "Works as intended" becomes a **measured, continuously-checked property**, not a
> whack-a-mole. Mechanical scope differences (a few illegal/banned things being *available*)
> are acceptable; *behavioural* differences on standard singles mechanics are not.

This is the operating manual. It ties together the oracle harness
(`docs/BATTLE_ENGINE_INVESTIGATION.md`, Stage 0/1) and scales it to total coverage with a
multi-agent triage loop.

---

## 1. The core idea: an oracle, not hand-written expectations

We never hand-write "Thunderbolt should deal X" — a number we could get wrong. Instead we
run the **same** scripted battle through two engines and diff them:

- **Oracle (ground truth):** [`@pkmn/sim`](https://github.com/pkmn/ps) — the MIT-licensed,
  auto-synced port of the *real* Pokémon Showdown simulator. Test-only; never ships.
- **Subject:** the in-house engine, driven headless through the jsdom harness
  (`tests/helpers/load-engine.js`).

Because the oracle *is* Showdown, "parity" is definitionally "the diff is empty." The only
expectations we author are *which* divergences are acceptable (intentional deviations +
harness limitations) — and those are explicit, rationale'd allow-lists.

## 2. The five-stage pipeline

```
 data (@pkmn/dex)                                              ISSUE_LEDGER.md
        │                                                            ▲
        ▼                                                            │
 1. generate-scenarios.mjs ── scenarios + COVERAGE_MAP.md            │
        │                                                            │
        ▼                                                            │
 2. sweep-all.mjs ── run BOTH engines, diff ── SWEEP_REPORT.md       │
        │                    │                  FIDELITY.md          │
        │                    └── sweep-out/triage-shards.json ──┐    │
        ▼                                                       ▼    │
 3. differential-triage-auditor  (N agents, one per shard) ── emit-finding
        │                                                       │
        ▼                                                       ▼
 4. regression gates (oracle.test.js)        5. allow-lists (deviations.md,
    + CI                                         HARNESS_LIMITATIONS.md)
```

### Stage 1 — Enumerate (`generate-scenarios.mjs`)
Reads every move/ability/item from `@pkmn/dex` (Showdown's own gen-9 data, so every name
validates against the oracle) and emits one or more scenarios per entity, plus a
`COVERAGE_MAP.md` that accounts for *every* entity: `probe` / `needs-targeted` /
`untestable` / `harness-untestable` / `banned-oos`. Two probe shapes:
- **trace** — one battle per engine; diff the per-turn snapshot (boosts/status/faint/damage).
  Used for moves and switch-in/end-of-turn ability+item effects.
- **sweep** — N seeds per engine; compare damage **ranges** with the crit-proof min-skew.
  Used for the multiplier layer (offensive/defensive damage-mod abilities & items), where a
  single roll can't separate a 1.3× bug from the 85-100% band.

### Stage 2 — Sweep (`sweep-all.mjs`)
Runs every scenario through both engines, classifies each result by RNG-robust confidence
(`diff.mjs`), and writes:
- `SWEEP_REPORT.md` — the human headline + every high-confidence divergence.
- `FIDELITY.md` — the scorecard: per-kind "entities with a high divergence" (the number we
  drive to zero) + the unimplemented backlog.
- `sweep-out/results.json` — machine-readable, every scenario.
- `sweep-out/triage-shards.json` — high-confidence divergences grouped by `kind.family`,
  ready for agent assignment.

### Stage 3 — Triage (`differential-triage-auditor`, fanned out one-per-shard)
Each agent owns one shard (`move.status`, `ability-defensive`, …), reproduces a
representative of each divergence, and sorts it into the **six-bucket taxonomy**:

| bucket | meaning | action |
|---|---|---|
| **real-bug** | implemented mechanic resolves differently from Showdown | **file finding** |
| **unimplemented-in-scope** | no in-house behaviour, but should have | finding **only if curated top-N**; else FIDELITY backlog |
| **rng-artifact** | independent PRNGs rolled a chance differently | allow-list note |
| **intentional-deviation** | documented story/balance divergence | confirm in `deviations.md` |
| **harness-limitation** | only diverges headlessly | add to `HARNESS_LIMITATIONS.md` |
| **banned-oos** | Z/Max/CAP/doubles/PvP/Frontier | ignore (acceptable) |

Findings flow through the existing `emit-finding` → fingerprint-dedup →
`scripts/debug/issue-ledger.mjs` → `ISSUE_LEDGER.md` pipeline. **No parallel bug tracker.**

### Stage 4 — Lock-in (regression gates)
Each confirmed-correct entity can be promoted to a `match` scenario in the
`oracle.test.js`-style CI gate so it can never silently regress. The sweep itself runs in
CI as a report; the curated `match` set is the blocking gate.

### Stage 5 — Allow-list hygiene
`deviations.md` (intentional) + `HARNESS_LIMITATIONS.md` (untestable headlessly) are
subtracted by every sweep, so the "unexplained high-confidence divergence" count is honest
and trends to zero. That count, in `FIDELITY.md`, is the answer to *"is it a replica yet?"*

## 3. Why multiple agents

The sweep produces a large, *shardable* divergence map. Triage clusters naturally by
**setup-shape** (`kind.family`) — the same proven pattern as `test-coverage-filler`'s 42
clusters. One agent per shard means each batches similar repros (all status moves, all
defensive abilities…), shares harness state, and dedups its own near-identical cases before
filing. Run them in waves of ~3 (like `/deep-debug`). Fingerprint dedup merges any overlap
with the `battle-engine-debugger`'s findings automatically.

## 4. RNG-robust comparison (the part that makes it trustworthy)

The two engines have **independent** PRNG streams, so exact rolls and chance procs can't be
compared. The differ (`diff.mjs`) only trusts RNG-*independent* signals:
- **high** — boosts, faint, winner, move-order, disjoint damage *ranges* (>2.2× or the
  crit-proof min-skew), one-side-0 on a no-miss move (immunity/absorb/type-chart).
- **medium** — status presence (could be a chance secondary; promoted when `guaranteedStatus`).
- **low** — raw HP inside the 85-100% roll band; a hit-vs-miss from accuracy RNG.

Only **high** drives findings. The sweep's headline number is high-confidence divergences.

## 5. Scope & non-goals (per `CLAUDE.md` + the user)

- **In scope:** Story-mode normal-difficulty **singles**. Moves, abilities, items.
- **Acceptable to differ (not bugs):** Z/Max/Gigantamax/CAP moves, doubles-only targets,
  banned/illegal *availability*, PvP/Quick-Play/Battle-Frontier.
- **Intentional deviations:** story artifacts (Glass Cannon Pact, Type Amplifier), owner-tuned
  foe multipliers, fixed-damage story moves — see `deviations.md`.
- **No engine change without sign-off.** This pipeline *finds and proves* divergences; fixing
  them is a separate, per-batch, owner-approved follow-up (`CLAUDE.md` approval rules).

## 6. Known coverage edges (honest limitations of v1)

- **Trace observability.** The per-turn snapshot sees hp/status/boosts/faint only.
  Volatile-only moves (Substitute, Leech Seed, Taunt…), side conditions (screens, hazards),
  and weather/terrain *setting* are tagged `observability: low` — covered for crashes, but
  their effect needs a multi-turn scenario or direct assertion. (See `HARNESS_LIMITATIONS.md`.)
- **Conditional offensive modifiers.** The generic ability/item offensive probe uses one
  neutral contact move (Body Slam), so it catches unconditional modifiers (Huge Power, Tough
  Claws, Sheer Force…) but not move-specific ones (Iron Fist→punch, Technician→≤60 BP). Those
  are `needs-targeted` — a curated second batch (the hand-authored `damage-sweep.mjs` already
  covers the headline cases).
- **`needs-targeted` families.** Charge, OHKO, variable-power, counter-like, delayed moves
  need bespoke setups — listed in `COVERAGE_MAP.md`, owned by the curated probe set.

These edges are *named*, not hidden — which is the whole point: coverage is a ledger, not a vibe.

## 7. How to run

```bash
npm run test:differential:all          # generate + full sweep (writes the reports)
node tests/differential/sweep-all.mjs --filter thunder   # one mechanic
/differential-sweep                    # full battery + multi-agent triage → ledger
```

The full battery is `~30–45 min`. Deterministic (fixed seeds) → re-runs reproduce exactly.

## 8. Files

| File | Role |
|---|---|
| `generate-scenarios.mjs` | Stage 1 — enumerate all entities → scenarios + `COVERAGE_MAP.md` |
| `sweep-all.mjs` | Stage 2 — run both engines, diff → `SWEEP_REPORT.md` + `FIDELITY.md` + `sweep-out/` |
| `showdown-oracle.mjs` · `inhouse-oracle.mjs` · `diff.mjs` | the two drivers + the comparator (reused) |
| `damage-sweep.mjs` · `scenarios.mjs` | the curated, hand-authored battery (reused; min-skew + headline cases) |
| `.claude/agents/differential-triage-auditor.md` | Stage 3 — the per-shard triage specialist |
| `.claude/commands/differential-sweep.md` | the `/differential-sweep` coordinator |
| `tests/reports/deviations.md` · `HARNESS_LIMITATIONS.md` | the two allow-lists (Stage 5) |
| `oracle.test.js` | the CI regression gate (Stage 4) |
