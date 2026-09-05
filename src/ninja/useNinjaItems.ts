import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  NinjaItemImageInsert,
  NinjaItemImageRow,
  NinjaItemInsert,
  NinjaItemRow,
  NinjaItemUpdate,
} from "../../types";
import { supabase } from "../lib/supabase";
import type { NinjaItem, NinjaItemArea, NinjaItemImage, NinjaItemStage } from "./ninja-types";
import { sanitizeNinjaFileName } from "./ninja-types";

const NINJA_ITEMS_KEY = ["ninja_items"] as const;

type NinjaItemQueryRow = NinjaItemRow & {
  ninja_item_images?: NinjaItemImageRow[] | null;
};

export function isMissingNinjaItemsTableError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    (lower.includes("ninja_items") &&
      (lower.includes("could not find the table") ||
        lower.includes("does not exist") ||
        lower.includes("relation"))) ||
    (lower.includes("column") &&
      (lower.includes("area") || lower.includes("info")) &&
      lower.includes("does not exist")) ||
    (lower.includes("ninja_item_images") &&
      (lower.includes("could not find") || lower.includes("does not exist")))
  );
}

function rowToImage(row: NinjaItemImageRow): NinjaItemImage {
  return {
    id: row.id,
    itemId: row.item_id,
    filePath: row.file_path,
    fileName: row.file_name,
    fileMime: row.file_mime,
    createdAt: row.created_at,
  };
}

function rowToItem(row: NinjaItemQueryRow): NinjaItem {
  return {
    id: row.id,
    title: row.title,
    info: row.info,
    details: row.details,
    stage: row.stage,
    area: row.area,
    owner: row.owner,
    images: (row.ninja_item_images ?? []).map(rowToImage),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchNinjaItems(): Promise<NinjaItem[]> {
  const { data, error } = await supabase
    .from("ninja_items")
    .select("*, ninja_item_images(*)")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as NinjaItemQueryRow[]).map(rowToItem);
}

export function useNinjaItems() {
  return useQuery({
    queryKey: NINJA_ITEMS_KEY,
    queryFn: fetchNinjaItems,
    retry: false,
  });
}

export type NinjaItemInput = {
  title: string;
  info: string;
  details: string;
  stage?: NinjaItemStage;
  area?: NinjaItemArea;
  owner: string | null;
};

export function useNinjaItemsMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: NINJA_ITEMS_KEY });

  const createItem = useMutation({
    mutationFn: async (input: NinjaItemInput) => {
      const row: NinjaItemInsert = {
        title: input.title,
        info: input.info,
        details: input.details,
        stage: input.stage ?? "idea",
        area: input.area ?? "character_design",
        owner: input.owner,
      };
      const { data, error } = await supabase.from("ninja_items").insert(row).select().single();
      if (error) throw error;
      return rowToItem(data);
    },
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<NinjaItemInput>;
    }) => {
      const row: NinjaItemUpdate = {
        title: patch.title,
        info: patch.info,
        details: patch.details,
        stage: patch.stage,
        area: patch.area,
        owner: patch.owner,
      };
      const { data, error } = await supabase
        .from("ninja_items")
        .update(row)
        .eq("id", id)
        .select("*, ninja_item_images(*)")
        .single();
      if (error) throw error;
      return rowToItem(data as NinjaItemQueryRow);
    },
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: async (item: NinjaItem) => {
      const paths = item.images.map((image) => image.filePath);
      const { error } = await supabase.from("ninja_items").delete().eq("id", item.id);
      if (error) throw error;
      if (paths.length > 0) {
        await supabase.storage.from("vault-files").remove(paths);
      }
    },
    onSuccess: invalidate,
  });

  const uploadImage = useMutation({
    mutationFn: async ({ itemId, file }: { itemId: string; file: File }) => {
      const id = crypto.randomUUID();
      const safeName = sanitizeNinjaFileName(file.name);
      const path = `ninja-items/${itemId}/${id}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("vault-files")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const row: NinjaItemImageInsert = {
        id,
        item_id: itemId,
        file_path: path,
        file_name: file.name,
        file_mime: file.type || "image/jpeg",
      };
      const { data, error } = await supabase.from("ninja_item_images").insert(row).select().single();
      if (error) throw error;
      return rowToImage(data);
    },
    onSuccess: invalidate,
  });

  const deleteImage = useMutation({
    mutationFn: async (image: NinjaItemImage) => {
      const { error } = await supabase.from("ninja_item_images").delete().eq("id", image.id);
      if (error) throw error;
      await supabase.storage.from("vault-files").remove([image.filePath]);
    },
    onSuccess: invalidate,
  });

  return { createItem, updateItem, deleteItem, uploadImage, deleteImage };
}
