import { useState, useCallback, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation';
import { usePomodoro } from '../../../hooks/usePomodoro';
import { formatTime } from '../../../utils/formatTime';
import { useFlipToFocus } from '../../../hooks/useFlipToFocus';
import { useAuth } from '../../../contexts/AuthContext';
import { TaskModel } from '../../../data/models/TaskModel';
import { Task } from '../../../types/Task';

export const useHomeViewModel = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const INITIAL_TIME = 1 * 60;

  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isCreateTaskModalVisible, setIsCreateTaskModalVisible] = useState(false);
  const [isFlipEnabled, setIsFlipEnabled] = useState(Platform.OS !== 'web');

  // Carrega as tarefas do banco local filtrando pelo usuário logado.
  // Quando user é null (logout), limpa o cache da UI automaticamente.
  const fetchTasks = useCallback(async () => {
    if (!user) {
      setTasks([]);
      return;
    }
    try {
      const localTasks = await TaskModel.getTasks(user.uid);
      setTasks(localTasks);
    } catch (error) {
      console.error('useHomeViewModel: Erro ao buscar tarefas:', error);
    }
  }, [user]);

  // Re-executa sempre que o usuário mudar (login/logout)
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  const handleFocusEnd = useCallback(() => {
    navigation.navigate('BreakScreen');
    resetTimer();
  }, [navigation, resetTimer]);

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

  // Persiste a nova tarefa no SQLite vinculada ao user.uid e recarrega a lista
  const addTask = async (title: string, _tag: string) => {
    if (!user) {
      Alert.alert('Erro', 'Nenhum usuário autenticado.');
      return;
    }
    try {
      await TaskModel.insertTask(user.uid, title);
      await fetchTasks();
      closeCreateTaskModal(); // Fecha o modal apenas em caso de sucesso
    } catch (error) {
      console.error('useHomeViewModel: Erro ao criar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível salvar a tarefa.');
      // Modal permanece aberto para o usuário tentar novamente
    }
  };

  const formattedTime = formatTime(timeLeft);
  const buttonTitle = isRunning ? 'PAUSAR FOCO' : 'INICIAR FOCO';
  const progress = 1 - timeLeft / INITIAL_TIME;

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
    isFlipEnabled,
    setIsFlipEnabled,
  };
};