// Shared helpers for banking Edge Functions (Deno)
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function plaidBaseUrl(): string {
  const env = (Deno.env.get("PLAID_ENV") ?? "sandbox").toLowerCase();
  if (env === "production") return "https://production.plaid.com";
  if (env === "development") return "https://development.plaid.com";
  return "https://sandbox.plaid.com";
}

export function plaidCredentials(): { client_id: string; secret: string } {
  const client_id = Deno.env.get("PLAID_CLIENT_ID") ?? "";
  const secret = Deno.env.get("PLAID_SECRET") ?? "";
  if (!client_id || !secret) {
    throw new Error("Missing PLAID_CLIENT_ID or PLAID_SECRET secrets");
  }
  return { client_id, secret };
}

export async function plaidFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const creds = plaidCredentials();
  const res = await fetch(`${plaidBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...creds, ...body }),
  });
  const data = (await res.json()) as T & { error_message?: string; error_code?: string };
  if (!res.ok) {
    const msg =
      typeof data.error_message === "string"
        ? data.error_message
        : `Plaid error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export function adminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function requireUser(
  req: Request,
): Promise<{ userId: string; authedClient: SupabaseClient }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!url || !anon) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");

  const authedClient = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await authedClient.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
  return { userId: data.user.id, authedClient };
}

export type PlaidAccount = {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    current: number | null;
    available: number | null;
    iso_currency_code: string | null;
  };
};

export type PlaidTransaction = {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  pending: boolean;
  iso_currency_code: string | null;
  personal_finance_category?: { primary?: string; detailed?: string } | null;
  category?: string[] | null;
};

export function mapCategory(tx: PlaidTransaction): string {
  const pfc = tx.personal_finance_category?.primary;
  if (pfc) {
    return pfc
      .split("_")
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");
  }
  if (tx.category && tx.category.length > 0 && tx.category[0]) {
    return tx.category[0];
  }
  return "Uncategorized";
}

export async function upsertAccounts(
  admin: SupabaseClient,
  itemRowId: string,
  accounts: PlaidAccount[],
): Promise<Map<string, string>> {
  const plaidToUuid = new Map<string, string>();

  for (const acc of accounts) {
    const row = {
      plaid_account_id: acc.account_id,
      item_row_id: itemRowId,
      name: acc.name,
      official_name: acc.official_name,
      type: acc.type,
      subtype: acc.subtype,
      mask: acc.mask,
      current_balance: acc.balances.current,
      available_balance: acc.balances.available,
      iso_currency_code: acc.balances.iso_currency_code ?? "USD",
    };

    const { data, error } = await admin
      .from("banking_accounts")
      .upsert(row, { onConflict: "plaid_account_id" })
      .select("id, plaid_account_id")
      .single();

    if (error) throw error;
    plaidToUuid.set(data.plaid_account_id, data.id);
  }

  return plaidToUuid;
}

export async function refreshConnectionMeta(admin: SupabaseClient): Promise<void> {
  const { count } = await admin
    .from("banking_plaid_items")
    .select("id", { count: "exact", head: true });

  const { data: latest } = await admin
    .from("banking_plaid_items")
    .select("last_synced_at")
    .order("last_synced_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  const { data: existing } = await admin
    .from("banking_settings")
    .select("id")
    .eq("id", 1)
    .maybeSingle();

  if (existing) {
    await admin
      .from("banking_settings")
      .update({
        connection_count: count ?? 0,
        last_synced_at: latest?.last_synced_at ?? null,
      })
      .eq("id", 1);
  } else {
    await admin.from("banking_settings").insert({
      id: 1,
      investments_amount: 0,
      connection_count: count ?? 0,
      last_synced_at: latest?.last_synced_at ?? null,
    });
  }
}

export async function syncItemTransactions(
  admin: SupabaseClient,
  item: {
    id: string;
    access_token: string;
    cursor: string | null;
  },
): Promise<void> {
  let cursor = item.cursor ?? undefined;
  let accountMap = new Map<string, string>();

  // Ensure accounts exist and are fresh
  const accountsRes = await plaidFetch<{ accounts: PlaidAccount[] }>("/accounts/get", {
    access_token: item.access_token,
  });
  accountMap = await upsertAccounts(admin, item.id, accountsRes.accounts);

  // Rebuild map from DB in case of partial states
  const { data: dbAccounts } = await admin
    .from("banking_accounts")
    .select("id, plaid_account_id")
    .eq("item_row_id", item.id);
  for (const a of dbAccounts ?? []) {
    accountMap.set(a.plaid_account_id, a.id);
  }

  let hasMore = true;
  while (hasMore) {
    const syncBody: Record<string, unknown> = {
      access_token: item.access_token,
      count: 500,
    };
    if (cursor) syncBody.cursor = cursor;

    const page = await plaidFetch<{
      added: PlaidTransaction[];
      modified: PlaidTransaction[];
      removed: { transaction_id: string }[];
      next_cursor: string;
      has_more: boolean;
    }>("/transactions/sync", syncBody);

    const upsertRows = [...page.added, ...page.modified]
      .map((tx) => {
        const accountId = accountMap.get(tx.account_id);
        if (!accountId) return null;
        return {
          plaid_transaction_id: tx.transaction_id,
          account_id: accountId,
          amount: tx.amount,
          date: tx.date,
          name: tx.name,
          merchant_name: tx.merchant_name,
          primary_category: mapCategory(tx),
          pending: tx.pending,
          iso_currency_code: tx.iso_currency_code ?? "USD",
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (upsertRows.length > 0) {
      const { error } = await admin
        .from("banking_transactions")
        .upsert(upsertRows, { onConflict: "plaid_transaction_id" });
      if (error) throw error;
    }

    if (page.removed.length > 0) {
      const ids = page.removed.map((r) => r.transaction_id);
      await admin.from("banking_transactions").delete().in("plaid_transaction_id", ids);
    }

    cursor = page.next_cursor;
    hasMore = page.has_more;
  }

  await admin
    .from("banking_plaid_items")
    .update({
      cursor: cursor ?? null,
      last_synced_at: new Date().toISOString(),
      status: "active",
    })
    .eq("id", item.id);
}
