-- Drop wall-only settings/routines if a prior full wall migration was applied

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
