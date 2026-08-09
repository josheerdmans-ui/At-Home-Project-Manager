import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import type { BankingTransactionRow } from "../../../types";
import { bank, cardClass } from "./banking-ui";
import {
  formatCurrencyExact,
  yearMonthlyFlow,
} from "./banking-utils";

type Props = {
  transactions: BankingTransactionRow[];
  checkingBalance: number;
};

/** Overview: total checking balance + dual-line Income / Expense chart */
export function BalanceOverview({ transactions, checkingBalance }: Props) {
  const year = new Date().getFullYear();
  const months = useMemo(() => yearMonthlyFlow(transactions, year), [transactions, year]);
  const now = new Date();
  const thisIdx = now.getMonth();
  const [hover, setHover] = useState(thisIdx);

  const thisM = months[thisIdx];
  const lastM = months[thisIdx - 1];
  /** This calendar month totals (same source as the dual-line chart). */
  const incomeNow = thisM?.income ?? 0;
  const expenseNow = thisM?.spend ?? 0;

  const maxY = Math.max(
    1,
    ...months.map((m) => Math.max(m.income, m.spend)),
  );
  const yMax = niceCeil(maxY);

  const growth =
    lastM && lastM.income > 0
      ? ((incomeNow - lastM.income) / lastM.income) * 100
      : 0;

  return (
    <section className={`p-5 sm:p-6 ${cardClass}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Overview</h2>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 text-slate-400">
          ···
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        {/* Left stats */}
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Balance</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 tabular-nums sm:text-[2rem]">
              {formatCurrencyExact(checkingBalance)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Checking</p>

            {/* Same month totals as chart / insight — not MoM deltas */}
            <div className="mt-4 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-1">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                <span aria-hidden className="text-base leading-none">
                  ↑
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-emerald-700/80">
                  Income
                </span>
                <span className="tabular-nums">{formatCurrencyExact(incomeNow)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-rose-500">
                <span aria-hidden className="text-base leading-none">
                  ↓
                </span>
                <span className="text-xs font-medium uppercase tracking-wide text-rose-600/80">
                  Expense
                </span>
                <span className="tabular-nums">{formatCurrencyExact(expenseNow)}</span>
              </span>
            </div>
          </div>

          <div className="mt-6 flex gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
            <Sparkles size={14} className="mt-0.5 shrink-0 text-indigo-500" />
            <p>
              {now.toLocaleDateString("en-US", { month: "long" })}: income{" "}
              <span className="font-semibold text-emerald-700">
                {formatCurrencyExact(incomeNow)}
              </span>
              , expenses{" "}
              <span className="font-semibold text-rose-600">
                {formatCurrencyExact(expenseNow)}
              </span>
              {lastM ? (
                <>
                  . Income vs last month{" "}
                  <span
                    className={
                      growth >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-rose-500"
                    }
                  >
                    {growth >= 0 ? "+" : ""}
                    {growth.toFixed(1)}%
                  </span>
                  .
                </>
              ) : (
                "."
              )}
            </p>
          </div>
        </div>

        {/* Dual line chart */}
        <DualLineChart
          months={months}
          yMax={yMax}
          hover={hover}
          onHover={setHover}
        />
      </div>
    </section>
  );
}

function DualLineChart({
  months,
  yMax,
  hover,
  onHover,
}: {
  months: { label: string; income: number; spend: number; key: string }[];
  yMax: number;
  hover: number;
  onHover: (i: number) => void;
}) {
  const W = 520;
  const H = 200;
  const pad = { t: 16, r: 40, b: 28, l: 8 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;
  const n = Math.max(months.length - 1, 1);

  const xAt = (i: number) => pad.l + (i / n) * iW;
  const yAt = (v: number) => pad.t + iH - (v / yMax) * iH;

  const incomePts = months.map((m, i) => ({ x: xAt(i), y: yAt(m.income), v: m.income }));
  const expensePts = months.map((m, i) => ({ x: xAt(i), y: yAt(m.spend), v: m.spend }));

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => t * yMax);
  const active = months[hover];
  const ax = xAt(hover);

  return (
    <div className="relative min-h-[200px]">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-48 w-full select-none sm:h-52">
        {/* grid + y labels right */}
        {yTicks.map((t) => {
          const y = yAt(t);
          return (
            <g key={t}>
              <line
                x1={pad.l}
                y1={y}
                x2={pad.l + iW}
                y2={y}
                stroke="#EEF0F5"
                strokeWidth="1"
              />
              <text
                x={W - 4}
                y={y + 3}
                textAnchor="end"
                fill="#94A3B8"
                style={{ fontSize: 9, fontFamily: "system-ui, sans-serif" }}
              >
                {formatAxis(t)}
              </text>
            </g>
          );
        })}

        <path
          d={smoothPath(incomePts)}
          fill="none"
          stroke={bank.blueLine}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={smoothPath(expensePts)}
          fill="none"
          stroke={bank.greenLine}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* hover guide + dots */}
        <line
          x1={ax}
          y1={pad.t}
          x2={ax}
          y2={pad.t + iH}
          stroke="#CBD5E1"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <circle cx={ax} cy={yAt(active?.income ?? 0)} r="4.5" fill={bank.blueLine} stroke="#fff" strokeWidth="2" />
        <circle cx={ax} cy={yAt(active?.spend ?? 0)} r="4.5" fill={bank.greenLine} stroke="#fff" strokeWidth="2" />

        {/* hit targets */}
        {months.map((m, i) => (
          <rect
            key={m.key}
            x={xAt(i) - iW / 24}
            y={pad.t}
            width={iW / 12}
            height={iH}
            fill="transparent"
            onMouseEnter={() => onHover(i)}
          />
        ))}

        {/* x labels */}
        {months.map((m, i) => (
          <text
            key={m.key}
            x={xAt(i)}
            y={H - 6}
            textAnchor="middle"
            fill={i === hover ? bank.navy : "#94A3B8"}
            style={{ fontSize: 9, fontWeight: i === hover ? 700 : 500, fontFamily: "system-ui, sans-serif" }}
          >
            {m.label.toUpperCase().slice(0, 3)}
          </text>
        ))}
      </svg>

      {/* tooltip */}
      {active && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-lg"
          style={{ left: `${(ax / W) * 100}%` }}
        >
          <p className="text-[11px] font-semibold text-slate-800">
            {active.label} {new Date().getFullYear()}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: bank.blueLine }} />
            Income {formatCurrencyExact(active.income)}
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: bank.greenLine }} />
            Expense {formatCurrencyExact(active.spend)}
          </p>
        </div>
      )}
      <div className="mt-1 flex justify-end gap-4 pr-1 text-[10px] font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ background: bank.blueLine }} />
          Income
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full" style={{ background: bank.greenLine }} />
          Expense
        </span>
      </div>
    </div>
  );
}

function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? 0 : i - 1]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function niceCeil(n: number): number {
  if (n <= 0) return 1000;
  const exp = Math.floor(Math.log10(n));
  const base = 10 ** exp;
  const frac = n / base;
  const nice = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
  return nice * base;
}

function formatAxis(n: number): string {
  if (n === 0) return "0";
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}
