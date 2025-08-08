import React, { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/useTypedRedux';
import { fetchLeaderboard, submitScore } from '../../store/slices/leaderboardSlice';
import './Leaderboard.css';

interface LeaderboardProps {
  onClose?: () => void;
  showSubmitForm?: boolean;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ 
  onClose, 
  showSubmitForm = false 
}) => {
  const dispatch = useAppDispatch();
  const { players, isLoading, error } = useAppSelector((state) => state.leaderboard);
  const gameScore = useAppSelector((state) => state.game.score);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || submitted) return;

    setIsSubmitting(true);
    try {
      await dispatch(submitScore({ name: playerName, score: gameScore })).unwrap();
      setSubmitted(true);
      setPlayerName('');
      dispatch(fetchLeaderboard());
    } catch (error) {
      // Error is handled by the slice and displayed in UI
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  if (isLoading && players.length === 0) {
    return (
      <div className="leaderboard">
        <div className="leaderboard-loading">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h2>🏆 Leaderboard</h2>
        {onClose && (
          <button 
            className="leaderboard-close" 
            onClick={onClose}
            aria-label="Close leaderboard"
          >
            ✕
          </button>
        )}
      </div>

      {showSubmitForm && !submitted && (
        <form className="submit-score-form" onSubmit={handleSubmitScore}>
          <h3>Your Score: {gameScore}</h3>
          <div className="form-group">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              required
              disabled={isSubmitting}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={isSubmitting || !playerName.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Score'}
            </button>
          </div>
        </form>
      )}

      {submitted && (
        <div className="submit-success">
          ✅ Score submitted successfully!
        </div>
      )}

      {error && (
        <div className="leaderboard-error" role="alert">
          Error: {error}
        </div>
      )}

      <div className="leaderboard-list">
        {players.length === 0 ? (
          <div className="leaderboard-empty">No scores yet. Be the first!</div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {players.slice(0, 10).map((player, index) => (
                <tr 
                  key={player.id || index}
                  className={`leaderboard-row ${index < 3 ? `rank-${index + 1}` : ''}`}
                >
                  <td className="rank-cell">
                    <span className="rank-number">{index + 1}</span>
                    <span className="rank-emoji">{getRankEmoji(index + 1)}</span>
                  </td>
                  <td className="player-name">{player.name}</td>
                  <td className="player-score">{player.score}</td>
                  <td className="player-date">{formatDate(player.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};