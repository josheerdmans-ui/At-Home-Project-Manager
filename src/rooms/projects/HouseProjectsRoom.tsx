import { useState, type FormEvent } from "react";
import { Archive, Plus, Trash2 } from "lucide-react";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { HOUSE_PROJECTS_SETUP_SQL } from "../../lib/house-projects-setup-sql";
import type { HouseProjectKind } from "../../lib/house-projects-store";
import { isMissingHouseProjectsTableError, useHouseProjects, useHouseProjectsMutations } from "./useHouseProjects";

const KINDS: { value: HouseProjectKind; label: string }[] = [
  { value: "repair", label: "Repair" },
  { value: "remodel", label: "Remodel" },
  { value: "general", label: "General" },
];

export function HouseProjectsRoom() {
  const { data: projects = [], isLoading, error } = useHouseProjects();
  const mut = useHouseProjectsMutations();
  const [showAdd, setShowAdd] = useState(false);

  if (error && isMissingHouseProjectsTableError(error.message)) {
    return (
      <div className="flex min-h-full flex-col p-12">
        <Header onAdd={() => setShowAdd(true)} />
        <div className="flex flex-1 items-center justify-center">
          <DbSetupPanel title="House projects database setup" sql={HOUSE_PROJECTS_SETUP_SQL} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-12">
      <Header onAdd={() => setShowAdd(true)} />

      <p className="mb-6 max-w-2xl text-sm font-medium text-slate-600">
        Track repairs and remodels here. Import them into The Vault when saving repair or remodel notes.
        Projects sync across all devices when you are signed in.
      </p>

      {isLoading ? (
        <p className="text-center text-slate-500">Loading projects…</p>
      ) : projects.length === 0 ? (
        <p className="text-center text-slate-500">No projects yet — add one to import into the Vault.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                disabled={mut.deleteProject.isPending}
                onClick={() => {
                  if (confirm(`Delete project "${p.title}"?`)) {
                    mut.deleteProject.mutate(p.id);
                  }
                }}
                className="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && !isMissingHouseProjectsTableError(error.message) && (
        <p className="mt-6 text-center text-sm font-medium text-red-600">{error.message}</p>
      )}

      {showAdd && (
        <AddProjectModal
          busy={mut.createProject.isPending}
          onClose={() => setShowAdd(false)}
          onSave={(input) => {
            mut.createProject.mutate(input, {
              onSuccess: () => setShowAdd(false),
            });
          }}
        />
      )}
    </div>
  );
}

function Header({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-4 pr-44">
      <div className="rounded-2xl bg-cyan-100 p-4 text-cyan-700">
        <Archive size={40} />
      </div>
      <h1 className="text-4xl font-black tracking-tight text-slate-800">House Projects</h1>
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition hover:bg-cyan-600 hover:text-white"
      >
        <Plus size={18} />
        New project
      </button>
    </div>
  );
}

function AddProjectModal({
  busy,
  onClose,
  onSave,
}: {
  busy: boolean;
  onClose: () => void;
  onSave: (input: {
    title: string;
    kind: HouseProjectKind;
    details: string;
    cost: number | null;
    notes: string | null;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<HouseProjectKind>("repair");
  const [details, setDetails] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      title: title.trim() || "Untitled project",
      kind,
      details: details.trim() || "",
      cost: cost.trim() ? parseFloat(cost) : null,
      notes: notes.trim() || null,
    });
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
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-full bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
