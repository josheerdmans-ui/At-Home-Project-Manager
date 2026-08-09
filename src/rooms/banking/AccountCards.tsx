import type { BankingAccountRow } from "../../../types";
import { bank, cardClass } from "./banking-ui";
import { formatCurrencyExact, summarizeAccounts } from "./banking-utils";
import { ConnectBankButton } from "./ConnectBankButton";
import { useBankingSettings } from "./useBanking";

type Props = {
  accounts: BankingAccountRow[];
  hasConnection: boolean;
};

const GRADS = [
  bank.purpleGrad,
  bank.goldGrad,
  bank.cyanGrad,
] as const;

type DisplayCard = {
  id: string;
  label: string;
  kind: "asset" | "credit" | "invest";
  /** Big number: assets positive, card debt negative */
  primary: number;
  primaryCaption: string;
  /** e.g. credit limit */
  secondary?: number;
  secondaryCaption?: string;
  /** e.g. available credit */
  tertiary?: number;
  tertiaryCaption?: string;
  mask: string;
  brand: string;
};

export function AccountCards({ accounts, hasConnection }: Props) {
  const summary = summarizeAccounts(accounts);
  const { data: settings } = useBankingSettings();
  const investments = Number(settings?.investments_amount ?? 0);

  const cards: DisplayCard[] = [];

  // Checking — one card (sum) with first account mask
  if (summary.hasChecking || summary.checking !== 0) {
    const a = summary.checkingAccounts[0];
    cards.push({
      id: "checking",
      label: a?.name ?? "Checking",
      kind: "asset",
      primary: summary.checking,
      primaryCaption: "Available balance",
      mask: a?.mask ?? "••••",
      brand: shortBrand(a),
    });
  }

  // Savings
  if (summary.hasSavings || summary.savings !== 0) {
    const a = summary.savingsAccounts[0];
    cards.push({
      id: "savings",
      label: a?.name ?? "Savings",
      kind: "asset",
      primary: summary.savings,
      primaryCaption: "Available balance",
      mask: a?.mask ?? "••••",
      brand: shortBrand(a),
    });
  }

  // Credit cards — prefer one card per linked credit account (Capital One, etc.)
  if (summary.cardAccounts.length > 0) {
    for (const a of summary.cardAccounts) {
      const credit = creditFigures(a);
      cards.push({
        id: a.id,
        label: friendlyCardName(a),
        kind: "credit",
        // Debt is money you don't have → show negative
        primary: -credit.owed,
        primaryCaption: "Balance owed",
        secondary: credit.limit ?? undefined,
        secondaryCaption: credit.limit != null ? "Card total (limit)" : undefined,
        tertiary: credit.available ?? undefined,
        tertiaryCaption: credit.available != null ? "Available credit" : undefined,
        mask: a.mask ?? "••••",
        brand: shortBrand(a) || "Card",
      });
    }
  } else if (summary.hasCard || summary.card > 0) {
    cards.push({
      id: "card-sum",
      label: "Credit card",
      kind: "credit",
      primary: -Math.abs(summary.card),
      primaryCaption: "Balance owed",
      mask: "••••",
      brand: "Card",
    });
  }

  if (investments > 0) {
    cards.push({
      id: "invest",
      label: "Investments",
      kind: "invest",
      primary: investments,
      primaryCaption: "Manual total",
      mask: "manual",
      brand: "INV",
    });
  }

  if (cards.length === 0) {
    cards.push(
      {
        id: "checking-empty",
        label: "Checking",
        kind: "asset",
        primary: 0,
        primaryCaption: "Available balance",
        mask: "••••",
        brand: "—",
      },
      {
        id: "savings-empty",
        label: "Savings",
        kind: "asset",
        primary: 0,
        primaryCaption: "Available balance",
        mask: "••••",
        brand: "—",
      },
    );
  }

  // Prefer show all credit + deposits; cap soft at 4 to keep column readable
  const show = cards.slice(0, 4);

  return (
    <section className={`flex h-full flex-col p-5 ${cardClass}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Accounts</h2>
        <span className="text-slate-300">···</span>
      </div>

      <div className="flex flex-col gap-3">
        {show.map((c, i) => (
          <div
            key={c.id}
            className="relative overflow-hidden rounded-2xl p-4 text-white shadow-md"
            style={{ background: GRADS[i % GRADS.length] }}
          >
            <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold tracking-wide text-white/90">{c.label}</p>
                {c.kind === "credit" && (
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-white/55">
                    Credit · debt
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                {c.brand}
              </span>
            </div>

            <p
              className={`mt-3 text-xl font-bold tabular-nums tracking-tight ${
                c.kind === "credit" ? "text-rose-100" : ""
              }`}
            >
              {formatCurrencyExact(c.primary)}
            </p>
            <p className="text-[11px] font-medium text-white/70">{c.primaryCaption}</p>

            {c.kind === "credit" && (c.secondary != null || c.tertiary != null) && (
              <div className="mt-3 space-y-1 rounded-xl bg-black/15 px-3 py-2 text-[11px]">
                {c.secondary != null && c.secondaryCaption && (
                  <div className="flex items-center justify-between gap-2 text-white/85">
                    <span>{c.secondaryCaption}</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrencyExact(c.secondary)}
                    </span>
                  </div>
                )}
                {c.tertiary != null && c.tertiaryCaption && (
                  <div className="flex items-center justify-between gap-2 text-white/85">
                    <span>{c.tertiaryCaption}</span>
                    <span className="font-semibold tabular-nums text-emerald-200">
                      {formatCurrencyExact(c.tertiary)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-white/80">
              <span className="tracking-widest">
                {c.mask === "manual" ? "Typed total" : `···· ···· ···· ${c.mask}`}
              </span>
              <span>{c.kind === "credit" ? "Owed" : "Active"}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        {hasConnection ? (
          <ConnectBankButton
            label="+ Link another"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
          />
        ) : (
          <ConnectBankButton label="+ Link bank account" />
        )}
      </div>
    </section>
  );
}

/** Credit: owed (positive), available remaining, estimated limit */
function creditFigures(a: BankingAccountRow): {
  owed: number;
  available: number | null;
  limit: number | null;
} {
  const raw = a.current_balance ?? 0;
  // Plaid credit balances are usually positive owed; sometimes negative
  const owed = Math.abs(raw);
  const available =
    a.available_balance != null && Number.isFinite(a.available_balance)
      ? Math.max(0, a.available_balance)
      : null;
  // Prefer limit ≈ owed + available when both make sense
  const limit =
    available != null && available + owed > 0 ? available + owed : available != null ? available : null;
  return { owed, available, limit };
}

function friendlyCardName(a: BankingAccountRow): string {
  const n = (a.official_name || a.name || "Credit card").trim();
  // Shorten long official names a bit
  if (n.length > 28) return `${n.slice(0, 26)}…`;
  return n;
}

function shortBrand(a: BankingAccountRow | undefined): string {
  if (!a) return "—";
  const n = `${a.name} ${a.official_name ?? ""}`.toLowerCase();
  if (n.includes("capital one")) return "C1";
  if (n.includes("chase")) return "Chase";
  if (n.includes("amex") || n.includes("american express")) return "Amex";
  if (n.includes("citi")) return "Citi";
  if (n.includes("visa")) return "Visa";
  if (n.includes("mastercard") || n.includes("master card")) return "MC";
  if (n.includes("discover")) return "Disc";
  const sub = (a.subtype ?? a.type ?? "").slice(0, 4);
  return sub ? sub.toUpperCase() : "Card";
}
