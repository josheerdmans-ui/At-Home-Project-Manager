import type { BankingTransactionRow } from "../../../types";
import { cardClass, prettyCategory } from "./banking-ui";
import { categorySpendForMonth, displayName, formatCurrencyExact } from "./banking-utils";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { isIncome } from "./banking-utils";

export function BankingSpending({ transactions }: { transactions: BankingTransactionRow[] }) {
  const categories = categorySpendForMonth(transactions);
  const total = categories.reduce((s, c) => s + c.amount, 0);
  const max = Math.max(1, ...categories.map((c) => c.amount));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Spending</h1>
        <p className="mt-1 text-sm text-slate-500">
          This month ·{" "}
          <span className="font-semibold text-slate-800">{formatCurrencyExact(total)}</span>
        </p>
      </header>
      <section className={`p-5 sm:p-6 ${cardClass}`}>
        {categories.length === 0 ? (
          <p className="text-sm text-slate-400">No categorized spend this month.</p>
        ) : (
          <div className="space-y-4">
            {categories.map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-800">{prettyCategory(c.category)}</span>
                  <span className="font-semibold tabular-nums">{formatCurrencyExact(c.amount)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#1A2B88]"
                    style={{ width: `${(c.amount / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function BankingTransactions({ transactions }: { transactions: BankingTransactionRow[] }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return transactions;
    return transactions.filter((tx) =>
      `${displayName(tx)} ${tx.name} ${tx.primary_category}`.toLowerCase().includes(needle),
    );
  }, [transactions, q]);

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="mt-1 text-sm text-slate-500">{filtered.length} records</p>
        </div>
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <Search size={14} className="text-slate-400" />
          <input
            className="bg-transparent text-sm outline-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
          />
        </label>
      </header>
      <section className={`overflow-hidden ${cardClass}`}>
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">No transactions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase text-slate-400">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-3 py-3 text-left">To/From</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const income = isIncome(tx);
                  return (
                    <tr key={tx.id} className="border-b border-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">{tx.date}</td>
                      <td className="px-3 py-3 text-sm font-medium text-slate-900">
                        {displayName(tx)}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600">
                        {tx.pending ? "Pending" : "Posted"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-semibold tabular-nums ${
                          income ? "text-emerald-600" : "text-slate-900"
                        }`}
                      >
                        {income
                          ? `+${formatCurrencyExact(Math.abs(tx.amount))}`
                          : formatCurrencyExact(Math.abs(tx.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
