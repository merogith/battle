-- 007: Random matchmaking queue on top of the private-room system (001-006).
--
-- Adds `pvp_queue` + SECURITY DEFINER RPCs so a player can search for a random
-- opponent instead of trading a room code. Two queue kinds:
--   'crucible' — story-mode players, paired by team AVERAGE STAT bucket.
--   'menu'     — main-menu players, paired by a ruleset-signature bucket.
--
-- Design (mirrors the 005/006 token model):
--   * Direct writes to pvp_queue are blocked; everything goes through the RPCs.
--   * Secret columns (owner_token, room_token, team_payload) have SELECT revoked
--     from anon/authenticated — Realtime broadcasts only the safe columns, so a
--     peer can see "matched" but never lifts a token or scouts the other team.
--   * The CLAIMER becomes HOST: the pairing RPC mints a pvp_rooms row pre-filled
--     with BOTH teams (p1_draft = host team, p2_draft = guest team, guest_joined
--     = true), so the existing draft-complete -> startBattle path takes over with
--     no new battle-seeding code. Tokens go in the room's host_token/guest_token
--     columns exactly as try_create_pvp_room does.
--   * Pairing is race-safe via `for update skip locked`: two simultaneous claims
--     never double-match the same waiter, and no deadlock (skip-locked never
--     blocks). No pg_sleep — the CLIENT drives retries via pvp_matchmake_poll
--     with a widening tolerance.
--
-- Apply AFTER 001-006. Idempotent: safe to re-run.

-- ----------------------------------------------------------------------------
-- Table
-- ----------------------------------------------------------------------------
create table if not exists public.pvp_queue (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null,                       -- device id (accountless)
  owner_token     text not null,                       -- secret; authorizes poll/cancel
  display_name    text not null default 'Trainer',
  queue_kind      text not null,                       -- 'crucible' | 'menu'
  bucket          int  not null default 0,             -- stat bucket (crucible) / ruleset hash (menu)
  match_options   jsonb not null default '{}'::jsonb,
  team_payload    jsonb not null default '[]'::jsonb,  -- secret; the locked team
  status          text not null default 'waiting',     -- waiting | matched | cancelled | expired
  matched_room_id uuid,
  matched_role    int,                                 -- 1 host, 2 guest
  room_token      text,                                -- secret; this player's room token
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '3 minutes'),
  updated_at      timestamptz not null default now()
);

create index if not exists pvp_queue_waiting_idx
  on public.pvp_queue (queue_kind, bucket, created_at)
  where status = 'waiting';
create index if not exists pvp_queue_owner_waiting_idx
  on public.pvp_queue (owner_id)
  where status = 'waiting';

alter table public.pvp_queue enable row level security;

-- World-readable row policy (Realtime needs SELECT) but column GRANTs hide the
-- three secret columns — same pattern pvp_rooms uses for its token columns.
drop policy if exists "pvp_queue_select" on public.pvp_queue;
create policy "pvp_queue_select" on public.pvp_queue for select to anon, authenticated using (true);
revoke select on public.pvp_queue from anon;
revoke select on public.pvp_queue from authenticated;
grant select (id, owner_id, queue_kind, bucket, status, matched_room_id, matched_role, created_at, expires_at, updated_at)
  on public.pvp_queue to anon;
grant select (id, owner_id, queue_kind, bucket, status, matched_room_id, matched_role, created_at, expires_at, updated_at)
  on public.pvp_queue to authenticated;

-- Block direct writes; the RPCs (security definer) are the only mutation path.
drop policy if exists "pvp_queue_insert" on public.pvp_queue;
create policy "pvp_queue_insert" on public.pvp_queue for insert to anon, authenticated with check (false);
drop policy if exists "pvp_queue_update" on public.pvp_queue;
create policy "pvp_queue_update" on public.pvp_queue for update to anon, authenticated using (false) with check (false);

comment on column public.pvp_queue.owner_token is '007: secret; authorizes poll/cancel. SELECT revoked from anon/authenticated.';
comment on column public.pvp_queue.room_token is '007: secret; the room token this player uses post-match. SELECT revoked.';
comment on column public.pvp_queue.team_payload is '007: locked team; SELECT revoked so a peer cannot scout it pre-match.';

-- ----------------------------------------------------------------------------
-- Internal helper: create a matchmade room seeded with both teams.
-- Returns { room_id, host_token, guest_token, code } or null on code collision.
-- ----------------------------------------------------------------------------
create or replace function public._pvp_match_create_room(
  p_host_name text, p_host_team jsonb,
  p_guest_name text, p_guest_team jsonb,
  p_match_options jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_host_token text;
  v_guest_token text;
  v_room_id uuid;
  v_data jsonb;
  attempt int;
begin
  v_host_token := encode(gen_random_bytes(24), 'hex');
  v_guest_token := encode(gen_random_bytes(24), 'hex');
  v_data := jsonb_build_object(
    'seq', 1,
    'phase', 'draft',
    'guest_joined', true,
    'matchmade', true,
    'host_display_name', p_host_name,
    'guest_display_name', p_guest_name,
    'match_options', coalesce(p_match_options, '{}'::jsonb),
    'p1_pool', '[]'::jsonb,
    'p2_pool', '[]'::jsonb,
    'p1_draft', coalesce(p_host_team, '[]'::jsonb),
    'p2_draft', coalesce(p_guest_team, '[]'::jsonb),
    'draft_turn', 1,
    'draft_deadline_iso', null,
    'battle_turn_deadline_iso', null,
    'p1_wins', 0,
    'p2_wins', 0,
    'round_number', 1,
    'battle', jsonb_build_object(
      'pending_turn', 1, 'p1_pick', null, 'p2_pick', null,
      'p1_gimmick', null, 'p2_gimmick', null,
      'resolved_turn', 0, 'state_blob', null, 'state_hash', null
    )
  );

  for attempt in 1..8 loop
    v_code := 'MM' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 6));
    begin
      insert into public.pvp_rooms (code, data, host_token, guest_token, updated_at)
      values (v_code, v_data, v_host_token, v_guest_token, now())
      returning id into v_room_id;
      exit;
    exception when unique_violation then
      v_room_id := null;
    end;
  end loop;

  if v_room_id is null then
    return null;
  end if;
  return jsonb_build_object('room_id', v_room_id, 'host_token', v_host_token, 'guest_token', v_guest_token, 'code', v_code);
end;
$$;

-- Internal helper: claim the best waiting opponent (caller becomes HOST) and
-- create the room. Marks the opponent row matched/guest. Returns
-- { room_id, host_token, opponent_id } or null when nobody is claimable.
create or replace function public._pvp_match_try_claim(
  p_exclude_id uuid,
  p_owner_id uuid,
  p_kind text,
  p_bucket int,
  p_tolerance int,
  p_host_name text,
  p_host_team jsonb,
  p_match_options jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opp_id uuid;
  v_opp_name text;
  v_opp_team jsonb;
  v_room jsonb;
begin
  select id, display_name, team_payload
    into v_opp_id, v_opp_name, v_opp_team
    from public.pvp_queue
   where status = 'waiting'
     and queue_kind = p_kind
     and owner_id <> p_owner_id
     and (p_exclude_id is null or id <> p_exclude_id)
     and abs(bucket - p_bucket) <= greatest(coalesce(p_tolerance, 0), 0)
     and expires_at > now()
   order by created_at asc
   limit 1
   for update skip locked;

  if not found then
    return null;
  end if;

  v_room := public._pvp_match_create_room(p_host_name, p_host_team, v_opp_name, v_opp_team, p_match_options);
  if v_room is null then
    return null;
  end if;

  update public.pvp_queue
     set status = 'matched',
         matched_room_id = (v_room->>'room_id')::uuid,
         matched_role = 2,
         room_token = v_room->>'guest_token',
         updated_at = now()
   where id = v_opp_id;

  return jsonb_build_object('room_id', v_room->>'room_id', 'host_token', v_room->>'host_token', 'opponent_id', v_opp_id);
end;
$$;

-- ----------------------------------------------------------------------------
-- Public RPCs
-- ----------------------------------------------------------------------------

-- Enqueue + immediate claim attempt. Returns either a match (caller = host) or
-- a queue_id to poll. Replaces any prior waiting row for the same owner.
create or replace function public.pvp_matchmake_enqueue(
  p_owner_id uuid,
  p_owner_token text,
  p_display_name text,
  p_kind text,
  p_bucket int,
  p_tolerance int,
  p_match_options jsonb,
  p_team_payload jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_claim jsonb;
  v_queue_id uuid;
begin
  if p_owner_id is null or p_owner_token is null or char_length(p_owner_token) < 16 then
    return jsonb_build_object('ok', false, 'error', 'bad_owner');
  end if;
  if p_kind not in ('crucible', 'menu') then
    return jsonb_build_object('ok', false, 'error', 'bad_kind');
  end if;
  if p_team_payload is null or jsonb_typeof(p_team_payload) <> 'array' then
    return jsonb_build_object('ok', false, 'error', 'bad_team');
  end if;
  if char_length(p_team_payload::text) > 524288 then
    return jsonb_build_object('ok', false, 'error', 'team_too_large');
  end if;
  v_name := nullif(trim(both from coalesce(p_display_name, '')), '');
  if v_name is null then v_name := 'Trainer'; end if;

  -- Opportunistic stale cleanup (no pg_cron dependency).
  update public.pvp_queue set status = 'expired', updated_at = now()
    where status = 'waiting' and expires_at < now();
  -- Re-queue replaces any earlier waiting row for this device.
  update public.pvp_queue set status = 'cancelled', updated_at = now()
    where owner_id = p_owner_id and status = 'waiting';

  -- Try to claim an existing waiter (caller becomes host).
  v_claim := public._pvp_match_try_claim(null, p_owner_id, p_kind, p_bucket, p_tolerance, v_name, p_team_payload, p_match_options);

  if v_claim is not null then
    insert into public.pvp_queue
      (owner_id, owner_token, display_name, queue_kind, bucket, match_options, team_payload, status, matched_room_id, matched_role, room_token)
    values
      (p_owner_id, p_owner_token, v_name, p_kind, p_bucket, coalesce(p_match_options, '{}'::jsonb), p_team_payload,
       'matched', (v_claim->>'room_id')::uuid, 1, v_claim->>'host_token')
    returning id into v_queue_id;
    return jsonb_build_object('ok', true, 'matched', true, 'queue_id', v_queue_id,
      'room_id', v_claim->>'room_id', 'role', 1, 'token', v_claim->>'host_token');
  end if;

  insert into public.pvp_queue
    (owner_id, owner_token, display_name, queue_kind, bucket, match_options, team_payload, status)
  values
    (p_owner_id, p_owner_token, v_name, p_kind, p_bucket, coalesce(p_match_options, '{}'::jsonb), p_team_payload, 'waiting')
  returning id into v_queue_id;

  return jsonb_build_object('ok', true, 'matched', false, 'queue_id', v_queue_id);
end;
$$;

-- Poll a waiting entry. If we were already claimed by someone, return the match.
-- Otherwise re-attempt a claim with the (widened) tolerance the client passes.
create or replace function public.pvp_matchmake_poll(
  p_queue_id uuid,
  p_owner_token text,
  p_tolerance int
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.pvp_queue%rowtype;
  v_claim jsonb;
begin
  select * into v_row from public.pvp_queue where id = p_queue_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_row.owner_token is null or p_owner_token is null or p_owner_token <> v_row.owner_token then
    return jsonb_build_object('ok', false, 'error', 'bad_token');
  end if;

  if v_row.status = 'matched' then
    return jsonb_build_object('ok', true, 'matched', true,
      'room_id', v_row.matched_room_id, 'role', v_row.matched_role, 'token', v_row.room_token);
  end if;
  if v_row.status <> 'waiting' then
    return jsonb_build_object('ok', true, 'matched', false, 'status', v_row.status);
  end if;
  if v_row.expires_at < now() then
    update public.pvp_queue set status = 'expired', updated_at = now() where id = p_queue_id;
    return jsonb_build_object('ok', true, 'matched', false, 'status', 'expired');
  end if;

  v_claim := public._pvp_match_try_claim(v_row.id, v_row.owner_id, v_row.queue_kind, v_row.bucket, p_tolerance,
    v_row.display_name, v_row.team_payload, v_row.match_options);
  if v_claim is not null then
    update public.pvp_queue
       set status = 'matched', matched_room_id = (v_claim->>'room_id')::uuid,
           matched_role = 1, room_token = v_claim->>'host_token', updated_at = now()
     where id = p_queue_id;
    return jsonb_build_object('ok', true, 'matched', true,
      'room_id', v_claim->>'room_id', 'role', 1, 'token', v_claim->>'host_token');
  end if;

  return jsonb_build_object('ok', true, 'matched', false, 'status', 'waiting');
end;
$$;

-- Cancel a waiting entry (used on user-cancel and on bot-fallback handoff).
create or replace function public.pvp_matchmake_cancel(p_queue_id uuid, p_owner_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.pvp_queue%rowtype;
begin
  select * into v_row from public.pvp_queue where id = p_queue_id for update;
  if not found then
    return jsonb_build_object('ok', true, 'status', 'gone');
  end if;
  if v_row.owner_token is null or p_owner_token is null or p_owner_token <> v_row.owner_token then
    return jsonb_build_object('ok', false, 'error', 'bad_token');
  end if;
  if v_row.status = 'waiting' then
    update public.pvp_queue set status = 'cancelled', updated_at = now() where id = p_queue_id;
    return jsonb_build_object('ok', true, 'status', 'cancelled');
  end if;
  return jsonb_build_object('ok', true, 'status', v_row.status);
end;
$$;

-- Anon may call the public RPCs; the internal helpers are NOT anon-callable
-- (they run with owner privileges only from inside the public RPCs).
grant execute on function public.pvp_matchmake_enqueue(uuid, text, text, text, int, int, jsonb, jsonb) to anon, authenticated;
grant execute on function public.pvp_matchmake_poll(uuid, text, int) to anon, authenticated;
grant execute on function public.pvp_matchmake_cancel(uuid, text) to anon, authenticated;
revoke all on function public._pvp_match_create_room(text, jsonb, text, jsonb, jsonb) from public;
revoke all on function public._pvp_match_try_claim(uuid, uuid, text, int, int, text, jsonb, jsonb) from public;

comment on function public.pvp_matchmake_enqueue is
  '007: enqueue + immediate claim. Caller becomes host on a claim; seeds a pvp_rooms row with both teams.';
comment on function public.pvp_matchmake_poll is
  '007: poll a waiting entry; returns the match if claimed, else re-attempts a claim with widened tolerance.';
comment on function public.pvp_matchmake_cancel is
  '007: cancel a waiting entry (user cancel / bot-fallback handoff).';

-- ----------------------------------------------------------------------------
-- Realtime: deliver pvp_queue UPDATEs so a waiting client learns "matched" fast.
-- (The pvp_matchmake_poll RPC is the fallback if Realtime is unavailable.)
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'pvp_queue'
  ) then
    execute 'alter publication supabase_realtime add table public.pvp_queue';
  end if;
exception when undefined_object then
  raise notice 'supabase_realtime publication not found; enable Realtime on pvp_queue via the dashboard.';
end $$;

alter table public.pvp_queue replica identity full;
