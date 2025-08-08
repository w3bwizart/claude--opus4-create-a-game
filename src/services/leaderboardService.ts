import axios from 'axios';
import type { Player } from '../types/game.types';
import { ErrorService } from './errorService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class LeaderboardService {
  async getLeaderboard(): Promise<Player[]> {
    try {
      const response = await axios.get<Player[]>(`${API_BASE_URL}/leaderboard`);
      return response.data;
    } catch (error) {
      const appError = ErrorService.handleApiError(error, 'fetching leaderboard');
      throw new Error(ErrorService.getUserFriendlyMessage(appError));
    }
  }

  async submitScore(player: Omit<Player, 'id' | 'date'>): Promise<Player> {
    try {
      const response = await axios.post<Player>(`${API_BASE_URL}/leaderboard`, player);
      return response.data;
    } catch (error) {
      const appError = ErrorService.handleApiError(error, 'submitting score');
      throw new Error(ErrorService.getUserFriendlyMessage(appError));
    }
  }
}

export const leaderboardService = new LeaderboardService();