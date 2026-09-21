import { dedupeGames, type Game } from '../models/game';
import type { Team } from '../models/team';
import { addDays, isWithin, startOfDay } from '../lib/dates';
import { describeError, isAbortError } from '../lib/http';
import { fetchGamesForTeam } from './index';

/**
 * Port of `GameOverviewService.swift`. The iOS version read the enabled set from
 * `TeamSettings.shared`; here the caller passes the teams resolved from `?teams=`.
 */
export interface Overview {
  games: Game[];
  /** Per-team failures, so one dead feed doesn't blank the whole page. */
  failures: Array<{ team: Team; message: string }>;
}

/**
 * Fetches games in the window running from the start of the day before
 * `referenceDate` through the start of the day after, using local day boundaries.
 */
export async function fetchOverview(
  teams: readonly Team[],
  referenceDate: Date,
  signal?: AbortSignal,
): Promise<Overview> {
  const dayStart = startOfDay(referenceDate);
  const startDate = addDays(dayStart, -1);
  const endDate = addDays(dayStart, 1);

  const results = await Promise.allSettled(
    teams.map((team) => fetchGamesForTeam(team, startDate, endDate, signal)),
  );

  const games: Game[] = [];
  const failures: Overview['failures'] = [];

  results.forEach((result, index) => {
    const team = teams[index];
    if (!team) return;

    if (result.status === 'rejected') {
      if (!isAbortError(result.reason)) {
        failures.push({ team, message: describeError(result.reason) });
      }
      return;
    }

    // The esports feeds return full schedules, so the window is applied here.
    games.push(...result.value.filter((game) => isWithin(game.gameDate, startDate, endDate)));
  });

  return { games: dedupeGames(games), failures };
}

/** Splits the overview into the "Yesterday" and "Today" buckets the UI renders. */
export function splitByDay(
  games: readonly Game[],
  referenceDate: Date,
): { yesterday: Game[]; today: Game[] } {
  const todayStart = startOfDay(referenceDate);
  const yesterdayStart = addDays(todayStart, -1);
  const tomorrowStart = addDays(todayStart, 1);

  const inDay = (game: Game, start: Date, end: Date): boolean =>
    game.gameDate.getTime() >= start.getTime() && game.gameDate.getTime() < end.getTime();

  const byDate = (a: Game, b: Game): number => a.gameDate.getTime() - b.gameDate.getTime();

  return {
    yesterday: games.filter((game) => inDay(game, yesterdayStart, todayStart)).sort(byDate),
    today: games.filter((game) => inDay(game, todayStart, tomorrowStart)).sort(byDate),
  };
}
