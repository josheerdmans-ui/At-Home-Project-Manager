/** Household members + calendar links (keep in sync with 20260809120000_family_wall_display.sql) */
export const HOUSEHOLD_SETUP_SQL = `-- Household members and calendar event links

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

alter table public.household_members enable row level security;
alter table public.calendar_event_members enable row level security;

drop policy if exists "household_members_anon_all" on public.household_members;
create policy "household_members_anon_all"
  on public.household_members for all using (true) with check (true);

drop policy if exists "calendar_event_members_anon_all" on public.calendar_event_members;
create policy "calendar_event_members_anon_all"
  on public.calendar_event_members for all using (true) with check (true);

commit;
`;
