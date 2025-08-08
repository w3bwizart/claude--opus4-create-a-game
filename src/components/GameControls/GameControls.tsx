import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/useTypedRedux';
import { 
  startGame, 
  pauseGame, 
  resumeGame, 
  resetGame, 
  setDifficulty 
} from '../../store/slices/gameSlice';
import './GameControls.css';

interface GameControlsProps {
  onShowLeaderboard: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({ onShowLeaderboard }) => {
  const dispatch = useAppDispatch();
  const { isPlaying, isGameOver, difficulty } = useAppSelector((state) => state.game);
  const [isPaused, setIsPaused] = useState(false);

  const handleStartGame = () => {
    dispatch(resetGame());
    dispatch(startGame());
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      dispatch(resumeGame());
      setIsPaused(false);
    } else {
      dispatch(pauseGame());
      setIsPaused(true);
    }
  };

  const handleDifficultyChange = (newDifficulty: 'easy' | 'medium' | 'hard') => {
    if (!isPlaying) {
      dispatch(setDifficulty(newDifficulty));
    }
  };

  return (
    <div className="game-controls">
      <div className="controls-section">
        <div className="difficulty-selector">
          <label htmlFor="difficulty">Difficulty:</label>
          <div className="difficulty-buttons">
            <button
              className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('easy')}
              disabled={isPlaying}
              aria-pressed={difficulty === 'easy'}
            >
              Easy
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('medium')}
              disabled={isPlaying}
              aria-pressed={difficulty === 'medium'}
            >
              Medium
            </button>
            <button
              className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
              onClick={() => handleDifficultyChange('hard')}
              disabled={isPlaying}
              aria-pressed={difficulty === 'hard'}
            >
              Hard
            </button>
          </div>
        </div>

        <div className="action-buttons">
          {!isPlaying || isGameOver ? (
            <button
              className="control-btn start-btn"
              onClick={handleStartGame}
              aria-label={isGameOver ? 'Play Again' : 'Start Game'}
            >
              {isGameOver ? '🔄 Play Again' : '▶️ Start Game'}
            </button>
          ) : (
            <button
              className="control-btn pause-btn"
              onClick={handlePauseResume}
              aria-label={isPaused ? 'Resume Game' : 'Pause Game'}
            >
              {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
          )}

          <button
            className="control-btn leaderboard-btn"
            onClick={onShowLeaderboard}
            aria-label="View Leaderboard"
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>

      <div className="game-instructions">
        <h3>How to Play:</h3>
        <ul>
          <li>Click on moles when they pop up to score points</li>
          <li>Easy: 5 points | Medium: 10 points | Hard: 15 points</li>
          <li>You have 2 minutes to get the highest score!</li>
          <li>Higher difficulty = faster moles & more active at once</li>
        </ul>
      </div>
    </div>
  );
};