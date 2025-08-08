import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch } from './useTypedRedux';
import { activateMole, deactivateMole } from '../store/slices/gameSlice';
import { 
  MOLE_ACTIVE_TIME, 
  MOLE_INACTIVE_TIME, 
  MAX_ACTIVE_MOLES 
} from '../constants/gameConstants';

interface DifficultySettings {
  activeTime: number;
  inactiveTime: number;
  maxActiveMoles: number;
}

const getDifficultySettings = (difficulty: 'easy' | 'medium' | 'hard'): DifficultySettings => {
  const upperDifficulty = difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
  return {
    activeTime: MOLE_ACTIVE_TIME[upperDifficulty],
    inactiveTime: MOLE_INACTIVE_TIME[upperDifficulty],
    maxActiveMoles: MAX_ACTIVE_MOLES[upperDifficulty],
  };
};

export const useMoleSpawner = (
  isPlaying: boolean,
  difficulty: 'easy' | 'medium' | 'hard',
  totalMoles: number
) => {
  const dispatch = useAppDispatch();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeMolesRef = useRef<Set<number>>(new Set());

  const findAvailableMole = useCallback((): number | null => {
    const availableMoles: number[] = [];
    for (let i = 0; i < totalMoles; i++) {
      if (!activeMolesRef.current.has(i)) {
        availableMoles.push(i);
      }
    }
    
    if (availableMoles.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * availableMoles.length);
    return availableMoles[randomIndex];
  }, [totalMoles]);

  const scheduleMoleDeactivation = useCallback(
    (moleId: number, delay: number) => {
      setTimeout(() => {
        dispatch(deactivateMole(moleId));
        activeMolesRef.current.delete(moleId);
      }, delay);
    },
    [dispatch]
  );

  const spawnMole = useCallback(() => {
    const settings = getDifficultySettings(difficulty);
    
    if (activeMolesRef.current.size >= settings.maxActiveMoles) {
      return;
    }

    const moleId = findAvailableMole();
    if (moleId === null) return;

    dispatch(activateMole(moleId));
    activeMolesRef.current.add(moleId);
    scheduleMoleDeactivation(moleId, settings.activeTime);
  }, [difficulty, dispatch, findAvailableMole, scheduleMoleDeactivation]);

  const deactivateAllMoles = useCallback(() => {
    activeMolesRef.current.forEach((moleId) => {
      dispatch(deactivateMole(moleId));
    });
    activeMolesRef.current.clear();
  }, [dispatch]);

  useEffect(() => {
    if (!isPlaying) return;

    const settings = getDifficultySettings(difficulty);
    
    // Initial spawn
    spawnMole();
    
    // Continuous spawning
    intervalRef.current = setInterval(spawnMole, settings.inactiveTime);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      deactivateAllMoles();
    };
  }, [isPlaying, difficulty, spawnMole, deactivateAllMoles]);
};