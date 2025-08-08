import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { GameControls } from './GameControls';
import { renderWithProviders, createTestStore } from '../../test/testUtils';

describe('GameControls Component', () => {
  const mockOnShowLeaderboard = vi.fn();

  beforeEach(() => {
    mockOnShowLeaderboard.mockClear();
  });

  describe('Rendering', () => {
    it('should render all control elements', () => {
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />);
      
      // Difficulty selector
      expect(screen.getByText('Difficulty:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /easy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /medium/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /hard/i })).toBeInTheDocument();
      
      // Action buttons
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /leaderboard/i })).toBeInTheDocument();
      
      // Instructions
      expect(screen.getByText('How to Play:')).toBeInTheDocument();
    });

    it('should display game instructions', () => {
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />);
      
      expect(screen.getByText(/click on moles when they pop up/i)).toBeInTheDocument();
      expect(screen.getByText(/easy: 5 points/i)).toBeInTheDocument();
      expect(screen.getByText(/you have 2 minutes/i)).toBeInTheDocument();
      expect(screen.getByText(/higher difficulty = faster moles/i)).toBeInTheDocument();
    });

    it('should have proper accessibility attributes', () => {
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />);
      
      const easyBtn = screen.getByRole('button', { name: /easy/i });
      const mediumBtn = screen.getByRole('button', { name: /medium/i });
      const hardBtn = screen.getByRole('button', { name: /hard/i });
      
      expect(easyBtn).toHaveAttribute('aria-pressed');
      expect(mediumBtn).toHaveAttribute('aria-pressed');
      expect(hardBtn).toHaveAttribute('aria-pressed');
      
      const startBtn = screen.getByRole('button', { name: /start game/i });
      expect(startBtn).toHaveAttribute('aria-label', 'Start Game');
      
      const leaderboardBtn = screen.getByRole('button', { name: /view leaderboard/i });
      expect(leaderboardBtn).toHaveAttribute('aria-label', 'View Leaderboard');
    });
  });

  describe('Difficulty Selection', () => {
    it('should show medium difficulty as default', () => {
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />);
      
      const mediumBtn = screen.getByRole('button', { name: /medium/i });
      expect(mediumBtn).toHaveClass('active');
      expect(mediumBtn).toHaveAttribute('aria-pressed', 'true');
    });

    it('should allow difficulty change when game is not playing', async () => {
      const user = userEvent.setup();
      const store = createTestStore({ game: { isPlaying: false, difficulty: 'medium' } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      const easyBtn = screen.getByRole('button', { name: /easy/i });
      await user.click(easyBtn);
      
      expect(store.getState().game.difficulty).toBe('easy');
      expect(easyBtn).toHaveClass('active');
    });

    it('should disable difficulty buttons when game is playing', async () => {
      const store = createTestStore({ game: { isPlaying: true } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      const easyBtn = screen.getByRole('button', { name: /easy/i });
      const mediumBtn = screen.getByRole('button', { name: /medium/i });
      const hardBtn = screen.getByRole('button', { name: /hard/i });
      
      expect(easyBtn).toBeDisabled();
      expect(mediumBtn).toBeDisabled();
      expect(hardBtn).toBeDisabled();
    });

    it('should update active state when difficulty changes', async () => {
      const user = userEvent.setup();
      const store = createTestStore({ game: { difficulty: 'easy' } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      // Initially easy is active
      expect(screen.getByRole('button', { name: /easy/i })).toHaveClass('active');
      
      // Change to hard
      const hardBtn = screen.getByRole('button', { name: /hard/i });
      await user.click(hardBtn);
      
      expect(hardBtn).toHaveClass('active');
      expect(screen.getByRole('button', { name: /easy/i })).not.toHaveClass('active');
    });
  });

  describe('Game Control Actions', () => {
    it('should show Start Game button when game is not playing', () => {
      const store = createTestStore({ game: { isPlaying: false, isGameOver: false } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument();
    });

    it('should show Pause button when game is playing', () => {
      const store = createTestStore({ game: { isPlaying: true } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument();
    });

    it('should show Play Again button when game is over', () => {
      const store = createTestStore({ game: { isGameOver: true, isPlaying: false } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      const playAgainBtn = screen.getByRole('button', { name: /play again/i });
      expect(playAgainBtn).toBeInTheDocument();
      expect(playAgainBtn).toHaveAttribute('aria-label', 'Play Again');
    });

    it('should start game when Start button is clicked', async () => {
      const user = userEvent.setup();
      const store = createTestStore({ game: { isPlaying: false } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      const startBtn = screen.getByRole('button', { name: /start game/i });
      await user.click(startBtn);
      
      expect(store.getState().game.isPlaying).toBe(true);
    });

    it('should reset and start new game when Play Again is clicked', async () => {
      const user = userEvent.setup();
      const store = createTestStore({ 
        game: { 
          isGameOver: true, 
          isPlaying: false, 
          score: 100,
          timeRemaining: 0 
        } 
      });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      const playAgainBtn = screen.getByRole('button', { name: /play again/i });
      await user.click(playAgainBtn);
      
      const state = store.getState().game;
      expect(state.isPlaying).toBe(true);
      expect(state.isGameOver).toBe(false);
      expect(state.score).toBe(0);
      expect(state.timeRemaining).toBe(120);
    });
  });

  describe('Pause/Resume Functionality', () => {
    it('should pause game when Pause button is clicked', async () => {
      const user = userEvent.setup();
      const store = createTestStore({ game: { isPlaying: true } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      const pauseBtn = screen.getByRole('button', { name: /pause game/i });
      await user.click(pauseBtn);
      
      expect(store.getState().game.isPlaying).toBe(false);
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    it('should resume game when Resume button is clicked', async () => {
      const user = userEvent.setup();
      const store = createTestStore({ game: { isPlaying: true } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      // First pause
      const pauseBtn = screen.getByRole('button', { name: /pause game/i });
      await user.click(pauseBtn);
      
      // Then resume
      const resumeBtn = screen.getByRole('button', { name: /resume/i });
      await user.click(resumeBtn);
      
      expect(store.getState().game.isPlaying).toBe(true);
      expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    });

    it('should maintain pause state internally', async () => {
      const user = userEvent.setup();
      const store = createTestStore({ game: { isPlaying: true } });
      
      const { rerender } = renderWithProviders(
        <GameControls onShowLeaderboard={mockOnShowLeaderboard} />, 
        { store }
      );
      
      // Pause the game
      await user.click(screen.getByRole('button', { name: /pause game/i }));
      
      // Component maintains its own pause state
      expect(screen.getByText(/Resume/)).toBeInTheDocument();
      
      // Re-render component
      rerender(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />);
      
      // Should still show resume button
      expect(screen.getByText(/Resume/)).toBeInTheDocument();
    });
  });

  describe('Leaderboard Integration', () => {
    it('should call onShowLeaderboard when leaderboard button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />);
      
      const leaderboardBtn = screen.getByRole('button', { name: /view leaderboard/i });
      await user.click(leaderboardBtn);
      
      expect(mockOnShowLeaderboard).toHaveBeenCalledTimes(1);
    });

    it('should show leaderboard button with trophy emoji', () => {
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />);
      
      const leaderboardBtn = screen.getByRole('button', { name: /view leaderboard/i });
      expect(leaderboardBtn.textContent).toContain('🏆');
    });
  });

  describe('Visual Feedback', () => {
    it('should show correct emoji for start button', () => {
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />);
      
      const startBtn = screen.getByRole('button', { name: /start game/i });
      expect(startBtn.textContent).toContain('▶️');
    });

    it('should show correct emoji for pause button', () => {
      const store = createTestStore({ game: { isPlaying: true } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      const pauseBtn = screen.getByRole('button', { name: /pause game/i });
      expect(pauseBtn.textContent).toContain('⏸️');
    });

    it('should show correct emoji for play again button', () => {
      const store = createTestStore({ game: { isGameOver: true } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      const playAgainBtn = screen.getByRole('button', { name: /play again/i });
      expect(playAgainBtn.textContent).toContain('🔄');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid button clicks gracefully', async () => {
      const user = userEvent.setup({ delay: null });
      const store = createTestStore({ game: { isPlaying: false } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      const startBtn = screen.getByRole('button', { name: /start game/i });
      
      // Rapid clicks
      await user.click(startBtn);
      await user.click(startBtn);
      await user.click(startBtn);
      
      // Should still be in a valid state
      expect(store.getState().game.isPlaying).toBe(true);
    });

    it('should handle difficulty changes during pause', async () => {
      const user = userEvent.setup();
      const store = createTestStore({ game: { isPlaying: true } });
      
      renderWithProviders(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />, { store });
      
      // Pause the game
      await user.click(screen.getByRole('button', { name: /pause game/i }));
      
      // Difficulty buttons should still be disabled during pause
      const easyBtn = screen.getByRole('button', { name: /easy/i });
      expect(easyBtn).toBeDisabled();
    });

    it('should reset pause state when starting new game', async () => {
      const user = userEvent.setup();
      const store = createTestStore({ game: { isPlaying: true } });
      
      const { rerender } = renderWithProviders(
        <GameControls onShowLeaderboard={mockOnShowLeaderboard} />, 
        { store }
      );
      
      // Pause the game
      await user.click(screen.getByRole('button', { name: /pause game/i }));
      
      // End the game
      store.dispatch({ type: 'game/endGame' });
      rerender(<GameControls onShowLeaderboard={mockOnShowLeaderboard} />);
      
      // Start new game
      await user.click(screen.getByRole('button', { name: /play again/i }));
      
      // Should show pause button (not resume)
      expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    });
  });
});