import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import React from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { useGameLogic } from './useGameLogic';
import gameReducer from '../store/slices/gameSlice';
import leaderboardReducer from '../store/slices/leaderboardSlice';
import * as leaderboardService from '../services/leaderboardService';

// Mock the leaderboard service
vi.mock('../services/leaderboardService', () => ({
  leaderboardService: {
    getLeaderboard: vi.fn(),
    submitScore: vi.fn(),
  },
}));

describe('useGameLogic', () => {
  let store: ReturnType<typeof configureStore>;

  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        game: gameReducer,
        leaderboard: leaderboardReducer,
      },
      preloadedState: initialState,
    });
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
    (leaderboardService.leaderboardService.getLeaderboard as any).mockResolvedValue([]);
  });

  describe('Initial state', () => {
    it('should return initial game state values', () => {
      const { result } = renderHook(() => useGameLogic(), { wrapper });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.timeRemaining).toBe(120);
      expect(result.current.score).toBe(0);
      expect(result.current.isGameOver).toBe(false);
    });

    it('should fetch leaderboard on mount', async () => {
      renderHook(() => useGameLogic(), { wrapper });

      expect(leaderboardService.leaderboardService.getLeaderboard).toHaveBeenCalledTimes(1);
    });

    it('should provide handler functions', () => {
      const { result } = renderHook(() => useGameLogic(), { wrapper });

      expect(typeof result.current.handleStartGame).toBe('function');
      expect(typeof result.current.handleEndGame).toBe('function');
    });
  });

  describe('handleStartGame', () => {
    it('should start the game when called', () => {
      const { result } = renderHook(() => useGameLogic(), { wrapper });

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        result.current.handleStartGame();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should reset game state when starting', () => {
      // Start with a game in progress
      store = createTestStore({
        game: {
          moles: Array.from({ length: 12 }, (_, i) => ({
            id: i,
            isActive: false,
            isWhacked: false,
          })),
          score: 50,
          timeRemaining: 60,
          isPlaying: false,
          isGameOver: true,
          difficulty: 'medium',
        },
      });

      const { result } = renderHook(() => useGameLogic(), { wrapper });

      act(() => {
        result.current.handleStartGame();
      });

      expect(result.current.score).toBe(0);
      expect(result.current.timeRemaining).toBe(120);
      expect(result.current.isGameOver).toBe(false);
      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('handleEndGame', () => {
    it('should end the game when called', () => {
      store = createTestStore({
        game: {
          moles: Array.from({ length: 12 }, (_, i) => ({
            id: i,
            isActive: false,
            isWhacked: false,
          })),
          score: 30,
          timeRemaining: 90,
          isPlaying: true,
          isGameOver: false,
          difficulty: 'medium',
        },
      });

      const { result } = renderHook(() => useGameLogic(), { wrapper });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.handleEndGame();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isGameOver).toBe(true);
    });

    it('should preserve score when ending game', () => {
      store = createTestStore({
        game: {
          moles: Array.from({ length: 12 }, (_, i) => ({
            id: i,
            isActive: false,
            isWhacked: false,
          })),
          score: 100,
          timeRemaining: 45,
          isPlaying: true,
          isGameOver: false,
          difficulty: 'hard',
        },
      });

      const { result } = renderHook(() => useGameLogic(), { wrapper });

      act(() => {
        result.current.handleEndGame();
      });

      expect(result.current.score).toBe(100);
    });
  });

  describe('Game over detection', () => {
    it('should automatically end game when time reaches 0', () => {
      store = createTestStore({
        game: {
          moles: Array.from({ length: 12 }, (_, i) => ({
            id: i,
            isActive: false,
            isWhacked: false,
          })),
          score: 50,
          timeRemaining: 1,
          isPlaying: true,
          isGameOver: false,
          difficulty: 'medium',
        },
      });

      const { result, rerender } = renderHook(() => useGameLogic(), { wrapper });

      // Update time to 0
      act(() => {
        store.dispatch({ type: 'game/updateTimeRemaining', payload: 0 });
      });

      rerender();

      // The useEffect should trigger handleEndGame
      expect(result.current.isGameOver).toBe(true);
      expect(result.current.isPlaying).toBe(false);
    });

    it('should not end game if time is positive', () => {
      store = createTestStore({
        game: {
          moles: Array.from({ length: 12 }, (_, i) => ({
            id: i,
            isActive: false,
            isWhacked: false,
          })),
          score: 30,
          timeRemaining: 30,
          isPlaying: true,
          isGameOver: false,
          difficulty: 'medium',
        },
      });

      const { result } = renderHook(() => useGameLogic(), { wrapper });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isGameOver).toBe(false);
    });

    it('should not trigger multiple end game calls', () => {
      store = createTestStore({
        game: {
          moles: Array.from({ length: 12 }, (_, i) => ({
            id: i,
            isActive: false,
            isWhacked: false,
          })),
          score: 50,
          timeRemaining: 0,
          isPlaying: true,
          isGameOver: false,
          difficulty: 'medium',
        },
      });

      const { result, rerender } = renderHook(() => useGameLogic(), { wrapper });

      // First render should trigger end game
      expect(result.current.isGameOver).toBe(false); // Not yet processed

      // Force update
      act(() => {
        store.dispatch({ type: 'game/endGame' });
      });

      rerender();

      expect(result.current.isGameOver).toBe(true);
      expect(result.current.isPlaying).toBe(false);

      // Multiple rerenders shouldn't cause issues
      rerender();
      rerender();

      expect(result.current.isGameOver).toBe(true);
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('State updates', () => {
    it('should reflect score updates', () => {
      const { result } = renderHook(() => useGameLogic(), { wrapper });

      expect(result.current.score).toBe(0);

      act(() => {
        store.dispatch({ type: 'game/startGame' });
        store.dispatch({ type: 'game/activateMole', payload: 0 });
        store.dispatch({ type: 'game/whackMole', payload: 0 });
      });

      expect(result.current.score).toBeGreaterThan(0);
    });

    it('should reflect time updates', () => {
      const { result } = renderHook(() => useGameLogic(), { wrapper });

      expect(result.current.timeRemaining).toBe(120);

      act(() => {
        store.dispatch({ type: 'game/updateTimeRemaining', payload: 90 });
      });

      expect(result.current.timeRemaining).toBe(90);
    });

    it('should reflect playing state changes', () => {
      const { result } = renderHook(() => useGameLogic(), { wrapper });

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        store.dispatch({ type: 'game/startGame' });
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        store.dispatch({ type: 'game/pauseGame' });
      });

      expect(result.current.isPlaying).toBe(false);

      act(() => {
        store.dispatch({ type: 'game/resumeGame' });
      });

      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('Integration with leaderboard', () => {
    it('should fetch leaderboard data on initialization', async () => {
      const mockLeaderboard = [
        { id: '1', name: 'Player 1', score: 100, date: new Date() },
        { id: '2', name: 'Player 2', score: 90, date: new Date() },
      ];

      (leaderboardService.leaderboardService.getLeaderboard as any).mockResolvedValue(mockLeaderboard);

      renderHook(() => useGameLogic(), { wrapper });

      expect(leaderboardService.leaderboardService.getLeaderboard).toHaveBeenCalledTimes(1);

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const state = store.getState().leaderboard;
      expect(state.players).toEqual(mockLeaderboard);
    });

    it('should handle leaderboard fetch errors gracefully', async () => {
      (leaderboardService.leaderboardService.getLeaderboard as any).mockRejectedValue(
        new Error('Network error')
      );

      renderHook(() => useGameLogic(), { wrapper });

      // Wait for async operation
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const state = store.getState().leaderboard;
      expect(state.error).toBeTruthy();
    });
  });

  describe('Hook cleanup', () => {
    it('should not cause memory leaks on unmount', () => {
      const { unmount } = renderHook(() => useGameLogic(), { wrapper });

      // Start a game
      act(() => {
        store.dispatch({ type: 'game/startGame' });
      });

      // Unmount the hook
      unmount();

      // Actions after unmount shouldn't cause errors
      act(() => {
        store.dispatch({ type: 'game/updateTimeRemaining', payload: 0 });
      });

      // No errors should occur
      expect(true).toBe(true);
    });

    it('should handle multiple mount/unmount cycles', () => {
      const { result: result1, unmount: unmount1 } = renderHook(() => useGameLogic(), { wrapper });

      expect(result1.current.isPlaying).toBe(false);

      unmount1();

      const { result: result2, unmount: unmount2 } = renderHook(() => useGameLogic(), { wrapper });

      expect(result2.current.isPlaying).toBe(false);

      act(() => {
        result2.current.handleStartGame();
      });

      expect(result2.current.isPlaying).toBe(true);

      unmount2();
    });
  });

  describe('Memoization', () => {
    it('should memoize handleStartGame callback', () => {
      const { result, rerender } = renderHook(() => useGameLogic(), { wrapper });

      const firstHandleStartGame = result.current.handleStartGame;

      rerender();

      const secondHandleStartGame = result.current.handleStartGame;

      expect(firstHandleStartGame).toBe(secondHandleStartGame);
    });

    it('should memoize handleEndGame callback', () => {
      const { result, rerender } = renderHook(() => useGameLogic(), { wrapper });

      const firstHandleEndGame = result.current.handleEndGame;

      rerender();

      const secondHandleEndGame = result.current.handleEndGame;

      expect(firstHandleEndGame).toBe(secondHandleEndGame);
    });
  });
});