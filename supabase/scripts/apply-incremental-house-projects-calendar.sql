-- Run this on an EXISTING Supabase project that already has garage/vault tables.
-- Do NOT run apply-all-migrations.sql again — that recreates vehicles and will error.
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS where needed.

begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.house_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('repair', 'remodel', 'general')),
  details text not null default '',
  cost numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists house_projects_kind_idx on public.house_projects (kind);
create index if not exists house_projects_updated_idx on public.house_projects (updated_at desc);

drop trigger if exists house_projects_set_updated_at on public.house_projects;
create trigger house_projects_set_updated_at
  before update on public.house_projects
  for each row execute function public.set_updated_at();

alter table public.house_projects enable row level security;

drop policy if exists "house_projects_anon_all" on public.house_projects;
create policy "house_projects_anon_all"
  on public.house_projects for all using (true) with check (true);

create table if not exists public.family_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  event_time text,
  category text not null default 'general'
    check (category in ('general', 'meal', 'activity', 'appointment')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_calendar_events_date_idx on public.family_calendar_events (event_date);
create index if not exists family_calendar_events_updated_idx on public.family_calendar_events (updated_at desc);

drop trigger if exists family_calendar_events_set_updated_at on public.family_calendar_events;
create trigger family_calendar_events_set_updated_at
  before update on public.family_calendar_events
  for each row execute function public.set_updated_at();

alter table public.family_calendar_events enable row level security;

drop policy if exists "family_calendar_events_anon_all" on public.family_calendar_events;
create policy "family_calendar_events_anon_all"
  on public.family_calendar_events for all using (true) with check (true);

alter table public.family_calendar_events
  add column if not exists event_kind text not null default 'regular'
    check (event_kind in ('regular', 'important', 'birthday', 'school'));

alter table public.family_calendar_events
  add column if not exists color_class text not null default 'bg-cyan-100 text-cyan-700';

commit;
