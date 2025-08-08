import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LeaderboardState, Player } from '../../types/game.types';
import { leaderboardService } from '../../services/leaderboardService';

const initialState: LeaderboardState = {
  players: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await leaderboardService.getLeaderboard();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch leaderboard');
    }
  }
);

export const submitScore = createAsyncThunk(
  'leaderboard/submit',
  async (player: Omit<Player, 'id' | 'date'>, { rejectWithValue }) => {
    try {
      const response = await leaderboardService.submitScore(player);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit score');
    }
  }
);

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.players = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch leaderboard';
        // Keep existing players if fetch fails
        if (state.players.length === 0) {
          state.players = [];
        }
      })
      // Submit score
      .addCase(submitScore.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(submitScore.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the new score and sort
        state.players = [...state.players, action.payload]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Keep only top 10
      })
      .addCase(submitScore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to submit score';
      });
  },
});

export const { clearError } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;