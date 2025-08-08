import React, { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../../hooks/useTypedRedux';
import { updateTimeRemaining, endGame } from '../../store/slices/gameSlice';
import { 
  TIMER_UPDATE_INTERVAL,
  TIMER_WARNING_THRESHOLD,
  TIMER_CRITICAL_THRESHOLD,
} from '../../constants/gameConstants';
import { DEFAULT_GAME_CONFIG } from '../../types/game.types';
import './Timer.css';

export const Timer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { timeRemaining, isPlaying } = useAppSelector((state) => state.game);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingRef = useRef(timeRemaining);

  // Update ref when timeRemaining changes
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    if (!isPlaying) return;
    
    if (timeRemaining === 0) {
      dispatch(endGame());
      return;
    }
    
    const decrementTimer = () => {
      const newTime = timeRemainingRef.current - 1;
      timeRemainingRef.current = newTime;
      dispatch(updateTimeRemaining(newTime));
    };
    
    intervalRef.current = setInterval(decrementTimer, TIMER_UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, timeRemaining, dispatch]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerClass = () => {
    if (timeRemaining <= TIMER_CRITICAL_THRESHOLD) return 'timer-critical';
    if (timeRemaining <= TIMER_WARNING_THRESHOLD) return 'timer-warning';
    return '';
  };

  return (
    <div className={`timer ${getTimerClass()}`} role="timer" aria-live="polite">
      <div className="timer-container">
        <h2 className="timer-label">Time</h2>
        <div className="timer-value" data-testid="timer-value">
          {formatTime(timeRemaining)}
        </div>
        <div className="timer-progress">
          <div 
            className="timer-progress-bar"
            style={{ width: `${(timeRemaining / DEFAULT_GAME_CONFIG.gameDuration) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};