/** Family calendar event types — data lives in Supabase (`family_calendar_events` table). */

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
