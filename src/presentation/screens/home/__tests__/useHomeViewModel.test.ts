import { renderHook, act } from '@testing-library/react-native';
import { useHomeViewModel } from '../useHomeViewModel';
import { TaskModel } from '../../../../data/models/TaskModel';
import { TagModel } from '../../../../data/models/TagModel';

// Mock do Navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock do Sensors
jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    removeAllListeners: jest.fn(),
  },
}));

// Mock do Banco de Dados / Modelos
jest.mock('../../../../data/models/TaskModel');
jest.mock('../../../../data/models/TagModel');
jest.mock('../../../../data/database/database', () => ({
  initDB: jest.fn().mockResolvedValue(true),
  getDBConnection: jest.fn().mockResolvedValue({}),
}));

jest.useFakeTimers();

describe('useHomeViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (TaskModel.getTasks as jest.Mock).mockResolvedValue([]);
    (TagModel.getTags as jest.Mock).mockResolvedValue([]);
  });

  it('should format time correctly and calculate initial progress', async () => {
    const { result } = renderHook(() => useHomeViewModel());
    
    expect(result.current.formattedTime).toBe('01:00');
    expect(result.current.progress).toBe(0);
    expect(result.current.buttonTitle).toBe('INICIAR FOCO');
  });

  it('should toggle timer and update progress', () => {
    const { result } = renderHook(() => useHomeViewModel());
    
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

  it('should manage task modal visibility', () => {
    const { result } = renderHook(() => useHomeViewModel());
    
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

  it('should handle task selection', () => {
    const { result } = renderHook(() => useHomeViewModel());
    
    expect(result.current.selectedTask).toBeNull();

    const mockTask = { id: 1, title: 'Test Task', tagId: 1 };
    
    act(() => {
      result.current.selectTask(mockTask as any);
    });

    expect(result.current.selectedTask).toEqual(mockTask);
  });

  it('should add a new task and reload data', async () => {
    (TaskModel.insertTask as jest.Mock).mockResolvedValue({ lastInsertRowId: 1 });
    const { result } = renderHook(() => useHomeViewModel());

    await act(async () => {
      await result.current.addTask('Nova Tarefa Teste', 1);
    });

    expect(TaskModel.insertTask).toHaveBeenCalledWith('Nova Tarefa Teste', undefined, 1);
    expect(TaskModel.getTasks).toHaveBeenCalled();
    expect(result.current.isCreateTaskModalVisible).toBe(false);
  });
});
