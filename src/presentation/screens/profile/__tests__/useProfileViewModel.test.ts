import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useProfileViewModel } from '../useProfileViewModel';
import { TaskModel } from '../../../../data/models/TaskModel';
import { TagModel } from '../../../../data/models/TagModel';
import { useAuth } from '../../../../contexts/AuthContext';

// Mock AuthContext
const mockUser = { uid: 'test-user-uid-123' };
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: mockUser, isLoading: false })),
}));

// Mock TaskModel
jest.mock('../../../../data/models/TaskModel', () => ({
  TaskModel: {
    getCompletedTasksCount: jest.fn(),
    getCompletedTasks: jest.fn(),
  },
}));

// Mock TagModel
jest.mock('../../../../data/models/TagModel', () => ({
  TagModel: {
    getTags: jest.fn(),
  },
}));

describe('useProfileViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, isLoading: false });
    (TagModel.getTags as jest.Mock).mockResolvedValue([]);
  });

  it('should load completed count and tasks list on mount', async () => {
    (TaskModel.getCompletedTasksCount as jest.Mock).mockResolvedValue(5);
    (TaskModel.getCompletedTasks as jest.Mock).mockResolvedValue([
      { id: 1, title: 'Concluida 1', isCompleted: true, focusTimeMinutes: 25 },
      { id: 2, title: 'Concluida 2', isCompleted: true, focusTimeMinutes: 25 },
      { id: 3, title: 'Concluida 3', isCompleted: true, focusTimeMinutes: 25 },
      { id: 4, title: 'Concluida 4', isCompleted: true, focusTimeMinutes: 25 },
      { id: 5, title: 'Concluida 5', isCompleted: true } // undefined focusTimeMinutes, defaults to 25
    ]);

    const { result } = renderHook(() => useProfileViewModel());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.completedCount).toBe(5);
    expect(result.current.completedTasks).toHaveLength(5);
    expect(result.current.totalFocusTime).toBe(125); // 5 * 25
    expect(TaskModel.getCompletedTasksCount).toHaveBeenCalledWith('test-user-uid-123');
    expect(TaskModel.getCompletedTasks).toHaveBeenCalledWith('test-user-uid-123');
  });

  it('should lock all achievements when completed task count is 0', async () => {
    (TaskModel.getCompletedTasksCount as jest.Mock).mockResolvedValue(0);
    (TaskModel.getCompletedTasks as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProfileViewModel());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.achievements[0].unlocked).toBe(false); // Foco Inicial (>=1)
    expect(result.current.achievements[1].unlocked).toBe(false); // Primeiros Passos (>=10)
    expect(result.current.achievements[2].unlocked).toBe(false); // Mestre do Foco (>=25)
    expect(result.current.achievements[3].unlocked).toBe(false); // Foco Lendário (>=50)
  });

  it('should unlock Foco Inicial (>=1) but keep Primeiros Passos (>=10) locked when completed count is 5', async () => {
    (TaskModel.getCompletedTasksCount as jest.Mock).mockResolvedValue(5);
    (TaskModel.getCompletedTasks as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProfileViewModel());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.achievements[0].unlocked).toBe(true);  // Foco Inicial (>=1)
    expect(result.current.achievements[1].unlocked).toBe(false); // Primeiros Passos (>=10)
  });

  it('should unlock Primeiros Passos when completed count is 10', async () => {
    (TaskModel.getCompletedTasksCount as jest.Mock).mockResolvedValue(10);
    (TaskModel.getCompletedTasks as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProfileViewModel());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.achievements[0].unlocked).toBe(true);  // Foco Inicial (>=1)
    expect(result.current.achievements[1].unlocked).toBe(true);  // Primeiros Passos (>=10)
    expect(result.current.achievements[2].unlocked).toBe(false); // Mestre do Foco (>=25)
  });

  it('should manage details modal state', async () => {
    (TaskModel.getCompletedTasksCount as jest.Mock).mockResolvedValue(1);
    (TaskModel.getCompletedTasks as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useProfileViewModel());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isDetailsModalVisible).toBe(false);
    expect(result.current.selectedTask).toBeNull();

    const mockCompletedTask = { id: 99, title: 'Concluída Teste', isCompleted: true };
    
    // Open modal
    act(() => {
      result.current.openDetailsModal(mockCompletedTask);
    });
    expect(result.current.isDetailsModalVisible).toBe(true);
    expect(result.current.selectedTask).toEqual(mockCompletedTask);

    // Close modal
    act(() => {
      result.current.closeDetailsModal();
    });
    expect(result.current.isDetailsModalVisible).toBe(false);
    expect(result.current.selectedTask).toBeNull();
  });

  it('should clear state and return early when user is null', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false });
    const { result } = renderHook(() => useProfileViewModel());
    
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    // It will early return and NOT fetch tasks.
    // Wait for internal state updates to settle (though it doesn't set isLoading to false if user is null? Wait, isLoading defaults to true, and doesn't get set to false if user is null in the hook)
    // Let's check:
    expect(result.current.completedCount).toBe(0);
    expect(result.current.completedTasks).toEqual([]);
    expect(result.current.tags).toEqual([]);
    expect(result.current.selectedTask).toBeNull();
  });

  it('should catch error in fetchProfileData', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (TaskModel.getCompletedTasksCount as jest.Mock).mockRejectedValueOnce(new Error('Profile fetch error'));
    const { result } = renderHook(() => useProfileViewModel());
    
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.completedCount).toBe(0); // Kept default
    consoleSpy.mockRestore();
  });
});
