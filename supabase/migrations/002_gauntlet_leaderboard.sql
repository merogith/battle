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
