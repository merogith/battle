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
