import { useState } from 'react';
import type { Game } from '../models/game';
import { formatTime } from '../lib/dates';
import { Broadcasts } from './Broadcasts';

interface OverviewRowProps {
  game: Game;
  /** Today's games show tip-off time; yesterday's don't, as in the iOS app. */
  showsTime: boolean;
}

/** Port of `TeamSelectionView.overviewRow(for:showsTime:)`. */
export function OverviewRow({ game, showsTime }: OverviewRowProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  const matchup = `${game.awayTeam} at ${game.homeTeam}`;
  const hasScore = game.isCompleted && game.homeScore !== null && game.awayScore !== null;

  return (
    <li className="row row--compact">
      <p className="overview__matchup">
        {game.awayTeam} @ {game.homeTeam}
      </p>

      <div className="overview__detail">
        {hasScore ? (
          isRevealed ? (
            <>
              <span className="overview__result">
                Final: {game.awayScore}–{game.homeScore}
              </span>
              <button type="button" className="button button--plain" onClick={() => setIsRevealed(false)}>
                Hide
                <span className="visually-hidden"> score for {matchup}</span>
              </button>
            </>
          ) : (
            <>
              <span className="overview__result">Final</span>
              <button type="button" className="button button--plain" onClick={() => setIsRevealed(true)}>
                Show Score
                <span className="visually-hidden"> for {matchup}</span>
              </button>
            </>
          )
        ) : showsTime ? (
          <span className="overview__result">{formatTime(game.gameDate)}</span>
        ) : null}
      </div>

      <Broadcasts channels={game.tvBroadcasts} />
    </li>
  );
}
