import { renderHook, act } from '@testing-library/react-hooks';
import { useHomeViewModel } from '../useHomeViewModel';

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
});
