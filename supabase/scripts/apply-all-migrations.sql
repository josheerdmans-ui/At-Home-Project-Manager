-- Run once in Supabase → SQL Editor on a FRESH project (or after reset-public-schema.sql).
-- If you already have vehicles / vault tables, do NOT run this whole file — you will get
-- "relation already exists". Use apply-incremental-house-projects-calendar.sql instead.
-- Order: garage → vault → vault types → image vault → house projects & calendar

-- ========== 20260515160000_garage_vehicles.sql ==========
begin;

create extension if not exists "pgcrypto";

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  nickname text,
  year int not null,
  make text not null,
  model text not null,
  color text,
  vin text,
  license_plate text,
  current_mileage int,
  mpg_avg numeric(5, 2),
  last_oil_change_date date,
  last_oil_change_mileage int,
  tires_installed_date date,
  registration_expires date,
  insurance_expires date,
  photo_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicle_issues (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  description text not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'fixed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicle_issues_vehicle_id_idx on public.vehicle_issues (vehicle_id);
create index vehicle_issues_status_idx on public.vehicle_issues (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_set_updated_at
  before update on public.vehicles
  for each row execute function public.set_updated_at();

create trigger vehicle_issues_set_updated_at
  before update on public.vehicle_issues
  for each row execute function public.set_updated_at();

alter table public.vehicles enable row level security;
alter table public.vehicle_issues enable row level security;

create policy "vehicles_anon_all" on public.vehicles for all using (true) with check (true);
create policy "vehicle_issues_anon_all" on public.vehicle_issues for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

create policy "vehicle_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'vehicle-photos');

create policy "vehicle_photos_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'vehicle-photos');

create policy "vehicle_photos_anon_update"
  on storage.objects for update
  using (bucket_id = 'vehicle-photos');

create policy "vehicle_photos_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'vehicle-photos');

commit;

-- ========== 20260516120000_vault_documents.sql ==========
begin;

create table public.vault_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('appliances', 'electronics', 'home_repair', 'vehicles')),
  notes text,
  purchase_date date,
  warranty_expires date,
  file_path text not null,
  file_name text not null,
  file_mime text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vault_documents_category_idx on public.vault_documents (category);
create index vault_documents_title_idx on public.vault_documents (title);

create trigger vault_documents_set_updated_at
  before update on public.vault_documents
  for each row execute function public.set_updated_at();

alter table public.vault_documents enable row level security;

create policy "vault_documents_anon_all" on public.vault_documents for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('vault-files', 'vault-files', true)
on conflict (id) do nothing;

create policy "vault_files_public_read"
  on storage.objects for select
  using (bucket_id = 'vault-files');

create policy "vault_files_anon_insert"
  on storage.objects for insert
  with check (bucket_id = 'vault-files');

create policy "vault_files_anon_update"
  on storage.objects for update
  using (bucket_id = 'vault-files');

create policy "vault_files_anon_delete"
  on storage.objects for delete
  using (bucket_id = 'vault-files');

commit;

-- ========== 20260517140000_vault_document_types.sql ==========
begin;

alter table public.vault_documents
  add column if not exists doc_type text not null default 'warranty'
    check (doc_type in ('warranty', 'house_document', 'repair_note', 'remodel_note')),
  add column if not exists details text,
  add column if not exists cost numeric(12, 2),
  add column if not exists project_id text,
  add column if not exists project_title text,
  add column if not exists extra_files jsonb not null default '[]'::jsonb;

alter table public.vault_documents alter column category drop not null;

create index if not exists vault_documents_doc_type_idx on public.vault_documents (doc_type);

commit;

-- ========== 20260518120000_image_vault.sql ==========
begin;

create table public.image_vault_photos (
  id uuid primary key default gen_random_uuid(),
  photo_kind text not null check (photo_kind in ('memory', 'person')),
  file_path text not null,
  file_name text not null,
  file_mime text,
  notes text,
  created_at timestamptz not null default now()
);

create index image_vault_photos_kind_idx on public.image_vault_photos (photo_kind);
create index image_vault_photos_created_idx on public.image_vault_photos (created_at desc);

alter table public.image_vault_photos enable row level security;

create policy "image_vault_photos_anon_all"
  on public.image_vault_photos for all using (true) with check (true);

commit;

-- ========== 20260519120000_house_projects_and_calendar.sql ==========
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

create table public.family_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  event_time text,
  category text not null default 'general'
    check (category in ('general', 'meal', 'activity', 'appointment')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index family_calendar_events_date_idx on public.family_calendar_events (event_date);
create index family_calendar_events_updated_idx on public.family_calendar_events (updated_at desc);

create trigger family_calendar_events_set_updated_at
  before update on public.family_calendar_events
  for each row execute function public.set_updated_at();

alter table public.family_calendar_events enable row level security;

create policy "family_calendar_events_anon_all"
  on public.family_calendar_events for all using (true) with check (true);

commit;
