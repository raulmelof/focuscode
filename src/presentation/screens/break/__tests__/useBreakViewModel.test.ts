import { renderHook, act } from '@testing-library/react-native';
import { useBreakViewModel } from '../useBreakViewModel';

// Mock AuthContext
const mockUser = { uid: 'test-user-uid-123' };
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: mockUser, isLoading: false })),
}));

// Mock useSettings
jest.mock('../../../../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      focusTimeMinutes: 25,
      shortBreakMinutes: 0.5,
      longBreakMinutes: 15,
    },
    isLoading: false,
    loadSettings: jest.fn(),
  }),
}));

const mockUsePomodoroCycle = jest.fn(() => ({
  isLongBreak: false,
  isLoading: false,
}));
const mockSetGlobalAutoStartFocus = jest.fn();

jest.mock('../../../../hooks/usePomodoroCycle', () => ({
  usePomodoroCycle: () => mockUsePomodoroCycle(),
  setGlobalAutoStartFocus: (val: boolean) => mockSetGlobalAutoStartFocus(val),
}));

// 1. Mockamos apenas a navegação, pois queremos testar a integração real com o usePomodoro
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

describe('useBreakViewModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePomodoroCycle.mockReturnValue({ isLongBreak: false, isLoading: false });
    
    // "Congela" o tempo real e permite ao Jest controlar o relógio
    jest.useFakeTimers(); 
  });

  afterEach(() => {
    // Devolve o relógio ao normal após cada teste para não bugar o resto do sistema
    jest.useRealTimers(); 
  });

  it('deve iniciar com o tempo de 30 segundos formatado', () => {
    // renderHook é a ferramenta ideal para testar lógicas separadas da tela
    const { result } = renderHook(() => useBreakViewModel());

    expect(result.current.formattedTime).toBe('00:30');
    expect(result.current.progress).toBe(0); // O progresso da bolinha começa no 0
  });

  it('deve chamar navigation.goBack() ao pular a pausa manualmente', () => {
    const { result } = renderHook(() => useBreakViewModel());

    // act() diz ao React que uma ação vai mudar o estado do sistema
    act(() => {
      result.current.handleSkipBreak();
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
  });

  it('deve navegar de volta automaticamente após 30 segundos', () => {
    renderHook(() => useBreakViewModel());

    act(() => {
      // Avançamos 30s
      jest.advanceTimersByTime(30000); 
    });

    act(() => {
      // + 1s do delay visual do cronômetro final
      jest.advanceTimersByTime(1000); 
    });

    // Como o tempo acabou, o gatilho onFocusEnd tem que ter disparado a navegação
    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockSetGlobalAutoStartFocus).toHaveBeenCalledWith(true);
  });

  it('deve usar tempo de long break e não setar auto start se for long break', () => {
    mockUsePomodoroCycle.mockReturnValue({ isLongBreak: true, isLoading: false });
    const { result } = renderHook(() => useBreakViewModel());

    expect(result.current.formattedTime).toBe('15:00'); // 15 minutos

    act(() => {
      jest.advanceTimersByTime(15 * 60 * 1000); 
    });
    act(() => {
      jest.advanceTimersByTime(1000); 
    });

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    expect(mockSetGlobalAutoStartFocus).not.toHaveBeenCalled();
  });

  it('não deve iniciar o pomodoro se isLoading for true', () => {
    mockUsePomodoroCycle.mockReturnValue({ isLongBreak: false, isLoading: true });
    
    // We mock usePomodoro returning a start function, and we can check if it was called.
    // However, we are using the real usePomodoro in this test suite.
    // Let's just render the hook and see that formattedTime doesn't change after advancing timers? 
    // Wait, start won't be called, so time won't decrease.
    const { result } = renderHook(() => useBreakViewModel());
    
    act(() => {
      jest.advanceTimersByTime(1000); 
    });

    // time should still be '00:30' because it didn't start
    expect(result.current.formattedTime).toBe('00:30');
  });
});