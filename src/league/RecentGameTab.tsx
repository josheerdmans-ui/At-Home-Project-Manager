// @ts-nocheck
/**
 * Recent Game — u.gg-style scoreboard (matched to reference screenshot)
 * + this-game deep Match-V5 stats tab.
 */
import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Copy, ExternalLink, X, ChevronDown, Shield, Castle, Hexagon, Flame, Skull } from "lucide-react";

const BLUE = "#3b9eff";
const RED = "#ff5a5a";
const GOLD = "#e8c26a";
const NAVY = "#0b1220";

const QUEUE_NAMES = {
  420: "Ranked Solo",
  440: "Ranked Flex",
  400: "Normal Draft",
  430: "Normal Blind",
  450: "ARAM",
  700: "Clash",
  900: "URF",
  1700: "Arena",
};

const ROLE_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

const SUMMONER_SPELL = {
  1: "SummonerBoost",
  3: "SummonerExhaust",
  4: "SummonerFlash",
  6: "SummonerHaste",
  7: "SummonerHeal",
  11: "SummonerSmite",
  12: "SummonerTeleport",
  13: "SummonerMana",
  14: "SummonerDot",
  21: "SummonerBarrier",
  30: "SummonerPoroRecall",
  31: "SummonerPoroThrow",
  32: "SummonerSnowball",
  39: "SummonerSnowURFSnowball_Mark",
  54: "Summoner_UltBookPlaceholder",
  55: "Summoner_UltBookSmitePlaceholder",
};

const TIER_ABBR = {
  IRON: "I",
  BRONZE: "B",
  SILVER: "S",
  GOLD: "G",
  PLATINUM: "P",
  EMERALD: "E",
  DIAMOND: "D",
  MASTER: "M",
  GRANDMASTER: "GM",
  CHALLENGER: "C",
};

const ROLE_ICON = {
  TOP: "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-top.png",
  JUNGLE:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-jungle.png",
  MIDDLE:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-middle.png",
  BOTTOM:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-bottom.png",
  UTILITY:
    "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-parties/global/default/icon-position-utility.png",
};

function queueLabel(id) {
  return QUEUE_NAMES[id] || `Queue ${id ?? "?"}`;
}

function fmtDuration(sec) {
  const m = Math.floor((sec || 0) / 60);
  const s = (sec || 0) % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function fmtNum(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString();
}

function fmtSigned(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  const r = Math.round(n);
  return `${r > 0 ? "+" : ""}${r.toLocaleString()}`;
}

function csOf(p) {
  return (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
}

function csPerMin(p, duration) {
  const mins = Math.max(1, (duration || 1) / 60);
  return (csOf(p) / mins).toFixed(1);
}

function sortByRole(list) {
  return [...list].sort((a, b) => {
    const ra = ROLE_ORDER.indexOf(a.teamPosition || a.individualPosition);
    const rb = ROLE_ORDER.indexOf(b.teamPosition || b.individualPosition);
    return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
  });
}

function teamTotals(players) {
  return {
    damage: players.reduce((s, p) => s + (p.totalDamageDealtToChampions || 0), 0),
    gold: players.reduce((s, p) => s + (p.goldEarned || 0), 0),
    kills: players.reduce((s, p) => s + (p.kills || 0), 0),
    deaths: players.reduce((s, p) => s + (p.deaths || 0), 0),
    assists: players.reduce((s, p) => s + (p.assists || 0), 0),
  };
}

function objectiveCounts(team) {
  const o = team?.objectives || {};
  return {
    tower: o.tower?.kills ?? 0,
    inhibitor: o.inhibitor?.kills ?? 0,
    dragon: o.dragon?.kills ?? 0,
    baron: o.baron?.kills ?? 0,
  };
}

function abbrevRank(rankStr) {
  if (!rankStr || /^unranked$/i.test(String(rankStr))) return null;
  const parts = String(rankStr).trim().split(/\s+/);
  const tier = (parts[0] || "").toUpperCase();
  const div = (parts[1] || "").toUpperCase();
  const t = TIER_ABBR[tier];
  if (!t) return rankStr;
  const roman = { I: "1", II: "2", III: "3", IV: "4" };
  return `${t}${roman[div] || div || ""}`;
}

/** Approximate TRS-style combat score (u.gg proprietary; this is a local stand-in). */
function trsOf(p) {
  const kda = (p.kills + p.assists) / Math.max(1, p.deaths);
  const dmg = p.totalDamageDealtToChampions || 0;
  const kp = p.challenges?.killParticipation || 0;
  const vision = p.visionScore || 0;
  return Math.max(
    0,
    Math.round(kda * 90 + dmg / 35 + kp * 220 + vision * 4 + (p.kills || 0) * 12),
  );
}

function spellImg(id, version) {
  const key = SUMMONER_SPELL[id];
  if (!key) return null;
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${key}.png`;
}

function ObjIcon({ children, count, color }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color }}>
      <span className="opacity-90">{children}</span>
      <span className="text-sm font-bold text-white">{count}</span>
    </div>
  );
}

function TeamPanel({ side, label, color, objs, totals }) {
  const align = side === "blue" ? "items-start text-left" : "items-end text-right";
  return (
    <div className={`flex flex-col gap-3 ${align}`}>
      <div className="text-sm font-black uppercase tracking-wider" style={{ color }}>
        {label}
      </div>
      <div className={`flex flex-wrap items-center gap-4 ${side === "red" ? "justify-end" : ""}`}>
        <ObjIcon count={objs.tower} color={color}>
          <Castle size={16} />
        </ObjIcon>
        <ObjIcon count={objs.inhibitor} color={color}>
          <Hexagon size={16} />
        </ObjIcon>
        <ObjIcon count={objs.dragon} color={color}>
          <Flame size={16} />
        </ObjIcon>
        <ObjIcon count={objs.baron} color={color}>
          <Skull size={16} />
        </ObjIcon>
      </div>
      <div className={`grid grid-cols-3 gap-5 text-xs ${side === "red" ? "text-right" : ""}`}>
        <div>
          <div className="font-bold text-slate-400">Total Damage</div>
          <div className="text-lg font-black text-white">{fmtNum(totals.damage)}</div>
        </div>
        <div>
          <div className="font-bold text-slate-400">Total Gold</div>
          <div className="text-lg font-black text-white">{fmtNum(totals.gold)}</div>
        </div>
        <div>
          <div className="font-bold text-slate-400">K/D/A</div>
          <div className="text-lg font-black text-white">
            {totals.kills} / {totals.deaths} / {totals.assists}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleIcon({ role }) {
  const src = ROLE_ICON[role];
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center">
      {src ? (
        <img alt={role} src={src} className="h-5 w-5 object-contain opacity-80" />
      ) : (
        <span className="text-[10px] font-black text-slate-500">?</span>
      )}
    </div>
  );
}

function ItemRow({ p, version }) {
  const ids = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6];
  return (
    <div className="flex gap-0.5">
      {ids.map((id, i) =>
        id ? (
          <img
            key={`${id}-${i}`}
            alt=""
            className="h-6 w-6 rounded-sm border border-slate-700/80 bg-slate-950"
            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id}.png`}
          />
        ) : (
          <div key={`e-${i}`} className="h-6 w-6 rounded-sm border border-slate-800 bg-slate-950/80" />
        ),
      )}
    </div>
  );
}

const COL =
  "grid grid-cols-[minmax(200px,2.1fr)_minmax(140px,1.5fr)_0.7fr_0.65fr_0.75fr_1.15fr_0.85fr_1fr_0.75fr_0.85fr] items-center gap-1 px-3";

function PlayerRow({
  p,
  version,
  duration,
  highlight,
  side,
  rankLabel,
  xpDiff,
  xpPct,
  csDiff14,
}) {
  const name = p.riotIdGameName || p.summonerName || "Player";
  const tag = p.riotIdTagline || "";
  const dmg = p.totalDamageDealtToChampions || 0;
  const taken = p.totalDamageTaken || 0;
  const rowBg = side === "blue" ? "bg-[#0c1829]/70" : "bg-[#1f1016]/55";
  const hi = highlight ? "bg-[#132038] ring-1 ring-inset ring-sky-500/25" : rowBg;
  const s1 = spellImg(p.summoner1Id, version);
  const s2 = spellImg(p.summoner2Id, version);
  const trs = trsOf(p);

  return (
    <div className={`${COL} border-b border-slate-800/50 py-2 text-xs ${hi}`}>
      {/* Player */}
      <div className="flex min-w-0 items-center gap-1.5">
        <RoleIcon role={p.teamPosition || p.individualPosition} />
        <div className="relative shrink-0">
          <img
            alt=""
            className="h-9 w-9 rounded-sm border border-slate-700 object-cover"
            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${p.championName}.png`}
          />
          <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded bg-slate-950 px-0.5 text-[9px] font-black text-white ring-1 ring-slate-700">
            {p.champLevel}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          {s1 && <img alt="" className="h-3.5 w-3.5 rounded-sm" src={s1} />}
          {s2 && <img alt="" className="h-3.5 w-3.5 rounded-sm" src={s2} />}
        </div>
        <div className="min-w-0 pl-0.5">
          <div className="truncate font-bold text-white">
            {name}{" "}
            <span className="font-semibold text-slate-500">#{tag}</span>
          </div>
        </div>
      </div>

      {/* Build */}
      <ItemRow p={p} version={version} />

      {/* Rank */}
      <div className="text-center text-[11px] font-bold text-slate-300">
        {rankLabel || <span className="text-slate-600">—</span>}
      </div>

      {/* TRS */}
      <div className="flex items-center justify-center gap-1 font-bold tabular-nums text-slate-200">
        <Shield size={12} className="text-slate-500" />
        {trs}
      </div>

      {/* K/D/A */}
      <div className="text-center font-black tabular-nums text-white">
        {p.kills}/{p.deaths}/{p.assists}
      </div>

      {/* Damage Dealt/Taken */}
      <div className="text-center font-bold tabular-nums">
        <span className="text-emerald-400">{fmtNum(dmg)}</span>
        <span className="text-slate-600"> / </span>
        <span className="text-rose-400">{fmtNum(taken)}</span>
      </div>

      {/* Obj Damage */}
      <div className="text-center font-bold tabular-nums text-slate-200">
        {fmtNum(p.damageDealtToObjectives)}
      </div>

      {/* Δ XP */}
      <div className="text-center font-bold tabular-nums">
        {xpDiff == null ? (
          <span className="text-slate-600">—</span>
        ) : (
          <>
            <span className={xpDiff >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {fmtSigned(xpDiff)}
            </span>
            {xpPct != null && (
              <span className="text-slate-500">
                {" "}
                / {xpPct >= 0 ? "+" : ""}
                {xpPct.toFixed(1)}%
              </span>
            )}
          </>
        )}
      </div>

      {/* ΔCS @ 14 */}
      <div
        className={`text-center font-bold tabular-nums ${
          csDiff14 == null
            ? "text-slate-600"
            : csDiff14 >= 0
              ? "text-emerald-400"
              : "text-rose-400"
        }`}
      >
        {csDiff14 == null ? "—" : fmtSigned(csDiff14)}
      </div>

      {/* CS */}
      <div className="text-center font-bold tabular-nums text-slate-200">
        {csPerMin(p, duration)} <span className="text-slate-600">/</span> {csOf(p)}
      </div>
    </div>
  );
}

function SideHeader({ color, label }) {
  return (
    <div
      className={`${COL} border-b border-slate-800 bg-[#0a1424] py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500`}
    >
      <div className="pl-1" style={{ color }}>
        {label}
      </div>
      <div>Build</div>
      <div className="text-center">Rank</div>
      <div className="text-center">TRS</div>
      <div className="text-center">K/D/A</div>
      <div className="text-center">Damage Dealt/Taken</div>
      <div className="text-center">Obj Damage</div>
      <div className="text-center">Δ XP</div>
      <div className="text-center">ΔCS @ 14</div>
      <div className="text-center">CS</div>
    </div>
  );
}

/* ─── Deep this-game stats (kept on Stats tab) ─── */

function fmtStat(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (typeof n === "boolean") return n ? "Yes" : "No";
  if (typeof n === "number") {
    if (!Number.isFinite(n)) return "—";
    if (Math.abs(n) >= 1000) return Math.round(n).toLocaleString();
    if (Number.isInteger(n)) return String(n);
    return n.toFixed(2);
  }
  return String(n);
}

function pctStat(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(Number(n) * 100).toFixed(1)}%`;
}

function kdaOf(p) {
  return ((p.kills + p.assists) / Math.max(1, p.deaths || 1)).toFixed(2);
}

function DeepStat({ label, value }) {
  return (
    <div className="flex min-h-[64px] flex-col justify-center rounded border border-slate-800 bg-[#0a101c] px-2 py-2 text-center">
      <div className="text-sm font-black tabular-nums text-white">{value}</div>
      <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function buildDeepStats(p, durationSec) {
  const c = p.challenges || {};
  const totalCs = csOf(p);
  const mins = Math.max(1 / 60, (durationSec || p.timePlayed || 1) / 60);
  const dpm = c.damagePerMinute ?? p.totalDamageDealtToChampions / mins;
  const gpm = c.goldPerMinute ?? p.goldEarned / mins;
  const vpm = c.visionScorePerMinute ?? p.visionScore / mins;
  const ccPerMin = (p.totalTimeCCDealt || 0) / mins;

  return {
    Combat: [
      ["Kills", p.kills],
      ["Deaths", p.deaths],
      ["Assists", p.assists],
      ["KDA", kdaOf(p)],
      ["Kill participation", pctStat(c.killParticipation)],
      ["Solo kills", c.soloKills ?? 0],
      ["Double kills", p.doubleKills],
      ["Triple kills", p.tripleKills],
      ["Quadra kills", p.quadraKills],
      ["Penta kills", p.pentaKills],
      ["Largest multi-kill", p.largestMultiKill],
      ["Largest killing spree", p.largestKillingSpree],
      ["Killing sprees", p.killingSprees],
      ["First blood", p.firstBloodKill],
      ["First blood assist", p.firstBloodAssist],
      ["Takedowns", c.takedowns ?? p.kills + p.assists],
    ],
    Damage: [
      ["Dmg to champions", p.totalDamageDealtToChampions],
      ["Physical dmg to champs", p.physicalDamageDealtToChampions],
      ["Magic dmg to champs", p.magicDamageDealtToChampions],
      ["True dmg to champs", p.trueDamageDealtToChampions],
      ["Damage / min", dpm],
      ["Team damage %", pctStat(c.teamDamagePercentage)],
      ["Largest crit", p.largestCriticalStrike],
      ["Total damage dealt", p.totalDamageDealt],
      ["Damage to turrets", p.damageDealtToTurrets],
      ["Damage to objectives", p.damageDealtToObjectives],
    ],
    Survivability: [
      ["Damage taken", p.totalDamageTaken],
      ["Physical taken", p.physicalDamageTaken],
      ["Magic taken", p.magicDamageTaken],
      ["True taken", p.trueDamageTaken],
      ["Self mitigated", p.damageSelfMitigated],
      ["Total heal", p.totalHeal],
      ["Heals on teammates", p.totalHealsOnTeammates],
      ["Shielded teammates", p.totalDamageShieldedOnTeammates],
      ["Time CCing others", p.timeCCingOthers],
      ["CC / min", ccPerMin],
      ["Longest time living", p.longestTimeSpentLiving],
    ],
    Economy: [
      ["Gold earned", p.goldEarned],
      ["Gold spent", p.goldSpent],
      ["Gold / min", gpm],
      ["CS (lane + jungle)", totalCs],
      ["CS / min", (totalCs / mins).toFixed(1)],
      ["Champ level", p.champLevel],
    ],
    Vision: [
      ["Vision score", p.visionScore],
      ["Vision / min", vpm],
      ["Wards placed", p.wardsPlaced],
      ["Wards killed", p.wardsKilled],
      ["Control wards bought", p.visionWardsBoughtInGame],
      ["Sight wards bought", p.sightWardsBoughtInGame],
    ],
    Objectives: [
      ["Turret kills", p.turretKills],
      ["Inhibitor kills", p.inhibitorKills],
      ["Dragon kills", p.dragonKills],
      ["Baron kills", p.baronKills],
      ["First tower", p.firstTowerKill],
      ["Turret plates taken", c.turretPlatesTaken],
    ],
    Pings: [
      ["Enemy missing", p.enemyMissingPings],
      ["On my way", p.onMyWayPings],
      ["Assist me", p.assistMePings],
      ["Danger", p.dangerPings],
    ],
  };
}

function PlayerDeepStats({ p, label, accent, version, duration }) {
  if (!p) return null;
  const name = p.riotIdGameName || p.summonerName || "Player";
  const tag = p.riotIdTagline || "";
  const groups = buildDeepStats(p, duration);

  return (
    <div className="rounded-md border border-slate-800 bg-[#0a101c] p-4">
      <div className="mb-4 flex items-center gap-3 border-b border-slate-800 pb-3">
        <img
          alt=""
          className="h-12 w-12 rounded border border-slate-700 object-cover"
          src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${p.championName}.png`}
        />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: accent }}>
            {label}
          </div>
          <div className="font-black text-white">
            {name}
            {tag ? <span className="font-semibold text-slate-500"> #{tag}</span> : null}
          </div>
          <div className="text-sm font-black text-white">
            {p.kills}/{p.deaths}/{p.assists}{" "}
            <span className="font-bold text-slate-500">KDA {kdaOf(p)}</span>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {Object.entries(groups).map(([title, rows]) => (
          <div key={title}>
            <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-cyan-400/80">
              {title}
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
              {rows.map(([rowLabel, value]) => (
                <DeepStat
                  key={rowLabel}
                  label={rowLabel}
                  value={typeof value === "string" ? value : fmtStat(value)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function laneDiffs(p, opposite, at14ByPid) {
  if (!p || !opposite) return { xpDiff: null, xpPct: null, csDiff14: null };
  const mine = at14ByPid?.[p.participantId];
  const theirs = at14ByPid?.[opposite.participantId];

  let xpDiff = null;
  let xpPct = null;
  if (mine && theirs) {
    xpDiff = mine.xp - theirs.xp;
    xpPct = theirs.xp > 0 ? (xpDiff / theirs.xp) * 100 : null;
  } else if (p.champExperience != null && opposite.champExperience != null) {
    xpDiff = p.champExperience - opposite.champExperience;
    xpPct =
      opposite.champExperience > 0 ? (xpDiff / opposite.champExperience) * 100 : null;
  }

  const csDiff14 =
    mine && theirs ? mine.cs - theirs.cs : p.challenges?.maxCsAdvantageOnLaneOpponent ?? null;

  return { xpDiff, xpPct, csDiff14 };
}

export default function RecentGameTab({ data }) {
  const game = data.latestGame;
  const version = data.version || "14.22.1";
  const [subTab, setSubTab] = useState("scoreboard");
  const [chartMode, setChartMode] = useState("both");

  const model = useMemo(() => {
    if (!game?.allParticipants?.length && !game?.allies) return null;
    const participants = sortByRole(
      game.allParticipants || [...(game.allies || []), ...(game.enemies || [])],
    );
    const blue = sortByRole(participants.filter((p) => p.teamId === 100));
    const red = sortByRole(participants.filter((p) => p.teamId === 200));
    const blueFinal = blue.length ? blue : sortByRole(game.allies || []);
    const redFinal = red.length ? red : sortByRole(game.enemies || []);

    const teams = game.teams || [];
    const blueTeam =
      teams.find((t) => t.teamId === 100) || teams.find((t) => t.win === blueFinal[0]?.win);
    const redTeam = teams.find((t) => t.teamId === 200) || teams.find((t) => t !== blueTeam);

    const blueWin = blueFinal[0]?.win ?? blueTeam?.win ?? false;
    const blueTot = teamTotals(blueFinal);
    const redTot = teamTotals(redFinal);

    const roles = ROLE_ORDER.filter(
      (r) =>
        blueFinal.some((p) => (p.teamPosition || p.individualPosition) === r) ||
        redFinal.some((p) => (p.teamPosition || p.individualPosition) === r),
    );

    const oppByPuuid = {};
    roles.forEach((role) => {
      const bp = blueFinal.find((p) => (p.teamPosition || p.individualPosition) === role);
      const rp = redFinal.find((p) => (p.teamPosition || p.individualPosition) === role);
      if (bp && rp) {
        oppByPuuid[bp.puuid] = rp;
        oppByPuuid[rp.puuid] = bp;
      }
    });

    const chartRows = (roles.length ? roles : blueFinal.map((_, i) => i)).map((roleOrIdx, i) => {
      const bp =
        typeof roleOrIdx === "string"
          ? blueFinal.find((p) => (p.teamPosition || p.individualPosition) === roleOrIdx) ||
            blueFinal[i]
          : blueFinal[i];
      const rp =
        typeof roleOrIdx === "string"
          ? redFinal.find((p) => (p.teamPosition || p.individualPosition) === roleOrIdx) ||
            redFinal[i]
          : redFinal[i];
      return {
        role: typeof roleOrIdx === "string" ? roleOrIdx : `P${i + 1}`,
        blueChamp: bp?.championName,
        redChamp: rp?.championName,
        blueDmg: bp?.totalDamageDealtToChampions || 0,
        redDmg: rp?.totalDamageDealtToChampions || 0,
        blueGold: bp?.goldEarned || 0,
        redGold: rp?.goldEarned || 0,
      };
    });

    return {
      blue: blueFinal,
      red: redFinal,
      blueTot,
      redTot,
      blueObjs: objectiveCounts(blueTeam),
      redObjs: objectiveCounts(redTeam),
      blueWin,
      chartRows,
      oppByPuuid,
    };
  }, [game]);

  if (!game || !model) {
    return (
      <div className="rounded-lg border border-slate-800 bg-[#0b1220] p-12 text-center text-slate-400">
        No recent duo game found. Run Analyze first.
      </div>
    );
  }

  const started = game.gameStartTimestamp
    ? new Date(game.gameStartTimestamp)
        .toLocaleString(undefined, {
          month: "numeric",
          day: "numeric",
          year: "2-digit",
          hour: "numeric",
          minute: "2-digit",
        })
        .replace(",", " //")
    : "";

  const mePuuid = game.me?.puuid;
  const frPuuid = game.friend?.puuid;
  const victorySide = model.blueWin ? "Blue Side Victory" : "Red Side Victory";
  const victoryColor = model.blueWin ? BLUE : RED;

  const avgBlueDmg = Math.round(model.blueTot.damage / Math.max(1, model.blue.length));
  const avgRedDmg = Math.round(model.redTot.damage / Math.max(1, model.red.length));
  const avgBlueGold = Math.round(model.blueTot.gold / Math.max(1, model.blue.length));
  const avgRedGold = Math.round(model.redTot.gold / Math.max(1, model.red.length));

  const meRank = abbrevRank(data.ranks?.me);
  const frRank = abbrevRank(data.ranks?.friend);
  const at14 = game.at14ByPid || {};

  const rankFor = (p) => {
    if (p.puuid === mePuuid && meRank) return meRank;
    if (p.puuid === frPuuid && frRank) return frRank;
    return null;
  };

  const renderRows = (list, side) =>
    list.map((p) => {
      const opp = model.oppByPuuid[p.puuid];
      const diffs = laneDiffs(p, opp, at14);
      return (
        <PlayerRow
          key={p.puuid}
          p={p}
          version={version}
          duration={game.gameDuration}
          highlight={p.puuid === mePuuid || p.puuid === frPuuid}
          side={side}
          rankLabel={rankFor(p)}
          xpDiff={diffs.xpDiff}
          xpPct={diffs.xpPct}
          csDiff14={diffs.csDiff14}
        />
      );
    });

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800/80" style={{ background: NAVY }}>
      {/* Header — matches reference: meta left, tabs center, links right */}
      <div className="border-b border-slate-800 px-5 pt-4 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-400">
              {queueLabel(game.queueId)}{" "}
              <span className="text-slate-600">{started}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-black" style={{ color: victoryColor }}>
                {victorySide}
              </span>
              <span className="text-xl font-bold text-white">{fmtDuration(game.gameDuration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="inline-flex items-center gap-1.5 hover:text-slate-200">
              <ExternalLink size={14} /> Open in New Tab
            </span>
            <span className="inline-flex items-center gap-1.5 hover:text-slate-200">
              <Copy size={14} /> Copy Share Link
            </span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-700 text-slate-400">
              <X size={14} />
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-end gap-6">
          {["scoreboard", "matchups", "stats"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSubTab(t)}
              className={`relative pb-2.5 text-sm font-bold capitalize ${
                subTab === t ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t}
              {subTab === t && (
                <span
                  className="absolute inset-x-0 bottom-0 h-[3px] rounded-t"
                  style={{ background: BLUE }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Team strip + chart — always visible like the photo */}
      <div className="grid grid-cols-1 gap-4 border-b border-slate-800 px-5 py-5 lg:grid-cols-[1fr_1.35fr_1fr]">
        <TeamPanel
          side="blue"
          label="Blue Side"
          color={BLUE}
          objs={model.blueObjs}
          totals={model.blueTot}
        />

        <div className="rounded-md border border-slate-800/80 bg-[#080e1a] p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="relative inline-flex items-center gap-1 text-xs font-bold text-slate-300">
              <select
                value={chartMode}
                onChange={(e) => setChartMode(e.target.value)}
                className="appearance-none rounded border border-slate-700 bg-[#121a2b] py-1 pl-2 pr-6 text-xs font-bold text-white"
              >
                <option value="both">Damage vs Gold</option>
                <option value="damage">Damage</option>
                <option value="gold">Gold</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-1.5 text-slate-500" />
            </label>
            <div className="text-[11px] font-semibold text-slate-400">
              Avg Damage{" "}
              <span style={{ color: BLUE }}>{fmtNum(avgBlueDmg)}</span>
              <span className="text-slate-600"> / </span>
              <span style={{ color: RED }}>{fmtNum(avgRedDmg)}</span>
              <span className="mx-2 text-slate-700">·</span>
              Avg Gold{" "}
              <span style={{ color: BLUE }}>{fmtNum(avgBlueGold)}</span>
              <span className="text-slate-600"> / </span>
              <span style={{ color: RED }}>{fmtNum(avgRedGold)}</span>
            </div>
          </div>
          <div className="h-[150px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.chartRows} barGap={1} barCategoryGap="22%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2336" vertical={false} />
                <XAxis dataKey="role" hide />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    fontSize: 12,
                  }}
                  formatter={(v, name) => [fmtNum(v), name]}
                />
                {(chartMode === "both" || chartMode === "damage") && (
                  <>
                    <Bar dataKey="blueDmg" name="Blue Dmg" fill={BLUE} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="redDmg" name="Red Dmg" fill={RED} radius={[2, 2, 0, 0]} />
                  </>
                )}
                {(chartMode === "both" || chartMode === "gold") && (
                  <>
                    <Bar dataKey="blueGold" name="Blue Gold" fill="#5b8def" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="redGold" name="Red Gold" fill={GOLD} radius={[2, 2, 0, 0]} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex justify-around px-1">
            {model.chartRows.map((row) => (
              <div key={row.role} className="flex -space-x-1.5">
                {row.blueChamp && (
                  <img
                    alt=""
                    className="h-6 w-6 rounded-full border border-slate-700"
                    src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${row.blueChamp}.png`}
                  />
                )}
                {row.redChamp && (
                  <img
                    alt=""
                    className="h-6 w-6 rounded-full border border-slate-700"
                    src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${row.redChamp}.png`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <TeamPanel
          side="red"
          label="Red Side"
          color={RED}
          objs={model.redObjs}
          totals={model.redTot}
        />
      </div>

      {subTab === "scoreboard" && (
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <SideHeader color={BLUE} label="Blue Side" />
            {renderRows(model.blue, "blue")}
            <SideHeader color={RED} label="Red Side" />
            {renderRows(model.red, "red")}
          </div>
        </div>
      )}

      {subTab === "matchups" && (
        <div className="grid gap-3 p-5 sm:grid-cols-5">
          {ROLE_ORDER.map((role) => {
            const bp = model.blue.find((p) => (p.teamPosition || p.individualPosition) === role);
            const rp = model.red.find((p) => (p.teamPosition || p.individualPosition) === role);
            if (!bp && !rp) return null;
            return (
              <div
                key={role}
                className="rounded-md border border-slate-800 bg-[#0a101c] p-3 text-center"
              >
                <div className="mb-2 text-[10px] font-black uppercase text-slate-500">{role}</div>
                <div className="flex items-center justify-center gap-2">
                  {bp && (
                    <img
                      alt=""
                      className="h-12 w-12 rounded border border-blue-500/40"
                      src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${bp.championName}.png`}
                    />
                  )}
                  <span className="text-xs font-black text-slate-600">VS</span>
                  {rp && (
                    <img
                      alt=""
                      className="h-12 w-12 rounded border border-rose-500/40"
                      src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${rp.championName}.png`}
                    />
                  )}
                </div>
                <div className="mt-2 text-[11px] font-bold text-slate-300">
                  <span style={{ color: BLUE }}>
                    {bp ? `${bp.kills}/${bp.deaths}/${bp.assists}` : "—"}
                  </span>
                  {" · "}
                  <span style={{ color: RED }}>
                    {rp ? `${rp.kills}/${rp.deaths}/${rp.assists}` : "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === "stats" && (
        <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
          <PlayerDeepStats
            p={game.me}
            label="You"
            accent={BLUE}
            version={version}
            duration={game.gameDuration}
          />
          <PlayerDeepStats
            p={game.friend}
            label="Duo partner"
            accent="#ff69b4"
            version={version}
            duration={game.gameDuration}
          />
        </div>
      )}
    </div>
  );
}
