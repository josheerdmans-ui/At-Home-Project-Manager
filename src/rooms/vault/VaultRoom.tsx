import { useMemo, useState } from "react";
import { Archive, Plus, Search } from "lucide-react";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { VAULT_SETUP_SQL } from "../../lib/vault-setup-sql";
import { CategorySidebar } from "./CategorySidebar";
import { DocumentCard } from "./DocumentCard";
import { DocumentModal } from "./DocumentModal";
import { NewDocumentModal } from "./NewDocumentModal";
import { DEMO_DOCUMENT } from "./types";
import { filterDocuments } from "./vault-utils";
import type { VaultDocType, VaultDocumentRow } from "../../../types";
import { isMissingTableError, useVaultDocuments, useVaultDocumentsMutations } from "./useVaultDocuments";

export function VaultRoom() {
  const { data: documents = [], isLoading, error } = useVaultDocuments();
  const mut = useVaultDocumentsMutations();
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<VaultDocumentRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState<VaultDocType | "all">("all");

  const showDemo = documents.length === 0 && !isLoading && !error;

  const filtered = useMemo(
    () => filterDocuments(documents, searchQuery, docTypeFilter),
    [documents, searchQuery, docTypeFilter],
  );

  if (error && isMissingTableError(error.message)) {
    return (
      <div className="flex min-h-full flex-col p-12">
        <Header onNew={() => setShowNew(true)} />
        <div className="flex flex-1 items-center justify-center">
          <DbSetupPanel title="Vault database setup" sql={VAULT_SETUP_SQL} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-12">
      <Header onNew={() => setShowNew(true)} />

      <div className="relative z-10 mb-8">
        <Search
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-cyan-600"
          size={22}
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search the vault — warranties, photos, repairs, remodels…"
          className="w-full rounded-2xl border border-white/60 bg-white/40 py-4 pl-14 pr-5 text-lg font-semibold text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl placeholder:font-medium placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        />
      </div>

      {!isLoading && documents.length > 0 && (
        <p className="mb-4 text-sm font-semibold text-slate-500">
          {filtered.length} of {documents.length} document{documents.length !== 1 ? "s" : ""}
        </p>
      )}

      <div className="flex gap-8">
        <CategorySidebar active={docTypeFilter} onChange={setDocTypeFilter} />
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <p className="text-center text-slate-500">Loading documents…</p>
          ) : documents.length === 0 && !showDemo ? (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <p className="text-xl font-medium text-slate-500">No documents yet</p>
              <button
                type="button"
                onClick={() => setShowNew(true)}
                className="rounded-full bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-700"
              >
                Add your first document
              </button>
            </div>
          ) : (
            <div className="relative z-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {showDemo && (
                <DocumentCard document={DEMO_DOCUMENT} isDemo onClick={() => {}} />
              )}
              {filtered.map((d) => (
                <DocumentCard
                  key={d.id}
                  document={d}
                  onClick={() => setSelected(d)}
                />
              ))}
            </div>
          )}
          {filtered.length === 0 && documents.length > 0 && !isLoading && (
            <p className="py-12 text-center text-slate-500">No documents match your search.</p>
          )}
        </div>
      </div>

      {error && !isMissingTableError(error.message) && (
        <p className="mt-4 text-center text-red-600">{error.message}</p>
      )}

      {showNew && (
        <NewDocumentModal
          busy={mut.createDocument.isPending}
          onClose={() => setShowNew(false)}
          onCreate={async (input) => {
            const created = await mut.createDocument.mutateAsync(input);
            setShowNew(false);
            setSelected(created);
          }}
        />
      )}

      {selected && (
        <DocumentModal
          document={documents.find((d) => d.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
          onDeleted={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Header({ onNew }: { onNew: () => void }) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-4 pr-44">
      <div className="rounded-2xl bg-cyan-100 p-4 text-cyan-700">
        <Archive size={40} />
      </div>
      <h1 className="text-4xl font-black tracking-tight text-slate-800">The Vault</h1>
      <button
        type="button"
        onClick={onNew}
        className="flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-5 py-2.5 text-sm font-bold text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-xl transition hover:bg-cyan-600 hover:text-white"
      >
        <Plus size={18} />
        New document
      </button>
    </div>
  );
}
