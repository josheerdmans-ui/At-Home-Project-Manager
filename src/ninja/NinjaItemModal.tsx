import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarDays,
  CheckSquare,
  CircleUserRound,
  Clock3,
  FileText,
  Flag,
  Image as ImageIcon,
  Info,
  MessageSquare,
  Tag,
  Trash2,
  Type,
  Upload,
  X,
} from "lucide-react";
import type { NinjaItem, NinjaItemPriority, NinjaItemStage } from "./ninja-types";
import {
  formatActivityTime,
  formatDueDate,
  initialsFromName,
  NINJA_PRIORITIES,
  NINJA_STAGES,
  ninjaImagePublicUrl,
} from "./ninja-types";
import type { NinjaItemInput } from "./useNinjaItems";
import { NINJA, tagStyle } from "./ninja-ui";

type Props = {
  item: NinjaItem;
  ownerOptions: string[];
  busy: boolean;
  uploadError: string | null;
  onClose: () => void;
  onSave: (patch: Partial<NinjaItemInput>, after?: () => void, silent?: boolean) => void;
  onDelete: () => void;
  onUpload: (files: File[]) => void;
  onDeleteImage: (imageId: string) => void;
  onAddCheck: (title: string) => void;
  onToggleCheck: (id: string, done: boolean) => void;
  onDeleteCheck: (id: string) => void;
};

const STAGE_PILL: Record<NinjaItemStage, string> = {
  idea: "bg-cyan-400/15 text-cyan-200",
  working_on: "bg-orange-400/15 text-orange-200",
  confirmed: "bg-fuchsia-400/15 text-fuchsia-200",
  implemented: "bg-emerald-400/15 text-emerald-200",
};

const INFO_MAX = 500;
const DETAILS_MAX = 2000;

export function NinjaItemModal({
  item,
  ownerOptions,
  busy,
  uploadError,
  onClose,
  onSave,
  onDelete,
  onUpload,
  onDeleteImage,
  onAddCheck,
  onToggleCheck,
  onDeleteCheck,
}: Props) {
  const [title, setTitle] = useState(item.title);
  const [owner, setOwner] = useState(item.owner ?? "");
  const [info, setInfo] = useState(item.info);
  const [details, setDetails] = useState(item.details);
  const [stage, setStage] = useState(item.stage);
  const [dueDate, setDueDate] = useState(item.dueDate ?? "");
  const [priority, setPriority] = useState<NinjaItemPriority>(item.priority);
  const [tagDraft, setTagDraft] = useState("");
  const [checkDraft, setCheckDraft] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [addingCheck, setAddingCheck] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(item.title);
    setOwner(item.owner ?? "");
    setInfo(item.info);
    setDetails(item.details);
    setStage(item.stage);
    setDueDate(item.dueDate ?? "");
    setPriority(item.priority);
  }, [item]);

  const currentPatch = (): Partial<NinjaItemInput> | null => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return null;
    return {
      title: trimmedTitle,
      owner: owner.trim() || null,
      info: info.slice(0, INFO_MAX),
      details: details.slice(0, DETAILS_MAX),
      stage,
      dueDate: dueDate || null,
      priority,
      tags: item.tags,
    };
  };

  const isDirty =
    title.trim() !== item.title ||
    (owner.trim() || null) !== item.owner ||
    info !== item.info ||
    details !== item.details ||
    stage !== item.stage ||
    (dueDate || null) !== item.dueDate ||
    priority !== item.priority;

  const save = (e: FormEvent) => {
    e.preventDefault();
    if (!isDirty) {
      onClose();
      return;
    }
    const patch = currentPatch();
    if (patch) onSave(patch, onClose);
  };

  const closeAndSave = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    const patch = currentPatch();
    if (patch) onSave(patch, onClose, true);
    else onClose();
  };

  const takeFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []).filter((file) => file.type.startsWith("image/"));
    if (picked.length === 0) return;
    const tooBig = picked.filter((file) => file.size > 10 * 1024 * 1024);
    const ok = picked.filter((file) => file.size <= 10 * 1024 * 1024);
    if (tooBig.length > 0) {
      alert(
        tooBig.length === 1
          ? `${tooBig[0]!.name} is larger than 10MB.`
          : `${tooBig.length} images are larger than 10MB and were skipped.`,
      );
    }
    if (ok.length > 0) onUpload(ok);
  };

  const addTag = () => {
    const next = tagDraft.trim().toLowerCase();
    if (!next || item.tags.includes(next)) {
      setTagDraft("");
      setAddingTag(false);
      return;
    }
    onSave({ tags: [...item.tags, next] }, undefined, true);
    setTagDraft("");
    setAddingTag(false);
  };

  const doneCount = item.checks.filter((check) => check.done).length;
  const progress = item.checks.length === 0 ? 0 : Math.round((doneCount / item.checks.length) * 100);
  const owners = Array.from(new Set(["", ...ownerOptions, owner].filter((value, index, all) => all.indexOf(value) === index)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <form
        onSubmit={save}
        className="flex max-h-[94vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#16181F]/90 text-[#F3F4F6] shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
      >
        <header className="flex items-start justify-between gap-4 px-7 pt-6 pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF8C42]">Card</p>
            <h2 className="mt-1 text-[28px] leading-none font-black text-white">Edit item</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Update the details, assign owners, and add any relevant information.
            </p>
          </div>
          <button
            type="button"
            onClick={closeAndSave}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-white"
            aria-label="Close card"
          >
            <X size={20} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-7 pb-2">
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
            <div>
              <FieldLabel icon={<Type size={14} />} text="Title" />
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`mb-4 w-full ${NINJA.input}`}
              />

              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel icon={<CircleUserRound size={14} />} text="Owner" />
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#16181F] px-3 py-2">
                    <Avatar name={owner || "Unassigned"} />
                    <select
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-white outline-none [color-scheme:dark]"
                    >
                      <option value="" className="bg-[#1E2028]">
                        Unassigned
                      </option>
                      {owners
                        .filter((name) => name)
                        .map((name) => (
                          <option key={name} value={name} className="bg-[#1E2028]">
                            {name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <input
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Or type a name"
                    className={`mt-2 w-full ${NINJA.input} py-2 text-xs`}
                  />
                </div>
                <div>
                  <FieldLabel icon={<Clock3 size={14} />} text="Status" />
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as NinjaItemStage)}
                    className={`w-full rounded-xl border-0 px-3 py-2.5 text-sm font-bold outline-none [color-scheme:dark] ${STAGE_PILL[stage]}`}
                  >
                    {NINJA_STAGES.map((entry) => (
                      <option key={entry.id} value={entry.id} className="bg-[#1E2028] text-white">
                        {entry.id === "idea" ? "💡 " : ""}
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel icon={<CalendarDays size={14} />} text="Due date" />
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#16181F] px-3 py-2.5 text-sm text-white">
                    <CalendarDays size={15} className="text-zinc-500" />
                    <span className="min-w-20 text-zinc-300">{formatDueDate(dueDate || null)}</span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none [color-scheme:dark]"
                    />
                  </label>
                </div>
                <div>
                  <FieldLabel icon={<Flag size={14} />} text="Priority" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NinjaItemPriority)}
                    className={`w-full ${NINJA.input} font-semibold [color-scheme:dark]`}
                  >
                    {NINJA_PRIORITIES.map((entry) => (
                      <option key={entry.id} value={entry.id} className="bg-[#1E2028] text-white">
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FieldLabel icon={<Tag size={14} />} text="Tags / Category" />
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#16181F] px-3 py-2.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tagStyle(tag)}`}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => onSave({ tags: item.tags.filter((value) => value !== tag) }, undefined, true)}
                      className="text-current/70 hover:text-white"
                      aria-label={`Remove ${tag}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {addingTag ? (
                  <input
                    autoFocus
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onBlur={addTag}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="w-28 bg-transparent text-xs outline-none"
                    placeholder="tag name"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingTag(true)}
                    className="text-xs font-semibold text-zinc-400 hover:text-[#FF8C42]"
                  >
                    + Add tag
                  </button>
                )}
              </div>

              <FieldLabel icon={<Info size={14} />} text="Info" />
              <div className="relative mb-4">
                <textarea
                  rows={3}
                  maxLength={INFO_MAX}
                  value={info}
                  onChange={(e) => setInfo(e.target.value.slice(0, INFO_MAX))}
                  className={`w-full pr-16 ${NINJA.input}`}
                />
                <span className="absolute right-3 bottom-2 text-[11px] text-zinc-500">
                  {info.length}/{INFO_MAX}
                </span>
              </div>

              <FieldLabel icon={<FileText size={14} />} text="Details" />
              <div className="relative">
                <textarea
                  rows={6}
                  maxLength={DETAILS_MAX}
                  value={details}
                  onChange={(e) => setDetails(e.target.value.slice(0, DETAILS_MAX))}
                  className={`w-full pr-16 ${NINJA.input}`}
                />
                <span className="absolute right-3 bottom-2 text-[11px] text-zinc-500">
                  {details.length}/{DETAILS_MAX}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <section className="rounded-2xl border border-white/10 bg-[#1E2028]/70 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <FieldLabel icon={<CheckSquare size={14} />} text="Checklist" className="mb-0" />
                  <span className="text-xs font-medium text-zinc-500">
                    {doneCount} of {item.checks.length} completed
                  </span>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#FF8C42]" style={{ width: `${progress}%` }} />
                </div>
                <ul className="space-y-2">
                  {item.checks.map((check) => (
                    <li key={check.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={check.done}
                        disabled={busy}
                        onChange={() => onToggleCheck(check.id, !check.done)}
                        className="h-4 w-4 rounded border-white/20 bg-transparent text-[#FF8C42]"
                      />
                      <span className={`flex-1 text-sm ${check.done ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                        {check.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteCheck(check.id)}
                        className="text-zinc-600 hover:text-rose-400"
                        aria-label={`Remove ${check.title}`}
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
                {addingCheck ? (
                  <input
                    autoFocus
                    value={checkDraft}
                    onChange={(e) => setCheckDraft(e.target.value)}
                    onBlur={() => {
                      const next = checkDraft.trim();
                      if (next) onAddCheck(next);
                      setCheckDraft("");
                      setAddingCheck(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const next = checkDraft.trim();
                        if (next) onAddCheck(next);
                        setCheckDraft("");
                        setAddingCheck(false);
                      }
                    }}
                    placeholder="Checklist item"
                    className={`mt-3 w-full ${NINJA.input}`}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingCheck(true)}
                    className="mt-3 text-sm font-semibold text-zinc-400 hover:text-[#FF8C42]"
                  >
                    + Add checklist item
                  </button>
                )}
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#1E2028]/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <FieldLabel icon={<ImageIcon size={14} />} text="Images" className="mb-0" />
                  <span className="text-xs font-medium text-zinc-500">
                    {item.images.length} image{item.images.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {item.images.map((image) => (
                    <div key={image.id} className="relative overflow-hidden rounded-lg">
                      <img
                        src={ninjaImagePublicUrl(image.filePath)}
                        alt={image.fileName}
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onDeleteImage(image.id)}
                        className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1 text-zinc-300 shadow-sm hover:text-rose-400"
                        aria-label={`Remove ${image.fileName}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "copy";
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      takeFiles(event.dataTransfer.files);
                    }}
                    className="flex h-28 flex-col items-center justify-center rounded-xl border border-dashed border-[#FF8C42]/40 bg-[#FF8C42]/8 text-zinc-400 hover:border-[#FF8C42] hover:text-[#FF8C42]"
                  >
                    <Upload size={18} />
                    <span className="mt-1 text-xs font-semibold">Upload images</span>
                    <span className="mt-0.5 text-[10px] text-zinc-500">JPG, PNG, GIF · several at once · 10MB each</span>
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    takeFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                {uploadError && <p className="mt-2 text-sm font-medium text-rose-400">{uploadError}</p>}
              </section>

              <section className="rounded-2xl border border-white/10 bg-[#1E2028]/70 p-4">
                <FieldLabel icon={<MessageSquare size={14} />} text="Activity" />
                {item.activity.length === 0 ? (
                  <p className="text-sm text-zinc-500">No activity yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {item.activity.map((entry) => (
                      <li key={entry.id} className="flex gap-2.5">
                        <Avatar name={entry.actor} />
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {entry.actor}{" "}
                            <span className="font-medium text-zinc-500">{formatActivityTime(entry.createdAt)}</span>
                          </p>
                          <p className="text-sm text-zinc-400">{entry.message}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/8 px-7 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-3 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Delete card
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeAndSave}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={busy || title.trim().length === 0}
              className={`rounded-xl px-5 py-2 text-sm font-bold disabled:opacity-50 ${NINJA.orangeBtn}`}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}

function FieldLabel({
  icon,
  text,
  className = "mb-1.5",
}: {
  icon: ReactNode;
  text: string;
  className?: string;
}) {
  return (
    <p className={`flex items-center gap-1.5 text-sm font-semibold text-zinc-300 ${className}`}>
      <span className="text-zinc-500">{icon}</span>
      {text}
    </p>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FF8C42]/20 text-[10px] font-bold text-[#FF8C42]">
      {name === "Unassigned" ? <CircleUserRound size={14} /> : initialsFromName(name)}
    </span>
  );
}
