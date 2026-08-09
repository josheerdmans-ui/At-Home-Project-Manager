import { useMemo, useState, type FormEvent } from "react";
import { Check, Moon, Plus, Sun, Trash2 } from "lucide-react";
import { DbSetupPanel } from "../components/DbSetupPanel";
import { WALL_DISPLAY_SETUP_SQL } from "../lib/wall-display-setup-sql";
import {
  isMissingRoutinesTableError,
  useRoutineCompletions,
  useRoutines,
  useRoutinesMutations,
  type RoutineWithSteps,
} from "../hooks/useRoutines";

function RoutineIcon({ iconKey }: { iconKey: string }) {
  if (iconKey === "moon") return <Moon size={28} className="text-indigo-600" />;
  return <Sun size={28} className="text-amber-500" />;
}

export function WallRoutinesMode() {
  const { data: routines = [], error, isLoading } = useRoutines();
  const mut = useRoutinesMutations();
  const day = mut.todayKey();
  const { data: completions = [] } = useRoutineCompletions(day);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSteps, setNewSteps] = useState("Brush teeth\nGet dressed\nEat breakfast");
  const [stepDraft, setStepDraft] = useState("");

  const doneSet = useMemo(() => new Set(completions.map((c) => c.step_id)), [completions]);

  const selected: RoutineWithSteps | null = useMemo(() => {
    if (routines.length === 0) return null;
    const id = selectedId ?? routines[0]!.id;
    return routines.find((r) => r.id === id) ?? routines[0]!;
  }, [routines, selectedId]);

  if (error && isMissingRoutinesTableError(error.message)) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <DbSetupPanel title="Family wall database setup" sql={WALL_DISPLAY_SETUP_SQL} />
      </div>
    );
  }

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const steps = newSteps
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    mut.createRoutine.mutate(
      { title: newTitle.trim(), icon_key: "sun", steps },
      {
        onSuccess: (r) => {
          setNewTitle("");
          setSelectedId(r.id);
          setAdminOpen(false);
        },
      },
    );
  };

  if (isLoading) {
    return <div className="flex flex-1 items-center justify-center text-xl text-slate-500">Loading routines…</div>;
  }

  if (routines.length === 0) {
    return (
      <div className="mx-auto flex max-w-xl flex-1 flex-col justify-center gap-6 p-6">
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-8 text-center">
          <p className="text-2xl font-bold text-slate-700">No routines yet</p>
          <p className="mt-2 text-lg text-slate-500">Create a morning or bedtime checklist for the kids.</p>
        </div>
        <form onSubmit={handleCreate} className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-lg backdrop-blur-xl">
          <label className="mb-1 block text-sm font-semibold text-slate-600">Routine name</label>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Morning"
            className="mb-3 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg"
          />
          <label className="mb-1 block text-sm font-semibold text-slate-600">Steps (one per line)</label>
          <textarea
            value={newSteps}
            onChange={(e) => setNewSteps(e.target.value)}
            rows={5}
            className="mb-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-lg"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || mut.createRoutine.isPending}
            className="w-full rounded-xl bg-orange-500 py-3 text-lg font-bold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            Create routine
          </button>
        </form>
      </div>
    );
  }

  const steps = selected?.steps ?? [];
  const doneCount = steps.filter((s) => doneSet.has(s.id)).length;
  const progress = steps.length === 0 ? 0 : Math.round((doneCount / steps.length) * 100);
  const allDone = steps.length > 0 && doneCount === steps.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <div className="flex w-full shrink-0 flex-col gap-2 lg:w-64">
        {routines.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelectedId(r.id)}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-xl font-bold transition ${
              selected?.id === r.id
                ? "border-orange-300 bg-orange-500 text-white shadow-md"
                : "border-white/70 bg-white/60 text-slate-800 hover:bg-white"
            }`}
          >
            <RoutineIcon iconKey={r.icon_key} />
            {r.title}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAdminOpen((v) => !v)}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/50 px-4 py-3 font-semibold text-slate-600"
        >
          <Plus size={18} />
          Manage
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto rounded-3xl border border-white/70 bg-white/55 p-5 shadow-lg backdrop-blur-2xl sm:p-8">
        {selected && (
          <>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-3xl font-black text-slate-800 sm:text-4xl">{selected.title}</h2>
                <p className="mt-1 text-lg text-slate-500">
                  {doneCount} of {steps.length} done today
                </p>
              </div>
              <div className="h-3 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 sm:w-64">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {allDone && (
              <div className="mb-6 animate-pulse rounded-2xl bg-emerald-100 px-4 py-3 text-center text-xl font-bold text-emerald-800">
                All done — great job!
              </div>
            )}

            <ul className="flex flex-col gap-3">
              {steps.map((step) => {
                const done = doneSet.has(step.id);
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() =>
                        mut.toggleStepToday.mutate({ stepId: step.id, completed: !done, day })
                      }
                      className={`flex w-full items-center gap-4 rounded-3xl border px-5 py-5 text-left text-2xl font-bold transition sm:text-3xl ${
                        done
                          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                          : "border-white bg-white/80 text-slate-800 shadow-sm hover:bg-white"
                      }`}
                    >
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 ${
                          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
                        }`}
                      >
                        {done && <Check size={28} strokeWidth={3} />}
                      </span>
                      <span className={done ? "line-through opacity-80" : ""}>{step.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {steps.length === 0 && (
              <p className="text-lg text-slate-500">No steps yet — use Manage to add some.</p>
            )}
          </>
        )}

        {adminOpen && selected && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="mb-3 text-lg font-bold text-slate-700">Edit “{selected.title}”</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!stepDraft.trim()) return;
                mut.addStep.mutate(
                  { routineId: selected.id, title: stepDraft.trim() },
                  { onSuccess: () => setStepDraft("") },
                );
              }}
              className="mb-4 flex flex-col gap-2 sm:flex-row"
            >
              <input
                value={stepDraft}
                onChange={(e) => setStepDraft(e.target.value)}
                placeholder="New step"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2"
              />
              <button type="submit" className="rounded-xl bg-slate-800 px-4 py-2 font-semibold text-white">
                Add step
              </button>
            </form>
            <ul className="mb-4 space-y-2">
              {steps.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2">
                  <span className="text-slate-700">{s.title}</span>
                  <button
                    type="button"
                    onClick={() => mut.deleteStep.mutate(s.id)}
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete routine “${selected.title}”?`)) {
                  mut.deleteRoutine.mutate(selected.id, {
                    onSuccess: () => setSelectedId(null),
                  });
                }
              }}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 font-semibold text-rose-700"
            >
              Delete routine
            </button>

            <form onSubmit={handleCreate} className="mt-6 rounded-2xl border border-dashed border-slate-300 p-4">
              <p className="mb-2 font-semibold text-slate-700">New routine</p>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Bedtime"
                className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <textarea
                value={newSteps}
                onChange={(e) => setNewSteps(e.target.value)}
                rows={3}
                className="mb-2 w-full rounded-xl border border-slate-200 px-3 py-2"
              />
              <button type="submit" className="rounded-xl bg-orange-500 px-4 py-2 font-bold text-white">
                Create
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
