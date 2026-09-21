/**
 * Port of the SwiftData `@Model Game` plus `GameSummary`. The iOS app persisted
 * games in a local store; the web app keeps them in component state and refetches,
 * so this is a plain value type with a deterministic `id` for React keys and for
 * remembering which scores the user revealed.
 */
export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  gameDate: Date;
  isCompleted: boolean;
  tvBroadcasts: string[];
  leagueName?: string;
  blockName?: string;
  category?: string;
}

export interface GameInit extends Omit<Game, 'id' | 'tvBroadcasts'> {
  tvBroadcasts?: string[];
}

export function createGame(init: GameInit): Game {
  const { tvBroadcasts = [], ...rest } = init;
  return {
    ...rest,
    tvBroadcasts,
    id: gameKey(rest.homeTeam, rest.awayTeam, rest.gameDate),
  };
}

/** Matches the iOS `gameKey(for:)` helper: identity is matchup + kickoff. */
export function gameKey(homeTeam: string, awayTeam: string, gameDate: Date): string {
  return `${homeTeam}|${awayTeam}|${Math.floor(gameDate.getTime() / 1000)}`;
}

/** Drops duplicates that arrive from overlapping feeds, keeping feed order. */
export function dedupeGames(games: Game[]): Game[] {
  const seen = new Set<string>();
  return games.filter((game) => {
    if (seen.has(game.id)) return false;
    seen.add(game.id);
    return true;
  });
}

export function byDateAscending(a: Game, b: Game): number {
  return a.gameDate.getTime() - b.gameDate.getTime();
}

export function byDateDescending(a: Game, b: Game): number {
  return b.gameDate.getTime() - a.gameDate.getTime();
}
