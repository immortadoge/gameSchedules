import { createGame, type Game } from '../models/game';
import { parseISO8601 } from '../lib/iso8601';
import { toYYYYMMDD } from '../lib/dates';
import { fetchJson } from '../lib/http';

/** Port of `MLBService.swift`. */
const SCHEDULE_PATH = '/api/mlb/api/v1/schedule';

interface MLBBroadcast {
  name: string;
  type: string;
}

interface MLBTeamEntry {
  team: { name: string };
  score?: number | null;
}

interface MLBGameResponse {
  gameDate: string;
  officialDate: string;
  status: { abstractGameState: string };
  teams: { home: MLBTeamEntry; away: MLBTeamEntry };
  broadcasts?: MLBBroadcast[];
  venue?: { name: string };
}

interface MLBScheduleResponse {
  dates?: Array<{ games: MLBGameResponse[] }>;
}

function tvBroadcasts(game: MLBGameResponse): string[] {
  const names = (game.broadcasts ?? [])
    .filter((broadcast) => broadcast.type === 'TV')
    .map((broadcast) => broadcast.name);
  return names.filter((name, index) => names.indexOf(name) === index);
}

export async function fetchMLBGames(
  teamId: number,
  startDate: Date,
  endDate: Date,
  signal?: AbortSignal,
): Promise<Game[]> {
  const response = await fetchJson<MLBScheduleResponse>(SCHEDULE_PATH, {
    signal,
    query: {
      sportId: 1,
      teamId,
      startDate: toYYYYMMDD(startDate),
      endDate: toYYYYMMDD(endDate),
      hydrate: 'broadcasts,team',
    },
  });

  return (response.dates ?? [])
    .flatMap((date) => date.games)
    .flatMap((game) => {
      const date = parseISO8601(game.gameDate);
      if (!date) return [];

      return [
        createGame({
          homeTeam: game.teams.home.team.name,
          awayTeam: game.teams.away.team.name,
          gameDate: date,
          homeScore: game.teams.home.score ?? null,
          awayScore: game.teams.away.score ?? null,
          isCompleted: game.status.abstractGameState === 'Final',
          tvBroadcasts: tvBroadcasts(game),
        }),
      ];
    });
}
