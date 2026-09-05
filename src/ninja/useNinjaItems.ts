import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  NinjaItemActivityInsert,
  NinjaItemActivityRow,
  NinjaItemCheckInsert,
  NinjaItemCheckRow,
  NinjaItemImageInsert,
  NinjaItemImageRow,
  NinjaItemInsert,
  NinjaItemRow,
  NinjaItemUpdate,
} from "../../types";
import { supabase } from "../lib/supabase";
import { applyCardMoves, type NinjaCardMove } from "./ninja-dnd";
import type {
  NinjaItem,
  NinjaItemActivity,
  NinjaItemArea,
  NinjaItemCheck,
  NinjaItemImage,
  NinjaItemPriority,
  NinjaItemStage,
} from "./ninja-types";
import { NINJA_STAGES, sanitizeNinjaFileName } from "./ninja-types";

export const NINJA_ITEMS_KEY = ["ninja_items"] as const;

type NinjaItemQueryRow = NinjaItemRow & {
  ninja_item_images?: NinjaItemImageRow[] | null;
  ninja_item_checks?: NinjaItemCheckRow[] | null;
  ninja_item_activity?: NinjaItemActivityRow[] | null;
};

export function isMissingNinjaItemsTableError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    (lower.includes("ninja_item") &&
      (lower.includes("could not find the table") ||
        lower.includes("does not exist") ||
        lower.includes("relation"))) ||
    (lower.includes("column") &&
      (lower.includes("area") ||
        lower.includes("info") ||
        lower.includes("due_date") ||
        lower.includes("priority") ||
        lower.includes("tags") ||
        lower.includes("sort_order")) &&
      lower.includes("does not exist"))
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

function rowToCheck(row: NinjaItemCheckRow): NinjaItemCheck {
  return {
    id: row.id,
    itemId: row.item_id,
    title: row.title,
    done: row.done,
    sortOrder: row.sort_order,
  };
}

function rowToActivity(row: NinjaItemActivityRow): NinjaItemActivity {
  return {
    id: row.id,
    actor: row.actor,
    message: row.message,
    createdAt: row.created_at,
  };
}

function rowToItem(row: NinjaItemQueryRow): NinjaItem {
  const checks = (row.ninja_item_checks ?? []).map(rowToCheck);
  checks.sort((a, b) => a.sortOrder - b.sortOrder);
  const activity = (row.ninja_item_activity ?? []).map(rowToActivity);
  activity.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    id: row.id,
    title: row.title,
    info: row.info,
    details: row.details,
    stage: row.stage,
    area: row.area,
    owner: row.owner,
    dueDate: row.due_date,
    priority: row.priority,
    tags: row.tags ?? [],
    sortOrder: row.sort_order ?? 0,
    images: (row.ninja_item_images ?? []).map(rowToImage),
    checks,
    activity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function logActivity(itemId: string, actor: string, message: string) {
  const row: NinjaItemActivityInsert = {
    item_id: itemId,
    actor: actor.trim() || "Team",
    message,
  };
  await supabase.from("ninja_item_activity").insert(row);
}

async function fetchNinjaItems(): Promise<NinjaItem[]> {
  const { data, error } = await supabase
    .from("ninja_items")
    .select("*, ninja_item_images(*), ninja_item_checks(*), ninja_item_activity(*)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as NinjaItemQueryRow[]).map(rowToItem);
}

export function useNinjaItems() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("ninja-board-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "ninja_items" }, () => {
        void qc.invalidateQueries({ queryKey: NINJA_ITEMS_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ninja_item_images" }, () => {
        void qc.invalidateQueries({ queryKey: NINJA_ITEMS_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ninja_item_checks" }, () => {
        void qc.invalidateQueries({ queryKey: NINJA_ITEMS_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ninja_item_activity" }, () => {
        void qc.invalidateQueries({ queryKey: NINJA_ITEMS_KEY });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: NINJA_ITEMS_KEY,
    queryFn: fetchNinjaItems,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 8_000,
  });
}

export type NinjaItemInput = {
  title: string;
  info: string;
  details: string;
  stage?: NinjaItemStage;
  area?: NinjaItemArea;
  owner: string | null;
  dueDate: string | null;
  priority: NinjaItemPriority;
  tags: string[];
  sortOrder?: number;
};

function actorFrom(owner: string | null | undefined) {
  return owner?.trim() || "Team";
}

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
        due_date: input.dueDate,
        priority: input.priority,
        tags: input.tags,
        sort_order: input.sortOrder ?? 0,
      };
      const { data, error } = await supabase.from("ninja_items").insert(row).select().single();
      if (error) throw error;
      await logActivity(data.id, actorFrom(input.owner), "Created this card.");
      return rowToItem(data);
    },
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: async ({
      id,
      patch,
      actor,
      silent,
    }: {
      id: string;
      patch: Partial<NinjaItemInput>;
      actor?: string | null;
      silent?: boolean;
    }) => {
      const row: NinjaItemUpdate = {
        title: patch.title,
        info: patch.info,
        details: patch.details,
        stage: patch.stage,
        area: patch.area,
        owner: patch.owner,
        due_date: patch.dueDate,
        priority: patch.priority,
        tags: patch.tags,
        sort_order: patch.sortOrder,
      };
      const { data, error } = await supabase
        .from("ninja_items")
        .update(row)
        .eq("id", id)
        .select("*, ninja_item_images(*), ninja_item_checks(*), ninja_item_activity(*)")
        .single();
      if (error) throw error;
      if (!silent) {
        await logActivity(id, actorFrom(actor ?? patch.owner), "Updated this card.");
      }
      return rowToItem(data as NinjaItemQueryRow);
    },
    onSuccess: invalidate,
  });

  const moveCards = useMutation({
    mutationFn: async ({
      moves,
      draggedId,
      fromStage,
      actor,
    }: {
      moves: NinjaCardMove[];
      draggedId: string;
      fromStage: NinjaItemStage;
      actor: string;
    }) => {
      const results = await Promise.all(
        moves.map((move) =>
          supabase
            .from("ninja_items")
            .update({ stage: move.stage, sort_order: move.sortOrder })
            .eq("id", move.id),
        ),
      );
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;

      const dragged = moves.find((move) => move.id === draggedId);
      if (dragged && dragged.stage !== fromStage) {
        const label = NINJA_STAGES.find((stage) => stage.id === dragged.stage)?.label ?? dragged.stage;
        await logActivity(draggedId, actorFrom(actor), `Moved this card to ${label}.`);
      }
    },
    onMutate: async ({ moves }) => {
      await qc.cancelQueries({ queryKey: NINJA_ITEMS_KEY });
      const previous = qc.getQueryData<NinjaItem[]>(NINJA_ITEMS_KEY);
      qc.setQueryData<NinjaItem[]>(NINJA_ITEMS_KEY, (current) =>
        current ? applyCardMoves(current, moves) : current,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(NINJA_ITEMS_KEY, context.previous);
    },
    onSettled: invalidate,
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
    mutationFn: async ({
      itemId,
      file,
      actor,
    }: {
      itemId: string;
      file: File;
      actor?: string | null;
    }) => {
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
      await logActivity(itemId, actorFrom(actor), "Added an image to this card.");
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

  const addCheck = useMutation({
    mutationFn: async ({
      itemId,
      title,
      sortOrder,
      actor,
    }: {
      itemId: string;
      title: string;
      sortOrder: number;
      actor?: string | null;
    }) => {
      const row: NinjaItemCheckInsert = {
        item_id: itemId,
        title,
        sort_order: sortOrder,
      };
      const { error } = await supabase.from("ninja_item_checks").insert(row);
      if (error) throw error;
      await logActivity(itemId, actorFrom(actor), "Added a checklist item.");
    },
    onSuccess: invalidate,
  });

  const toggleCheck = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("ninja_item_checks").update({ done }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteCheck = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ninja_item_checks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    createItem,
    updateItem,
    moveCards,
    deleteItem,
    uploadImage,
    deleteImage,
    addCheck,
    toggleCheck,
    deleteCheck,
  };
}
