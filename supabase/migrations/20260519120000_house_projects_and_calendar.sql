-- House projects + family calendar (open RLS — hub login is the gate)

begin;

create table public.house_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('repair', 'remodel', 'general')),
  details text not null default '',
  cost numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index house_projects_kind_idx on public.house_projects (kind);
create index house_projects_updated_idx on public.house_projects (updated_at desc);

create trigger house_projects_set_updated_at
  before update on public.house_projects
  for each row execute function public.set_updated_at();

alter table public.house_projects enable row level security;

create policy "house_projects_anon_all"
  on public.house_projects for all using (true) with check (true);

create table public.family_calendar_events (
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

create index family_calendar_events_date_idx on public.family_calendar_events (event_date);
create index family_calendar_events_updated_idx on public.family_calendar_events (updated_at desc);

create trigger family_calendar_events_set_updated_at
  before update on public.family_calendar_events
  for each row execute function public.set_updated_at();

alter table public.family_calendar_events enable row level security;

create policy "family_calendar_events_anon_all"
  on public.family_calendar_events for all using (true) with check (true);

commit;
