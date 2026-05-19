import type { VaultDocType, VaultDocumentRow } from "../../../types";

export type VaultDocument = VaultDocumentRow;

export const VAULT_DOC_TYPES: { id: VaultDocType | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "warranty", label: "Warranties" },
  { id: "house_document", label: "House documents" },
  { id: "repair_note", label: "Repair notes" },
  { id: "remodel_note", label: "Remodel notes" },
];

export const DOC_TYPE_OPTIONS: { id: VaultDocType; label: string; description: string }[] = [
  {
    id: "warranty",
    label: "Warranty",
    description: "Manuals, receipts, and warranty dates",
  },
  {
    id: "house_document",
    label: "House document",
    description: "Photos and notes for anything around the home",
  },
  {
    id: "repair_note",
    label: "Repair note",
    description: "Repair details, photos, and cost — or import from Projects",
  },
  {
    id: "remodel_note",
    label: "Remodel note",
    description: "Remodel details, photos, and cost — or import from Projects",
  },
];

export const DEMO_DOCUMENT: VaultDocument = {
  id: "demo",
  doc_type: "warranty",
  title: "Example — Dishwasher Manual",
  category: "appliances",
  notes: "Demo entry. Add a real document to get started.",
  details: null,
  cost: null,
  purchase_date: "2024-06-01",
  warranty_expires: "2027-06-01",
  project_id: null,
  project_title: null,
  file_path: "demo/example.pdf",
  file_name: "manual.pdf",
  file_mime: "application/pdf",
  extra_files: [],
  created_at: "",
  updated_at: "",
};
