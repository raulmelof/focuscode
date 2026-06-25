import React from 'react';
import { render } from '@testing-library/react-native';
import { Image } from 'react-native';
import { PomodoroCircle } from '../PomodoroCircle';
import { useAppTheme } from '../../../contexts/ThemeContext';

jest.mock('../../../contexts/ThemeContext', () => ({
  useAppTheme: jest.fn(),
}));

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Animated.timing = () => ({
    start: jest.fn(),
  });
  return rn;
});

describe('PomodoroCircle', () => {
  beforeEach(() => {
    (useAppTheme as jest.Mock).mockReturnValue({
      theme: 'cafe',
      colors: { accent: '#2A1128' },
    });
  });

  it('deve renderizar a imagem do cafe por padrao', () => {
    const { UNSAFE_getByType } = render(<PomodoroCircle />);
    const image = UNSAFE_getByType(Image);
    expect(image).toBeTruthy();
  });

  it('deve renderizar a imagem do robo quando theme = robo', () => {
    (useAppTheme as jest.Mock).mockReturnValue({
      theme: 'robo',
      colors: { accent: '#00E5FF' },
    });
    
    const { UNSAFE_getAllByType } = render(<PomodoroCircle />);
    const images = UNSAFE_getAllByType(Image);
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it('nao deve renderizar imagem se showImage for false', () => {
    const { UNSAFE_queryByType } = render(<PomodoroCircle showImage={false} />);
    expect(UNSAFE_queryByType(Image)).toBeNull();
  });

  it('deve lidar com progress', () => {
    const { toJSON } = render(<PomodoroCircle progress={0.5} />);
    expect(toJSON()).toBeTruthy();
  });
});
