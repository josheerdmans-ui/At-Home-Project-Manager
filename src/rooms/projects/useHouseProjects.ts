import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { HouseProjectInsert, HouseProjectRow, HouseProjectUpdate } from "../../../types";
import { migrateHouseProjectsFromLocalStorage } from "../../lib/migrate-local-storage";
import type { HouseProject, HouseProjectKind } from "../../lib/house-projects-store";
import { supabase } from "../../lib/supabase";

const HOUSE_PROJECTS_KEY = ["house_projects"] as const;

export function isMissingHouseProjectsTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("house_projects")
  );
}

function rowToProject(row: HouseProjectRow): HouseProject {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    details: row.details,
    cost: row.cost,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchHouseProjects(): Promise<HouseProject[]> {
  const { data, error } = await supabase
    .from("house_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) {
    await migrateHouseProjectsFromLocalStorage();
    const { data: again, error: againError } = await supabase
      .from("house_projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (againError) throw againError;
    return (again ?? []).map(rowToProject);
  }

  return rows.map(rowToProject);
}

export function useHouseProjects() {
  return useQuery({
    queryKey: HOUSE_PROJECTS_KEY,
    queryFn: fetchHouseProjects,
    retry: false,
  });
}

export function useHouseProjectsMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: HOUSE_PROJECTS_KEY });

  const createProject = useMutation({
    mutationFn: async (
      input: Omit<HouseProject, "id" | "createdAt" | "updatedAt">,
    ) => {
      const row: HouseProjectInsert = {
        title: input.title,
        kind: input.kind,
        details: input.details,
        cost: input.cost,
        notes: input.notes,
      };
      const { data, error } = await supabase.from("house_projects").insert(row).select().single();
      if (error) throw error;
      return rowToProject(data);
    },
    onSuccess: invalidate,
  });

  const updateProject = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<Omit<HouseProject, "id" | "createdAt" | "updatedAt">>;
    }) => {
      const row: HouseProjectUpdate = {
        title: patch.title,
        kind: patch.kind,
        details: patch.details,
        cost: patch.cost,
        notes: patch.notes,
      };
      const { data, error } = await supabase
        .from("house_projects")
        .update(row)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return rowToProject(data);
    },
    onSuccess: invalidate,
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("house_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createProject, updateProject, deleteProject };
}

export function filterHouseProjects(projects: HouseProject[], kind?: HouseProjectKind) {
  if (!kind) return projects;
  return projects.filter((p) => p.kind === kind);
}

export function findHouseProject(projects: HouseProject[], id: string) {
  return projects.find((p) => p.id === id);
}
