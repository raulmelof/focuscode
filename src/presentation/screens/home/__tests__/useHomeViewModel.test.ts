import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useHomeViewModel } from '../useHomeViewModel';
import { TaskModel } from '../../../../data/models/TaskModel';
import { TagModel } from '../../../../data/models/TagModel';
import { Task } from '../../../../types/Task';
import { useAuth } from '../../../../contexts/AuthContext';

// Mock Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  useFocusEffect: (cb: () => void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react').useEffect(() => {
      cb();
    }, []);
  },
}));

// Mock useSettings
jest.mock('../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      focusTimeMinutes: 1,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      isFlipEnabled: true,
    },
    loadSettings: jest.fn(),
    saveSettings: jest.fn().mockResolvedValue(true),
  }),
  getGlobalIsFlipEnabled: () => true,
  setGlobalIsFlipEnabled: jest.fn(),
  flipListeners: new Set(),
}));

// Mock SyncService to prevent real Firebase dependency imports
jest.mock('../../../../services/SyncService', () => ({
  SyncService: {
    sync: jest.fn().mockResolvedValue(true)
  }
}));

// Mock Sensors
jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  },
}));

// Mock AuthContext to return a test user
const mockUser = { uid: 'test-user-uid-123' };
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: mockUser, isLoading: false })),
}));

// Mock TaskModel and TagModel
jest.mock('../../../../data/models/TaskModel', () => ({
  TaskModel: {
    getTasks: jest.fn(),
    insertTask: jest.fn(),
    updateTaskStatus: jest.fn(),
  },
}));

jest.mock('../../../../data/models/TagModel', () => ({
  TagModel: {
    getTags: jest.fn(),
    insertTag: jest.fn(),
    updateTag: jest.fn(),
    deleteTag: jest.fn(),
  },
}));

jest.mock('../../../../data/database/database', () => ({
  initDB: jest.fn().mockResolvedValue(true),
  getDBConnection: jest.fn().mockResolvedValue({}),
}));

jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });

const MOCK_TASKS: Task[] = [
  { id: 1, title: 'Estudar React', isCompleted: false },
  { id: 2, title: 'Fazer exercicios', isCompleted: false },
];

describe('useHomeViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Restore useAuth to return the logged user for each test
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, isLoading: false });
    // Default mock returns
    (TaskModel.getTasks as jest.Mock).mockResolvedValue(MOCK_TASKS);
    (TagModel.getTags as jest.Mock).mockResolvedValue([]);
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
      result.current.selectTask(MOCK_TASKS[0]);
    });

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
    
    let hasInserted = false;
    (TaskModel.insertTask as jest.Mock).mockImplementationOnce(async () => {
      hasInserted = true;
      return 3;
    });
    
    (TaskModel.getTasks as jest.Mock).mockImplementation(() => {
      return Promise.resolve(hasInserted ? updatedTasks : MOCK_TASKS);
    });

    const { result } = renderHook(() => useHomeViewModel());

    await waitFor(() => expect(result.current.tasks).toHaveLength(2));

    await act(async () => {
      await result.current.addTask('Nova Tarefa Teste', 1);
    });

    // Should call insertTask with correct userId and tagId in correct position
    expect(TaskModel.insertTask).toHaveBeenCalledWith(
      'test-user-uid-123',
      'Nova Tarefa Teste',
      undefined,
      1,
      25
    );

    // List should reload from DB
    await waitFor(() => {
      expect(result.current.tasks).toHaveLength(3);
    });
    expect(result.current.isCreateTaskModalVisible).toBe(false);
  });
});
