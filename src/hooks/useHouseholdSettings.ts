import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HouseholdSettingsRow, HouseholdSettingsUpdate } from "../../types";
import { supabase } from "../lib/supabase";

const SETTINGS_KEY = ["household_settings"] as const;

const DEFAULT_SETTINGS: HouseholdSettingsRow = {
  id: 1,
  frame_interval_sec: 8,
  frame_shuffle: true,
  frame_include_person: true,
  updated_at: new Date().toISOString(),
};

export function isMissingSettingsTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("household_settings")
  );
}

async function fetchSettings(): Promise<HouseholdSettingsRow> {
  const { data, error } = await supabase.from("household_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return data ?? DEFAULT_SETTINGS;
}

export function useHouseholdSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
    retry: false,
  });
}

export function useHouseholdSettingsMutations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: HouseholdSettingsUpdate) => {
      const { data, error } = await supabase
        .from("household_settings")
        .upsert({ id: 1, ...patch }, { onConflict: "id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}
