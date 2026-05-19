-- Image Vault: memory & person photos (reuses vault-files bucket)

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
