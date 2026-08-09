import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Images,
  LayoutGrid,
  ListChecks,
  Plus,
  X,
} from "lucide-react";
import type { HouseholdMemberRow } from "../../types";
import {
  eventsForDate,
  familyEventsToCalendar,
  mergeCalendarEvents,
  toDateKey,
  type CalendarEvent,
} from "../lib/calendar-aggregate";
import { chipClassFromToken, colorStyle } from "../lib/member-colors";
import { useHouseholdMembers } from "../hooks/useHouseholdMembers";
import {
  buildCalendarDays,
  formatTimeForDisplay,
  isSameDate,
  MONTHS,
  WEEKDAYS,
} from "../rooms/calendar/calendar-ui";
import {
  useFamilyCalendarEvents,
  useFamilyCalendarEventsMutations,
} from "../rooms/calendar/useFamilyCalendarEvents";
import type { FamilyEventKind } from "../lib/calendar-events-store";
import { EVENT_COLORS } from "../rooms/calendar/calendar-ui";
import { WallFrameMode } from "./WallFrameMode";
import { WallRoutinesMode } from "./WallRoutinesMode";

export type WallMode = "calendar" | "frame" | "routines" | "hub";

type HubRoomOption = {
  id: string;
  label: string;
};

type WallDisplayShellProps = {
  onExit: () => void;
  onOpenRoom: (roomId: string) => void;
  rooms: HubRoomOption[];
};

function useNowClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function WallEventChip({ event }: { event: CalendarEvent }) {
  const fromMember =
    event.memberColorTokens?.[0] != null
      ? chipClassFromToken(event.memberColorTokens[0])
      : event.colorClass;
  return (
    <div
      className={`truncate rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-tight sm:text-xs ${fromMember}`}
      title={event.title}
    >
      {event.title}
    </div>
  );
}

function AgendaList({
  events,
  members,
  emptyLabel,
}: {
  events: CalendarEvent[];
  members: HouseholdMemberRow[];
  emptyLabel: string;
}) {
  const nameById = useMemo(() => {
    const m = new Map(members.map((x) => [x.id, x.display_name]));
    return m;
  }, [members]);

  if (events.length === 0) {
    return <p className="text-lg text-slate-500 sm:text-xl">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((ev) => {
        const tokens = ev.memberColorTokens ?? [];
        const names = (ev.memberIds ?? [])
          .map((id) => nameById.get(id))
          .filter(Boolean)
          .join(", ");
        return (
          <li
            key={ev.id}
            className="flex gap-4 rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-md"
          >
            <div className="w-24 shrink-0 text-lg font-bold tabular-nums text-slate-600 sm:text-xl">
              {formatTimeForDisplay(ev.time)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-slate-800 sm:text-2xl">{ev.title}</p>
              {names && <p className="mt-0.5 text-base text-slate-500">{names}</p>}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tokens.map((token, i) => (
                  <span key={`${ev.id}-${token}-${i}`} className={`h-3 w-3 rounded-full ${colorStyle(token).solid}`} />
                ))}
                {tokens.length === 0 && (
                  <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${ev.colorClass}`}>
                    {ev.source === "family" ? "Family" : ev.source}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function WallCalendarMode({ members }: { members: HouseholdMemberRow[] }) {
  const now = useNowClock(60_000);
  const [currentDate, setCurrentDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [kind, setKind] = useState<FamilyEventKind>("regular");
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const { data: familyEvents = [], isLoading, error } = useFamilyCalendarEvents();
  const mut = useFamilyCalendarEventsMutations();

  const memberColorById = useMemo(() => {
    const m = new Map<string, string>();
    for (const member of members) m.set(member.id, member.color_token);
    return m;
  }, [members]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);
  const selectedKey = toDateKey(selectedDate);

  const allEvents = useMemo(
    () => mergeCalendarEvents(familyEventsToCalendar(familyEvents, memberColorById)),
    [familyEvents, memberColorById],
  );

  const dayEvents = eventsForDate(allEvents, selectedKey);

  const saveQuick = () => {
    if (!title.trim()) return;
    const firstMember = members.find((m) => memberIds.includes(m.id));
    const colorClass = firstMember
      ? chipClassFromToken(firstMember.color_token)
      : EVENT_COLORS[2]!.value;
    mut.saveEvent.mutate(
      {
        title: title.trim(),
        date: selectedKey,
        time: time.trim() || null,
        eventKind: kind,
        colorClass,
        memberIds,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setTitle("");
          setTime("");
          setMemberIds([]);
          setKind("regular");
        },
      },
    );
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/55 shadow-[0_12px_40px_rgb(0,0,0,0.08)] backdrop-blur-2xl">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/60 px-4 py-3 sm:px-6">
          <h2 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl md:text-4xl">
            {MONTHS[month]} <span className="font-semibold text-slate-400">{year}</span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="rounded-2xl border border-white bg-white/80 p-3 text-slate-700 shadow-sm"
              aria-label="Previous month"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                setCurrentDate(new Date(t.getFullYear(), t.getMonth(), 1));
                setSelectedDate(t);
              }}
              className="rounded-2xl border border-white bg-white/80 px-4 py-3 text-base font-bold text-slate-700 shadow-sm"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="rounded-2xl border border-white bg-white/80 p-3 text-slate-700 shadow-sm"
              aria-label="Next month"
            >
              <ChevronRight size={28} />
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-3 text-base font-bold text-white shadow-md hover:bg-orange-600"
            >
              <Plus size={22} />
              Add
            </button>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-7 border-b border-slate-100/80 bg-slate-50/40">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-bold tracking-wider text-slate-500 sm:text-sm">
              {d}
            </div>
          ))}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 gap-px bg-slate-200/60">
          {days.map((cell, i) => {
            const cellEvents = eventsForDate(allEvents, cell.dateKey);
            const selected = isSameDate(cell.date, selectedDate);
            const isToday = isSameDate(cell.date, now);
            return (
              <button
                key={`${cell.dateKey}-${i}`}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                className={`flex min-h-0 flex-col overflow-hidden p-1 text-left transition sm:p-1.5 ${
                  selected ? "bg-sky-50/90 ring-2 ring-inset ring-sky-400" : "bg-white/80 hover:bg-white"
                } ${!cell.isCurrentMonth ? "opacity-45" : ""}`}
              >
                <span
                  className={`mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold sm:h-9 sm:w-9 sm:text-base ${
                    isToday ? "bg-slate-800 text-white" : "text-slate-700"
                  }`}
                >
                  {cell.day}
                </span>
                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                  {cellEvents.slice(0, 3).map((ev) => (
                    <WallEventChip key={ev.id} event={ev} />
                  ))}
                  {cellEvents.length > 3 && (
                    <span className="text-[10px] font-semibold text-slate-500">+{cellEvents.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/55 p-4 shadow-[0_12px_40px_rgb(0,0,0,0.08)] backdrop-blur-2xl lg:w-[min(28rem,34vw)]">
        <h3 className="mb-3 text-2xl font-black text-slate-800 sm:text-3xl">
          {selectedDate.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h3>
        {isLoading && <p className="text-slate-500">Loading schedule…</p>}
        {error && <p className="text-rose-700">{error.message}</p>}
        {!isLoading && !error && (
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <AgendaList
              events={dayEvents}
              members={members}
              emptyLabel="Nothing scheduled. Tap Add to create an event."
            />
          </div>
        )}
        {members.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/70 pt-3">
            {members.map((m) => (
              <span
                key={m.id}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${chipClassFromToken(m.color_token)}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${colorStyle(m.color_token).solid}`} />
                {m.display_name}
              </span>
            ))}
          </div>
        )}
      </aside>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white bg-white/95 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-xl font-bold text-slate-800">New event</h4>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-lg outline-none focus:border-orange-400"
              />
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as FamilyEventKind)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-lg"
              >
                <option value="regular">Regular</option>
                <option value="important">Important</option>
                <option value="birthday">Birthday</option>
                <option value="school">School</option>
              </select>
              {members.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {members.map((m) => {
                    const on = memberIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setMemberIds((prev) => (on ? prev.filter((id) => id !== m.id) : [...prev, m.id]))
                        }
                        className={`rounded-full border px-3 py-1.5 font-semibold ${
                          on ? `${chipClassFromToken(m.color_token)} ring-2 ring-slate-400` : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {m.display_name}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={saveQuick}
                disabled={!title.trim() || mut.saveEvent.isPending}
                className="rounded-xl bg-orange-500 py-3 text-lg font-bold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function WallDisplayShell({ onExit, onOpenRoom, rooms }: WallDisplayShellProps) {
  const now = useNowClock();
  const [mode, setMode] = useState<WallMode>("calendar");
  const { data: members = [] } = useHouseholdMembers();

  const clock = now.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const tabs: { id: WallMode; label: string; icon: typeof CalendarDays }[] = [
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "frame", label: "Frame", icon: Images },
    { id: "routines", label: "Routines", icon: ListChecks },
    { id: "hub", label: "Rooms", icon: LayoutGrid },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-sky-50 text-slate-800">
      <div className="pointer-events-none absolute -left-[10%] -top-[15%] h-[45vw] w-[45vw] rounded-full bg-cyan-300/25 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-[10%] -right-[10%] h-[40vw] w-[40vw] rounded-full bg-orange-200/30 blur-[100px]" />

      <header className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/60 bg-white/40 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div>
          <p className="text-3xl font-black tabular-nums tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
            {clock}
          </p>
          <p className="text-base font-semibold text-slate-500 sm:text-lg">{dateLabel}</p>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMode(tab.id)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-base font-bold transition sm:text-lg ${
                  active
                    ? "border-orange-300 bg-orange-500 text-white shadow-md"
                    : "border-white/80 bg-white/70 text-slate-700 hover:bg-white"
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onExit}
            className="rounded-2xl border border-white/80 bg-white/80 px-4 py-2.5 text-base font-bold text-slate-700 shadow-sm hover:bg-slate-100"
          >
            Exit wall
          </button>
        </nav>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col p-3 sm:p-4 md:p-5">
        {mode === "calendar" && <WallCalendarMode members={members} />}
        {mode === "frame" && <WallFrameMode />}
        {mode === "routines" && <WallRoutinesMode />}
        {mode === "hub" && (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 overflow-auto py-4">
            <h2 className="text-3xl font-black text-slate-800">Family rooms</h2>
            <p className="text-lg text-slate-500">Open a room, then return to the wall from the hub home.</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => {
                    onExit();
                    onOpenRoom(room.id);
                  }}
                  className="rounded-3xl border border-white/70 bg-white/60 px-4 py-6 text-left text-lg font-bold text-slate-800 shadow-md backdrop-blur-xl transition hover:bg-white hover:shadow-lg"
                >
                  {room.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
