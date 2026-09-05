import type { NinjaItemArea, NinjaItemStage } from "../../types";

export type { NinjaItemArea, NinjaItemStage };

export type NinjaItemImage = {
  id: string;
  itemId: string;
  filePath: string;
  fileName: string;
  fileMime: string | null;
  createdAt: string;
};

export type NinjaItem = {
  id: string;
  title: string;
  info: string;
  details: string;
  stage: NinjaItemStage;
  area: NinjaItemArea;
  owner: string | null;
  images: NinjaItemImage[];
  createdAt: string;
  updatedAt: string;
};

export const NINJA_AREAS: {
  id: NinjaItemArea;
  label: string;
}[] = [
  { id: "character_design", label: "Character Design" },
  { id: "level_up_system", label: "Level Up System" },
  { id: "game_design_vfx", label: "Game Design VFX" },
  { id: "core_gameplay", label: "Core Gameplay" },
  { id: "character_progression", label: "Character Progression" },
];

export const NINJA_STAGES: {
  id: NinjaItemStage;
  label: string;
}[] = [
  { id: "idea", label: "Ideas" },
  { id: "working_on", label: "Working on" },
  { id: "confirmed", label: "Confirmed" },
  { id: "implemented", label: "Implemented" },
];

export function ninjaImagePublicUrl(filePath: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/vault-files/${filePath}`;
}

export function sanitizeNinjaFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}
