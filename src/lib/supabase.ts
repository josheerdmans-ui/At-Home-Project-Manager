import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { env } from "./env";

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
