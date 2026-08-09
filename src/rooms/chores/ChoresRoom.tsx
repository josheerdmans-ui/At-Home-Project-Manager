import { useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, ListTodo, Plus, Trash2 } from "lucide-react";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { KID_ECONOMY_SETUP_SQL } from "../../lib/kid-economy-setup-sql";
import { HOUSEHOLD_SETUP_SQL } from "../../lib/household-setup-sql";
import {
  isMissingMembersTableError,
  useHouseholdMembers,
} from "../../hooks/useHouseholdMembers";
import {
  balancesFromLedger,
  isMissingKidEconomyTableError,
  useChores,
  useKidEconomyMutations,
  useTokenLedger,
} from "../../hooks/useKidEconomy";

export function ChoresRoom() {
  const { data: members = [], error: membersError } = useHouseholdMembers();
  const { data: chores = [], error, isLoading } = useChores();
  const { data: ledger = [] } = useTokenLedger();
  const mut = useKidEconomyMutations();

  const [title, setTitle] = useState("");
  const [tokenValue, setTokenValue] = useState(5);
  const [assigneeId, setAssigneeId] = useState("");
  const [actorId, setActorId] = useState("");

  const balances = useMemo(() => balancesFromLedger(ledger), [ledger]);

  if (membersError && isMissingMembersTableError(membersError.message)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <DbSetupPanel title="Household database setup" sql={HOUSEHOLD_SETUP_SQL} />
      </div>
    );
  }

  if (error && isMissingKidEconomyTableError(error.message)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <DbSetupPanel title="Chores & tokens database setup" sql={KID_ECONOMY_SETUP_SQL} />
      </div>
    );
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    mut.createChore.mutate(
      {
        title: trimmed,
        token_value: tokenValue,
        assignee_id: assigneeId || null,
      },
      {
        onSuccess: () => {
          setTitle("");
          setTokenValue(5);
          setAssigneeId("");
        },
      },
    );
  };

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 overflow-auto p-6 sm:p-10">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-orange-100 p-4 text-orange-600">
          <ListTodo size={36} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800">Chores</h1>
          <p className="text-sm font-semibold text-slate-500">
            Complete chores to earn tokens
          </p>
        </div>
      </div>

      {members.length > 0 && (
        <div className="rounded-3xl border border-white/80 bg-white/50 p-4 shadow-sm backdrop-blur-xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            Who is completing chores?
          </p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setActorId(m.id)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  actorId === m.id
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-white/80 bg-white/80 text-slate-700 hover:bg-white"
                }`}
              >
                {m.display_name}
                <span className="ml-2 text-xs opacity-80">{balances[m.id] ?? 0} tok</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={handleAdd}
        className="rounded-3xl border border-white/80 bg-white/50 p-5 shadow-sm backdrop-blur-xl"
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Add chore</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm font-semibold text-slate-700">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Unload dishwasher"
            />
          </label>
          <label className="w-28 text-sm font-semibold text-slate-700">
            Tokens
            <input
              type="number"
              min={0}
              value={tokenValue}
              onChange={(e) => setTokenValue(Number(e.target.value))}
              className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-400"
            />
          </label>
          <label className="sm:w-48 text-sm font-semibold text-slate-700">
            Assignee
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-2.5 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">Anyone</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={mut.createChore.isPending || !title.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-center text-slate-500">Loading chores…</p>
      ) : chores.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-300 bg-white/40 px-6 py-16 text-center text-lg font-semibold text-slate-500">
          No chores yet. Add the first one above.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {chores.map((chore) => {
            const assignee = members.find((m) => m.id === chore.assignee_id);
            const canComplete =
              Boolean(actorId) &&
              (!chore.assignee_id || chore.assignee_id === actorId);
            return (
              <li
                key={chore.id}
                className="flex flex-col gap-3 rounded-3xl border border-white/80 bg-white/60 p-4 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-lg font-bold text-slate-800">{chore.title}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {chore.token_value} token{chore.token_value === 1 ? "" : "s"}
                    {assignee ? ` · ${assignee.display_name}` : " · Anyone"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canComplete || mut.completeChore.isPending}
                    onClick={() =>
                      mut.completeChore.mutate({ chore, memberId: actorId })
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700 disabled:opacity-40"
                    title={!actorId ? "Pick who is completing first" : undefined}
                  >
                    <CheckCircle2 size={16} />
                    Done
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      mut.updateChore.mutate({ id: chore.id, patch: { is_active: false } })
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && !isMissingKidEconomyTableError(error.message) && (
        <p className="text-center text-red-600">{error.message}</p>
      )}
      {mut.completeChore.error && (
        <p className="text-center text-red-600">{mut.completeChore.error.message}</p>
      )}
    </div>
  );
}
