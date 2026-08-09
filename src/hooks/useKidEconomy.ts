import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChoreInsert,
  ChoreRow,
  ChoreUpdate,
  RewardInsert,
  RewardRedemptionRow,
  RewardRow,
  RewardUpdate,
  TokenLedgerInsert,
  TokenLedgerRow,
} from "../../types";
import { supabase } from "../lib/supabase";

const CHORES_KEY = ["chores"] as const;
const LEDGER_KEY = ["token_ledger"] as const;
const REWARDS_KEY = ["rewards"] as const;
const REDEMPTIONS_KEY = ["reward_redemptions"] as const;

export function isMissingKidEconomyTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("chores") ||
    message.includes("token_ledger") ||
    message.includes("rewards") ||
    message.includes("reward_redemptions")
  );
}

async function fetchChores(): Promise<ChoreRow[]> {
  const { data, error } = await supabase
    .from("chores")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchLedger(): Promise<TokenLedgerRow[]> {
  const { data, error } = await supabase
    .from("token_ledger")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchRewards(): Promise<RewardRow[]> {
  const { data, error } = await supabase
    .from("rewards")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchRedemptions(): Promise<RewardRedemptionRow[]> {
  const { data, error } = await supabase
    .from("reward_redemptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export function useChores() {
  return useQuery({ queryKey: CHORES_KEY, queryFn: fetchChores, retry: false });
}

export function useTokenLedger() {
  return useQuery({ queryKey: LEDGER_KEY, queryFn: fetchLedger, retry: false });
}

export function useRewards() {
  return useQuery({ queryKey: REWARDS_KEY, queryFn: fetchRewards, retry: false });
}

export function useRewardRedemptions() {
  return useQuery({ queryKey: REDEMPTIONS_KEY, queryFn: fetchRedemptions, retry: false });
}

export function balancesFromLedger(entries: TokenLedgerRow[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of entries) {
    out[row.member_id] = (out[row.member_id] ?? 0) + row.delta;
  }
  return out;
}

export function useKidEconomyMutations() {
  const qc = useQueryClient();
  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: CHORES_KEY });
    void qc.invalidateQueries({ queryKey: LEDGER_KEY });
    void qc.invalidateQueries({ queryKey: REWARDS_KEY });
    void qc.invalidateQueries({ queryKey: REDEMPTIONS_KEY });
  };

  const createChore = useMutation({
    mutationFn: async (input: {
      title: string;
      token_value: number;
      assignee_id?: string | null;
    }) => {
      const row: ChoreInsert = {
        title: input.title.trim(),
        token_value: Math.max(0, Math.floor(input.token_value)),
        assignee_id: input.assignee_id ?? null,
      };
      const { data, error } = await supabase.from("chores").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateAll,
  });

  const updateChore = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ChoreUpdate }) => {
      const { data, error } = await supabase.from("chores").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateAll,
  });

  const completeChore = useMutation({
    mutationFn: async ({
      chore,
      memberId,
    }: {
      chore: ChoreRow;
      memberId: string;
    }) => {
      const ledgerRow: TokenLedgerInsert = {
        member_id: memberId,
        delta: chore.token_value,
        reason: "chore_complete",
        ref_id: chore.id,
        note: chore.title,
      };
      const { data: ledger, error: ledgerError } = await supabase
        .from("token_ledger")
        .insert(ledgerRow)
        .select()
        .single();
      if (ledgerError) throw ledgerError;

      const { data, error } = await supabase
        .from("chore_completions")
        .insert({
          chore_id: chore.id,
          member_id: memberId,
          ledger_id: ledger.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateAll,
  });

  const createReward = useMutation({
    mutationFn: async (input: { title: string; description?: string; token_cost: number }) => {
      const row: RewardInsert = {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        token_cost: Math.max(1, Math.floor(input.token_cost)),
      };
      const { data, error } = await supabase.from("rewards").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateAll,
  });

  const updateReward = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: RewardUpdate }) => {
      const { data, error } = await supabase.from("rewards").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateAll,
  });

  const purchaseReward = useMutation({
    mutationFn: async ({
      reward,
      memberId,
      balance,
    }: {
      reward: RewardRow;
      memberId: string;
      balance: number;
    }) => {
      if (balance < reward.token_cost) {
        throw new Error("Not enough tokens");
      }
      const ledgerRow: TokenLedgerInsert = {
        member_id: memberId,
        delta: -reward.token_cost,
        reason: "reward_purchase",
        ref_id: reward.id,
        note: reward.title,
      };
      const { data: ledger, error: ledgerError } = await supabase
        .from("token_ledger")
        .insert(ledgerRow)
        .select()
        .single();
      if (ledgerError) throw ledgerError;

      const { data, error } = await supabase
        .from("reward_redemptions")
        .insert({
          reward_id: reward.id,
          member_id: memberId,
          token_cost: reward.token_cost,
          status: "pending",
          ledger_id: ledger.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateAll,
  });

  const fulfillRedemption = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("reward_redemptions")
        .update({ status: "fulfilled", fulfilled_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidateAll,
  });

  return {
    createChore,
    updateChore,
    completeChore,
    createReward,
    updateReward,
    purchaseReward,
    fulfillRedemption,
  };
}
