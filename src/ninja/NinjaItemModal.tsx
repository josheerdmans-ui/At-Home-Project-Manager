import { useEffect, useRef, useState, type FormEvent } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import type { NinjaItem, NinjaItemStage } from "./ninja-types";
import { NINJA_STAGES, ninjaImagePublicUrl } from "./ninja-types";
import type { NinjaItemInput } from "./useNinjaItems";

type Props = {
  item: NinjaItem;
  busy: boolean;
  uploadError: string | null;
  onClose: () => void;
  onSave: (patch: Partial<NinjaItemInput>) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
  onDeleteImage: (imageId: string) => void;
};

const STAGE_PILL: Record<NinjaItemStage, string> = {
  idea: "bg-sky-100 text-sky-800",
  working_on: "bg-orange-100 text-[#c2410c]",
  confirmed: "bg-violet-100 text-violet-800",
  implemented: "bg-emerald-100 text-emerald-800",
};

export function NinjaItemModal({
  item,
  busy,
  uploadError,
  onClose,
  onSave,
  onDelete,
  onUpload,
  onDeleteImage,
}: Props) {
  const [title, setTitle] = useState(item.title);
  const [owner, setOwner] = useState(item.owner ?? "");
  const [info, setInfo] = useState(item.info);
  const [details, setDetails] = useState(item.details);
  const [stage, setStage] = useState(item.stage);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(item.title);
    setOwner(item.owner ?? "");
    setInfo(item.info);
    setDetails(item.details);
    setStage(item.stage);
  }, [item]);

  const save = (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    onSave({
      title: trimmedTitle,
      owner: owner.trim() || null,
      info: info.trim(),
      details: details.trim(),
      stage,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
      <form
        onSubmit={save}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white bg-white/80 shadow-[0_20px_50px_rgb(0,0,0,0.16)] backdrop-blur-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/80 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF6A00]">Card</p>
            <h2 className="text-xl font-black text-slate-800">Edit item</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-white hover:text-slate-800"
            aria-label="Close card"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-600">
            Title
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white bg-white/80 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-[#FF6A00]"
            />
          </label>

          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
              Owner
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Who’s on it?"
                className="mt-1 w-full rounded-xl border border-white bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#FF6A00]"
              />
            </label>
            <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
              Status
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as NinjaItemStage)}
                className={`mt-1 w-full rounded-xl border-0 px-3 py-2.5 text-xs font-black uppercase tracking-wide outline-none ${STAGE_PILL[stage]}`}
              >
                {NINJA_STAGES.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="mb-3 block text-xs font-bold uppercase tracking-wide text-slate-600">
            Info
            <textarea
              rows={3}
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              placeholder="What is this idea?"
              className="mt-1 w-full rounded-xl border border-white bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#FF6A00]"
            />
          </label>

          <label className="mb-5 block text-xs font-bold uppercase tracking-wide text-slate-600">
            Details
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Notes, specs, or how it should work"
              className="mt-1 w-full rounded-xl border border-white bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-[#FF6A00]"
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Images</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6A00] px-3 py-1.5 text-xs font-black text-white hover:bg-[#e65f00] disabled:opacity-50"
              >
                <ImagePlus size={14} />
                Upload
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) onUpload(file);
                }}
              />
            </div>
            {item.images.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white/50 px-4 py-8 text-center text-sm font-medium text-slate-500">
                No images yet — upload a reference, sketch, or screenshot.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {item.images.map((image) => (
                  <li
                    key={image.id}
                    className="group relative overflow-hidden rounded-2xl border border-white bg-white/70"
                  >
                    <img
                      src={ninjaImagePublicUrl(image.filePath)}
                      alt={image.fileName}
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onDeleteImage(image.id)}
                      className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100 disabled:opacity-30"
                      aria-label={`Remove ${image.fileName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {uploadError && <p className="mt-2 text-sm font-medium text-red-600">{uploadError}</p>}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/80 px-6 py-4">
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="text-sm font-bold text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Delete card
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={busy || title.trim().length === 0}
              className="rounded-full bg-[#FF6A00] px-5 py-2 text-sm font-black text-white hover:bg-[#e65f00] disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
