import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FamilyCalendarEventInsert,
  FamilyCalendarEventRow,
  FamilyCalendarEventUpdate,
} from "../../../types";
import type { FamilyCalendarEvent, FamilyEventKind } from "../../lib/calendar-events-store";
import { migrateCalendarEventsFromLocalStorage } from "../../lib/migrate-local-storage";
import { supabase } from "../../lib/supabase";
import { EVENT_COLORS } from "./calendar-ui";

const FAMILY_CALENDAR_KEY = ["family_calendar_events"] as const;
const DEFAULT_COLOR = EVENT_COLORS[2]!.value;

function rowToEvent(row: FamilyCalendarEventRow, memberIds: string[] = []): FamilyCalendarEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.event_date,
    time: row.event_time,
    category: row.category,
    eventKind: row.event_kind ?? "regular",
    colorClass: row.color_class ?? DEFAULT_COLOR,
    notes: row.notes,
    memberIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function isMissingFamilyCalendarTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("family_calendar_events")
  );
}

async function fetchEventMemberMap(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  const { data, error } = await supabase.from("calendar_event_members").select("event_id, member_id");
  if (error) {
    // Junction table may not exist yet; continue without members
    if (
      error.message.includes("Could not find the table") ||
      error.message.includes("does not exist") ||
      error.message.includes("calendar_event_members")
    ) {
      return map;
    }
    throw error;
  }
  for (const link of data ?? []) {
    const list = map.get(link.event_id) ?? [];
    list.push(link.member_id);
    map.set(link.event_id, list);
  }
  return map;
}

async function syncEventMembers(eventId: string, memberIds: string[]) {
  const { error: delError } = await supabase
    .from("calendar_event_members")
    .delete()
    .eq("event_id", eventId);
  if (delError) {
    if (
      delError.message.includes("Could not find the table") ||
      delError.message.includes("does not exist")
    ) {
      return;
    }
    throw delError;
  }

  const unique = [...new Set(memberIds)];
  if (unique.length === 0) return;

  const { error: insError } = await supabase.from("calendar_event_members").insert(
    unique.map((member_id) => ({ event_id: eventId, member_id })),
  );
  if (insError) throw insError;
}

async function fetchFamilyCalendarEvents(): Promise<FamilyCalendarEvent[]> {
  const { data, error } = await supabase
    .from("family_calendar_events")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) throw error;

  let rows = data ?? [];
  if (rows.length === 0) {
    await migrateCalendarEventsFromLocalStorage();
    const { data: again, error: againError } = await supabase
      .from("family_calendar_events")
      .select("*")
      .order("event_date", { ascending: true });
    if (againError) throw againError;
    rows = again ?? [];
  }

  const memberMap = await fetchEventMemberMap();
  return rows.map((row) => rowToEvent(row, memberMap.get(row.id) ?? []));
}

export function useFamilyCalendarEvents() {
  return useQuery({
    queryKey: FAMILY_CALENDAR_KEY,
    queryFn: fetchFamilyCalendarEvents,
    retry: false,
  });
}

export type SaveFamilyEventInput = {
  id?: string;
  title: string;
  date: string;
  time: string | null;
  eventKind: FamilyEventKind;
  colorClass: string;
  notes?: string | null;
  memberIds?: string[];
};

export function useFamilyCalendarEventsMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: FAMILY_CALENDAR_KEY });

  const saveEvent = useMutation({
    mutationFn: async (input: SaveFamilyEventInput) => {
      const category =
        input.eventKind === "school"
          ? "activity"
          : input.eventKind === "birthday"
            ? "general"
            : "general";
      const memberIds = input.memberIds ?? [];

      if (input.id) {
        const row: FamilyCalendarEventUpdate = {
          title: input.title,
          event_date: input.date,
          event_time: input.time,
          category,
          event_kind: input.eventKind,
          color_class: input.colorClass,
          notes: input.notes ?? null,
        };
        const { data, error } = await supabase
          .from("family_calendar_events")
          .update(row)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        await syncEventMembers(data.id, memberIds);
        return rowToEvent(data, memberIds);
      }

      const row: FamilyCalendarEventInsert = {
        title: input.title,
        event_date: input.date,
        event_time: input.time,
        category,
        event_kind: input.eventKind,
        color_class: input.colorClass,
        notes: input.notes ?? null,
      };
      const { data, error } = await supabase
        .from("family_calendar_events")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      await syncEventMembers(data.id, memberIds);
      return rowToEvent(data, memberIds);
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
