-- Named Godot updates with a long notes field

begin;

alter table public.ninja_progress_updates
  add column if not exists title text not null default '';

commit;
