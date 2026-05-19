import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import {
  collectGarageCalendarEvents,
  collectVaultCalendarEvents,
  eventsForDate,
  eventsInMonth,
  familyEventsToCalendar,
  mergeCalendarEvents,
  parseDateKey,
  SOURCE_STYLES,
  toDateKey,
  type CalendarEvent,
} from "../../lib/calendar-aggregate";
import {
  deleteFamilyCalendarEvent,
  listFamilyCalendarEvents,
  saveFamilyCalendarEvent,
  type FamilyEventCategory,
} from "../../lib/calendar-events-store";
import { isMissingTableError as garageMissing, useVehicles } from "../garage/useVehicles";
import { isMissingTableError as vaultMissing, useVaultDocuments } from "../vault/useVaultDocuments";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const CATEGORY_OPTIONS: { value: FamilyEventCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "meal", label: "Meal" },
  { value: "activity", label: "Activity" },
  { value: "appointment", label: "Appointment" },
];

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function buildMonthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];

  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(toDateKey(new Date(year, month, d)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function DayEventChip({
  event,
  onEdit,
}: {
  event: CalendarEvent;
  onEdit: (ev: CalendarEvent) => void;
}) {
  const label = event.time ? `${event.time} · ${event.title}` : event.title;

  if (event.editable) {
    return (
      <button
        type="button"
        onClick={() => onEdit(event)}
        title={event.title}
        className={`block w-full truncate rounded-md border px-1.5 py-0.5 text-left text-[10px] font-bold leading-snug transition hover:brightness-95 sm:text-[11px] ${SOURCE_STYLES[event.source].chip}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      title={event.title}
      className={`truncate rounded-md border px-1.5 py-0.5 text-[10px] font-bold leading-snug sm:text-[11px] ${SOURCE_STYLES[event.source].chip}`}
    >
      {label}
    </div>
  );
}

export function CalendarRoom() {
  const todayKey = toDateKey(new Date());
  const [viewDate, setViewDate] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [refresh, setRefresh] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(todayKey);
  const [formTime, setFormTime] = useState("");
  const [formCategory, setFormCategory] = useState<FamilyEventCategory>("general");
  const [formNotes, setFormNotes] = useState("");

  const { data: vehicles = [], error: vehicleError } = useVehicles();
  const { data: documents = [], error: vaultError } = useVaultDocuments();

  const garageUnavailable = vehicleError && garageMissing(vehicleError.message);
  const vaultUnavailable = vaultError && vaultMissing(vaultError.message);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthEvents = useMemo(() => {
    void refresh;
    const family = familyEventsToCalendar(listFamilyCalendarEvents());
    const garage = garageUnavailable ? [] : collectGarageCalendarEvents(vehicles);
    const vault = vaultUnavailable ? [] : collectVaultCalendarEvents(documents);
    return eventsInMonth(mergeCalendarEvents(family, garage, vault), year, month);
  }, [refresh, vehicles, documents, garageUnavailable, vaultUnavailable, year, month]);

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const weekCount = grid.length / 7;

  const bump = () => setRefresh((n) => n + 1);

  const goMonth = (delta: number) => {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const goToday = () => {
    const n = new Date();
    setViewDate(new Date(n.getFullYear(), n.getMonth(), 1));
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDate(todayKey);
    setFormTime("");
    setFormCategory("general");
    setFormNotes("");
    setEditingId(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const openCreate = () => {
    setEditingId(null);
    setFormTitle("");
    setFormDate(todayKey);
    setFormTime("");
    setFormCategory("general");
    setFormNotes("");
    setFormOpen(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    if (!ev.familyEventId) return;
    const family = listFamilyCalendarEvents().find((e) => e.id === ev.familyEventId);
    if (!family) return;
    setEditingId(family.id);
    setFormTitle(family.title);
    setFormDate(family.date);
    setFormTime(family.time ?? "");
    setFormCategory(family.category);
    setFormNotes(family.notes ?? "");
    setFormOpen(true);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    saveFamilyCalendarEvent({
      id: editingId ?? undefined,
      title: formTitle.trim(),
      date: formDate,
      time: formTime.trim() || null,
      category: formCategory,
      notes: formNotes.trim() || null,
    });
    bump();
    closeForm();
  };

  const handleDelete = () => {
    if (!editingId) return;
    if (!confirm("Delete this event?")) return;
    deleteFamilyCalendarEvent(editingId);
    bump();
    closeForm();
  };

  return (
    <div className="relative z-10 flex min-h-full w-full flex-col p-12 pb-24">
      <div className="mb-6 flex flex-col gap-6 pr-44 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl border border-white/50 bg-cyan-100 p-4 text-cyan-700 shadow-inner">
            <CalendarDays size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-800">Master Calendar</h1>
            <p className="text-lg font-medium text-slate-500">
              Family events plus dates from Garage and Vault.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-8 py-3.5 font-bold text-white shadow-[0_8px_20px_rgba(8,145,178,0.3)] transition-all hover:bg-cyan-500"
        >
          <Plus size={20} /> Add event
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        {(["family", "garage", "vault"] as const).map((src) => (
          <span
            key={src}
            className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-3 py-1.5 text-sm font-bold text-slate-700"
          >
            <span className={`h-2.5 w-2.5 rounded-full ${SOURCE_STYLES[src].dot}`} />
            {SOURCE_STYLES[src].label}
            {src === "garage" && garageUnavailable && (
              <span className="text-xs font-medium text-slate-400">(unavailable)</span>
            )}
            {src === "vault" && vaultUnavailable && (
              <span className="text-xs font-medium text-slate-400">(unavailable)</span>
            )}
          </span>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-white/60 bg-white/40 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl sm:p-6">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-800">{monthLabel(year, month)}</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              className="rounded-full border border-white/80 bg-white/60 p-2.5 text-slate-700 transition hover:bg-white"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="rounded-full border border-white/80 bg-white/60 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-cyan-600 hover:text-white"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => goMonth(1)}
              className="rounded-full border border-white/80 bg-white/60 p-2.5 text-slate-700 transition hover:bg-white"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="mb-1 grid shrink-0 grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-black uppercase tracking-wider text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        <div
          className="grid min-h-0 flex-1 grid-cols-7 gap-1"
          style={{ gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))` }}
        >
          {grid.map((dateKey, i) => {
            if (!dateKey) {
              return (
                <div
                  key={`empty-${i}`}
                  className="min-h-[72px] rounded-lg border border-transparent bg-slate-100/20"
                />
              );
            }

            const dayEvents = eventsForDate(monthEvents, dateKey);
            const isToday = dateKey === todayKey;
            const dayNum = parseDateKey(dateKey).getDate();

            return (
              <div
                key={dateKey}
                className={`flex min-h-[72px] flex-col overflow-hidden rounded-lg border p-1 sm:p-1.5 ${
                  isToday
                    ? "border-cyan-400 bg-cyan-50/60 ring-1 ring-cyan-300/40"
                    : "border-white/50 bg-white/30"
                }`}
              >
                <span
                  className={`mb-0.5 shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black sm:h-7 sm:w-7 sm:text-sm ${
                    isToday ? "bg-cyan-600 text-white" : "text-slate-800"
                  }`}
                >
                  {dayNum}
                </span>
                <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
                  {dayEvents.map((ev) => (
                    <DayEventChip key={ev.id} event={ev} onEdit={openEdit} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-md"
            onClick={closeForm}
            role="presentation"
          />
          <div className="relative flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[2rem] border border-white bg-white/80 shadow-2xl backdrop-blur-3xl">
            <div className="flex items-center justify-between border-b border-white/50 bg-white/40 px-8 py-6">
              <h2 className="text-2xl font-black text-slate-800">
                {editingId ? "Edit event" : "New event"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full border border-white bg-white/50 p-2 text-slate-600 transition-colors hover:bg-red-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-8">
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                  Title
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  type="text"
                  placeholder="e.g., Dentist appointment"
                  className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                    Date
                  </label>
                  <input
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    type="date"
                    className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                    Time (optional)
                  </label>
                  <input
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    type="text"
                    placeholder="6:30 PM"
                    className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as FamilyEventCategory)}
                  className="w-full rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-bold text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold uppercase tracking-wider text-slate-500">
                  Notes (optional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/80 bg-white/50 px-4 py-3 font-medium text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-4 border-t border-white/50 bg-white/40 p-6">
              {editingId ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100"
                >
                  <Trash2 size={16} /> Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-full border border-white/80 bg-white/60 px-6 py-3 font-bold text-slate-600 transition-colors hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-cyan-600 px-8 py-3 font-bold text-white shadow-[0_8px_20px_rgba(8,145,178,0.3)] transition-all hover:bg-cyan-500"
                >
                  {editingId ? "Save changes" : "Save event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
