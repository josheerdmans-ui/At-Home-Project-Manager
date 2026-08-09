-- Run once in Supabase → SQL Editor on a FRESH project (or after reset-public-schema.sql).
-- If you already have vehicles / vault tables, do NOT run this whole file — you will get
-- "relation already exists". Use apply-incremental-house-projects-calendar.sql instead.
-- Order: garage → vault → vault types → image vault → house projects & calendar

-- ========== 20260515160000_garage_vehicles.sql ==========
begin;

create extension if not exists "pgcrypto";

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  nickname text,
  year int not null,
  make text not null,
  model text not null,
  color text,
  vin text,
  license_plate text,
  current_mileage int,
  mpg_avg numeric(5, 2),
  last_oil_change_date date,
  last_oil_change_mileage int,
  tires_installed_date date,
  registration_expires date,
  insurance_expires date,
  photo_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicle_issues (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  description text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'fixed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicle_issues_vehicle_id_idx on public.vehicle_issues (vehicle_id);
create index vehicle_issues_status_idx on public.vehicle_issues (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create trigger vehicle_issues_set_updated_at
  before update on public.vehicle_issues
  for each row execute function public.set_updated_at();

alter table public.vehicles enable row level security;
alter table public.vehicle_issues enable row level security;

create policy "vehicles_anon_all" on public.vehicles for all using (true) with check (true);
create policy "vehicle_issues_anon_all" on public.vehicle_issues for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

create policy "vehicle_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'vehicle-photos');

create policy "vehicle_photos_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'vehicle-photos');

create policy "vehicle_photos_anon_update"
  on storage.objects for update
  using (bucket_id = 'vehicle-photos');

create policy "vehicle_photos_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'vehicle-photos');

commit;

-- ========== 20260516120000_vault_documents.sql ==========
begin;

create table public.vault_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('appliances', 'electronics', 'home_repair', 'vehicles')),
  notes text,
  purchase_date date,
  warranty_expires date,
  file_path text not null,
  file_name text not null,
  file_mime text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vault_documents_category_idx on public.vault_documents (category);
create index vault_documents_title_idx on public.vault_documents (title);

create trigger vault_documents_set_updated_at
  before update on public.vault_documents
  for each row execute function public.set_updated_at();

alter table public.vault_documents enable row level security;

create policy "vault_documents_anon_all" on public.vault_documents for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('vault-files', 'vault-files', true)
on conflict (id) do nothing;

create policy "vault_files_public_read"
  on storage.objects for select
  using (bucket_id = 'vault-files');

create policy "vault_files_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'vault-files');

create policy "vault_files_anon_update"
  on storage.objects for update
  using (bucket_id = 'vault-files');

create policy "vault_files_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'vault-files');

commit;

-- ========== 20260517140000_vault_document_types.sql ==========
begin;

alter table public.vault_documents
  add column if not exists doc_type text not null default 'warranty'
    check (doc_type in ('warranty', 'house_document', 'repair_note', 'remodel_note')),
  add column if not exists details text,
  add column if not exists cost numeric(12, 2),
  add column if not exists project_id text,
  add column if not exists project_title text,
  add column if not exists extra_files jsonb not null default '[]'::jsonb;

alter table public.vault_documents alter column category drop not null;

create index if not exists vault_documents_doc_type_idx on public.vault_documents (doc_type);

commit;

-- ========== 20260518120000_image_vault.sql ==========
begin;

create table public.image_vault_photos (
  id uuid primary key default gen_random_uuid(),
  photo_kind text not null check (photo_kind in ('memory', 'person')),
  file_path text not null,
  file_name text not null,
  file_mime text,
  notes text,
  created_at timestamptz not null default now()
);

create index image_vault_photos_kind_idx on public.image_vault_photos (photo_kind);
create index image_vault_photos_created_idx on public.image_vault_photos (created_at desc);

alter table public.image_vault_photos enable row level security;

create policy "image_vault_photos_anon_all"
  on public.image_vault_photos for all using (true) with check (true);

commit;

-- ========== 20260519120000_house_projects_and_calendar.sql ==========
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

-- Banking (Plaid)
create table if not exists public.banking_plaid_items (
  id uuid primary key default gen_random_uuid(),
  item_id text not null unique,
  access_token text not null,
  institution_name text,
  cursor text,
  status text not null default 'active'
    check (status in ('active', 'error', 'needs_reauth')),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banking_accounts (
  id uuid primary key default gen_random_uuid(),
  plaid_account_id text not null unique,
  item_row_id uuid not null references public.banking_plaid_items (id) on delete cascade,
  name text not null,
  official_name text,
  type text not null,
  subtype text,
  mask text,
  current_balance numeric(14, 2),
  available_balance numeric(14, 2),
  iso_currency_code text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists banking_accounts_item_row_id_idx
  on public.banking_accounts (item_row_id);

create table if not exists public.banking_transactions (
  id uuid primary key default gen_random_uuid(),
  plaid_transaction_id text not null unique,
  account_id uuid not null references public.banking_accounts (id) on delete cascade,
  amount numeric(14, 2) not null,
  date date not null,
  name text not null,
  merchant_name text,
  primary_category text not null default 'Uncategorized',
  pending boolean not null default false,
  iso_currency_code text not null default 'USD',
  created_at timestamptz not null default now()
);

create index if not exists banking_transactions_date_idx
  on public.banking_transactions (date desc);
create index if not exists banking_transactions_account_id_idx
  on public.banking_transactions (account_id);
create index if not exists banking_transactions_category_idx
  on public.banking_transactions (primary_category);

create table if not exists public.banking_settings (
  id int primary key default 1 check (id = 1),
  investments_amount numeric(14, 2) not null default 0,
  last_synced_at timestamptz,
  connection_count int not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.banking_settings (id, investments_amount, connection_count)
values (1, 0, 0)
on conflict (id) do nothing;

drop trigger if exists banking_plaid_items_set_updated_at on public.banking_plaid_items;
create trigger banking_plaid_items_set_updated_at
  before update on public.banking_plaid_items
  for each row execute function public.set_updated_at();

drop trigger if exists banking_accounts_set_updated_at on public.banking_accounts;
create trigger banking_accounts_set_updated_at
  before update on public.banking_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists banking_settings_set_updated_at on public.banking_settings;
create trigger banking_settings_set_updated_at
  before update on public.banking_settings
  for each row execute function public.set_updated_at();

alter table public.banking_plaid_items enable row level security;
alter table public.banking_accounts enable row level security;
alter table public.banking_transactions enable row level security;
alter table public.banking_settings enable row level security;

drop policy if exists "banking_accounts_anon_all" on public.banking_accounts;
create policy "banking_accounts_anon_all"
  on public.banking_accounts for all using (true) with check (true);

drop policy if exists "banking_transactions_anon_all" on public.banking_transactions;
create policy "banking_transactions_anon_all"
  on public.banking_transactions for all using (true) with check (true);

drop policy if exists "banking_settings_anon_all" on public.banking_settings;
create policy "banking_settings_anon_all"
  on public.banking_settings for all using (true) with check (true);

commit;


-- ===== 20260809120000_family_wall_display.sql =====

-- Household members and calendar event member links

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


-- ===== 20260809130000_drop_wall_settings_routines.sql =====

begin;

drop policy if exists "routine_step_completions_anon_all" on public.routine_step_completions;
drop policy if exists "routine_steps_anon_all" on public.routine_steps;
drop policy if exists "routines_anon_all" on public.routines;
drop policy if exists "household_settings_anon_all" on public.household_settings;

drop table if exists public.routine_step_completions;
drop table if exists public.routine_steps;
drop table if exists public.routines;
drop table if exists public.household_settings;

commit;

-- ===== 20260809140000_kid_economy.sql =====

-- Kid economy: chores, token ledger, rewards

begin;

create extension if not exists "pgcrypto";

create table if not exists public.chores (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  token_value int not null default 1 check (token_value >= 0),
  assignee_id uuid references public.household_members (id) on delete set null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chores_active_sort_idx
  on public.chores (is_active, sort_order, title);

create table if not exists public.token_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.household_members (id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('chore_complete', 'reward_purchase', 'adjustment')),
  ref_id uuid,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists token_ledger_member_idx
  on public.token_ledger (member_id, created_at desc);

create table if not exists public.chore_completions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references public.chores (id) on delete cascade,
  member_id uuid not null references public.household_members (id) on delete cascade,
  ledger_id uuid references public.token_ledger (id) on delete set null,
  completed_at timestamptz not null default now()
);

create index if not exists chore_completions_chore_idx
  on public.chore_completions (chore_id, completed_at desc);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  token_cost int not null check (token_cost > 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rewards_active_sort_idx
  on public.rewards (is_active, sort_order, title);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.rewards (id) on delete cascade,
  member_id uuid not null references public.household_members (id) on delete cascade,
  token_cost int not null check (token_cost > 0),
  status text not null default 'pending'
    check (status in ('pending', 'fulfilled', 'cancelled')),
  ledger_id uuid references public.token_ledger (id) on delete set null,
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

create index if not exists reward_redemptions_member_idx
  on public.reward_redemptions (member_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chores_set_updated_at on public.chores;
create trigger chores_set_updated_at
  before update on public.chores
  for each row execute function public.set_updated_at();

drop trigger if exists rewards_set_updated_at on public.rewards;
create trigger rewards_set_updated_at
  before update on public.rewards
  for each row execute function public.set_updated_at();

alter table public.chores enable row level security;
alter table public.token_ledger enable row level security;
alter table public.chore_completions enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;

drop policy if exists "chores_anon_all" on public.chores;
create policy "chores_anon_all"
  on public.chores for all using (true) with check (true);

drop policy if exists "token_ledger_anon_all" on public.token_ledger;
create policy "token_ledger_anon_all"
  on public.token_ledger for all using (true) with check (true);

drop policy if exists "chore_completions_anon_all" on public.chore_completions;
create policy "chore_completions_anon_all"
  on public.chore_completions for all using (true) with check (true);

drop policy if exists "rewards_anon_all" on public.rewards;
create policy "rewards_anon_all"
  on public.rewards for all using (true) with check (true);

drop policy if exists "reward_redemptions_anon_all" on public.reward_redemptions;
create policy "reward_redemptions_anon_all"
  on public.reward_redemptions for all using (true) with check (true);

commit;

-- ===== 20260809150000_meal_planning.sql =====

-- Meal planning: recipes, week plan, likes

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
