import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import type { BankingTransactionRow } from "../../../types";
import { cardClass, prettyCategory } from "./banking-ui";
import {
  categorySpendForMonth,
  formatCurrencyExact,
  isIncome,
  isSpend,
} from "./banking-utils";

type Props = {
  transactions: BankingTransactionRow[];
};

function thisMonthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, "0");
  const startKey = `${y}-${m}-01`;
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endKey = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
  return { startKey, endKey };
}

export function MoneyMovement({ transactions }: Props) {
  const { startKey, endKey } = thisMonthBounds();
  let moneyIn = 0;
  let moneyOut = 0;
  for (const tx of transactions) {
    if (tx.date < startKey || tx.date > endKey) continue;
    if (isIncome(tx)) moneyIn += Math.abs(tx.amount);
    if (isSpend(tx)) moneyOut += tx.amount;
  }

  // Biggest income merchant/category this month
  const incomeBy = new Map<string, number>();
  const spendCats = categorySpendForMonth(transactions);
  for (const tx of transactions) {
    if (tx.date < startKey || tx.date > endKey) continue;
    if (!isIncome(tx)) continue;
    const key = tx.merchant_name || tx.name || "Other";
    incomeBy.set(key, (incomeBy.get(key) ?? 0) + Math.abs(tx.amount));
  }
  let topIncome = { name: "—", amt: 0 };
  for (const [name, amt] of incomeBy) {
    if (amt > topIncome.amt) topIncome = { name, amt };
  }
  const topSpend = spendCats[0];
  const incomePct = moneyIn > 0 ? (topIncome.amt / moneyIn) * 100 : 0;
  const spendPct =
    moneyOut > 0 && topSpend ? (topSpend.amount / moneyOut) * 100 : 0;

  // Segment bars: top portion + remainder
  const inSeg1 = moneyIn > 0 ? Math.min(100, incomePct) : 0;
  const outSeg1 = moneyOut > 0 ? Math.min(100, spendPct) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MovementCard
        title="Money in"
        amount={moneyIn}
        barColors={["#1A2B88", "#93C5FD"]}
        seg1={inSeg1}
        footnote={
          topIncome.amt > 0 ? (
            <>
              The biggest income this month is from{" "}
              <span className="font-semibold text-slate-800">{topIncome.name}</span>{" "}
              {incomePct.toFixed(1)}%
            </>
          ) : (
            "No income recorded this month yet"
          )
        }
      />
      <MovementCard
        title="Money Out"
        amount={moneyOut}
        barColors={["#B42318", "#FDBA74"]}
        seg1={outSeg1}
        footnote={
          topSpend ? (
            <>
              The biggest expend this month is from{" "}
              <span className="font-semibold text-slate-800">
                {prettyCategory(topSpend.category)}
              </span>{" "}
              {spendPct.toFixed(1)}%
            </>
          ) : (
            "No expenses recorded this month yet"
          )
        }
      />
    </div>
  );
}

function MovementCard({
  title,
  amount,
  barColors,
  seg1,
  footnote,
}: {
  title: string;
  amount: number;
  barColors: [string, string];
  seg1: number;
  footnote: ReactNode;
}) {
  const seg2 = Math.max(0, 100 - seg1);
  return (
    <section className={`p-5 ${cardClass}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
            {formatCurrencyExact(amount)}
          </p>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50"
          aria-label="Add"
        >
          <Plus size={16} />
        </button>
      </div>
      <div className="mb-3 flex h-2.5 gap-1 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(seg1, amount > 0 ? 8 : 0)}%`, background: barColors[0] }}
        />
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(seg2, amount > 0 ? 4 : 0)}%`, background: barColors[1] }}
        />
      </div>
      <p className="text-xs leading-relaxed text-slate-500">{footnote}</p>
    </section>
  );
}
