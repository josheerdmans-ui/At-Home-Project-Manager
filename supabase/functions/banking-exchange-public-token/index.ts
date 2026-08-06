import {
  adminClient,
  corsHeaders,
  jsonResponse,
  plaidFetch,
  refreshConnectionMeta,
  requireUser,
  syncItemTransactions,
  upsertAccounts,
  type PlaidAccount,
} from "../_shared/banking.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await requireUser(req);
    const body = (await req.json()) as {
      public_token?: string;
      institution_name?: string | null;
    };
    if (!body.public_token) {
      return jsonResponse({ error: "public_token is required" }, 400);
    }

    const exchanged = await plaidFetch<{ access_token: string; item_id: string }>(
      "/item/public_token/exchange",
      { public_token: body.public_token },
    );

    const admin = adminClient();

    const { data: itemRow, error: itemErr } = await admin
      .from("banking_plaid_items")
      .upsert(
        {
          item_id: exchanged.item_id,
          access_token: exchanged.access_token,
          institution_name: body.institution_name ?? null,
          status: "active",
        },
        { onConflict: "item_id" },
      )
      .select("id, access_token, cursor")
      .single();

    if (itemErr || !itemRow) throw itemErr ?? new Error("Failed to store Plaid item");

    // Pull accounts immediately
    const accountsRes = await plaidFetch<{ accounts: PlaidAccount[] }>("/accounts/get", {
      access_token: exchanged.access_token,
    });
    await upsertAccounts(admin, itemRow.id, accountsRes.accounts);

    try {
      await syncItemTransactions(admin, {
        id: itemRow.id,
        access_token: itemRow.access_token,
        cursor: itemRow.cursor,
      });
    } catch (syncErr) {
      // Transactions may not be ready instantly; accounts still linked
      console.error("Initial sync warning:", syncErr);
    }

    await refreshConnectionMeta(admin);

    return jsonResponse({ ok: true, item_row_id: itemRow.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" || message.includes("Authorization") ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
});
