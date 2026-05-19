-- Vault: document types (warranty, house document, repair/remodel notes)

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
