import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FamilyCalendarEventInsert,
  FamilyCalendarEventRow,
  FamilyCalendarEventUpdate,
} from "../../../types";
import type { FamilyCalendarEvent } from "../../lib/calendar-events-store";
import { migrateCalendarEventsFromLocalStorage } from "../../lib/migrate-local-storage";
import { supabase } from "../../lib/supabase";

const FAMILY_CALENDAR_KEY = ["family_calendar_events"] as const;

export function isMissingFamilyCalendarTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("family_calendar_events")
  );
}

function rowToEvent(row: FamilyCalendarEventRow): FamilyCalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.event_date,
    time: row.event_time,
    category: row.category,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchFamilyCalendarEvents(): Promise<FamilyCalendarEvent[]> {
  const { data, error } = await supabase
    .from("family_calendar_events")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) {
    await migrateCalendarEventsFromLocalStorage();
    const { data: again, error: againError } = await supabase
      .from("family_calendar_events")
      .select("*")
      .order("event_date", { ascending: true });
    if (againError) throw againError;
    return (again ?? []).map(rowToEvent);
  }

  return rows.map(rowToEvent);
}

export function useFamilyCalendarEvents() {
  return useQuery({
    queryKey: FAMILY_CALENDAR_KEY,
    queryFn: fetchFamilyCalendarEvents,
    retry: false,
  });
}

export function useFamilyCalendarEventsMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: FAMILY_CALENDAR_KEY });

  const saveEvent = useMutation({
    mutationFn: async (
      input: Omit<FamilyCalendarEvent, "id" | "createdAt" | "updatedAt"> & { id?: string },
    ) => {
      if (input.id) {
        const row: FamilyCalendarEventUpdate = {
          title: input.title,
          event_date: input.date,
          event_time: input.time,
          category: input.category,
          notes: input.notes,
        };
        const { data, error } = await supabase
          .from("family_calendar_events")
          .update(row)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return rowToEvent(data);
      }

      const row: FamilyCalendarEventInsert = {
        title: input.title,
        event_date: input.date,
        event_time: input.time,
        category: input.category,
        notes: input.notes,
      };
      const { data, error } = await supabase
        .from("family_calendar_events")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return rowToEvent(data);
    },
    onSuccess: invalidate,
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("family_calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { saveEvent, deleteEvent };
}
