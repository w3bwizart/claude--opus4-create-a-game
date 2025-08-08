export interface Mole {
  id: number;
  isActive: boolean;
  isWhacked: boolean;
}

export interface GameState {
  moles: Mole[];
  score: number;
  timeRemaining: number;
  isPlaying: boolean;
  isGameOver: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Player {
  id?: string;
  name: string;
  score: number;
  date: Date | string;
}

export interface LeaderboardState {
  players: Player[];
  isLoading: boolean;
  error: string | null;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameOver';

export interface GameConfig {
  rows: number;
  columns: number;
  gameDuration: number; // in seconds
  moleActiveTime: number; // in milliseconds
  moleInactiveTime: number; // in milliseconds
}

export const DEFAULT_GAME_CONFIG: GameConfig = {
  rows: 3,
  columns: 4,
  gameDuration: 120, // 2 minutes
  moleActiveTime: 1000,
  moleInactiveTime: 1000,
};