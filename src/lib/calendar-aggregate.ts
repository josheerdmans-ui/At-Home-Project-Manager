import type { VaultDocumentRow } from "../../types";
import type { VehicleWithIssues } from "../rooms/garage/types";
import { displayName, getOilChangeInfo } from "../rooms/garage/garage-utils";
import { defaultVaultTitle } from "../rooms/vault/vault-utils";
import type { FamilyCalendarEvent } from "./calendar-events-store";

export type CalendarEventSource = "family" | "garage" | "vault";

export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  time: string | null;
  source: CalendarEventSource;
  kind: string;
  editable: boolean;
  familyEventId?: string;
};

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

function pushIfDate(
  out: CalendarEvent[],
  date: string | null | undefined,
  event: Omit<CalendarEvent, "date">,
) {
  if (!date) return;
  const key = date.slice(0, 10);
  out.push({ ...event, date: key });
}

export function collectGarageCalendarEvents(vehicles: VehicleWithIssues[]): CalendarEvent[] {
  const out: CalendarEvent[] = [];

  for (const v of vehicles) {
    const name = displayName(v);

    pushIfDate(out, v.registration_expires, {
      id: `${v.id}-registration`,
      title: `${name} — registration expires`,
      time: null,
      source: "garage",
      kind: "registration",
      editable: false,
    });

    pushIfDate(out, v.insurance_expires, {
      id: `${v.id}-insurance`,
      title: `${name} — insurance expires`,
      time: null,
      source: "garage",
      kind: "insurance",
      editable: false,
    });

    const oil = getOilChangeInfo(v);
    if (oil.dueDate) {
      pushIfDate(out, toDateKey(oil.dueDate), {
        id: `${v.id}-oil`,
        title: `${name} — oil change due`,
        time: null,
        source: "garage",
        kind: "oil_change",
        editable: false,
      });
    }
  }

  return out;
}

export function collectVaultCalendarEvents(documents: VaultDocumentRow[]): CalendarEvent[] {
  const out: CalendarEvent[] = [];

  for (const doc of documents) {
    if (doc.doc_type !== "warranty" || !doc.warranty_expires) continue;
    pushIfDate(out, doc.warranty_expires, {
      id: `${doc.id}-warranty`,
      title: `${defaultVaultTitle(doc.doc_type, doc.title)} — warranty expires`,
      time: null,
      source: "vault",
      kind: "warranty",
      editable: false,
    });
  }

  return out;
}

export function familyEventsToCalendar(events: FamilyCalendarEvent[]): CalendarEvent[] {
  return events.map((e) => ({
    id: `family-${e.id}`,
    date: e.date,
    title: e.title,
    time: e.time,
    source: "family" as const,
    kind: e.category,
    editable: true,
    familyEventId: e.id,
  }));
}

export function mergeCalendarEvents(...groups: CalendarEvent[][]): CalendarEvent[] {
  const byId = new Map<string, CalendarEvent>();
  for (const group of groups) {
    for (const ev of group) {
      byId.set(ev.id, ev);
    }
  }
  return [...byId.values()].sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}

export function eventsForDate(events: CalendarEvent[], dateKey: string): CalendarEvent[] {
  return events.filter((e) => e.date === dateKey);
}

export function eventsInMonth(events: CalendarEvent[], year: number, month: number): CalendarEvent[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return events.filter((e) => e.date.startsWith(prefix));
}

export function countByDate(events: CalendarEvent[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of events) {
    map.set(e.date, (map.get(e.date) ?? 0) + 1);
  }
  return map;
}

export const SOURCE_STYLES: Record<
  CalendarEventSource,
  { dot: string; chip: string; label: string }
> = {
  family: {
    dot: "bg-cyan-500",
    chip: "border-cyan-200/80 bg-cyan-50/90 text-cyan-900",
    label: "Family",
  },
  garage: {
    dot: "bg-indigo-500",
    chip: "border-indigo-200/80 bg-indigo-50/90 text-indigo-900",
    label: "Garage",
  },
  vault: {
    dot: "bg-amber-500",
    chip: "border-amber-200/80 bg-amber-50/90 text-amber-900",
    label: "Vault",
  },
};
