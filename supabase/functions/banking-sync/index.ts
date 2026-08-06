import {
  adminClient,
  corsHeaders,
  jsonResponse,
  refreshConnectionMeta,
  requireUser,
  syncItemTransactions,
} from "../_shared/banking.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await requireUser(req);
    const admin = adminClient();

    const { data: items, error } = await admin
      .from("banking_plaid_items")
      .select("id, access_token, cursor, status");

    if (error) throw error;
    if (!items || items.length === 0) {
      return jsonResponse({ ok: true, synced: 0, message: "No linked accounts" });
    }

    let synced = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        await syncItemTransactions(admin, {
          id: item.id,
          access_token: item.access_token,
          cursor: item.cursor,
        });
        synced += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "sync failed";
        errors.push(msg);
        await admin
          .from("banking_plaid_items")
          .update({ status: msg.toLowerCase().includes("login") ? "needs_reauth" : "error" })
          .eq("id", item.id);
      }
    }

    await refreshConnectionMeta(admin);

    return jsonResponse({
      ok: errors.length === 0,
      synced,
      errors: errors.length ? errors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" || message.includes("Authorization") ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
});
