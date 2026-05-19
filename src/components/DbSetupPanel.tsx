import { useState } from "react";
import { Copy, Check } from "lucide-react";

type Props = {
  title: string;
  sql: string;
};

export function DbSetupPanel({ title, sql }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-amber-200/80 bg-amber-50/60 p-8 text-center backdrop-blur-xl">
      <h2 className="mb-2 text-xl font-bold text-slate-800">{title}</h2>
      <p className="mb-6 text-sm text-slate-600">
        Run this SQL once in Supabase → SQL Editor, or run{" "}
        <code className="rounded bg-white/80 px-1.5 py-0.5 font-mono text-xs">npm run db:push</code> if
        the CLI is linked.
      </p>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-6 py-3 font-bold text-slate-800 shadow-sm transition hover:bg-cyan-600 hover:text-white"
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
        {copied ? "Copied!" : "Copy setup SQL"}
      </button>
    </div>
  );
}
