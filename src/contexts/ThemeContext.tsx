import React, { createContext, useContext, useState, useEffect } from 'react';
import { SettingsService } from '../services/SettingsService';

export type ThemeType = 'cafe' | 'robo';

export interface ThemeColors {
  background: string;
  text: string;
  accent: string;
  pillBg: string;
  cardBg: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  iconColor: string;
  dividerColor: string;
  completedText: string;
  cardBorder: string;
}

const themeColors: Record<ThemeType, ThemeColors> = {
  cafe: {
    background: '#E6D5A7',
    text: '#2A1128',
    accent: '#2A1128',
    pillBg: 'rgba(42, 17, 40, 0.08)',
    cardBg: 'rgba(255, 255, 255, 0.4)',
    primaryButtonBg: '#2A1128',
    primaryButtonText: '#E6D5A7',
    iconColor: '#2A1128',
    dividerColor: 'rgba(42, 17, 40, 0.08)',
    completedText: '#04d361',
    cardBorder: 'rgba(42, 17, 40, 0.1)',
  },
  robo: {
    background: '#0E1624',
    text: '#E2E8F0',
    accent: '#00E5FF', // Ciano neon futurista
    pillBg: 'rgba(0, 229, 255, 0.12)',
    cardBg: 'rgba(255, 255, 255, 0.06)',
    primaryButtonBg: '#00E5FF',
    primaryButtonText: '#0E1624',
    iconColor: '#00E5FF',
    dividerColor: 'rgba(0, 229, 255, 0.15)',
    completedText: '#00E5FF',
    cardBorder: 'rgba(0, 229, 255, 0.2)',
  }
};

interface ThemeContextData {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => Promise<void>;
  setTheme: (theme: ThemeType) => Promise<void>;
  isLoadingTheme: boolean;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('cafe');
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await SettingsService.getSetting('currentTheme', 'cafe');
        setThemeState(savedTheme as ThemeType);
      } catch (e) {
        console.error('[ThemeProvider] Erro ao carregar tema:', e);
      } finally {
        setIsLoadingTheme(false);
      }
    };

    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      await SettingsService.setSetting('currentTheme', newTheme);
    } catch (e) {
      console.error('[ThemeProvider] Erro ao salvar tema:', e);
    }
  };

  const toggleTheme = async () => {
    const nextTheme: ThemeType = theme === 'cafe' ? 'robo' : 'cafe';
    await setTheme(nextTheme);
  };

  const colors = themeColors[theme] || themeColors.cafe;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme, isLoadingTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
