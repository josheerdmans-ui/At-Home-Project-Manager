import { ChevronRight, FileText, Hammer, Home, Image, Wrench } from "lucide-react";
import type { VaultDocType, VaultDocumentRow } from "../../../types";
import { displayCategory, displayDocType, formatCost, warrantyInfo } from "./vault-utils";

type Props = {
  document: VaultDocumentRow;
  isDemo?: boolean;
  onClick: () => void;
};

function TypeIcon({ docType }: { docType: VaultDocType }) {
  const cls = "text-cyan-600";
  switch (docType) {
    case "warranty":
      return <FileText size={20} className={cls} />;
    case "house_document":
      return <Home size={20} className={cls} />;
    case "repair_note":
      return <Wrench size={20} className={cls} />;
    case "remodel_note":
      return <Hammer size={20} className={cls} />;
  }
}

export function DocumentCard({ document: doc, isDemo, onClick }: Props) {
  const warranty = doc.doc_type === "warranty" ? warrantyInfo(doc.warranty_expires) : null;
  const isImage = doc.file_mime?.startsWith("image/");
  const costLabel = formatCost(doc.cost);

  const handleActivate = () => {
    if (!isDemo) onClick();
  };

  return (
    <div
      role="button"
      tabIndex={isDemo ? -1 : 0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (isDemo) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative z-10 w-full rounded-3xl border border-white/60 bg-white/40 p-5 text-left shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-xl transition ${
        isDemo
          ? "cursor-default opacity-90 ring-2 ring-dashed ring-cyan-300/60"
          : "cursor-pointer hover:bg-white/60 hover:shadow-lg hover:ring-2 hover:ring-cyan-400/40 active:scale-[0.99]"
      }`}
    >
      {isDemo && (
        <span className="mb-2 inline-block rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-cyan-700">
          Demo — add a document to edit
        </span>
      )}
      {!isDemo && (
        <span className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-cyan-700">
          Tap to view & edit <ChevronRight size={14} />
        </span>
      )}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
          {displayDocType(doc.doc_type)}
          {doc.category ? ` · ${displayCategory(doc.category)}` : ""}
        </span>
        {isImage ? <Image size={20} className="text-cyan-600" /> : <TypeIcon docType={doc.doc_type} />}
      </div>
      <h3 className="mb-2 text-xl font-black text-slate-900">{doc.title}</h3>
      {warranty && (warranty.status === "soon" || warranty.status === "overdue") && warranty.message && (
        <div
          className={`mb-2 rounded-xl px-3 py-2 text-sm font-bold ${
            warranty.status === "overdue"
              ? "bg-red-50/90 text-red-800 ring-1 ring-red-200"
              : "bg-amber-50/90 text-amber-900 ring-1 ring-amber-200"
          }`}
        >
          {warranty.message}
        </div>
      )}
      {doc.project_title && (
        <p className="mb-1 text-xs font-bold text-cyan-700">From project: {doc.project_title}</p>
      )}
      {costLabel && <p className="mb-1 text-sm font-bold text-slate-700">{costLabel}</p>}
      {doc.purchase_date && doc.doc_type === "warranty" && (
        <p className="text-sm font-semibold text-slate-500">
          Purchased {new Date(doc.purchase_date).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
