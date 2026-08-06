import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BankingAccountRow, BankingSettingsRow, BankingTransactionRow } from "../../../types";
import { supabase } from "../../lib/supabase";

export const BANKING_KEYS = {
  accounts: ["banking", "accounts"] as const,
  transactions: ["banking", "transactions"] as const,
  settings: ["banking", "settings"] as const,
};

async function fetchAccounts(): Promise<BankingAccountRow[]> {
  const { data, error } = await supabase
    .from("banking_accounts")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function fetchTransactions(): Promise<BankingTransactionRow[]> {
  const { data, error } = await supabase
    .from("banking_transactions")
    .select("*")
    .order("date", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return data ?? [];
}

async function fetchSettings(): Promise<BankingSettingsRow> {
  const { data, error } = await supabase.from("banking_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  if (data) return data;
  return {
    id: 1,
    investments_amount: 0,
    last_synced_at: null,
    connection_count: 0,
    updated_at: new Date().toISOString(),
  };
}

export function useBankingAccounts() {
  return useQuery({
    queryKey: BANKING_KEYS.accounts,
    queryFn: fetchAccounts,
    retry: false,
  });
}

export function useBankingTransactions() {
  return useQuery({
    queryKey: BANKING_KEYS.transactions,
    queryFn: fetchTransactions,
    retry: false,
  });
}

export function useBankingSettings() {
  return useQuery({
    queryKey: BANKING_KEYS.settings,
    queryFn: fetchSettings,
    retry: false,
  });
}

export function useBankingMutations() {
  const qc = useQueryClient();

  const invalidateAll = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: BANKING_KEYS.accounts }),
      qc.invalidateQueries({ queryKey: BANKING_KEYS.transactions }),
      qc.invalidateQueries({ queryKey: BANKING_KEYS.settings }),
    ]);

  const createLinkToken = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        link_token?: string;
        error?: string;
      }>("banking-create-link-token");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.link_token) throw new Error("No link_token returned from server");
      return data.link_token;
    },
  });

  const exchangePublicToken = useMutation({
    mutationFn: async (input: { public_token: string; institution_name?: string | null }) => {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        error?: string;
      }>("banking-exchange-public-token", { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => invalidateAll(),
  });

  const syncNow = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<{
        ok?: boolean;
        synced?: number;
        errors?: string[];
        error?: string;
      }>("banking-sync");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.errors?.length) throw new Error(data.errors.join("; "));
      return data;
    },
    onSuccess: () => invalidateAll(),
  });

  const updateInvestments = useMutation({
    mutationFn: async (amount: number) => {
      const { data, error } = await supabase
        .from("banking_settings")
        .upsert({ id: 1, investments_amount: amount }, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: BANKING_KEYS.settings }),
  });

  return { createLinkToken, exchangePublicToken, syncNow, updateInvestments, invalidateAll };
}
