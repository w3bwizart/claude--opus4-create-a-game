import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Leaderboard } from './Leaderboard';
import { renderWithProviders, createMockLeaderboard, createMockPlayer } from '../../test/testUtils';
import * as leaderboardService from '../../services/leaderboardService';

// Mock the leaderboard service
vi.mock('../../services/leaderboardService', () => ({
  leaderboardService: {
    getLeaderboard: vi.fn(),
    submitScore: vi.fn(),
  },
}));

describe('Leaderboard Component', () => {
  const mockOnClose = vi.fn();
  const mockLeaderboardData = createMockLeaderboard(5);

  beforeEach(() => {
    mockOnClose.mockClear();
    vi.clearAllMocks();
    
    // Default mock implementation
    (leaderboardService.leaderboardService.getLeaderboard as any).mockResolvedValue(mockLeaderboardData);
  });

  describe('Rendering', () => {
    it('should render leaderboard header', async () => {
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('🏆 Leaderboard')).toBeInTheDocument();
      });
    });

    it('should render close button when onClose prop is provided', async () => {
      renderWithProviders(<Leaderboard onClose={mockOnClose} />);
      
      await waitFor(() => {
        const closeBtn = screen.getByRole('button', { name: /close leaderboard/i });
        expect(closeBtn).toBeInTheDocument();
      });
    });

    it('should not render close button when onClose prop is not provided', async () => {
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('🏆 Leaderboard')).toBeInTheDocument();
      });
      
      expect(screen.queryByRole('button', { name: /close leaderboard/i })).not.toBeInTheDocument();
    });

    it('should display loading state initially', () => {
      // Mock a delayed response
      (leaderboardService.leaderboardService.getLeaderboard as any).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockLeaderboardData), 1000))
      );
      
      renderWithProviders(<Leaderboard />);
      
      expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
    });
  });

  describe('Leaderboard Display', () => {
    it('should display leaderboard table with headers', async () => {
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        
        expect(screen.getByText('Rank')).toBeInTheDocument();
        expect(screen.getByText('Player')).toBeInTheDocument();
        expect(screen.getByText('Score')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
      });
    });

    it('should display all players in correct order', async () => {
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // +1 for header row
        expect(rows).toHaveLength(mockLeaderboardData.length + 1);
        
        // Check first player
        expect(screen.getByText('Player 1')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument(); // Highest score
      });
    });

    it('should display rank emojis for top 3 players', async () => {
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('🥇')).toBeInTheDocument(); // 1st place
        expect(screen.getByText('🥈')).toBeInTheDocument(); // 2nd place
        expect(screen.getByText('🥉')).toBeInTheDocument(); // 3rd place
      });
    });

    it('should limit display to top 10 players', async () => {
      const manyPlayers = createMockLeaderboard(15);
      (leaderboardService.leaderboardService.getLeaderboard as any).mockResolvedValue(manyPlayers);
      
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row');
        // +1 for header, max 10 data rows
        expect(rows).toHaveLength(11);
      });
    });

    it('should format dates correctly', async () => {
      const playerWithDate = createMockPlayer({
        name: 'Test Player',
        date: new Date('2024-01-15'),
      });
      
      (leaderboardService.leaderboardService.getLeaderboard as any).mockResolvedValue([playerWithDate]);
      
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
      });
    });

    it('should display empty message when no scores exist', async () => {
      (leaderboardService.leaderboardService.getLeaderboard as any).mockResolvedValue([]);
      
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No scores yet. Be the first!')).toBeInTheDocument();
      });
    });

    it('should apply special styling to top 3 rows', async () => {
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row').slice(1); // Skip header
        
        expect(rows[0]).toHaveClass('rank-1');
        expect(rows[1]).toHaveClass('rank-2');
        expect(rows[2]).toHaveClass('rank-3');
        expect(rows[3]).not.toHaveClass('rank-4');
      });
    });
  });

  describe('Score Submission', () => {
    it('should show submit form when showSubmitForm is true', () => {
      const store = renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 150 } } }
      ).store;
      
      expect(screen.getByText('Your Score: 150')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit score/i })).toBeInTheDocument();
    });

    it('should not show submit form when showSubmitForm is false', async () => {
      renderWithProviders(<Leaderboard showSubmitForm={false} />);
      
      await waitFor(() => {
        expect(screen.getByText('🏆 Leaderboard')).toBeInTheDocument();
      });
      
      expect(screen.queryByText(/your score:/i)).not.toBeInTheDocument();
    });

    it('should submit score when form is filled and submitted', async () => {
      const user = userEvent.setup();
      const mockSubmittedPlayer = createMockPlayer({ name: 'John Doe', score: 150 });
      
      (leaderboardService.leaderboardService.submitScore as any).mockResolvedValue(mockSubmittedPlayer);
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 150 } } }
      );
      
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await user.type(nameInput, 'John Doe');
      
      const submitBtn = screen.getByRole('button', { name: /submit score/i });
      await user.click(submitBtn);
      
      await waitFor(() => {
        expect(leaderboardService.leaderboardService.submitScore).toHaveBeenCalledWith({
          name: 'John Doe',
          score: 150,
        });
      });
    });

    it('should show success message after submission', async () => {
      const user = userEvent.setup();
      const mockSubmittedPlayer = createMockPlayer();
      
      (leaderboardService.leaderboardService.submitScore as any).mockResolvedValue(mockSubmittedPlayer);
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      const nameInput = screen.getByPlaceholderText('Enter your name');
      await user.type(nameInput, 'Test User');
      
      await user.click(screen.getByRole('button', { name: /submit score/i }));
      
      await waitFor(() => {
        expect(screen.getByText('✅ Score submitted successfully!')).toBeInTheDocument();
      });
    });

    it('should hide submit form after successful submission', async () => {
      const user = userEvent.setup();
      const mockSubmittedPlayer = createMockPlayer();
      
      (leaderboardService.leaderboardService.submitScore as any).mockResolvedValue(mockSubmittedPlayer);
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      await user.type(screen.getByPlaceholderText('Enter your name'), 'Test');
      await user.click(screen.getByRole('button', { name: /submit score/i }));
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Enter your name')).not.toBeInTheDocument();
      });
    });

    it('should disable submit button when name is empty', () => {
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      const submitBtn = screen.getByRole('button', { name: /submit score/i });
      expect(submitBtn).toBeDisabled();
    });

    it('should enable submit button when name is entered', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      const submitBtn = screen.getByRole('button', { name: /submit score/i });
      expect(submitBtn).toBeDisabled();
      
      await user.type(screen.getByPlaceholderText('Enter your name'), 'Test');
      
      expect(submitBtn).not.toBeDisabled();
    });

    it('should limit name input to 20 characters', () => {
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      const nameInput = screen.getByPlaceholderText('Enter your name');
      expect(nameInput).toHaveAttribute('maxLength', '20');
    });

    it('should show submitting state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed submission
      (leaderboardService.leaderboardService.submitScore as any).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      await user.type(screen.getByPlaceholderText('Enter your name'), 'Test');
      await user.click(screen.getByRole('button', { name: /submit score/i }));
      
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your name')).toBeDisabled();
    });

    it('should refresh leaderboard after successful submission', async () => {
      const user = userEvent.setup();
      const mockSubmittedPlayer = createMockPlayer();
      
      (leaderboardService.leaderboardService.submitScore as any).mockResolvedValue(mockSubmittedPlayer);
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      // Initial fetch
      expect(leaderboardService.leaderboardService.getLeaderboard).toHaveBeenCalledTimes(1);
      
      await user.type(screen.getByPlaceholderText('Enter your name'), 'Test');
      await user.click(screen.getByRole('button', { name: /submit score/i }));
      
      await waitFor(() => {
        // Should fetch again after submission
        expect(leaderboardService.leaderboardService.getLeaderboard).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      (leaderboardService.leaderboardService.getLeaderboard as any).mockRejectedValue(
        new Error('Network error')
      );
      
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveTextContent(/error/i);
      });
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      (leaderboardService.leaderboardService.submitScore as any).mockRejectedValue(
        new Error('Submission failed')
      );
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      await user.type(screen.getByPlaceholderText('Enter your name'), 'Test');
      await user.click(screen.getByRole('button', { name: /submit score/i }));
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to submit score:',
          expect.any(Error)
        );
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should prevent duplicate submissions', async () => {
      const user = userEvent.setup();
      const mockSubmittedPlayer = createMockPlayer();
      
      (leaderboardService.leaderboardService.submitScore as any).mockResolvedValue(mockSubmittedPlayer);
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      await user.type(screen.getByPlaceholderText('Enter your name'), 'Test');
      await user.click(screen.getByRole('button', { name: /submit score/i }));
      
      await waitFor(() => {
        expect(screen.getByText('✅ Score submitted successfully!')).toBeInTheDocument();
      });
      
      // Try to submit again - form should be hidden
      expect(screen.queryByRole('button', { name: /submit score/i })).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<Leaderboard onClose={mockOnClose} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close leaderboard/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /close leaderboard/i }));
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should auto-focus name input when submit form is shown', () => {
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      const nameInput = screen.getByPlaceholderText('Enter your name');
      expect(nameInput).toHaveFocus();
    });

    it('should trim whitespace from player name', async () => {
      const user = userEvent.setup();
      const mockSubmittedPlayer = createMockPlayer();
      
      (leaderboardService.leaderboardService.submitScore as any).mockResolvedValue(mockSubmittedPlayer);
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      await user.type(screen.getByPlaceholderText('Enter your name'), '  Test User  ');
      await user.click(screen.getByRole('button', { name: /submit score/i }));
      
      await waitFor(() => {
        expect(leaderboardService.leaderboardService.submitScore).toHaveBeenCalledWith({
          name: 'Test User',
          score: 100,
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper table structure for screen readers', async () => {
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        const table = screen.getByRole('table');
        const headers = within(table).getAllByRole('columnheader');
        
        expect(headers).toHaveLength(4);
        expect(headers[0]).toHaveTextContent('Rank');
        expect(headers[1]).toHaveTextContent('Player');
        expect(headers[2]).toHaveTextContent('Score');
        expect(headers[3]).toHaveTextContent('Date');
      });
    });

    it('should have proper ARIA attributes for error messages', async () => {
      (leaderboardService.leaderboardService.getLeaderboard as any).mockRejectedValue(
        new Error('Failed to load')
      );
      
      renderWithProviders(<Leaderboard />);
      
      await waitFor(() => {
        const errorElement = screen.getByRole('alert');
        expect(errorElement).toHaveTextContent(/error/i);
      });
    });

    it('should announce success message to screen readers', async () => {
      const user = userEvent.setup();
      const mockSubmittedPlayer = createMockPlayer();
      
      (leaderboardService.leaderboardService.submitScore as any).mockResolvedValue(mockSubmittedPlayer);
      
      renderWithProviders(
        <Leaderboard showSubmitForm={true} />,
        { initialState: { game: { score: 100 } } }
      );
      
      await user.type(screen.getByPlaceholderText('Enter your name'), 'Test');
      await user.click(screen.getByRole('button', { name: /submit score/i }));
      
      await waitFor(() => {
        const successMessage = screen.getByText('✅ Score submitted successfully!');
        // Success messages should be announced to screen readers
        expect(successMessage.parentElement).toHaveClass('submit-success');
      });
    });
  });
});