import { useEffect, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Database,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { processData } from "./dataEngine";
import OverviewTab from "./OverviewTab";
import SynergyTab from "./SynergyTab";
import ShameTab from "./ShameTab";
import FutureTab from "./FutureTab";

type LolPlatform =
  | "na1"
  | "euw1"
  | "eun1"
  | "kr"
  | "br1"
  | "la1"
  | "la2"
  | "jp1"
  | "oc1"
  | "tr1"
  | "ru"
  | "sg2"
  | "tw2"
  | "vn2";

type MasteryRaw = {
  championId: number;
  championPoints: number;
  championLevel: number;
};

type DuoBundle = {
  me: {
    account: { puuid: string; gameName: string; tagLine: string };
    summoner: { level: number; profileIconId: number };
    rank: string;
    mastery: MasteryRaw[];
  };
  friend: {
    account: { puuid: string; gameName: string; tagLine: string };
    summoner: { level: number; profileIconId: number };
    rank: string;
    mastery: MasteryRaw[];
  };
  matches: unknown[];
  timelines: unknown[];
  platform: LolPlatform;
  error?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DuoProcessed = any;

const STORAGE_KEY = "league-duo-ids-v2";

const PLATFORMS: { id: LolPlatform; label: string }[] = [
  { id: "na1", label: "NA" },
  { id: "euw1", label: "EUW" },
  { id: "eun1", label: "EUNE" },
  { id: "kr", label: "KR" },
  { id: "br1", label: "BR" },
  { id: "la1", label: "LAN" },
  { id: "la2", label: "LAS" },
  { id: "jp1", label: "JP" },
  { id: "oc1", label: "OCE" },
  { id: "tr1", label: "TR" },
  { id: "ru", label: "RU" },
  { id: "sg2", label: "SG" },
  { id: "tw2", label: "TW" },
  { id: "vn2", label: "VN" },
];

const DEFAULTS = {
  meRiotId: "yellowcardfan69#6767",
  friendRiotId: "flacctay#NA1",
  platform: "na1" as LolPlatform,
};

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<typeof DEFAULTS>;
    return {
      meRiotId: parsed.meRiotId?.trim() || DEFAULTS.meRiotId,
      friendRiotId: parsed.friendRiotId?.trim() || DEFAULTS.friendRiotId,
      platform: (parsed.platform as LolPlatform) || DEFAULTS.platform,
    };
  } catch {
    return DEFAULTS;
  }
}

async function mapMastery(raw: MasteryRaw[], version: string) {
  try {
    const champJson = (await (
      await fetch(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`)
    ).json()) as {
      data?: Record<string, { key: string; name: string; id: string }>;
    };
    const champMap: Record<string, { name: string; id: string }> = {};
    if (champJson.data) {
      for (const c of Object.values(champJson.data)) {
        champMap[c.key] = { name: c.name, id: c.id };
      }
    }
    return raw.slice(0, 3).map((m) => {
      const cData = champMap[String(m.championId)] || { name: "Unknown", id: "Unknown" };
      return {
        name: cData.name,
        id: cData.id,
        points: m.championPoints,
        level: m.championLevel,
      };
    });
  } catch {
    return [];
  }
}

async function invokeErrorBody(error: unknown): Promise<string | null> {
  const ctx = (error as { context?: Response })?.context;
  if (!ctx || typeof ctx.json !== "function") return null;
  try {
    const body = (await ctx.json()) as { error?: string };
    return body.error ?? null;
  } catch {
    return null;
  }
}

type Props = {
  onBackToChooser: () => void;
};

type TabId = "overview" | "synergy" | "shame" | "future";

export function LeagueHub({ onBackToChooser }: Props) {
  const saved = loadSaved();
  const [meRiotId, setMeRiotId] = useState(saved.meRiotId);
  const [friendRiotId, setFriendRiotId] = useState(saved.friendRiotId);
  const [platform, setPlatform] = useState<LolPlatform>(saved.platform);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [data, setData] = useState<DuoProcessed | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const runDuo = async () => {
    setError(null);
    setLoading(true);
    setStatus("Finding summoners…");
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ meRiotId, friendRiotId, platform }),
    );

    try {
      setStatus("Downloading duo matches from Riot (can take a couple minutes for ~20 games)…");
      const { data: bundle, error: fnError } = await supabase.functions.invoke<DuoBundle>(
        "lol-riot",
        {
          body: {
            action: "duo",
            riotId: meRiotId.trim(),
            friendRiotId: friendRiotId.trim(),
            platform,
            matchCount: 40,
          },
        },
      );

      if (bundle?.error) throw new Error(bundle.error);
      if (fnError) {
        const fromBody = await invokeErrorBody(fnError);
        throw new Error(fromBody || fnError.message || "Edge Function failed");
      }
      if (!bundle?.me?.account?.puuid || !bundle?.friend?.account?.puuid) {
        throw new Error("Could not load both summoners");
      }

      setStatus("Crunching duo stats…");
      const processed = processData(
        bundle.matches,
        bundle.timelines,
        bundle.me.account.puuid,
        bundle.friend.account.puuid,
      ) as DuoProcessed | null;
      if (!processed) {
        throw new Error("No duo games found in recent match history.");
      }

      let version = "14.22.1";
      try {
        const versions = (await (
          await fetch("https://ddragon.leagueoflegends.com/api/versions.json")
        ).json()) as string[];
        if (Array.isArray(versions) && versions[0]) version = versions[0];
      } catch {
        /* keep fallback */
      }

      processed.ranks = { me: bundle.me.rank, friend: bundle.friend.rank };
      processed.mastery = {
        me: await mapMastery(bundle.me.mastery ?? [], version),
        friend: await mapMastery(bundle.friend.mastery ?? [], version),
      };
      processed.version = version;
      processed.accounts = {
        me: `${bundle.me.account.gameName}#${bundle.me.account.tagLine}`,
        friend: `${bundle.friend.account.gameName}#${bundle.friend.account.tagLine}`,
      };

      setData(processed);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
      setData(null);
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  useEffect(() => {
    // Auto-load once with saved/default duo IDs
    void runDuo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runDuo();
  };

  return (
    <div className="min-h-screen bg-[#020617] font-sans text-slate-200">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/50 p-4 backdrop-blur-xl sm:p-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Sparkles size={28} className="text-cyan-500" />
            <div>
              <h1 className="text-xl font-black uppercase text-white">Bot Lane Analytics</h1>
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                <Database size={10} /> Riot + Edge Function
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {data && (
              <div className="hidden text-sm font-bold sm:block">
                <span className="text-cyan-400">{data.roles?.me ?? "You"}</span>
                <span className="px-2 text-slate-700">VS</span>
                <span className="text-rose-400">{data.roles?.friend ?? "Duo"}</span>
              </div>
            )}
            <button
              type="button"
              onClick={onBackToChooser}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-cyan-600 hover:text-white"
            >
              <ArrowLeft size={16} />
              Switch app
            </button>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid max-w-7xl gap-3 px-4 py-4 sm:grid-cols-[1fr_1fr_7rem_auto] sm:px-6"
      >
        <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
          You (Name#TAG)
          <input
            value={meRiotId}
            onChange={(e) => setMeRiotId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="you#TAG"
            required
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Duo partner (Name#TAG)
          <input
            value={friendRiotId}
            onChange={(e) => setFriendRiotId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-cyan-500"
            placeholder="friend#TAG"
            required
          />
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-slate-400">
          Region
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as LolPlatform)}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
        >
          <Search size={16} />
          {loading ? "Loading…" : "Analyze"}
        </button>
      </form>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-cyan-500">
          <Loader2 size={56} className="animate-spin" />
          <h2 className="text-2xl font-black">LOADING…</h2>
          <p className="animate-pulse text-slate-500">{status}</p>
        </div>
      )}

      {!loading && error && (
        <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-16 text-center text-rose-400">
          <AlertTriangle size={48} />
          <h2 className="text-xl font-bold">Couldn’t load duo stats</h2>
          <p className="text-sm text-rose-300/90">{error}</p>
        </div>
      )}

      {!loading && hasLoaded && data && (
        <>
          <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
            {(["overview", "synergy", "shame", "future"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? "scale-105 bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <main className="mx-auto mt-4 max-w-7xl px-4 pb-20 sm:px-6">
            {activeTab === "overview" && <OverviewTab data={data} />}
            {activeTab === "synergy" && <SynergyTab data={data} />}
            {activeTab === "shame" && <ShameTab data={data} />}
            {activeTab === "future" && <FutureTab data={data} />}
          </main>
        </>
      )}
    </div>
  );
}
