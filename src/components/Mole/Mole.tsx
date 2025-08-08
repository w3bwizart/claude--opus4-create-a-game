import React, { useEffect } from 'react';
import { useAppDispatch } from '../../hooks/useTypedRedux';
import { whackMole, clearWhackedState } from '../../store/slices/gameSlice';
import { WHACK_ANIMATION_DURATION } from '../../constants/gameConstants';
import './Mole.css';

interface MoleProps {
  id: number;
  isActive: boolean;
  isWhacked: boolean;
  disabled: boolean;
}

export const Mole: React.FC<MoleProps> = ({ id, isActive, isWhacked, disabled }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isWhacked) return;
    
    const clearWhackAnimation = () => dispatch(clearWhackedState(id));
    const timeout = setTimeout(clearWhackAnimation, WHACK_ANIMATION_DURATION);

    return () => clearTimeout(timeout);
  }, [isWhacked, id, dispatch]);

  const handleWhack = () => {
    const canWhack = !disabled && isActive && !isWhacked;
    if (canWhack) {
      dispatch(whackMole(id));
    }
  };

  return (
    <div className="mole-hole">
      <button
        className={`mole ${isActive ? 'mole-active' : ''} ${isWhacked ? 'mole-whacked' : ''}`}
        onClick={handleWhack}
        disabled={disabled}
        aria-label={`Mole ${id + 1}`}
        data-testid={`mole-${id}`}
      >
        <div className="mole-sprite">
          {isWhacked ? '💥' : isActive ? '🐹' : ''}
        </div>
      </button>
      <div className="hole"></div>
    </div>
  );
};