/** Meal planning tables (keep in sync with 20260809150000_meal_planning.sql) */
export const MEAL_PLANNING_SETUP_SQL = `-- Meal planning: recipes, week plan, likes

begin;

create extension if not exists "pgcrypto";

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prep_time text not null default '',
  cook_time text not null default '',
  ingredients text[] not null default '{}',
  instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists meals_name_idx on public.meals (name);

create table if not exists public.meal_likes (
  meal_id uuid not null references public.meals (id) on delete cascade,
  member_id uuid not null references public.household_members (id) on delete cascade,
  primary key (meal_id, member_id)
);

create index if not exists meal_likes_member_idx on public.meal_likes (member_id);

create table if not exists public.meal_plan_entries (
  id uuid primary key default gen_random_uuid(),
  plan_date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner')),
  meal_id uuid not null references public.meals (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (plan_date, slot)
);

create index if not exists meal_plan_entries_date_idx
  on public.meal_plan_entries (plan_date);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meals_set_updated_at on public.meals;
create trigger meals_set_updated_at
  before update on public.meals
  for each row execute function public.set_updated_at();

alter table public.meals enable row level security;
alter table public.meal_likes enable row level security;
alter table public.meal_plan_entries enable row level security;

drop policy if exists "meals_anon_all" on public.meals;
create policy "meals_anon_all"
  on public.meals for all using (true) with check (true);

drop policy if exists "meal_likes_anon_all" on public.meal_likes;
create policy "meal_likes_anon_all"
  on public.meal_likes for all using (true) with check (true);

drop policy if exists "meal_plan_entries_anon_all" on public.meal_plan_entries;
create policy "meal_plan_entries_anon_all"
  on public.meal_plan_entries for all using (true) with check (true);

commit;
`;
