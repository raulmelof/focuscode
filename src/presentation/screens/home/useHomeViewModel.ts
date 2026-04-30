import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation'; 
import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';
import { Task, MOCK_TASKS } from '../../../utils/mockTasks'; // Importei mockTasks aqui

export const useHomeViewModel = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const INITIAL_TIME = 1 * 60; 

  // --- ESTADOS ---
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS); // Declarando o estado das tarefas
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);

  // --- LOGICA DO POMODORO ---
  const { timeLeft, isRunning, start, pause, resetTimer } = usePomodoro({
    initialTimeInSeconds: INITIAL_TIME,
    onFocusEnd: () => handleFocusEnd(), 
  });

  const handleFocusEnd = useCallback(() => {
    // Exemplo: Marcar a tarefa atual como concluída se houver uma selecionada
    if (selectedTask) {
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === selectedTask.id ? { ...t, completed: true } : t)
      );
    }
    
    navigation.navigate('BreakScreen');
    resetTimer(); 
  }, [navigation, resetTimer, selectedTask]); // Adicionada dependência do selectedTask

  // --- AÇÕES ---
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
    closeTaskModal();
  };

  const formattedTime = formatTime(timeLeft);
  const buttonTitle = isRunning ? "PAUSAR FOCO" : "INICIAR FOCO";
  const progress = 1 - (timeLeft / INITIAL_TIME);

  // --- RETORNO ---
  return {
    formattedTime,
    isRunning,
    buttonTitle,
    toggleTimer,
    progress,
    tasks,         // Agora o TS encontra 'tasks'
    setTasks,      // Agora o TS encontra 'setTasks'
    selectedTask,
    isTaskModalVisible,
    openTaskModal,
    closeTaskModal,
    selectTask,
  };
};