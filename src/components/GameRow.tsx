import { useState } from 'react';
import type { Game } from '../models/game';
import { formatDate, formatTime, toDateTimeAttribute } from '../lib/dates';
import { Broadcasts } from './Broadcasts';

/** Blocks the iOS row highlighted with a trophy. */
const PLAYOFF_BLOCKS = new Set(['Playoffs', 'Finals', 'Semifinals', 'Quarterfinals', 'Groups']);

function categoryBadge(category: string): { label: string; variant: string } {
  switch (category) {
    case 'Champions':
      return { label: '🏆 Champions', variant: 'champions' };
    case 'Masters':
      return { label: '🌍 Masters', variant: 'masters' };
    case 'Playoffs':
      return { label: '⚔️ Playoffs', variant: 'playoffs' };
    default:
      return { label: category, variant: 'muted' };
  }
}

/** Port of `GameRowView`. */
export function GameRow({ game }: { game: Game }) {
  const [showScore, setShowScore] = useState(false);

  const matchup = `${game.awayTeam} at ${game.homeTeam}`;
  const category = game.category ? categoryBadge(game.category) : null;
  const isPlayoffBlock = game.blockName ? PLAYOFF_BLOCKS.has(game.blockName) : false;

  return (
    <li className="row">
      <div className="row__meta">
        <time dateTime={toDateTimeAttribute(game.gameDate)}>{formatDate(game.gameDate)}</time>

        <span className="row__meta-spacer" />

        {game.leagueName ? <span className="badge badge--league">{game.leagueName}</span> : null}

        {game.blockName ? (
          <span className={`badge ${isPlayoffBlock ? 'badge--playoffs' : 'badge--muted'}`}>
            {isPlayoffBlock ? `🏆 ${game.blockName}` : game.blockName}
          </span>
        ) : null}

        {category ? <span className={`badge badge--${category.variant}`}>{category.label}</span> : null}

        <span className="row__time">{formatTime(game.gameDate)}</span>
      </div>

      <div className="row__body">
        <div className="matchup">
          <span className="matchup__team">{game.awayTeam}</span>
          <span className="matchup__at">@</span>
          <span className="matchup__team">{game.homeTeam}</span>
        </div>

        {game.isCompleted ? (
          showScore ? (
            <div className="score" aria-label={`Final score, ${matchup}`}>
              <span className="score__value">{game.awayScore ?? 0}</span>
              <span className="score__value">{game.homeScore ?? 0}</span>
            </div>
          ) : (
            <button type="button" className="button" onClick={() => setShowScore(true)}>
              Show Score
              <span className="visually-hidden"> for {matchup}</span>
            </button>
          )
        ) : (
          <span className="status status--scheduled">Scheduled</span>
        )}
      </div>

      <Broadcasts channels={game.tvBroadcasts} />
    </li>
  );
}
