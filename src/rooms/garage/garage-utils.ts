import type { Vehicle, VehicleIssue, VehicleWithIssues } from "./types";

/** Roughly ~7k miles / 4 months — tracked by calendar, not mileage. */
export const OIL_CHANGE_INTERVAL_MONTHS = 4;
const OIL_CHANGE_SOON_DAYS = 14;

export type OilChangeStatus = "ok" | "soon" | "due" | "unknown";

export type OilChangeInfo = {
  status: OilChangeStatus;
  dueDate: Date | null;
  daysUntilDue: number | null;
  message: string | null;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addMonths(d: Date, months: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + months);
  return startOfDay(out);
}

function daysUntil(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

export type GarageNotification = {
  id: string;
  vehicleId: string;
  vehicleName: string;
  message: string;
  severity: "amber" | "red" | "slate";
  kind: "oil_change";
};

export function getOilChangeInfo(
  vehicle: Pick<Vehicle, "last_oil_change_date">,
): OilChangeInfo {
  const lastOilDate = vehicle.last_oil_change_date;

  if (!lastOilDate) {
    return {
      status: "unknown",
      dueDate: null,
      daysUntilDue: null,
      message: "Log last oil change date",
    };
  }

  const last = startOfDay(new Date(lastOilDate));
  const dueDate = addMonths(last, OIL_CHANGE_INTERVAL_MONTHS);
  const today = startOfDay(new Date());
  const daysLeft = daysUntil(today, dueDate);

  if (daysLeft < 0) {
    const overdue = Math.abs(daysLeft);
    return {
      status: "due",
      dueDate,
      daysUntilDue: daysLeft,
      message:
        overdue === 0
          ? "Oil change due today"
          : `Oil change due — ${overdue} day${overdue === 1 ? "" : "s"} overdue`,
    };
  }

  if (daysLeft <= OIL_CHANGE_SOON_DAYS) {
    return {
      status: "soon",
      dueDate,
      daysUntilDue: daysLeft,
      message:
        daysLeft === 0
          ? `Oil change due today (${dueDate.toLocaleDateString()})`
          : `Oil change due in ${daysLeft} day${daysLeft === 1 ? "" : "s"} — ${dueDate.toLocaleDateString()}`,
    };
  }

  return { status: "ok", dueDate, daysUntilDue: daysLeft, message: null };
}

export function collectGarageNotifications(vehicles: VehicleWithIssues[]): GarageNotification[] {
  const notes: GarageNotification[] = [];

  for (const v of vehicles) {
    const oil = getOilChangeInfo(v);
    if (oil.status === "due") {
      notes.push({
        id: `${v.id}-oil`,
        vehicleId: v.id,
        vehicleName: displayName(v),
        message: oil.message ?? "Oil change due",
        severity: "red",
        kind: "oil_change",
      });
    } else if (oil.status === "soon") {
      notes.push({
        id: `${v.id}-oil`,
        vehicleId: v.id,
        vehicleName: displayName(v),
        message: oil.message ?? "Oil change soon",
        severity: "amber",
        kind: "oil_change",
      });
    }
  }

  return notes;
}

export function displayName(v: Pick<Vehicle, "nickname" | "year" | "make" | "model">) {
  if (v.nickname?.trim()) return v.nickname.trim();
  return `${v.year} ${v.make} ${v.model}`;
}

export function tireAgeLabel(tiresInstalledDate: string | null): string {
  if (!tiresInstalledDate) return "Not set";
  const installed = new Date(tiresInstalledDate);
  const now = new Date();
  const months =
    (now.getFullYear() - installed.getFullYear()) * 12 + (now.getMonth() - installed.getMonth());
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`;
}

export function oilChangeLabel(date: string | null, mileage: number | null): string {
  if (!date) return "Not set";
  const info = getOilChangeInfo({ last_oil_change_date: date });
  const last = new Date(date).toLocaleDateString();
  if (info.dueDate) {
    return `${last} · Due ${info.dueDate.toLocaleDateString()}`;
  }
  if (mileage != null) return `${last} · ${mileage.toLocaleString()} mi`;
  return last;
}

export type ExpiryBadge = "ok" | "soon" | "overdue";

export function expiryBadge(expires: string | null): ExpiryBadge {
  if (!expires) return "ok";
  const exp = new Date(expires);
  const now = new Date();
  const days = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "overdue";
  if (days <= 30) return "soon";
  return "ok";
}

export function openIssues(issues: VehicleIssue[]) {
  return issues.filter((i) => i.status === "open");
}

export function photoPublicUrl(photoPath: string | null): string | null {
  if (!photoPath) return null;
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/vehicle-photos/${photoPath}`;
}

export function countOpenIssues(vehicles: VehicleWithIssues[]) {
  return vehicles.reduce((n, v) => n + openIssues(v.vehicle_issues).length, 0);
}
