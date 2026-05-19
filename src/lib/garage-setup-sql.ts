/** Full garage migration for in-app Copy setup SQL (keep in sync with supabase/migrations/20260515160000_garage_vehicles.sql) */
export const GARAGE_SETUP_SQL = `-- Garage: vehicles, issues, photo storage

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
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_set_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();

create trigger vehicle_issues_set_updated_at before update on public.vehicle_issues
  for each row execute function public.set_updated_at();

alter table public.vehicles enable row level security;
alter table public.vehicle_issues enable row level security;

create policy "vehicles_anon_all" on public.vehicles for all using (true) with check (true);
create policy "vehicle_issues_anon_all" on public.vehicle_issues for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

create policy "vehicle_photos_public_read" on storage.objects for select using (bucket_id = 'vehicle-photos');
create policy "vehicle_photos_anon_insert" on storage.objects for insert with check (bucket_id = 'vehicle-photos');
create policy "vehicle_photos_anon_update" on storage.objects for update using (bucket_id = 'vehicle-photos');
create policy "vehicle_photos_anon_delete" on storage.objects for delete using (bucket_id = 'vehicle-photos');

commit;
`;
