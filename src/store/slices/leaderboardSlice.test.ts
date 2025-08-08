import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import leaderboardReducer, {
  fetchLeaderboard,
  submitScore,
  clearError,
} from './leaderboardSlice';
import type { LeaderboardState, Player } from '../../types/game.types';
import * as leaderboardService from '../../services/leaderboardService';

// Mock the leaderboard service
vi.mock('../../services/leaderboardService', () => ({
  leaderboardService: {
    getLeaderboard: vi.fn(),
    submitScore: vi.fn(),
  },
}));

describe('leaderboardSlice', () => {
  const getInitialState = (): LeaderboardState => ({
    players: [],
    isLoading: false,
    error: null,
  });

  const mockPlayers: Player[] = [
    { id: '1', name: 'Player 1', score: 100, date: new Date('2024-01-01') },
    { id: '2', name: 'Player 2', score: 90, date: new Date('2024-01-02') },
    { id: '3', name: 'Player 3', score: 80, date: new Date('2024-01-03') },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Synchronous actions', () => {
    it('should clear error', () => {
      const initialState: LeaderboardState = {
        ...getInitialState(),
        error: 'Some error message',
      };
      
      const nextState = leaderboardReducer(initialState, clearError());
      
      expect(nextState.error).toBe(null);
    });

    it('should not affect other state when clearing error', () => {
      const initialState: LeaderboardState = {
        players: mockPlayers,
        isLoading: true,
        error: 'Error message',
      };
      
      const nextState = leaderboardReducer(initialState, clearError());
      
      expect(nextState.players).toEqual(mockPlayers);
      expect(nextState.isLoading).toBe(true);
      expect(nextState.error).toBe(null);
    });
  });

  describe('fetchLeaderboard async thunk', () => {
    it('should handle fetchLeaderboard.pending', () => {
      const initialState = getInitialState();
      
      const action = { type: fetchLeaderboard.pending.type };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.isLoading).toBe(true);
      expect(nextState.error).toBe(null);
    });

    it('should handle fetchLeaderboard.fulfilled', () => {
      const initialState = {
        ...getInitialState(),
        isLoading: true,
      };
      
      const action = {
        type: fetchLeaderboard.fulfilled.type,
        payload: mockPlayers,
      };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.isLoading).toBe(false);
      expect(nextState.players).toEqual(mockPlayers);
      expect(nextState.error).toBe(null);
    });

    it('should handle fetchLeaderboard.rejected', () => {
      const initialState = {
        ...getInitialState(),
        isLoading: true,
      };
      
      const action = {
        type: fetchLeaderboard.rejected.type,
        error: { message: 'Network error' },
      };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.isLoading).toBe(false);
      expect(nextState.error).toBe('Network error');
    });

    it('should handle fetchLeaderboard.rejected with no error message', () => {
      const initialState = {
        ...getInitialState(),
        isLoading: true,
      };
      
      const action = {
        type: fetchLeaderboard.rejected.type,
        error: {},
      };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.isLoading).toBe(false);
      expect(nextState.error).toBe('Failed to fetch leaderboard');
    });

    it('should fetch leaderboard data successfully', async () => {
      (leaderboardService.leaderboardService.getLeaderboard as any).mockResolvedValue(mockPlayers);
      
      const store = configureStore({
        reducer: { leaderboard: leaderboardReducer },
      });
      
      await store.dispatch(fetchLeaderboard());
      
      const state = store.getState().leaderboard;
      expect(state.players).toEqual(mockPlayers);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle fetch error', async () => {
      (leaderboardService.leaderboardService.getLeaderboard as any).mockRejectedValue(
        new Error('API Error')
      );
      
      const store = configureStore({
        reducer: { leaderboard: leaderboardReducer },
      });
      
      await store.dispatch(fetchLeaderboard());
      
      const state = store.getState().leaderboard;
      expect(state.players).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('API Error');
    });
  });

  describe('submitScore async thunk', () => {
    const newPlayer: Player = {
      id: '4',
      name: 'New Player',
      score: 150,
      date: new Date('2024-01-04'),
    };

    it('should handle submitScore.pending', () => {
      const initialState = getInitialState();
      
      const action = { type: submitScore.pending.type };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.isLoading).toBe(true);
      expect(nextState.error).toBe(null);
    });

    it('should handle submitScore.fulfilled', () => {
      const initialState = {
        ...getInitialState(),
        players: mockPlayers,
        isLoading: true,
      };
      
      const action = {
        type: submitScore.fulfilled.type,
        payload: newPlayer,
      };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.isLoading).toBe(false);
      expect(nextState.error).toBe(null);
      
      // Should add new player and sort by score
      expect(nextState.players[0]).toEqual(newPlayer); // Highest score first
      expect(nextState.players.length).toBeLessThanOrEqual(10); // Max 10 players
    });

    it('should maintain top 10 players after submission', () => {
      const manyPlayers = Array.from({ length: 10 }, (_, i) => ({
        id: `player-${i}`,
        name: `Player ${i}`,
        score: (10 - i) * 10,
        date: new Date(),
      }));
      
      const initialState = {
        ...getInitialState(),
        players: manyPlayers,
        isLoading: true,
      };
      
      const newHighScore = {
        id: 'new',
        name: 'High Scorer',
        score: 200,
        date: new Date(),
      };
      
      const action = {
        type: submitScore.fulfilled.type,
        payload: newHighScore,
      };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.players.length).toBe(10);
      expect(nextState.players[0]).toEqual(newHighScore);
      expect(nextState.players[9].score).toBe(20); // Lowest score should be dropped
    });

    it('should handle submitScore.rejected', () => {
      const initialState = {
        ...getInitialState(),
        isLoading: true,
      };
      
      const action = {
        type: submitScore.rejected.type,
        error: { message: 'Submission failed' },
      };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.isLoading).toBe(false);
      expect(nextState.error).toBe('Submission failed');
    });

    it('should handle submitScore.rejected with no error message', () => {
      const initialState = {
        ...getInitialState(),
        isLoading: true,
      };
      
      const action = {
        type: submitScore.rejected.type,
        error: {},
      };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.isLoading).toBe(false);
      expect(nextState.error).toBe('Failed to submit score');
    });

    it('should submit score successfully', async () => {
      (leaderboardService.leaderboardService.submitScore as any).mockResolvedValue(newPlayer);
      
      const store = configureStore({
        reducer: { leaderboard: leaderboardReducer },
        preloadedState: {
          leaderboard: {
            players: mockPlayers,
            isLoading: false,
            error: null,
          },
        },
      });
      
      const playerData = { name: 'New Player', score: 150 };
      await store.dispatch(submitScore(playerData));
      
      const state = store.getState().leaderboard;
      expect(state.players[0]).toEqual(newPlayer);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle submission error', async () => {
      (leaderboardService.leaderboardService.submitScore as any).mockRejectedValue(
        new Error('Submission Error')
      );
      
      const store = configureStore({
        reducer: { leaderboard: leaderboardReducer },
      });
      
      const playerData = { name: 'Test', score: 100 };
      await store.dispatch(submitScore(playerData));
      
      const state = store.getState().leaderboard;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Submission Error');
    });

    it('should sort players correctly after submission', () => {
      const initialState = {
        ...getInitialState(),
        players: [
          { id: '1', name: 'Low', score: 50, date: new Date() },
          { id: '2', name: 'High', score: 100, date: new Date() },
        ],
      };
      
      const midScorePlayer = {
        id: '3',
        name: 'Mid',
        score: 75,
        date: new Date(),
      };
      
      const action = {
        type: submitScore.fulfilled.type,
        payload: midScorePlayer,
      };
      const nextState = leaderboardReducer(initialState, action);
      
      expect(nextState.players[0].score).toBe(100);
      expect(nextState.players[1].score).toBe(75);
      expect(nextState.players[2].score).toBe(50);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple operations in sequence', async () => {
      const store = configureStore({
        reducer: { leaderboard: leaderboardReducer },
      });
      
      // Initial fetch
      (leaderboardService.leaderboardService.getLeaderboard as any).mockResolvedValue(mockPlayers);
      await store.dispatch(fetchLeaderboard());
      
      let state = store.getState().leaderboard;
      expect(state.players).toEqual(mockPlayers);
      
      // Submit a new score
      const newPlayer = { id: '4', name: 'New', score: 95, date: new Date() };
      (leaderboardService.leaderboardService.submitScore as any).mockResolvedValue(newPlayer);
      await store.dispatch(submitScore({ name: 'New', score: 95 }));
      
      state = store.getState().leaderboard;
      expect(state.players.length).toBe(4);
      
      // Clear any errors
      store.dispatch(clearError());
      state = store.getState().leaderboard;
      expect(state.error).toBe(null);
    });

    it('should recover from error state', async () => {
      const store = configureStore({
        reducer: { leaderboard: leaderboardReducer },
      });
      
      // First attempt fails
      (leaderboardService.leaderboardService.getLeaderboard as any).mockRejectedValue(
        new Error('Network error')
      );
      await store.dispatch(fetchLeaderboard());
      
      let state = store.getState().leaderboard;
      expect(state.error).toBe('Network error');
      
      // Clear error
      store.dispatch(clearError());
      
      // Second attempt succeeds
      (leaderboardService.leaderboardService.getLeaderboard as any).mockResolvedValue(mockPlayers);
      await store.dispatch(fetchLeaderboard());
      
      state = store.getState().leaderboard;
      expect(state.error).toBe(null);
      expect(state.players).toEqual(mockPlayers);
    });

    it('should handle concurrent operations correctly', async () => {
      const store = configureStore({
        reducer: { leaderboard: leaderboardReducer },
      });
      
      // Start multiple operations
      (leaderboardService.leaderboardService.getLeaderboard as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPlayers), 100))
      );
      
      const newPlayer = { id: '4', name: 'New', score: 95, date: new Date() };
      (leaderboardService.leaderboardService.submitScore as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(newPlayer), 50))
      );
      
      // Dispatch both operations
      const fetchPromise = store.dispatch(fetchLeaderboard());
      const submitPromise = store.dispatch(submitScore({ name: 'New', score: 95 }));
      
      // Wait for both
      await Promise.all([fetchPromise, submitPromise]);
      
      const state = store.getState().leaderboard;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });
  });
});