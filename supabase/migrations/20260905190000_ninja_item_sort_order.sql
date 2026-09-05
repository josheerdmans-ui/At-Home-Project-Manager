-- Persist kanban card order within each area + stage

begin;

alter table public.ninja_items
  add column if not exists sort_order int not null default 0;

with ranked as (
  select
    id,
    row_number() over (partition by area, stage order by created_at) - 1 as rn
  from public.ninja_items
)
update public.ninja_items as items
set sort_order = ranked.rn
from ranked
where items.id = ranked.id;

create index if not exists ninja_items_board_order_idx
  on public.ninja_items (area, stage, sort_order);

commit;
