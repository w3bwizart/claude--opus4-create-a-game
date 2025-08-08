import { useState, useEffect, useCallback } from 'react';

export interface ModalState {
  showLeaderboard: boolean;
  showGameOverModal: boolean;
}

export const useModalManager = (isGameOver: boolean) => {
  const [modalState, setModalState] = useState<ModalState>({
    showLeaderboard: false,
    showGameOverModal: false,
  });

  useEffect(() => {
    if (isGameOver) {
      setModalState(prev => ({ ...prev, showGameOverModal: true }));
    }
  }, [isGameOver]);

  const openLeaderboard = useCallback(() => {
    setModalState(prev => ({ ...prev, showLeaderboard: true }));
  }, []);

  const closeLeaderboard = useCallback(() => {
    setModalState(prev => ({ ...prev, showLeaderboard: false }));
  }, []);

  const closeGameOverModal = useCallback(() => {
    setModalState(prev => ({
      showGameOverModal: false,
      showLeaderboard: true,
    }));
  }, []);

  return {
    ...modalState,
    openLeaderboard,
    closeLeaderboard,
    closeGameOverModal,
  };
};