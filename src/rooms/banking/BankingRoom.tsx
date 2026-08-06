import { useEffect, useRef, useState, type ReactNode } from "react";
import { LayoutDashboard, PieChart, Receipt, Wallet } from "lucide-react";
import type { BankingAccountRow, BankingTransactionRow } from "../../../types";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { BANKING_SETUP_SQL } from "../../lib/banking-setup-sql";
import { AccountsPanel } from "./AccountsPanel";
import { BankingSpending } from "./BankingSpending";
import { BankingTransactions } from "./BankingTransactions";
import { CurrentSpendPanel } from "./CurrentSpendPanel";
import { RecentTransactionsPanel } from "./RecentTransactionsPanel";
import { isMissingTableError } from "./banking-utils";
import {
  useBankingAccounts,
  useBankingMutations,
  useBankingSettings,
  useBankingTransactions,
} from "./useBanking";

type NavId = "dashboard" | "spending" | "transactions";

export function BankingRoom() {
  const [nav, setNav] = useState<NavId>("dashboard");
  const didAutoSync = useRef(false);
  const accountsQ = useBankingAccounts();
  const txsQ = useBankingTransactions();
  const settingsQ = useBankingSettings();
  const { syncNow } = useBankingMutations();

  const missingTable = [accountsQ.error, txsQ.error, settingsQ.error]
    .filter(Boolean)
    .map((e) => (e instanceof Error ? e.message : String(e)))
    .some(isMissingTableError);

  const accounts = accountsQ.data ?? [];
  const transactions = txsQ.data ?? [];
  const hasConnection = accounts.length > 0 || (settingsQ.data?.connection_count ?? 0) > 0;
  const loading = accountsQ.isLoading || txsQ.isLoading;

  useEffect(() => {
    if (didAutoSync.current || !hasConnection || missingTable) return;
    didAutoSync.current = true;
    void syncNow.mutateAsync().catch(() => {
      /* panel surfaces errors */
    });
  }, [hasConnection, missingTable, syncNow]);

  if (missingTable) {
    return (
      <div className="flex min-h-full flex-col p-8 sm:p-12">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-orange-100 p-4 text-orange-600">
            <Wallet size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-800">Banking</h1>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <DbSetupPanel title="Banking database setup" sql={BANKING_SETUP_SQL} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-white/50 bg-white/30 p-4 backdrop-blur-md sm:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <Wallet size={22} className="text-orange-500" />
          <span className="text-sm font-black tracking-tight text-slate-800">Banking</span>
        </div>
        <nav className="flex flex-col gap-1">
          <NavButton
            active={nav === "dashboard"}
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            onClick={() => setNav("dashboard")}
          />
          <NavButton
            active={nav === "spending"}
            icon={<PieChart size={18} />}
            label="Spending"
            onClick={() => setNav("spending")}
          />
          <NavButton
            active={nav === "transactions"}
            icon={<Receipt size={18} />}
            label="Transactions"
            onClick={() => setNav("transactions")}
          />
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex gap-2 border-b border-white/50 bg-white/30 p-3 sm:hidden">
          {(
            [
              ["dashboard", "Dashboard"],
              ["spending", "Spending"],
              ["transactions", "Transactions"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setNav(id)}
              className={`flex-1 rounded-full px-3 py-2 text-xs font-bold ${
                nav === id ? "bg-orange-500 text-white" : "bg-white/60 text-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="p-12 text-center text-slate-500">Loading banking…</p>
        ) : nav === "dashboard" ? (
          <DashboardView
            accounts={accounts}
            transactions={transactions}
            hasConnection={hasConnection}
          />
        ) : nav === "spending" ? (
          <BankingSpending transactions={transactions} />
        ) : (
          <BankingTransactions transactions={transactions} />
        )}
      </div>
    </div>
  );
}

function DashboardView({
  accounts,
  transactions,
  hasConnection,
}: {
  accounts: BankingAccountRow[];
  transactions: BankingTransactionRow[];
  hasConnection: boolean;
}) {
  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-4 sm:hidden">
        <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
          <Wallet size={28} />
        </div>
        <h1 className="text-2xl font-black text-slate-800">Dashboard</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="min-h-[280px]">
          <CurrentSpendPanel transactions={transactions} />
        </div>
        <div className="min-h-[280px]">
          <AccountsPanel accounts={accounts} hasConnection={hasConnection} />
        </div>
        <div className="min-h-[320px] lg:col-span-2">
          <RecentTransactionsPanel transactions={transactions} limit={25} />
        </div>
      </div>
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
        active
          ? "bg-orange-500/15 text-orange-700"
          : "text-slate-600 hover:bg-white/50 hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
