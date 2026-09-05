-- Ninja Survivors cards: info field + images (reuses vault-files bucket)

begin;

alter table public.ninja_items
  add column if not exists info text not null default '';

create table if not exists public.ninja_item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.ninja_items (id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_mime text,
  created_at timestamptz not null default now()
);

create index if not exists ninja_item_images_item_idx on public.ninja_item_images (item_id);
create index if not exists ninja_item_images_created_idx on public.ninja_item_images (created_at desc);

alter table public.ninja_item_images enable row level security;

drop policy if exists "ninja_item_images_anon_all" on public.ninja_item_images;
create policy "ninja_item_images_anon_all"
  on public.ninja_item_images for all using (true) with check (true);

commit;
