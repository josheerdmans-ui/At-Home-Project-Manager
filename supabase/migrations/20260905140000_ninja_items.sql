-- Ninja Survivors project board (open RLS — hub login is the gate)

begin;

create table public.ninja_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  details text not null default '',
  stage text not null default 'idea'
    check (stage in ('idea', 'confirmed', 'implemented', 'testing')),
  owner text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ninja_items_stage_idx on public.ninja_items (stage);
create index ninja_items_updated_idx on public.ninja_items (updated_at desc);

create trigger ninja_items_set_updated_at
  before update on public.ninja_items
  for each row execute function public.set_updated_at();

alter table public.ninja_items enable row level security;

create policy "ninja_items_anon_all"
  on public.ninja_items for all using (true) with check (true);

commit;
