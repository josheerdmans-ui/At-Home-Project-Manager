import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { env } from "./env";

function isPublishableKey(key: string) {
  return key.startsWith("sb_publishable_");
}

/**
 * New publishable keys are not JWTs. If login is skipped, supabase-js still
 * sends Authorization: Bearer <publishable key>, and PostgREST rejects it.
 * Keep the key on apikey only until a real user session exists.
 */
function fetchWithoutPublishableBearer(input: RequestInfo | URL, init?: RequestInit) {
  if (!isPublishableKey(env.supabaseAnonKey)) {
    return fetch(input, init);
  }

  const headers = new Headers(init?.headers);
  const authorization = headers.get("Authorization");
  if (authorization === `Bearer ${env.supabaseAnonKey}`) {
    headers.delete("Authorization");
  }

  return fetch(input, { ...init, headers });
}

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchWithoutPublishableBearer,
  },
});
