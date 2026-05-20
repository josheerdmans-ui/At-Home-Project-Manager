import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import type { VaultDocumentInsert, VaultDocumentUpdate, VaultExtraFile } from "../../../types";
import { defaultVaultTitle, parseExtraFiles, sanitizeFileName } from "./vault-utils";

const VAULT_KEY = ["vault_documents"] as const;

export function isMissingTableError(message: string) {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("schema cache")
  );
}

function isMissingColumnError(message: string) {
  return message.includes("doc_type") || message.includes("column") && message.includes("does not exist");
}

export { isMissingColumnError };

async function uploadFile(documentId: string, file: File): Promise<VaultExtraFile> {
  const safeName = sanitizeFileName(file.name);
  const path = `${documentId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage.from("vault-files").upload(path, file, { upsert: true });
  if (error) throw error;
  return { path, name: file.name, mime: file.type || null };
}

async function fetchDocuments() {
  const { data, error } = await supabase
    .from("vault_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...row,
    doc_type: row.doc_type ?? "warranty",
    extra_files: parseExtraFiles(row.extra_files),
  }));
}

export function useVaultDocuments() {
  return useQuery({
    queryKey: VAULT_KEY,
    queryFn: fetchDocuments,
    retry: false,
  });
}

export type CreateVaultDocumentInput = Omit<
  VaultDocumentInsert,
  "file_path" | "file_name" | "file_mime" | "extra_files" | "id"
> & {
  files: File[];
};

export function useVaultDocumentsMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: VAULT_KEY });

  const createDocument = useMutation({
    mutationFn: async (input: CreateVaultDocumentInput) => {
      const id = crypto.randomUUID();
      const docType = input.doc_type ?? "warranty";
      const uploaded: VaultExtraFile[] = [];
      for (const file of input.files) {
        uploaded.push(await uploadFile(id, file));
      }
      const primary =
        uploaded[0] ??
        ({
          path: `${id}/.no-attachment`,
          name: "No attachment",
          mime: null,
        } satisfies VaultExtraFile);
      const extra = uploaded.slice(1);

      const row: VaultDocumentInsert = {
        id,
        doc_type: docType,
        title: defaultVaultTitle(docType, input.title),
        category: input.category ?? null,
        notes: input.notes ?? null,
        details: input.details ?? null,
        cost: input.cost ?? null,
        purchase_date: input.purchase_date ?? null,
        warranty_expires: input.warranty_expires ?? null,
        project_id: input.project_id ?? null,
        project_title: input.project_title ?? null,
        file_path: primary.path,
        file_name: primary.name,
        file_mime: primary.mime,
        extra_files: extra,
      };

      const { data, error } = await supabase.from("vault_documents").insert(row).select().single();
      if (error) throw error;
      return { ...data, extra_files: parseExtraFiles(data.extra_files) };
    },
    onSuccess: invalidate,
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: VaultDocumentUpdate }) => {
      const { data, error } = await supabase.from("vault_documents").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return { ...data, extra_files: parseExtraFiles(data.extra_files) };
    },
    onSuccess: invalidate,
  });

  const deleteDocument = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vault_documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const replaceFile = useMutation({
    mutationFn: async ({ id, file, existingPath }: { id: string; file: File; existingPath: string }) => {
      const uploaded = await uploadFile(id, file);
      const { data, error } = await supabase
        .from("vault_documents")
        .update({
          file_path: uploaded.path,
          file_name: uploaded.name,
          file_mime: uploaded.mime,
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      if (existingPath !== uploaded.path) {
        await supabase.storage.from("vault-files").remove([existingPath]);
      }
      return { ...data, extra_files: parseExtraFiles(data.extra_files) };
    },
    onSuccess: invalidate,
  });

  const addExtraFiles = useMutation({
    mutationFn: async ({
      id,
      files,
      existingExtra,
    }: {
      id: string;
      files: File[];
      existingExtra: VaultExtraFile[];
    }) => {
      const uploaded: VaultExtraFile[] = [];
      for (const file of files) {
        uploaded.push(await uploadFile(id, file));
      }
      const extra_files = [...existingExtra, ...uploaded];
      const { data, error } = await supabase
        .from("vault_documents")
        .update({ extra_files })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { ...data, extra_files: parseExtraFiles(data.extra_files) };
    },
    onSuccess: invalidate,
  });

  return { createDocument, updateDocument, deleteDocument, replaceFile, addExtraFiles };
}
