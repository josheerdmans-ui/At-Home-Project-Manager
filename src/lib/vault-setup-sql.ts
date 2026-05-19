/** Full vault migration for in-app Copy setup SQL */
export const VAULT_SETUP_SQL = `-- Vault: documents + file storage

begin;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.vault_documents (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null default 'warranty'
    check (doc_type in ('warranty', 'house_document', 'repair_note', 'remodel_note')),
  title text not null,
  category text check (category in ('appliances', 'electronics', 'home_repair', 'vehicles')),
  notes text,
  details text,
  cost numeric(12, 2),
  purchase_date date,
  warranty_expires date,
  project_id text,
  project_title text,
  file_path text not null,
  file_name text not null,
  file_mime text,
  extra_files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vault_documents_doc_type_idx on public.vault_documents (doc_type);
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

create policy "vault_files_public_read" on storage.objects for select using (bucket_id = 'vault-files');
create policy "vault_files_anon_insert" on storage.objects for insert with check (bucket_id = 'vault-files');
create policy "vault_files_anon_update" on storage.objects for update using (bucket_id = 'vault-files');
create policy "vault_files_anon_delete" on storage.objects for delete using (bucket_id = 'vault-files');

commit;
`;

/** Run after base vault table exists (adds doc types columns) */
export const VAULT_TYPES_ALTER_SQL = `-- Vault: add document types (if table already exists)

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
`;
