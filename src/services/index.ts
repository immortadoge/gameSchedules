import type { Game } from '../models/game';
import type { Team } from '../models/team';
import { fetchNBAGames } from './nbaService';
import { fetchMLBGames } from './mlbService';
import { fetchNFLGames } from './nflService';
import { fetchAllLoLGames } from './lolEsportsService';
import { fetchValorantGames } from './valorantService';

/**
 * Single entry point per team, replacing the `switch team.sportType` block that
 * lived in `TeamScheduleView.fetchRealGames()`.
 *
 * As in the iOS app, the date range only narrows the traditional-sports feeds;
 * the esports feeds return their full schedule and callers filter if they need to.
 */
export async function fetchGamesForTeam(
  team: Team,
  startDate: Date,
  endDate: Date,
  signal?: AbortSignal,
): Promise<Game[]> {
  switch (team.sportType) {
    case 'basketball':
      return fetchNBAGames(team.apiTeamId, startDate, endDate, signal);
    case 'baseball':
      return fetchMLBGames(team.apiTeamId, startDate, endDate, signal);
    case 'football':
      return fetchNFLGames(team.apiTeamId, startDate, endDate, signal);
    case 'esports': {
      if (!team.leagueId || !team.teamCode) {
        throw new Error(`${team.name} is missing its LoL Esports league or team code`);
      }
      return fetchAllLoLGames(team.leagueId, team.teamCode, signal);
    }
    case 'valorant': {
      if (!team.valorantTeamId) {
        throw new Error(`${team.name} is missing its vlr.gg team id`);
      }
      return fetchValorantGames(team.valorantTeamId, team.name, signal);
    }
  }
}

export { fetchNBAGames, fetchMLBGames, fetchNFLGames, fetchAllLoLGames, fetchValorantGames };
