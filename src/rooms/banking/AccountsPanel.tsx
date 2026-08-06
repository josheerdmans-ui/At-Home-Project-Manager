import { useState, type ReactNode } from "react";
import {
  Building2,
  CreditCard,
  Landmark,
  Loader2,
  PiggyBank,
  RefreshCw,
  Wallet,
} from "lucide-react";
import type { BankingAccountRow } from "../../../types";
import {
  formatCurrency,
  formatRelativeTime,
  summarizeAccounts,
} from "./banking-utils";
import { ConnectBankButton } from "./ConnectBankButton";
import { useBankingMutations, useBankingSettings } from "./useBanking";

type Props = {
  accounts: BankingAccountRow[];
  hasConnection: boolean;
};

export function AccountsPanel({ accounts, hasConnection }: Props) {
  const { data: settings } = useBankingSettings();
  const { syncNow, updateInvestments } = useBankingMutations();
  const summary = summarizeAccounts(accounts);
  const investments = Number(settings?.investments_amount ?? 0);
  const [editInvest, setEditInvest] = useState(false);
  const [investDraft, setInvestDraft] = useState(String(investments || ""));

  const lastSync = settings?.last_synced_at;

  return (
    <section className="flex h-full flex-col rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">Accounts</h2>
        {hasConnection ? (
          <button
            type="button"
            disabled={syncNow.isPending}
            onClick={() => syncNow.mutate()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-700 hover:text-cyan-900 disabled:opacity-50"
          >
            {syncNow.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Sync now
            <span className="font-normal text-slate-400">· {formatRelativeTime(lastSync)}</span>
          </button>
        ) : null}
      </div>

      {!hasConnection ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-8">
          <p className="text-sm text-slate-500">Link your bank and credit card via Plaid</p>
          <ConnectBankButton />
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          <AccountRow
            icon={<Landmark size={18} />}
            label="Checking"
            value={summary.hasChecking ? formatCurrency(summary.checking) : "—"}
          />
          <AccountRow
            icon={<CreditCard size={18} />}
            label="Card Balance"
            value={summary.hasCard ? formatCurrency(summary.card) : "—"}
          />
          <AccountRow
            icon={<Wallet size={18} />}
            label="Net Cash"
            value={formatCurrency(summary.netCash)}
            valueClass={summary.netCash >= 0 ? "text-emerald-600" : "text-red-600"}
          />
          {(summary.hasSavings || summary.savings > 0) && (
            <AccountRow
              icon={<PiggyBank size={18} />}
              label="Savings"
              value={formatCurrency(summary.savings)}
            />
          )}
          <li className="flex items-center justify-between gap-3 rounded-2xl px-2 py-3 hover:bg-white/50">
            <div className="flex items-center gap-3 text-slate-700">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Building2 size={18} />
              </span>
              <span className="font-semibold">Investments</span>
            </div>
            {editInvest ? (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const n = Number(String(investDraft).replace(/[,$]/g, ""));
                  if (Number.isFinite(n) && n >= 0) {
                    updateInvestments.mutate(n, {
                      onSuccess: () => setEditInvest(false),
                    });
                  }
                }}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  value={investDraft}
                  onChange={(e) => setInvestDraft(e.target.value)}
                  className="w-28 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-sm font-bold text-slate-800 outline-none focus:border-cyan-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-xs font-bold text-cyan-700"
                  disabled={updateInvestments.isPending}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="text-xs text-slate-500"
                  onClick={() => {
                    setEditInvest(false);
                    setInvestDraft(String(investments || ""));
                  }}
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setInvestDraft(investments ? String(investments) : "");
                  setEditInvest(true);
                }}
                className="text-right font-bold text-slate-800 hover:text-cyan-700"
                title="Tap to edit"
              >
                {investments > 0 ? formatCurrency(investments) : "Add +"}
              </button>
            )}
          </li>
        </ul>
      )}

      {hasConnection && (
        <div className="mt-4 border-t border-slate-200/60 pt-4">
          <ConnectBankButton
            label="Link another account"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 underline-offset-2 hover:text-cyan-700 hover:underline"
          />
        </div>
      )}

      {syncNow.isError && (
        <p className="mt-2 text-xs text-red-600">
          {syncNow.error instanceof Error ? syncNow.error.message : "Sync failed"}
        </p>
      )}
    </section>
  );
}

function AccountRow({
  icon,
  label,
  value,
  valueClass = "text-slate-800",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl px-2 py-3 hover:bg-white/50">
      <div className="flex items-center gap-3 text-slate-700">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          {icon}
        </span>
        <span className="font-semibold">{label}</span>
      </div>
      <span className={`font-bold ${valueClass}`}>{value}</span>
    </li>
  );
}
