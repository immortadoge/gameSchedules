import { createGame, type Game } from '../models/game';
import { parseISO8601 } from '../lib/iso8601';
import { isWithin } from '../lib/dates';
import { fetchJson } from '../lib/http';

/** Port of `NFLService.swift`. */
const TEAMS_PATH = '/api/espn/apis/site/v2/sports/football/nfl/teams';

/**
 * ESPN season types. The endpoint defaults to preseason when omitted, which is
 * why an unqualified request only ever returned a handful of August exhibition
 * games in the original app.
 */
const SEASON_TYPES = [1, 2, 3] as const;

interface ESPNCompetitor {
  homeAway: string;
  team: { id: string; displayName: string };
  score?: { displayValue: string } | null;
}

interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  broadcasts?: Array<{ media: { shortName: string } }>;
  status: { type: { completed: boolean } };
  venue?: { fullName: string };
}

interface ESPNEvent {
  id: string;
  date: string;
  competitions?: ESPNCompetition[];
}

interface ESPNScheduleResponse {
  // Some season-type responses omit `events` entirely rather than sending an
  // empty array; treat that as "no games".
  events?: ESPNEvent[];
}

function scoreValue(competitor: ESPNCompetitor | undefined): number | null {
  const raw = competitor?.score?.displayValue;
  if (raw === undefined) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function toGame(event: ESPNEvent): Game | null {
  const date = parseISO8601(event.date);
  const competition = event.competitions?.[0];
  if (!date || !competition) return null;

  const home = competition.competitors.find((entry) => entry.homeAway === 'home');
  const away = competition.competitors.find((entry) => entry.homeAway === 'away');
  const isCompleted = competition.status.type.completed;

  const broadcasts = (competition.broadcasts ?? []).map((entry) => entry.media.shortName);

  return createGame({
    homeTeam: home?.team.displayName ?? '',
    awayTeam: away?.team.displayName ?? '',
    gameDate: date,
    homeScore: isCompleted ? scoreValue(home) : null,
    awayScore: isCompleted ? scoreValue(away) : null,
    isCompleted,
    tvBroadcasts: broadcasts.filter((name, index) => broadcasts.indexOf(name) === index),
  });
}

export async function fetchNFLGames(
  teamId: number,
  startDate: Date,
  endDate: Date,
  signal?: AbortSignal,
): Promise<Game[]> {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  // NFL seasons span two calendar years, and each season is split across
  // season types, so every (year, seasonType) pair needs its own request.
  const requests: Array<Promise<ESPNScheduleResponse>> = [];
  for (let year = startYear; year <= endYear; year += 1) {
    for (const seasonType of SEASON_TYPES) {
      requests.push(
        fetchJson<ESPNScheduleResponse>(`${TEAMS_PATH}/${teamId}/schedule`, {
          signal,
          query: { season: year, seasontype: seasonType },
        }),
      );
    }
  }

  // A missing season type is expected (e.g. no postseason yet), so a failed
  // request contributes no games instead of failing the whole fetch.
  const results = await Promise.allSettled(requests);
  const events = results.flatMap((result) =>
    result.status === 'fulfilled' ? (result.value.events ?? []) : [],
  );

  const seenEventIds = new Set<string>();
  return events.flatMap((event) => {
    if (seenEventIds.has(event.id)) return [];
    seenEventIds.add(event.id);

    const game = toGame(event);
    if (!game || !isWithin(game.gameDate, startDate, endDate)) return [];
    return [game];
  });
}
