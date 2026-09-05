import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  FileText,
  History,
  List,
  Search,
  Send,
  Tag,
  Trash2,
} from "lucide-react";
import type { NinjaProgressCategory, NinjaProgressUpdate } from "./ninja-types";
import {
  countProgressChanges,
  formatReleaseDate,
  NINJA_PROGRESS_CATEGORIES,
  progressSummary,
  progressVersionBadge,
} from "./ninja-types";
import { NINJA } from "./ninja-ui";

const NOTES_MAX = 2000;

type Props = {
  user: string;
  updates: NinjaProgressUpdate[];
  loading: boolean;
  error: string | null;
  busy: boolean;
  onPublish: (input: {
    version: string;
    title: string;
    releasedOn: string;
    category: NinjaProgressCategory;
    body: string;
  }) => void;
  onDelete: (update: NinjaProgressUpdate) => void;
};

function todayIsoDate(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function NinjaGodotProgress({
  user,
  updates,
  loading,
  error,
  busy,
  onPublish,
  onDelete,
}: Props) {
  const versionRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLElement>(null);
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [releasedOn, setReleasedOn] = useState(todayIsoDate);
  const [category, setCategory] = useState<NinjaProgressCategory>("gameplay");
  const [body, setBody] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | NinjaProgressCategory>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return updates.filter((update) => {
      if (filter !== "all" && update.category !== filter) return false;
      if (!needle) return true;
      return (
        update.version.toLowerCase().includes(needle) ||
        update.title.toLowerCase().includes(needle) ||
        update.body.toLowerCase().includes(needle)
      );
    });
  }, [filter, search, updates]);

  const canPublish =
    version.trim().length > 0 &&
    title.trim().length > 0 &&
    releasedOn.length > 0 &&
    body.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canPublish) return;
    onPublish({
      version: version.trim(),
      title: title.trim(),
      releasedOn,
      category,
      body: body.trim(),
    });
    setTitle("");
    setBody("");
    setVersion(version.trim());
  };

  const focusNew = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    versionRef.current?.focus();
  };

  return (
    <div className="min-h-0 flex-1 overflow-auto pb-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Godot Progress</h1>
          <p className="mt-2 text-sm text-zinc-400">Track each build, change, and milestone.</p>
        </div>
        <button
          type="button"
          onClick={focusNew}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${NINJA.orangeBtn}`}
        >
          + New update
        </button>
      </header>

      <section
        ref={formRef}
        className="rounded-2xl border border-white/8 bg-[#1E2028] p-6"
      >
        <div className="mb-5 flex items-start gap-3">
          <span className="mt-0.5 text-zinc-400">
            <FileText size={18} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Create a new update</h2>
            <p className="mt-0.5 text-sm text-zinc-500">Share what's changed in Ninja Survivors.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
            <LabeledField label="Version" required>
              <input
                ref={versionRef}
                value={version}
                maxLength={40}
                onChange={(event) => setVersion(event.target.value)}
                placeholder="e.g. V.0.3"
                className={fieldClass}
              />
            </LabeledField>
            <LabeledField label="Update title" required>
              <input
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. New Enemy Type"
                className={fieldClass}
              />
            </LabeledField>
            <LabeledField label="Release date" required>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#16181F] px-3">
                <CalendarDays size={16} className="shrink-0 text-zinc-500" />
                <input
                  type="date"
                  value={releasedOn}
                  onChange={(event) => setReleasedOn(event.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm text-white outline-none [color-scheme:dark]"
                />
              </div>
            </LabeledField>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-zinc-300">
              Category <span className="text-rose-400">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {NINJA_PROGRESS_CATEGORIES.map((entry) => {
                const active = category === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setCategory(entry.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                      active
                        ? "border-[#FF8C42] bg-[#FF8C42]/15 text-[#FF8C42]"
                        : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    {entry.label}
                  </button>
                );
              })}
            </div>
          </div>

          <LabeledField label="Update notes" required>
            <div className="relative">
              <textarea
                rows={7}
                maxLength={NOTES_MAX}
                value={body}
                onChange={(event) => setBody(event.target.value.slice(0, NOTES_MAX))}
                placeholder="Write a summary of the changes, improvements, or fixes..."
                className={`${fieldClass} min-h-36 resize-y`}
              />
              <span className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-zinc-500">
                {body.length}/{NOTES_MAX}
              </span>
            </div>
          </LabeledField>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy || !canPublish}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-50 ${NINJA.orangeBtn}`}
            >
              Publish update
              <Send size={14} />
            </button>
          </div>
        </form>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-zinc-400">
              <History size={18} />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Update history</h2>
              <p className="mt-0.5 text-sm text-zinc-500">All published versions of Ninja Survivors.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#1E2028] px-3 py-2 text-sm text-zinc-400">
              <Search size={15} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search updates..."
                className="w-44 bg-transparent text-white outline-none placeholder:text-zinc-500"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
              {NINJA_PROGRESS_CATEGORIES.map((entry) => (
                <FilterChip
                  key={entry.id}
                  label={entry.label}
                  active={filter === entry.id}
                  onClick={() => setFilter(entry.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mb-4 text-sm font-medium text-rose-400">{error}</p>}

        {loading ? (
          <p className="text-sm text-zinc-500">Loading updates...</p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-white/8 bg-[#1E2028] px-4 py-6 text-sm text-zinc-500">
            {updates.length === 0
              ? "No published versions yet. Post the first update above."
              : "No updates match that search."}
          </p>
        ) : (
          <ul className="space-y-3">
            {filtered.map((update, index) => {
              const open = openId === update.id;
              const categoryLabel =
                NINJA_PROGRESS_CATEGORIES.find((entry) => entry.id === update.category)?.label ??
                "Gameplay";
              const changes = countProgressChanges(update.body);
              return (
                <li key={update.id} className="rounded-2xl border border-white/8 bg-[#1E2028]">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : update.id)}
                    className="flex w-full items-center gap-4 px-4 py-4 text-left"
                  >
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${progressVersionBadge(update.version, index)}`}
                    >
                      {update.version}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-white">{update.title || "Untitled update"}</p>
                      <p className="mt-0.5 text-sm text-zinc-500">{formatReleaseDate(update.releasedOn)}</p>
                      <p className="mt-1 truncate text-sm text-zinc-400">{progressSummary(update.body)}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Tag size={12} className="text-zinc-500" />
                          <span className="rounded-full border border-[#FF8C42]/50 px-2 py-0.5 font-semibold text-[#FF8C42]">
                            {categoryLabel}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <List size={12} className="text-zinc-500" />
                          {changes} change{changes === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-400">
                      <ChevronRight size={16} className={open ? "rotate-90 transition" : "transition"} />
                    </span>
                  </button>
                  {open && (
                    <div className="border-t border-white/8 px-4 py-4">
                      <pre className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                        {update.body}
                      </pre>
                      {update.createdBy === user && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => onDelete(update)}
                          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 size={14} />
                          Delete update
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

const fieldClass =
  "w-full rounded-lg border border-white/10 bg-[#16181F] px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#FF8C42]";

function LabeledField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-300">
        {label}
        {required ? <span className="text-rose-400"> *</span> : null}
      </p>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        active
          ? "border-[#FF8C42] bg-transparent text-[#FF8C42]"
          : "border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );
}
