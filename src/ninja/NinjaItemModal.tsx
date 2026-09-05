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

type Props = {
  item: NinjaItem;
  ownerOptions: string[];
  busy: boolean;
  uploadError: string | null;
  onClose: () => void;
  onSave: (patch: Partial<NinjaItemInput>, after?: () => void, silent?: boolean) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
  onDeleteImage: (imageId: string) => void;
  onAddCheck: (title: string) => void;
  onToggleCheck: (id: string, done: boolean) => void;
  onDeleteCheck: (id: string) => void;
};

const STAGE_PILL: Record<NinjaItemStage, string> = {
  idea: "bg-sky-100 text-sky-800",
  working_on: "bg-orange-100 text-[#c2410c]",
  confirmed: "bg-violet-100 text-violet-800",
  implemented: "bg-emerald-100 text-emerald-800",
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
    const patch = currentPatch();
    if (patch) onSave(patch);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-[2px]">
      <form
        onSubmit={save}
        className="flex max-h-[94vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]"
      >
        <header className="flex items-start justify-between gap-4 px-7 pt-6 pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#FF6A00]">Card</p>
            <h2 className="mt-1 text-[28px] leading-none font-black text-slate-900">Edit item</h2>
            <p className="mt-2 text-sm text-slate-500">
              Update the details, assign owners, and add any relevant information.
            </p>
          </div>
          <button
            type="button"
            onClick={closeAndSave}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
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
                className="mb-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#FF6A00]"
              />

              <div className="mb-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel icon={<CircleUserRound size={14} />} text="Owner" />
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                    <Avatar name={owner || "Unassigned"} />
                    <select
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
                    >
                      <option value="">Unassigned</option>
                      {owners
                        .filter((name) => name)
                        .map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <input
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Or type a name"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#FF6A00]"
                  />
                </div>
                <div>
                  <FieldLabel icon={<Clock3 size={14} />} text="Status" />
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as NinjaItemStage)}
                    className={`w-full rounded-lg border-0 px-3 py-2.5 text-sm font-bold outline-none ${STAGE_PILL[stage]}`}
                  >
                    {NINJA_STAGES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
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
                  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800">
                    <CalendarDays size={15} className="text-slate-400" />
                    <span className="min-w-20 text-slate-700">{formatDueDate(dueDate || null)}</span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </label>
                </div>
                <div>
                  <FieldLabel icon={<Flag size={14} />} text="Priority" />
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as NinjaItemPriority)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none"
                  >
                    {NINJA_PRIORITIES.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <FieldLabel icon={<Tag size={14} />} text="Tags / Category" />
              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => onSave({ tags: item.tags.filter((value) => value !== tag) }, undefined, true)}
                      className="text-slate-400 hover:text-slate-700"
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
                    className="text-xs font-semibold text-slate-500 hover:text-[#FF6A00]"
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-16 text-sm text-slate-800 outline-none focus:border-[#FF6A00]"
                />
                <span className="absolute right-3 bottom-2 text-[11px] text-slate-400">
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-16 text-sm text-slate-800 outline-none focus:border-[#FF6A00]"
                />
                <span className="absolute right-3 bottom-2 text-[11px] text-slate-400">
                  {details.length}/{DETAILS_MAX}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <section className="rounded-xl border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <FieldLabel icon={<CheckSquare size={14} />} text="Checklist" className="mb-0" />
                  <span className="text-xs font-medium text-slate-500">
                    {doneCount} of {item.checks.length} completed
                  </span>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                </div>
                <ul className="space-y-2">
                  {item.checks.map((check) => (
                    <li key={check.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={check.done}
                        disabled={busy}
                        onChange={() => onToggleCheck(check.id, !check.done)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600"
                      />
                      <span className={`flex-1 text-sm ${check.done ? "text-slate-400 line-through" : "text-slate-800"}`}>
                        {check.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDeleteCheck(check.id)}
                        className="text-slate-300 hover:text-red-500"
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
                    className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAddingCheck(true)}
                    className="mt-3 text-sm font-semibold text-slate-500 hover:text-[#FF6A00]"
                  >
                    + Add checklist item
                  </button>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <FieldLabel icon={<ImageIcon size={14} />} text="Images" className="mb-0" />
                  <span className="text-xs font-medium text-slate-500">
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
                        className="absolute top-1.5 right-1.5 rounded-full bg-white/90 p-1 text-slate-500 shadow-sm hover:text-red-600"
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
                    className="flex h-28 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-[#FF6A00] hover:text-[#FF6A00]"
                  >
                    <Upload size={18} />
                    <span className="mt-1 text-xs font-semibold">Upload images</span>
                    <span className="mt-0.5 text-[10px] text-slate-400">JPG, PNG, GIF (Max 10MB)</span>
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file && file.size > 10 * 1024 * 1024) {
                      alert("Image must be 10MB or smaller.");
                      return;
                    }
                    if (file) onUpload(file);
                  }}
                />
                {uploadError && <p className="mt-2 text-sm font-medium text-red-600">{uploadError}</p>}
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <FieldLabel icon={<MessageSquare size={14} />} text="Activity" />
                {item.activity.length === 0 ? (
                  <p className="text-sm text-slate-400">No activity yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {item.activity.map((entry) => (
                      <li key={entry.id} className="flex gap-2.5">
                        <Avatar name={entry.actor} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {entry.actor}{" "}
                            <span className="font-medium text-slate-400">{formatActivityTime(entry.createdAt)}</span>
                          </p>
                          <p className="text-sm text-slate-500">{entry.message}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-100 px-7 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 size={15} />
            Delete card
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeAndSave}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={busy || title.trim().length === 0}
              className="rounded-lg bg-[#FF6A00] px-5 py-2 text-sm font-bold text-white hover:bg-[#e65f00] disabled:opacity-50"
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
    <p className={`flex items-center gap-1.5 text-sm font-semibold text-slate-700 ${className}`}>
      <span className="text-slate-400">{icon}</span>
      {text}
    </p>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">
      {name === "Unassigned" ? <CircleUserRound size={14} /> : initialsFromName(name)}
    </span>
  );
}
