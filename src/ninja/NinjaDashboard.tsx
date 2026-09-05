import { useMemo, useState, type FormEvent } from "react";
import { Heart, LayoutDashboard, Plus, SquareArrowUpRight, Trash2 } from "lucide-react";
import type { NinjaIdea, NinjaItem, NinjaItemArea, NinjaProgressUpdate } from "./ninja-types";
import {
  formatActivityTime,
  initialsFromName,
  NINJA_AREAS,
  NINJA_STAGES,
} from "./ninja-types";
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
  onAddUpdate: (input: { version: string; title: string; body: string }) => void;
  onDeleteUpdate: (update: NinjaProgressUpdate) => void;
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
  onAddUpdate,
  onDeleteUpdate,
}: Props) {
  const [draft, setDraft] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [version, setVersion] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
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

  const submitUpdate = (event: FormEvent) => {
    event.preventDefault();
    const nextVersion = version.trim();
    const title = updateTitle.trim();
    const body = updateBody.trim();
    if (!nextVersion || !title || !body) return;
    onAddUpdate({ version: nextVersion, title, body });
    setUpdateTitle("");
    setUpdateBody("");
    setVersion(nextVersion);
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

        <section className="rounded-3xl border border-white/10 bg-[#16181F]/80 p-5">
          <h2 className="text-sm font-bold text-white">Godot progress</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Push an update each time a new version lands in Godot so the studio can see what changed.
          </p>

          <form onSubmit={submitUpdate} className="mt-4 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                value={version}
                maxLength={40}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="Version — v0.4"
                className={NINJA.input}
              />
              <input
                value={updateTitle}
                maxLength={120}
                onChange={(event) => setUpdateTitle(event.target.value)}
                placeholder="Name — Combat pass, first playable..."
                className={NINJA.input}
              />
            </div>
            <textarea
              value={updateBody}
              maxLength={20000}
              rows={14}
              onChange={(event) => setUpdateBody(event.target.value)}
              placeholder="Paste the full Godot update notes here..."
              className={`${NINJA.input} min-h-56 resize-y font-mono text-xs leading-5`}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-zinc-500">{updateBody.length}/20000</span>
              <button
                type="submit"
                disabled={
                  busy ||
                  version.trim().length === 0 ||
                  updateTitle.trim().length === 0 ||
                  updateBody.trim().length === 0
                }
                className={`inline-flex items-center justify-center gap-1 rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-50 ${NINJA.orangeBtn}`}
              >
                <Plus size={14} />
                Post update
              </button>
            </div>
          </form>

          {updatesError && <p className="mt-3 text-sm font-medium text-rose-400">{updatesError}</p>}

          {updatesLoading ? (
            <p className="mt-4 text-sm text-zinc-500">Loading updates...</p>
          ) : updates.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">No Godot versions posted yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {updates.map((update) => (
                <li
                  key={update.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/5 bg-[#1E2028] px-3 py-3"
                >
                  <span className="shrink-0 rounded-full bg-[#FF8C42]/15 px-2.5 py-1 text-xs font-black text-[#FF8C42]">
                    {update.version}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{update.title || "Untitled update"}</p>
                    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-zinc-300">
                      {update.body}
                    </pre>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FF8C42]/20 text-[9px] font-bold text-[#FF8C42]">
                        {initialsFromName(update.createdBy)}
                      </span>
                      <span>{update.createdBy}</span>
                      <span>·</span>
                      <span>{formatActivityTime(update.createdAt)}</span>
                    </div>
                  </div>
                  {update.createdBy === user && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDeleteUpdate(update)}
                      className="rounded-lg p-1.5 text-zinc-600 hover:bg-white/5 hover:text-rose-400"
                      aria-label={`Delete ${update.version} update`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
