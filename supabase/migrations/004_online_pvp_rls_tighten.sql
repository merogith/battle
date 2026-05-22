-- Tighten the wide-open RLS policies from 001_online_pvp.sql.
-- 001's policies were tagged "MVP permissive — tighten later"; this is that follow-up.
--
-- Threat model (MVP, no auth): the room id is the only secret. Any client with the
-- publishable anon key + a leaked / scraped room id can otherwise:
--   - clobber `data` to arbitrary content (was: open UPDATE),
--   - drop rows out from under live peers (was: open DELETE),
--   - flood the table with junk rows (was: open INSERT with no size cap).
-- Combined with the `applyBattleLogHtml` innerHTML sink in online-pvp.js, this was
-- a script-injection path against every live peer.
--
-- Apply via Supabase SQL Editor or `supabase db push`.

-- DELETE: not allowed from clients. The host can't even delete their own room here —
-- rooms are reaped by the recently-added scheduled cleanup (see comments in 001).
-- Client UI never called .delete() on pvp_rooms anyway.
drop policy if exists "pvp_rooms_delete" on public.pvp_rooms;

-- INSERT: enforce a small set of structural invariants so the table can't be flooded
-- with rows that don't even look like rooms. We DO still allow anonymous insert
-- because that's the only way an unauth'd host can create a room.
drop policy if exists "pvp_rooms_insert" on public.pvp_rooms;
create policy "pvp_rooms_insert"
  on public.pvp_rooms for insert
  to anon, authenticated
  with check (
    -- code is the join key; must be reasonably short and not pathological
    char_length(code) between 4 and 32
    -- payload must fit in a reasonable envelope (raw text length on jsonb)
    and char_length(data::text) <= 1048576  -- 1 MiB ceiling per row
  );

-- UPDATE: same structural guard, plus you can never blow the row size past 1 MiB.
-- Note: with anon key the table itself remains modifiable by anyone who *knows the
-- row id*; this matches the MVP "id-as-secret" model. Pure-cosmetic improvements
-- (rate limiting, edge auth) would happen at the Supabase project level, not via RLS.
drop policy if exists "pvp_rooms_update" on public.pvp_rooms;
create policy "pvp_rooms_update"
  on public.pvp_rooms for update
  to anon, authenticated
  using (true)
  with check (
    char_length(code) between 4 and 32
    and char_length(data::text) <= 1048576
  );

-- SELECT stays world-readable for now. The realtime subscription needs to receive
-- payload updates and we have no per-row entitlement to key against. The structured
-- battle log + draft state is not private data (it's already visible to the peer);
-- the leak risk is purely "spectators can see live matches", not credentials.
-- Documented as a known limitation here for the next session.
comment on policy "pvp_rooms_insert" on public.pvp_rooms is
  'Tightened in 004: code length 4-32, payload <= 1 MiB. Was: with check (true).';
comment on policy "pvp_rooms_update" on public.pvp_rooms is
  'Tightened in 004: code length 4-32, payload <= 1 MiB. Was: with check (true). Update is still keyed on knowing the room id (MVP no-auth model).';

-- Leaderboard policies stay as-is in 001 + 003 (insert/update go through
-- increment_pvp_leaderboard_win RPC anyway).
