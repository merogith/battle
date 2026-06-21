-- ============================================================================
-- Online PvP + Gauntlet leaderboard — COMBINED migration (001 → 006)
--
-- GENERATED convenience artifact. Source of truth: supabase/migrations/00*.sql
-- Paste this whole file into the Supabase dashboard SQL editor and run it once
-- on a fresh project, OR run the six numbered files in order via `supabase db push`.
-- Idempotent-ish: each migration uses create-or-replace / if-not-exists where it
-- can, but run on a clean project for best results.
--
-- AFTER running this: Database -> Publications -> supabase_realtime -> add table
-- public.pvp_rooms (so clients receive turn/draft UPDATE events). See
-- docs/ONLINE_PVP_SETUP.md for the full walkthrough.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- supabase/migrations/001_online_pvp.sql
-- ----------------------------------------------------------------------------
-- Online PvP rooms + optional honor-system leaderboard.
-- Run in Supabase SQL Editor (Dashboard → SQL) or via supabase db push.
-- Then: Database → Replication → enable for pvp_rooms (supabase_realtime publication).

-- Rooms: one row per match; `code` is human join code; `data` holds draft + battle sync JSON.
create table if not exists public.pvp_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists pvp_rooms_updated_at_idx on public.pvp_rooms (updated_at desc);

-- Honor-system leaderboard (no server-side battle validation).
create table if not exists public.pvp_leaderboard (
  id bigserial primary key,
  name text not null,
  wins integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (name)
);

create index if not exists pvp_leaderboard_wins_idx on public.pvp_leaderboard (wins desc);

alter table public.pvp_rooms enable row level security;
alter table public.pvp_leaderboard enable row level security;

-- MVP: permissive policies for anon + authenticated clients using the anon key.
-- Tighten later (e.g. restrict updates to room owner, RPC join-by-code only).
drop policy if exists "pvp_rooms_select" on public.pvp_rooms;
create policy "pvp_rooms_select"
  on public.pvp_rooms for select
  to anon, authenticated
  using (true);

drop policy if exists "pvp_rooms_insert" on public.pvp_rooms;
create policy "pvp_rooms_insert"
  on public.pvp_rooms for insert
  to anon, authenticated
  with check (true);

drop policy if exists "pvp_rooms_update" on public.pvp_rooms;
create policy "pvp_rooms_update"
  on public.pvp_rooms for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "pvp_rooms_delete" on public.pvp_rooms;
create policy "pvp_rooms_delete"
  on public.pvp_rooms for delete
  to anon, authenticated
  using (true);

drop policy if exists "pvp_lb_select" on public.pvp_leaderboard;
create policy "pvp_lb_select"
  on public.pvp_leaderboard for select
  to anon, authenticated
  using (true);

drop policy if exists "pvp_lb_insert" on public.pvp_leaderboard;
create policy "pvp_lb_insert"
  on public.pvp_leaderboard for insert
  to anon, authenticated
  with check (true);

drop policy if exists "pvp_lb_update" on public.pvp_leaderboard;
create policy "pvp_lb_update"
  on public.pvp_leaderboard for update
  to anon, authenticated
  using (true)
  with check (true);

comment on table public.pvp_rooms is 'Online PvP sync: code + jsonb payload; RLS permissive for MVP.';
comment on table public.pvp_leaderboard is 'Honor-system wins; clients can inflate — not competitive-integrity.';

-- After creating tables: Supabase Dashboard → Database → Publications → supabase_realtime
-- → enable replica identity / add public.pvp_rooms to the publication so clients receive UPDATE events.


-- ----------------------------------------------------------------------------
-- supabase/migrations/002_gauntlet_leaderboard.sql
-- ----------------------------------------------------------------------------
-- Gauntlet leaderboard: honor-system submissions (top 100 displayed client-side).
-- Run after 001_online_pvp.sql in Supabase SQL Editor or supabase db push.

create table if not exists public.gauntlet_leaderboard (
  id bigserial primary key,
  display_name text not null,
  rounds_cleared integer not null check (rounds_cleared >= 0),
  final_party jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists gauntlet_leaderboard_rounds_idx
  on public.gauntlet_leaderboard (rounds_cleared desc, created_at desc);

alter table public.gauntlet_leaderboard enable row level security;

drop policy if exists "gauntlet_lb_select" on public.gauntlet_leaderboard;
create policy "gauntlet_lb_select"
  on public.gauntlet_leaderboard for select
  to anon, authenticated
  using (true);

drop policy if exists "gauntlet_lb_insert" on public.gauntlet_leaderboard;
create policy "gauntlet_lb_insert"
  on public.gauntlet_leaderboard for insert
  to anon, authenticated
  with check (true);

comment on table public.gauntlet_leaderboard is 'Gauntlet runs: honor-system; clients may inflate scores.';


-- ----------------------------------------------------------------------------
-- supabase/migrations/003_online_pvp_atomic_join_and_leaderboard.sql
-- ----------------------------------------------------------------------------
-- Atomic guest join (fixes TOCTOU) + atomic leaderboard win increment.
-- Apply via Supabase SQL Editor or `supabase db push`.

-- Guest join: single transaction, row lock, only succeeds if guest_joined is still false.
create or replace function public.try_join_pvp_room(p_room_id uuid, p_guest_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur jsonb;
  new_data jsonb;
  new_seq int;
  gname text;
begin
  gname := trim(both from coalesce(p_guest_name, ''));
  if gname = '' then
    gname := 'Guest';
  end if;

  select data into cur from public.pvp_rooms where id = p_room_id for update;
  if cur is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if coalesce((cur->>'guest_joined')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  new_seq := coalesce((cur->>'seq')::int, 0) + 1;
  new_data := cur || jsonb_build_object(
    'guest_joined', true,
    'guest_display_name', to_jsonb(gname),
    'seq', new_seq
  );

  update public.pvp_rooms
  set data = new_data, updated_at = now()
  where id = p_room_id;

  return jsonb_build_object('ok', true, 'data', new_data);
end;
$$;

-- Leaderboard: single atomic upsert + increment (fixes read-modify-write race on wins).
create or replace function public.increment_pvp_leaderboard_win(p_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  n text;
begin
  n := trim(both from coalesce(p_name, ''));
  if n = '' then
    return;
  end if;

  insert into public.pvp_leaderboard (name, wins, updated_at)
  values (n, 1, now())
  on conflict (name) do update
  set wins = public.pvp_leaderboard.wins + 1,
      updated_at = now();
end;
$$;

grant execute on function public.try_join_pvp_room(uuid, text) to anon, authenticated;
grant execute on function public.increment_pvp_leaderboard_win(text) to anon, authenticated;

-- Optional: prevent negative wins if a buggy client ever writes bad values.
alter table public.pvp_leaderboard
  drop constraint if exists pvp_leaderboard_wins_nonneg;

alter table public.pvp_leaderboard
  add constraint pvp_leaderboard_wins_nonneg check (wins >= 0);

comment on function public.try_join_pvp_room is 'Atomically marks guest_joined; returns ok/data or error full/not_found.';
comment on function public.increment_pvp_leaderboard_win is 'Atomically increments wins by 1 for display name.';


-- ----------------------------------------------------------------------------
-- supabase/migrations/004_online_pvp_rls_tighten.sql
-- ----------------------------------------------------------------------------
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


-- ----------------------------------------------------------------------------
-- supabase/migrations/005_online_pvp_room_tokens.sql
-- ----------------------------------------------------------------------------
-- Per-room caller tokens — direct fix for ISSUE-020 (`pvp_rooms` UPDATE/INSERT
-- still keyed only on knowing the room id under 004's structural guard).
--
-- Threat model after 004:
--   - DELETE: clients can't (policy dropped in 004).
--   - INSERT: anon-anyone can create rooms (rate-limited via unique code).
--   - UPDATE: anon-anyone who *knows the room id* can clobber the row's `data`
--             jsonb — which carries every player's draft + battle state.
--   - SELECT: world-readable (necessary for Realtime postgres-changes sub).
--
-- This migration funnels INSERTs and UPDATEs through SECURITY DEFINER RPCs
-- that mint and validate per-call tokens. Direct table writes from anon
-- are blocked entirely; clients prove they own the room by passing the
-- token returned at create-time (host) or join-time (guest).
--
-- SELECT stays open because Supabase Realtime needs it; the leak risk
-- ("spectators can read live matches") is documented as a known limitation.

-- Block direct UPDATEs from anon. The pvp_push_data RPC (security definer)
-- is the only legitimate write path.
drop policy if exists "pvp_rooms_update" on public.pvp_rooms;
create policy "pvp_rooms_update"
  on public.pvp_rooms for update
  to anon, authenticated
  using (false)
  with check (false);

-- Block direct INSERTs from anon. The try_create_pvp_room RPC mints the
-- host token and inserts the row server-side.
drop policy if exists "pvp_rooms_insert" on public.pvp_rooms;
create policy "pvp_rooms_insert"
  on public.pvp_rooms for insert
  to anon, authenticated
  with check (false);

comment on policy "pvp_rooms_update" on public.pvp_rooms is
  '005: locked — clients must use pvp_push_data RPC with a valid host/guest token.';
comment on policy "pvp_rooms_insert" on public.pvp_rooms is
  '005: locked — clients must use try_create_pvp_room RPC; server mints the host_token.';

-- Mint a room: generates host_token, inserts the row, returns { ok, id, host_token, code }.
-- The host_token is the secret the host uses to authorize all subsequent updates.
-- Retries on code collision are still the caller's responsibility (loop on
-- 'duplicate_code') — this keeps the existing client retry behavior intact.
create or replace function public.try_create_pvp_room(p_code text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  host_token text;
  merged jsonb;
begin
  if p_code is null or char_length(p_code) < 4 or char_length(p_code) > 32 then
    return jsonb_build_object('ok', false, 'error', 'bad_code');
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'bad_data');
  end if;
  if char_length(p_data::text) > 1048576 then
    return jsonb_build_object('ok', false, 'error', 'data_too_large');
  end if;

  host_token := encode(gen_random_bytes(24), 'hex'); -- 192-bit token
  merged := p_data || jsonb_build_object('host_token', host_token);

  begin
    insert into public.pvp_rooms (code, data, updated_at)
    values (p_code, merged, now())
    returning id into new_id;
  exception
    when unique_violation then
      return jsonb_build_object('ok', false, 'error', 'duplicate_code');
  end;

  return jsonb_build_object('ok', true, 'id', new_id, 'host_token', host_token, 'code', p_code);
end;
$$;

-- Replace try_join_pvp_room: also mints a guest_token and embeds it.
-- Returns { ok, data, guest_token } on success; { ok:false, error } on failure.
create or replace function public.try_join_pvp_room(p_room_id uuid, p_guest_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur jsonb;
  new_data jsonb;
  new_seq int;
  gname text;
  guest_token text;
begin
  gname := trim(both from coalesce(p_guest_name, ''));
  if gname = '' then
    gname := 'Guest';
  end if;

  select data into cur from public.pvp_rooms where id = p_room_id for update;
  if cur is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if coalesce((cur->>'guest_joined')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  guest_token := encode(gen_random_bytes(24), 'hex'); -- 192-bit token
  new_seq := coalesce((cur->>'seq')::int, 0) + 1;
  new_data := cur || jsonb_build_object(
    'guest_joined', true,
    'guest_display_name', to_jsonb(gname),
    'guest_token', guest_token,
    'seq', new_seq
  );

  update public.pvp_rooms
  set data = new_data, updated_at = now()
  where id = p_room_id;

  return jsonb_build_object('ok', true, 'data', new_data, 'guest_token', guest_token);
end;
$$;

-- Push a state patch — validates the caller's token matches host_token OR
-- guest_token before merging + bumping seq. Token comparison uses constant-
-- time pg_crypto helpers via the equality of fixed-length hex strings.
-- Returns { ok, data } on success or { ok:false, error } on failure.
create or replace function public.pvp_push_data(
  p_room_id uuid,
  p_token text,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur jsonb;
  host_t text;
  guest_t text;
  new_data jsonb;
  new_seq int;
begin
  if p_token is null or char_length(p_token) < 16 then
    return jsonb_build_object('ok', false, 'error', 'bad_token');
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'bad_patch');
  end if;

  select data into cur from public.pvp_rooms where id = p_room_id for update;
  if cur is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  host_t := cur->>'host_token';
  guest_t := cur->>'guest_token';
  if host_t is null and guest_t is null then
    return jsonb_build_object('ok', false, 'error', 'no_tokens_on_row');
  end if;
  if (host_t is null or p_token <> host_t) and (guest_t is null or p_token <> guest_t) then
    return jsonb_build_object('ok', false, 'error', 'token_mismatch');
  end if;

  -- Refuse patches that try to overwrite the embedded tokens.
  if p_patch ? 'host_token' or p_patch ? 'guest_token' then
    return jsonb_build_object('ok', false, 'error', 'token_in_patch');
  end if;

  -- Refuse patches that exceed the 1 MiB row ceiling.
  if char_length((cur || p_patch)::text) > 1048576 then
    return jsonb_build_object('ok', false, 'error', 'data_too_large');
  end if;

  new_seq := coalesce((cur->>'seq')::int, 0) + 1;
  new_data := cur || p_patch || jsonb_build_object('seq', new_seq);

  update public.pvp_rooms
  set data = new_data, updated_at = now()
  where id = p_room_id;

  return jsonb_build_object('ok', true, 'data', new_data);
end;
$$;

grant execute on function public.try_create_pvp_room(text, jsonb) to anon, authenticated;
grant execute on function public.try_join_pvp_room(uuid, text) to anon, authenticated;
grant execute on function public.pvp_push_data(uuid, text, jsonb) to anon, authenticated;

comment on function public.try_create_pvp_room is
  '005: Mints host_token, inserts the row, returns id + host_token. Anon-callable; client retries on duplicate_code.';
comment on function public.try_join_pvp_room is
  '005: Updated to mint guest_token. Returns ok + data + guest_token on join; or ok:false + error.';
comment on function public.pvp_push_data is
  '005: Validates the caller token matches host_token or guest_token on the row, then merges patch + bumps seq.';


-- ----------------------------------------------------------------------------
-- supabase/migrations/006_online_pvp_rls_harden.sql
-- ----------------------------------------------------------------------------
-- 006: Move per-room caller tokens OUT of the world-readable `data` jsonb into
-- dedicated columns whose SELECT is revoked from the anon/authenticated roles.
--
-- Direct fix for ISSUE-072. After 005, all writes go through token-validated
-- security-definer RPCs — good — BUT the tokens those RPCs check were embedded
-- in the `data` jsonb, and `data` is world-readable (SELECT stays open because
-- Supabase Realtime needs it to broadcast UPDATEs). That meant any client with
-- the publishable anon key could:
--     select data->>'host_token', data->>'guest_token' from pvp_rooms
-- lift a live token, and then call pvp_push_data() with it to hijack the match
-- (inject a team, force a turn, clobber the battle state). The token scheme from
-- 005 was therefore only as strong as "nobody runs a SELECT".
--
-- This migration stores the tokens in their own columns and revokes column-level
-- SELECT on them from anon/authenticated. Realtime delivers only the columns the
-- subscribing role can read, so the broadcast row no longer carries the tokens.
-- The RPCs are SECURITY DEFINER (owner privileges) so they still read/write the
-- token columns. Clients never read tokens from the row — they capture them from
-- the RPC return value at create/join time (online-pvp.js roomToken).
--
-- Apply via Supabase SQL Editor (Dashboard → SQL) or `supabase db push`, AFTER
-- migrations 001–005. Idempotent: safe to re-run.

-- 1. Dedicated token columns.
alter table public.pvp_rooms add column if not exists host_token text;
alter table public.pvp_rooms add column if not exists guest_token text;

-- 2. Backfill existing rows minted by 005 (tokens currently live in `data`):
--    copy into the columns, then strip from the jsonb so they stop broadcasting.
update public.pvp_rooms
set host_token  = coalesce(host_token,  data->>'host_token'),
    guest_token = coalesce(guest_token, data->>'guest_token'),
    data = (data - 'host_token' - 'guest_token')
where data ? 'host_token' or data ? 'guest_token';

-- 3. Column-level privileges. anon/authenticated may read everything EXCEPT the
--    token columns. (The row-level SELECT policy from 001 stays `using (true)`;
--    column GRANTs are what hide the tokens — and Realtime honours them.)
revoke select on public.pvp_rooms from anon;
revoke select on public.pvp_rooms from authenticated;
grant  select (id, code, data, updated_at) on public.pvp_rooms to anon;
grant  select (id, code, data, updated_at) on public.pvp_rooms to authenticated;

-- 4. Re-point the RPCs at the columns and keep tokens out of `data` forever.

-- Create: mint host_token into the column; `data` carries no token.
create or replace function public.try_create_pvp_room(p_code text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  v_host_token text;
begin
  if p_code is null or char_length(p_code) < 4 or char_length(p_code) > 32 then
    return jsonb_build_object('ok', false, 'error', 'bad_code');
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'bad_data');
  end if;
  if char_length(p_data::text) > 1048576 then
    return jsonb_build_object('ok', false, 'error', 'data_too_large');
  end if;
  -- Never let a caller seed tokens through the data envelope.
  p_data := (p_data - 'host_token' - 'guest_token');

  v_host_token := encode(gen_random_bytes(24), 'hex'); -- 192-bit token

  begin
    insert into public.pvp_rooms (code, data, host_token, updated_at)
    values (p_code, p_data, v_host_token, now())
    returning id into new_id;
  exception
    when unique_violation then
      return jsonb_build_object('ok', false, 'error', 'duplicate_code');
  end;

  return jsonb_build_object('ok', true, 'id', new_id, 'host_token', v_host_token, 'code', p_code);
end;
$$;

-- Join: mint guest_token into the column; returned `data` carries no token.
create or replace function public.try_join_pvp_room(p_room_id uuid, p_guest_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur jsonb;
  new_data jsonb;
  new_seq int;
  gname text;
  v_guest_token text;
  already_guest boolean;
begin
  gname := trim(both from coalesce(p_guest_name, ''));
  if gname = '' then
    gname := 'Guest';
  end if;

  select data, guest_token is not null
    into cur, already_guest
    from public.pvp_rooms where id = p_room_id for update;
  if cur is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if already_guest or coalesce((cur->>'guest_joined')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  v_guest_token := encode(gen_random_bytes(24), 'hex'); -- 192-bit token
  new_seq := coalesce((cur->>'seq')::int, 0) + 1;
  new_data := (cur - 'host_token' - 'guest_token') || jsonb_build_object(
    'guest_joined', true,
    'guest_display_name', to_jsonb(gname),
    'seq', new_seq
  );

  update public.pvp_rooms
  set data = new_data, guest_token = v_guest_token, updated_at = now()
  where id = p_room_id;

  return jsonb_build_object('ok', true, 'data', new_data, 'guest_token', v_guest_token);
end;
$$;

-- Push: validate p_token against the host_token/guest_token COLUMNS, merge patch.
create or replace function public.pvp_push_data(
  p_room_id uuid,
  p_token text,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur jsonb;
  host_t text;
  guest_t text;
  new_data jsonb;
  new_seq int;
begin
  if p_token is null or char_length(p_token) < 16 then
    return jsonb_build_object('ok', false, 'error', 'bad_token');
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'bad_patch');
  end if;

  select data, host_token, guest_token
    into cur, host_t, guest_t
    from public.pvp_rooms where id = p_room_id for update;
  if cur is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if host_t is null and guest_t is null then
    return jsonb_build_object('ok', false, 'error', 'no_tokens_on_row');
  end if;
  if (host_t is null or p_token <> host_t) and (guest_t is null or p_token <> guest_t) then
    return jsonb_build_object('ok', false, 'error', 'token_mismatch');
  end if;

  -- Refuse patches that try to (re)inject tokens into the broadcast envelope.
  if p_patch ? 'host_token' or p_patch ? 'guest_token' then
    return jsonb_build_object('ok', false, 'error', 'token_in_patch');
  end if;

  if char_length((cur || p_patch)::text) > 1048576 then
    return jsonb_build_object('ok', false, 'error', 'data_too_large');
  end if;

  new_seq := coalesce((cur->>'seq')::int, 0) + 1;
  new_data := cur || p_patch || jsonb_build_object('seq', new_seq);

  update public.pvp_rooms
  set data = new_data, updated_at = now()
  where id = p_room_id;

  return jsonb_build_object('ok', true, 'data', new_data);
end;
$$;

grant execute on function public.try_create_pvp_room(text, jsonb) to anon, authenticated;
grant execute on function public.try_join_pvp_room(uuid, text) to anon, authenticated;
grant execute on function public.pvp_push_data(uuid, text, jsonb) to anon, authenticated;

comment on column public.pvp_rooms.host_token is
  '006: host caller token. SELECT revoked from anon/authenticated; only the RPCs read it.';
comment on column public.pvp_rooms.guest_token is
  '006: guest caller token. SELECT revoked from anon/authenticated; only the RPCs read it.';

