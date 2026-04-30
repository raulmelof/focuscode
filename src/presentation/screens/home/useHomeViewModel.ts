import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation'; 
import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';
import { MOCK_TASKS, Task } from '../../../utils/mockTasks';

export const useHomeViewModel = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const INITIAL_TIME = 1 * 60; 


  const { timeLeft, isRunning, start, pause, resetTimer } = usePomodoro({
    initialTimeInSeconds: INITIAL_TIME,
    onFocusEnd: () => handleFocusEnd(), 
  });

  
  const handleFocusEnd = useCallback(() => {
    navigation.navigate('BreakScreen');
    resetTimer(); 
  }, [navigation, resetTimer]); 

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);

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

  const openCreateTaskModal = () => setIsCreateTaskModalVisible(true);
  const closeCreateTaskModal = () => setIsCreateTaskModalVisible(false);

  const addTask = (title: string, tag: string) => {
    const newTask: Task = {
      id: Date.now(),
      title,
      tag,
    };
    setTasks([...tasks, newTask]);
    closeCreateTaskModal();
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
    tasks,
    selectedTask,
    isTaskModalVisible,
    openTaskModal,
    closeTaskModal,
    selectTask,
    isCreateTaskModalVisible,
    openCreateTaskModal,
    closeCreateTaskModal,
    addTask,
  };
};