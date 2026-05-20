/** House projects table for in-app Copy setup SQL */
export const HOUSE_PROJECTS_SETUP_SQL = `-- House projects

begin;

create table public.house_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text not null check (kind in ('repair', 'remodel', 'general')),
  details text not null default '',
  cost numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index house_projects_kind_idx on public.house_projects (kind);
create index house_projects_updated_idx on public.house_projects (updated_at desc);

create trigger house_projects_set_updated_at
  before update on public.house_projects
  for each row execute function public.set_updated_at();

alter table public.house_projects enable row level security;

create policy "house_projects_anon_all"
  on public.house_projects for all using (true) with check (true);

commit;
`;
