import React from 'react';
import { render } from '@testing-library/react-native';
import { TimerDisplay } from '../TimerDisplay';

describe('Componente TimerDisplay', () => {
  it('deve exibir o tempo formatado corretamente', () => {
    const tempoDeTeste = "25:00";
    const { getByText } = render(<TimerDisplay time={tempoDeTeste} />);

    expect(getByText(tempoDeTeste)).toBeTruthy();
  });

  it('deve atualizar o ecrã se a propriedade time mudar', () => {
    const { getByText, rerender } = render(<TimerDisplay time="60:00" />);
    expect(getByText('60:00')).toBeTruthy();

    rerender(<TimerDisplay time="59:59" />);
    expect(getByText('59:59')).toBeTruthy();
  });
});
