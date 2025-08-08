import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { leaderboardService } from './leaderboardService';
import type { Player } from '../types/game.types';

// Mock axios
vi.mock('axios');

describe('LeaderboardService', () => {
  const mockAPIUrl = 'http://localhost:3001/api';
  const originalEnv = import.meta.env.VITE_API_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalEnv !== undefined) {
      import.meta.env.VITE_API_URL = originalEnv;
    }
  });

  describe('getLeaderboard', () => {
    const mockPlayers: Player[] = [
      { id: '1', name: 'Player 1', score: 100, date: new Date('2024-01-01') },
      { id: '2', name: 'Player 2', score: 90, date: new Date('2024-01-02') },
      { id: '3', name: 'Player 3', score: 80, date: new Date('2024-01-03') },
    ];

    it('should fetch leaderboard successfully', async () => {
      (axios.get as any).mockResolvedValue({ data: mockPlayers });

      const result = await leaderboardService.getLeaderboard();

      expect(axios.get).toHaveBeenCalledWith(`${mockAPIUrl}/leaderboard`);
      expect(result).toEqual(mockPlayers);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should use environment variable for API URL if available', async () => {
      const customApiUrl = 'https://api.example.com';
      import.meta.env.VITE_API_URL = customApiUrl;

      (axios.get as any).mockResolvedValue({ data: mockPlayers });

      await leaderboardService.getLeaderboard();

      expect(axios.get).toHaveBeenCalledWith(`${customApiUrl}/leaderboard`);
    });

    it('should handle empty leaderboard response', async () => {
      (axios.get as any).mockResolvedValue({ data: [] });

      const result = await leaderboardService.getLeaderboard();

      expect(result).toEqual([]);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      (axios.get as any).mockRejectedValue(networkError);

      await expect(leaderboardService.getLeaderboard()).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith('Error fetching leaderboard:', networkError);
    });

    it('should handle API errors with status codes', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      (axios.get as any).mockRejectedValue(apiError);

      await expect(leaderboardService.getLeaderboard()).rejects.toMatchObject(apiError);
      expect(console.error).toHaveBeenCalledWith('Error fetching leaderboard:', apiError);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      (axios.get as any).mockRejectedValue(timeoutError);

      await expect(leaderboardService.getLeaderboard()).rejects.toThrow('Request timeout');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle malformed response data', async () => {
      (axios.get as any).mockResolvedValue({ data: 'invalid data' });

      const result = await leaderboardService.getLeaderboard();

      expect(result).toBe('invalid data');
    });

    it('should handle null response', async () => {
      (axios.get as any).mockResolvedValue({ data: null });

      const result = await leaderboardService.getLeaderboard();

      expect(result).toBe(null);
    });
  });

  describe('submitScore', () => {
    const newPlayer: Omit<Player, 'id' | 'date'> = {
      name: 'New Player',
      score: 150,
    };

    const submittedPlayer: Player = {
      id: '4',
      name: 'New Player',
      score: 150,
      date: new Date('2024-01-04'),
    };

    it('should submit score successfully', async () => {
      (axios.post as any).mockResolvedValue({ data: submittedPlayer });

      const result = await leaderboardService.submitScore(newPlayer);

      expect(axios.post).toHaveBeenCalledWith(`${mockAPIUrl}/leaderboard`, newPlayer);
      expect(result).toEqual(submittedPlayer);
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should handle submission with minimum data', async () => {
      const minimalPlayer = { name: 'A', score: 0 };
      const responsePlayer = { ...minimalPlayer, id: '5', date: new Date() };

      (axios.post as any).mockResolvedValue({ data: responsePlayer });

      const result = await leaderboardService.submitScore(minimalPlayer);

      expect(axios.post).toHaveBeenCalledWith(`${mockAPIUrl}/leaderboard`, minimalPlayer);
      expect(result).toEqual(responsePlayer);
    });

    it('should handle submission with maximum score', async () => {
      const highScorePlayer = { name: 'High Scorer', score: 999999 };
      const responsePlayer = { ...highScorePlayer, id: '6', date: new Date() };

      (axios.post as any).mockResolvedValue({ data: responsePlayer });

      const result = await leaderboardService.submitScore(highScorePlayer);

      expect(result).toEqual(responsePlayer);
    });

    it('should handle submission errors', async () => {
      const submissionError = new Error('Submission failed');
      (axios.post as any).mockRejectedValue(submissionError);

      await expect(leaderboardService.submitScore(newPlayer)).rejects.toThrow('Submission failed');
      expect(console.error).toHaveBeenCalledWith('Error submitting score:', submissionError);
    });

    it('should handle validation errors from server', async () => {
      const validationError = {
        response: {
          status: 400,
          data: { message: 'Invalid player name' },
        },
      };
      (axios.post as any).mockRejectedValue(validationError);

      await expect(leaderboardService.submitScore(newPlayer)).rejects.toMatchObject(validationError);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle server downtime', async () => {
      const serverError = {
        response: {
          status: 503,
          data: { message: 'Service unavailable' },
        },
      };
      (axios.post as any).mockRejectedValue(serverError);

      await expect(leaderboardService.submitScore(newPlayer)).rejects.toMatchObject(serverError);
    });

    it('should handle CORS errors', async () => {
      const corsError = new Error('CORS policy blocked');
      corsError.name = 'CORSError';
      (axios.post as any).mockRejectedValue(corsError);

      await expect(leaderboardService.submitScore(newPlayer)).rejects.toThrow('CORS policy blocked');
    });

    it('should handle special characters in player name', async () => {
      const specialNamePlayer = { name: '🎮 Player #1!', score: 100 };
      const responsePlayer = { ...specialNamePlayer, id: '7', date: new Date() };

      (axios.post as any).mockResolvedValue({ data: responsePlayer });

      const result = await leaderboardService.submitScore(specialNamePlayer);

      expect(axios.post).toHaveBeenCalledWith(`${mockAPIUrl}/leaderboard`, specialNamePlayer);
      expect(result.name).toBe('🎮 Player #1!');
    });

    it('should handle long player names', async () => {
      const longNamePlayer = { name: 'A'.repeat(100), score: 50 };
      const responsePlayer = { ...longNamePlayer, id: '8', date: new Date() };

      (axios.post as any).mockResolvedValue({ data: responsePlayer });

      const result = await leaderboardService.submitScore(longNamePlayer);

      expect(result.name).toBe('A'.repeat(100));
    });
  });

  describe('Error handling', () => {
    it('should log and rethrow errors for getLeaderboard', async () => {
      const error = new Error('Test error');
      (axios.get as any).mockRejectedValue(error);

      await expect(leaderboardService.getLeaderboard()).rejects.toThrow('Test error');
      expect(console.error).toHaveBeenCalledWith('Error fetching leaderboard:', error);
    });

    it('should log and rethrow errors for submitScore', async () => {
      const error = new Error('Test error');
      (axios.post as any).mockRejectedValue(error);

      await expect(leaderboardService.submitScore({ name: 'Test', score: 0 })).rejects.toThrow('Test error');
      expect(console.error).toHaveBeenCalledWith('Error submitting score:', error);
    });

    it('should handle undefined error messages', async () => {
      const undefinedError = { response: { status: 500 } };
      (axios.get as any).mockRejectedValue(undefinedError);

      await expect(leaderboardService.getLeaderboard()).rejects.toMatchObject(undefinedError);
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle non-error throws', async () => {
      (axios.get as any).mockRejectedValue('String error');

      await expect(leaderboardService.getLeaderboard()).rejects.toBe('String error');
      expect(console.error).toHaveBeenCalledWith('Error fetching leaderboard:', 'String error');
    });
  });

  describe('API URL configuration', () => {
    it('should use default URL when env variable is not set', async () => {
      delete import.meta.env.VITE_API_URL;
      (axios.get as any).mockResolvedValue({ data: [] });

      await leaderboardService.getLeaderboard();

      expect(axios.get).toHaveBeenCalledWith('http://localhost:3001/api/leaderboard');
    });

    it('should use custom URL from environment variable', async () => {
      import.meta.env.VITE_API_URL = 'https://custom-api.com';
      (axios.post as any).mockResolvedValue({ data: {} });

      await leaderboardService.submitScore({ name: 'Test', score: 10 });

      expect(axios.post).toHaveBeenCalledWith(
        'https://custom-api.com/leaderboard',
        { name: 'Test', score: 10 }
      );
    });

    it('should handle trailing slashes in API URL', async () => {
      import.meta.env.VITE_API_URL = 'https://api.com/v1/';
      (axios.get as any).mockResolvedValue({ data: [] });

      await leaderboardService.getLeaderboard();

      // Should still work correctly with trailing slash
      expect(axios.get).toHaveBeenCalledWith('https://api.com/v1//leaderboard');
    });
  });

  describe('Concurrent requests', () => {
    it('should handle multiple getLeaderboard calls', async () => {
      (axios.get as any).mockResolvedValue({ data: [] });

      const promises = [
        leaderboardService.getLeaderboard(),
        leaderboardService.getLeaderboard(),
        leaderboardService.getLeaderboard(),
      ];

      const results = await Promise.all(promises);

      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
      results.forEach(result => expect(result).toEqual([]));
    });

    it('should handle multiple submitScore calls', async () => {
      const players = [
        { name: 'Player 1', score: 100 },
        { name: 'Player 2', score: 200 },
        { name: 'Player 3', score: 300 },
      ];

      (axios.post as any).mockImplementation((url, data) => 
        Promise.resolve({ data: { ...data, id: Math.random(), date: new Date() } })
      );

      const promises = players.map(player => leaderboardService.submitScore(player));
      const results = await Promise.all(promises);

      expect(axios.post).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.name).toBe(players[index].name);
        expect(result.score).toBe(players[index].score);
      });
    });

    it('should handle mixed success and failure', async () => {
      let callCount = 0;
      (axios.get as any).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Second call failed'));
        }
        return Promise.resolve({ data: [] });
      });

      const promises = [
        leaderboardService.getLeaderboard(),
        leaderboardService.getLeaderboard().catch(err => err),
        leaderboardService.getLeaderboard(),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual([]);
      expect(results[1]).toBeInstanceOf(Error);
      expect(results[2]).toEqual([]);
    });
  });
});