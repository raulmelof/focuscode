import { renderHook, act } from '@testing-library/react-native';
import { useHomeViewModel } from '../useHomeViewModel';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.useFakeTimers();

describe('useHomeViewModel', () => {
  it('should format time correctly and calculate initial progress', () => {
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
    
    // Total is 60. Time left is 30. Progress is 0.5.
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

    const mockTask = { id: 1, title: 'Test Task', tag: 'Testing' };
    
    act(() => {
      result.current.selectTask(mockTask);
    });

    expect(result.current.selectedTask).toEqual(mockTask);
  });

  it('should manage create task modal visibility', () => {
    const { result } = renderHook(() => useHomeViewModel());
    
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

  it('should add a new task and close the create modal', () => {
    const { result } = renderHook(() => useHomeViewModel());
    const initialTasksCount = result.current.tasks.length;

    act(() => {
      result.current.openCreateTaskModal();
      result.current.addTask('Nova Tarefa Teste', 'Tag Teste');
    });

    expect(result.current.tasks.length).toBe(initialTasksCount + 1);
    expect(result.current.tasks[initialTasksCount].title).toBe('Nova Tarefa Teste');
    expect(result.current.tasks[initialTasksCount].tag).toBe('Tag Teste');
    
    expect(result.current.isCreateTaskModalVisible).toBe(false);
  });
});
