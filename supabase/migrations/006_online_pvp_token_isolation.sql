-- 006: Isolate per-room caller tokens from the world-readable `data` jsonb.
--
-- ISSUE-001 (P0, security): migration 005 stored host_token / guest_token INSIDE
-- the `data` jsonb. The SELECT policy is `using (true)` (001/004) and the room is
-- in the Realtime publication, so every anon client could read a room's tokens via
--   supabase.from('pvp_rooms').select('*')        -- REST
--   or by subscribing to postgres_changes          -- payload.new carries `data`
-- and then call pvp_push_data(room_id, <stolen token>, {...}) to clobber any live
-- match. That defeats the entire 005 token scheme (the secret that gates the write
-- RPC was published to every reader).
--
-- Fix: relocate tokens to a dedicated table that anon/authenticated CANNOT read
-- (RLS on, no policies, privileges revoked) — only the SECURITY DEFINER RPCs (which
-- run as the table owner and bypass RLS) touch it. The `data` jsonb the client
-- subscribes to never contains a token again. The client already sources its token
-- from the RPC return value (online-pvp.js:415 host / :445 guest), so NO client
-- change is required.
--
-- !!! VERIFY ON A STAGING SUPABASE PROJECT BEFORE PRODUCTION DEPLOY !!!
-- This repo has no local Postgres, so this migration is unit-untested. After apply,
-- exercise: create room -> join -> push (host) -> push (guest) -> push with a token
-- read from select('*') (must fail token_mismatch), and confirm select('*') and the
-- realtime payload contain no host_token/guest_token key.
-- Do NOT add public.pvp_room_tokens to the supabase_realtime publication.

-- ---------------------------------------------------------------------------
-- 1. Dedicated, locked-down token table.
-- ---------------------------------------------------------------------------
create table if not exists public.pvp_room_tokens (
  room_id     uuid primary key references public.pvp_rooms(id) on delete cascade,
  host_token  text not null,
  guest_token text,
  created_at  timestamptz not null default now()
);

-- RLS on + zero policies => anon/authenticated can do nothing through PostgREST.
-- SECURITY DEFINER functions run as the table owner and bypass RLS (we intentionally
-- do NOT FORCE row level security, which would block the owner too).
alter table public.pvp_room_tokens enable row level security;
revoke all on public.pvp_room_tokens from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Backfill from any existing rooms that still carry tokens in `data`,
--    then strip the tokens out of the readable jsonb.
-- ---------------------------------------------------------------------------
insert into public.pvp_room_tokens (room_id, host_token, guest_token)
  select id, data->>'host_token', data->>'guest_token'
    from public.pvp_rooms
   where data ? 'host_token'
     and (data->>'host_token') is not null
on conflict (room_id) do nothing;

update public.pvp_rooms
   set data = (data - 'host_token' - 'guest_token')
 where data ? 'host_token' or data ? 'guest_token';

-- ---------------------------------------------------------------------------
-- 3. Recreate the RPCs to read/write tokens from the isolated table.
-- ---------------------------------------------------------------------------

-- Mint a room: token goes to pvp_room_tokens, NOT into data. Returns { ok, id, host_token, code }.
create or replace function public.try_create_pvp_room(p_code text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_id     uuid;
  v_host_token text;
  v_data       jsonb;
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

  -- Never let caller-supplied data smuggle tokens into the readable jsonb.
  v_data := p_data - 'host_token' - 'guest_token';
  v_host_token := encode(gen_random_bytes(24), 'hex'); -- 192-bit token

  begin
    insert into public.pvp_rooms (code, data, updated_at)
    values (p_code, v_data, now())
    returning id into v_new_id;
  exception
    when unique_violation then
      return jsonb_build_object('ok', false, 'error', 'duplicate_code');
  end;

  insert into public.pvp_room_tokens (room_id, host_token)
  values (v_new_id, v_host_token);

  return jsonb_build_object('ok', true, 'id', v_new_id, 'host_token', v_host_token, 'code', p_code);
end;
$$;

-- Join a room: mint guest_token into the token table, NOT into data.
-- Returns { ok, data, guest_token } on success; { ok:false, error } on failure.
create or replace function public.try_join_pvp_room(p_room_id uuid, p_guest_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cur         jsonb;
  v_new_data    jsonb;
  v_new_seq     int;
  v_gname       text;
  v_guest_token text;
begin
  v_gname := trim(both from coalesce(p_guest_name, ''));
  if v_gname = '' then
    v_gname := 'Guest';
  end if;

  select data into v_cur from public.pvp_rooms where id = p_room_id for update;
  if v_cur is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if coalesce((v_cur->>'guest_joined')::boolean, false) then
    return jsonb_build_object('ok', false, 'error', 'full');
  end if;

  v_guest_token := encode(gen_random_bytes(24), 'hex'); -- 192-bit token
  v_new_seq := coalesce((v_cur->>'seq')::int, 0) + 1;
  -- Defensively strip any token keys before re-writing data.
  v_new_data := (v_cur - 'host_token' - 'guest_token') || jsonb_build_object(
    'guest_joined', true,
    'guest_display_name', to_jsonb(v_gname),
    'seq', v_new_seq
  );

  update public.pvp_rooms
     set data = v_new_data, updated_at = now()
   where id = p_room_id;

  -- Store the guest token alongside the host token. Upsert covers legacy rooms.
  update public.pvp_room_tokens
     set guest_token = v_guest_token
   where room_id = p_room_id;
  if not found then
    insert into public.pvp_room_tokens (room_id, host_token, guest_token)
    values (p_room_id, encode(gen_random_bytes(24), 'hex'), v_guest_token)
    on conflict (room_id) do update set guest_token = excluded.guest_token;
  end if;

  return jsonb_build_object('ok', true, 'data', v_new_data, 'guest_token', v_guest_token);
end;
$$;

-- Push a state patch — validates the caller token against the ISOLATED token table.
-- Returns { ok, data } on success or { ok:false, error } on failure.
create or replace function public.pvp_push_data(
  p_room_id uuid,
  p_token   text,
  p_patch   jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cur         jsonb;
  v_host_token  text;
  v_guest_token text;
  v_new_data    jsonb;
  v_new_seq     int;
begin
  if p_token is null or char_length(p_token) < 16 then
    return jsonb_build_object('ok', false, 'error', 'bad_token');
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'bad_patch');
  end if;

  select host_token, guest_token
    into v_host_token, v_guest_token
    from public.pvp_room_tokens
   where room_id = p_room_id;

  if v_host_token is null and v_guest_token is null then
    return jsonb_build_object('ok', false, 'error', 'no_tokens_on_row');
  end if;
  if (v_host_token is null or p_token <> v_host_token)
     and (v_guest_token is null or p_token <> v_guest_token) then
    return jsonb_build_object('ok', false, 'error', 'token_mismatch');
  end if;

  select data into v_cur from public.pvp_rooms where id = p_room_id for update;
  if v_cur is null then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;

  -- Strip any token keys a caller tries to smuggle into the readable jsonb.
  p_patch := p_patch - 'host_token' - 'guest_token';

  if char_length((v_cur || p_patch)::text) > 1048576 then
    return jsonb_build_object('ok', false, 'error', 'data_too_large');
  end if;

  v_new_seq := coalesce((v_cur->>'seq')::int, 0) + 1;
  v_new_data := v_cur || p_patch || jsonb_build_object('seq', v_new_seq);

  update public.pvp_rooms
     set data = v_new_data, updated_at = now()
   where id = p_room_id;

  return jsonb_build_object('ok', true, 'data', v_new_data);
end;
$$;

grant execute on function public.try_create_pvp_room(text, jsonb) to anon, authenticated;
grant execute on function public.try_join_pvp_room(uuid, text) to anon, authenticated;
grant execute on function public.pvp_push_data(uuid, text, jsonb) to anon, authenticated;

comment on table public.pvp_room_tokens is
  '006: Per-room host/guest tokens, isolated from the world-readable pvp_rooms.data jsonb. RLS-locked; only the SECURITY DEFINER RPCs read it. Never add to supabase_realtime.';
comment on function public.try_create_pvp_room is
  '006: Mints host_token into pvp_room_tokens (not data). Returns id + host_token.';
comment on function public.try_join_pvp_room is
  '006: Mints guest_token into pvp_room_tokens (not data). Returns data + guest_token.';
comment on function public.pvp_push_data is
  '006: Validates caller token against the isolated pvp_room_tokens table, then merges patch + bumps seq.';
