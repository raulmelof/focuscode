import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';

export const useHomeViewModel = () => {
  const INITIAL_TIME = 1 * 60; // Deixei 1 minuto para testes, so mudar o 1 pra 60 pra ficar 1h
  const { timeLeft, isRunning, start, pause } = usePomodoro(INITIAL_TIME);

  const toggleTimer = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const formattedTime = formatTime(timeLeft);
  const buttonTitle = isRunning ? "PAUSAR FOCO" : "INICIAR FOCO";
  const progress = 1 - (timeLeft / INITIAL_TIME);

  return {
    formattedTime,
    isRunning,
    buttonTitle,
    toggleTimer,
    progress,
  };
};
