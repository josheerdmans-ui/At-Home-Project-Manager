import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { VehicleInsert } from "../../../types";

type Props = {
  onClose: () => void;
  onCreate: (input: VehicleInsert) => Promise<void>;
  busy: boolean;
};

export function AddCarModal({ onClose, onCreate, busy }: Props) {
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [nickname, setNickname] = useState("");
  const [mileage, setMileage] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await onCreate({
      year: parseInt(year, 10),
      make: make.trim(),
      model: model.trim(),
      nickname: nickname.trim() || null,
      current_mileage: mileage ? parseInt(mileage, 10) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/90 p-6 shadow-xl backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">Add vehicle</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Year *" value={year} onChange={setYear} type="number" required />
          <Field label="Make *" value={make} onChange={setMake} required />
          <Field label="Model *" value={model} onChange={setModel} required />
          <Field label="Nickname" value={nickname} onChange={setNickname} />
          <Field label="Current mileage" value={mileage} onChange={setMileage} type="number" />
          <button
            type="submit"
            disabled={busy}
            className="mt-2 w-full rounded-full bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add vehicle"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
      />
    </label>
  );
}
