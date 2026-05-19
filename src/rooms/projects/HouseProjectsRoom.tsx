import { useState, type FormEvent } from "react";
import { Archive, Plus, Trash2 } from "lucide-react";
import {
  deleteHouseProject,
  listHouseProjects,
  saveHouseProject,
  type HouseProjectKind,
} from "../../lib/house-projects-store";

const KINDS: { value: HouseProjectKind; label: string }[] = [
  { value: "repair", label: "Repair" },
  { value: "remodel", label: "Remodel" },
  { value: "general", label: "General" },
];

export function HouseProjectsRoom() {
  const [refresh, setRefresh] = useState(0);
  const projects = listHouseProjects();
  const [showAdd, setShowAdd] = useState(false);

  const bump = () => setRefresh((n) => n + 1);

  return (
    <div className="min-h-full p-12">
      <div className="mb-8 flex flex-wrap items-center gap-4 pr-44">
        <div className="rounded-2xl bg-cyan-100 p-4 text-cyan-700">
          <Archive size={40} />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-slate-800">House Projects</h1>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition hover:bg-cyan-600 hover:text-white"
        >
          <Plus size={18} />
          New project
        </button>
      </div>

      <p className="mb-6 max-w-2xl text-sm font-medium text-slate-600">
        Track repairs and remodels here. Import them into The Vault when saving repair or remodel notes.
      </p>

      {projects.length === 0 ? (
        <p className="text-center text-slate-500">No projects yet — add one to import into the Vault.</p>
      ) : (
        <ul key={refresh} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li
              key={p.id}
              className="rounded-3xl border border-white/60 bg-white/40 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl"
            >
              <span className="mb-2 inline-block rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold uppercase text-cyan-800">
                {p.kind}
              </span>
              <h3 className="mb-2 text-lg font-black text-slate-900">{p.title}</h3>
              <p className="mb-2 line-clamp-3 text-sm text-slate-600">{p.details}</p>
              {p.cost != null && (
                <p className="mb-3 text-sm font-bold text-slate-800">
                  ${p.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              )}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete project "${p.title}"?`)) {
                    deleteHouseProject(p.id);
                    bump();
                  }
                }}
                className="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-800"
              >
                <Trash2 size={14} /> Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <AddProjectModal
          onClose={() => setShowAdd(false)}
          onSave={() => {
            bump();
            setShowAdd(false);
          }}
        />
      )}
    </div>
  );
}

function AddProjectModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<HouseProjectKind>("repair");
  const [details, setDetails] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveHouseProject({
      title: title.trim() || "Untitled project",
      kind,
      details: details.trim() || "",
      cost: cost.trim() ? parseFloat(cost) : null,
      notes: notes.trim() || null,
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-black text-slate-800">New project</h2>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">Type</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as HouseProjectKind)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">Details</span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">Cost ($)</span>
            <input
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-600">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2"
            />
          </label>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-slate-200 py-3 font-bold text-slate-700"
            >
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-full bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-700">
              Save project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
