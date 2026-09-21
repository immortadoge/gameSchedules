import { AVAILABLE_TEAMS, type Team } from '../models/team';

/**
 * Replaces the iOS Settings screen + `TeamSettings`/UserDefaults persistence.
 * Which teams are shown now comes entirely from the URL:
 *
 *   ?teams=warriors,t1        -> just those two
 *   ?teams=all   (or absent)  -> every team
 *   ?teams=sports             -> the traditional-sports teams
 *
 * Tokens are matched against the team slug or its full name, ignoring case,
 * spaces and punctuation, so `?teams=Golden%20State%20Warriors` also works.
 * Group keywords combine with individual teams, e.g. `?teams=sports,t1`.
 */
export const TEAMS_PARAM = 'teams';
export const TEAM_PARAM = 'team';

const ALL = 'all';

/** Keywords that expand to several teams. */
const GROUPS: Record<string, readonly string[]> = {
  sports: ['warriors', 'giants', '49ers'],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const lookup: Map<string, Team> = new Map();
for (const team of AVAILABLE_TEAMS) {
  lookup.set(normalize(team.slug), team);
  lookup.set(normalize(team.name), team);
}

/** Tokens the `?teams=` parameter accepts, for help text and warnings. */
export const TEAMS_PARAM_TOKENS: readonly string[] = [
  ALL,
  ...Object.keys(GROUPS),
  ...AVAILABLE_TEAMS.map((team) => team.slug),
];

export interface ResolvedTeams {
  teams: Team[];
  /** Tokens in the query string that matched nothing, surfaced in the UI. */
  unknownTokens: string[];
}

export function resolveTeams(param: string | null): ResolvedTeams {
  if (param === null) return { teams: [...AVAILABLE_TEAMS], unknownTokens: [] };

  const tokens = param
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (tokens.length === 0) return { teams: [], unknownTokens: [] };
  if (tokens.some((token) => normalize(token) === ALL)) {
    return { teams: [...AVAILABLE_TEAMS], unknownTokens: [] };
  }

  const selected = new Set<Team>();
  const unknownTokens: string[] = [];

  for (const token of tokens) {
    const key = normalize(token);

    const group = GROUPS[key];
    if (group) {
      for (const slug of group) {
        const team = lookup.get(normalize(slug));
        if (team) selected.add(team);
      }
      continue;
    }

    const team = lookup.get(key);
    if (team) selected.add(team);
    else unknownTokens.push(token);
  }

  // Keep catalog order rather than the order the caller happened to type.
  return {
    teams: AVAILABLE_TEAMS.filter((team) => selected.has(team)),
    unknownTokens,
  };
}

/** Resolves the `?team=` detail-page token. */
export function resolveTeam(param: string | null): Team | undefined {
  if (!param) return undefined;
  return lookup.get(normalize(param));
}
