-- Godot progress page: release date + category for history filters

begin;

alter table public.ninja_progress_updates
  add column if not exists released_on date not null default current_date;

alter table public.ninja_progress_updates
  add column if not exists category text not null default 'gameplay';

update public.ninja_progress_updates
  set released_on = created_at::date
  where released_on is null;

alter table public.ninja_progress_updates
  drop constraint if exists ninja_progress_updates_category_check;

alter table public.ninja_progress_updates
  add constraint ninja_progress_updates_category_check
  check (category in ('gameplay', 'visuals', 'bug_fixes'));

commit;
