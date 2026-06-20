import { SettingsService } from '../SettingsService';
import { Platform } from 'react-native';

const mockGetFirstAsync = jest.fn();
const mockRunAsync = jest.fn();

jest.mock('../../data/database/database', () => ({
  getDBConnection: jest.fn().mockResolvedValue({
    getFirstAsync: (...args: any[]) => mockGetFirstAsync(...args),
    runAsync: (...args: any[]) => mockRunAsync(...args)
  })
}));

describe('SettingsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpar o localStorage simulado do Jest se houver
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Mobile (iOS/Android)', () => {
    beforeAll(() => {
      Platform.OS = 'ios';
    });

    it('deve obter uma configuração do SQLite se existir', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({ value: 'robo' });

      const theme = await SettingsService.getSetting('currentTheme', 'cafe');

      expect(theme).toBe('robo');
      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        'SELECT value FROM settings WHERE key = ?;',
        ['currentTheme']
      );
    });

    it('deve retornar o valor padrão se a configuração não existir no SQLite', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const theme = await SettingsService.getSetting('currentTheme', 'cafe');

      expect(theme).toBe('cafe');
    });

    it('deve salvar uma configuração no SQLite via INSERT OR REPLACE', async () => {
      mockRunAsync.mockResolvedValueOnce({ changes: 1 });

      await SettingsService.setSetting('currentTheme', 'robo');

      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?);',
        ['currentTheme', 'robo']
      );
    });

    it('deve retornar o valor padrão em caso de erro ao obter do SQLite', async () => {
      mockGetFirstAsync.mockRejectedValueOnce(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const theme = await SettingsService.getSetting('currentTheme', 'cafe');

      expect(theme).toBe('cafe');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve lidar com erro ao salvar no SQLite', async () => {
      mockRunAsync.mockRejectedValueOnce(new Error('DB Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await SettingsService.setSetting('currentTheme', 'robo');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Web', () => {
    let originalLocalStorage: any;
    let store: Record<string, string>;

    beforeAll(() => {
      Platform.OS = 'web';
      originalLocalStorage = (globalThis as any).localStorage;
      
      store = {};
      
      const mockLocalStorage = {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value;
        }),
        clear: jest.fn(() => {
          store = {};
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key];
        }),
      };
      
      Object.defineProperty(globalThis, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
        configurable: true
      });
    });

    afterAll(() => {
      if (originalLocalStorage) {
        (globalThis as any).localStorage = originalLocalStorage;
      } else {
        delete (globalThis as any).localStorage;
      }
    });

    beforeEach(() => {
      store = {};
      jest.clearAllMocks();
    });

    it('deve obter uma configuração do localStorage se existir', async () => {
      (globalThis as any).localStorage.setItem('setting_currentTheme', 'robo');

      const theme = await SettingsService.getSetting('currentTheme', 'cafe');

      expect(theme).toBe('robo');
      expect((globalThis as any).localStorage.getItem).toHaveBeenCalledWith('setting_currentTheme');
    });

    it('deve retornar o valor padrão se a configuração não existir no localStorage', async () => {
      const theme = await SettingsService.getSetting('currentTheme', 'cafe');

      expect(theme).toBe('cafe');
      expect((globalThis as any).localStorage.getItem).toHaveBeenCalledWith('setting_currentTheme');
    });

    it('deve salvar uma configuração no localStorage', async () => {
      await SettingsService.setSetting('currentTheme', 'robo');

      expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith('setting_currentTheme', 'robo');
      expect(store['setting_currentTheme']).toBe('robo');
    });

    it('deve retornar o valor padrão em caso de erro ao obter do localStorage', async () => {
      (globalThis as any).localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage Error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const theme = await SettingsService.getSetting('currentTheme', 'cafe');

      expect(theme).toBe('cafe');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve lidar com erro ao salvar no localStorage', async () => {
      (globalThis as any).localStorage.setItem.mockImplementationOnce(() => {
        throw new Error('Storage Error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await SettingsService.setSetting('currentTheme', 'robo');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
