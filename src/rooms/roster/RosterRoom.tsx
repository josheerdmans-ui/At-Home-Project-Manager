import { useState, type FormEvent } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import type { MemberColorToken } from "../../../types";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { WALL_DISPLAY_SETUP_SQL } from "../../lib/wall-display-setup-sql";
import {
  MEMBER_COLOR_STYLES,
  MEMBER_COLOR_TOKENS,
  colorStyle,
} from "../../lib/member-colors";
import {
  isMissingMembersTableError,
  useHouseholdMembers,
  useHouseholdMembersMutations,
} from "../../hooks/useHouseholdMembers";

export function RosterRoom() {
  const { data: members = [], error, isLoading } = useHouseholdMembers();
  const { createMember, updateMember, deleteMember } = useHouseholdMembersMutations();
  const [name, setName] = useState("");
  const [color, setColor] = useState<MemberColorToken>("sky");

  if (error && isMissingMembersTableError(error.message)) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <DbSetupPanel title="Family wall database setup" sql={WALL_DISPLAY_SETUP_SQL} />
      </div>
    );
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const display_name = name.trim();
    if (!display_name) return;
    createMember.mutate(
      { display_name, color_token: color, sort_order: members.length },
      {
        onSuccess: () => {
          setName("");
          setColor("sky");
        },
      },
    );
  };

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col gap-6 overflow-auto p-6 sm:p-10">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-cyan-100 p-4 text-cyan-700">
          <Users size={36} />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800 sm:text-4xl">Family Roster</h1>
          <p className="mt-1 text-slate-500">People and colors for the wall calendar.</p>
        </div>
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-3xl border border-white/60 bg-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl"
      >
        <label className="mb-1.5 block text-sm font-semibold text-slate-600">Add person</label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-slate-800 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200"
          />
          <div className="flex flex-wrap gap-2">
            {MEMBER_COLOR_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                title={MEMBER_COLOR_STYLES[token].label}
                onClick={() => setColor(token)}
                className={`h-9 w-9 rounded-full border-2 ${MEMBER_COLOR_STYLES[token].solid} ${
                  color === token ? "scale-110 border-slate-800 shadow-md" : "border-white/80"
                }`}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={createMember.isPending || !name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 font-bold text-white shadow-md transition hover:bg-orange-600 disabled:opacity-50"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </form>

      {isLoading && <p className="text-slate-500">Loading family…</p>}
      {error && !isMissingMembersTableError(error.message) && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
          {error.message}
        </p>
      )}

      {!isLoading && members.length === 0 && !error && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/40 px-6 py-12 text-center text-slate-600">
          No household members yet. Add people here so calendar events can be color-coded.
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {members.map((m) => {
          const style = colorStyle(m.color_token);
          return (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-md"
            >
              <span className={`h-4 w-4 shrink-0 rounded-full ${style.solid}`} />
              <input
                type="text"
                defaultValue={m.display_name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== m.display_name) {
                    updateMember.mutate({ id: m.id, patch: { display_name: v } });
                  }
                }}
                className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-lg font-semibold text-slate-800 outline-none focus:border-slate-200 focus:bg-white"
              />
              <div className="flex flex-wrap gap-1.5">
                {MEMBER_COLOR_TOKENS.map((token) => (
                  <button
                    key={token}
                    type="button"
                    title={MEMBER_COLOR_STYLES[token].label}
                    onClick={() =>
                      updateMember.mutate({ id: m.id, patch: { color_token: token } })
                    }
                    className={`h-7 w-7 rounded-full border-2 ${MEMBER_COLOR_STYLES[token].solid} ${
                      m.color_token === token ? "border-slate-800" : "border-white/70 opacity-70"
                    }`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove ${m.display_name}?`)) deleteMember.mutate(m.id);
                }}
                className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 transition hover:bg-rose-100"
                aria-label={`Delete ${m.display_name}`}
              >
                <Trash2 size={18} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
