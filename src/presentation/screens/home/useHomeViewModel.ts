import { useState } from 'react';
import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';
import { Task } from '../../../utils/mockTasks';

export const useHomeViewModel = () => {
  const INITIAL_TIME = 1 * 60; // Deixei 1 minuto para testes, so mudar o 1 pra 60 pra ficar 1h
  const { timeLeft, isRunning, start, pause } = usePomodoro(INITIAL_TIME);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);

  const toggleTimer = () => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  };

  const openTaskModal = () => setIsTaskModalVisible(true);
  const closeTaskModal = () => setIsTaskModalVisible(false);
  const selectTask = (task: Task) => {
    setSelectedTask(task);
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
    selectedTask,
    isTaskModalVisible,
    openTaskModal,
    closeTaskModal,
    selectTask,
  };
};
