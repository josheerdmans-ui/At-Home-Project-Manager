import { useMemo, useState } from "react";
import { ImageIcon, Palette, Trash2, Users } from "lucide-react";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { IMAGE_VAULT_SETUP_SQL } from "../../lib/image-vault-setup-sql";
import type { ImagePhotoKind, ImageVaultPhotoRow } from "../../../types";
import { displayPhotoKind, filterPhotos, imagePublicUrl } from "./image-vault-utils";
import { isMissingImageVaultTableError, useImageVault, useImageVaultMutations } from "./useImageVault";

const FILTERS: { id: ImagePhotoKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "memory", label: "Memory photos" },
  { id: "person", label: "Person photos" },
];

export function ImageVaultRoom() {
  const { data: photos = [], isLoading, error } = useImageVault();
  const mut = useImageVaultMutations();
  const [filter, setFilter] = useState<ImagePhotoKind | "all">("all");
  const [selected, setSelected] = useState<ImageVaultPhotoRow | null>(null);

  const filtered = useMemo(() => filterPhotos(photos, filter), [photos, filter]);

  if (error && isMissingImageVaultTableError(error.message)) {
    return (
      <div className="flex min-h-full flex-col p-12">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <DbSetupPanel title="Image database setup" sql={IMAGE_VAULT_SETUP_SQL} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-12">
      <Header />

      <div className="flex gap-8">
        <nav className="flex w-[200px] shrink-0 flex-col gap-2" aria-label="Image filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-4 py-2.5 text-left text-sm font-bold transition ${
                filter === item.id
                  ? "bg-cyan-600 text-white shadow-md"
                  : "border border-white/60 bg-white/40 text-slate-700 backdrop-blur-xl hover:bg-white/70"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <p className="text-center text-slate-500">Loading photos…</p>
          ) : photos.length === 0 ? (
            <p className="py-24 text-center text-xl font-medium text-slate-500">
              No photos yet — use Take a photo on the home hub.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <PhotoCard key={p.id} photo={p} onClick={() => setSelected(p)} />
              ))}
            </div>
          )}
          {filtered.length === 0 && photos.length > 0 && !isLoading && (
            <p className="py-12 text-center text-slate-500">No photos in this category.</p>
          )}
        </div>
      </div>

      {error && !isMissingImageVaultTableError(error.message) && (
        <p className="mt-4 text-center text-red-600">{error.message}</p>
      )}

      {selected && (
        <PhotoDetailModal
          photo={selected}
          onClose={() => setSelected(null)}
          onDelete={async () => {
            await mut.deletePhoto.mutateAsync({ id: selected.id, filePath: selected.file_path });
            setSelected(null);
          }}
          busy={mut.deletePhoto.isPending}
        />
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-4 pr-44">
      <div className="rounded-2xl bg-cyan-100 p-4 text-cyan-700">
        <ImageIcon size={40} />
      </div>
      <h1 className="text-4xl font-black tracking-tight text-slate-800">Image</h1>
    </div>
  );
}

function PhotoCard({ photo, onClick }: { photo: ImageVaultPhotoRow; onClick: () => void }) {
  const url = imagePublicUrl(photo.file_path);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-3xl border border-white/60 bg-white/40 text-left shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl transition hover:ring-2 hover:ring-cyan-400/40"
    >
      <img src={url} alt="" className="aspect-square w-full object-cover" />
      <div className="p-3">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase text-cyan-700">
          {photo.photo_kind === "memory" ? <Palette size={12} /> : <Users size={12} />}
          {displayPhotoKind(photo.photo_kind)}
        </span>
        {photo.notes && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{photo.notes}</p>}
        <p className="mt-1 text-xs text-slate-400">
          {new Date(photo.created_at).toLocaleDateString()}
        </p>
      </div>
    </button>
  );
}

function PhotoDetailModal({
  photo,
  onClose,
  onDelete,
  busy,
}: {
  photo: ImageVaultPhotoRow;
  onClose: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const url = imagePublicUrl(photo.file_path);
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <img src={url} alt="" className="mb-4 w-full rounded-2xl object-contain" />
        <p className="mb-1 text-sm font-bold uppercase text-cyan-700">{displayPhotoKind(photo.photo_kind)}</p>
        {photo.notes && <p className="mb-4 text-slate-700">{photo.notes}</p>}
        <p className="mb-6 text-xs text-slate-400">{new Date(photo.created_at).toLocaleString()}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-slate-200 py-3 font-bold text-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this photo?")) void onDelete();
            }}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 py-3 font-bold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
