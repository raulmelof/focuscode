import { renderHook, act } from '@testing-library/react-native';
import { usePomodoro } from '../usePomodoro';

describe('usePomodoro', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve inicializar com o tempo correto', () => {
    const { result } = renderHook(() => usePomodoro({ initialTimeInSeconds: 60 }));
    
    expect(result.current.timeLeft).toBe(60);
    expect(result.current.isRunning).toBe(false);
  });

  it('deve decrementar o tempo quando estiver rodando', () => {
    const { result } = renderHook(() => usePomodoro({ initialTimeInSeconds: 60 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe(59);
  });

  it('deve disparar onFocusEnd quando o tempo zerar', () => {
    const mockOnFocusEnd = jest.fn();
    const { result } = renderHook(() => usePomodoro({ 
      initialTimeInSeconds: 1, 
      onFocusEnd: mockOnFocusEnd 
    }));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe(0);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(mockOnFocusEnd).toHaveBeenCalledTimes(1);
  });
});