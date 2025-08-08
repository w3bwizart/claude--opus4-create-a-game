import React from 'react';
import { useAppSelector } from './hooks/useTypedRedux';
import { useModalManager } from './hooks/useModalManager';
import { GameBoard } from './components/GameBoard/GameBoard';
import { ScoreDisplay } from './components/ScoreDisplay/ScoreDisplay';
import { Timer } from './components/Timer/Timer';
import { GameControls } from './components/GameControls/GameControls';
import { Leaderboard } from './components/Leaderboard/Leaderboard';
import { HammerCursor } from './components/HammerCursor/HammerCursor';
import './App.css';

function App() {
  const { isGameOver, score, isPlaying } = useAppSelector((state) => state.game);
  const {
    showLeaderboard,
    showGameOverModal,
    openLeaderboard,
    closeLeaderboard,
    closeGameOverModal,
  } = useModalManager(isGameOver);

  return (
    <div className={`app ${isPlaying ? 'game-playing' : ''}`}>
      <HammerCursor />
      <header className="app-header">
        <h1 className="app-title">Whack-a-Mole</h1>
      </header>

      <main className="app-main">
        <div className="game-container">
          <div className="game-info">
            <ScoreDisplay />
            <Timer />
          </div>

          <GameBoard />

          <GameControls 
            onShowLeaderboard={openLeaderboard} 
          />

          {showLeaderboard && !showGameOverModal && (
            <div className="modal-overlay" onClick={closeLeaderboard}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <Leaderboard onClose={closeLeaderboard} />
              </div>
            </div>
          )}

          {showGameOverModal && (
            <div className="modal-overlay">
              <div className="modal-content game-over-modal">
                <h2>Game Over!</h2>
                <p className="final-score">Final Score: {score}</p>
                <Leaderboard 
                  showSubmitForm={true}
                  onClose={closeGameOverModal}
                />
                <button 
                  className="close-game-over"
                  onClick={closeGameOverModal}
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
