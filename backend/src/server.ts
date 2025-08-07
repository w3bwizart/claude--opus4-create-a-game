import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Player } from '../types/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for leaderboard
// NOTE: In production, this should be replaced with a proper database
let leaderboard: Player[] = [];

const MAX_LEADERBOARD_SIZE = 100;
const TOP_PLAYERS_LIMIT = 10;

// Routes
app.get('/api/leaderboard', (req, res) => {
  const topPlayers = getTopPlayers();
  res.json(topPlayers);
});

app.post('/api/leaderboard', (req, res) => {
  const { name, score } = req.body;
  
  const validationError = validatePlayerInput(name, score);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const newPlayer = createPlayer(name, score);
  addPlayerToLeaderboard(newPlayer);

  res.status(201).json(newPlayer);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Helper functions
function getTopPlayers(): Player[] {
  return [...leaderboard]
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_PLAYERS_LIMIT);
}

function validatePlayerInput(name: any, score: any): string | null {
  if (!name || typeof name !== 'string') {
    return 'Valid name is required';
  }
  if (name.trim().length === 0 || name.length > 20) {
    return 'Name must be between 1 and 20 characters';
  }
  if (score === undefined || typeof score !== 'number') {
    return 'Valid score is required';
  }
  if (score < 0) {
    return 'Score must be non-negative';
  }
  return null;
}

function createPlayer(name: string, score: number): Player {
  return {
    id: Date.now().toString(),
    name: name.trim(),
    score,
    date: new Date(),
  };
}

function addPlayerToLeaderboard(player: Player): void {
  leaderboard.push(player);
  
  // Keep only top scores to prevent memory issues
  leaderboard = leaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_LEADERBOARD_SIZE);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});