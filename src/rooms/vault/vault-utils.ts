import type { VaultCategory, VaultDocType, VaultDocumentRow, VaultExtraFile } from "../../../types";

export type WarrantyStatus = "ok" | "soon" | "overdue" | "none";

export type WarrantyInfo = {
  status: WarrantyStatus;
  daysUntil: number | null;
  message: string | null;
};

export type VaultNotification = {
  id: string;
  documentId: string;
  title: string;
  message: string;
  severity: "amber" | "red";
  kind: "warranty";
};

const CATEGORY_LABELS: Record<VaultCategory, string> = {
  appliances: "Appliances",
  electronics: "Electronics",
  home_repair: "Home Repair",
  vehicles: "Vehicles",
};

const DOC_TYPE_LABELS: Record<VaultDocType, string> = {
  warranty: "Warranty",
  house_document: "House document",
  repair_note: "Repair note",
  remodel_note: "Remodel note",
};

export function displayCategory(category: VaultCategory | null): string {
  if (!category) return "";
  return CATEGORY_LABELS[category];
}

export function displayDocType(docType: VaultDocType): string {
  return DOC_TYPE_LABELS[docType];
}

const NO_FILE_SUFFIX = "/.no-attachment";

export function isPlaceholderFile(path: string): boolean {
  return path.endsWith(NO_FILE_SUFFIX);
}

export function defaultVaultTitle(docType: VaultDocType, title?: string): string {
  const t = title?.trim();
  if (t) return t;
  switch (docType) {
    case "warranty":
      return "Untitled warranty";
    case "house_document":
      return "House document";
    case "repair_note":
      return "Repair note";
    case "remodel_note":
      return "Remodel note";
  }
}

export function warrantyInfo(warrantyExpires: string | null): WarrantyInfo {
  if (!warrantyExpires) {
    return { status: "none", daysUntil: null, message: "No warranty date set" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(warrantyExpires);
  exp.setHours(0, 0, 0, 0);
  const daysUntil = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    const overdue = Math.abs(daysUntil);
    return {
      status: "overdue",
      daysUntil,
      message: `Warranty expired ${overdue} day${overdue === 1 ? "" : "s"} ago`,
    };
  }

  if (daysUntil <= 30) {
    return {
      status: "soon",
      daysUntil,
      message:
        daysUntil === 0
          ? "Warranty expires today"
          : `Warranty expires in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
    };
  }

  return {
    status: "ok",
    daysUntil,
    message: `Warranty valid — ${daysUntil} days remaining`,
  };
}

export function filePublicUrl(filePath: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/vault-files/${filePath}`;
}

export function isPreviewableMime(mime: string | null): boolean {
  if (!mime) return false;
  return mime === "application/pdf" || mime.startsWith("image/");
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function parseExtraFiles(raw: unknown): VaultExtraFile[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (f): f is VaultExtraFile =>
      typeof f === "object" &&
      f !== null &&
      typeof (f as VaultExtraFile).path === "string" &&
      typeof (f as VaultExtraFile).name === "string",
  );
}

export function allDocumentFiles(doc: VaultDocumentRow): VaultExtraFile[] {
  const extra = parseExtraFiles(doc.extra_files);
  if (isPlaceholderFile(doc.file_path)) return extra;
  const primary: VaultExtraFile = {
    path: doc.file_path,
    name: doc.file_name,
    mime: doc.file_mime,
  };
  return [primary, ...extra];
}

export function filterDocuments(
  docs: VaultDocumentRow[],
  searchQuery: string,
  docType: VaultDocType | "all",
): VaultDocumentRow[] {
  const q = searchQuery.trim().toLowerCase();
  return docs.filter((d) => {
    if (docType !== "all" && d.doc_type !== docType) return false;
    if (!q) return true;
    const hay = `${d.title} ${d.notes ?? ""} ${d.details ?? ""} ${d.project_title ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

export function collectVaultNotifications(docs: VaultDocumentRow[]): VaultNotification[] {
  const notes: VaultNotification[] = [];
  for (const d of docs) {
    if (d.doc_type !== "warranty") continue;
    const w = warrantyInfo(d.warranty_expires);
    if (w.status === "overdue") {
      notes.push({
        id: `${d.id}-warranty`,
        documentId: d.id,
        title: d.title,
        message: w.message ?? "Warranty expired",
        severity: "red",
        kind: "warranty",
      });
    } else if (w.status === "soon") {
      notes.push({
        id: `${d.id}-warranty`,
        documentId: d.id,
        title: d.title,
        message: w.message ?? "Warranty expiring soon",
        severity: "amber",
        kind: "warranty",
      });
    }
  }
  return notes;
}

export function formatCost(cost: number | null): string | null {
  if (cost == null) return null;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cost);
}
