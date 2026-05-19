/** Family calendar events (local until Supabase calendar table exists). */

export type FamilyEventCategory = "general" | "meal" | "activity" | "appointment";

export type FamilyCalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string | null;
  category: FamilyEventCategory;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "eerdmans_calendar_events";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function seedIfEmpty(): FamilyCalendarEvent[] {
  const today = new Date();
  const todayKey = toDateKey(today);
  const now = new Date().toISOString();
  return [
    {
      id: "seed-dinner",
      title: "Dinner (Tacos)",
      date: todayKey,
      time: "6:30 PM",
      category: "meal",
      notes: null,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "seed-movie",
      title: "Family Movie",
      date: todayKey,
      time: "8:00 PM",
      category: "activity",
      notes: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

function readAll(): FamilyCalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = seedIfEmpty();
      writeAll(seed);
      return seed;
    }
    const parsed = JSON.parse(raw) as FamilyCalendarEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(events: FamilyCalendarEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function listFamilyCalendarEvents(): FamilyCalendarEvent[] {
  return readAll().sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}

export function listFamilyEventsForDate(dateKey: string): FamilyCalendarEvent[] {
  return readAll().filter((e) => e.date === dateKey);
}

export function saveFamilyCalendarEvent(
  input: Omit<FamilyCalendarEvent, "id" | "createdAt" | "updatedAt"> & { id?: string },
): FamilyCalendarEvent {
  const now = new Date().toISOString();
  const all = readAll();

  if (input.id) {
    const idx = all.findIndex((e) => e.id === input.id);
    const existing = idx >= 0 ? all[idx]! : null;
    const updated: FamilyCalendarEvent = {
      id: input.id,
      title: input.title,
      date: input.date,
      time: input.time,
      category: input.category,
      notes: input.notes,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (idx >= 0) all[idx] = updated;
    else all.push(updated);
    writeAll(all);
    return updated;
  }

  const created: FamilyCalendarEvent = {
    id: crypto.randomUUID(),
    title: input.title,
    date: input.date,
    time: input.time,
    category: input.category,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  all.push(created);
  writeAll(all);
  return created;
}

export function deleteFamilyCalendarEvent(id: string) {
  writeAll(readAll().filter((e) => e.id !== id));
}
