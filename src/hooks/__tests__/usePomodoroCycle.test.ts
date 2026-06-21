import { renderHook, act } from '@testing-library/react-native';
import { usePomodoroCycle, setGlobalCycleCount, cycleListeners, getGlobalCycleCount, setGlobalAutoStartFocus, getGlobalAutoStartFocus } from '../usePomodoroCycle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../useSettings';
import { Platform } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../useSettings', () => ({
  useSettings: jest.fn(),
}));

describe('usePomodoroCycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setGlobalCycleCount(0);
    cycleListeners.clear();
    setGlobalAutoStartFocus(false);
  });

  describe('Globals', () => {
    it('deve gerenciar autoStartFocus global', () => {
      expect(getGlobalAutoStartFocus()).toBe(false);
      setGlobalAutoStartFocus(true);
      expect(getGlobalAutoStartFocus()).toBe(true);
    });

    it('deve gerenciar globalCycleCount e notificar listeners', () => {
      const listener = jest.fn();
      cycleListeners.add(listener);

      expect(getGlobalCycleCount()).toBe(0);
      setGlobalCycleCount(5);
      
      expect(getGlobalCycleCount()).toBe(5);
      expect(listener).toHaveBeenCalledWith(5);
    });
  });

  describe('Hook logic', () => {
    beforeEach(() => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: false });
      (useSettings as jest.Mock).mockReturnValue({ settings: { cyclesBeforeLongBreak: 4 } });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    it('deve inicializar com valores padroes', async () => {
      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.cycleCount).toBe(0);
      expect(result.current.isLongBreak).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('deve carregar do storage para usuario_storage1', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'storage1' }, isLoading: false });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('3');

      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@pomodoroCycle_storage1');
      expect(result.current.cycleCount).toBe(3);
      expect(result.current.isLongBreak).toBe(false);
    });

    it('deve carregar do storage para usuario logado_storage2', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'storage2' }, isLoading: false });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('4');

      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@pomodoroCycle_storage2');
      expect(result.current.cycleCount).toBe(4);
      expect(result.current.isLongBreak).toBe(true);
    });

    it('deve lidar com loading de auth', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: null, isLoading: true });
      
      const { result } = renderHook(() => usePomodoroCycle());

      expect(result.current.isLoading).toBe(true);
    });

    it('nao deve carregar novamente se a chave for a mesma e force for falso', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'cache_user' }, isLoading: false });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('8');

      const { result, rerender } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      rerender({});

      await act(async () => {
        await result.current.loadCycleCount();
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it('deve recarregar se force for true', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'force_user' }, isLoading: false });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('9').mockResolvedValueOnce('10');

      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.cycleCount).toBe(9);

      await act(async () => {
        await result.current.loadCycleCount(true);
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(2);
      expect(result.current.cycleCount).toBe(10);
    });

    it('deve incrementar o ciclo', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'storage3' }, isLoading: false });

      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.incrementCycle();
      });

      expect(result.current.cycleCount).toBe(1);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@pomodoroCycle_storage3', '1');
    });

    it('deve resetar o ciclo', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'storage4' }, isLoading: false });
      setGlobalCycleCount(5);
      
      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.resetCycle();
      });

      expect(result.current.cycleCount).toBe(0);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@pomodoroCycle_storage4', '0');
    });

    it('deve logar erro ao falhar em carregar o ciclo', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'error_user' }, isLoading: false });
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Storage Error'));
      // Force getStorageItem to throw by making localStorage also throw
      if (typeof window !== 'undefined') {
        // unused var removed
        delete (globalThis as any).window;
        (globalThis as any).window = {
          localStorage: {
            getItem: () => { throw new Error('Local Storage Error'); },
            setItem: () => { throw new Error('Local Storage Error'); }
          }
        };
      }
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading cycle count', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('deve logar erro ao falhar em salvar o ciclo', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'save_error_user' }, isLoading: false });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('1');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Storage Save Error'));
      // Force setStorageItem to throw
      if (typeof window !== 'undefined') {
        // unused var removed
        delete (globalThis as any).window;
        (globalThis as any).window = {
          localStorage: {
            getItem: () => { throw new Error('Local Storage Error'); },
            setItem: () => { throw new Error('Local Storage Error'); }
          }
        };
      }
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.incrementCycle();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error saving cycle count', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('Web Storage fallback', () => {
    let originalOS: string;
    let store: Record<string, string>;

    beforeAll(() => {
      originalOS = Platform.OS;
      Platform.OS = 'web';
      
      store = {};
      const mockLocalStorage = {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value;
        }),
      };
      
      Object.defineProperty(globalThis, 'window', {
        value: { localStorage: mockLocalStorage },
        writable: true,
        configurable: true,
      });
    });

    afterAll(() => {
      Platform.OS = originalOS as any;
      delete (globalThis as any).window;
    });

    beforeEach(() => {
      store = {};
      jest.clearAllMocks();
      (useSettings as jest.Mock).mockReturnValue({ settings: { cyclesBeforeLongBreak: 4 } });
    });

    it('deve usar localStorage na web', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'web1' }, isLoading: false });
      (globalThis.window.localStorage.getItem as jest.Mock).mockReturnValueOnce('2');
      
      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.cycleCount).toBe(2);
      expect(globalThis.window.localStorage.getItem).toHaveBeenCalledWith('@pomodoroCycle_web1');

      await act(async () => {
        await result.current.incrementCycle();
      });

      expect(result.current.cycleCount).toBe(3);
      expect(globalThis.window.localStorage.setItem).toHaveBeenCalledWith('@pomodoroCycle_web1', '3');
    });

    it('deve lidar com ausência de window no web', async () => {
      const originalWindow = globalThis.window;
      delete (globalThis as any).window;

      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'web_no_window' }, isLoading: false });
      
      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.cycleCount).toBe(0); // globalCycleCount is 0, since it failed to get

      await act(async () => {
        await result.current.incrementCycle();
      });

      expect(result.current.cycleCount).toBe(1);

      Object.defineProperty(globalThis, 'window', {
        value: originalWindow,
        writable: true,
      });
    });
  });

  describe('Mobile Fallback', () => {
    let originalWindow: any;

    beforeAll(() => {
      originalWindow = globalThis.window;
    });

    afterAll(() => {
      delete (globalThis as any).window;
      if (originalWindow) {
        (globalThis as any).window = originalWindow;
      }
    });

    it('deve usar localStorage se AsyncStorage lançar erro no mobile', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'mobile_fallback' }, isLoading: false });
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(new Error('Native Error'));
      
      const store: Record<string, string> = { '@pomodoroCycle_mobile_fallback': '5' };
      const mockLocalStorage = {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
      };
      
      delete (globalThis as any).window;
      (globalThis as any).window = { localStorage: mockLocalStorage };

      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.cycleCount).toBe(5);

      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Native Error Set'));

      await act(async () => {
        await result.current.incrementCycle();
      });

      expect(result.current.cycleCount).toBe(6);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('@pomodoroCycle_mobile_fallback', '6');
    });

    it('deve retornar null do getStorageItem quando falhar no mobile e não houver localStorage', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'mobile_fallback_no_window' }, isLoading: false });
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Native Error'));
      
      delete (globalThis as any).window;
      (globalThis as any).window = {};

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.cycleCount).toBe(0); // returned null, so globalCycleCount is 0
      consoleSpy.mockRestore();
    });

    it('não deve fazer nada se setStorageItem falhar no mobile e não houver localStorage', async () => {
      (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'mobile_fallback_set_error' }, isLoading: false });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('5');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(new Error('Native Error Set'));
      
      delete (globalThis as any).window;
      (globalThis as any).window = {};

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => usePomodoroCycle());

      await act(async () => {
        await Promise.resolve();
      });

      await act(async () => {
        await result.current.incrementCycle();
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
