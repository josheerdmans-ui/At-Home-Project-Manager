import type { BankingTransactionRow } from "../../../types";
import { categorySpendForMonth, formatCurrency, formatCurrencyExact } from "./banking-utils";

type Props = {
  transactions: BankingTransactionRow[];
};

export function BankingSpending({ transactions }: Props) {
  const categories = categorySpendForMonth(transactions);
  const max = Math.max(1, ...categories.map((c) => c.amount));
  const total = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="p-6 sm:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-800">Spending</h1>
        <p className="mt-1 text-sm text-slate-500">
          This month by category · {formatCurrency(total)} total
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-12 text-center text-slate-500 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
          No categorized spend this month yet. Sync your accounts from the dashboard.
        </div>
      ) : (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl sm:p-8">
          <div className="space-y-5">
            {categories.map((c) => {
              const pct = (c.amount / max) * 100;
              return (
                <div key={c.category}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-slate-800">{c.category}</span>
                    <span className="text-sm font-bold text-slate-700">
                      {formatCurrencyExact(c.amount)}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-cyan-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
