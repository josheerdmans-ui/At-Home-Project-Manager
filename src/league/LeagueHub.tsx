import { useState, type FormEvent } from "react";
import { ArrowLeft, Search, Swords } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type LolPlatform =
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

type RankedEntry = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

type RecentMatch = {
  matchId: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  gameMode: string;
  gameDuration: number;
};

type LookupResult = {
  account: { puuid: string; gameName: string; tagLine: string };
  summoner: { level: number; profileIconId: number };
  ranked: RankedEntry[];
  recentMatches: RecentMatch[];
  platform: LolPlatform;
  error?: string;
};

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

function queueLabel(queueType: string): string {
  if (queueType === "RANKED_SOLO_5x5") return "Solo/Duo";
  if (queueType === "RANKED_FLEX_SR") return "Flex";
  return queueType.replaceAll("_", " ");
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

type Props = {
  onBackToChooser: () => void;
};

export function LeagueHub({ onBackToChooser }: Props) {
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [platform, setPlatform] = useState<LolPlatform>("na1");
  const [result, setResult] = useState<LookupResult | null>(null);

  const lookup = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke<LookupResult>("lol-riot", {
        body: {
          gameName: gameName.trim(),
          tagLine: tagLine.trim().replace(/^#/, ""),
          platform,
        },
      });
      if (error) {
        const msg = error.message || "Edge Function request failed";
        if (/failed to send a request/i.test(msg) || /fetch/i.test(msg)) {
          throw new Error(
            "Could not reach the lol-riot Edge Function. Deploy it with: npx supabase functions deploy lol-riot — and set the RIOT_API_KEY secret in Supabase → Edge Functions → Secrets.",
          );
        }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      if (!data?.account) throw new Error("Empty response from League lookup");
      return data;
    },
    onSuccess: (data) => setResult(data),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!gameName.trim() || !tagLine.trim()) return;
    lookup.mutate();
  };

  const iconUrl = result
    ? `https://ddragon.leagueoflegends.com/cdn/14.22.1/img/profileicon/${result.summoner.profileIconId}.png`
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[40vw] w-[40vw] rounded-full bg-violet-400/30 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[40vw] w-[40vw] rounded-full bg-cyan-400/25 blur-[120px]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6 sm:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <Swords size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">League of Legends</h1>
              <p className="text-sm font-semibold text-slate-500">Riot ID lookup</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToChooser}
            className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-violet-600 hover:text-white"
          >
            <ArrowLeft size={16} />
            Switch app
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/80 bg-white/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] backdrop-blur-2xl"
        >
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem_7rem_auto]">
            <label className="text-sm font-semibold text-slate-700">
              Game name
              <input
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                placeholder="Faker"
                className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-3 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-400"
                required
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Tag
              <input
                value={tagLine}
                onChange={(e) => setTagLine(e.target.value)}
                placeholder="KR1"
                className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-3 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-400"
                required
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Region
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as LolPlatform)}
                className="mt-1 w-full rounded-2xl border border-white/80 bg-white/90 px-3 py-3 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-violet-400"
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
              disabled={lookup.isPending}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              <Search size={18} />
              {lookup.isPending ? "Looking…" : "Look up"}
            </button>
          </div>
          <p className="mt-3 text-xs font-medium text-slate-500">
            Uses Riot ID format <span className="font-bold text-slate-600">Name#TAG</span>. Requires
            the <code className="rounded bg-white/80 px-1">lol-riot</code> edge function and{" "}
            <code className="rounded bg-white/80 px-1">RIOT_API_KEY</code> secret.
          </p>
        </form>

        {lookup.error && (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {lookup.error instanceof Error ? lookup.error.message : "Lookup failed"}
          </p>
        )}

        {result && (
          <div className="space-y-5">
            <section className="flex flex-wrap items-center gap-5 rounded-[2rem] border border-white/80 bg-white/55 p-6 shadow-sm backdrop-blur-xl">
              {iconUrl && (
                <img
                  src={iconUrl}
                  alt=""
                  className="h-20 w-20 rounded-2xl border border-white/80 shadow-md"
                />
              )}
              <div>
                <h2 className="text-2xl font-black text-slate-800">
                  {result.account.gameName}
                  <span className="text-violet-600">#{result.account.tagLine}</span>
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Level {result.summoner.level} · {result.platform.toUpperCase()}
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/80 bg-white/55 p-6 shadow-sm backdrop-blur-xl">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Ranked</h3>
              {result.ranked.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">No ranked entries this season.</p>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {result.ranked.map((entry) => (
                    <li
                      key={`${entry.queueType}-${entry.tier}-${entry.rank}`}
                      className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3"
                    >
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {queueLabel(entry.queueType)}
                      </p>
                      <p className="text-lg font-black text-slate-800">
                        {entry.tier} {entry.rank} · {entry.leaguePoints} LP
                      </p>
                      <p className="text-sm font-semibold text-slate-500">
                        {entry.wins}W / {entry.losses}L
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/80 bg-white/55 p-6 shadow-sm backdrop-blur-xl">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
                Recent matches
              </h3>
              {result.recentMatches.length === 0 ? (
                <p className="text-sm font-medium text-slate-500">No recent matches returned.</p>
              ) : (
                <ul className="space-y-2">
                  {result.recentMatches.map((m) => (
                    <li
                      key={m.matchId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/80 px-4 py-3"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{m.championName}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {m.gameMode} · {formatDuration(m.gameDuration)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-black ${m.win ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          {m.win ? "Win" : "Loss"}
                        </p>
                        <p className="font-bold tabular-nums text-slate-700">
                          {m.kills}/{m.deaths}/{m.assists}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
