import { Archive, Bell, Car } from "lucide-react";
import { collectGarageNotifications } from "../rooms/garage/garage-utils";
import { isMissingTableError as garageMissing, useVehicles } from "../rooms/garage/useVehicles";
import { collectVaultNotifications } from "../rooms/vault/vault-utils";
import { isMissingTableError as vaultMissing, useVaultDocuments } from "../rooms/vault/useVaultDocuments";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  severity: "amber" | "red";
  icon: "car" | "archive";
};

export function HomeNotificationsWidget() {
  const { data: vehicles = [], error: vehicleError } = useVehicles();
  const { data: documents = [], error: vaultError } = useVaultDocuments();

  const garageUnavailable = vehicleError && garageMissing(vehicleError.message);
  const vaultUnavailable = vaultError && vaultMissing(vaultError.message);

  if (garageUnavailable && vaultUnavailable) {
    return null;
  }

  const notifications: NotificationItem[] = [];

  if (!garageUnavailable) {
    for (const n of collectGarageNotifications(vehicles)) {
      if (n.severity === "slate") continue;
      notifications.push({
        id: n.id,
        title: n.vehicleName,
        message: n.message,
        severity: n.severity,
        icon: "car",
      });
    }
  }

  if (!vaultUnavailable) {
    for (const n of collectVaultNotifications(documents)) {
      notifications.push({
        id: n.id,
        title: n.title,
        message: n.message,
        severity: n.severity,
        icon: "archive",
      });
    }
  }

  return (
    <div className="w-full rounded-3xl border border-white/60 bg-white/40 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl">
      <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
        <Bell size={18} className="text-cyan-600" />
        Notifications
      </h3>
      {notifications.length === 0 ? (
        <p className="text-sm font-semibold text-slate-500">No alerts right now.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex gap-3 rounded-xl border px-3 py-2.5 ${
                n.severity === "red"
                  ? "border-red-200/80 bg-red-50/90"
                  : "border-amber-200/80 bg-amber-50/90"
              }`}
            >
              {n.icon === "car" ? (
                <Car
                  size={18}
                  className={`mt-0.5 shrink-0 ${n.severity === "red" ? "text-red-600" : "text-amber-600"}`}
                />
              ) : (
                <Archive
                  size={18}
                  className={`mt-0.5 shrink-0 ${n.severity === "red" ? "text-red-600" : "text-amber-600"}`}
                />
              )}
              <div>
                <p className="text-sm font-black text-slate-900">{n.title}</p>
                <p
                  className={`text-sm font-bold ${n.severity === "red" ? "text-red-800" : "text-amber-900"}`}
                >
                  {n.message}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
