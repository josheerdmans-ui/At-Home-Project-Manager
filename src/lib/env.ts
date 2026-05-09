type RequiredEnvKey = "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY";

function getRequiredEnvValue(key: RequiredEnvKey): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  supabaseUrl: getRequiredEnvValue("VITE_SUPABASE_URL"),
  supabaseAnonKey: getRequiredEnvValue("VITE_SUPABASE_ANON_KEY"),
  appName: import.meta.env.VITE_APP_NAME ?? "At Home Project Manager",
  appEnv: import.meta.env.VITE_APP_ENV ?? "development",
  debugLogs: import.meta.env.VITE_ENABLE_DEBUG_LOGS === "true",
} as const;
