import { useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, X } from "lucide-react";
import type { VaultCategory, VaultDocType } from "../../../types";
import { getHouseProject, listHouseProjects } from "../../lib/house-projects-store";
import type { CreateVaultDocumentInput } from "./useVaultDocuments";
import { defaultVaultTitle } from "./vault-utils";
import { DOC_TYPE_OPTIONS } from "./types";

type Props = {
  onClose: () => void;
  onCreate: (input: CreateVaultDocumentInput) => Promise<void>;
  busy: boolean;
};

const WARRANTY_CATEGORIES: { value: VaultCategory; label: string }[] = [
  { value: "appliances", label: "Appliances" },
  { value: "electronics", label: "Electronics" },
  { value: "home_repair", label: "Home Repair" },
  { value: "vehicles", label: "Vehicles" },
];

export function NewDocumentModal({ onClose, onCreate, busy }: Props) {
  const [docType, setDocType] = useState<VaultDocType | null>(null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/60 bg-white/95 p-6 shadow-xl backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-800">
            {docType ? "Add to vault" : "What are you adding?"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {!docType ? (
          <TypePicker onPick={setDocType} />
        ) : (
          <TypeForm
            docType={docType}
            busy={busy}
            onBack={() => setDocType(null)}
            onCreate={onCreate}
          />
        )}
      </div>
    </div>
  );
}

function TypePicker({ onPick }: { onPick: (t: VaultDocType) => void }) {
  return (
    <div className="grid gap-3">
      {DOC_TYPE_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onPick(opt.id)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-cyan-400 hover:bg-cyan-50/50"
        >
          <p className="font-black text-slate-900">{opt.label}</p>
          <p className="mt-1 text-sm font-medium text-slate-500">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}

function TypeForm({
  docType,
  busy,
  onBack,
  onCreate,
}: {
  docType: VaultDocType;
  busy: boolean;
  onBack: () => void;
  onCreate: (input: CreateVaultDocumentInput) => Promise<void>;
}) {
  const label = DOC_TYPE_OPTIONS.find((o) => o.id === docType)!.label;

  switch (docType) {
    case "warranty":
      return <WarrantyForm label={label} busy={busy} onBack={onBack} onCreate={onCreate} />;
    case "house_document":
      return <HouseDocumentForm label={label} busy={busy} onBack={onBack} onCreate={onCreate} />;
    case "repair_note":
      return (
        <ProjectNoteForm
          docType="repair_note"
          label={label}
          busy={busy}
          onBack={onBack}
          onCreate={onCreate}
        />
      );
    case "remodel_note":
      return (
        <ProjectNoteForm
          docType="remodel_note"
          label={label}
          busy={busy}
          onBack={onBack}
          onCreate={onCreate}
        />
      );
  }
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-4 flex items-center gap-2 text-sm font-bold text-cyan-700 hover:text-cyan-900"
    >
      <ArrowLeft size={16} /> Change type
    </button>
  );
}

function WarrantyForm({
  label,
  busy,
  onBack,
  onCreate,
}: {
  label: string;
  busy: boolean;
  onBack: () => void;
  onCreate: (input: CreateVaultDocumentInput) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<VaultCategory>("appliances");
  const [file, setFile] = useState<File | null>(null);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [warrantyExpires, setWarrantyExpires] = useState("");
  const [notes, setNotes] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await onCreate({
      doc_type: "warranty",
      title: defaultVaultTitle("warranty", title),
      category,
      files: file ? [file] : [],
      purchase_date: purchaseDate || null,
      warranty_expires: warrantyExpires || null,
      notes: notes.trim() || null,
    });
  };

  return (
    <>
      <BackButton onBack={onBack} />
      <p className="mb-4 text-sm font-bold uppercase tracking-wide text-cyan-700">{label}</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title" value={title} onChange={setTitle} />
        <SelectCategory value={category} onChange={setCategory} />
        <FileField
          label="File (PDF or image)"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={setFile}
        />
        <Field label="Purchase date" value={purchaseDate} onChange={setPurchaseDate} type="date" />
        <Field label="Warranty expires" value={warrantyExpires} onChange={setWarrantyExpires} type="date" />
        <NotesField value={notes} onChange={setNotes} />
        <Submit busy={busy} label="Add warranty" />
      </form>
    </>
  );
}

function HouseDocumentForm({
  label,
  busy,
  onBack,
  onCreate,
}: {
  label: string;
  busy: boolean;
  onBack: () => void;
  onCreate: (input: CreateVaultDocumentInput) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const fallback = photo ? photo.name.replace(/\.[^.]+$/, "") : undefined;
    await onCreate({
      doc_type: "house_document",
      title: defaultVaultTitle("house_document", title || fallback),
      category: null,
      files: photo ? [photo] : [],
      notes: notes.trim() || null,
    });
  };

  return (
    <>
      <BackButton onBack={onBack} />
      <p className="mb-4 text-sm font-bold uppercase tracking-wide text-cyan-700">{label}</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title" value={title} onChange={setTitle} placeholder="Optional" />
        <FileField label="Photo" accept="image/jpeg,image/png,image/webp" onChange={setPhoto} />
        <NotesField value={notes} onChange={setNotes} />
        <Submit busy={busy} label="Add house document" />
      </form>
    </>
  );
}

function ProjectNoteForm({
  docType,
  label,
  busy,
  onBack,
  onCreate,
}: {
  docType: "repair_note" | "remodel_note";
  label: string;
  busy: boolean;
  onBack: () => void;
  onCreate: (input: CreateVaultDocumentInput) => Promise<void>;
}) {
  const projectKind = docType === "repair_note" ? "repair" : "remodel";
  const projects = useMemo(() => listHouseProjects(projectKind), [projectKind]);

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [importProjectId, setImportProjectId] = useState("");

  const applyProject = (projectId: string) => {
    setImportProjectId(projectId);
    if (!projectId) return;
    const p = getHouseProject(projectId);
    if (!p) return;
    setTitle(p.title);
    setDetails(p.details);
    setCost(p.cost != null ? String(p.cost) : "");
    setNotes(p.notes ?? "");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const project = importProjectId ? getHouseProject(importProjectId) : undefined;
    await onCreate({
      doc_type: docType,
      title: defaultVaultTitle(docType, title || project?.title),
      category: null,
      details: details.trim() || null,
      cost: cost.trim() ? parseFloat(cost) : null,
      notes: notes.trim() || null,
      project_id: project?.id ?? null,
      project_title: project?.title ?? null,
      files: photos,
    });
  };

  return (
    <>
      <BackButton onBack={onBack} />
      <p className="mb-4 text-sm font-bold uppercase tracking-wide text-cyan-700">{label}</p>
      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-600">Import from House Projects</span>
          <select
            value={importProjectId}
            onChange={(e) => applyProject(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          >
            <option value="">— Enter manually —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          {projects.length === 0 && (
            <p className="mt-1 text-xs font-medium text-slate-500">
              No {projectKind} projects yet. Add them in House Projects, or fill in below.
            </p>
          )}
        </label>
        <Field label="Title" value={title} onChange={setTitle} />
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-600">Details</span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
          />
        </label>
        <Field label="Cost ($)" value={cost} onChange={setCost} type="number" />
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-600">Photos</span>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhotos(Array.from(e.target.files ?? []))}
            className="w-full text-sm text-slate-700"
          />
          {photos.length > 0 && (
            <p className="mt-1 text-xs font-medium text-slate-500">{photos.length} photo(s) selected</p>
          )}
        </label>
        <NotesField value={notes} onChange={setNotes} />
        <Submit busy={busy} label={`Add ${label.toLowerCase()}`} />
      </form>
    </>
  );
}

function SelectCategory({
  value,
  onChange,
}: {
  value: VaultCategory;
  onChange: (v: VaultCategory) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">Category</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as VaultCategory)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
      >
        {WARRANTY_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
      />
    </label>
  );
}

function FileField({
  label,
  accept,
  onChange,
}: {
  label: string;
  accept: string;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">{label}</span>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="w-full text-sm text-slate-700"
      />
    </label>
  );
}

function NotesField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-600">Notes</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800"
      />
    </label>
  );
}

function Submit({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="mt-2 w-full rounded-full bg-cyan-600 py-3 font-bold text-white hover:bg-cyan-700 disabled:opacity-60"
    >
      {busy ? "Saving…" : label}
    </button>
  );
}
