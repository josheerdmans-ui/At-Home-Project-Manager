import type { VaultDocType } from "../../../types";
import { VAULT_DOC_TYPES } from "./types";

type Props = {
  active: VaultDocType | "all";
  onChange: (docType: VaultDocType | "all") => void;
};

export function CategorySidebar({ active, onChange }: Props) {
  return (
    <nav className="flex w-[200px] shrink-0 flex-col gap-2" aria-label="Vault filters">
      {VAULT_DOC_TYPES.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`rounded-full px-4 py-2.5 text-left text-sm font-bold transition ${
              isActive
                ? "bg-cyan-600 text-white shadow-md"
                : "border border-white/60 bg-white/40 text-slate-700 backdrop-blur-xl hover:bg-white/70"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
