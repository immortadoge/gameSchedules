import { useMemo } from 'react';
import { TEAMS_PARAM, TEAM_PARAM, resolveTeam, resolveTeams } from './lib/teamsParam';
import { useSearchParams } from './hooks/useSearchParams';
import { HomePage } from './components/HomePage';
import { TeamSchedulePage } from './components/TeamSchedulePage';

export default function App() {
  const { params, hrefFor, navigate } = useSearchParams();

  const teamsParam = params.get(TEAMS_PARAM);
  const { teams, unknownTokens } = useMemo(() => resolveTeams(teamsParam), [teamsParam]);

  const selectedTeam = resolveTeam(params.get(TEAM_PARAM));

  return (
    <main className="app">
      {selectedTeam ? (
        <TeamSchedulePage team={selectedTeam} hrefFor={hrefFor} navigate={navigate} />
      ) : (
        <HomePage
          teams={teams}
          unknownTokens={unknownTokens}
          hrefFor={hrefFor}
          navigate={navigate}
        />
      )}
    </main>
  );
}
