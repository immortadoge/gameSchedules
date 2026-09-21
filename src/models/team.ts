export type SportType = 'basketball' | 'baseball' | 'football' | 'esports' | 'valorant';

export interface Team {
  /**
   * Stable, URL-friendly key. This is what `?teams=` accepts, and it replaces
   * the iOS app's persisted `enabledTeamNames` set (the SwiftUI version stored
   * selection in UserDefaults because its `id` was a fresh UUID per launch).
   */
  slug: string;
  name: string;
  sport: string;
  sportType: SportType;
  /** Stand-in for the SF Symbol the iOS app rendered. */
  icon: string;
  /** NBA / MLB / ESPN numeric team id. Unused for esports. */
  apiTeamId: number;
  /** LoL Esports home league id. */
  leagueId?: string;
  /** LoL Esports team code, e.g. "T1". */
  teamCode?: string;
  /** vlr.gg team id, used to build the VALORANT scrape URL. */
  valorantTeamId?: string;
}

export const AVAILABLE_TEAMS: readonly Team[] = [
  {
    slug: 'warriors',
    name: 'Golden State Warriors',
    sport: 'Basketball',
    sportType: 'basketball',
    icon: '🏀',
    apiTeamId: 1610612744,
  },
  {
    slug: 'giants',
    name: 'San Francisco Giants',
    sport: 'Baseball',
    sportType: 'baseball',
    icon: '⚾️',
    apiTeamId: 137,
  },
  {
    slug: '49ers',
    name: 'San Francisco 49ers',
    sport: 'Football',
    sportType: 'football',
    icon: '🏈',
    apiTeamId: 25,
  },
  {
    slug: 't1',
    name: 'T1',
    sport: 'League of Legends',
    sportType: 'esports',
    icon: '🎮',
    apiTeamId: 0,
    leagueId: '98767991310872058',
    teamCode: 'T1',
  },
  {
    slug: 'g2',
    name: 'G2 Esports',
    sport: 'League of Legends',
    sportType: 'esports',
    icon: '🎮',
    apiTeamId: 0,
    leagueId: '98767991302996019',
    teamCode: 'G2',
  },
  {
    slug: 'sentinels',
    name: 'Sentinels',
    sport: 'VALORANT',
    sportType: 'valorant',
    icon: '🎯',
    apiTeamId: 0,
    valorantTeamId: '2',
  },
];

export function findTeamBySlug(slug: string): Team | undefined {
  return AVAILABLE_TEAMS.find((team) => team.slug === slug);
}
