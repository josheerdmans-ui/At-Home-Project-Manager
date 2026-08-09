import { useMemo, useState } from "react";
import type { BankingTransactionRow } from "../../../types";
import { cardClass } from "./banking-ui";
import {
  displayName,
  formatCurrencyExact,
  isIncome,
} from "./banking-utils";

type Props = {
  transactions: BankingTransactionRow[];
};

type Tab = "recent" | "in" | "out";

export function TransactionsSection({ transactions }: Props) {
  const [tab, setTab] = useState<Tab>("recent");

  const rows = useMemo(() => {
    let list = [...transactions];
    if (tab === "in") list = list.filter(isIncome);
    if (tab === "out") list = list.filter((t) => !t.pending && t.amount > 0);
    return list.slice(0, 12);
  }, [transactions, tab]);

  return (
    <section className={`overflow-hidden ${cardClass}`}>
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-100 p-3 sm:p-4">
        {(
          [
            ["recent", "Recent"],
            ["in", "Monthly money in"],
            ["out", "Monthly money out"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
              tab === id
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-400">No transactions</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 sm:px-5">Due date</th>
                <th className="px-3 py-3">To/From</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-4 py-3 text-right sm:px-5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const income = isIncome(tx);
                return (
                  <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600 sm:px-5">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-3 py-3.5 text-sm font-medium text-slate-900">
                      {displayName(tx)}
                    </td>
                    <td className="px-3 py-3.5 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-slate-700">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            tx.pending ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                        {tx.pending ? "Pending" : "Posted"}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3.5 text-right text-sm font-semibold tabular-nums sm:px-5 ${
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
  );
}

/** Right column: recent activity (replaces “Invoice” in the mock) */
export function ActivityPanel({ transactions }: Props) {
  const recent = transactions.slice(0, 6);

  // Payment-style score: share of non-pending txs as "healthy"
  const sample = transactions.slice(0, 20);
  const posted = sample.filter((t) => !t.pending).length;
  const score = sample.length ? Math.round((posted / sample.length) * 100) : 80;
  const bars = 12;
  const filled = Math.round((score / 100) * bars);

  return (
    <section className={`flex h-full flex-col p-5 ${cardClass}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Activity</h2>
        <span className="text-slate-300">···</span>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">Sync score</p>
        <div className="flex items-center gap-2">
          <div className="flex h-5 items-end gap-[2px]">
            {Array.from({ length: bars }, (_, i) => (
              <div
                key={i}
                className="w-[3px] rounded-sm"
                style={{
                  height: `${8 + (i % 4) * 3}px`,
                  background: i < filled ? "#3B5BDB" : "#E2E8F0",
                }}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-slate-900">{score}</span>
        </div>
      </div>

      <ul className="min-h-0 flex-1 space-y-0 divide-y divide-slate-100 overflow-y-auto">
        {recent.length === 0 ? (
          <li className="py-8 text-center text-sm text-slate-400">No activity yet</li>
        ) : (
          recent.map((tx) => {
            const income = isIncome(tx);
            return (
              <li key={tx.id} className="flex items-center gap-3 py-3">
                <div className="w-12 shrink-0 text-center">
                  <p className="text-xs font-semibold text-slate-800">
                    {shortDate(tx.date)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {tx.pending ? "pending" : "posted"}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {displayName(tx)}
                  </p>
                  <span
                    className={`mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium ${
                      tx.pending
                        ? "text-amber-600"
                        : income
                          ? "text-emerald-600"
                          : "text-slate-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        tx.pending
                          ? "bg-amber-500"
                          : income
                            ? "bg-emerald-500"
                            : "bg-slate-400"
                      }`}
                    />
                    {tx.pending ? "Pending" : income ? "Income" : "Expense"}
                  </span>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${
                    income ? "text-emerald-600" : "text-slate-900"
                  }`}
                >
                  {income
                    ? `+${formatCurrencyExact(Math.abs(tx.amount))}`
                    : formatCurrencyExact(Math.abs(tx.amount))}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}

function formatDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  if (!y || !m || !d) return key;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
