import { useState } from "react";
import type { BankingAccountRow } from "../../../types";
import { cardClass } from "./banking-ui";
import {
  formatCurrency,
  formatCurrencyExact,
  formatRelativeTime,
  summarizeAccounts,
} from "./banking-utils";
import { ConnectBankButton } from "./ConnectBankButton";
import { useBankingMutations, useBankingSettings } from "./useBanking";
import { Loader2, RefreshCw } from "lucide-react";

/** Compact accounts + investments for settings-style use (not main dashboard widget). */
export function AccountsManagePanel({
  accounts,
  hasConnection,
}: {
  accounts: BankingAccountRow[];
  hasConnection: boolean;
}) {
  const summary = summarizeAccounts(accounts);
  const { data: settings } = useBankingSettings();
  const { syncNow, updateInvestments } = useBankingMutations();
  const investments = Number(settings?.investments_amount ?? 0);
  const [draft, setDraft] = useState(String(investments || ""));
  const [edit, setEdit] = useState(false);

  return (
    <section className={`p-5 sm:p-6 ${cardClass}`}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#1B1D21]">Linked accounts</h3>
        {hasConnection && (
          <button
            type="button"
            disabled={syncNow.isPending}
            onClick={() => syncNow.mutate()}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#6C5DD3]"
          >
            {syncNow.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Sync · {formatRelativeTime(settings?.last_synced_at)}
          </button>
        )}
      </div>
      {!hasConnection ? (
        <div className="py-6 text-center">
          <ConnectBankButton />
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-[#808191]">Checking</span>
            <span className="font-semibold">{formatCurrency(summary.checking)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-[#808191]">Card</span>
            <span className="font-semibold">{formatCurrency(summary.card)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-[#808191]">Savings</span>
            <span className="font-semibold">{formatCurrency(summary.savings)}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-[#808191]">Net cash</span>
            <span className="font-semibold text-[#3DD598]">{formatCurrency(summary.netCash)}</span>
          </li>
          <li className="flex items-center justify-between border-t border-[#F0F0F4] pt-2">
            <span className="text-[#808191]">Investments</span>
            {edit ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(String(draft).replace(/[,$]/g, ""));
                  if (Number.isFinite(n) && n >= 0) {
                    updateInvestments.mutate(n, { onSuccess: () => setEdit(false) });
                  }
                }}
              >
                <input
                  className="w-24 rounded-lg border border-[#EFEFEF] px-2 py-1 text-right text-sm font-bold outline-none focus:border-[#6C5DD3]"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="text-xs font-bold text-[#6C5DD3]">
                  Save
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="font-semibold text-[#6C5DD3]"
                onClick={() => {
                  setDraft(String(investments || ""));
                  setEdit(true);
                }}
              >
                {investments > 0 ? formatCurrencyExact(investments) : "Add +"}
              </button>
            )}
          </li>
        </ul>
      )}
      {hasConnection && (
        <div className="mt-4">
          <ConnectBankButton
            label="Link another"
            className="text-sm font-semibold text-[#6C5DD3]"
          />
        </div>
      )}
    </section>
  );
}
