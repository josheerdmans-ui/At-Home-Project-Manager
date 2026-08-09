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
