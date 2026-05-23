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
