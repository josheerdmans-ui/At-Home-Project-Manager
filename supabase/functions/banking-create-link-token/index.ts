import { corsHeaders, jsonResponse, plaidFetch, requireUser } from "../_shared/banking.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId } = await requireUser(req);

    const data = await plaidFetch<{ link_token: string; expiration: string }>(
      "/link/token/create",
      {
        user: { client_user_id: userId },
        client_name: "Eerdmans Hub",
        products: ["transactions"],
        country_codes: ["US"],
        language: "en",
      },
    );

    return jsonResponse({ link_token: data.link_token, expiration: data.expiration });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Unauthorized" || message.includes("Authorization") ? 401 : 500;
    return jsonResponse({ error: message }, status);
  }
});
