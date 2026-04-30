import { renderHook, act } from '@testing-library/react-native';
import { useBreakViewModel } from '../useBreakViewModel';

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
  });
});