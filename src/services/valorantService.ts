import { createGame, type Game } from '../models/game';
import { fetchText } from '../lib/http';

/**
 * Port of `ValorantService.swift`. vlr.gg has no API, so the team match pages
 * are scraped. The Swift version ran `NSRegularExpression` over the raw HTML;
 * in the browser `DOMParser` does the same job against the parsed document,
 * which also handles entity decoding for free.
 */
const BASE_PATH = '/api/vlr/team/matches';

/** Channels every VCT broadcast goes out on. */
const BROADCASTS = ['Twitch (valorant)', 'YouTube'];

const DATE_PATTERN = /(\d{4})\/(\d{2})\/(\d{2})/;
const TIME_PATTERN = /(\d{1,2}):(\d{2})\s*([ap])\.?m\.?/i;

type MatchGroup = 'completed' | 'upcoming';

function urlSlug(teamName: string): string {
  return teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** "2026/04/10" + "2:00 pm" -> a Date in the viewer's timezone. */
function parseMatchDate(blockText: string): Date | null {
  const dateMatch = DATE_PATTERN.exec(blockText);
  const timeMatch = TIME_PATTERN.exec(blockText);
  if (!dateMatch || !timeMatch) return null;

  const [, year, month, day] = dateMatch;
  const [, rawHour, minute, meridiem] = timeMatch;

  let hour = Number(rawHour) % 12;
  if (meridiem?.toLowerCase() === 'p') hour += 12;

  return new Date(Number(year), Number(month) - 1, Number(day), hour, Number(minute));
}

function categoryFromTournament(tournament: string): string {
  const lower = tournament.toLowerCase();
  if (lower.includes('champions')) return 'Champions';
  if (lower.includes('masters')) return 'Masters';
  if (lower.includes('playoff') || lower.includes('final')) return 'Playoffs';
  return 'Regular Season';
}

function text(element: Element | null | undefined): string {
  return element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function parseMatches(html: string, isCompleted: boolean): Game[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const items = document.querySelectorAll('a.m-item');

  const games: Game[] = [];

  for (const item of items) {
    const gameDate = parseMatchDate(text(item));
    if (!gameDate) continue;

    const teamNames = [...item.querySelectorAll('.m-item-team-name')].map(text).filter(Boolean);
    const [homeTeam, awayTeam] = teamNames;
    if (!homeTeam || !awayTeam) continue;

    const leagueName =
      text(item.querySelector('.m-item-event .text-of')) ||
      text(item.querySelector('.text-of')) ||
      'VCT Americas';

    // Scores only exist on completed matches.
    let homeScore: number | null = null;
    let awayScore: number | null = null;
    if (isCompleted) {
      const scores = [...item.querySelectorAll('.m-item-result span')]
        .map((span) => Number.parseInt(text(span), 10))
        .filter((value) => !Number.isNaN(value));
      if (scores.length >= 2) {
        homeScore = scores[0] ?? null;
        awayScore = scores[1] ?? null;
      }
    }

    games.push(
      createGame({
        homeTeam,
        awayTeam,
        gameDate,
        homeScore,
        awayScore,
        isCompleted,
        leagueName,
        category: categoryFromTournament(leagueName),
        tvBroadcasts: BROADCASTS,
      }),
    );
  }

  return games;
}

async function fetchMatchGroup(
  teamId: string,
  teamName: string,
  group: MatchGroup,
  signal?: AbortSignal,
): Promise<Game[]> {
  const html = await fetchText(`${BASE_PATH}/${teamId}/${urlSlug(teamName)}/`, {
    signal,
    query: { group },
  });
  return parseMatches(html, group === 'completed');
}

export async function fetchValorantGames(
  teamId: string,
  teamName: string,
  signal?: AbortSignal,
): Promise<Game[]> {
  const [completed, upcoming] = await Promise.all([
    fetchMatchGroup(teamId, teamName, 'completed', signal),
    fetchMatchGroup(teamId, teamName, 'upcoming', signal),
  ]);
  return [...completed, ...upcoming];
}
