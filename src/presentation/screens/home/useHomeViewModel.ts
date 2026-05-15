import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation';
import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';
import { useFlipToFocus } from '../../../hooks/useFlipToFocus';
import { useAuth } from '../../../contexts/AuthContext';
import { TaskModel } from '../../../data/models/TaskModel';
import { TagModel } from '../../../data/models/TagModel';
import { Task } from '../../../types/Task';
import { Tag } from '../../../types/Tag';
import { initDB } from '../../../data/database/database';

export const useHomeViewModel = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { user } = useAuth();
  const INITIAL_TIME = 1 * 60;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);
  const [isManageTagsModalVisible, setIsManageTagsModalVisible] = useState(false);
  const [isTaskDetailsModalVisible, setIsTaskDetailsModalVisible] = useState(false);
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [isFocusSummaryModalVisible, setIsFocusSummaryModalVisible] = useState(false);
  const [lastCompletedTask, setLastCompletedTask] = useState<Task | null>(null);
  const [isFlipEnabled, setIsFlipEnabled] = useState(Platform.OS !== 'web');

  // Load tasks and tags from local DB filtered by logged user
  // When user is null (logout), clear UI cache automatically
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      setTags([]);
      return;
    }
    try {
      await initDB();
      const [localTasks, dbTags] = await Promise.all([
        TaskModel.getTasks(user.uid),
        TagModel.getTags(user.uid),
      ]);
      setTasks(localTasks.filter(t => !t.isCompleted));
      setTags(dbTags);
    } catch (error) {
      console.error('useHomeViewModel: Error fetching tasks:', error);
    }
  }, [user]);

  // Re-run whenever user changes (login/logout)
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleFocusEnd = useCallback(async () => {
    if (selectedTask && user) {
      try {
        const completedTask = { ...selectedTask, isCompleted: true };
        setLastCompletedTask(completedTask);
        await TaskModel.updateTaskStatus(user.uid, selectedTask.id, true);
        
        // Remove da lista de ativos
        setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
        setSelectedTask(null);
        
        // Em vez de navegar direto, mostra o modal de resumo
        setIsFocusSummaryModalVisible(true);
      } catch (error) {
        console.error('[ViewModel] Error completing task:', error);
        navigation.navigate('BreakScreen');
      }
    } else {
      navigation.navigate('BreakScreen');
    }
  }, [navigation, selectedTask, user]);

  const goToBreak = useCallback(() => {
    setIsFocusSummaryModalVisible(false);
    navigation.navigate('BreakScreen');
  }, [navigation]);

  const { timeLeft, isRunning, start, pause } = usePomodoro({
    initialTimeInSeconds: INITIAL_TIME,
    onFocusEnd: () => handleFocusEnd(),
  });

  // Sensors to trigger function when device is flipped or pause when moved
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

  const openTaskDetailsModal = useCallback(() => setIsTaskDetailsModalVisible(true), []);
  const closeTaskDetailsModal = useCallback(() => setIsTaskDetailsModalVisible(false), []);

  const openCameraModal = useCallback(() => setIsCameraModalVisible(true), []);
  const closeCameraModal = useCallback(() => setIsCameraModalVisible(false), []);

  const handleCaptureSummary = useCallback(async (uri: string) => {
    const taskToUpdate = isFocusSummaryModalVisible ? lastCompletedTask : selectedTask;
    
    if (!taskToUpdate || !user || !taskToUpdate.id) {
      console.error('[ViewModel] Missing data for summary update');
      return;
    }
    
    try {
      await TaskModel.updateTaskSummary(user.uid, taskToUpdate.id, uri);
      
      const updatedTask = { ...taskToUpdate, summaryImageUri: uri };
      
      if (isFocusSummaryModalVisible) {
        setLastCompletedTask(updatedTask);
      } else {
        setSelectedTask(updatedTask);
        setTasks(prev => prev.map(t => t.id === taskToUpdate.id ? updatedTask : t));
      }
    } catch (error) {
      console.error('[ViewModel] Error updating task summary:', error);
      Alert.alert('Erro', 'Não foi possível salvar a imagem.');
    }
  }, [selectedTask, lastCompletedTask, user, isFocusSummaryModalVisible]);

  // Persist new task in SQLite linked to user.uid and reload list
  const addTask = useCallback(async (title: string, tagId?: number) => {
    if (!user) {
      Alert.alert('Erro', 'Nenhum usuario autenticado.');
      return;
    }
    try {
      await TaskModel.insertTask(user.uid, title, undefined, tagId);
      await fetchTasks();
      closeCreateTaskModal();
    } catch (error) {
      console.error('useHomeViewModel: Error creating task:', error);
      Alert.alert('Erro', 'Não foi possível salvar a tarefa.');
    }
  }, [user, fetchTasks, closeCreateTaskModal]);

  const addTag = useCallback(async (name: string, color: string) => {
    if (!user) return;
    try {
      await TagModel.insertTag(user.uid, name, color);
      await fetchTasks();
    } catch (error) {
      console.error('[ViewModel] Error adding tag:', error);
    }
  }, [user, fetchTasks]);

  const updateTag = useCallback(async (id: number, name: string, color: string) => {
    if (!user) return;
    try {
      await TagModel.updateTag(user.uid, id, name, color);
      await fetchTasks();
    } catch (error) {
      console.error('[ViewModel] Error updating tag:', error);
    }
  }, [user, fetchTasks]);

  const deleteTag = useCallback(async (id: number) => {
    if (!user) return;
    try {
      await TagModel.deleteTag(user.uid, id);
      await fetchTasks();
    } catch (error) {
      console.error('[ViewModel] Error deleting tag:', error);
    }
  }, [user, fetchTasks]);

  const deleteTask = useCallback(async (id: number) => {
    if (!user) return;
    try {
      await TaskModel.deleteTask(user.uid, id);
      await fetchTasks();
      if (selectedTask?.id === id) {
        setSelectedTask(null);
      }
    } catch (error) {
      console.error('[ViewModel] Error deleting task:', error);
      Alert.alert('Erro', 'Não foi possível excluir a tarefa.');
    }
  }, [user, fetchTasks, selectedTask]);

  return {
    formattedTime: formatTime(timeLeft),
    isRunning,
    buttonTitle: isRunning ? 'PAUSAR FOCO' : 'INICIAR FOCO',
    toggleTimer,
    progress: 1 - timeLeft / INITIAL_TIME,
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
    deleteTask,
    isTaskDetailsModalVisible,
    openTaskDetailsModal,
    closeTaskDetailsModal,
    isCameraModalVisible,
    openCameraModal,
    closeCameraModal,
    handleCaptureSummary,
    isFocusSummaryModalVisible,
    lastCompletedTask,
    goToBreak,
    isFlipEnabled,
    setIsFlipEnabled,
  };
};
