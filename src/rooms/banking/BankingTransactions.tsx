import type { BankingTransactionRow } from "../../../types";
import { groupTransactionsByDate } from "./banking-utils";
import { TransactionRow } from "./RecentTransactionsPanel";

type Props = {
  transactions: BankingTransactionRow[];
};

export function BankingTransactions({ transactions }: Props) {
  const groups = groupTransactionsByDate(transactions);

  return (
    <div className="p-6 sm:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-slate-800">Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">
          {transactions.length === 0
            ? "No transactions synced yet"
            : `${transactions.length} transaction${transactions.length === 1 ? "" : "s"}`}
        </p>
      </header>

      {groups.length === 0 ? (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-12 text-center text-slate-500 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
          Connect and sync from Dashboard to load transactions.
        </div>
      ) : (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl sm:p-6">
          <div className="space-y-6">
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
        </div>
      )}
    </div>
  );
}
