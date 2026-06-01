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
});
