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

  it('deve zerar o tempo corretamente mesmo sem onFocusEnd', () => {
    const { result } = renderHook(() => usePomodoro({ 
      initialTimeInSeconds: 1
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
    
    expect(result.current.isRunning).toBe(false);
  });

  it('deve pausar o timer', () => {
    const { result } = renderHook(() => usePomodoro({ initialTimeInSeconds: 60 }));

    act(() => {
      result.current.start();
    });
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.timeLeft).toBe(59);

    act(() => {
      result.current.pause();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.timeLeft).toBe(59);
    expect(result.current.isRunning).toBe(false);
  });

  it('deve parar o timer e resetar o tempo', () => {
    const { result } = renderHook(() => usePomodoro({ initialTimeInSeconds: 60 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe(55);

    act(() => {
      result.current.stop();
    });

    expect(result.current.timeLeft).toBe(60);
    expect(result.current.isRunning).toBe(false);
  });

  it('deve resetar o timer explicitamente', () => {
    const { result } = renderHook(() => usePomodoro({ initialTimeInSeconds: 60 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(result.current.timeLeft).toBe(50);

    act(() => {
      result.current.resetTimer();
    });

    expect(result.current.timeLeft).toBe(60);
    expect(result.current.isRunning).toBe(false);
  });
});