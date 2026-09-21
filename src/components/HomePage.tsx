import { useCallback, useMemo } from 'react';
import type { Team } from '../models/team';
import { TEAMS_PARAM, TEAMS_PARAM_TOKENS, TEAM_PARAM } from '../lib/teamsParam';
import { formatDayHeader } from '../lib/dates';
import { fetchOverview, splitByDay } from '../services/gameOverviewService';
import { useAsyncData } from '../hooks/useAsyncData';
import type { ParamUpdate } from '../hooks/useSearchParams';
import { LoadingRow, PlaceholderRow, Section } from './Section';
import { OverviewRow } from './OverviewRow';
import { Link } from './Link';

interface HomePageProps {
  teams: Team[];
  unknownTokens: string[];
  hrefFor: (update: ParamUpdate) => string;
  navigate: (update: ParamUpdate) => void;
}

/** Port of `TeamSelectionView`, minus the settings and notification rows. */
export function HomePage({ teams, unknownTokens, hrefFor, navigate }: HomePageProps) {
  const loader = useCallback(
    async (signal: AbortSignal) => {
      const referenceDate = new Date();
      const overview = await fetchOverview(teams, referenceDate, signal);
      return { ...overview, referenceDate };
    },
    [teams],
  );

  const { data, isLoading, error, reload } = useAsyncData(loader);
  const headerDate = useMemo(() => formatDayHeader(new Date()), []);

  const { yesterday, today } = data
    ? splitByDay(data.games, data.referenceDate)
    : { yesterday: [], today: [] };

  const showLoading = isLoading && data === null;

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Game Schedules</h1>
          <p className="page-header__subtitle">{headerDate}</p>
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

      {unknownTokens.length > 0 ? (
        <p className="banner banner--warning" role="status">
          Unrecognized in <code>?{TEAMS_PARAM}=</code>: {unknownTokens.join(', ')}. Accepted values:{' '}
          {TEAMS_PARAM_TOKENS.join(', ')}.
        </p>
      ) : null}

      {data && data.failures.length > 0 ? (
        <p className="banner banner--warning" role="status">
          Couldn&apos;t load{' '}
          {data.failures.map((failure) => `${failure.team.name} (${failure.message})`).join(', ')}.
        </p>
      ) : null}

      <Section title="Yesterday" busy={showLoading}>
        {showLoading ? (
          <LoadingRow />
        ) : yesterday.length === 0 ? (
          <PlaceholderRow>No games</PlaceholderRow>
        ) : (
          yesterday.map((game) => <OverviewRow key={game.id} game={game} showsTime={false} />)
        )}
      </Section>

      <Section title="Today" busy={showLoading}>
        {showLoading ? (
          <LoadingRow />
        ) : today.length === 0 ? (
          <PlaceholderRow>No games</PlaceholderRow>
        ) : (
          today.map((game) => <OverviewRow key={game.id} game={game} showsTime />)
        )}
      </Section>

      <Section title="Teams">
        {teams.length === 0 ? (
          <PlaceholderRow>
            No teams selected. Add <code>?{TEAMS_PARAM}=all</code> to the URL, or pick from{' '}
            {TEAMS_PARAM_TOKENS.join(', ')}.
          </PlaceholderRow>
        ) : (
          teams.map((team) => (
            <li key={team.slug} className="row row--link">
              <Link
                href={hrefFor({ [TEAM_PARAM]: team.slug })}
                onNavigate={() => navigate({ [TEAM_PARAM]: team.slug })}
                className="team-link"
              >
                <span className="team-link__icon" aria-hidden="true">
                  {team.icon}
                </span>
                <span className="team-link__text">
                  <span className="team-link__name">{team.name}</span>
                  <span className="team-link__sport">{team.sport}</span>
                </span>
                <span className="team-link__chevron" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))
        )}
      </Section>

      <footer className="footnote">
        <p>
          Teams come from the URL. <code>?{TEAMS_PARAM}=warriors,t1</code> shows those two,{' '}
          <code>?{TEAMS_PARAM}=sports</code> shows the Warriors, Giants and 49ers, and{' '}
          <code>?{TEAMS_PARAM}=all</code> shows everything.
        </p>
      </footer>
    </>
  );
}
