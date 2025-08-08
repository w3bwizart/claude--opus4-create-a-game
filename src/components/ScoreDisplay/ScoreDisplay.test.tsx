import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ScoreDisplay } from './ScoreDisplay';
import gameReducer from '../../store/slices/gameSlice';

const createTestStore = (initialScore = 0, difficulty = 'medium') => {
  return configureStore({
    reducer: {
      game: gameReducer,
    },
    preloadedState: {
      game: {
        moles: [],
        score: initialScore,
        timeRemaining: 120,
        isPlaying: false,
        isGameOver: false,
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
      },
    },
  });
};

describe('ScoreDisplay Component', () => {
  it('renders score label', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ScoreDisplay />
      </Provider>
    );
    
    expect(screen.getByText('Score')).toBeInTheDocument();
  });

  it('displays current score', () => {
    const store = createTestStore(42);
    render(
      <Provider store={store}>
        <ScoreDisplay />
      </Provider>
    );
    
    const scoreValue = screen.getByTestId('score-value');
    expect(scoreValue).toHaveTextContent('42');
  });

  it('displays difficulty level', () => {
    const store = createTestStore(0, 'hard');
    render(
      <Provider store={store}>
        <ScoreDisplay />
      </Provider>
    );
    
    expect(screen.getByText('HARD')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <ScoreDisplay />
      </Provider>
    );
    
    const scoreDisplay = screen.getByRole('status');
    expect(scoreDisplay).toHaveAttribute('aria-live', 'polite');
  });

  it('updates when score changes', () => {
    const store = createTestStore(10);
    const { rerender } = render(
      <Provider store={store}>
        <ScoreDisplay />
      </Provider>
    );
    
    expect(screen.getByTestId('score-value')).toHaveTextContent('10');
    
    // Update store with new score
    store.dispatch({ type: 'game/whackMole', payload: 0 });
    
    rerender(
      <Provider store={store}>
        <ScoreDisplay />
      </Provider>
    );
    
    // Score should have increased
    const newScore = store.getState().game.score;
    expect(screen.getByTestId('score-value')).toHaveTextContent(newScore.toString());
  });
});