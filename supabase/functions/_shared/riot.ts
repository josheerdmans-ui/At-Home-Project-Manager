import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

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

export async function requireUser(req: Request): Promise<void> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Unauthorized");

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error("Unauthorized");
}

export type LolPlatform =
  | "na1"
  | "euw1"
  | "eun1"
  | "kr"
  | "br1"
  | "la1"
  | "la2"
  | "jp1"
  | "oc1"
  | "tr1"
  | "ru"
  | "sg2"
  | "tw2"
  | "vn2";

export type RegionalRoute = "americas" | "europe" | "asia" | "sea";

const PLATFORM_TO_REGIONAL: Record<LolPlatform, RegionalRoute> = {
  na1: "americas",
  br1: "americas",
  la1: "americas",
  la2: "americas",
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  kr: "asia",
  jp1: "asia",
  oc1: "sea",
  sg2: "sea",
  tw2: "sea",
  vn2: "sea",
};

export function regionalForPlatform(platform: LolPlatform): RegionalRoute {
  return PLATFORM_TO_REGIONAL[platform];
}

export function riotApiKey(): string {
  const key = Deno.env.get("RIOT_API_KEY") ?? "";
  if (!key) throw new Error("Missing RIOT_API_KEY secret on the edge function");
  return key;
}

export async function riotGet<T>(host: string, path: string): Promise<T> {
  const url = `https://${host}.api.riotgames.com${path}`;
  const res = await fetch(url, {
    headers: {
      "X-Riot-Token": riotApiKey(),
    },
  });
  if (res.status === 404) {
    throw new Error("Not found");
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Riot API ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}
