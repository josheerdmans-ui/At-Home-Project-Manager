import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { VehicleInsert, VehicleIssueInsert, VehicleUpdate } from "../../../types";
import type { VehicleWithIssues } from "./types";

const VEHICLES_KEY = ["vehicles"] as const;
const GARAGE_HAS_DATA_KEY = "eerdmans_garage_has_data";

export function garageHasRealData(): boolean {
  return localStorage.getItem(GARAGE_HAS_DATA_KEY) === "1";
}

export function markGarageHasData() {
  localStorage.setItem(GARAGE_HAS_DATA_KEY, "1");
}

function isMissingTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    message.includes("relation") && message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

async function fetchVehicles(): Promise<VehicleWithIssues[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*, vehicle_issues(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as VehicleWithIssues[];
}

export function useVehicles() {
  return useQuery({
    queryKey: VEHICLES_KEY,
    queryFn: fetchVehicles,
    retry: false,
  });
}

export function useVehiclesMutations() {
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: VEHICLES_KEY });

  const createVehicle = useMutation({
    mutationFn: async (input: VehicleInsert) => {
      const { data, error } = await supabase.from("vehicles").insert(input).select().single();
      if (error) throw error;
      markGarageHasData();
      return data;
    },
    onSuccess: invalidate,
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: VehicleUpdate }) => {
      const { data, error } = await supabase.from("vehicles").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const createIssue = useMutation({
    mutationFn: async (input: VehicleIssueInsert) => {
      const { data, error } = await supabase.from("vehicle_issues").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateIssue = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Pick<VehicleIssueInsert, "description" | "severity" | "status">>;
    }) => {
      const { data, error } = await supabase.from("vehicle_issues").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const deleteIssue = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicle_issues").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const uploadPhoto = useMutation({
    mutationFn: async ({ vehicleId, file }: { vehicleId: string; file: File }) => {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${vehicleId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("vehicle-photos").upload(path, file, {
        upsert: true,
      });
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase
        .from("vehicles")
        .update({ photo_path: path })
        .eq("id", vehicleId);
      if (updateError) throw updateError;
      return path;
    },
    onSuccess: invalidate,
  });

  return {
    createVehicle,
    updateVehicle,
    deleteVehicle,
    createIssue,
    updateIssue,
    deleteIssue,
    uploadPhoto,
  };
}

export { isMissingTableError };
