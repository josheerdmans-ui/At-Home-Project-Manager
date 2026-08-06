import type { BankingTransactionRow } from "../../../types";
import {
  displayName,
  formatCurrencyExact,
  groupTransactionsByDate,
  isIncome,
} from "./banking-utils";

type Props = {
  transactions: BankingTransactionRow[];
  limit?: number;
  emptyLabel?: string;
};

export function RecentTransactionsPanel({
  transactions,
  limit = 20,
  emptyLabel = "No transactions yet",
}: Props) {
  const sliced = transactions.slice(0, limit);
  const groups = groupTransactionsByDate(sliced);

  return (
    <section className="flex h-full flex-col rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
      <h2 className="mb-4 text-lg font-bold text-slate-800">Recent Transactions</h2>
      {groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {groups.map((g) => (
            <div key={g.date}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                {g.label}
              </p>
              <ul className="divide-y divide-slate-100">
                {g.items.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function TransactionRow({ tx }: { tx: BankingTransactionRow }) {
  const income = isIncome(tx);
  const amount = Math.abs(tx.amount);
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
        {initials(displayName(tx))}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-800">{displayName(tx)}</p>
        <p className="truncate text-xs text-slate-500">
          {tx.primary_category}
          {tx.pending ? " · Pending" : ""}
        </p>
      </div>
      <span
        className={`shrink-0 font-bold ${income ? "text-emerald-600" : "text-slate-800"}`}
      >
        {income ? `+${formatCurrencyExact(amount)}` : formatCurrencyExact(amount)}
      </span>
    </li>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
