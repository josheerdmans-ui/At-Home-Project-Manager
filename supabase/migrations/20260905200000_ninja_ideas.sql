-- Quick ideas on the studio dashboard, with one vote per person

begin;

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
end $$;

commit;
