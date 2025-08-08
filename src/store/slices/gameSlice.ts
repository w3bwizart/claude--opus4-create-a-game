import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { GameState, Mole } from '../../types/game.types';
import { DEFAULT_GAME_CONFIG } from '../../types/game.types';
import { SCORE_VALUES } from '../../constants/gameConstants';

const totalMoles = DEFAULT_GAME_CONFIG.rows * DEFAULT_GAME_CONFIG.columns;

const initialMoles: Mole[] = Array.from({ length: totalMoles }, (_, index) => ({
  id: index,
  isActive: false,
  isWhacked: false,
}));

const initialState: GameState = {
  moles: initialMoles,
  score: 0,
  timeRemaining: DEFAULT_GAME_CONFIG.gameDuration,
  isPlaying: false,
  isGameOver: false,
  difficulty: 'medium',
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    startGame: (state) => {
      state.isPlaying = true;
      state.isGameOver = false;
      state.score = 0;
      state.timeRemaining = DEFAULT_GAME_CONFIG.gameDuration;
      state.moles = initialMoles.map(mole => ({ ...mole, isActive: false, isWhacked: false }));
    },
    pauseGame: (state) => {
      state.isPlaying = false;
    },
    resumeGame: (state) => {
      state.isPlaying = true;
    },
    endGame: (state) => {
      state.isPlaying = false;
      state.isGameOver = true;
      state.moles = state.moles.map(mole => ({ ...mole, isActive: false, isWhacked: false }));
    },
    resetGame: (state) => {
      return initialState;
    },
    activateMole: (state, action: PayloadAction<number>) => {
      const moleId = action.payload;
      if (state.moles[moleId]) {
        state.moles[moleId].isActive = true;
        state.moles[moleId].isWhacked = false;
      }
    },
    deactivateMole: (state, action: PayloadAction<number>) => {
      const moleId = action.payload;
      if (state.moles[moleId]) {
        state.moles[moleId].isActive = false;
      }
    },
    whackMole: (state, action: PayloadAction<number>) => {
      const moleId = action.payload;
      const mole = state.moles[moleId];
      
      if (!mole || !mole.isActive || mole.isWhacked) {
        return;
      }
      
      mole.isWhacked = true;
      mole.isActive = false;
      
      const difficultyKey = state.difficulty.toUpperCase() as keyof typeof SCORE_VALUES;
      state.score += SCORE_VALUES[difficultyKey];
    },
    clearWhackedState: (state, action: PayloadAction<number>) => {
      const moleId = action.payload;
      if (state.moles[moleId]) {
        state.moles[moleId].isWhacked = false;
      }
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
      if (state.timeRemaining <= 0) {
        state.isPlaying = false;
        state.isGameOver = true;
        state.timeRemaining = 0;
      }
    },
    setDifficulty: (state, action: PayloadAction<'easy' | 'medium' | 'hard'>) => {
      state.difficulty = action.payload;
    },
  },
});

export const {
  startGame,
  pauseGame,
  resumeGame,
  endGame,
  resetGame,
  activateMole,
  deactivateMole,
  whackMole,
  clearWhackedState,
  updateTimeRemaining,
  setDifficulty,
} = gameSlice.actions;

export default gameSlice.reducer;