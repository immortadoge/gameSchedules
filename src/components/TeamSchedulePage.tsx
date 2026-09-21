import { useCallback } from 'react';
import type { Team } from '../models/team';
import { byDateAscending, byDateDescending, type Game } from '../models/game';
import { addMonths } from '../lib/dates';
import { TEAM_PARAM } from '../lib/teamsParam';
import { fetchGamesForTeam } from '../services';
import { useAsyncData } from '../hooks/useAsyncData';
import type { ParamUpdate } from '../hooks/useSearchParams';
import { LoadingRow, PlaceholderRow, Section } from './Section';
import { GameRow } from './GameRow';
import { Link } from './Link';

interface TeamSchedulePageProps {
  team: Team;
  hrefFor: (update: ParamUpdate) => string;
  navigate: (update: ParamUpdate) => void;
}

interface Buckets {
  past: Game[];
  future: Game[];
}

function bucket(games: readonly Game[], now: Date): Buckets {
  return {
    past: games
      .filter((game) => game.gameDate.getTime() < now.getTime() && game.isCompleted)
      .sort(byDateDescending),
    future: games
      .filter((game) => game.gameDate.getTime() >= now.getTime() || !game.isCompleted)
      .sort(byDateAscending),
  };
}

/** Port of `TeamScheduleView`. */
export function TeamSchedulePage({ team, hrefFor, navigate }: TeamSchedulePageProps) {
  const loader = useCallback(
    async (signal: AbortSignal) => {
      const now = new Date();
      // Same ±2 month window the iOS view requested.
      const games = await fetchGamesForTeam(team, addMonths(now, -2), addMonths(now, 2), signal);
      return { games, now };
    },
    [team],
  );

  const { data, isLoading, error, reload } = useAsyncData(loader);

  const { past, future } = data ? bucket(data.games, data.now) : { past: [], future: [] };
  const recentGames = past.slice(0, 2);
  const nextGames = future.slice(0, 2);
  const showLoading = isLoading && data === null;
  const hasGlance = !showLoading && (nextGames.length > 0 || recentGames.length > 0);

  return (
    <>
      <header className="page-header">
        <div>
          <Link
            href={hrefFor({ [TEAM_PARAM]: null })}
            onNavigate={() => navigate({ [TEAM_PARAM]: null })}
            className="back-link"
          >
            <span aria-hidden="true">‹ </span>All teams
          </Link>
          <h1 className="page-header__title">
            <span aria-hidden="true">{team.icon} </span>
            {team.name}
          </h1>
          <p className="page-header__subtitle">{team.sport} · Schedule</p>
        </div>
        <button type="button" className="button" onClick={reload} disabled={isLoading}>
          {isLoading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {error ? (
        <p className="banner banner--error" role="alert">
          {error}
        </p>
      ) : null}

      {hasGlance ? (
        <Section title="At a Glance">
          {[...nextGames, ...recentGames].map((game) => (
            <GameRow key={`glance-${game.id}`} game={game} />
          ))}
        </Section>
      ) : null}

      <Section title="Upcoming Games" busy={showLoading}>
        {showLoading ? (
          <LoadingRow />
        ) : future.length === 0 ? (
          <PlaceholderRow>No upcoming games</PlaceholderRow>
        ) : (
          future.map((game) => <GameRow key={game.id} game={game} />)
        )}
      </Section>

      <Section title="Past Games" busy={showLoading}>
        {showLoading ? (
          <LoadingRow />
        ) : past.length === 0 ? (
          <PlaceholderRow>No past games</PlaceholderRow>
        ) : (
          past.map((game) => <GameRow key={game.id} game={game} />)
        )}
      </Section>
    </>
  );
}
