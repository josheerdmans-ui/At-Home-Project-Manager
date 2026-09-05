-- Card fields from the Edit item mockup: due date, priority, tags, checklist, activity

begin;

alter table public.ninja_items
  add column if not exists due_date date;

alter table public.ninja_items
  add column if not exists priority text not null default 'medium';

alter table public.ninja_items
  add column if not exists tags text[] not null default '{}';

alter table public.ninja_items drop constraint if exists ninja_items_priority_check;
alter table public.ninja_items
  add constraint ninja_items_priority_check
  check (priority in ('low', 'medium', 'high'));

create table if not exists public.ninja_item_checks (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.ninja_items (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ninja_item_checks_item_idx on public.ninja_item_checks (item_id, sort_order);

alter table public.ninja_item_checks enable row level security;

drop policy if exists "ninja_item_checks_anon_all" on public.ninja_item_checks;
create policy "ninja_item_checks_anon_all"
  on public.ninja_item_checks for all using (true) with check (true);

create table if not exists public.ninja_item_activity (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.ninja_items (id) on delete cascade,
  actor text not null default 'Team',
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists ninja_item_activity_item_idx on public.ninja_item_activity (item_id, created_at desc);

alter table public.ninja_item_activity enable row level security;

drop policy if exists "ninja_item_activity_anon_all" on public.ninja_item_activity;
create policy "ninja_item_activity_anon_all"
  on public.ninja_item_activity for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'ninja_item_checks'
  ) then
    execute 'alter publication supabase_realtime add table public.ninja_item_checks';
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'ninja_item_activity'
  ) then
    execute 'alter publication supabase_realtime add table public.ninja_item_activity';
  end if;
end $$;

commit;
