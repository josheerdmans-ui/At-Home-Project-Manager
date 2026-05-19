/** Shared project list until House Projects room is built — used for Vault import. */

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

const STORAGE_KEY = "eerdmans_house_projects";

function readAll(): HouseProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HouseProject[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(projects: HouseProject[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function listHouseProjects(kind?: HouseProjectKind): HouseProject[] {
  const all = readAll();
  if (!kind) return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return all.filter((p) => p.kind === kind).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getHouseProject(id: string): HouseProject | undefined {
  return readAll().find((p) => p.id === id);
}

export function saveHouseProject(
  input: Omit<HouseProject, "id" | "createdAt" | "updatedAt"> & { id?: string },
): HouseProject {
  const now = new Date().toISOString();
  const all = readAll();
  if (input.id) {
    const idx = all.findIndex((p) => p.id === input.id);
    const existing = idx >= 0 ? all[idx]! : null;
    const updated: HouseProject = {
      id: input.id,
      title: input.title,
      kind: input.kind,
      details: input.details,
      cost: input.cost,
      notes: input.notes,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    if (idx >= 0) all[idx] = updated;
    else all.push(updated);
    writeAll(all);
    return updated;
  }
  const created: HouseProject = {
    id: crypto.randomUUID(),
    title: input.title,
    kind: input.kind,
    details: input.details,
    cost: input.cost,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };
  all.push(created);
  writeAll(all);
  return created;
}

export function deleteHouseProject(id: string) {
  writeAll(readAll().filter((p) => p.id !== id));
}
