-- Godot version progress updates on the studio dashboard

begin;

create table if not exists public.ninja_progress_updates (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  body text not null default '',
  created_by text not null,
  created_at timestamptz not null default now()
);

create index if not exists ninja_progress_updates_created_idx
  on public.ninja_progress_updates (created_at desc);

alter table public.ninja_progress_updates enable row level security;

drop policy if exists "ninja_progress_updates_anon_all" on public.ninja_progress_updates;
create policy "ninja_progress_updates_anon_all"
  on public.ninja_progress_updates for all using (true) with check (true);

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
      and c.relname = 'ninja_progress_updates'
  ) then
    execute 'alter publication supabase_realtime add table public.ninja_progress_updates';
  end if;
end $$;

commit;
