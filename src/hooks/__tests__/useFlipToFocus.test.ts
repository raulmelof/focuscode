import { renderHook, act } from '@testing-library/react-native';
import { useFlipToFocus } from '../useFlipToFocus';
import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

jest.mock('expo-sensors', () => ({
  Accelerometer: {
    setUpdateInterval: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

describe('useFlipToFocus', () => {
  let mockOnStart: jest.Mock;
  let mockOnPause: jest.Mock;
  let accelerometerCallback: (data: { x: number; y: number; z: number }) => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnStart = jest.fn();
    mockOnPause = jest.fn();
    Platform.OS = 'android';

    // Capturar o callback passado para o addListener para simular eventos de sensor
    (Accelerometer.addListener as jest.Mock).mockImplementation((cb) => {
      accelerometerCallback = cb;
      return { remove: jest.fn() };
    });
  });

  it('deve chamar onStart quando o celular for virado para baixo no Android', () => {
    Platform.OS = 'android';
    renderHook(() => useFlipToFocus(true, false, mockOnStart, mockOnPause));

    act(() => {
      // Simular celular virado para baixo (z < -0.8 e x,y proximos de 0)
      accelerometerCallback({ x: 0.1, y: 0.1, z: -0.9 });
    });

    expect(mockOnStart).toHaveBeenCalled();
  });

  it('deve chamar onStart quando o celular for virado para baixo no iOS', () => {
    Platform.OS = 'ios';
    renderHook(() => useFlipToFocus(true, false, mockOnStart, mockOnPause));

    act(() => {
      // Simular celular virado para baixo (z > 0.8 e x,y proximos de 0)
      accelerometerCallback({ x: 0.1, y: 0.1, z: 0.9 });
    });

    expect(mockOnStart).toHaveBeenCalled();
  });

  it('deve chamar onPause quando o celular for desvirado apos 5 segundos', () => {
    const mockDateNow = jest.spyOn(Date, 'now');

    // Inicio: Celular virado (isRunning = true)
    mockDateNow.mockReturnValue(1000);
    renderHook(() => useFlipToFocus(true, true, mockOnStart, mockOnPause));

    act(() => {
      // Passar 6 segundos
      mockDateNow.mockReturnValue(7000);
      // Simular celular virado para cima (z < 0.8)
      accelerometerCallback({ x: 0.1, y: 0.1, z: 0.1 });
    });

    expect(mockOnPause).toHaveBeenCalled();
    mockDateNow.mockRestore();
  });

  it('nao deve chamar onPause se o tempo de carência (5s) nao tiver passado', () => {
    const mockDateNow = jest.spyOn(Date, 'now');

    mockDateNow.mockReturnValue(1000);
    renderHook(() => useFlipToFocus(true, true, mockOnStart, mockOnPause));

    act(() => {
      // Passar apenas 2 segundos
      mockDateNow.mockReturnValue(3000);
      accelerometerCallback({ x: 0.1, y: 0.1, z: 0.1 });
    });

    expect(mockOnPause).not.toHaveBeenCalled();
    mockDateNow.mockRestore();
  });

  it('nao deve fazer nada se isActive for false', () => {
    renderHook(() => useFlipToFocus(false, false, mockOnStart, mockOnPause));

    expect(Accelerometer.addListener).not.toHaveBeenCalled();
  });

  it('nao deve fazer nada se estiver na web', () => {
    Platform.OS = 'web';
    renderHook(() => useFlipToFocus(true, false, mockOnStart, mockOnPause));
    expect(Accelerometer.addListener).not.toHaveBeenCalled();
  });

  it('deve limpar os listeners no unmount', () => {
    Platform.OS = 'android';
    const mockRemove = jest.fn();
    (Accelerometer.addListener as jest.Mock).mockReturnValueOnce({ remove: mockRemove });

    const { unmount } = renderHook(() => useFlipToFocus(true, false, mockOnStart, mockOnPause));
    unmount();

    expect(mockRemove).toHaveBeenCalled();
    expect(Accelerometer.removeAllListeners).toHaveBeenCalled();
  });

  it('nao deve chamar onStart se lastActionRef.current ja for "start"', () => {
    Platform.OS = 'android';
    renderHook(() => useFlipToFocus(true, false, mockOnStart, mockOnPause));

    act(() => {
      // First flip down
      accelerometerCallback({ x: 0.1, y: 0.1, z: -0.9 });
      // Second flip down immediately
      accelerometerCallback({ x: 0.1, y: 0.1, z: -0.9 });
    });

    expect(mockOnStart).toHaveBeenCalledTimes(1);
  });

  it('nao deve chamar onPause se lastActionRef.current ja for "pause"', () => {
    const mockDateNow = jest.spyOn(Date, 'now');
    mockDateNow.mockReturnValue(1000);
    renderHook(() => useFlipToFocus(true, true, mockOnStart, mockOnPause));

    act(() => {
      mockDateNow.mockReturnValue(7000);
      // First flip up
      accelerometerCallback({ x: 0.1, y: 0.1, z: 0.1 });
      // Second flip up immediately
      accelerometerCallback({ x: 0.1, y: 0.1, z: 0.1 });
    });

    expect(mockOnPause).toHaveBeenCalledTimes(1);
    mockDateNow.mockRestore();
  });

  it('nao deve fazer nada se isFaceDown for true durante isRunning', () => {
    renderHook(() => useFlipToFocus(true, true, mockOnStart, mockOnPause));

    act(() => {
      // isFaceDown is true
      accelerometerCallback({ x: 0.1, y: 0.1, z: -0.9 });
    });

    expect(mockOnPause).not.toHaveBeenCalled();
    expect(mockOnStart).not.toHaveBeenCalled();
  });

  it('deve fazer cleanup na web sem dar erro', () => {
    Platform.OS = 'web';
    const { unmount } = renderHook(() => useFlipToFocus(true, false, mockOnStart, mockOnPause));
    unmount();
    // nothing to assert, just coverage
  });

  it('deve fazer cleanup com subscription nulo', () => {
    Platform.OS = 'android';
    // mock addListener to return something but let's say isActive is false
    const { unmount } = renderHook(() => useFlipToFocus(false, false, mockOnStart, mockOnPause));
    unmount();
    // subscription was null
  });
});
