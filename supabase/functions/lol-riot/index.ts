import {
  corsHeaders,
  jsonResponse,
  regionalForPlatform,
  requireUser,
  riotGet,
  type LolPlatform,
} from "../_shared/riot.ts";

type AccountDto = {
  puuid: string;
  gameName: string;
  tagLine: string;
};

type SummonerDto = {
  id?: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
};

type LeagueEntryDto = {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

type MasteryDto = {
  championId: number;
  championPoints: number;
  championLevel: number;
};

type LookupBody = {
  action?: "lookup" | "duo";
  riotId?: string;
  friendRiotId?: string;
  gameName?: string;
  tagLine?: string;
  platform?: string;
  matchCount?: number;
};

function parseRiotId(input: string): { gameName: string; tagLine: string } | null {
  const raw = input.trim();
  const hash = raw.lastIndexOf("#");
  if (hash <= 0 || hash === raw.length - 1) return null;
  const gameName = raw.slice(0, hash).trim();
  const tagLine = raw.slice(hash + 1).trim().replace(/^#/, "");
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

const PLATFORMS = new Set([
  "na1",
  "euw1",
  "eun1",
  "kr",
  "br1",
  "la1",
  "la2",
  "jp1",
  "oc1",
  "tr1",
  "ru",
  "sg2",
  "tw2",
  "vn2",
]);

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchAccount(
  regionalHost: string,
  gameName: string,
  tagLine: string,
): Promise<AccountDto> {
  return riotGet<AccountDto>(
    regionalHost,
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
  );
}

async function soloRankString(platform: LolPlatform, puuid: string): Promise<string> {
  try {
    const ranked = await riotGet<LeagueEntryDto[]>(
      platform,
      `/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`,
    );
    const solo = ranked.find((l) => l.queueType === "RANKED_SOLO_5x5");
    return solo ? `${solo.tier} ${solo.rank}` : "Unranked";
  } catch {
    return "Unranked";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    await requireUser(req);

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const body = (await req.json()) as LookupBody;
    const platformRaw = (body.platform ?? "na1").toLowerCase();
    if (!PLATFORMS.has(platformRaw)) {
      return jsonResponse({ error: "Unsupported platform" }, 400);
    }
    const platform = platformRaw as LolPlatform;
    const regional = regionalForPlatform(platform);
    const accountHost = regional === "sea" ? "asia" : regional;

    // --- Single-player lookup (kept for simple searches) ---
    if ((body.action ?? "lookup") === "lookup") {
      const fromCombined = body.riotId ? parseRiotId(body.riotId) : null;
      const gameName = (fromCombined?.gameName ?? body.gameName ?? "").trim();
      const tagLine = (fromCombined?.tagLine ?? body.tagLine ?? "").trim().replace(/^#/, "");
      if (!gameName || !tagLine) {
        return jsonResponse({ error: "Enter a Riot ID like Name#TAG" }, 400);
      }

      const account = await fetchAccount(accountHost, gameName, tagLine);
      const summoner = await riotGet<SummonerDto>(
        platform,
        `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`,
      );
      const ranked = await riotGet<LeagueEntryDto[]>(
        platform,
        `/lol/league/v4/entries/by-puuid/${encodeURIComponent(account.puuid)}`,
      );
      const matchIds = await riotGet<string[]>(
        regional,
        `/lol/match/v5/matches/by-puuid/${encodeURIComponent(account.puuid)}/ids?start=0&count=5`,
      );

      const recentMatches = [];
      for (const matchId of matchIds.slice(0, 5)) {
        try {
          const match = await riotGet<{
            info: {
              gameMode: string;
              gameDuration: number;
              participants: Array<{
                puuid: string;
                championName: string;
                kills: number;
                deaths: number;
                assists: number;
                win: boolean;
              }>;
            };
            metadata: { matchId: string };
          }>(regional, `/lol/match/v5/matches/${encodeURIComponent(matchId)}`);
          const me = match.info.participants.find((p) => p.puuid === account.puuid);
          if (!me) continue;
          recentMatches.push({
            matchId,
            championName: me.championName,
            kills: me.kills,
            deaths: me.deaths,
            assists: me.assists,
            win: me.win,
            gameMode: match.info.gameMode,
            gameDuration: match.info.gameDuration,
          });
        } catch {
          /* skip */
        }
      }

      return jsonResponse({
        account,
        summoner: {
          level: summoner.summonerLevel,
          profileIconId: summoner.profileIconId,
        },
        ranked,
        recentMatches,
        platform,
      });
    }

    // --- Duo analytics bundle ---
    const meParsed = body.riotId ? parseRiotId(body.riotId) : null;
    const frParsed = body.friendRiotId ? parseRiotId(body.friendRiotId) : null;
    if (!meParsed || !frParsed) {
      return jsonResponse(
        { error: "Provide both Riot IDs as Name#TAG (me + duo partner)" },
        400,
      );
    }

    const me = await fetchAccount(accountHost, meParsed.gameName, meParsed.tagLine);
    await delay(200);
    const fr = await fetchAccount(accountHost, frParsed.gameName, frParsed.tagLine);

    const meSum = await riotGet<SummonerDto>(
      platform,
      `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(me.puuid)}`,
    );
    await delay(200);
    const frSum = await riotGet<SummonerDto>(
      platform,
      `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(fr.puuid)}`,
    );

    const meRank = await soloRankString(platform, me.puuid);
    await delay(200);
    const frRank = await soloRankString(platform, fr.puuid);

    let meMastery: MasteryDto[] = [];
    let frMastery: MasteryDto[] = [];
    try {
      meMastery = await riotGet<MasteryDto[]>(
        platform,
        `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(me.puuid)}/top?count=10`,
      );
    } catch {
      meMastery = [];
    }
    await delay(200);
    try {
      frMastery = await riotGet<MasteryDto[]>(
        platform,
        `/lol/champion-mastery/v4/champion-masteries/by-puuid/${encodeURIComponent(fr.puuid)}/top?count=10`,
      );
    } catch {
      frMastery = [];
    }

    const count = Math.min(Math.max(body.matchCount ?? 40, 5), 40);
    const latestIds = await riotGet<string[]>(
      regional,
      `/lol/match/v5/matches/by-puuid/${encodeURIComponent(me.puuid)}/ids?start=0&count=${count}`,
    );
    if (!Array.isArray(latestIds)) {
      return jsonResponse({ error: "Riot API busy fetching match list. Try again in a minute." }, 503);
    }

    type MatchShape = {
      info?: {
        participants?: Array<{ puuid: string }>;
      };
      metadata?: { matchId?: string };
    };

    const duoMatches: MatchShape[] = [];
    for (const id of latestIds) {
      if (duoMatches.length >= 20) break;
      await delay(500);
      try {
        const matchData = await riotGet<MatchShape>(
          regional,
          `/lol/match/v5/matches/${encodeURIComponent(id)}`,
        );
        const parts = matchData.info?.participants ?? [];
        const hasMe = parts.some((p) => p.puuid === me.puuid);
        const hasFr = parts.some((p) => p.puuid === fr.puuid);
        if (hasMe && hasFr) duoMatches.push(matchData);
      } catch {
        /* skip */
      }
    }

    const matches: unknown[] = [];
    const timelines: unknown[] = [];
    for (const matchData of duoMatches) {
      const id = matchData.metadata?.matchId;
      matches.push(matchData);
      if (!id) {
        timelines.push(null);
        continue;
      }
      await delay(500);
      try {
        const timelineData = await riotGet<unknown>(
          regional,
          `/lol/match/v5/matches/${encodeURIComponent(id)}/timeline`,
        );
        timelines.push(timelineData);
      } catch {
        timelines.push(null);
      }
    }

    return jsonResponse({
      me: {
        account: me,
        summoner: { level: meSum.summonerLevel, profileIconId: meSum.profileIconId },
        rank: meRank,
        mastery: meMastery,
      },
      friend: {
        account: fr,
        summoner: { level: frSum.summonerLevel, profileIconId: frSum.profileIconId },
        rank: frRank,
        mastery: frMastery,
      },
      matches,
      timelines,
      platform,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status =
      message === "Unauthorized" || message.includes("Authorization")
        ? 401
        : message === "Not found"
          ? 404
          : message.includes("RIOT_API_KEY")
            ? 503
            : 500;
    return jsonResponse({ error: message }, status);
  }
});
