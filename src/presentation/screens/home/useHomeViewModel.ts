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
  const INITIAL_TIME = 1 * 60; // 1 minuto para testes

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);
  const [isManageTagsModalVisible, setIsManageTagsModalVisible] = useState(false);
  const [isFlipEnabled, setIsFlipEnabled] = useState(Platform.OS !== 'web');

  const loadData = useCallback(async () => {
    try {
      await initDB();
      const [dbTasks, dbTags] = await Promise.all([
        TaskModel.getTasks(),
        TagModel.getTags()
      ]);
      
      setTasks(dbTasks.filter(t => !t.isCompleted));
      setTags(dbTags);
    } catch (error) {
      console.error('[ViewModel] Erro ao carregar dados:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFocusEnd = useCallback(async () => {
    if (selectedTask) {
      try {
        await TaskModel.updateTaskStatus(selectedTask.id, true);
        setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
        setSelectedTask(null);
      } catch (error) {
        console.error('[ViewModel] Erro ao concluir tarefa:', error);
      }
    }
    navigation.navigate('BreakScreen');
  }, [navigation, selectedTask]);

  const { timeLeft, isRunning, start, pause } = usePomodoro({
    initialTimeInSeconds: INITIAL_TIME,
    onFocusEnd: handleFocusEnd, 
  });

  const handlePauseFromSensor = useCallback(() => {
    pause();
    Alert.alert('Foco Pausado', 'O aparelho deve ficar com a tela virada para baixo.');
  }, [pause]);

  useFlipToFocus(isFlipEnabled, isRunning, start, handlePauseFromSensor);

  const toggleTimer = useCallback(() => {
    if (isRunning) pause(); else start();
  }, [isRunning, pause, start]);

  const openTaskModal = useCallback(() => setIsTaskModalVisible(true), []);
  const closeTaskModal = useCallback(() => setIsTaskModalVisible(false), []);
  
  const selectTask = useCallback((task: Task) => {
    setSelectedTask(task);
    closeTaskModal();
  }, [closeTaskModal]);

  const openCreateTaskModal = useCallback(() => setIsCreateTaskModalVisible(true), []);
  const closeCreateTaskModal = useCallback(() => setIsCreateTaskModalVisible(false), []);

  const openManageTagsModal = useCallback(() => setIsManageTagsModalVisible(true), []);
  const closeManageTagsModal = useCallback(() => setIsManageTagsModalVisible(false), []);

  const addTask = useCallback(async (title: string, tagId?: number) => {
    try {
      await TaskModel.insertTask(title, undefined, tagId);
      await loadData();
      closeCreateTaskModal();
    } catch {
      Alert.alert('Erro', 'Não foi possível criar a tarefa.');
    }
  }, [loadData, closeCreateTaskModal]);

  const addTag = useCallback(async (name: string, color: string) => {
    try {
      await TagModel.insertTag(name, color);
      await loadData();
    } catch (error) {
      console.error('[ViewModel] Erro ao adicionar tag:', error);
    }
  }, [loadData]);

  const updateTag = useCallback(async (id: number, name: string, color: string) => {
    try {
      await TagModel.updateTag(id, name, color);
      await loadData();
    } catch (error) {
      console.error('[ViewModel] Erro ao atualizar tag:', error);
    }
  }, [loadData]);

  const deleteTag = useCallback(async (id: number) => {
    try {
      await TagModel.deleteTag(id);
      await loadData();
    } catch (error) {
      console.error('[ViewModel] Erro ao deletar tag:', error);
    }
  }, [loadData]);

  return {
    formattedTime: formatTime(timeLeft),
    isRunning,
    buttonTitle: isRunning ? "PAUSAR FOCO" : "INICIAR FOCO",
    toggleTimer,
    progress: 1 - (timeLeft / INITIAL_TIME),
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