-- Family wall display: members, event links, settings, routines

begin;

create extension if not exists "pgcrypto";

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  color_token text not null default 'sky'
    check (color_token in (
      'sky', 'orange', 'violet', 'emerald', 'rose', 'amber', 'cyan', 'indigo'
    )),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists household_members_sort_idx
  on public.household_members (sort_order, display_name);

create table if not exists public.calendar_event_members (
  event_id uuid not null references public.family_calendar_events (id) on delete cascade,
  member_id uuid not null references public.household_members (id) on delete cascade,
  primary key (event_id, member_id)
);

create index if not exists calendar_event_members_member_idx
  on public.calendar_event_members (member_id);

create table if not exists public.household_settings (
  id int primary key default 1 check (id = 1),
  frame_interval_sec int not null default 8 check (frame_interval_sec between 3 and 120),
  frame_shuffle boolean not null default true,
  frame_include_person boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.household_settings (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  icon_key text not null default 'sun',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_steps (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists routine_steps_routine_idx
  on public.routine_steps (routine_id, sort_order);

create table if not exists public.routine_step_completions (
  step_id uuid not null references public.routine_steps (id) on delete cascade,
  completed_on date not null default (timezone('utc', now()))::date,
  completed_at timestamptz not null default now(),
  primary key (step_id, completed_on)
);

create index if not exists routine_step_completions_day_idx
  on public.routine_step_completions (completed_on);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists household_members_set_updated_at on public.household_members;
create trigger household_members_set_updated_at
  before update on public.household_members
  for each row execute function public.set_updated_at();

drop trigger if exists household_settings_set_updated_at on public.household_settings;
create trigger household_settings_set_updated_at
  before update on public.household_settings
  for each row execute function public.set_updated_at();

drop trigger if exists routines_set_updated_at on public.routines;
create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

drop trigger if exists routine_steps_set_updated_at on public.routine_steps;
create trigger routine_steps_set_updated_at
  before update on public.routine_steps
  for each row execute function public.set_updated_at();

alter table public.household_members enable row level security;
alter table public.calendar_event_members enable row level security;
alter table public.household_settings enable row level security;
alter table public.routines enable row level security;
alter table public.routine_steps enable row level security;
alter table public.routine_step_completions enable row level security;

drop policy if exists "household_members_anon_all" on public.household_members;
create policy "household_members_anon_all"
  on public.household_members for all using (true) with check (true);

drop policy if exists "calendar_event_members_anon_all" on public.calendar_event_members;
create policy "calendar_event_members_anon_all"
  on public.calendar_event_members for all using (true) with check (true);

drop policy if exists "household_settings_anon_all" on public.household_settings;
create policy "household_settings_anon_all"
  on public.household_settings for all using (true) with check (true);

drop policy if exists "routines_anon_all" on public.routines;
create policy "routines_anon_all"
  on public.routines for all using (true) with check (true);

drop policy if exists "routine_steps_anon_all" on public.routine_steps;
create policy "routine_steps_anon_all"
  on public.routine_steps for all using (true) with check (true);

drop policy if exists "routine_step_completions_anon_all" on public.routine_step_completions;
create policy "routine_step_completions_anon_all"
  on public.routine_step_completions for all using (true) with check (true);

commit;
