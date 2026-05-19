import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, Trash2, Upload } from "lucide-react";
import type { IssueSeverity, VehicleUpdate } from "../../../types";
import type { VehicleWithIssues } from "./types";
import { displayName, photoPublicUrl } from "./garage-utils";
import { useVehiclesMutations } from "./useVehicles";

type Props = {
  vehicle: VehicleWithIssues;
  onClose: () => void;
  onDeleted: () => void;
};

const emptyToNull = (s: string) => (s.trim() === "" ? null : s.trim());
const numOrNull = (s: string) => (s.trim() === "" ? null : parseFloat(s));

export function CarDetailView({ vehicle, onClose, onDeleted }: Props) {
  const mut = useVehiclesMutations();
  const [form, setForm] = useState(() => vehicleToForm(vehicle));
  const [newIssue, setNewIssue] = useState("");
  const [newSeverity, setNewSeverity] = useState<IssueSeverity>("medium");

  useEffect(() => {
    setForm(vehicleToForm(vehicle));
  }, [vehicle]);

  const photoUrl = photoPublicUrl(vehicle.photo_path);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const patch: VehicleUpdate = {
      nickname: emptyToNull(form.nickname),
      year: parseInt(form.year, 10),
      make: form.make.trim(),
      model: form.model.trim(),
      color: emptyToNull(form.color),
      vin: emptyToNull(form.vin),
      license_plate: emptyToNull(form.license_plate),
      current_mileage: form.current_mileage ? parseInt(form.current_mileage, 10) : null,
      mpg_avg: numOrNull(form.mpg_avg),
      last_oil_change_date: emptyToNull(form.last_oil_change_date),
      last_oil_change_mileage: form.last_oil_change_mileage
        ? parseInt(form.last_oil_change_mileage, 10)
        : null,
      tires_installed_date: emptyToNull(form.tires_installed_date),
      registration_expires: emptyToNull(form.registration_expires),
      insurance_expires: emptyToNull(form.insurance_expires),
      notes: emptyToNull(form.notes),
    };
    await mut.updateVehicle.mutateAsync({ id: vehicle.id, patch });
    onClose();
  };

  const onPhoto = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return;
    await mut.uploadPhoto.mutateAsync({ vehicleId: vehicle.id, file });
  };

  const addIssue = async () => {
    if (!newIssue.trim()) return;
    await mut.createIssue.mutateAsync({
      vehicle_id: vehicle.id,
      description: newIssue.trim(),
      severity: newSeverity,
    });
    setNewIssue("");
  };

  const remove = async () => {
    if (!confirm(`Delete ${displayName(vehicle)}?`)) return;
    await mut.deleteVehicle.mutateAsync(vehicle.id);
    onDeleted();
  };

  const busy = mut.updateVehicle.isPending || mut.uploadPhoto.isPending;

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/55 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-auto max-w-3xl px-4 pb-24 pt-20"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="car-detail-title"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 id="car-detail-title" className="mb-1 text-3xl font-black text-slate-900">
          {displayName(vehicle)}
        </h2>
        <p className="mb-6 text-sm font-bold uppercase tracking-wide text-cyan-700">
          Edit details & upload photo
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mb-6 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-bold text-slate-800 shadow-sm hover:bg-cyan-600 hover:text-white"
        >
          <ChevronLeft size={18} /> Back to garage
        </button>

        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="aspect-video w-full object-cover" />
          ) : (
            <div className="flex aspect-video items-center justify-center bg-slate-100 text-base font-bold text-slate-500">
              No photo yet
            </div>
          )}
          <div className="p-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
              <Upload size={16} />
              Upload / replace photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onPhoto(f);
                }}
              />
            </label>
          </div>
        </div>

        <form onSubmit={save} className="space-y-6">
          <Section title="Identity">
            <Grid>
              <Input label="Nickname" value={form.nickname} onChange={(v) => setForm({ ...form, nickname: v })} />
              <Input label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} type="number" />
              <Input label="Make" value={form.make} onChange={(v) => setForm({ ...form, make: v })} />
              <Input label="Model" value={form.model} onChange={(v) => setForm({ ...form, model: v })} />
              <Input label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} />
              <Input label="VIN" value={form.vin} onChange={(v) => setForm({ ...form, vin: v })} />
              <Input label="License plate" value={form.license_plate} onChange={(v) => setForm({ ...form, license_plate: v })} />
            </Grid>
          </Section>
          <Section title="Usage">
            <Grid>
              <Input label="Current mileage" value={form.current_mileage} onChange={(v) => setForm({ ...form, current_mileage: v })} type="number" />
              <Input label="MPG average" value={form.mpg_avg} onChange={(v) => setForm({ ...form, mpg_avg: v })} type="number" />
            </Grid>
          </Section>
          <Section title="Maintenance">
            <Grid>
              <Input label="Last oil change (date)" value={form.last_oil_change_date} onChange={(v) => setForm({ ...form, last_oil_change_date: v })} type="date" />
              <p className="sm:col-span-2 -mt-1 text-xs font-semibold text-slate-500">
                Next oil change due 4 months after this date (~7k miles).
              </p>
              <Input label="Last oil change (mileage, optional)" value={form.last_oil_change_mileage} onChange={(v) => setForm({ ...form, last_oil_change_mileage: v })} type="number" />
              <Input label="Tires installed" value={form.tires_installed_date} onChange={(v) => setForm({ ...form, tires_installed_date: v })} type="date" />
            </Grid>
          </Section>
          <Section title="Dates">
            <Grid>
              <Input label="Registration expires" value={form.registration_expires} onChange={(v) => setForm({ ...form, registration_expires: v })} type="date" />
              <Input label="Insurance expires" value={form.insurance_expires} onChange={(v) => setForm({ ...form, insurance_expires: v })} type="date" />
            </Grid>
          </Section>
          <Section title="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-slate-900"
            />
          </Section>

          <Section title="Issues">
            <ul className="mb-3 space-y-2">
              {vehicle.vehicle_issues.map((issue) => (
                <li
                  key={issue.id}
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className={`rounded px-1.5 text-xs font-bold uppercase ${severityCls(issue.severity)}`}>
                    {issue.severity}
                  </span>
                  <span className={issue.status === "fixed" ? "text-slate-400 line-through" : "text-slate-800"}>
                    {issue.description}
                  </span>
                  {issue.status === "open" ? (
                    <button
                      type="button"
                      className="ml-auto text-xs font-bold text-cyan-700"
                      onClick={() => mut.updateIssue.mutateAsync({ id: issue.id, patch: { status: "fixed" } })}
                    >
                      Mark fixed
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-xs font-bold text-red-600"
                    onClick={() => mut.deleteIssue.mutateAsync(issue.id)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={newIssue}
                onChange={(e) => setNewIssue(e.target.value)}
                placeholder="New issue…"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-900"
              />
              <select
                value={newSeverity}
                onChange={(e) => setNewSeverity(e.target.value as IssueSeverity)}
                className="rounded-xl border border-slate-200 bg-white px-2 font-semibold text-slate-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button type="button" onClick={() => void addIssue()} className="rounded-full bg-slate-800 px-4 py-2 text-sm font-bold text-white">
                Add
              </button>
            </div>
          </Section>

          <div className="flex flex-wrap gap-3 pt-4">
            <button type="submit" disabled={busy} className="rounded-full bg-cyan-600 px-8 py-3 font-bold text-white hover:bg-cyan-700 disabled:opacity-60">
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => void remove()} className="flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-6 py-3 font-bold text-red-700 hover:bg-red-100">
              <Trash2 size={18} /> Delete car
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

function vehicleToForm(v: VehicleWithIssues) {
  return {
    nickname: v.nickname ?? "",
    year: String(v.year),
    make: v.make,
    model: v.model,
    color: v.color ?? "",
    vin: v.vin ?? "",
    license_plate: v.license_plate ?? "",
    current_mileage: v.current_mileage != null ? String(v.current_mileage) : "",
    mpg_avg: v.mpg_avg != null ? String(v.mpg_avg) : "",
    last_oil_change_date: v.last_oil_change_date ?? "",
    last_oil_change_mileage: v.last_oil_change_mileage != null ? String(v.last_oil_change_mileage) : "",
    tires_installed_date: v.tires_installed_date ?? "",
    registration_expires: v.registration_expires ?? "",
    insurance_expires: v.insurance_expires ?? "",
    notes: v.notes ?? "",
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 text-lg font-black text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base font-bold text-slate-900"
      />
    </label>
  );
}

function severityCls(s: IssueSeverity) {
  if (s === "high") return "bg-red-100 text-red-700";
  if (s === "medium") return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}
