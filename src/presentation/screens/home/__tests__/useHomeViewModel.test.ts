import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHomeViewModel } from '../useHomeViewModel';
import { TaskModel } from '../../../../data/models/TaskModel';
import { Task } from '../../../../types/Task';
import { useAuth } from '../../../../contexts/AuthContext';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  },
}));

// Mock do AuthContext para retornar um usuário de teste
const mockUser = { uid: 'test-user-uid-123' };
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: mockUser, isLoading: false })),
}));

// Mock do TaskModel para não tocar no banco real
jest.mock('../../../../data/models/TaskModel', () => ({
  TaskModel: {
    getTasks: jest.fn(),
    insertTask: jest.fn(),
  },
}));

jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });

const MOCK_TASKS: Task[] = [
  { id: 1, title: 'Estudar React', isCompleted: false },
  { id: 2, title: 'Fazer exercícios', isCompleted: false },
];

describe('useHomeViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restaura o useAuth para retornar o usuário logado a cada teste
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, isLoading: false });
    // Por padrão, getTasks retorna a lista mock
    (TaskModel.getTasks as jest.Mock).mockResolvedValue(MOCK_TASKS);
    (TaskModel.insertTask as jest.Mock).mockResolvedValue(3);
  });

  it('should format time correctly and calculate initial progress', async () => {
    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => {
      expect(result.current.formattedTime).toBe('01:00');
    });
    expect(result.current.progress).toBe(0);
    expect(result.current.buttonTitle).toBe('INICIAR FOCO');
  });

  it('should load tasks from TaskModel on mount for the logged user', async () => {
    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(2);
    });
    expect(TaskModel.getTasks).toHaveBeenCalledWith('test-user-uid-123');
  });

  it('should clear tasks when user is null (logout cache cleanup)', async () => {
    const { useAuth } = require('../../../../contexts/AuthContext');
    // Simula logout: user = null
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false });

    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(0);
    });
    expect(TaskModel.getTasks).not.toHaveBeenCalled();
  });

  it('should toggle timer and update progress', async () => {
    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    act(() => {
      result.current.toggleTimer();
    });
    expect(result.current.isRunning).toBe(true);
    expect(result.current.buttonTitle).toBe('PAUSAR FOCO');

    act(() => {
      jest.advanceTimersByTime(30000); // 30 seconds
    });

    expect(result.current.formattedTime).toBe('00:30');
    expect(result.current.progress).toBe(0.5);
  });

  it('should manage task modal visibility', async () => {
    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    expect(result.current.isTaskModalVisible).toBe(false);

    act(() => {
      result.current.openTaskModal();
    });
    expect(result.current.isTaskModalVisible).toBe(true);

    act(() => {
      result.current.closeTaskModal();
    });
    expect(result.current.isTaskModalVisible).toBe(false);
  });

  it('should handle task selection', async () => {
    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    expect(result.current.selectedTask).toBeNull();

    act(() => {
      result.current.selectTask(MOCK_TASKS[0]);
    });

    expect(result.current.selectedTask).toEqual(MOCK_TASKS[0]);
  });

  it('should manage create task modal visibility', async () => {
    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    expect(result.current.isCreateTaskModalVisible).toBe(false);

    act(() => {
      result.current.openCreateTaskModal();
    });
    expect(result.current.isCreateTaskModalVisible).toBe(true);

    act(() => {
      result.current.closeCreateTaskModal();
    });
    expect(result.current.isCreateTaskModalVisible).toBe(false);
  });

  it('should add a new task via TaskModel and refresh the list', async () => {
    const updatedTasks: Task[] = [
      ...MOCK_TASKS,
      { id: 3, title: 'Nova Tarefa Teste', isCompleted: false },
    ];
    // Na segunda chamada (após insertTask), retorna a lista atualizada
    (TaskModel.getTasks as jest.Mock)
      .mockResolvedValueOnce(MOCK_TASKS)
      .mockResolvedValueOnce(updatedTasks);

    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    await act(async () => {
      await result.current.addTask('Nova Tarefa Teste', 'Tag Teste');
    });

    // Deve ter chamado insertTask com o userId correto
    expect(TaskModel.insertTask).toHaveBeenCalledWith(
      'test-user-uid-123',
      'Nova Tarefa Teste'
    );

    // A lista deve ter sido recarregada do banco
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(3);
    });
    expect(result.current.isCreateTaskModalVisible).toBe(false);
  });
});
