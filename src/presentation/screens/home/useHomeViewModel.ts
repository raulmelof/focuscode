import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation'; 
import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';
import { Task } from '../../../types/Task';
import { Tag } from '../../../types/Tag';
import { TaskModel } from '../../../data/models/TaskModel';
import { TagModel } from '../../../data/models/TagModel';
import { initDB } from '../../../data/database/database';
import { useFlipToFocus } from '../../../hooks/useFlipToFocus';

export const useHomeViewModel = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const INITIAL_TIME = 1 * 60; 

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);
  const [isManageTagsModalVisible, setIsManageTagsModalVisible] = useState(false);
  const [isFlipEnabled, setIsFlipEnabled] = useState(Platform.OS !== 'web');

  const loadData = async () => {
    try {
      await initDB();
      const dbTasks = await TaskModel.getTasks();
      const dbTags = await TagModel.getTags();
      
      setTasks(dbTasks.filter(t => !t.isCompleted));
      setTags(dbTags);
    } catch (error) {
      console.error('Erro ao carregar dados do banco:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Desestruturação direta do hook em uma única etapa
  const { timeLeft, isRunning, start, pause, resetTimer } = usePomodoro({
    initialTimeInSeconds: INITIAL_TIME,
    onFocusEnd: () => handleFocusEnd(), 
  });

  // Sensores para ativar função quando celular é virado de cabeça para baixo ou pausar quando movido
  
  const handlePauseFromSensor = useCallback(() => {
    pause();
    Alert.alert('Foco Pausado', 'Você moveu o celular! O aparelho deve ficar com a tela virada para baixo.');
  }, [pause]);

  useFlipToFocus(isFlipEnabled, isRunning, start, handlePauseFromSensor);


  const handleFocusEnd = useCallback(async () => {
    if (selectedTask) {
      try {
        await TaskModel.updateTaskStatus(selectedTask.id, true);
        setTasks(prevTasks => prevTasks.filter(t => t.id !== selectedTask.id));
        setSelectedTask(null);
      } catch (error) {
        console.error('Erro ao atualizar status da tarefa:', error);
      }
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

  const openManageTagsModal = () => setIsManageTagsModalVisible(true);
  const closeManageTagsModal = () => setIsManageTagsModalVisible(false);

  const addTask = async (title: string, tagId?: number) => {
    try {
      await TaskModel.insertTask(title, undefined, tagId);
      await loadData();
      closeCreateTaskModal();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível criar a tarefa.');
    }
  };

  const addTag = async (name: string, color: string) => {
    await TagModel.insertTag(name, color);
    await loadData();
  };

  const updateTag = async (id: number, name: string, color: string) => {
    await TagModel.updateTag(id, name, color);
    await loadData();
  };

  const deleteTag = async (id: number) => {
    await TagModel.deleteTag(id);
    await loadData();
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
    tags,
    selectedTask,
    isTaskModalVisible,
    openTaskModal,
    closeTaskModal,
    selectTask,
    isCreateTaskModalVisible,
    openCreateTaskModal,
    closeCreateTaskModal,
    addTask,
    isManageTagsModalVisible,
    openManageTagsModal,
    closeManageTagsModal,
    addTag,
    updateTag,
    deleteTag,
    isFlipEnabled,
    setIsFlipEnabled,
  };
};