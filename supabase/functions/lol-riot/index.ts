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
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
};

type LeagueEntryDto = {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
};

type MatchDto = {
  metadata: { matchId: string };
  info: {
    gameMode: string;
    gameDuration: number;
    queueId: number;
    participants: Array<{
      puuid: string;
      championName: string;
      kills: number;
      deaths: number;
      assists: number;
      win: boolean;
      summonerName?: string;
    }>;
  };
};

type LookupBody = {
  gameName?: string;
  tagLine?: string;
  platform?: string;
};

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
    const gameName = body.gameName?.trim() ?? "";
    const tagLine = body.tagLine?.trim() ?? "";
    const platformRaw = (body.platform ?? "na1").toLowerCase();

    if (!gameName || !tagLine) {
      return jsonResponse({ error: "gameName and tagLine are required" }, 400);
    }
    if (!PLATFORMS.has(platformRaw)) {
      return jsonResponse({ error: "Unsupported platform" }, 400);
    }
    const platform = platformRaw as LolPlatform;
    const regional = regionalForPlatform(platform);

    const account = await riotGet<AccountDto>(
      regional === "sea" ? "asia" : regional,
      `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    );

    const summoner = await riotGet<SummonerDto>(
      platform,
      `/lol/summoner/v4/summoners/by-puuid/${encodeURIComponent(account.puuid)}`,
    );

    const ranked = await riotGet<LeagueEntryDto[]>(
      platform,
      `/lol/league/v4/entries/by-summoner/${encodeURIComponent(summoner.id)}`,
    );

    const matchIds = await riotGet<string[]>(
      regional,
      `/lol/match/v5/matches/by-puuid/${encodeURIComponent(account.puuid)}/ids?start=0&count=5`,
    );

    const recentMatches: Array<{
      matchId: string;
      championName: string;
      kills: number;
      deaths: number;
      assists: number;
      win: boolean;
      gameMode: string;
      gameDuration: number;
    }> = [];

    for (const matchId of matchIds) {
      try {
        const match = await riotGet<MatchDto>(
          regional,
          `/lol/match/v5/matches/${encodeURIComponent(matchId)}`,
        );
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
        // Skip individual match failures (rate limits / transient)
      }
    }

    return jsonResponse({
      account: {
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,
      },
      summoner: {
        level: summoner.summonerLevel,
        profileIconId: summoner.profileIconId,
      },
      ranked,
      recentMatches,
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
