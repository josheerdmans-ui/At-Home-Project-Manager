-- Ninja Survivors: sidebar boards + Monday-style stages

begin;

alter table public.ninja_items
  add column if not exists area text not null default 'character_design';

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

create index if not exists ninja_items_area_idx on public.ninja_items (area);

commit;
