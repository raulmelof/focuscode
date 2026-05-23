import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { ThemeProvider, useAppTheme } from '../ThemeContext';
import { SettingsService } from '../../services/SettingsService';
import { useAuth } from '../AuthContext';

// Mocks dos serviços e contextos dependentes
jest.mock('../../services/SettingsService', () => ({
  SettingsService: {
    getSetting: jest.fn(),
    setSetting: jest.fn()
  }
}));

jest.mock('../AuthContext', () => ({
  useAuth: jest.fn()
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar o tema padrão "cafe" se nenhuma configuração for salva para convidado', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    (SettingsService.getSetting as jest.Mock).mockResolvedValueOnce('cafe');

    const { result } = renderHook(() => useAppTheme(), { wrapper });

    // Aguarda a resolução dos promises internos do useEffect
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.theme).toBe('cafe');
    expect(result.current.colors.background).toBe('#E6D5A7');
    expect(SettingsService.getSetting).toHaveBeenCalledWith('currentTheme_guest', 'cafe');
  });

  it('deve carregar o tema salvo do banco para o usuário logado', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'user123' } });
    (SettingsService.getSetting as jest.Mock).mockResolvedValueOnce('robo');

    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.theme).toBe('robo');
    expect(result.current.colors.background).toBe('#0E1624');
    expect(SettingsService.getSetting).toHaveBeenCalledWith('currentTheme_user123', 'cafe');
  });

  it('deve salvar o novo tema ao chamar setTheme', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { uid: 'user123' } });
    (SettingsService.getSetting as jest.Mock).mockResolvedValue('cafe');

    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.setTheme('robo');
    });

    expect(result.current.theme).toBe('robo');
    expect(SettingsService.setSetting).toHaveBeenCalledWith('currentTheme_user123', 'robo');
  });

  it('deve alternar o tema ao chamar toggleTheme', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    (SettingsService.getSetting as jest.Mock).mockResolvedValue('cafe');

    const { result } = renderHook(() => useAppTheme(), { wrapper });

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.toggleTheme();
    });

    expect(result.current.theme).toBe('robo');
    expect(SettingsService.setSetting).toHaveBeenCalledWith('currentTheme_guest', 'robo');
  });
});
