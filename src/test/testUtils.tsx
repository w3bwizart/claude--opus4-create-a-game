import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import gameReducer from '../store/slices/gameSlice';
import leaderboardReducer from '../store/slices/leaderboardSlice';
import type { GameState, LeaderboardState } from '../types/game.types';

// Define test state interfaces
interface TestState {
  game?: Partial<GameState>;
  leaderboard?: Partial<LeaderboardState>;
}

// Create a test store with optional initial state
export function createTestStore(initialState?: TestState) {
  const defaultGameState: GameState = {
    moles: Array.from({ length: 12 }, (_, index) => ({
      id: index,
      isActive: false,
      isWhacked: false,
    })),
    score: 0,
    timeRemaining: 120,
    isPlaying: false,
    isGameOver: false,
    difficulty: 'medium',
  };

  const defaultLeaderboardState: LeaderboardState = {
    players: [],
    isLoading: false,
    error: null,
  };

  return configureStore({
    reducer: {
      game: gameReducer,
      leaderboard: leaderboardReducer,
    },
    preloadedState: {
      game: { ...defaultGameState, ...initialState?.game },
      leaderboard: { ...defaultLeaderboardState, ...initialState?.leaderboard },
    },
  });
}

// Custom render function with Redux Provider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: TestState;
  store?: ReturnType<typeof createTestStore>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialState,
    store = createTestStore(initialState),
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Mock data generators
export const createMockPlayer = (overrides = {}) => ({
  id: Math.random().toString(36).substr(2, 9),
  name: 'Test Player',
  score: 100,
  date: new Date(),
  ...overrides,
});

export const createMockLeaderboard = (count = 10) => {
  return Array.from({ length: count }, (_, index) => 
    createMockPlayer({
      name: `Player ${index + 1}`,
      score: (count - index) * 10,
      date: new Date(Date.now() - index * 86400000), // Each day earlier
    })
  );
};

// Helper to wait for async updates
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Mock timers helper
export const advanceTimersByTime = async (time: number) => {
  const { act } = await import('@testing-library/react');
  await act(async () => {
    await vi.advanceTimersByTime(time);
  });
};

// Accessibility testing helper
export const checkAccessibility = async (container: HTMLElement) => {
  // This is a placeholder for axe-core integration
  // In a real implementation, you'd use:
  // const { axe, toHaveNoViolations } = require('jest-axe');
  // const results = await axe(container);
  // expect(results).toHaveNoViolations();
  return true;
};

// Event helpers
export const createMouseEvent = (type: string, options = {}) => {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  });
};

// Test IDs for consistent querying
export const TEST_IDS = {
  mole: (id: number) => `mole-${id}`,
  scoreValue: 'score-value',
  timerValue: 'timer-value',
  gameBoard: 'game-board',
  startButton: 'start-button',
  pauseButton: 'pause-button',
  difficultyButton: (level: string) => `difficulty-${level}`,
  leaderboardTable: 'leaderboard-table',
  submitScoreForm: 'submit-score-form',
};