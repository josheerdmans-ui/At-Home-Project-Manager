import { useState } from "react";
import { ChevronRight, List, Tag, Trash2 } from "lucide-react";
import type { NinjaProgressUpdate } from "./ninja-types";
import {
  countProgressChanges,
  formatReleaseDate,
  NINJA_PROGRESS_CATEGORIES,
  progressSummary,
  progressVersionBadge,
} from "./ninja-types";

type Props = {
  updates: NinjaProgressUpdate[];
  user?: string;
  busy?: boolean;
  emptyText: string;
  onDelete?: (update: NinjaProgressUpdate) => void;
};

export function NinjaProgressNotes({ updates, user, busy, emptyText, onDelete }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (updates.length === 0) {
    return <p className="rounded-2xl border border-white/8 bg-[#1E2028] px-4 py-6 text-sm text-zinc-500">{emptyText}</p>;
  }

  return (
    <ul className="space-y-3">
      {updates.map((update, index) => {
        const open = openId === update.id;
        const categoryLabel =
          NINJA_PROGRESS_CATEGORIES.find((entry) => entry.id === update.category)?.label ?? "Gameplay";
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
                {!open && (
                  <p className="mt-1 truncate text-sm text-zinc-400">{progressSummary(update.body)}</p>
                )}
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
                <ChevronRight size={16} className={`transition ${open ? "rotate-90" : ""}`} />
              </span>
            </button>
            {open && (
              <div className="border-t border-white/8 px-4 py-4">
                <pre className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{update.body}</pre>
                {onDelete && user && update.createdBy === user && (
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
  );
}
