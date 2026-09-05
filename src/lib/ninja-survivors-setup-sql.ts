/** Ninja Survivors board table for in-app Copy setup SQL */
export const NINJA_SURVIVORS_SETUP_SQL = `-- Ninja Survivors project board (areas + grouped stages)

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

create table if not exists public.ninja_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  info text not null default '',
  details text not null default '',
  stage text not null default 'idea',
  area text not null default 'character_design',
  owner text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ninja_items
  add column if not exists area text not null default 'character_design';

alter table public.ninja_items
  add column if not exists info text not null default '';

alter table public.ninja_items
  add column if not exists due_date date;

alter table public.ninja_items
  add column if not exists priority text not null default 'medium';

alter table public.ninja_items
  add column if not exists tags text[] not null default '{}';

alter table public.ninja_items
  add column if not exists sort_order int not null default 0;

update public.ninja_items
  set stage = 'working_on'
  where stage = 'testing';

alter table public.ninja_items drop constraint if exists ninja_items_stage_check;
alter table public.ninja_items drop constraint if exists ninja_items_area_check;

alter table public.ninja_items
  add constraint ninja_items_stage_check
  check (stage in ('idea', 'working_on', 'confirmed', 'implemented'));

alter table public.ninja_items
  add constraint ninja_items_area_check
  check (area in (
    'character_design',
    'level_up_system',
    'game_design_vfx',
    'core_gameplay',
    'character_progression'
  ));

create index if not exists ninja_items_stage_idx on public.ninja_items (stage);
create index if not exists ninja_items_area_idx on public.ninja_items (area);
create index if not exists ninja_items_updated_idx on public.ninja_items (updated_at desc);
create index if not exists ninja_items_board_order_idx
  on public.ninja_items (area, stage, sort_order);

drop trigger if exists ninja_items_set_updated_at on public.ninja_items;
create trigger ninja_items_set_updated_at
  before update on public.ninja_items
  for each row execute function public.set_updated_at();

alter table public.ninja_items enable row level security;

drop policy if exists "ninja_items_anon_all" on public.ninja_items;
create policy "ninja_items_anon_all"
  on public.ninja_items for all using (true) with check (true);

create table if not exists public.ninja_item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.ninja_items (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_mime text,
  created_at timestamptz not null default now()
);

create index if not exists ninja_item_images_item_idx on public.ninja_item_images (item_id);
create index if not exists ninja_item_images_created_idx on public.ninja_item_images (created_at desc);

alter table public.ninja_item_images enable row level security;

drop policy if exists "ninja_item_images_anon_all" on public.ninja_item_images;
create policy "ninja_item_images_anon_all"
  on public.ninja_item_images for all using (true) with check (true);

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
      and c.relname = 'ninja_items'
  ) then
    execute 'alter publication supabase_realtime add table public.ninja_items';
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'ninja_item_images'
  ) then
    execute 'alter publication supabase_realtime add table public.ninja_item_images';
  end if;
end $$;

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

create table if not exists public.ninja_ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists ninja_ideas_created_idx
  on public.ninja_ideas (created_at desc);

alter table public.ninja_ideas enable row level security;

drop policy if exists "ninja_ideas_anon_all" on public.ninja_ideas;
create policy "ninja_ideas_anon_all"
  on public.ninja_ideas for all using (true) with check (true);

create table if not exists public.ninja_idea_votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ninja_ideas (id) on delete cascade,
  voter text not null,
  created_at timestamptz not null default now(),
  unique (idea_id, voter)
);

create index if not exists ninja_idea_votes_idea_idx
  on public.ninja_idea_votes (idea_id);

alter table public.ninja_idea_votes enable row level security;

drop policy if exists "ninja_idea_votes_anon_all" on public.ninja_idea_votes;
create policy "ninja_idea_votes_anon_all"
  on public.ninja_idea_votes for all using (true) with check (true);

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
      and c.relname = 'ninja_ideas'
  ) then
    execute 'alter publication supabase_realtime add table public.ninja_ideas';
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'ninja_idea_votes'
  ) then
    execute 'alter publication supabase_realtime add table public.ninja_idea_votes';
  end if;

  if not exists (
    select 1
    from pg_publication_rel pr
    join pg_publication p on p.oid = pr.prpubid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where p.pubname = 'supabase_realtime'
      and n.nspname = 'public'
      and c.relname = 'ninja_progress_updates'
  ) then
    execute 'alter publication supabase_realtime add table public.ninja_progress_updates';
  end if;
end $$;

create table if not exists public.ninja_progress_updates (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null default '',
  body text not null default '',
  category text not null default 'gameplay',
  released_on date not null default current_date,
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table public.ninja_progress_updates
  add column if not exists title text not null default '';

alter table public.ninja_progress_updates
  add column if not exists released_on date not null default current_date;

alter table public.ninja_progress_updates
  add column if not exists category text not null default 'gameplay';

alter table public.ninja_progress_updates
  drop constraint if exists ninja_progress_updates_category_check;

alter table public.ninja_progress_updates
  add constraint ninja_progress_updates_category_check
  check (category in ('gameplay', 'visuals', 'bug_fixes'));

create index if not exists ninja_progress_updates_created_idx
  on public.ninja_progress_updates (created_at desc);

alter table public.ninja_progress_updates enable row level security;

drop policy if exists "ninja_progress_updates_anon_all" on public.ninja_progress_updates;
create policy "ninja_progress_updates_anon_all"
  on public.ninja_progress_updates for all using (true) with check (true);

commit;
`;
