import type { NinjaItemArea, NinjaItemPriority, NinjaItemStage } from "../../types";

export type { NinjaItemArea, NinjaItemPriority, NinjaItemStage };

export type NinjaItemImage = {
  id: string;
  itemId: string;
  filePath: string;
  fileName: string;
  fileMime: string | null;
  createdAt: string;
};

export type NinjaItemCheck = {
  id: string;
  itemId: string;
  title: string;
  done: boolean;
  sortOrder: number;
};

export type NinjaItemActivity = {
  id: string;
  actor: string;
  message: string;
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
  dueDate: string | null;
  priority: NinjaItemPriority;
  tags: string[];
  images: NinjaItemImage[];
  checks: NinjaItemCheck[];
  activity: NinjaItemActivity[];
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

export const NINJA_PRIORITIES: {
  id: NinjaItemPriority;
  label: string;
}[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

export function ninjaImagePublicUrl(filePath: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/vault-files/${filePath}`;
}

export function sanitizeNinjaFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

export function formatDueDate(value: string | null): string {
  if (!value) return "No date";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatActivityTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
