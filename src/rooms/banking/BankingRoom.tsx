import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeftRight,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  PieChart,
  Receipt,
  Send,
  Settings,
  Wallet,
} from "lucide-react";
import type { BankingAccountRow, BankingTransactionRow } from "../../../types";
import { DbSetupPanel } from "../../components/DbSetupPanel";
import { useAuth } from "../../hooks/useAuth";
import { BANKING_SETUP_SQL } from "../../lib/banking-setup-sql";
import { AccountCards } from "./AccountCards";
import { AccountsManagePanel } from "./AccountsPanel";
import { BalanceOverview } from "./BalanceOverview";
import { bank, firstNameFromEmail } from "./banking-ui";
import {
  isMissingTableError,
  summarizeAccounts,
} from "./banking-utils";
import { BankingSpending, BankingTransactions } from "./BankingSpending";
import { ConnectBankButton } from "./ConnectBankButton";
import { MoneyMovement } from "./MoneyMovement";
import { ActivityPanel, TransactionsSection } from "./TransactionsSection";
import {
  useBankingAccounts,
  useBankingMutations,
  useBankingSettings,
  useBankingTransactions,
} from "./useBanking";
import { supabase } from "../../lib/supabase";

type NavId = "dashboard" | "spending" | "transactions" | "accounts";

export function BankingRoom() {
  const [nav, setNav] = useState<NavId>("dashboard");
  const didAutoSync = useRef(false);
  const { user } = useAuth();
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
  const name = firstNameFromEmail(user?.email) || "there";

  useEffect(() => {
    if (didAutoSync.current || !hasConnection || missingTable) return;
    didAutoSync.current = true;
    void syncNow.mutateAsync().catch(() => {});
  }, [hasConnection, missingTable, syncNow]);

  if (missingTable) {
    return (
      <div className="flex min-h-full flex-col bg-[#F6F7FB] p-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900">Banking</h1>
        <DbSetupPanel title="Banking database setup" sql={BANKING_SETUP_SQL} />
      </div>
    );
  }

  return (
    <div
      className="flex min-h-full"
      style={{ background: bank.bg, fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-200/80 bg-white p-4 sm:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A2B88] text-white">
            <Wallet size={18} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Banking</p>
            <p className="text-[10px] text-slate-400">Household</p>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          <NavItem
            active={nav === "dashboard"}
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            onClick={() => setNav("dashboard")}
          />
          <NavItem
            active={nav === "spending"}
            icon={<PieChart size={18} />}
            label="Spending"
            onClick={() => setNav("spending")}
          />
          <NavItem
            active={nav === "transactions"}
            icon={<Receipt size={18} />}
            label="Transactions"
            onClick={() => setNav("transactions")}
          />
          <NavItem
            active={nav === "accounts"}
            icon={<Wallet size={18} />}
            label="Accounts"
            onClick={() => setNav("accounts")}
          />
        </nav>
        <div className="mt-auto space-y-0.5 border-t border-slate-100 pt-4">
          <NavItem icon={<Settings size={18} />} label="Settings" onClick={() => setNav("accounts")} />
          <NavItem icon={<HelpCircle size={18} />} label="Help" onClick={() => {}} />
          <NavItem
            icon={<LogOut size={18} />}
            label="Log out"
            danger
            onClick={() => void supabase.auth.signOut()}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex gap-2 border-b border-slate-200 bg-white p-3 sm:hidden">
          {(
            [
              ["dashboard", "Home"],
              ["spending", "Spend"],
              ["transactions", "Txns"],
              ["accounts", "Accts"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setNav(id)}
              className={`flex-1 rounded-lg py-2 text-xs font-bold ${
                nav === id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <p className="py-20 text-center text-slate-400">Loading banking…</p>
          ) : nav === "dashboard" ? (
            <DashboardPage
              accounts={accounts}
              transactions={transactions}
              hasConnection={hasConnection}
              name={name}
            />
          ) : nav === "spending" ? (
            <BankingSpending transactions={transactions} />
          ) : nav === "transactions" ? (
            <BankingTransactions transactions={transactions} />
          ) : (
            <div className="mx-auto max-w-md space-y-4">
              <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
              <AccountsManagePanel accounts={accounts} hasConnection={hasConnection} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardPage({
  accounts,
  transactions,
  hasConnection,
  name,
}: {
  accounts: BankingAccountRow[];
  transactions: BankingTransactionRow[];
  hasConnection: boolean;
  name: string;
}) {
  const summary = summarizeAccounts(accounts);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top actions — visual parity with mock */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-400">Welcome back</p>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["Send", true],
              ["Request", false],
              ["Transfer", false],
              ["Deposit", false],
            ] as const
          ).map(([label, primary]) => (
            <button
              key={label}
              type="button"
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                primary
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              title="Coming soon"
            >
              {label === "Send" ? <Send size={14} /> : <ArrowLeftRight size={14} />}
              {label}
            </button>
          ))}
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 sm:text-sm"
            title="Coming soon"
          >
            <FileText size={14} />
            Pay Bill
          </button>
        </div>
      </div>

      {!hasConnection && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Link bank & card to populate this dashboard.</p>
          <ConnectBankButton />
        </div>
      )}

      {/* Main 2-col grid */}
      <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-8">
          <BalanceOverview
            transactions={transactions}
            checkingBalance={summary.checking}
          />
          <MoneyMovement transactions={transactions} />
          <TransactionsSection transactions={transactions} />
        </div>

        {/* Right column */}
        <div className="space-y-4 lg:col-span-4">
          <AccountCards accounts={accounts} hasConnection={hasConnection} />
          <ActivityPanel transactions={transactions} />
        </div>
      </div>
    </div>
  );
}

function NavItem({
  active,
  danger,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  danger?: boolean;
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
          ? "bg-slate-900 text-white"
          : danger
            ? "text-rose-500 hover:bg-rose-50"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
