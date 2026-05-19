import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { ImagePhotoKind, ImageVaultPhotoInsert } from "../../../types";
import { imagePublicUrl, sanitizeFileName } from "./image-vault-utils";

const IMAGE_VAULT_KEY = ["image_vault_photos"] as const;

export function isMissingImageVaultTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("image_vault_photos")
  );
}

async function fetchPhotos() {
  const { data, error } = await supabase
    .from("image_vault_photos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function useImageVault() {
  return useQuery({
    queryKey: IMAGE_VAULT_KEY,
    queryFn: fetchPhotos,
    retry: false,
  });
}

export type CreateImageVaultPhotoInput = {
  photo_kind: ImagePhotoKind;
  file: File;
  notes?: string | null;
};

export function useImageVaultMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: IMAGE_VAULT_KEY });

  const createPhoto = useMutation({
    mutationFn: async (input: CreateImageVaultPhotoInput) => {
      const id = crypto.randomUUID();
      const safeName = sanitizeFileName(input.file.name);
      const path = `image-vault/${id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("vault-files")
        .upload(path, input.file, { upsert: true });
      if (uploadError) throw uploadError;

      const row: ImageVaultPhotoInsert = {
        id,
        photo_kind: input.photo_kind,
        file_path: path,
        file_name: input.file.name,
        file_mime: input.file.type || "image/jpeg",
        notes: input.notes ?? null,
      };

      const { data, error } = await supabase.from("image_vault_photos").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deletePhoto = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      const { error } = await supabase.from("image_vault_photos").delete().eq("id", id);
      if (error) throw error;
      await supabase.storage.from("vault-files").remove([filePath]);
    },
    onSuccess: invalidate,
  });

  return { createPhoto, deletePhoto };
}

export { imagePublicUrl };
