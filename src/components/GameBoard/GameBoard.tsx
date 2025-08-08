import React from 'react';
import { useAppSelector } from '../../hooks/useTypedRedux';
import { Mole } from '../Mole/Mole';
import { useMoleSpawner } from '../../hooks/useMoleSpawner';
import { DEFAULT_GAME_CONFIG } from '../../types/game.types';
import './GameBoard.css';

export const GameBoard: React.FC = () => {
  const { moles, isPlaying, difficulty } = useAppSelector((state) => state.game);
  
  // Use custom hook for mole spawning logic
  useMoleSpawner(isPlaying, difficulty, moles.length);

  const renderMoleCell = (index: number) => {
    const mole = moles[index];
    return (
      <div key={index} className="game-cell">
        <Mole
          id={index}
          isActive={mole?.isActive || false}
          isWhacked={mole?.isWhacked || false}
          disabled={!isPlaying}
        />
      </div>
    );
  };

  const createGameGrid = () => {
    const { rows, columns } = DEFAULT_GAME_CONFIG;
    const totalCells = rows * columns;
    
    return Array.from({ length: totalCells }, (_, index) => renderMoleCell(index));
  };

  return (
    <div 
      className="game-board"
      role="main"
      aria-label="Whack-a-Mole Game Board"
    >
      {createGameGrid()}
    </div>
  );
};