import { Car, AlertTriangle, ChevronRight, Droplets } from "lucide-react";
import type { VehicleWithIssues } from "./types";
import {
  displayName,
  expiryBadge,
  getOilChangeInfo,
  oilChangeLabel,
  openIssues,
  photoPublicUrl,
  tireAgeLabel,
} from "./garage-utils";

type Props = {
  vehicle: VehicleWithIssues;
  isDemo?: boolean;
  onClick: () => void;
};

export function CarCard({ vehicle, isDemo, onClick }: Props) {
  const photoUrl = photoPublicUrl(vehicle.photo_path);
  const issues = openIssues(vehicle.vehicle_issues);
  const regBadge = expiryBadge(vehicle.registration_expires);
  const insBadge = expiryBadge(vehicle.insurance_expires);
  const oil = getOilChangeInfo(vehicle);

  const handleActivate = () => {
    if (!isDemo) onClick();
  };

  return (
    <div
      role="button"
      tabIndex={isDemo ? -1 : 0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (isDemo) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative z-10 w-full rounded-3xl border border-white/60 bg-white/40 p-5 text-left shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl transition ${
        isDemo
          ? "cursor-default opacity-90 ring-2 ring-dashed ring-cyan-300/60"
          : "cursor-pointer hover:bg-white/60 hover:shadow-lg hover:ring-2 hover:ring-cyan-400/40 active:scale-[0.99]"
      }`}
    >
      {isDemo && (
        <span className="mb-2 inline-block rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-cyan-700">
          Demo — add a car to edit
        </span>
      )}
      {!isDemo && (
        <span className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-cyan-700">
          Tap to view & edit <ChevronRight size={14} />
        </span>
      )}
      <div className="mb-4 flex aspect-video items-center justify-center overflow-hidden rounded-2xl bg-white/50">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Car size={48} className="text-slate-300" />
        )}
      </div>
      <h3 className="mb-3 text-xl font-black text-slate-900">{displayName(vehicle)}</h3>
      <div className="mb-3 grid grid-cols-2 gap-3">
        <Stat label="MPG" value={vehicle.mpg_avg != null ? String(vehicle.mpg_avg) : "—"} />
        <Stat
          label="Mileage"
          value={vehicle.current_mileage != null ? vehicle.current_mileage.toLocaleString() : "—"}
        />
        <Stat label="Tires" value={tireAgeLabel(vehicle.tires_installed_date)} />
        <Stat
          label="Oil (4 mo)"
          value={oilChangeLabel(vehicle.last_oil_change_date, vehicle.last_oil_change_mileage)}
        />
      </div>
      {(oil.status === "due" || oil.status === "soon") && oil.message && (
        <div
          className={`mb-2 flex items-start gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
            oil.status === "due"
              ? "bg-red-50/90 text-red-800 ring-1 ring-red-200"
              : "bg-amber-50/90 text-amber-900 ring-1 ring-amber-200"
          }`}
        >
          <Droplets size={16} className="mt-0.5 shrink-0" />
          <span>{oil.message}</span>
        </div>
      )}
      {issues.length > 0 && (
        <div className="mb-2 flex items-start gap-2 rounded-xl bg-red-50/80 px-3 py-2 text-sm font-semibold text-red-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            {issues.length} open · {issues[0]!.description.slice(0, 40)}
            {issues[0]!.description.length > 40 ? "…" : ""}
          </span>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {regBadge !== "ok" && <Badge kind={regBadge} label="Registration" />}
        {insBadge !== "ok" && <Badge kind={insBadge} label="Insurance" />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-base font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

function Badge({ kind, label }: { kind: "soon" | "overdue"; label: string }) {
  const cls =
    kind === "overdue"
      ? "bg-red-100 text-red-700"
      : "bg-amber-100 text-amber-800";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${cls}`}>{label}</span>;
}
