import { createGame, type Game } from '../models/game';
import { parseISO8601 } from '../lib/iso8601';
import { isWithin } from '../lib/dates';
import { fetchJson } from '../lib/http';

/** Port of `NBAService.swift`. */
const SCHEDULE_PATH = '/api/nba/static/json/staticData/scheduleLeagueV2_1.json';

interface NBABroadcaster {
  broadcasterDisplay: string;
}

interface NBABroadcasters {
  nationalTvBroadcasters?: NBABroadcaster[];
  homeTvBroadcasters?: NBABroadcaster[];
}

interface NBATeamEntry {
  teamId: number;
  teamCity: string;
  teamName: string;
  score?: number | null;
}

interface NBAGameResponse {
  gameId: string;
  gameDateTimeUTC: string;
  gameStatus: number;
  gameStatusText: string;
  homeTeam: NBATeamEntry;
  awayTeam: NBATeamEntry;
  broadcasters?: NBABroadcasters;
  arenaName?: string | null;
}

interface NBAScheduleResponse {
  leagueSchedule: { gameDates: Array<{ games: NBAGameResponse[] }> };
}

function fullName(team: NBATeamEntry): string {
  return `${team.teamCity} ${team.teamName}`;
}

function tvBroadcasts(game: NBAGameResponse): string[] {
  const national = game.broadcasters?.nationalTvBroadcasters ?? [];
  const home = game.broadcasters?.homeTvBroadcasters ?? [];
  const combined = [...national, ...home].map((entry) => entry.broadcasterDisplay);
  return combined.filter((name, index) => combined.indexOf(name) === index);
}

export async function fetchNBAGames(
  teamId: number,
  startDate: Date,
  endDate: Date,
  signal?: AbortSignal,
): Promise<Game[]> {
  const response = await fetchJson<NBAScheduleResponse>(SCHEDULE_PATH, { signal });

  return response.leagueSchedule.gameDates
    .flatMap((gameDate) => gameDate.games)
    .flatMap((game) => {
      const date = parseISO8601(game.gameDateTimeUTC);
      if (!date || !isWithin(date, startDate, endDate)) return [];
      if (game.homeTeam.teamId !== teamId && game.awayTeam.teamId !== teamId) return [];

      const isCompleted = game.gameStatus === 3;
      return [
        createGame({
          homeTeam: fullName(game.homeTeam),
          awayTeam: fullName(game.awayTeam),
          gameDate: date,
          homeScore: isCompleted ? (game.homeTeam.score ?? null) : null,
          awayScore: isCompleted ? (game.awayTeam.score ?? null) : null,
          isCompleted,
          tvBroadcasts: tvBroadcasts(game),
        }),
      ];
    });
}
