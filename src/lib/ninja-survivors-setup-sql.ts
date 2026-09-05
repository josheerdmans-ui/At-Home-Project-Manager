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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ninja_items
  add column if not exists area text not null default 'character_design';

alter table public.ninja_items
  add column if not exists info text not null default '';

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

commit;
`;
