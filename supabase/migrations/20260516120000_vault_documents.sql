-- Vault: documents + file storage (open RLS — hub login is the gate)

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
