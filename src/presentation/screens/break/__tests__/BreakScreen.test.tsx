import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BreakScreen } from '../BreakScreen';
import { useBreakViewModel } from '../useBreakViewModel';
import { useAppTheme } from '../../../../contexts/ThemeContext';

// Mocks do ViewModel e do Contexto de Temas
jest.mock('../useBreakViewModel', () => ({
  useBreakViewModel: jest.fn()
}));

jest.mock('../../../../contexts/ThemeContext', () => ({
  useAppTheme: jest.fn()
}));

describe('BreakScreen', () => {
  const mockHandleSkipBreak = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useBreakViewModel as jest.Mock).mockReturnValue({
      formattedTime: '05:00',
      progress: 1,
      handleSkipBreak: mockHandleSkipBreak
    });
  });

  it('deve renderizar os textos e layout correspondentes ao tema "cafe"', () => {
    (useAppTheme as jest.Mock).mockReturnValue({
      theme: 'cafe',
      colors: {
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
      }
    });

    const { getByText } = render(<BreakScreen />);

    expect(getByText('Hora do Café!')).toBeTruthy();
    expect(getByText('Levante-se e tome uma xícara de café...')).toBeTruthy();
    expect(getByText('Desligar Alarme')).toBeTruthy();
  });

  it('deve renderizar os textos e layout correspondentes ao tema "robo"', () => {
    (useAppTheme as jest.Mock).mockReturnValue({
      theme: 'robo',
      colors: {
        background: '#0E1624',
        text: '#E2E8F0',
        accent: '#00E5FF',
        pillBg: 'rgba(0, 229, 255, 0.12)',
        cardBg: 'rgba(255, 255, 255, 0.06)',
        primaryButtonBg: '#00E5FF',
        primaryButtonText: '#0E1624',
        iconColor: '#00E5FF',
        dividerColor: 'rgba(0, 229, 255, 0.15)',
        completedText: '#00E5FF',
        cardBorder: 'rgba(0, 229, 255, 0.2)',
      }
    });

    const { getByText } = render(<BreakScreen />);

    expect(getByText('Modo Robô!')).toBeTruthy();
    expect(getByText('Recarregando baterias e atualizando circuitos...')).toBeTruthy();
    expect(getByText('Desligar Alarme')).toBeTruthy();
  });

  it('deve acionar handleSkipBreak ao clicar no botão de pular descanso', () => {
    (useAppTheme as jest.Mock).mockReturnValue({
      theme: 'cafe',
      colors: {
        background: '#E6D5A7',
        text: '#2A1128',
        accent: '#2A1128',
        primaryButtonBg: '#2A1128',
        primaryButtonText: '#E6D5A7',
      }
    });

    const { getByText } = render(<BreakScreen />);
    const skipButton = getByText('Desligar Alarme');

    fireEvent.press(skipButton);

    expect(mockHandleSkipBreak).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar o loading se isLoading for true', () => {
    (useBreakViewModel as jest.Mock).mockReturnValue({
      formattedTime: '05:00',
      progress: 1,
      handleSkipBreak: mockHandleSkipBreak,
      isLoading: true
    });
    
    (useAppTheme as jest.Mock).mockReturnValue({ theme: 'cafe' });

    const { queryByText } = render(<BreakScreen />);
    // Se o loading spinner é um ActivityIndicator sem texto e não tem testID, 
    // podemos apenas testar se a tela não renderiza o texto principal:
    expect(queryByText('Hora do Café!')).toBeNull();
  });

  it('deve cair no fallback de tema se for um tema desconhecido', () => {
    (useAppTheme as jest.Mock).mockReturnValue({ 
      theme: 'unknown_theme', 
      colors: { accent: '#2A1128' } 
    });
    const { getByText } = render(<BreakScreen />);
    
    // Deve renderizar o fallback que é 'Hora do Café!'
    expect(getByText('Hora do Café!')).toBeTruthy();
  });
});
