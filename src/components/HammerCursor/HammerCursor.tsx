import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks/useTypedRedux';
import './HammerCursor.css';

export const HammerCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const isPlaying = useAppSelector((state) => state.game.isPlaying);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => {
      setIsClicking(true);
    };

    const handleMouseUp = () => {
      setIsClicking(false);
    };

    if (isPlaying) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPlaying]);

  if (!isPlaying) return null;

  return (
    <div 
      className={`hammer-cursor ${isClicking ? 'hammer-swinging' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      🔨
    </div>
  );
};