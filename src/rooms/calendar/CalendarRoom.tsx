import { useMemo, useState, type FormEvent } from "react";
import {
  Calendar as CalendarIcon,
  Cake,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  collectGarageCalendarEvents,
  collectVaultCalendarEvents,
  eventsForDate,
  familyEventsToCalendar,
  mergeCalendarEvents,
  type CalendarEvent,
} from "../../lib/calendar-aggregate";
import type { FamilyEventKind } from "../../lib/calendar-events-store";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { CALENDAR_SETUP_SQL } from "../../lib/calendar-setup-sql";
import { isMissingTableError as garageMissing, useVehicles } from "../garage/useVehicles";
import { isMissingTableError as vaultMissing, useVaultDocuments } from "../vault/useVaultDocuments";
import {
  buildCalendarDays,
  EVENT_COLORS,
  formatDateKey,
  formatTimeForDisplay,
  isSameDate,
  MONTHS,
  timeInputFromStored,
  WEEKDAYS,
} from "./calendar-ui";
import {
  isMissingFamilyCalendarTableError,
  useFamilyCalendarEvents,
  useFamilyCalendarEventsMutations,
} from "./useFamilyCalendarEvents";
import { useHouseholdMembers } from "../../hooks/useHouseholdMembers";
import { chipClassFromToken } from "../../lib/member-colors";

const DEFAULT_COLOR = EVENT_COLORS[0]!.value;

type CalendarRoomProps = {
  onGoBack?: () => void;
};

function GoBackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 p-2 font-medium text-slate-600 transition-all hover:bg-slate-200 md:gap-2 md:px-3 md:py-2"
    >
      <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
      <span className="hidden text-sm font-semibold sm:inline">Go Back</span>
    </button>
  );
}

function DayEventChip({
  event,
  onEdit,
}: {
  event: CalendarEvent;
  onEdit: (ev: CalendarEvent) => void;
}) {
  const fromMembers =
    event.memberColorTokens?.[0] != null
      ? `${chipClassFromToken(event.memberColorTokens[0])} border`
      : null;
  const chipClass = fromMembers ?? `${event.colorClass} border border-white/50`;
  const tip = `${formatTimeForDisplay(event.time)} - ${event.title}`;

  if (event.editable) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit(event);
        }}
        title={tip}
        className={`shrink truncate rounded px-1 py-0.5 text-left text-[9px] font-medium leading-tight transition hover:brightness-95 sm:px-1.5 sm:py-1 sm:text-[10px] ${chipClass}`}
      >
        {event.title}
      </button>
    );
  }

  return (
    <div title={tip} className={`shrink truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight sm:px-1.5 sm:py-1 sm:text-[10px] ${chipClass}`}>
      {event.title}
    </div>
  );
}

export function CalendarRoom({ onGoBack }: CalendarRoomProps) {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEventForm, setNewEventForm] = useState<{
    title: string;
    date: string;
    time: string;
    type: FamilyEventKind;
    color: string;
    memberIds: string[];
  }>({
    title: "",
    date: formatDateKey(new Date()),
    time: "",
    type: "regular",
    color: DEFAULT_COLOR,
    memberIds: [],
  });

  const { data: familyEvents = [], error: familyError } = useFamilyCalendarEvents();
  const familyMut = useFamilyCalendarEventsMutations();
  const { data: householdMembers = [] } = useHouseholdMembers();
  const { data: vehicles = [], error: vehicleError } = useVehicles();
  const { data: documents = [], error: vaultError } = useVaultDocuments();

  const garageUnavailable = vehicleError && garageMissing(vehicleError.message);
  const vaultUnavailable = vaultError && vaultMissing(vaultError.message);

  const memberColorById = useMemo(() => {
    const m = new Map<string, string>();
    for (const member of householdMembers) {
      m.set(member.id, member.color_token);
    }
    return m;
  }, [householdMembers]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const allEvents = useMemo(() => {
    const family = familyEventsToCalendar(familyEvents, memberColorById);
    const garage = garageUnavailable ? [] : collectGarageCalendarEvents(vehicles);
    const vault = vaultUnavailable ? [] : collectVaultCalendarEvents(documents);
    return mergeCalendarEvents(family, garage, vault);
  }, [familyEvents, vehicles, documents, garageUnavailable, vaultUnavailable, memberColorById]);

  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  const resetForm = (date: Date) => {
    setNewEventForm({
      title: "",
      date: formatDateKey(date),
      time: "",
      type: "regular",
      color: DEFAULT_COLOR,
      memberIds: [],
    });
    setEditingId(null);
  };

  const handleOpenAddEvent = (dateToPreFill = selectedDate) => {
    resetForm(dateToPreFill);
    setIsModalOpen(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    if (!ev.familyEventId) return;
    const family = familyEvents.find((e) => e.id === ev.familyEventId);
    if (!family) return;
    setEditingId(family.id);
    setNewEventForm({
      title: family.title,
      date: family.date,
      time: timeInputFromStored(family.time),
      type: family.eventKind,
      color: family.colorClass,
      memberIds: family.memberIds ?? [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSaveEvent = (e: FormEvent) => {
    e.preventDefault();
    if (!newEventForm.title.trim()) return;

    familyMut.saveEvent.mutate(
      {
        id: editingId ?? undefined,
        title: newEventForm.title.trim(),
        date: newEventForm.date,
        time: newEventForm.time.trim() || null,
        eventKind: newEventForm.type,
        colorClass: newEventForm.color,
        memberIds: newEventForm.memberIds,
      },
      { onSuccess: closeModal },
    );
  };

  const handleDelete = () => {
    if (!editingId) return;
    if (!confirm("Delete this event?")) return;
    familyMut.deleteEvent.mutate(editingId, { onSuccess: closeModal });
  };

  if (familyError && isMissingFamilyCalendarTableError(familyError.message)) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden p-2 sm:p-4">
        {onGoBack && (
          <div className="mb-3 shrink-0">
            <GoBackButton onClick={onGoBack} />
          </div>
        )}
        <div className="flex flex-1 items-center justify-center">
          <DbSetupPanel title="Calendar database setup" sql={CALENDAR_SETUP_SQL} />
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-room relative z-10 flex h-full min-h-0 w-full flex-col overflow-hidden p-1 sm:p-2">
      <div className="calendar-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white bg-white/90 shadow-xl backdrop-blur-md sm:rounded-[2rem]">
        {/* Calendar Header */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-2 py-2 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex min-w-0 shrink items-center gap-1.5 sm:gap-2">
            {onGoBack && <GoBackButton onClick={onGoBack} />}
            <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-800 sm:text-2xl md:text-3xl">
              {MONTHS[month]}{" "}
              <span className="font-medium text-slate-400">{year}</span>
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="rounded-full p-1.5 text-slate-500 transition-all hover:bg-white hover:shadow-sm md:p-2"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-slate-600 transition-all hover:bg-white hover:shadow-sm md:gap-2 md:px-4 md:py-1.5 md:text-sm"
              >
                <CalendarIcon className="hidden h-3.5 w-3.5 sm:block md:h-4 md:w-4" />
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="rounded-full p-1.5 text-slate-500 transition-all hover:bg-white hover:shadow-sm md:p-2"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddEvent()}
              className="flex items-center gap-1.5 rounded-full bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-cyan-600/20 transition-all hover:bg-cyan-700 md:gap-2 md:px-5 md:py-2.5 md:text-base"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Add Event</span>
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid shrink-0 grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-1 text-center text-[10px] font-bold tracking-wider text-slate-400 sm:py-1.5 sm:text-xs"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid min-h-0 flex-1 gap-px overflow-hidden border-b border-slate-100 bg-slate-100">
          {calendarDays.map((item, index) => {
            const dayEvents = eventsForDate(allEvents, item.dateKey);
            const isSelected = isSameDate(item.date, selectedDate);
            const isTodayDate = isSameDate(item.date, today);
            const hasImportantEvent = dayEvents.some((ev) => ev.isImportant);
            const hasBirthday = dayEvents.some((ev) => ev.eventKind === "birthday");
            const hasSchoolEvent = dayEvents.some((ev) => ev.eventKind === "school");

            let bgColorClass = "bg-white hover:bg-slate-50";
            if (isSelected) {
              bgColorClass = "bg-cyan-50/30";
            } else if (!item.isCurrentMonth) {
              bgColorClass = "bg-slate-50/50";
            } else if (hasImportantEvent) {
              bgColorClass = "bg-rose-50 hover:bg-rose-100/60";
            } else if (hasSchoolEvent) {
              bgColorClass = "bg-green-50 hover:bg-green-100/60";
            }

            return (
              <div
                key={`${item.dateKey}-${index}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDate(item.date)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDate(item.date);
                  }
                }}
                className={`calendar-day-cell group relative flex min-h-0 cursor-pointer flex-col p-0.5 transition-colors sm:p-1 ${bgColorClass} ${
                  !item.isCurrentMonth ? "text-slate-300" : "text-slate-700"
                }`}
              >
                <div className="flex shrink-0 items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold sm:h-6 sm:w-6 sm:text-xs md:h-7 md:w-7 md:text-sm ${
                        isSelected ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/30" : ""
                      } ${
                        isTodayDate && !isSelected
                          ? "border border-cyan-200 bg-cyan-50 text-cyan-600"
                          : ""
                      } ${!item.isCurrentMonth && !isSelected ? "font-normal text-slate-300" : ""}`}
                    >
                      {item.day}
                    </span>
                    {hasBirthday && <Cake className="h-3 w-3 shrink-0 text-pink-500 sm:h-3.5 sm:w-3.5" />}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(item.date);
                      handleOpenAddEvent(item.date);
                    }}
                    className="p-1 text-slate-300 opacity-0 transition-opacity hover:text-cyan-600 group-hover:opacity-100"
                    aria-label="Add event on this day"
                  >
                    <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>

                <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-px overflow-hidden sm:mt-1 sm:gap-0.5">
                  {dayEvents.map((event) => (
                    <DayEventChip key={event.id} event={event} onEdit={openEdit} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Event" : "Add New Event"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="flex flex-col gap-5 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Event Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g., Dentist Appointment"
                  value={newEventForm.title}
                  onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">Date</label>
                  <input
                    type="date"
                    required
                    value={newEventForm.date}
                    onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">Time</label>
                  <input
                    type="time"
                    value={newEventForm.time}
                    onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Event Type</label>
                <select
                  value={newEventForm.type}
                  onChange={(e) =>
                    setNewEventForm({ ...newEventForm, type: e.target.value as FamilyEventKind })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
                >
                  <option value="regular">Regular Event</option>
                  <option value="important">Important (Red Highlight)</option>
                  <option value="birthday">Birthday (Cake Icon)</option>
                  <option value="school">School Event (Green Highlight)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-600">Label Color</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewEventForm({ ...newEventForm, color: color.value })}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${color.value.split(" ")[0]} ${
                        newEventForm.color === color.value
                          ? "scale-110 border-slate-800 shadow-md"
                          : "border-transparent hover:scale-105"
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {householdMembers.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">People</label>
                  <div className="flex flex-wrap gap-2">
                    {householdMembers.map((m) => {
                      const selected = newEventForm.memberIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setNewEventForm((prev) => ({
                              ...prev,
                              memberIds: selected
                                ? prev.memberIds.filter((id) => id !== m.id)
                                : [...prev.memberIds, m.id],
                            }));
                          }}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                            selected
                              ? `${chipClassFromToken(m.color_token)} ring-2 ring-slate-400`
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                          }`}
                        >
                          {m.display_name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Event
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-cyan-600 py-3 font-bold text-white shadow-md shadow-cyan-600/20 transition-all hover:bg-cyan-700"
                >
                  {editingId ? "Save Changes" : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
