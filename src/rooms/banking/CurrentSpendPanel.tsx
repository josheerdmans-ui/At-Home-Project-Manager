import type { BankingTransactionRow } from "../../../types";
import {
  buildSpendSeries,
  formatCurrency,
  type DaySpendPoint,
} from "./banking-utils";

type Props = {
  transactions: BankingTransactionRow[];
};

export function CurrentSpendPanel({ transactions }: Props) {
  const { series, thisTotal, delta } = buildSpendSeries(transactions);
  const more = delta > 0;
  const less = delta < 0;

  return (
    <section className="flex h-full flex-col rounded-3xl border border-white/70 bg-white/70 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-800">Current Spend</h2>
        {series.length > 0 && (
          <p className="text-sm font-medium text-slate-500">
            You&apos;ve spent{" "}
            <span className={more ? "text-orange-600" : less ? "text-emerald-600" : "text-slate-600"}>
              {formatCurrency(Math.abs(delta))}
            </span>{" "}
            {more ? "more" : less ? "less" : "the same"} than last month
            {more ? " ↑" : less ? " ↓" : ""}
          </p>
        )}
      </div>
      <p className="mb-4 text-5xl font-black tracking-tight text-slate-800">
        {formatCurrency(thisTotal)}
      </p>
      <div className="min-h-0 flex-1">
        <SpendChart series={series} />
      </div>
    </section>
  );
}

function SpendChart({ series }: { series: DaySpendPoint[] }) {
  if (series.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">
        No spend data yet this month
      </div>
    );
  }

  const width = 560;
  const height = 180;
  const pad = { t: 12, r: 12, b: 28, l: 12 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const maxY = Math.max(
    1,
    ...series.map((p) => Math.max(p.thisMonth || 0, p.lastMonth || 0)),
  );

  const x = (i: number) => pad.l + (i / Math.max(series.length - 1, 1)) * innerW;
  const y = (v: number) => pad.t + innerH - (v / maxY) * innerH;

  const pathFor = (key: "thisMonth" | "lastMonth") =>
    series
      .map((p, i) => {
        const v = p[key];
        if (Number.isNaN(v)) return null;
        return `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
      })
      .filter(Boolean)
      .join(" ");

  const areaThis = (() => {
    const pts: { i: number; v: number }[] = [];
    series.forEach((p, i) => {
      if (!Number.isNaN(p.thisMonth)) pts.push({ i, v: p.thisMonth });
    });
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (!first || !last) return "";
    let d = `M ${x(first.i)} ${y(first.v)}`;
    for (let i = 1; i < pts.length; i++) {
      const pt = pts[i];
      if (!pt) continue;
      d += ` L ${x(pt.i)} ${y(pt.v)}`;
    }
    d += ` L ${x(last.i)} ${y(0)} L ${x(first.i)} ${y(0)} Z`;
    return d;
  })();

  const lastSeriesDay = series[series.length - 1]?.day;
  const tickDays = [1, 8, 16, 24, lastSeriesDay].filter(
    (v): v is number => typeof v === "number" && v <= series.length,
  ).filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Spend chart">
      <defs>
        <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {areaThis && <path d={areaThis} fill="url(#spendFill)" />}
      <path
        d={pathFor("lastMonth")}
        fill="none"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeDasharray="5 5"
        strokeLinecap="round"
      />
      <path
        d={pathFor("thisMonth")}
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {tickDays.map((day) => {
        const idx = series.findIndex((s) => s.day === day);
        if (idx < 0) return null;
        return (
          <text
            key={day}
            x={x(idx)}
            y={height - 6}
            textAnchor="middle"
            className="fill-slate-400"
            style={{ fontSize: 11 }}
          >
            {ordinal(day)}
          </text>
        );
      })}
    </svg>
  );
}

function ordinal(n: number): string {
  if (n % 10 === 1 && n !== 11) return `${n}st`;
  if (n % 10 === 2 && n !== 12) return `${n}nd`;
  if (n % 10 === 3 && n !== 13) return `${n}rd`;
  return `${n}th`;
}
