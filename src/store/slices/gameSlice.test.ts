import { describe, it, expect } from 'vitest';
import gameReducer, {
  startGame,
  pauseGame,
  resumeGame,
  endGame,
  resetGame,
  activateMole,
  deactivateMole,
  whackMole,
  updateTimeRemaining,
  setDifficulty,
} from './gameSlice';
import type { GameState } from '../../types/game.types';
import { DEFAULT_GAME_CONFIG } from '../../types/game.types';

describe('gameSlice', () => {
  const getInitialState = (): GameState => ({
    moles: Array.from({ length: 12 }, (_, index) => ({
      id: index,
      isActive: false,
      isWhacked: false,
    })),
    score: 0,
    timeRemaining: DEFAULT_GAME_CONFIG.gameDuration,
    isPlaying: false,
    isGameOver: false,
    difficulty: 'medium',
  });

  describe('startGame', () => {
    it('should start the game with initial values', () => {
      const initialState = getInitialState();
      initialState.score = 100;
      initialState.timeRemaining = 60;
      initialState.isGameOver = true;
      
      const nextState = gameReducer(initialState, startGame());
      
      expect(nextState.isPlaying).toBe(true);
      expect(nextState.isGameOver).toBe(false);
      expect(nextState.score).toBe(0);
      expect(nextState.timeRemaining).toBe(DEFAULT_GAME_CONFIG.gameDuration);
      expect(nextState.moles.every(mole => !mole.isActive && !mole.isWhacked)).toBe(true);
    });

    it('should reset all moles when starting game', () => {
      const initialState = getInitialState();
      initialState.moles[0].isActive = true;
      initialState.moles[1].isWhacked = true;
      
      const nextState = gameReducer(initialState, startGame());
      
      expect(nextState.moles[0].isActive).toBe(false);
      expect(nextState.moles[1].isWhacked).toBe(false);
    });
  });

  describe('pauseGame', () => {
    it('should pause the game', () => {
      const initialState = getInitialState();
      initialState.isPlaying = true;
      
      const nextState = gameReducer(initialState, pauseGame());
      
      expect(nextState.isPlaying).toBe(false);
    });

    it('should not affect other game state when pausing', () => {
      const initialState = getInitialState();
      initialState.isPlaying = true;
      initialState.score = 50;
      initialState.timeRemaining = 90;
      
      const nextState = gameReducer(initialState, pauseGame());
      
      expect(nextState.score).toBe(50);
      expect(nextState.timeRemaining).toBe(90);
      expect(nextState.isGameOver).toBe(false);
    });
  });

  describe('resumeGame', () => {
    it('should resume the game', () => {
      const initialState = getInitialState();
      initialState.isPlaying = false;
      
      const nextState = gameReducer(initialState, resumeGame());
      
      expect(nextState.isPlaying).toBe(true);
    });
  });

  describe('endGame', () => {
    it('should end the game properly', () => {
      const initialState = getInitialState();
      initialState.isPlaying = true;
      initialState.moles[0].isActive = true;
      initialState.moles[1].isWhacked = true;
      
      const nextState = gameReducer(initialState, endGame());
      
      expect(nextState.isPlaying).toBe(false);
      expect(nextState.isGameOver).toBe(true);
      expect(nextState.moles.every(mole => !mole.isActive && !mole.isWhacked)).toBe(true);
    });

    it('should preserve score when ending game', () => {
      const initialState = getInitialState();
      initialState.score = 150;
      
      const nextState = gameReducer(initialState, endGame());
      
      expect(nextState.score).toBe(150);
    });
  });

  describe('resetGame', () => {
    it('should reset to initial state', () => {
      const modifiedState: GameState = {
        moles: Array.from({ length: 12 }, (_, index) => ({
          id: index,
          isActive: index === 0,
          isWhacked: index === 1,
        })),
        score: 200,
        timeRemaining: 30,
        isPlaying: true,
        isGameOver: true,
        difficulty: 'hard',
      };
      
      const nextState = gameReducer(modifiedState, resetGame());
      
      expect(nextState).toEqual(getInitialState());
    });
  });

  describe('activateMole', () => {
    it('should activate a specific mole', () => {
      const initialState = getInitialState();
      
      const nextState = gameReducer(initialState, activateMole(3));
      
      expect(nextState.moles[3].isActive).toBe(true);
      expect(nextState.moles[3].isWhacked).toBe(false);
    });

    it('should clear whacked state when activating', () => {
      const initialState = getInitialState();
      initialState.moles[5].isWhacked = true;
      
      const nextState = gameReducer(initialState, activateMole(5));
      
      expect(nextState.moles[5].isActive).toBe(true);
      expect(nextState.moles[5].isWhacked).toBe(false);
    });

    it('should handle invalid mole id gracefully', () => {
      const initialState = getInitialState();
      
      const nextState = gameReducer(initialState, activateMole(999));
      
      expect(nextState).toEqual(initialState);
    });

    it('should handle negative mole id gracefully', () => {
      const initialState = getInitialState();
      
      const nextState = gameReducer(initialState, activateMole(-1));
      
      expect(nextState).toEqual(initialState);
    });
  });

  describe('deactivateMole', () => {
    it('should deactivate a specific mole', () => {
      const initialState = getInitialState();
      initialState.moles[2].isActive = true;
      
      const nextState = gameReducer(initialState, deactivateMole(2));
      
      expect(nextState.moles[2].isActive).toBe(false);
    });

    it('should handle invalid mole id gracefully', () => {
      const initialState = getInitialState();
      
      const nextState = gameReducer(initialState, deactivateMole(999));
      
      expect(nextState).toEqual(initialState);
    });
  });

  describe('whackMole', () => {
    it('should whack an active mole and increase score on medium', () => {
      const initialState = getInitialState();
      initialState.moles[4].isActive = true;
      initialState.difficulty = 'medium';
      
      const nextState = gameReducer(initialState, whackMole(4));
      
      expect(nextState.moles[4].isWhacked).toBe(true);
      expect(nextState.moles[4].isActive).toBe(false);
      expect(nextState.score).toBe(10);
    });

    it('should award 5 points on easy difficulty', () => {
      const initialState = getInitialState();
      initialState.moles[0].isActive = true;
      initialState.difficulty = 'easy';
      
      const nextState = gameReducer(initialState, whackMole(0));
      
      expect(nextState.score).toBe(5);
    });

    it('should award 15 points on hard difficulty', () => {
      const initialState = getInitialState();
      initialState.moles[0].isActive = true;
      initialState.difficulty = 'hard';
      
      const nextState = gameReducer(initialState, whackMole(0));
      
      expect(nextState.score).toBe(15);
    });

    it('should not whack an inactive mole', () => {
      const initialState = getInitialState();
      initialState.moles[6].isActive = false;
      
      const nextState = gameReducer(initialState, whackMole(6));
      
      expect(nextState.moles[6].isWhacked).toBe(false);
      expect(nextState.score).toBe(0);
    });

    it('should not whack an already whacked mole', () => {
      const initialState = getInitialState();
      initialState.moles[7].isActive = true;
      initialState.moles[7].isWhacked = true;
      
      const nextState = gameReducer(initialState, whackMole(7));
      
      expect(nextState.score).toBe(0);
    });

    it('should handle invalid mole id gracefully', () => {
      const initialState = getInitialState();
      
      const nextState = gameReducer(initialState, whackMole(999));
      
      expect(nextState).toEqual(initialState);
    });

    it('should accumulate score correctly', () => {
      let state = getInitialState();
      state.difficulty = 'medium';
      
      // Whack first mole
      state.moles[0].isActive = true;
      state = gameReducer(state, whackMole(0));
      expect(state.score).toBe(10);
      
      // Whack second mole
      state.moles[1].isActive = true;
      state = gameReducer(state, whackMole(1));
      expect(state.score).toBe(20);
      
      // Whack third mole
      state.moles[2].isActive = true;
      state = gameReducer(state, whackMole(2));
      expect(state.score).toBe(30);
    });
  });

  describe('updateTimeRemaining', () => {
    it('should update time remaining', () => {
      const initialState = getInitialState();
      
      const nextState = gameReducer(initialState, updateTimeRemaining(90));
      
      expect(nextState.timeRemaining).toBe(90);
    });

    it('should end game when time reaches 0', () => {
      const initialState = getInitialState();
      initialState.isPlaying = true;
      
      const nextState = gameReducer(initialState, updateTimeRemaining(0));
      
      expect(nextState.timeRemaining).toBe(0);
      expect(nextState.isPlaying).toBe(false);
      expect(nextState.isGameOver).toBe(true);
    });

    it('should end game when time goes negative', () => {
      const initialState = getInitialState();
      initialState.isPlaying = true;
      
      const nextState = gameReducer(initialState, updateTimeRemaining(-5));
      
      expect(nextState.timeRemaining).toBe(0);
      expect(nextState.isPlaying).toBe(false);
      expect(nextState.isGameOver).toBe(true);
    });

    it('should not affect game state when time is positive', () => {
      const initialState = getInitialState();
      initialState.isPlaying = true;
      
      const nextState = gameReducer(initialState, updateTimeRemaining(30));
      
      expect(nextState.timeRemaining).toBe(30);
      expect(nextState.isPlaying).toBe(true);
      expect(nextState.isGameOver).toBe(false);
    });
  });

  describe('setDifficulty', () => {
    it('should set difficulty to easy', () => {
      const initialState = getInitialState();
      
      const nextState = gameReducer(initialState, setDifficulty('easy'));
      
      expect(nextState.difficulty).toBe('easy');
    });

    it('should set difficulty to medium', () => {
      const initialState = getInitialState();
      initialState.difficulty = 'hard';
      
      const nextState = gameReducer(initialState, setDifficulty('medium'));
      
      expect(nextState.difficulty).toBe('medium');
    });

    it('should set difficulty to hard', () => {
      const initialState = getInitialState();
      
      const nextState = gameReducer(initialState, setDifficulty('hard'));
      
      expect(nextState.difficulty).toBe('hard');
    });

    it('should not affect other game state when changing difficulty', () => {
      const initialState = getInitialState();
      initialState.score = 100;
      initialState.isPlaying = true;
      
      const nextState = gameReducer(initialState, setDifficulty('hard'));
      
      expect(nextState.score).toBe(100);
      expect(nextState.isPlaying).toBe(true);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle a complete game flow', () => {
      let state = getInitialState();
      
      // Start game
      state = gameReducer(state, startGame());
      expect(state.isPlaying).toBe(true);
      
      // Set difficulty
      state = gameReducer(state, setDifficulty('hard'));
      expect(state.difficulty).toBe('hard');
      
      // Activate and whack some moles
      state = gameReducer(state, activateMole(0));
      state = gameReducer(state, whackMole(0));
      expect(state.score).toBe(15);
      
      state = gameReducer(state, activateMole(5));
      state = gameReducer(state, whackMole(5));
      expect(state.score).toBe(30);
      
      // Update time
      state = gameReducer(state, updateTimeRemaining(10));
      expect(state.timeRemaining).toBe(10);
      
      // Time runs out
      state = gameReducer(state, updateTimeRemaining(0));
      expect(state.isGameOver).toBe(true);
      expect(state.isPlaying).toBe(false);
      expect(state.score).toBe(30); // Score preserved
    });

    it('should handle pause and resume during game', () => {
      let state = getInitialState();
      
      state = gameReducer(state, startGame());
      state = gameReducer(state, activateMole(3));
      
      // Pause
      state = gameReducer(state, pauseGame());
      expect(state.isPlaying).toBe(false);
      expect(state.moles[3].isActive).toBe(true); // Mole state preserved
      
      // Resume
      state = gameReducer(state, resumeGame());
      expect(state.isPlaying).toBe(true);
      expect(state.moles[3].isActive).toBe(true); // Mole still active
      
      // Can still whack mole after resume
      state = gameReducer(state, whackMole(3));
      expect(state.score).toBe(10);
    });
  });
});