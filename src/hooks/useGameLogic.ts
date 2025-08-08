import { useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from './useTypedRedux';
import { 
  startGame, 
  endGame, 
  updateTimeRemaining 
} from '../store/slices/gameSlice';
import { fetchLeaderboard } from '../store/slices/leaderboardSlice';

export const useGameLogic = () => {
  const dispatch = useAppDispatch();
  const { isPlaying, timeRemaining, score, isGameOver } = useAppSelector(
    (state) => state.game
  );

  // Initialize leaderboard on mount
  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  // Handle game start
  const handleStartGame = useCallback(() => {
    dispatch(startGame());
  }, [dispatch]);

  // Handle game end
  const handleEndGame = useCallback(() => {
    dispatch(endGame());
  }, [dispatch]);

  // Check for game over condition
  useEffect(() => {
    if (timeRemaining === 0 && isPlaying) {
      handleEndGame();
    }
  }, [timeRemaining, isPlaying, handleEndGame]);

  return {
    isPlaying,
    timeRemaining,
    score,
    isGameOver,
    handleStartGame,
    handleEndGame,
  };
};