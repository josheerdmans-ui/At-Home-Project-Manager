import type { BankingAccountRow, BankingTransactionRow } from "../../../types";

export function isMissingTableError(message: string): boolean {
  return (
    message.includes("Could not find the table") ||
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("schema cache")
  );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyExact(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  if (Number.isNaN(diff) || diff < 0) return "Just now";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateKey(key: string): Date {
  const parts = key.split("-").map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  return new Date(y, m - 1, d);
}

/** Plaid: positive amount = money leaving the account (spend). */
export function isSpend(tx: BankingTransactionRow): boolean {
  return !tx.pending && tx.amount > 0;
}

export function isIncome(tx: BankingTransactionRow): boolean {
  return !tx.pending && tx.amount < 0;
}

export function monthSpendTotal(txs: BankingTransactionRow[], monthStart: Date, dayEnd: Date): number {
  const startKey = toDateKey(monthStart);
  const endKey = toDateKey(dayEnd);
  let sum = 0;
  for (const tx of txs) {
    if (!isSpend(tx)) continue;
    if (tx.date < startKey || tx.date > endKey) continue;
    sum += tx.amount;
  }
  return sum;
}

export type DaySpendPoint = { day: number; thisMonth: number; lastMonth: number };

export function buildSpendSeries(
  txs: BankingTransactionRow[],
  now = new Date(),
): { series: DaySpendPoint[]; thisTotal: number; lastTotal: number; delta: number } {
  const thisStart = startOfMonth(now);
  const today = endOfDay(now);
  const dayOfMonth = now.getDate();

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastStart = startOfMonth(lastMonthDate);
  const lastEndCompare = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth(), dayOfMonth);

  const daysInThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysInLastMonth = new Date(lastMonthDate.getFullYear(), lastMonthDate.getMonth() + 1, 0).getDate();
  const maxDay = Math.max(daysInThisMonth, daysInLastMonth);

  const thisByDay = new Map<number, number>();
  const lastByDay = new Map<number, number>();

  for (const tx of txs) {
    if (!isSpend(tx)) continue;
    const d = parseDateKey(tx.date);
    if (d >= thisStart && d <= today) {
      thisByDay.set(d.getDate(), (thisByDay.get(d.getDate()) ?? 0) + tx.amount);
    } else if (d >= lastStart && d <= endOfDay(lastEndCompare)) {
      lastByDay.set(d.getDate(), (lastByDay.get(d.getDate()) ?? 0) + tx.amount);
    }
  }

  let thisCum = 0;
  let lastCum = 0;
  const series: DaySpendPoint[] = [];
  for (let day = 1; day <= maxDay; day++) {
    if (day <= dayOfMonth) {
      thisCum += thisByDay.get(day) ?? 0;
    }
    if (day <= Math.min(dayOfMonth, daysInLastMonth)) {
      lastCum += lastByDay.get(day) ?? 0;
    }
    series.push({
      day,
      thisMonth: day <= dayOfMonth ? thisCum : NaN,
      lastMonth: day <= Math.min(dayOfMonth, daysInLastMonth) ? lastCum : NaN,
    });
  }

  // Fill trailing NaN for chart - only show through today
  const visible = series.filter((p) => p.day <= dayOfMonth);
  const lastPoint = visible[visible.length - 1];
  const thisTotal = lastPoint?.thisMonth ?? 0;
  const lastTotal = lastPoint?.lastMonth ?? 0;

  return {
    series: visible,
    thisTotal,
    lastTotal,
    delta: thisTotal - lastTotal,
  };
}

export type AccountSummary = {
  checking: number;
  card: number;
  savings: number;
  netCash: number;
  hasChecking: boolean;
  hasCard: boolean;
  hasSavings: boolean;
  checkingAccounts: BankingAccountRow[];
  cardAccounts: BankingAccountRow[];
  savingsAccounts: BankingAccountRow[];
};

export function accountBucket(a: BankingAccountRow): "checking" | "card" | "savings" | "other" {
  const sub = (a.subtype ?? "").toLowerCase();
  const type = a.type.toLowerCase();
  if (type === "credit" || sub.includes("credit") || sub === "paypal") return "card";
  if (type === "depository" && (sub === "savings" || sub === "hsa" || sub === "cd" || sub === "money market")) {
    return "savings";
  }
  if (type === "depository") return "checking";
  if (type === "loan") return "other";
  return "checking";
}

export function summarizeAccounts(accounts: BankingAccountRow[]): AccountSummary {
  let checking = 0;
  let card = 0;
  let savings = 0;
  let hasChecking = false;
  let hasCard = false;
  let hasSavings = false;
  const checkingAccounts: BankingAccountRow[] = [];
  const cardAccounts: BankingAccountRow[] = [];
  const savingsAccounts: BankingAccountRow[] = [];

  for (const a of accounts) {
    const bal = a.current_balance ?? 0;
    const bucket = accountBucket(a);
    if (bucket === "card") {
      card += Math.abs(bal);
      hasCard = true;
      cardAccounts.push(a);
    } else if (bucket === "savings") {
      savings += bal;
      hasSavings = true;
      savingsAccounts.push(a);
    } else if (bucket === "checking") {
      checking += bal;
      hasChecking = true;
      checkingAccounts.push(a);
    }
  }

  return {
    checking,
    card,
    savings,
    netCash: checking - card,
    hasChecking,
    hasCard,
    hasSavings,
    checkingAccounts,
    cardAccounts,
    savingsAccounts,
  };
}

export type CategorySpend = { category: string; amount: number };

export function categorySpendForMonth(
  txs: BankingTransactionRow[],
  now = new Date(),
): CategorySpend[] {
  const start = startOfMonth(now);
  const end = endOfDay(now);
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);
  const map = new Map<string, number>();

  for (const tx of txs) {
    if (!isSpend(tx)) continue;
    if (tx.date < startKey || tx.date > endKey) continue;
    const cat = tx.primary_category || "Uncategorized";
    map.set(cat, (map.get(cat) ?? 0) + tx.amount);
  }

  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export type MonthFlow = {
  key: string;
  label: string;
  monthIndex: number;
  year: number;
  spend: number;
  income: number;
};

/** Calendar months for a full year (Jan–Dec) of the given year. */
export function yearMonthlyFlow(txs: BankingTransactionRow[], year = new Date().getFullYear()): MonthFlow[] {
  const months: MonthFlow[] = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(year, m, 1);
    const key = `${year}-${String(m + 1).padStart(2, "0")}`;
    months.push({
      key,
      label: d.toLocaleDateString("en-US", { month: "short" }),
      monthIndex: m,
      year,
      spend: 0,
      income: 0,
    });
  }
  const byKey = new Map(months.map((row) => [row.key, row]));

  for (const tx of txs) {
    if (tx.pending) continue;
    const key = tx.date.slice(0, 7);
    const row = byKey.get(key);
    if (!row) continue;
    if (tx.amount > 0) row.spend += tx.amount;
    else if (tx.amount < 0) row.income += Math.abs(tx.amount);
  }
  return months;
}

/** Last `count` calendar months of spend/income for bar charts. */
export function monthlyCashFlow(txs: BankingTransactionRow[], count = 6, now = new Date()): MonthFlow[] {
  const months: MonthFlow[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    months.push({
      key,
      label,
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      spend: 0,
      income: 0,
    });
  }
  const byKey = new Map(months.map((m) => [m.key, m]));

  for (const tx of txs) {
    if (tx.pending) continue;
    const key = tx.date.slice(0, 7);
    const row = byKey.get(key);
    if (!row) continue;
    if (tx.amount > 0) row.spend += tx.amount;
    else if (tx.amount < 0) row.income += Math.abs(tx.amount);
  }
  return months;
}

export function monthIncomeTotal(
  txs: BankingTransactionRow[],
  monthStart: Date,
  dayEnd: Date,
): number {
  const startKey = toDateKey(monthStart);
  const endKey = toDateKey(dayEnd);
  let sum = 0;
  for (const tx of txs) {
    if (!isIncome(tx)) continue;
    if (tx.date < startKey || tx.date > endKey) continue;
    sum += Math.abs(tx.amount);
  }
  return sum;
}

export type MetricPair = { thisMonth: number; lastMonth: number };

export function earningsSpendMetrics(txs: BankingTransactionRow[], now = new Date()): {
  earnings: MetricPair;
  spending: MetricPair;
} {
  const thisStart = startOfMonth(now);
  const thisEnd = endOfDay(now);
  const lastDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastStart = startOfMonth(lastDate);
  const lastEnd = endOfDay(new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0));

  return {
    earnings: {
      thisMonth: monthIncomeTotal(txs, thisStart, thisEnd),
      lastMonth: monthIncomeTotal(txs, lastStart, lastEnd),
    },
    spending: {
      thisMonth: monthSpendTotal(txs, thisStart, thisEnd),
      lastMonth: monthSpendTotal(txs, lastStart, lastEnd),
    },
  };
}

export function primaryCreditCard(accounts: BankingAccountRow[]): BankingAccountRow | null {
  const cards = accounts.filter((a) => {
    const sub = (a.subtype ?? "").toLowerCase();
    return a.type.toLowerCase() === "credit" || sub.includes("credit");
  });
  return cards[0] ?? null;
}

export function groupTransactionsByDate(
  txs: BankingTransactionRow[],
): { date: string; label: string; items: BankingTransactionRow[] }[] {
  const map = new Map<string, BankingTransactionRow[]>();
  for (const tx of txs) {
    const list = map.get(tx.date) ?? [];
    list.push(tx);
    map.set(tx.date, list);
  }
  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({
      date,
      label: formatDateLabel(date),
      items,
    }));
}

function formatDateLabel(dateKey: string): string {
  const d = parseDateKey(dateKey);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export function displayName(tx: BankingTransactionRow): string {
  return tx.merchant_name?.trim() || tx.name;
}
