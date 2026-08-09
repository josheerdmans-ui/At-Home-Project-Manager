// @ts-nocheck
// src/dataEngine.js

export const processData = (matches, timelines, mePuuid, friendPuuid) => {
  let duoGames = 0;
  
  const stats = {
    me: { wins: 0, kills: 0, deaths: 0, assists: 0, dmg: 0, gold: 0, cs: 0, vision: 0, dmgTaken: 0, controlWards: 0, soloKills: 0, soloDeaths: 0, games: 0, gd15: 0, dragons: 0, healing: 0, shielding: 0, role: 'UNKNOWN' },
    friend: { wins: 0, kills: 0, deaths: 0, assists: 0, dmg: 0, gold: 0, cs: 0, vision: 0, dmgTaken: 0, controlWards: 0, soloKills: 0, soloDeaths: 0, games: 0, gd15: 0, dragons: 0, healing: 0, shielding: 0, role: 'UNKNOWN' },
    enemy: { kills: 0, deaths: 0, assists: 0, dmg: 0, gold: 0, cs: 0, vision: 0, dragons: 0 },
    latestMatchup: { us: { kills: 0, gold: 0, dmg: 0, vision: 0 }, them: { kills: 0, gold: 0, dmg: 0, vision: 0 }, ready: false },
    laneScoreboard: { me: 0, friend: 0, enemyAdc: 0, enemySupp: 0 },
    champs: { me: {}, friend: {} },
    uniqueChamps: { me: new Set(), friend: new Set() },
    history: [],
    daily: {}, 
    lpGraph: [],   
    goldGraph: [], 
    synergy: { 
        bloodBrothers: { mutual: 0, total: 0 }, 
        socialist: { totalDeviance: 0 },
        seesaw: [],
        recallSync: { synced: 0, total: 0 }, 
        romeoJuliet: 0, 
        savior: { me: 0, friend: 0 },
        laneHistory: [],
        gankMagnet: { totalLaneDeaths: 0, gankDeaths: 0 }
    },
    deep: { visionGap: [], seesaw: [], conversion: [], firstBricks: 0 },
    shame: { ksTribunal: 0, baits: { me: 0, friend: 0 }, pacifist: { me: 0, friend: 0 }, tilt: { afterLoss: { kda: 0, games: 0 }, normal: { kda: 0, games: 0 } } },
    future: { deathsMap: [], hourly: {}, pairs: {}, nightmares: {} },
    performance: { visionScore: 0, controlWards: 0, soloDeaths: 0, soloKills: 0, gd15: 0 } 
  };

  const today = new Date();
  const dayOfWeek = today.getDay(); 
  const totalDays = 119 + dayOfWeek; 
  for (let i = totalDays; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    stats.daily[dateStr] = { date: dateStr, wins: 0, games: 0, label: d.toLocaleDateString('en-US', { weekday: 'short' }), dayIndex: d.getDay() };
  }

  let meLP = 0;
  let frLP = 0;
  let goldGraphGenerated = false;

  const calculateScore = (p) => {
      if (!p) return 0;
      return (p.kills * 50) + (p.assists * 20) + Math.round(p.goldEarned / 100) + Math.round(p.totalDamageDealtToChampions / 100) + (p.visionScore * 5);
  };

  matches.forEach((match, index) => {
    const p = match.info.participants;
    const me = p.find(x => x.puuid === mePuuid);
    const fr = p.find(x => x.puuid === friendPuuid);
    const timeline = timelines[index];

    if (me && fr) {
      if (duoGames >= 20) return;
      duoGames++;
      const myTeam = me.teamId;
      const enemies = p.filter(x => x.teamId !== myTeam);
      
      // Identify Opponents for Scoreboard
      const enemyAdc = enemies.find(x => x.teamPosition === 'BOTTOM') || enemies[0]; 
      const enemySupp = enemies.find(x => x.teamPosition === 'UTILITY') || enemies[1];

      // --- FIXED GANKER IDENTIFICATION ---
      // Instead of guessing who the bot laners are, we specifically identify the Gankers.
      // Anyone assigned JUNGLE, MIDDLE, or TOP is a "Ganker" for the bot lane.
      const gankerIds = enemies
          .filter(x => ['JUNGLE', 'MIDDLE', 'TOP'].includes(x.teamPosition))
          .map(x => x.participantId);
      
      const sMe = calculateScore(me);
      const sFr = calculateScore(fr);
      const sEnAdc = calculateScore(enemyAdc);
      const sEnSupp = calculateScore(enemySupp);
      
      stats.laneScoreboard.me += sMe;
      stats.laneScoreboard.friend += sFr;
      stats.laneScoreboard.enemyAdc += sEnAdc;
      stats.laneScoreboard.enemySupp += sEnSupp;

      stats.synergy.laneHistory.push({
          game: index + 1,
          us: sMe + sFr,
          them: sEnAdc + sEnSupp,
          win: me.win,
          champions: {
              me: me.championName,
              friend: fr.championName,
              enemyAdc: enemyAdc ? enemyAdc.championName : 'Unknown',
              enemySupp: enemySupp ? enemySupp.championName : 'Unknown'
          },
          details: { me: sMe, friend: sFr, enemyAdc: sEnAdc, enemySupp: sEnSupp }
      });

      if (!stats.latestMatchup.ready) {
         stats.latestMatchup.us = { kills: me.kills + fr.kills, gold: me.goldEarned + fr.goldEarned, dmg: me.totalDamageDealtToChampions + fr.totalDamageDealtToChampions, vision: me.visionScore + fr.visionScore };
         const eKills = (enemyAdc?.kills || 0) + (enemySupp?.kills || 0);
         const eGold = (enemyAdc?.goldEarned || 0) + (enemySupp?.goldEarned || 0);
         const eDmg = (enemyAdc?.totalDamageDealtToChampions || 0) + (enemySupp?.totalDamageDealtToChampions || 0);
         const eVision = (enemyAdc?.visionScore || 0) + (enemySupp?.visionScore || 0);
         stats.latestMatchup.them = { kills: eKills, gold: eGold, dmg: eDmg, vision: eVision };
         stats.latestMatchup.ready = true;
      }

      const date = new Date(match.info.gameStartTimestamp).toISOString().split('T')[0];
      if (stats.daily[date]) { stats.daily[date].games++; if (me.win) stats.daily[date].wins++; }
      const myTeamKills = p.filter(x => x.teamId === me.teamId).reduce((a, b) => a + b.kills, 0) || 1;

      const update = (target, raw, champObj, uniqueSet) => {
        target.games++;
        if (raw.win) target.wins++;
        target.kills += raw.kills; target.deaths += raw.deaths; target.assists += raw.assists;
        target.dmg += raw.totalDamageDealtToChampions; target.gold += raw.goldEarned; target.vision += raw.visionScore;
        target.dmgTaken += raw.totalDamageTaken; target.cs += (raw.totalMinionsKilled + raw.neutralMinionsKilled);
        target.controlWards += raw.visionWardsBoughtInGame;
        target.soloKills += raw.challenges?.soloKills || 0;
        target.soloDeaths += (raw.deaths > 5 ? 1 : 0); 
        target.healing += (raw.totalHealsOnTeammates || 0);
        target.shielding += (raw.totalDamageShieldedOnTeammates || 0);

        if (champObj) {
          if (!champObj[raw.championName]) champObj[raw.championName] = { name: raw.championName, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, duration: 0, kp: 0 };
          const c = champObj[raw.championName];
          c.games++; if (raw.win) c.wins++; c.kills += raw.kills; c.deaths += raw.deaths; c.assists += raw.assists;
          c.cs += (raw.totalMinionsKilled + raw.neutralMinionsKilled);
          c.duration += match.info.gameDuration; c.kp += ((raw.kills + raw.assists) / myTeamKills);
        }
        if (uniqueSet) uniqueSet.add(raw.championName);
      };
      update(stats.me, me, stats.champs.me, stats.uniqueChamps.me);
      update(stats.friend, fr, stats.champs.friend, stats.uniqueChamps.friend);
      if (enemyAdc) update(stats.enemy, enemyAdc, null, null);
      if (enemySupp) update(stats.enemy, enemySupp, null, null);

      if (stats.me.role === 'UNKNOWN') stats.me.role = me.teamPosition; 
      if (stats.friend.role === 'UNKNOWN') stats.friend.role = fr.teamPosition;
      stats.performance.visionScore += me.visionScore; stats.performance.controlWards += me.visionWardsBoughtInGame;
      stats.performance.soloKills += (me.challenges?.soloKills || 0); stats.performance.soloDeaths += (me.deaths > 5 ? 1 : 0);

      const change = me.win ? 20 : -20; meLP += change; frLP += change; 
      stats.lpGraph.push({ game: index, meLP, frLP });

      const totalGold = me.goldEarned + fr.goldEarned;
      const gap = Math.abs(me.goldEarned - fr.goldEarned);
      stats.synergy.socialist.totalDeviance += (gap / totalGold); 

      const mScore = calculateScore(me);
      const fScore = calculateScore(fr);
      stats.synergy.seesaw.push({ game: index + 1, meScore: mScore, friendScore: fScore, win: me.win });

      stats.synergy.savior.me += (me.totalHealsOnTeammates + me.totalDamageShieldedOnTeammates);
      stats.synergy.savior.friend += (fr.totalHealsOnTeammates + fr.totalDamageShieldedOnTeammates);

      if (timeline) {
        const frame15 = timeline.info.frames[15];
        if (frame15) {
          const getGold = (pid) => frame15.participantFrames[pid]?.totalGold || 0;
          const myGold = getGold(me.participantId); const frGold = getGold(fr.participantId);
          const enAdcGold = getGold(enemyAdc?.participantId) || 0; const enSuppGold = getGold(enemySupp?.participantId) || 0;
          stats.me.gd15 += (myGold - enAdcGold); stats.friend.gd15 += (frGold - enSuppGold);
          stats.performance.gd15 += ((myGold + frGold) - (enAdcGold + enSuppGold));
        }
        if (!goldGraphGenerated) {
           timeline.info.frames.forEach((frame, i) => {
             const getGold = (pid) => frame.participantFrames[pid]?.totalGold || 0;
             const us = getGold(me.participantId) + getGold(fr.participantId);
             const them = (getGold(enemyAdc?.participantId) || 0) + (getGold(enemySupp?.participantId) || 0);
             stats.goldGraph.push({ min: i, usGold: us, themGold: them });
           });
           goldGraphGenerated = true; 
        }

        const meId = me.participantId;
        const frId = fr.participantId;
        let meDeathTime = -100;
        let frDeathTime = -100;
        const meRecalls = [];
        const frRecalls = [];

        timeline.info.frames.forEach(frame => {
           // Lane Phase Check (First 15 mins)
           const isLanePhase = frame.timestamp < 900000; 

           frame.events.forEach(ev => {
             if (ev.type === 'ELITE_MONSTER_KILL' && ev.monsterType === 'DRAGON' && ev.killerTeamId === me.teamId) {
                 stats.me.dragons++; stats.friend.dragons++;
             }
             if (ev.type === 'CHAMPION_KILL') {
               if (ev.victimId === meId) meDeathTime = ev.timestamp;
               if (ev.victimId === frId) frDeathTime = ev.timestamp;
               if (ev.victimId === meId || ev.victimId === frId) {
                   if (Math.abs(meDeathTime - frDeathTime) < 10000) {
                       stats.synergy.romeoJuliet++;
                       meDeathTime = -100; frDeathTime = -100; 
                   }
               }
               if (ev.killerId === meId) { stats.synergy.bloodBrothers.total++; if (ev.assistingParticipantIds?.includes(frId)) stats.synergy.bloodBrothers.mutual++; }
               else if (ev.killerId === frId) { stats.synergy.bloodBrothers.total++; if (ev.assistingParticipantIds?.includes(meId)) stats.synergy.bloodBrothers.mutual++; }
               
               // --- GANK DETECTION FIX ---
               // Logic: If I/Friend died in lane phase...
               // AND the killer OR any assister is a known "Ganker" (Jungle/Mid/Top)...
               // Then it is a GANK.
               if (isLanePhase && (ev.victimId === meId || ev.victimId === frId)) {
                   stats.synergy.gankMagnet.totalLaneDeaths++;
                   
                   const killerIsGanker = gankerIds.includes(ev.killerId);
                   const assistIsGanker = ev.assistingParticipantIds 
                       ? ev.assistingParticipantIds.some(id => gankerIds.includes(id)) 
                       : false;
                   
                   if (killerIsGanker || assistIsGanker) {
                       stats.synergy.gankMagnet.gankDeaths++;
                   }
               }
             }
             if (ev.type === 'CHAMPION_RECALL') {
                 if (ev.participantId === meId) meRecalls.push(ev.timestamp);
                 if (ev.participantId === frId) frRecalls.push(ev.timestamp);
             }
           });
        });

        let localSync = 0;
        meRecalls.forEach(t1 => {
            const isSynced = frRecalls.some(t2 => Math.abs(t1 - t2) < 10000);
            if (isSynced) localSync++;
        });
        stats.synergy.recallSync.synced += localSync;
        stats.synergy.recallSync.total += meRecalls.length;
      }
    }
  });

  if (duoGames === 0) return null;

  stats.lpGraph = stats.lpGraph.reverse().map((p, i) => ({ ...p, game: i + 1 }));
  stats.synergy.laneHistory = stats.synergy.laneHistory.reverse().map((p, i) => ({ ...p, game: i + 1 }));

  const score = (val, target) => Math.min(100, Math.round(((val || 0) / duoGames / target) * 100));
  const targets = { BOTTOM: { dmg: 60000, gold: 25000, vision: 50, cs: 320 }, UTILITY: { dmg: 25000, gold: 15000, vision: 110, cs: 50 }, OTHER: { dmg: 50000, gold: 20000, vision: 60, cs: 250 } };
  const getTargets = (role) => targets[role] || targets['OTHER'];
  const meT = getTargets(stats.me.role);
  const frT = getTargets(stats.friend.role);

  const gpi = [
      { subject: 'Versatility', A: Math.min(100, Math.round((stats.uniqueChamps.me.size / duoGames) * 100 * 1.5)), B: Math.min(100, Math.round((stats.uniqueChamps.friend.size / duoGames) * 100 * 1.5)), fullMark: 100 }, 
      { subject: 'Fighting', A: score(stats.me.kills + stats.me.assists, 18), B: score(stats.friend.kills + stats.friend.assists, 18), fullMark: 100 }, 
      { subject: 'Farming', A: score(stats.me.cs, meT.cs), B: score(stats.friend.cs, frT.cs), fullMark: 100 }, 
      { subject: 'Vision', A: score(stats.me.vision, meT.vision), B: score(stats.friend.vision, frT.vision), fullMark: 100 }, 
      { subject: 'Aggression', A: score(stats.me.dmg, meT.dmg), B: score(stats.friend.dmg, frT.dmg), fullMark: 100 }, 
      { subject: 'Survivability', A: Math.max(0, 100 - score(stats.me.deaths, 7)), B: Math.max(0, 100 - score(stats.friend.deaths, 7)), fullMark: 100 }, 
      { subject: 'Objectives', A: score(stats.me.dragons, 2.5), B: score(stats.friend.dragons, 2.5), fullMark: 100 }, 
      { subject: 'Consistency', A: Math.round((stats.me.wins / duoGames) * 100), B: Math.round((stats.friend.wins / duoGames) * 100), fullMark: 100 }, 
  ];

  const getPerGame = (playerStats) => ({
    gd15: Math.round(playerStats.gd15 / duoGames),
    vision: (playerStats.vision / duoGames).toFixed(1),
    control: (playerStats.controlWards / duoGames).toFixed(1),
    soloKills: (playerStats.soloKills / duoGames).toFixed(1),
    soloDeaths: (playerStats.soloDeaths / duoGames).toFixed(1),
  });

  const sortChamps = (list) => Object.values(list).sort((a,b) => b.games - a.games).slice(0, 10);
  const dailyActivity = Object.values(stats.daily).sort((a,b) => new Date(a.date) - new Date(b.date));

  return {
    raw: stats, shame: stats.shame, synergy: stats.synergy, deep: stats.deep, future: stats.future, 
    latestMatchup: stats.latestMatchup,
    history: stats.history.reverse(), 
    topChamps: { me: sortChamps(stats.champs.me), friend: sortChamps(stats.champs.friend) }, 
    dailyActivity,
    lpGraph: stats.lpGraph, 
    goldGraph: stats.goldGraph,
    performance: { me: getPerGame(stats.me), friend: getPerGame(stats.friend) },
    gpi: gpi, 
    laneScoreboard: stats.laneScoreboard,
    roles: { me: stats.me.role, friend: stats.friend.role },
    summary: { winRate: Math.round((stats.me.wins / duoGames) * 100), games: duoGames }
  };
};