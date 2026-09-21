import { createGame, type Game } from '../models/game';
import { parseISO8601 } from '../lib/iso8601';
import { fetchJson } from '../lib/http';

/** Port of `LoLEsportsService.swift`. */
const SCHEDULE_PATH = '/api/lol/persisted/gw/getSchedule';

/** Public read-only key the lolesports web client ships with. */
const API_KEY = '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z';

/** MSI, Worlds, First Stand. */
const INTERNATIONAL_LEAGUE_IDS = [
  '98767991325878492',
  '98767975604431411',
  '113464388705111224',
];

interface LoLTeam {
  name: string;
  code: string;
  image?: string;
  result?: { outcome?: string | null; gameWins: number } | null;
  record?: { wins: number; losses: number } | null;
  slug?: string | null;
}

interface LoLEvent {
  startTime: string;
  state: string;
  type: string;
  blockName?: string | null;
  league: { name: string; slug: string };
  match?: {
    id: string;
    teams: LoLTeam[];
    strategy: { type: string; count: number };
  } | null;
}

interface LoLScheduleResponse {
  data: { schedule: { events?: LoLEvent[] } };
}

/**
 * Broadcast channels per league. The iOS app derived these in the overview
 * service only; here they live with the feed so the schedule page shows them too.
 */
export function lolBroadcasts(leagueName: string): string[] {
  const lower = leagueName.toLowerCase();
  for (const league of ['lck', 'lec', 'lcs', 'lpl']) {
    if (lower.includes(league)) return [`Twitch (${league})`, 'YouTube'];
  }
  return ['Twitch (riotgames)', 'YouTube'];
}

function toGame(event: LoLEvent, teamCode: string): Game | null {
  const match = event.match;
  const date = parseISO8601(event.startTime);
  if (!match || !date) return null;

  // Riot's schedule feed has no home/away concept, so the requested team is
  // treated as "home" and the opponent as "away", matching the iOS app.
  const ourIndex = match.teams.findIndex((team) => team.code === teamCode);
  const ourTeam = ourIndex >= 0 ? match.teams[ourIndex] : match.teams[0];
  const opponent = ourIndex >= 0 ? match.teams[ourIndex === 0 ? 1 : 0] : match.teams.at(-1);

  return createGame({
    homeTeam: ourTeam?.name ?? '',
    awayTeam: opponent?.name ?? '',
    gameDate: date,
    homeScore: ourTeam?.result?.gameWins ?? null,
    awayScore: opponent?.result?.gameWins ?? null,
    isCompleted: event.state === 'completed',
    leagueName: event.league.name,
    ...(event.blockName ? { blockName: event.blockName } : {}),
    tvBroadcasts: lolBroadcasts(event.league.name),
  });
}

export async function fetchLoLGames(
  leagueIds: string[],
  teamCode: string,
  signal?: AbortSignal,
): Promise<Game[]> {
  const response = await fetchJson<LoLScheduleResponse>(SCHEDULE_PATH, {
    signal,
    headers: { 'x-api-key': API_KEY },
    query: { hl: 'en-US', leagueId: leagueIds.join(',') },
  });

  return (response.data.schedule.events ?? []).flatMap((event) => {
    if (!event.match?.teams.some((team) => team.code === teamCode)) return [];
    const game = toGame(event, teamCode);
    return game ? [game] : [];
  });
}

/** Home league plus every international tournament. */
export function fetchAllLoLGames(
  homeLeagueId: string,
  teamCode: string,
  signal?: AbortSignal,
): Promise<Game[]> {
  return fetchLoLGames([homeLeagueId, ...INTERNATIONAL_LEAGUE_IDS], teamCode, signal);
}
