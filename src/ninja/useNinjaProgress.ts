import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NinjaProgressUpdateInsert, NinjaProgressUpdateRow } from "../../types";
import { supabase } from "../lib/supabase";
import type { NinjaProgressUpdate } from "./ninja-types";

export const NINJA_PROGRESS_KEY = ["ninja_progress_updates"] as const;

function rowToUpdate(row: NinjaProgressUpdateRow): NinjaProgressUpdate {
  return {
    id: row.id,
    version: row.version,
    title: row.title ?? "",
    body: row.body,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

async function fetchProgressUpdates(): Promise<NinjaProgressUpdate[]> {
  const { data, error } = await supabase
    .from("ninja_progress_updates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToUpdate);
}

export function useNinjaProgress() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("ninja-progress-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ninja_progress_updates" },
        () => {
          void qc.invalidateQueries({ queryKey: NINJA_PROGRESS_KEY });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: NINJA_PROGRESS_KEY,
    queryFn: fetchProgressUpdates,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 8_000,
  });
}

export function useNinjaProgressMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: NINJA_PROGRESS_KEY });

  const createUpdate = useMutation({
    mutationFn: async ({
      version,
      title,
      body,
      createdBy,
    }: {
      version: string;
      title: string;
      body: string;
      createdBy: string;
    }) => {
      const row: NinjaProgressUpdateInsert = { version, title, body, created_by: createdBy };
      const { data, error } = await supabase
        .from("ninja_progress_updates")
        .insert(row)
        .select()
        .single();
      if (error) throw error;
      return rowToUpdate(data);
    },
    onSuccess: invalidate,
  });

  const deleteUpdate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ninja_progress_updates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createUpdate, deleteUpdate };
}
