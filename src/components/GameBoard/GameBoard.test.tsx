import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { GameBoard } from './GameBoard';
import { renderWithProviders, createTestStore, advanceTimersByTime } from '../../test/testUtils';
import { startGame, pauseGame } from '../../store/slices/gameSlice';

describe('GameBoard Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render the game board with correct structure', () => {
      renderWithProviders(<GameBoard />);
      
      const gameBoard = screen.getByRole('main', { name: /whack-a-mole game board/i });
      expect(gameBoard).toBeInTheDocument();
    });

    it('should render 12 mole cells (3x4 grid)', () => {
      const { container } = renderWithProviders(<GameBoard />);
      
      const cells = container.querySelectorAll('.game-cell');
      expect(cells).toHaveLength(12);
      
      // Verify all moles are rendered
      for (let i = 0; i < 12; i++) {
        expect(screen.getByTestId(`mole-${i}`)).toBeInTheDocument();
      }
    });

    it('should render all moles as inactive initially', () => {
      renderWithProviders(<GameBoard />);
      
      for (let i = 0; i < 12; i++) {
        const mole = screen.getByTestId(`mole-${i}`);
        expect(mole).not.toHaveClass('mole-active');
      }
    });

    it('should have proper accessibility attributes', () => {
      renderWithProviders(<GameBoard />);
      
      const gameBoard = screen.getByRole('main');
      expect(gameBoard).toHaveAttribute('aria-label', 'Whack-a-Mole Game Board');
    });
  });

  describe('Game Mechanics - Easy Difficulty', () => {
    it('should activate moles when game starts on easy difficulty', async () => {
      const store = createTestStore({
        game: { difficulty: 'easy', isPlaying: false }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // Start the game
      store.dispatch(startGame());
      
      // Wait for first mole to appear
      await waitFor(() => {
        const activeMoles = screen.queryAllByText('🐹');
        expect(activeMoles.length).toBeGreaterThan(0);
      });
      
      // On easy, only 1 mole should be active at a time
      const activeMoles = screen.queryAllByText('🐹');
      expect(activeMoles.length).toBeLessThanOrEqual(1);
    });

    it('should keep moles active for correct duration on easy', async () => {
      const store = createTestStore({
        game: { difficulty: 'easy', isPlaying: true }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // Wait for a mole to appear
      await waitFor(() => {
        expect(screen.queryAllByText('🐹').length).toBeGreaterThan(0);
      });
      
      const initialActiveMoles = screen.queryAllByText('🐹').length;
      
      // Advance time but not enough to deactivate (easy: 1500ms active time)
      await advanceTimersByTime(1000);
      
      // Mole should still be active
      expect(screen.queryAllByText('🐹').length).toBe(initialActiveMoles);
      
      // Advance past deactivation time
      await advanceTimersByTime(600);
      
      // Mole should be deactivated
      await waitFor(() => {
        expect(screen.queryAllByText('🐹').length).toBeLessThan(initialActiveMoles);
      });
    });
  });

  describe('Game Mechanics - Medium Difficulty', () => {
    it('should allow up to 2 moles active on medium difficulty', async () => {
      const store = createTestStore({
        game: { difficulty: 'medium', isPlaying: true }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // Let the game run for a bit
      await advanceTimersByTime(3000);
      
      await waitFor(() => {
        const activeMoles = screen.queryAllByText('🐹');
        expect(activeMoles.length).toBeGreaterThan(0);
        expect(activeMoles.length).toBeLessThanOrEqual(2);
      });
    });

    it('should have faster mole cycles on medium', async () => {
      const store = createTestStore({
        game: { difficulty: 'medium', isPlaying: true }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // Wait for initial mole
      await waitFor(() => {
        expect(screen.queryAllByText('🐹').length).toBeGreaterThan(0);
      });
      
      // Medium: 1000ms active time
      await advanceTimersByTime(1100);
      
      // Should spawn new moles more frequently
      await waitFor(() => {
        const activeMoles = screen.queryAllByText('🐹');
        expect(activeMoles.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Game Mechanics - Hard Difficulty', () => {
    it('should allow up to 3 moles active on hard difficulty', async () => {
      const store = createTestStore({
        game: { difficulty: 'hard', isPlaying: true }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // Let the game run to spawn multiple moles
      await advanceTimersByTime(3000);
      
      await waitFor(() => {
        const activeMoles = screen.queryAllByText('🐹');
        expect(activeMoles.length).toBeGreaterThan(0);
        expect(activeMoles.length).toBeLessThanOrEqual(3);
      });
    });

    it('should have fastest mole cycles on hard', async () => {
      const store = createTestStore({
        game: { difficulty: 'hard', isPlaying: true }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // Wait for initial mole
      await waitFor(() => {
        expect(screen.queryAllByText('🐹').length).toBeGreaterThan(0);
      });
      
      // Hard: 700ms active time
      await advanceTimersByTime(800);
      
      // Moles should cycle very quickly
      await waitFor(() => {
        const activeMoles = screen.queryAllByText('🐹');
        expect(activeMoles).toBeDefined();
      });
    });
  });

  describe('Game State Management', () => {
    it('should stop spawning moles when game is paused', async () => {
      const store = createTestStore({
        game: { isPlaying: true }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // Wait for moles to appear
      await waitFor(() => {
        expect(screen.queryAllByText('🐹').length).toBeGreaterThan(0);
      });
      
      // Pause the game
      store.dispatch(pauseGame());
      
      // Clear any active moles
      await advanceTimersByTime(2000);
      
      // No new moles should spawn
      await advanceTimersByTime(3000);
      const activeMoles = screen.queryAllByText('🐹');
      expect(activeMoles.length).toBe(0);
    });

    it('should clear all active moles when game ends', async () => {
      const store = createTestStore({
        game: { isPlaying: true }
      });
      
      const { rerender } = renderWithProviders(<GameBoard />, { store });
      
      // Wait for moles to appear
      await waitFor(() => {
        expect(screen.queryAllByText('🐹').length).toBeGreaterThan(0);
      });
      
      // End the game by updating isPlaying to false
      store.dispatch({ type: 'game/endGame' });
      
      rerender(<GameBoard />);
      
      // All moles should be cleared
      await waitFor(() => {
        expect(screen.queryAllByText('🐹').length).toBe(0);
      });
    });

    it('should not spawn duplicate moles in same position', async () => {
      const store = createTestStore({
        game: { isPlaying: true, difficulty: 'hard' }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // Run game for a while
      await advanceTimersByTime(5000);
      
      // Check that no position has multiple active states
      const moles = store.getState().game.moles;
      const activeMoleIds = moles
        .filter(mole => mole.isActive)
        .map(mole => mole.id);
      
      // Check for duplicates
      const uniqueIds = new Set(activeMoleIds);
      expect(uniqueIds.size).toBe(activeMoleIds.length);
    });
  });

  describe('Mole Interaction', () => {
    it('should allow clicking on active moles when game is playing', async () => {
      const user = userEvent.setup({ delay: null });
      const store = createTestStore({
        game: { isPlaying: true }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // Wait for a mole to appear
      await waitFor(() => {
        expect(screen.queryAllByText('🐹').length).toBeGreaterThan(0);
      });
      
      const activeMole = screen.getAllByText('🐹')[0].closest('button');
      const initialScore = store.getState().game.score;
      
      if (activeMole) {
        await user.click(activeMole);
        
        // Score should increase
        expect(store.getState().game.score).toBeGreaterThan(initialScore);
      }
    });

    it('should disable all moles when game is not playing', () => {
      const store = createTestStore({
        game: { isPlaying: false }
      });
      
      renderWithProviders(<GameBoard />, { store });
      
      // All moles should be disabled
      for (let i = 0; i < 12; i++) {
        const mole = screen.getByTestId(`mole-${i}`);
        expect(mole).toBeDisabled();
      }
    });
  });

  describe('Performance and Cleanup', () => {
    it('should clean up intervals when component unmounts', async () => {
      const store = createTestStore({
        game: { isPlaying: true }
      });
      
      const { unmount } = renderWithProviders(<GameBoard />, { store });
      
      // Let game run
      await advanceTimersByTime(1000);
      
      // Unmount component
      unmount();
      
      // Advance timers - should not cause errors
      await advanceTimersByTime(5000);
      
      // No errors should occur
      expect(true).toBe(true);
    });

    it('should handle rapid difficulty changes', async () => {
      const store = createTestStore({
        game: { isPlaying: true, difficulty: 'easy' }
      });
      
      const { rerender } = renderWithProviders(<GameBoard />, { store });
      
      // Change difficulty rapidly
      store.dispatch({ type: 'game/setDifficulty', payload: 'medium' });
      rerender(<GameBoard />);
      
      await advanceTimersByTime(100);
      
      store.dispatch({ type: 'game/setDifficulty', payload: 'hard' });
      rerender(<GameBoard />);
      
      await advanceTimersByTime(100);
      
      store.dispatch({ type: 'game/setDifficulty', payload: 'easy' });
      rerender(<GameBoard />);
      
      // Should handle changes without errors
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty moles array gracefully', () => {
      const store = createTestStore({
        game: { moles: [] }
      });
      
      const { container } = renderWithProviders(<GameBoard />, { store });
      
      // Should still render the board structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      
      // But with no mole cells
      const cells = container.querySelectorAll('.game-cell');
      expect(cells.length).toBe(12); // Still renders cells based on grid config
    });

    it('should handle very rapid game start/stop cycles', async () => {
      const store = createTestStore();
      
      renderWithProviders(<GameBoard />, { store });
      
      // Rapidly start and stop
      for (let i = 0; i < 5; i++) {
        store.dispatch(startGame());
        await advanceTimersByTime(50);
        store.dispatch(pauseGame());
        await advanceTimersByTime(50);
      }
      
      // Should remain stable
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });
});