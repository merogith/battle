# Online PvP — Setup & Operations

How to take Online PvP (and the Gauntlet leaderboard) from "code is present" to
"two real people can battle." The client code (`online-pvp.js`, the Online
Host/Join buttons in `battle.html`) is already wired and active — the only work
is **provisioning the Supabase backend** and **enabling Realtime**.

> Quick check at any time: `node scripts/online/pvp-backend-check.mjs`
> (add `--smoke` for a real create → join → push → realtime round-trip).

---

## 0. What's already done

- `online-config.js` holds the project URL + publishable/anon key. The anon key
  is **safe to commit** — RLS does the authorization (it's intentionally not in
  `.gitignore`).
- All six SQL migrations live in `supabase/migrations/`.
- Client tests: `tests/suites/online-pvp-security.test.js`,
  `tests/suites/online-pvp-hardening.test.js`, `tests/suites/quickplay-modes.test.js`.

## 1. Apply the database migrations

You need a Supabase project (the one in `online-config.js`, or your own — if you
swap projects, update the URL/key there).

**Option A — dashboard (easiest):** open the project → **SQL Editor** → paste the
entire contents of [`online-pvp-combined-migrations.sql`](./online-pvp-combined-migrations.sql)
→ **Run**. That file is migrations 001→006 concatenated in order.

**Option B — CLI:** `supabase db push` (applies the six numbered files in
`supabase/migrations/`).

What each migration does:

| File | Adds |
| --- | --- |
| `001_online_pvp.sql` | `pvp_rooms` table + base RLS |
| `002_gauntlet_leaderboard.sql` | `gauntlet_leaderboard` table (honor-system) |
| `003_online_pvp_atomic_join_and_leaderboard.sql` | `try_join_pvp_room`, `increment_pvp_leaderboard_win` |
| `004_online_pvp_rls_tighten.sql` | Tighter row policies |
| `005_online_pvp_room_tokens.sql` | Per-room tokens + `try_create_pvp_room` / `pvp_push_data` SECURITY DEFINER RPCs |
| `006_online_pvp_rls_harden.sql` | Direct INSERT/UPDATE locked off; token columns SELECT-revoked |

## 2. Enable Realtime on `pvp_rooms` (required — not SQL)

Turn/draft sync is delivered by Postgres Realtime UPDATE events. Without this,
players create and join rooms but **never see each other's moves**.

Dashboard → **Database → Publications → `supabase_realtime`** → toggle on the
**`public.pvp_rooms`** table. (On some dashboard versions this lives under
**Database → Replication**.)

## 3. (Optional) Gauntlet leaderboard

Migrations 002 + 003 power the Gauntlet survival leaderboard. It's an
**honor-system** board: any anon client can submit a score (`with check (true)`),
so display names are rendered with `textContent` (never `innerHTML`) on the
client. Nothing else is required once 002/003 are applied.

## 4. Verify

```bash
# Read-only: which migrations are applied, are tokens revoked, do RPCs exist
node scripts/online/pvp-backend-check.mjs

# Full mutating round-trip incl. realtime (needs: npm i @supabase/supabase-js)
node scripts/online/pvp-backend-check.mjs --smoke
```

Expect every required check `PASS` and the summary to show 001 / 003-005 / 006
applied. A `--smoke` run should end with **"Realtime UPDATE received"**; if it
says no UPDATE arrived, revisit step 2.

> The script reads credentials from `PBS_SUPABASE_URL` / `PBS_SUPABASE_ANON_KEY`
> if set, otherwise parses `online-config.js`. It needs network egress to the
> project host; in a sandbox with a restrictive egress policy, allowlist the
> project's `*.supabase.co` host first.

## 5. Play locally

```bash
npm start            # serves on http://localhost:<port>
```

Open two browser tabs (or two devices). In tab A: **Online Host** → share the
6-character room code. In tab B: **Online Join** → enter the code. Draft, then
battle. The **host is authoritative**: it runs turn resolution and pushes the
result snapshot; the guest applies it.

---

## Security model (for reviewers)

- **No direct writes.** Migration 006 sets `using(false)` on INSERT/UPDATE; every
  write goes through token-validated `SECURITY DEFINER` RPCs (`try_create_pvp_room`,
  `try_join_pvp_room`, `pvp_push_data`).
- **Per-room tokens.** Host and guest each receive a distinct token, stored in
  SELECT-revoked columns and stripped from the synced `data`. `pvp_push_data`
  takes a `for update` row lock so `seq` advances monotonically under concurrency.
- **Log sanitizer.** The synced battle-log HTML is run through
  `OnlineBattle.sanitizeBattleLogHtml` — an allowlist parser into an inert
  `<template>` — before it touches the DOM.

## Known limitations / honest caveats

- **Rooms are world-readable.** `SELECT` on `pvp_rooms` is open by design (a
  spectator/guesser can read room state). Tokens are not exposed; writes are not
  possible without one. Room codes use `Math.random()` (~30 bits) — fine for
  short-lived rooms, not guess-proof.
- **Leaderboard is honor-system.** Scores are unauthenticated; treat it as fun,
  not competitive truth.
- **Disconnect handling is partial.** A clean Realtime reconnect now re-syncs
  from head (`_resyncFromHead`), and a failed send rolls the turn back with a
  retry prompt. But there is **no presence-based "opponent left / forfeit" flow
  yet** — if a peer closes their tab mid-match with no turn timer set, the other
  player can still be left waiting. Tracked as a follow-up.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| "Supabase not configured" | `online-config.js` has placeholder keys | Fill real URL + anon key |
| Rooms create/join but moves never appear | Realtime not enabled | Step 2 |
| `pvp_push_data` missing / turn never resolves | Migration 005 not applied | Step 1 |
| `host_token is readable by anon` (diagnostic FAIL) | Migration 006 not applied | Step 1 |
| `fetch failed` / `ENOTFOUND` from the diagnostic | Host blocked by sandbox egress | Allowlist `*.supabase.co` |
| Leaderboard submit fails | Migration 002/003 missing | Step 3 |
