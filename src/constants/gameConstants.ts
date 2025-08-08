// Game timing constants (in milliseconds)
export const MOLE_ACTIVE_TIME = {
  EASY: 1500,
  MEDIUM: 1000,
  HARD: 700,
} as const;

export const MOLE_INACTIVE_TIME = {
  EASY: 1500,
  MEDIUM: 1000,
  HARD: 800,
} as const;

export const MAX_ACTIVE_MOLES = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
} as const;

// Score values per difficulty
export const SCORE_VALUES = {
  EASY: 5,
  MEDIUM: 10,
  HARD: 15,
} as const;

// UI constants
export const WHACK_ANIMATION_DURATION = 1000; // ms
export const TIMER_UPDATE_INTERVAL = 1000; // ms
export const TIMER_WARNING_THRESHOLD = 30; // seconds
export const TIMER_CRITICAL_THRESHOLD = 10; // seconds

// Leaderboard constants
export const TOP_PLAYERS_DISPLAY_LIMIT = 10;
export const MAX_STORED_SCORES = 100;
export const MAX_PLAYER_NAME_LENGTH = 20;

// Modal animation
export const MODAL_TRANSITION_DURATION = 300; // ms