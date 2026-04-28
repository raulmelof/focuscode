import React from 'react';
import { render } from '@testing-library/react-native';
import { PomodoroCircle } from '../PomodoroCircle';

describe('Componente PomodoroCircle', () => {
  it('deve renderizar a estrutura circular sem quebrar', () => {
    const { toJSON } = render(<PomodoroCircle />);

    expect(toJSON()).toBeTruthy();
  });
});
