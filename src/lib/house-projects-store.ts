/** House project types — data lives in Supabase (`house_projects` table). */

export type HouseProjectKind = "repair" | "remodel" | "general";

export type HouseProject = {
  id: string;
  title: string;
  kind: HouseProjectKind;
  details: string;
  cost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};
