import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NinjaIdeaInsert, NinjaIdeaRow, NinjaIdeaVoteInsert, NinjaIdeaVoteRow } from "../../types";
import { supabase } from "../lib/supabase";
import type { NinjaIdea } from "./ninja-types";

export const NINJA_IDEAS_KEY = ["ninja_ideas"] as const;

type IdeaQueryRow = NinjaIdeaRow & {
  ninja_idea_votes?: NinjaIdeaVoteRow[] | null;
};

export function isMissingNinjaIdeasTableError(message: string) {
  const lower = message.toLowerCase();
  return (
    lower.includes("schema cache") ||
    (lower.includes("ninja_idea") &&
      (lower.includes("could not find the table") ||
        lower.includes("does not exist") ||
        lower.includes("relation")))
  );
}

function rowToIdea(row: IdeaQueryRow): NinjaIdea {
  return {
    id: row.id,
    title: row.title,
    createdBy: row.created_by,
    createdAt: row.created_at,
    voters: (row.ninja_idea_votes ?? []).map((vote) => vote.voter),
  };
}

async function fetchNinjaIdeas(): Promise<NinjaIdea[]> {
  const { data, error } = await supabase
    .from("ninja_ideas")
    .select("*, ninja_idea_votes(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as IdeaQueryRow[]).map(rowToIdea);
}

export function useNinjaIdeas() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("ninja-ideas-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "ninja_ideas" }, () => {
        void qc.invalidateQueries({ queryKey: NINJA_IDEAS_KEY });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ninja_idea_votes" }, () => {
        void qc.invalidateQueries({ queryKey: NINJA_IDEAS_KEY });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  return useQuery({
    queryKey: NINJA_IDEAS_KEY,
    queryFn: fetchNinjaIdeas,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 8_000,
  });
}

export function useNinjaIdeasMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: NINJA_IDEAS_KEY });

  const createIdea = useMutation({
    mutationFn: async ({ title, createdBy }: { title: string; createdBy: string }) => {
      const row: NinjaIdeaInsert = { title, created_by: createdBy };
      const { data, error } = await supabase.from("ninja_ideas").insert(row).select().single();
      if (error) throw error;
      return rowToIdea(data);
    },
    onSuccess: invalidate,
  });

  const toggleVote = useMutation({
    mutationFn: async ({ idea, voter }: { idea: NinjaIdea; voter: string }) => {
      if (idea.voters.includes(voter)) {
        const { error } = await supabase
          .from("ninja_idea_votes")
          .delete()
          .eq("idea_id", idea.id)
          .eq("voter", voter);
        if (error) throw error;
        return;
      }
      const row: NinjaIdeaVoteInsert = { idea_id: idea.id, voter };
      const { error } = await supabase.from("ninja_idea_votes").insert(row);
      if (error) throw error;
    },
    onMutate: async ({ idea, voter }) => {
      await qc.cancelQueries({ queryKey: NINJA_IDEAS_KEY });
      const previous = qc.getQueryData<NinjaIdea[]>(NINJA_IDEAS_KEY);
      qc.setQueryData<NinjaIdea[]>(NINJA_IDEAS_KEY, (current) =>
        current?.map((entry) => {
          if (entry.id !== idea.id) return entry;
          const voted = entry.voters.includes(voter);
          return {
            ...entry,
            voters: voted ? entry.voters.filter((name) => name !== voter) : [...entry.voters, voter],
          };
        }),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(NINJA_IDEAS_KEY, context.previous);
    },
    onSettled: invalidate,
  });

  const deleteIdea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ninja_ideas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createIdea, toggleVote, deleteIdea };
}
