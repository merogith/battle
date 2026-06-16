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
