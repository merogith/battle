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
