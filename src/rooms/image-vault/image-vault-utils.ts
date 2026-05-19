import type { ImagePhotoKind, ImageVaultPhotoRow } from "../../../types";

const KIND_LABELS: Record<ImagePhotoKind, string> = {
  memory: "Memory photo",
  person: "Person photo",
};

export function displayPhotoKind(kind: ImagePhotoKind): string {
  return KIND_LABELS[kind];
}

export function imagePublicUrl(filePath: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/vault-files/${filePath}`;
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function filterPhotos(
  photos: ImageVaultPhotoRow[],
  kind: ImagePhotoKind | "all",
): ImageVaultPhotoRow[] {
  if (kind === "all") return photos;
  return photos.filter((p) => p.photo_kind === kind);
}
