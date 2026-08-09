// @ts-nocheck
import React from "react";

const CARD = "bg-[#151823] rounded-sm p-4 shadow-lg border border-slate-800/50";
const LIME = "text-[#39ff14] font-black drop-shadow-[0_0_10px_rgba(57,255,20,0.6)]";
const PINK = "text-[#ff69b4] font-black drop-shadow-[0_0_10px_rgba(255,105,180,0.6)]";

function fmt(n) {
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

function pct(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return `${(Number(n) * 100).toFixed(1)}%`;
}

function kda(p) {
  const d = p.deaths || 1;
  return ((p.kills + p.assists) / d).toFixed(2);
}

function cs(p) {
  return (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
}

function durationLabel(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-sm border border-slate-800/60 bg-[#0f111a] px-3 py-3 text-center min-h-[72px] flex flex-col justify-center">
      <div className={`text-xl font-black tabular-nums ${accent || "text-white"}`}>{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className={CARD}>
      <div className="mb-4 border-b border-slate-800 pb-2">
        <h3 className="text-sm font-bold uppercase tracking-wide text-white">{title}</h3>
        {subtitle && <p className="mt-1 text-[10px] text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function PlayerHeader({ p, neonClass, version }) {
  const name = p.riotIdGameName || p.summonerName || "Player";
  const tag = p.riotIdTagline || "";
  return (
    <div className="flex items-center gap-3">
      <img
        alt=""
        className="h-14 w-14 rounded-full border-2 border-slate-600 bg-slate-800 object-cover"
        src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${p.championName}.png`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <div>
        <div className={`text-lg ${neonClass}`}>
          {name}
          {tag ? <span className="text-slate-500 text-sm font-normal drop-shadow-none"> #{tag}</span> : null}
        </div>
        <div className="text-xs font-bold uppercase text-slate-400">
          {p.championName} · {p.teamPosition || p.individualPosition || "?"} ·{" "}
          <span className={p.win ? "text-emerald-400" : "text-rose-400"}>{p.win ? "Victory" : "Defeat"}</span>
        </div>
        <div className="text-sm font-black text-white">
          {p.kills}/{p.deaths}/{p.assists}{" "}
          <span className="text-slate-500 font-bold">KDA {kda(p)}</span>
        </div>
      </div>
    </div>
  );
}

function buildStats(p) {
  const c = p.challenges || {};
  const totalCs = cs(p);
  return {
    Combat: [
      ["Kills", p.kills],
      ["Deaths", p.deaths],
      ["Assists", p.assists],
      ["KDA", kda(p)],
      ["Kill participation", pct(c.killParticipation)],
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
      ["Damage / min", c.damagePerMinute],
      ["Team damage %", pct(c.teamDamagePercentage)],
      ["Largest crit", p.largestCriticalStrike],
      ["Total damage dealt", p.totalDamageDealt],
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
      ["Damage taken % of team", pct(c.damageTakenOnTeamPercentage)],
      ["Total heal", p.totalHeal],
      ["Heals on teammates", p.totalHealsOnTeammates],
      ["Shielded teammates", p.totalDamageShieldedOnTeammates],
      ["Time CCing others", p.timeCCingOthers],
      ["Total time CC dealt", p.totalTimeCCDealt],
      ["Total time spent dead", p.totalTimeSpentDead],
      ["Longest time living", p.longestTimeSpentLiving],
      ["Survived single target", c.survivedSingleTarget],
    ],
    Economy: [
      ["Gold earned", p.goldEarned],
      ["Gold spent", p.goldSpent],
      ["Gold / min", c.goldPerMinute],
      ["CS (lane + jungle)", totalCs],
      ["Lane minions", p.totalMinionsKilled],
      ["Neutral monsters", p.neutralMinionsKilled],
      ["Ally jungle CS", p.totalAllyJungleMinionsKilled],
      ["Enemy jungle CS", p.totalEnemyJungleMinionsKilled],
      ["CS / min", (totalCs / Math.max(1, (p.timePlayed || 1) / 60)).toFixed(1)],
      ["Max CS lead vs lane", c.maxCsAdvantageOnLaneOpponent],
      ["Max level lead vs lane", c.maxLevelLeadLaneOpponent],
      ["Champ level", p.champLevel],
      ["Champ XP", p.champExperience],
      ["Items purchased", p.itemsPurchased],
      ["Consumables purchased", p.consumablesPurchased],
    ],
    Vision: [
      ["Vision score", p.visionScore],
      ["Vision / min", c.visionScorePerMinute],
      ["Wards placed", p.wardsPlaced],
      ["Wards killed", p.wardsKilled],
      ["Control wards bought", p.visionWardsBoughtInGame],
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
      ["Kills on laners early (jg)", c.killsOnLanersEarlyJungleAsJungler],
      ["Takedowns after gank", c.takedownsAfterGainingLevelAdvantage],
      ["First turret killed time", c.firstTurretKilledTime],
      ["Earliest dragon", c.earliestDragonTakedown],
      ["Dmg taken early", c.damageTakenOnTeamPercentage],
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

function PlayerStatGrid({ p, neonClass, version }) {
  const groups = buildStats(p);
  return (
    <div className="space-y-5">
      <PlayerHeader p={p} neonClass={neonClass} version={version} />
      {Object.entries(groups).map(([title, rows]) => (
        <div key={title}>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-cyan-500/80">{title}</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {rows.map(([label, value]) => (
              <Stat
                key={label}
                label={label}
                value={typeof value === "boolean" ? fmt(value) : typeof value === "number" && label.toLowerCase().includes("%") ? pct(value) : fmt(value)}
              />
            ))}
          </div>
        </div>
      ))}
      <div>
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-cyan-500/80">Items</div>
        <div className="flex flex-wrap gap-2">
          {[p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6].map((id, i) =>
            id ? (
              <img
                key={`${id}-${i}`}
                alt=""
                title={`Item ${id}`}
                className="h-10 w-10 rounded border border-slate-700 bg-slate-900"
                src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id}.png`}
              />
            ) : (
              <div key={`empty-${i}`} className="h-10 w-10 rounded border border-slate-800 bg-slate-950" />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreboardRow({ p, highlight }) {
  return (
    <div
      className={`grid grid-cols-[1.4fr_0.7fr_0.9fr_0.9fr_0.7fr_0.7fr] gap-2 rounded px-3 py-2 text-xs font-bold ${
        highlight ? "bg-cyan-950/40 border border-cyan-800/40" : "bg-[#0f111a] border border-slate-800/40"
      }`}
    >
      <div className="truncate text-white">
        {p.championName}{" "}
        <span className="text-slate-500">{p.riotIdGameName || p.summonerName || ""}</span>
      </div>
      <div className="text-center text-slate-300">
        {p.kills}/{p.deaths}/{p.assists}
      </div>
      <div className="text-center text-slate-300">{fmt(p.totalDamageDealtToChampions)}</div>
      <div className="text-center text-slate-300">{fmt(p.goldEarned)}</div>
      <div className="text-center text-slate-300">{cs(p)}</div>
      <div className="text-center text-slate-300">{p.visionScore}</div>
    </div>
  );
}

export default function RecentGameTab({ data }) {
  const game = data.latestGame;
  const version = data.version || "14.22.1";
  if (!game?.me || !game?.friend) {
    return (
      <div className={`${CARD} text-center text-slate-400 py-16`}>
        No recent duo game found in the loaded history.
      </div>
    );
  }

  const mePuuid = game.me.puuid;
  const frPuuid = game.friend.puuid;
  const started = game.gameStartTimestamp
    ? new Date(game.gameStartTimestamp).toLocaleString()
    : "—";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Section
        title="Most recent duo game"
        subtitle="Deep Match-V5 + Challenges breakdown for your latest game together"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className={`text-2xl font-black ${game.me.win ? "text-emerald-400" : "text-rose-400"}`}>
              {game.me.win ? "VICTORY" : "DEFEAT"}
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-400">
              {game.gameMode} · Queue {game.queueId} · {durationLabel(game.gameDuration)} · {started}
            </div>
            {game.matchId && (
              <div className="mt-1 text-[11px] font-mono text-slate-600">{game.matchId}</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Your KDA" value={`${game.me.kills}/${game.me.deaths}/${game.me.assists}`} accent={LIME} />
            <Stat label="Duo KDA" value={`${game.friend.kills}/${game.friend.deaths}/${game.friend.assists}`} accent={PINK} />
            <Stat label="Your KP" value={pct(game.me.challenges?.killParticipation)} />
            <Stat label="Combined vision" value={fmt((game.me.visionScore || 0) + (game.friend.visionScore || 0))} />
          </div>
        </div>
      </Section>

      <Section title="Full scoreboard" subtitle="Damage · Gold · CS · Vision">
        <div className="mb-2 grid grid-cols-[1.4fr_0.7fr_0.9fr_0.9fr_0.7fr_0.7fr] gap-2 px-3 text-[10px] font-bold uppercase text-slate-500">
          <div>Champion / player</div>
          <div className="text-center">KDA</div>
          <div className="text-center">Dmg</div>
          <div className="text-center">Gold</div>
          <div className="text-center">CS</div>
          <div className="text-center">Vision</div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase text-cyan-400">Your team</div>
            <div className="space-y-1">
              {(game.allies || []).map((p) => (
                <ScoreboardRow
                  key={p.puuid}
                  p={p}
                  highlight={p.puuid === mePuuid || p.puuid === frPuuid}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase text-rose-400">Enemy team</div>
            <div className="space-y-1">
              {(game.enemies || []).map((p) => (
                <ScoreboardRow key={p.puuid} p={p} highlight={false} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="You — every key stat" subtitle="Combat, damage, economy, vision, objectives, challenges">
          <PlayerStatGrid p={game.me} neonClass={LIME} version={version} />
        </Section>
        <Section title="Duo partner — every key stat" subtitle="Side-by-side deep dive">
          <PlayerStatGrid p={game.friend} neonClass={PINK} version={version} />
        </Section>
      </div>
    </div>
  );
}
