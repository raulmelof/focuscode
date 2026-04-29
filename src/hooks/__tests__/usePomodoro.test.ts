import { renderHook, act } from '@testing-library/react';
import { usePomodoro } from '../usePomodoro';

jest.useFakeTimers();

describe('usePomodoro', () => {
  it('should initialize with default time', () => {
    const { result } = renderHook(() => usePomodoro());
    expect(result.current.timeLeft).toBe(1500); // 25 * 60
    expect(result.current.isRunning).toBe(false);
  });

  it('should start and stop timer', () => {
    const { result } = renderHook(() => usePomodoro(60));
    
    act(() => {
      result.current.start();
    });
    expect(result.current.isRunning).toBe(true);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(59);

    act(() => {
      result.current.pause();
    });
    expect(result.current.isRunning).toBe(false);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(59); // unchanged
  });

  it('should reset timer', () => {
    const { result } = renderHook(() => usePomodoro(60));
    act(() => {
      result.current.start();
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.timeLeft).toBe(59);

    act(() => {
      result.current.stop();
    });
    expect(result.current.timeLeft).toBe(60);
    expect(result.current.isRunning).toBe(false);
  });
});
