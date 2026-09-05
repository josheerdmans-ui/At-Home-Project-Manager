import { useMemo, useState, type FormEvent } from "react";
import { Heart, LayoutDashboard, Plus, SquareArrowUpRight, Trash2 } from "lucide-react";
import type { NinjaIdea, NinjaItem, NinjaItemArea, NinjaProgressUpdate } from "./ninja-types";
import { formatActivityTime, initialsFromName, NINJA_AREAS, NINJA_STAGES } from "./ninja-types";
import { NinjaProgressNotes } from "./NinjaProgressNotes";
import { NINJA } from "./ninja-ui";

type Props = {
  user: string;
  items: NinjaItem[];
  ideas: NinjaIdea[];
  ideasLoading: boolean;
  ideasError: string | null;
  busy: boolean;
  onOpenItem: (item: NinjaItem) => void;
  onAddIdea: (title: string) => void;
  onVote: (idea: NinjaIdea) => void;
  onPromoteIdea: (idea: NinjaIdea, area: NinjaItemArea) => void;
  onDeleteIdea: (idea: NinjaIdea) => void;
  updates: NinjaProgressUpdate[];
  updatesLoading: boolean;
  updatesError: string | null;
};

export function NinjaDashboard({
  user,
  items,
  ideas,
  ideasLoading,
  ideasError,
  busy,
  onOpenItem,
  onAddIdea,
  onVote,
  onPromoteIdea,
  onDeleteIdea,
  updates,
  updatesLoading,
  updatesError,
}: Props) {
  const [draft, setDraft] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);
  const recent = useMemo(
    () =>
      items
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8),
    [items],
  );
  const rankedIdeas = useMemo(
    () =>
      ideas
        .slice()
        .sort((a, b) => b.voters.length - a.voters.length || b.createdAt.localeCompare(a.createdAt)),
    [ideas],
  );

  const submitIdea = (event: FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    onAddIdea(title);
    setDraft("");
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto pb-4">
      <section className="mb-5 rounded-3xl border border-white/10 bg-[#16181F]/80 p-5">
        <h2 className="text-sm font-bold text-white">Quick ideas</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Drop a thought. Heart the ones you like. If you posted it, click it to move it onto a
          board and turn it into a real card.
        </p>

        <form onSubmit={submitIdea} className="mt-4 flex gap-2">
          <input
            value={draft}
            maxLength={200}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="A boss that steals your upgrades..."
            className={`min-w-0 flex-1 ${NINJA.input}`}
          />
          <button
            type="submit"
            disabled={busy || draft.trim().length === 0}
            className={`inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-bold disabled:opacity-50 ${NINJA.orangeBtn}`}
          >
            <Plus size={14} />
            Add
          </button>
        </form>

        {ideasError && <p className="mt-3 text-sm font-medium text-rose-400">{ideasError}</p>}

        {ideasLoading ? (
          <p className="mt-4 text-sm text-zinc-500">Loading ideas...</p>
        ) : rankedIdeas.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No ideas yet. Add the first one.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {rankedIdeas.map((idea) => {
              const voted = idea.voters.includes(user);
              return (
                <li
                  key={idea.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-[#1E2028] px-3 py-3"
                >
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onVote(idea)}
                    className={`flex w-12 shrink-0 flex-col items-center rounded-xl border px-1 py-1.5 ${
                      voted
                        ? "border-rose-400/50 bg-rose-500/15 text-rose-400"
                        : "border-white/10 text-zinc-400 hover:border-rose-400/40 hover:text-rose-400"
                    }`}
                    aria-label={voted ? "Remove heart" : "Heart this idea"}
                  >
                    <Heart size={16} fill={voted ? "currentColor" : "none"} />
                    <span className="text-xs font-black">{idea.voters.length}</span>
                  </button>
                  <div className="min-w-0 flex-1">
                    {idea.createdBy === user ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setMovingId(movingId === idea.id ? null : idea.id)}
                        className="text-left text-sm font-semibold text-white hover:text-[#FF8C42]"
                      >
                        {idea.title}
                      </button>
                    ) : (
                      <p className="text-sm font-semibold text-white">{idea.title}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FF8C42]/20 text-[9px] font-bold text-[#FF8C42]">
                        {initialsFromName(idea.createdBy)}
                      </span>
                      <span>{idea.createdBy}</span>
                      <span>·</span>
                      <span>{formatActivityTime(idea.createdAt)}</span>
                    </div>
                    {movingId === idea.id && idea.createdBy === user && (
                      <div className="mt-3 rounded-xl border border-white/10 bg-[#16181F] p-2">
                        <p className="px-1 pb-2 text-[11px] font-semibold text-zinc-400">
                          Move to a board and open as a card
                        </p>
                        <div className="flex flex-col gap-1">
                          {NINJA_AREAS.map((entry) => (
                            <button
                              key={entry.id}
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setMovingId(null);
                                onPromoteIdea(idea, entry.id);
                              }}
                              className="rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-zinc-200 hover:bg-[#FF8C42]/15 hover:text-[#FF8C42]"
                            >
                              {entry.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {idea.voters.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-medium text-rose-300/80">Hearted by</span>
                        {idea.voters.map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-rose-200"
                            title={name}
                          >
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-rose-500/20 text-[8px] font-bold text-rose-300">
                              {initialsFromName(name)}
                            </span>
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {idea.createdBy === user && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setMovingId(movingId === idea.id ? null : idea.id)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-[#FF8C42]"
                        aria-label={`Move ${idea.title} to a board`}
                        title="Move to a board"
                      >
                        <SquareArrowUpRight size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onDeleteIdea(idea)}
                        className="rounded-lg p-1.5 text-zinc-600 hover:bg-white/5 hover:text-rose-400"
                        aria-label={`Delete ${idea.title}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-4">
        <section className="rounded-3xl border border-white/10 bg-[#16181F]/80 p-5">
          <h2 className="text-sm font-bold text-white">Patch notes</h2>
          <p className="mt-1 text-xs text-zinc-500">Published Godot updates. Click one to read it.</p>

          {updatesError && <p className="mt-3 text-sm font-medium text-rose-400">{updatesError}</p>}

          <div className="mt-4">
            {updatesLoading ? (
              <p className="text-sm text-zinc-500">Loading updates...</p>
            ) : (
              <NinjaProgressNotes
                updates={updates}
                emptyText="No patch notes yet. Publish one from Godot Progress."
              />
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#16181F]/80 p-5">
          <div className="mb-4 flex items-center gap-2">
            <LayoutDashboard size={16} className="text-[#FF8C42]" />
            <h2 className="text-sm font-bold text-white">Most recent additions</h2>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-zinc-500">No cards yet. Open a board and add the first one.</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((item) => {
                const area = NINJA_AREAS.find((entry) => entry.id === item.area)?.label ?? item.area;
                const stage = NINJA_STAGES.find((entry) => entry.id === item.stage)?.label ?? item.stage;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onOpenItem(item)}
                      className="flex w-full items-start justify-between gap-3 rounded-2xl border border-white/5 bg-[#1E2028] px-3 py-3 text-left hover:border-[#FF8C42]/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {area} · {stage}
                          {item.owner ? ` · ${item.owner}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-zinc-500">
                        {formatActivityTime(item.createdAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
