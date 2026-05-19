-- Run in Supabase Dashboard → SQL Editor to drop app schema while keeping auth users.
-- Alternative: Settings → General → Reset database (full wipe).

begin;

-- Study-group migration: profile bootstrap on signup
drop trigger if exists on_auth_user_created on auth.users;

-- Drop all public tables (projects/tasks, feed, DMs, XP, etc.)
do $$
declare
  r record;
begin
  for r in
    select tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;
end $$;

-- Drop leftover public functions from prior migrations
do $$
declare
  r record;
begin
  for r in
    select p.proname as name,
           pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('drop function if exists public.%I(%s) cascade', r.name, r.args);
  end loop;
end $$;

commit;
