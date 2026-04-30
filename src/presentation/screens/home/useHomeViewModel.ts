import { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation'; 
import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';
import { Task, MOCK_TASKS } from '../../../utils/mockTasks'; 

export const useHomeViewModel = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const INITIAL_TIME = 1 * 60; 

  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);


  const pomodoro = usePomodoro({
    initialTimeInSeconds: INITIAL_TIME,
    onFocusEnd: () => handleFocusEnd(),
  });

  const { timeLeft, isRunning, start, pause, resetTimer } = pomodoro;

  const handleFocusEnd = useCallback(() => {
    if (selectedTask) {
      setTasks(prevTasks => 
        prevTasks.map(t => t.id === selectedTask.id ? { ...t, completed: true } : t)
      );
    }
    
    navigation.navigate('BreakScreen');
    resetTimer(); 
  }, [navigation, resetTimer, selectedTask]);

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

  const openCreateTaskModal = () => setIsCreateTaskModalVisible(true);
  const closeCreateTaskModal = () => setIsCreateTaskModalVisible(false);

  const addTask = (title: string, tag: string) => {
    setTasks(prevTasks => [
      ...prevTasks,
      {
        id: prevTasks.length ? Math.max(...prevTasks.map(task => task.id)) + 1 : 1,
        title,
        tag,
      },
    ]);
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
    setTasks,
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