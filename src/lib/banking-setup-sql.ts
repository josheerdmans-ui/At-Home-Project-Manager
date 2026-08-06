/** Banking migration for in-app Copy setup SQL (keep in sync with supabase/migrations/20260521120000_banking_plaid.sql) */
export const BANKING_SETUP_SQL = `-- Banking: Plaid accounts, transactions, manual investments

begin;

create extension if not exists "pgcrypto";

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

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
`;
