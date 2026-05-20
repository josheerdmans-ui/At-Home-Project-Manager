import { supabase } from "./supabase";
import type { FamilyCalendarEvent, FamilyEventCategory } from "./calendar-events-store";
import type { HouseProject } from "./house-projects-store";

const HOUSE_PROJECTS_KEY = "eerdmans_house_projects";
const CALENDAR_EVENTS_KEY = "eerdmans_calendar_events";
const MIGRATED_HOUSE_KEY = "eerdmans_migrated_house_projects";
const MIGRATED_CALENDAR_KEY = "eerdmans_migrated_calendar_events";

function readJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function migrateHouseProjectsFromLocalStorage(): Promise<void> {
  if (localStorage.getItem(MIGRATED_HOUSE_KEY) === "1") return;

  const local = readJson<HouseProject>(HOUSE_PROJECTS_KEY);
  if (local.length === 0) {
    localStorage.setItem(MIGRATED_HOUSE_KEY, "1");
    return;
  }

  const rows = local.map((p) => ({
    id: p.id,
    title: p.title,
    kind: p.kind,
    details: p.details,
    cost: p.cost,
    notes: p.notes,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  }));

  const { error } = await supabase.from("house_projects").upsert(rows, { onConflict: "id" });
  if (error) throw error;

  localStorage.removeItem(HOUSE_PROJECTS_KEY);
  localStorage.setItem(MIGRATED_HOUSE_KEY, "1");
}

export async function migrateCalendarEventsFromLocalStorage(): Promise<void> {
  if (localStorage.getItem(MIGRATED_CALENDAR_KEY) === "1") return;

  const local = readJson<FamilyCalendarEvent>(CALENDAR_EVENTS_KEY).filter((e) => !e.id.startsWith("seed-"));
  if (local.length === 0) {
    localStorage.removeItem(CALENDAR_EVENTS_KEY);
    localStorage.setItem(MIGRATED_CALENDAR_KEY, "1");
    return;
  }

  const rows = local.map((e) => ({
    id: e.id,
    title: e.title,
    event_date: e.date,
    event_time: e.time,
    category: e.category as FamilyEventCategory,
    notes: e.notes,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
  }));

  const { error } = await supabase.from("family_calendar_events").upsert(rows, { onConflict: "id" });
  if (error) throw error;

  localStorage.removeItem(CALENDAR_EVENTS_KEY);
  localStorage.setItem(MIGRATED_CALENDAR_KEY, "1");
}
