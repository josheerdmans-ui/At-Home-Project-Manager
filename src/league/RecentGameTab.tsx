// @ts-nocheck
/**
 * Recent-game scoreboard (u.gg-style) + deep single-match stats for you & duo.
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
import { Copy, ExternalLink, X, ChevronDown, Swords, Castle, Flame, Skull } from "lucide-react";

const BLUE = "#3b9eff";
const RED = "#ff5a5a";
const GOLD = "#f0c75e";
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
    dragon: o.dragon?.kills ?? 0,
    herald: o.riftHerald?.kills ?? 0,
    baron: o.baron?.kills ?? 0,
    kills: o.champion?.kills ?? 0,
    grubs: o.horde?.kills ?? o.atarakan?.kills ?? 0,
  };
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
      <div className={`flex flex-wrap gap-4 ${side === "red" ? "justify-end" : ""}`}>
        <ObjIcon count={objs.tower} color={color}>
          <Castle size={16} />
        </ObjIcon>
        <ObjIcon count={objs.dragon} color={color}>
          <Flame size={16} />
        </ObjIcon>
        <ObjIcon count={objs.herald + objs.grubs} color={color}>
          <Skull size={16} />
        </ObjIcon>
        <ObjIcon count={objs.baron} color={color}>
          <Swords size={16} />
        </ObjIcon>
      </div>
      <div className={`grid grid-cols-3 gap-4 text-xs ${side === "red" ? "text-right" : ""}`}>
        <div>
          <div className="font-bold text-slate-400">Total Damage</div>
          <div className="text-base font-black text-white">{fmtNum(totals.damage)}</div>
        </div>
        <div>
          <div className="font-bold text-slate-400">Total Gold</div>
          <div className="text-base font-black text-white">{fmtNum(totals.gold)}</div>
        </div>
        <div>
          <div className="font-bold text-slate-400">K/D/A</div>
          <div className="text-base font-black text-white">
            {totals.kills} / {totals.deaths} / {totals.assists}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleIcon({ role }) {
  const map = {
    TOP: "Top",
    JUNGLE: "Jg",
    MIDDLE: "Mid",
    BOTTOM: "Bot",
    UTILITY: "Sup",
  };
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-[10px] font-black uppercase text-slate-300">
      {map[role] || "?"}
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
            className="h-6 w-6 rounded-sm border border-slate-700 bg-slate-950"
            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id}.png`}
          />
        ) : (
          <div key={`e-${i}`} className="h-6 w-6 rounded-sm border border-slate-800 bg-slate-950/80" />
        ),
      )}
    </div>
  );
}

function PlayerRow({ p, version, duration, highlight, side }) {
  const name = p.riotIdGameName || p.summonerName || "Player";
  const tag = p.riotIdTagline || "";
  const dmg = p.totalDamageDealtToChampions || 0;
  const taken = p.totalDamageTaken || 0;
  const rowBg = side === "blue" ? "bg-[#0d1a2e]/40" : "bg-[#2a1218]/35";
  return (
    <div
      className={`grid grid-cols-[2.2fr_1.6fr_0.7fr_0.9fr_1.1fr_1.1fr_0.9fr_0.9fr] items-center gap-2 border-b border-slate-800/60 px-3 py-2 text-xs ${rowBg} ${
        highlight ? "ring-1 ring-inset ring-cyan-500/30" : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <RoleIcon role={p.teamPosition || p.individualPosition} />
        <img
          alt=""
          className="h-9 w-9 rounded border border-slate-700 object-cover"
          src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${p.championName}.png`}
        />
        <div className="min-w-0">
          <div className="truncate font-bold text-white">
            {name} <span className="font-semibold text-slate-500">#{tag}</span>
          </div>
          <div className="text-[10px] font-semibold uppercase text-slate-500">{p.championName}</div>
        </div>
      </div>
      <ItemRow p={p} version={version} />
      <div className="text-center font-bold text-slate-400">—</div>
      <div className="text-center font-black tabular-nums text-white">
        {p.kills}/{p.deaths}/{p.assists}
      </div>
      <div className="text-center font-bold tabular-nums">
        <span className="text-emerald-400">{fmtNum(dmg)}</span>
        <span className="text-slate-600"> / </span>
        <span className="text-rose-400">{fmtNum(taken)}</span>
      </div>
      <div className="text-center font-bold tabular-nums text-slate-200">
        {fmtNum(p.damageDealtToObjectives)}
      </div>
      <div className="text-center font-bold tabular-nums text-slate-300">
        {p.champLevel}
      </div>
      <div className="text-center font-bold tabular-nums text-slate-200">
        {csPerMin(p, duration)} <span className="text-slate-600">/</span> {csOf(p)}
      </div>
    </div>
  );
}

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
      ["Takedowns before 20", c.takedownsBefore20Minute ?? c.takedownsFirst25Minutes],
      ["Outnumbered kills", c.killsUnderOwnTurret ?? c.outnumberedKills],
      ["Quick solo kills", c.quickSoloKills],
      ["Teleport takedowns", c.teleportTakedowns],
    ],
    Damage: [
      ["Dmg to champions", p.totalDamageDealtToChampions],
      ["Physical dmg to champs", p.physicalDamageDealtToChampions],
      ["Magic dmg to champs", p.magicDamageDealtToChampions],
      ["True dmg to champs", p.trueDamageDealtToChampions],
      ["Damage / min", dpm],
      ["Team damage %", pctStat(c.teamDamagePercentage)],
      ["Damage share", c.teamDamagePercentage != null ? Math.round(c.teamDamagePercentage * 100) : "—"],
      ["Largest crit", p.largestCriticalStrike],
      ["Total damage dealt", p.totalDamageDealt],
      ["Physical damage dealt", p.physicalDamageDealt],
      ["Magic damage dealt", p.magicDamageDealt],
      ["True damage dealt", p.trueDamageDealt],
      ["Damage to turrets", p.damageDealtToTurrets],
      ["Damage to objectives", p.damageDealtToObjectives],
      ["Damage to buildings", p.damageDealtToBuildings],
      ["Spell 1 casts", p.spell1Casts],
      ["Spell 2 casts", p.spell2Casts],
      ["Spell 3 casts", p.spell3Casts],
      ["Spell 4 casts", p.spell4Casts],
      ["Summoner 1 casts", p.summoner1Casts],
      ["Summoner 2 casts", p.summoner2Casts],
    ],
    Survivability: [
      ["Damage taken", p.totalDamageTaken],
      ["Physical taken", p.physicalDamageTaken],
      ["Magic taken", p.magicDamageTaken],
      ["True taken", p.trueDamageTaken],
      ["Self mitigated", p.damageSelfMitigated],
      ["Damage taken % of team", pctStat(c.damageTakenOnTeamPercentage)],
      ["Total heal", p.totalHeal],
      ["Heals on teammates", p.totalHealsOnTeammates],
      ["Shielded teammates", p.totalDamageShieldedOnTeammates],
      ["Time CCing others", p.timeCCingOthers],
      ["Total time CC dealt", p.totalTimeCCDealt],
      ["CC / min", ccPerMin],
      ["Total time spent dead", p.totalTimeSpentDead],
      ["Longest time living", p.longestTimeSpentLiving],
      ["Survived single target", c.survivedSingleTarget],
    ],
    Economy: [
      ["Gold earned", p.goldEarned],
      ["Gold spent", p.goldSpent],
      ["Gold / min", gpm],
      ["Damage / gold", p.goldEarned ? (p.totalDamageDealtToChampions / p.goldEarned).toFixed(2) : "—"],
      ["CS (lane + jungle)", totalCs],
      ["Lane minions", p.totalMinionsKilled],
      ["Neutral monsters", p.neutralMinionsKilled],
      ["Ally jungle CS", p.totalAllyJungleMinionsKilled],
      ["Enemy jungle CS", p.totalEnemyJungleMinionsKilled],
      ["CS / min", (totalCs / mins).toFixed(1)],
      ["Max CS lead vs lane", c.maxCsAdvantageOnLaneOpponent],
      ["Max level lead vs lane", c.maxLevelLeadLaneOpponent],
      ["Champ level", p.champLevel],
      ["Champ XP", p.champExperience],
      ["Items purchased", p.itemsPurchased],
      ["Consumables purchased", p.consumablesPurchased],
    ],
    Vision: [
      ["Vision score", p.visionScore],
      ["Vision / min", vpm],
      ["Wards placed", p.wardsPlaced],
      ["Wards killed", p.wardsKilled],
      ["Control wards bought", p.visionWardsBoughtInGame],
      ["Sight wards bought", p.sightWardsBoughtInGame],
      ["Detector wards placed", p.detectorWardsPlaced],
      ["Control wards placed", c.controlWardsPlaced ?? p.detectorWardsPlaced],
      ["Ward takedowns", c.wardTakedowns],
      ["Ward takedowns <20", c.wardTakedownsBefore20M],
      ["Vision advantage vs lane", c.visionScoreAdvantageLaneOpponent],
      ["Stealth wards placed", c.stealthWardsPlaced],
      ["Wards guarded", c.wardsGuarded],
    ],
    Objectives: [
      ["Turret kills", p.turretKills],
      ["Turret takedowns", p.turretTakedowns],
      ["Inhibitor kills", p.inhibitorKills],
      ["Inhibitor takedowns", p.inhibitorTakedowns],
      ["Dragon kills", p.dragonKills],
      ["Baron kills", p.baronKills],
      ["Herald kills", c.riftHeraldTakedowns ?? p.objectivesStolen],
      ["Objective dmg", p.damageDealtToObjectives],
      ["First tower", p.firstTowerKill],
      ["First tower assist", p.firstTowerAssist],
      ["Turret plates taken", c.turretPlatesTaken],
      ["Epic monster steals", c.epicMonsterSteals],
      ["Epic monster stolen w/o smite", c.epicMonsterStolenWithoutSmite],
      ["Void monsters", c.voidMonsterKill],
      ["Team baron kills", c.teamBaronKills],
      ["Team elder kills", c.teamElderDragonKills],
      ["Team rift herald", c.teamRiftHeraldKills],
    ],
    "Early / Mid game": [
      ["Lane gold/XP advantage", c.laningPhaseGoldExpAdvantage],
      ["Early lane gold/XP adv.", c.earlyLaningPhaseGoldExpAdvantage],
      ["Jungle CS before 10", c.jungleCsBefore10Minutes],
      ["CS before 10", c.laneMinionsFirst10Minutes],
      ["Gold @ 14", c.goldAt14 ?? c.goldDiffAt14],
      ["XP @ 14", c.xpAt14 ?? c.xpDiffAt14],
      ["CS @ 14", c.laneMinionsAt14 ?? c.csAt14],
      ["Kills on laners early (jg)", c.killsOnLanersEarlyJungleAsJungler],
      ["Takedowns after gank", c.takedownsAfterGainingLevelAdvantage],
      ["First turret killed time", c.firstTurretKilledTime],
      ["Earliest dragon", c.earliestDragonTakedown],
      ["Skillshots dodged", c.skillshotsDodged],
      ["Skillshots hit", c.skillshotsHit],
      ["Land skillshots early", c.landSkillShotsEarlyGame],
      ["Dodge skillshots window", c.dodgeSkillShotsSmallWindow],
    ],
    Utility: [
      ["Crowd control score", p.timeCCingOthers],
      ["Immobilize + kill", c.immobilizeAndKillWithAlly],
      ["Knock enemies into team", c.knockEnemyIntoTeamAndKill],
      ["Save ally from death", c.saveAllyFromDeath],
      ["Survived 3 immobilizes", c.survivedThreeImmobilizesInFight],
      ["Unseen recalls", c.unseenRecalls],
      ["Enemy champion immobilizations", c.enemyChampionImmobilizations],
      ["Multikills after flash", c.multikillsAfterAggressiveFlash],
      ["Took large dmg survived", c.tookLargeDamageSurvived],
      ["Game ended in surrender", p.gameEndedInSurrender],
      ["Early surrender", p.gameEndedInEarlySurrender],
      ["Team early surrendered", p.teamEarlySurrendered],
    ],
    Pings: [
      ["All-in pings", p.allInPings],
      ["Assist me", p.assistMePings],
      ["Bait pings", p.baitPings],
      ["Command", p.commandPings],
      ["Enemy missing", p.enemyMissingPings],
      ["Enemy vision", p.enemyVisionPings],
      ["Get back", p.getBackPings],
      ["On my way", p.onMyWayPings],
      ["Need vision", p.needVisionPings],
      ["Push", p.pushPings],
      ["Vision cleared", p.visionClearedPings],
      ["Danger", p.dangerPings],
      ["Hold", p.holdPings],
    ],
  };
}

function PlayerDeepStats({ p, label, accent, version, duration }) {
  if (!p) {
    return (
      <div className="rounded-md border border-slate-800 bg-[#0a101c] p-6 text-center text-sm text-slate-500">
        No player data
      </div>
    );
  }
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
          <div className="text-xs font-semibold text-slate-400">
            {p.championName} · {p.teamPosition || p.individualPosition || "?"} ·{" "}
            <span className={p.win ? "text-emerald-400" : "text-rose-400"}>
              {p.win ? "Victory" : "Defeat"}
            </span>
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
                  value={
                    typeof value === "boolean"
                      ? fmtStat(value)
                      : typeof value === "string"
                        ? value
                        : fmtStat(value)
                  }
                />
              ))}
            </div>
          </div>
        ))}

        <div>
          <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-cyan-400/80">
            Items
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((id, i) =>
              id ? (
                <img
                  key={`${id}-${i}`}
                  alt=""
                  className="h-9 w-9 rounded border border-slate-700 bg-slate-950"
                  src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id}.png`}
                />
              ) : (
                <div key={`e-${i}`} className="h-9 w-9 rounded border border-slate-800 bg-slate-950/80" />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThisGameDeepStats({ game, version }) {
  return (
    <div className="space-y-4 p-5">
      <div className="text-sm font-bold text-slate-300">
        This game only — full Match-V5 + Challenges breakdown
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
    </div>
  );
}

export default function RecentGameTab({ data }) {
  const game = data.latestGame;
  const version = data.version || "14.22.1";
  const [subTab, setSubTab] = useState("scoreboard");
  const [chartMode, setChartMode] = useState("both"); // both | damage | gold

  const model = useMemo(() => {
    if (!game?.allParticipants?.length && !game?.allies) return null;
    const participants = sortByRole(game.allParticipants || [...(game.allies || []), ...(game.enemies || [])]);
    const blue = sortByRole(participants.filter((p) => p.teamId === 100));
    const red = sortByRole(participants.filter((p) => p.teamId === 200));
    // Fallback if teamIds aren't classic 100/200
    const blueFinal = blue.length ? blue : sortByRole(game.allies || []);
    const redFinal = red.length ? red : sortByRole(game.enemies || []);

    const teams = game.teams || [];
    const blueTeam = teams.find((t) => t.teamId === 100) || teams.find((t) => t.win === blueFinal[0]?.win);
    const redTeam = teams.find((t) => t.teamId === 200) || teams.find((t) => t !== blueTeam);

    const blueWin = blueFinal[0]?.win ?? blueTeam?.win ?? false;
    const blueTot = teamTotals(blueFinal);
    const redTot = teamTotals(redFinal);

    // Pair by role for chart
    const roles = ROLE_ORDER.filter(
      (r) =>
        blueFinal.some((p) => (p.teamPosition || p.individualPosition) === r) ||
        redFinal.some((p) => (p.teamPosition || p.individualPosition) === r),
    );
    const chartRows = (roles.length ? roles : blueFinal.map((_, i) => i)).map((roleOrIdx, i) => {
      const bp =
        typeof roleOrIdx === "string"
          ? blueFinal.find((p) => (p.teamPosition || p.individualPosition) === roleOrIdx) || blueFinal[i]
          : blueFinal[i];
      const rp =
        typeof roleOrIdx === "string"
          ? redFinal.find((p) => (p.teamPosition || p.individualPosition) === roleOrIdx) || redFinal[i]
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
    ? new Date(game.gameStartTimestamp).toLocaleString(undefined, {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
        hour: "numeric",
        minute: "2-digit",
      }).replace(",", " //")
    : "";

  const mePuuid = game.me?.puuid;
  const frPuuid = game.friend?.puuid;
  const victorySide = model.blueWin ? "Blue Side Victory" : "Red Side Victory";
  const victoryColor = model.blueWin ? BLUE : RED;

  const avgBlueDmg = Math.round(model.blueTot.damage / Math.max(1, model.blue.length));
  const avgRedDmg = Math.round(model.redTot.damage / Math.max(1, model.red.length));
  const avgBlueGold = Math.round(model.blueTot.gold / Math.max(1, model.blue.length));
  const avgRedGold = Math.round(model.redTot.gold / Math.max(1, model.red.length));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800/80" style={{ background: NAVY }}>
      {/* Top header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <div className="text-xs font-semibold text-slate-400">
            {queueLabel(game.queueId)}{" "}
            <span className="text-slate-600">{started}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-black" style={{ color: victoryColor }}>
              {victorySide}
            </span>
            <span className="text-lg font-bold text-white">{fmtDuration(game.gameDuration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {["scoreboard", "matchups", "stats"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSubTab(t)}
              className={`relative pb-2 text-sm font-bold capitalize ${
                subTab === t ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t}
              {subTab === t && (
                <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded" style={{ background: BLUE }} />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ExternalLink size={14} /> Open in New Tab
          </span>
          <span className="inline-flex items-center gap-1">
            <Copy size={14} /> Copy Share Link
          </span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded border border-slate-700">
            <X size={14} />
          </span>
        </div>
      </div>

      {/* Team comparison strip */}
      <div className="grid grid-cols-1 gap-4 border-b border-slate-800 px-5 py-5 lg:grid-cols-[1fr_1.2fr_1fr]">
        <TeamPanel
          side="blue"
          label="Blue Side"
          color={BLUE}
          objs={model.blueObjs}
          totals={model.blueTot}
        />

        <div className="rounded-md border border-slate-800 bg-[#0a101c] p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex items-center gap-1 text-xs font-bold text-slate-300">
              <select
                value={chartMode}
                onChange={(e) => setChartMode(e.target.value)}
                className="rounded border border-slate-700 bg-[#121a2b] px-2 py-1 text-xs font-bold text-white"
              >
                <option value="both">Damage vs Gold</option>
                <option value="damage">Damage</option>
                <option value="gold">Gold</option>
              </select>
              <ChevronDown size={12} className="text-slate-500" />
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
          <div className="h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={model.chartRows} barGap={2} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis
                  dataKey="role"
                  tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)}
                  width={36}
                />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", fontSize: 12 }}
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
          <div className="mt-1 flex justify-around px-2">
            {model.chartRows.map((row) => (
              <div key={row.role} className="flex -space-x-1">
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
        <div>
          {/* Column headers */}
          <div className="grid grid-cols-[2.2fr_1.6fr_0.7fr_0.9fr_1.1fr_1.1fr_0.9fr_0.9fr] gap-2 border-b border-slate-800 bg-[#0a1424] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <div className="pl-2" style={{ color: BLUE }}>
              Blue Side
            </div>
            <div>Build</div>
            <div className="text-center">Rank</div>
            <div className="text-center">K/D/A</div>
            <div className="text-center">Damage Dealt/Taken</div>
            <div className="text-center">Obj Damage</div>
            <div className="text-center">Level</div>
            <div className="text-center">CS</div>
          </div>

          {model.blue.map((p) => (
            <PlayerRow
              key={p.puuid}
              p={p}
              version={version}
              duration={game.gameDuration}
              highlight={p.puuid === mePuuid || p.puuid === frPuuid}
              side="blue"
            />
          ))}

          <div className="grid grid-cols-[2.2fr_1.6fr_0.7fr_0.9fr_1.1fr_1.1fr_0.9fr_0.9fr] gap-2 border-y border-slate-800 bg-[#1a0f16] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
            <div className="pl-2" style={{ color: RED }}>
              Red Side
            </div>
            <div>Build</div>
            <div className="text-center">Rank</div>
            <div className="text-center">K/D/A</div>
            <div className="text-center">Damage Dealt/Taken</div>
            <div className="text-center">Obj Damage</div>
            <div className="text-center">Level</div>
            <div className="text-center">CS</div>
          </div>

          {model.red.map((p) => (
            <PlayerRow
              key={p.puuid}
              p={p}
              version={version}
              duration={game.gameDuration}
              highlight={p.puuid === mePuuid || p.puuid === frPuuid}
              side="red"
            />
          ))}
        </div>
      )}

      {subTab === "matchups" && (
        <div className="grid gap-3 p-5 sm:grid-cols-5">
          {ROLE_ORDER.map((role) => {
            const bp = model.blue.find((p) => (p.teamPosition || p.individualPosition) === role);
            const rp = model.red.find((p) => (p.teamPosition || p.individualPosition) === role);
            if (!bp && !rp) return null;
            return (
              <div key={role} className="rounded-md border border-slate-800 bg-[#0a101c] p-3 text-center">
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
                  <span style={{ color: BLUE }}>{bp ? `${bp.kills}/${bp.deaths}/${bp.assists}` : "—"}</span>
                  {" · "}
                  <span style={{ color: RED }}>{rp ? `${rp.kills}/${rp.deaths}/${rp.assists}` : "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === "stats" && (
        <ThisGameDeepStats game={game} version={version} />
      )}
    </div>
  );
}
