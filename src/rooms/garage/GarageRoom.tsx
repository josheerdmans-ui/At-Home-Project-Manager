import { useState } from "react";
import { Car, Plus } from "lucide-react";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { GARAGE_SETUP_SQL } from "../../lib/garage-setup-sql";
import { AddCarModal } from "./AddCarModal";
import { CarCard } from "./CarCard";
import { CarDetailView } from "./CarDetailView";
import { countOpenIssues } from "./garage-utils";
import { DEMO_VEHICLE, type VehicleWithIssues } from "./types";
import { garageHasRealData, isMissingTableError, useVehicles, useVehiclesMutations } from "./useVehicles";

export function GarageRoom() {
  const { data: vehicles = [], isLoading, error } = useVehicles();
  const mut = useVehiclesMutations();
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<VehicleWithIssues | null>(null);

  const showDemo = !garageHasRealData() && vehicles.length === 0 && !isLoading && !error;
  const openCount = countOpenIssues(vehicles);

  if (error && isMissingTableError(error.message)) {
    return (
      <div className="flex min-h-full flex-col p-12">
        <Header onAdd={() => setShowAdd(true)} />
        <div className="flex flex-1 items-center justify-center">
          <DbSetupPanel title="Garage database setup" sql={GARAGE_SETUP_SQL} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-12">
      <Header onAdd={() => setShowAdd(true)} />
      {!isLoading && vehicles.length > 0 && (
        <p className="mb-6 text-sm font-semibold text-slate-500">
          {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} · {openCount} open issue
          {openCount !== 1 ? "s" : ""}
        </p>
      )}
      {isLoading ? (
        <p className="text-center text-slate-500">Loading vehicles…</p>
      ) : vehicles.length === 0 && !showDemo ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <p className="text-xl font-medium text-slate-500">No vehicles yet</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="rounded-full bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-700"
          >
            Add your first car
          </button>
        </div>
      ) : (
        <div className="relative z-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {showDemo && <CarCard vehicle={DEMO_VEHICLE} isDemo onClick={() => {}} />}
          {vehicles.map((v) => (
            <CarCard key={v.id} vehicle={v} onClick={() => setSelected(v)} />
          ))}
        </div>
      )}
      {error && !isMissingTableError(error.message) && (
        <p className="mt-4 text-center text-red-600">{error.message}</p>
      )}
      {showAdd && (
        <AddCarModal
          busy={mut.createVehicle.isPending}
          onClose={() => setShowAdd(false)}
          onCreate={async (input) => {
            const created = await mut.createVehicle.mutateAsync(input);
            setShowAdd(false);
            const full = vehicles.find((x) => x.id === created.id) ?? {
              ...created,
              vehicle_issues: [],
            };
            setSelected(full as VehicleWithIssues);
          }}
        />
      )}
      {selected && (
        <CarDetailView
          vehicle={vehicles.find((v) => v.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
          onDeleted={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Header({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-4 pr-44">
      <div className="rounded-2xl bg-cyan-100 p-4 text-cyan-700">
        <Car size={40} />
      </div>
      <h1 className="text-4xl font-black tracking-tight text-slate-800">Garage</h1>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition hover:bg-cyan-600 hover:text-white"
      >
        <Plus size={18} />
        Add car
      </button>
    </div>
  );
}
