import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  HouseholdMemberInsert,
  HouseholdMemberRow,
  HouseholdMemberUpdate,
  MemberColorToken,
} from "../../types";
import { supabase } from "../lib/supabase";

const MEMBERS_KEY = ["household_members"] as const;

export function isMissingMembersTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("household_members")
  );
}

async function fetchMembers(): Promise<HouseholdMemberRow[]> {
  const { data, error } = await supabase
    .from("household_members")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("display_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function useHouseholdMembers() {
  return useQuery({
    queryKey: MEMBERS_KEY,
    queryFn: fetchMembers,
    retry: false,
  });
}

export function useHouseholdMembersMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: MEMBERS_KEY });

  const createMember = useMutation({
    mutationFn: async (input: {
      display_name: string;
      color_token?: MemberColorToken;
      sort_order?: number;
    }) => {
      const row: HouseholdMemberInsert = {
        display_name: input.display_name.trim(),
        color_token: input.color_token ?? "sky",
        sort_order: input.sort_order ?? 0,
      };
      const { data, error } = await supabase.from("household_members").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: HouseholdMemberUpdate }) => {
      const { data, error } = await supabase
        .from("household_members")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("household_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createMember, updateMember, deleteMember };
}
