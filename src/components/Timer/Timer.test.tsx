import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Timer } from './Timer';
import gameReducer from '../../store/slices/gameSlice';
import { vi } from 'vitest';

const createTestStore = (timeRemaining = 120, isPlaying = false) => {
  return configureStore({
    reducer: {
      game: gameReducer,
    },
    preloadedState: {
      game: {
        moles: [],
        score: 0,
        timeRemaining,
        isPlaying,
        isGameOver: false,
        difficulty: 'medium',
      },
    },
  });
};

describe('Timer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders timer label', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <Timer />
      </Provider>
    );
    
    expect(screen.getByText('Time')).toBeInTheDocument();
  });

  it('displays formatted time correctly', () => {
    const store = createTestStore(90);
    render(
      <Provider store={store}>
        <Timer />
      </Provider>
    );
    
    const timerValue = screen.getByTestId('timer-value');
    expect(timerValue).toHaveTextContent('1:30');
  });

  it('formats single digit seconds with leading zero', () => {
    const store = createTestStore(65);
    render(
      <Provider store={store}>
        <Timer />
      </Provider>
    );
    
    const timerValue = screen.getByTestId('timer-value');
    expect(timerValue).toHaveTextContent('1:05');
  });

  it('applies warning class when time is low', () => {
    const store = createTestStore(25);
    const { container } = render(
      <Provider store={store}>
        <Timer />
      </Provider>
    );
    
    const timer = container.querySelector('.timer');
    expect(timer).toHaveClass('timer-warning');
  });

  it('applies critical class when time is very low', () => {
    const store = createTestStore(5);
    const { container } = render(
      <Provider store={store}>
        <Timer />
      </Provider>
    );
    
    const timer = container.querySelector('.timer');
    expect(timer).toHaveClass('timer-critical');
  });

  it('decrements time when game is playing', () => {
    const store = createTestStore(120, true);
    render(
      <Provider store={store}>
        <Timer />
      </Provider>
    );
    
    expect(screen.getByTestId('timer-value')).toHaveTextContent('2:00');
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    // Time should decrement
    const state = store.getState();
    expect(state.game.timeRemaining).toBeLessThan(120);
  });

  it('does not decrement when game is not playing', () => {
    const store = createTestStore(120, false);
    render(
      <Provider store={store}>
        <Timer />
      </Provider>
    );
    
    const initialTime = screen.getByTestId('timer-value').textContent;
    
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(screen.getByTestId('timer-value').textContent).toBe(initialTime);
  });

  it('has proper accessibility attributes', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <Timer />
      </Provider>
    );
    
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-live', 'polite');
  });

  it('shows progress bar with correct width', () => {
    const store = createTestStore(60);
    const { container } = render(
      <Provider store={store}>
        <Timer />
      </Provider>
    );
    
    const progressBar = container.querySelector('.timer-progress-bar');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });
});