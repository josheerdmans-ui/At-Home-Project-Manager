import { useEffect, useState, type FormEvent } from "react";
import { ChevronLeft, ExternalLink, Trash2, Upload } from "lucide-react";
import type { VaultCategory, VaultDocumentRow, VaultDocumentUpdate } from "../../../types";
import {
  allDocumentFiles,
  defaultVaultTitle,
  displayCategory,
  displayDocType,
  filePublicUrl,
  formatCost,
  isPreviewableMime,
  parseExtraFiles,
  warrantyInfo,
} from "./vault-utils";
import { useVaultDocumentsMutations } from "./useVaultDocuments";

type Props = {
  document: VaultDocumentRow;
  onClose: () => void;
  onDeleted: () => void;
};

const WARRANTY_CATEGORIES: { value: VaultCategory; label: string }[] = [
  { value: "appliances", label: "Appliances" },
  { value: "electronics", label: "Electronics" },
  { value: "home_repair", label: "Home Repair" },
  { value: "vehicles", label: "Vehicles" },
];

const emptyToNull = (s: string) => (s.trim() === "" ? null : s.trim());

export function DocumentModal({ document: doc, onClose, onDeleted }: Props) {
  const mut = useVaultDocumentsMutations();
  const [title, setTitle] = useState(doc.title);
  const [category, setCategory] = useState<VaultCategory>(doc.category ?? "appliances");
  const [purchaseDate, setPurchaseDate] = useState(doc.purchase_date ?? "");
  const [warrantyExpires, setWarrantyExpires] = useState(doc.warranty_expires ?? "");
  const [notes, setNotes] = useState(doc.notes ?? "");
  const [details, setDetails] = useState(doc.details ?? "");
  const [cost, setCost] = useState(doc.cost != null ? String(doc.cost) : "");

  useEffect(() => {
    setTitle(doc.title);
    setCategory(doc.category ?? "appliances");
    setPurchaseDate(doc.purchase_date ?? "");
    setWarrantyExpires(doc.warranty_expires ?? "");
    setNotes(doc.notes ?? "");
    setDetails(doc.details ?? "");
    setCost(doc.cost != null ? String(doc.cost) : "");
  }, [doc]);

  const warranty = doc.doc_type === "warranty" ? warrantyInfo(warrantyExpires || null) : null;
  const files = allDocumentFiles(doc);
  const busy = mut.updateDocument.isPending || mut.replaceFile.isPending || mut.addExtraFiles.isPending;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const patch: VaultDocumentUpdate = {
      title: defaultVaultTitle(doc.doc_type, title),
      notes: emptyToNull(notes),
    };
    if (doc.doc_type === "warranty") {
      patch.category = category;
      patch.purchase_date = emptyToNull(purchaseDate);
      patch.warranty_expires = emptyToNull(warrantyExpires);
    }
    if (doc.doc_type === "repair_note" || doc.doc_type === "remodel_note") {
      patch.details = emptyToNull(details);
      patch.cost = cost.trim() ? parseFloat(cost) : null;
    }
    await mut.updateDocument.mutateAsync({ id: doc.id, patch });
    onClose();
  };

  const remove = async () => {
    if (!confirm(`Delete "${doc.title}"?`)) return;
    await mut.deleteDocument.mutateAsync(doc.id);
    onDeleted();
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/55 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mx-auto max-w-3xl px-4 pb-24 pt-20"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-detail-title"
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <h2 id="document-detail-title" className="mb-1 text-3xl font-black text-slate-900">
            {doc.title}
          </h2>
          <p className="mb-2 text-sm font-bold uppercase tracking-wide text-cyan-700">
            {displayDocType(doc.doc_type)}
            {doc.category ? ` · ${displayCategory(doc.category)}` : ""}
          </p>
          {doc.project_title && (
            <p className="mb-4 text-sm font-semibold text-slate-600">
              Linked project: <span className="font-bold text-slate-900">{doc.project_title}</span>
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="mb-6 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-bold text-slate-800 shadow-sm hover:bg-cyan-600 hover:text-white"
          >
            <ChevronLeft size={18} /> Back to vault
          </button>

          {warranty && (
            <div
              className={`mb-6 rounded-2xl border px-4 py-4 ${
                warranty.status === "overdue"
                  ? "border-red-200 bg-red-50"
                  : warranty.status === "soon"
                    ? "border-amber-200 bg-amber-50"
                    : warranty.status === "ok"
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Warranty</p>
              <p
                className={`mt-1 text-lg font-black ${
                  warranty.status === "overdue"
                    ? "text-red-800"
                    : warranty.status === "soon"
                      ? "text-amber-900"
                      : "text-slate-800"
                }`}
              >
                {warranty.message}
              </p>
            </div>
          )}

          <FileGallery
            files={files}
            onReplacePrimary={
              doc.doc_type === "warranty" || doc.doc_type === "house_document"
                ? (file) => mut.replaceFile.mutateAsync({ id: doc.id, file, existingPath: doc.file_path })
                : undefined
            }
            onAddPhotos={
              doc.doc_type === "repair_note" || doc.doc_type === "remodel_note"
                ? (newFiles) =>
                    mut.addExtraFiles.mutateAsync({
                      id: doc.id,
                      files: newFiles,
                      existingExtra: parseExtraFiles(doc.extra_files),
                    })
                : undefined
            }
          />

          <form onSubmit={save} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-600">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            {doc.doc_type === "warranty" && (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-600">Category</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as VaultCategory)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    {WARRANTY_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <DateField label="Purchase date" value={purchaseDate} onChange={setPurchaseDate} />
                  <DateField label="Warranty expires" value={warrantyExpires} onChange={setWarrantyExpires} />
                </div>
              </>
            )}

            {(doc.doc_type === "repair_note" || doc.doc_type === "remodel_note") && (
              <>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-600">Details</span>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-600">Cost ($)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                {doc.cost != null && (
                  <p className="text-sm font-bold text-slate-600">Current: {formatCost(doc.cost)}</p>
                )}
              </>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-600">Notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-3 py-2"
              />
            </label>

            <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => void remove()}
                className="inline-flex items-center gap-2 rounded-full border border-red-200 px-5 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save & close"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2"
      />
    </label>
  );
}

function FileGallery({
  files,
  onReplacePrimary,
  onAddPhotos,
}: {
  files: { path: string; name: string; mime: string | null }[];
  onReplacePrimary?: (file: File) => Promise<unknown>;
  onAddPhotos?: (files: File[]) => Promise<unknown>;
}) {
  if (files.length === 0) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
          No files attached yet.
        </p>
        {(onReplacePrimary || onAddPhotos) && (
          <div className="flex flex-wrap gap-2">
            {onReplacePrimary && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
                <Upload size={16} />
                Add file
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp,*/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onReplacePrimary(f);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
            {onAddPhotos && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
                <Upload size={16} />
                Add photos
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const list = Array.from(e.target.files ?? []);
                    if (list.length) void onAddPhotos(list);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Files</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {files.map((f) => {
          const url = filePublicUrl(f.path);
          const preview = isPreviewableMime(f.mime);
          return (
            <div key={f.path} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {f.mime?.startsWith("image/") ? (
                <img src={url} alt="" className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm font-bold text-slate-500">
                  {f.name}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate text-xs font-semibold text-slate-700">{f.name}</span>
                <button
                  type="button"
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-cyan-600 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-700"
                >
                  <ExternalLink size={12} />
                  {preview ? "View" : "Open"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {onReplacePrimary && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
            <Upload size={16} />
            Replace file
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp,*/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onReplacePrimary(f);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {onAddPhotos && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
            <Upload size={16} />
            Add photos
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files ?? []);
                if (list.length) void onAddPhotos(list);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
