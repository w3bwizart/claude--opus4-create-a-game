import React from 'react';
import { useAppSelector } from '../../hooks/useTypedRedux';
import './ScoreDisplay.css';

export const ScoreDisplay: React.FC = () => {
  const score = useAppSelector((state) => state.game.score);
  const difficulty = useAppSelector((state) => state.game.difficulty);

  return (
    <div className="score-display" role="status" aria-live="polite">
      <div className="score-container">
        <h2 className="score-label">Score</h2>
        <div className="score-value" data-testid="score-value">
          {score}
        </div>
        <div className="difficulty-badge">
          {difficulty.toUpperCase()}
        </div>
      </div>
    </div>
  );
};