export const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const EVENT_COLORS = [
  { label: "Blue", value: "bg-blue-100 text-blue-700" },
  { label: "Purple", value: "bg-purple-100 text-purple-700" },
  { label: "Cyan", value: "bg-cyan-100 text-cyan-700" },
  { label: "Orange", value: "bg-orange-100 text-orange-700" },
  { label: "Green", value: "bg-green-100 text-green-700" },
  { label: "Pink", value: "bg-pink-100 text-pink-700" },
  { label: "Emerald", value: "bg-emerald-100 text-emerald-700" },
] as const;

export type FamilyEventKind = "regular" | "important" | "birthday" | "school";

export type CalendarCell = {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
  dateKey: string;
};

export function getDaysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

export function getFirstDayOfMonth(y: number, m: number) {
  return new Date(y, m, 1).getDay();
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function buildCalendarDays(year: number, month: number): CalendarCell[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstDay; i++) {
    const day = daysInPrevMonth - firstDay + i + 1;
    const date = new Date(year, month - 1, day);
    cells.push({ day, isCurrentMonth: false, date, dateKey: formatDateKey(date) });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    cells.push({ day: i, isCurrentMonth: true, date, dateKey: formatDateKey(date) });
  }

  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    cells.push({ day: i, isCurrentMonth: false, date, dateKey: formatDateKey(date) });
  }

  return cells;
}

export function formatTimeForDisplay(time: string | null): string {
  if (!time?.trim()) return "All Day";
  if (/am|pm/i.test(time)) return time;
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return time;
  const h = Number(match[1]);
  const m = match[2];
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${period}`;
}

export function timeInputFromStored(time: string | null): string {
  if (!time?.trim()) return "";
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(time.trim());
  if (!match) return "";
  let h = Number(match[1]);
  const m = match[2];
  const period = match[3]?.toUpperCase();
  if (period === "PM" && h < 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}
