-- Card comments for studio discussion

begin;

create table if not exists public.ninja_item_comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.ninja_items (id) on delete cascade,
  actor text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists ninja_item_comments_item_idx
  on public.ninja_item_comments (item_id, created_at);

alter table public.ninja_item_comments enable row level security;

drop policy if exists "ninja_item_comments_anon_all" on public.ninja_item_comments;
create policy "ninja_item_comments_anon_all"
  on public.ninja_item_comments for all using (true) with check (true);

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
      and c.relname = 'ninja_item_comments'
  ) then
    execute 'alter publication supabase_realtime add table public.ninja_item_comments';
  end if;
end $$;

commit;
