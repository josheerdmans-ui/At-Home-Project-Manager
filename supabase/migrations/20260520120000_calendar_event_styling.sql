-- Calendar event display kind + chip color

begin;

alter table public.family_calendar_events
  add column if not exists event_kind text not null default 'regular'
    check (event_kind in ('regular', 'important', 'birthday', 'school'));

alter table public.family_calendar_events
  add column if not exists color_class text not null default 'bg-cyan-100 text-cyan-700';

commit;
