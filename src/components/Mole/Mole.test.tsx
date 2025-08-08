import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import { Mole } from './Mole';
import gameReducer from '../../store/slices/gameSlice';
import { renderWithProviders, createTestStore } from '../../test/testUtils';

const createMoleTestStore = () => {
  return configureStore({
    reducer: {
      game: gameReducer,
    },
  });
};

describe('Mole Component', () => {
  describe('Rendering States', () => {
    it('renders inactive mole', () => {
      const store = createMoleTestStore();
      render(
        <Provider store={store}>
          <Mole id={0} isActive={false} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-0');
      expect(mole).toBeInTheDocument();
      expect(mole).not.toHaveClass('mole-active');
    });

    it('renders active mole with hamster emoji', () => {
      const store = createMoleTestStore();
      render(
        <Provider store={store}>
          <Mole id={1} isActive={true} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-1');
      expect(mole).toHaveClass('mole-active');
      expect(screen.getByText('🐹')).toBeInTheDocument();
    });

    it('renders whacked mole with explosion emoji', () => {
      const store = createMoleTestStore();
      render(
        <Provider store={store}>
          <Mole id={2} isActive={false} isWhacked={true} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-2');
      expect(mole).toHaveClass('mole-whacked');
      expect(screen.getByText('💥')).toBeInTheDocument();
    });
    
    it('should show hole emoji when inactive and not whacked', () => {
      renderWithProviders(
        <Mole id={0} isActive={false} isWhacked={false} disabled={false} />
      );
      
      expect(screen.getByText('🕳️')).toBeInTheDocument();
    });
    
    it('should apply correct CSS classes for each state', () => {
      const { rerender, container } = renderWithProviders(
        <Mole id={0} isActive={false} isWhacked={false} disabled={false} />
      );
      
      let mole = container.querySelector('.mole');
      expect(mole).not.toHaveClass('mole-active');
      expect(mole).not.toHaveClass('mole-whacked');
      
      // Active state
      rerender(
        <Provider store={createMoleTestStore()}>
          <Mole id={0} isActive={true} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      mole = container.querySelector('.mole');
      expect(mole).toHaveClass('mole-active');
      
      // Whacked state
      rerender(
        <Provider store={createMoleTestStore()}>
          <Mole id={0} isActive={false} isWhacked={true} disabled={false} />
        </Provider>
      );
      
      mole = container.querySelector('.mole');
      expect(mole).toHaveClass('mole-whacked');
    });
  });

  describe('User Interactions', () => {
    it('dispatches whackMole action when active mole is clicked', () => {
      const store = createMoleTestStore();
      render(
        <Provider store={store}>
          <Mole id={3} isActive={true} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-3');
      fireEvent.click(mole);
      
      // Check that the state was updated
      const state = store.getState();
      expect(state.game.score).toBeGreaterThan(0);
    });

    it('does not dispatch action when disabled', () => {
      const store = createMoleTestStore();
      const initialScore = store.getState().game.score;
      
      render(
        <Provider store={store}>
          <Mole id={4} isActive={true} isWhacked={false} disabled={true} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-4');
      fireEvent.click(mole);
      
      const state = store.getState();
      expect(state.game.score).toBe(initialScore);
    });
    
    it('does not dispatch action when clicking inactive mole', async () => {
      const user = userEvent.setup();
      const store = createMoleTestStore();
      const initialScore = store.getState().game.score;
      
      render(
        <Provider store={store}>
          <Mole id={0} isActive={false} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-0');
      await user.click(mole);
      
      expect(store.getState().game.score).toBe(initialScore);
    });
    
    it('does not dispatch action when clicking already whacked mole', async () => {
      const user = userEvent.setup();
      const store = createMoleTestStore();
      const initialScore = store.getState().game.score;
      
      render(
        <Provider store={store}>
          <Mole id={0} isActive={true} isWhacked={true} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-0');
      await user.click(mole);
      
      expect(store.getState().game.score).toBe(initialScore);
    });
    
    it('handles rapid clicks correctly', async () => {
      const user = userEvent.setup({ delay: null });
      const store = createMoleTestStore();
      
      render(
        <Provider store={store}>
          <Mole id={0} isActive={true} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-0');
      
      // Rapid clicks
      await user.click(mole);
      await user.click(mole);
      await user.click(mole);
      
      // Should only count the first click
      const scoreIncrease = store.getState().game.score;
      expect(scoreIncrease).toBeGreaterThan(0);
      expect(scoreIncrease).toBeLessThanOrEqual(15); // Max points for one mole
    });
  });

  describe('Scoring', () => {
    it('awards correct points based on difficulty - easy', () => {
      const store = createMoleTestStore();
      store.dispatch({ type: 'game/setDifficulty', payload: 'easy' });
      
      render(
        <Provider store={store}>
          <Mole id={0} isActive={true} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-0');
      fireEvent.click(mole);
      
      expect(store.getState().game.score).toBe(5);
    });
    
    it('awards correct points based on difficulty - medium', () => {
      const store = createMoleTestStore();
      store.dispatch({ type: 'game/setDifficulty', payload: 'medium' });
      
      render(
        <Provider store={store}>
          <Mole id={0} isActive={true} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-0');
      fireEvent.click(mole);
      
      expect(store.getState().game.score).toBe(10);
    });
    
    it('awards correct points based on difficulty - hard', () => {
      const store = createMoleTestStore();
      store.dispatch({ type: 'game/setDifficulty', payload: 'hard' });
      
      render(
        <Provider store={store}>
          <Mole id={0} isActive={true} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByTestId('mole-0');
      fireEvent.click(mole);
      
      expect(store.getState().game.score).toBe(15);
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility attributes', () => {
      const store = createMoleTestStore();
      render(
        <Provider store={store}>
          <Mole id={5} isActive={false} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = screen.getByLabelText('Mole 6');
      expect(mole).toBeInTheDocument();
    });
    
    it('has correct button role', () => {
      renderWithProviders(
        <Mole id={0} isActive={false} isWhacked={false} disabled={false} />
      );
      
      const mole = screen.getByRole('button', { name: /mole 1/i });
      expect(mole).toBeInTheDocument();
    });
    
    it('indicates disabled state with aria-disabled', () => {
      renderWithProviders(
        <Mole id={0} isActive={false} isWhacked={false} disabled={true} />
      );
      
      const mole = screen.getByTestId('mole-0');
      expect(mole).toHaveAttribute('disabled');
    });
    
    it('provides descriptive aria-label for screen readers', () => {
      const { rerender } = renderWithProviders(
        <Mole id={0} isActive={true} isWhacked={false} disabled={false} />
      );
      
      // Active mole should indicate it can be clicked
      let mole = screen.getByLabelText('Mole 1');
      expect(mole).toBeInTheDocument();
      
      // Whacked mole
      rerender(
        <Provider store={createMoleTestStore()}>
          <Mole id={0} isActive={false} isWhacked={true} disabled={false} />
        </Provider>
      );
      
      mole = screen.getByLabelText('Mole 1');
      expect(mole).toBeInTheDocument();
    });
  });

  describe('Animation and Visual Feedback', () => {
    it('applies animation class when becoming active', () => {
      const { rerender, container } = renderWithProviders(
        <Mole id={0} isActive={false} isWhacked={false} disabled={false} />
      );
      
      rerender(
        <Provider store={createMoleTestStore()}>
          <Mole id={0} isActive={true} isWhacked={false} disabled={false} />
        </Provider>
      );
      
      const mole = container.querySelector('.mole');
      expect(mole).toHaveClass('mole-active');
    });
    
    it('applies animation class when whacked', () => {
      const { rerender, container } = renderWithProviders(
        <Mole id={0} isActive={true} isWhacked={false} disabled={false} />
      );
      
      rerender(
        <Provider store={createMoleTestStore()}>
          <Mole id={0} isActive={false} isWhacked={true} disabled={false} />
        </Provider>
      );
      
      const mole = container.querySelector('.mole');
      expect(mole).toHaveClass('mole-whacked');
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined props gracefully', () => {
      const { container } = renderWithProviders(
        <Mole id={999} isActive={undefined as any} isWhacked={undefined as any} disabled={undefined as any} />
      );
      
      const mole = container.querySelector('.mole');
      expect(mole).toBeInTheDocument();
      // Should default to inactive state
      expect(screen.getByText('🕳️')).toBeInTheDocument();
    });
    
    it('handles negative id values', () => {
      renderWithProviders(
        <Mole id={-1} isActive={false} isWhacked={false} disabled={false} />
      );
      
      const mole = screen.getByTestId('mole--1');
      expect(mole).toBeInTheDocument();
    });
    
    it('maintains state consistency when props change rapidly', () => {
      const { rerender } = renderWithProviders(
        <Mole id={0} isActive={false} isWhacked={false} disabled={false} />
      );
      
      // Rapid prop changes
      for (let i = 0; i < 10; i++) {
        rerender(
          <Provider store={createMoleTestStore()}>
            <Mole id={0} isActive={i % 2 === 0} isWhacked={false} disabled={false} />
          </Provider>
        );
      }
      
      // Should end in consistent state
      const mole = screen.getByTestId('mole-0');
      expect(mole).toBeInTheDocument();
    });
  });
});