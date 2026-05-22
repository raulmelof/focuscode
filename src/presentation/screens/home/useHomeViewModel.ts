import { useState, useCallback, useEffect, useRef } from 'react';
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
import { SyncService } from '../../../services/SyncService';
import { useSettings, getGlobalIsFlipEnabled, setGlobalIsFlipEnabled, flipListeners } from '../../../hooks/useSettings';
import { useFocusEffect } from '@react-navigation/native';

export const useHomeViewModel = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { user } = useAuth();
  const { settings, loadSettings, saveSettings, isLoading } = useSettings();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const selectedTaskRef = useRef(selectedTask);
  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);
  const [isManageTagsModalVisible, setIsManageTagsModalVisible] = useState(false);
  const [isTaskDetailsModalVisible, setIsTaskDetailsModalVisible] = useState(false);
  const [isCameraModalVisible, setIsCameraModalVisible] = useState(false);
  const [isFocusSummaryModalVisible, setIsFocusSummaryModalVisible] = useState(false);
  const [lastCompletedTask, setLastCompletedTask] = useState<Task | null>(null);

  const [isFlipEnabled, setIsFlipEnabledState] = useState(getGlobalIsFlipEnabled());

  useEffect(() => {
    const listener = (val: boolean) => {
      setIsFlipEnabledState(val);
    };
    flipListeners.add(listener);
    return () => {
      flipListeners.delete(listener);
    };
  }, []);

  const setIsFlipEnabled = useCallback((value: boolean) => {
    setGlobalIsFlipEnabled(value);
  }, []);

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

      const currentSelected = selectedTaskRef.current;
      if (currentSelected) {
        const updated = localTasks.find(t => t.id === currentSelected.id);
        if (updated && (updated.focusTimeMinutes !== currentSelected.focusTimeMinutes || updated.title !== currentSelected.title)) {
          setSelectedTask(updated);
        }
      }
    } catch (error) {
      console.error('useHomeViewModel: Error fetching tasks:', error);
    }
  }, [user]);

  // Re-run whenever user changes (login/logout)
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      fetchTasks();
    }, [loadSettings, fetchTasks])
  );

  const handleFocusEnd = useCallback(async () => {
    if (selectedTask && user) {
      try {
        // Salva o tempo de foco usado da configuração atual na tarefa
        await TaskModel.updateTaskFocusTime(user.uid, selectedTask.id, settings.focusTimeMinutes);

        const completedTask = { ...selectedTask, isCompleted: true, focusTimeMinutes: settings.focusTimeMinutes };
        setLastCompletedTask(completedTask);
        await TaskModel.updateTaskStatus(user.uid, selectedTask.id, true);

        // Remove da lista de ativos
        setTasks(prev => prev.filter(t => t.id !== selectedTask.id));
        setSelectedTask(null);

        // Em vez de navegar direto, mostra o modal de resumo
        setIsFocusSummaryModalVisible(true);

        // Dispara sincronização em background
        SyncService.sync().catch(err => console.error('[ViewModel] Error syncing completed task:', err));
      } catch (error) {
        console.error('[ViewModel] Error completing task:', error);
        navigation.navigate('BreakScreen');
      }
    } else {
      navigation.navigate('BreakScreen');
    }
  }, [navigation, selectedTask, user, settings]);

  const goToBreak = useCallback(() => {
    setIsFocusSummaryModalVisible(false);
    navigation.navigate('BreakScreen');
  }, [navigation]);

  const INITIAL_TIME = settings?.focusTimeMinutes ? settings.focusTimeMinutes * 60 : 25 * 60;

  const { timeLeft, isRunning, start, pause, resetTimer } = usePomodoro({
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
    if (!selectedTask && !isRunning) {
      Alert.alert(
        'Selecione uma Tarefa',
        'Por favor, selecione uma tarefa para iniciar o foco.'
      );
      return;
    }
    if (isRunning) pause(); else start();
  }, [isRunning, pause, start, selectedTask]);

  const openTaskModal = useCallback(() => setIsTaskModalVisible(true), []);
  const closeTaskModal = useCallback(() => setIsTaskModalVisible(false), []);

  const selectTask = useCallback((task: Task) => {
    setSelectedTask(task);
    resetTimer();
    closeTaskModal();
  }, [closeTaskModal, resetTimer]);

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

      // Dispara sincronização em background (para fazer upload da imagem em Base64 compactada)
      SyncService.sync().catch(err => console.error('[ViewModel] Error syncing task summary:', err));
    } catch (error) {
      console.error('[ViewModel] Error updating task summary:', error);
      Alert.alert('Erro', 'Não foi possível salvar a imagem.');
    }
  }, [selectedTask, lastCompletedTask, user, isFocusSummaryModalVisible]);

  // Persist new task in SQLite linked to user.uid and reload list
  const addTask = useCallback(async (title: string, tagId?: number, focusTimeMinutes?: number) => {
    if (!user) {
      Alert.alert('Erro', 'Nenhum usuario autenticado.');
      return;
    }
    try {
      await TaskModel.insertTask(user.uid, title, undefined, tagId, focusTimeMinutes ?? 25);
      await fetchTasks();
      closeCreateTaskModal();

      // Dispara sincronização em background
      SyncService.sync().catch(err => console.error('[ViewModel] Error syncing new task:', err));
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

      // Dispara sincronização em background
      SyncService.sync().catch(err => console.error('[ViewModel] Error syncing new tag:', err));
    } catch (error) {
      console.error('[ViewModel] Error adding tag:', error);
    }
  }, [user, fetchTasks]);

  const updateTag = useCallback(async (id: number, name: string, color: string) => {
    if (!user) return;
    try {
      await TagModel.updateTag(user.uid, id, name, color);
      await fetchTasks();

      // Dispara sincronização em background
      SyncService.sync().catch(err => console.error('[ViewModel] Error syncing updated tag:', err));
    } catch (error) {
      console.error('[ViewModel] Error updating tag:', error);
    }
  }, [user, fetchTasks]);

  const deleteTag = useCallback(async (id: number) => {
    if (!user) return;
    try {
      await TagModel.deleteTag(user.uid, id);
      await fetchTasks();

      // Dispara sincronização em background
      SyncService.sync().catch(err => console.error('[ViewModel] Error syncing deleted tag:', err));
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

      // Dispara sincronização em background
      SyncService.sync().catch(err => console.error('[ViewModel] Error syncing deleted task:', err));
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
    progress: Math.max(0, Math.min(1, 1 - timeLeft / INITIAL_TIME)),
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

