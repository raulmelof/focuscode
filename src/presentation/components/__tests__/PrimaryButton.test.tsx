import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PrimaryButton } from '../PrimaryButton';

describe('Componente PrimaryButton', () => {
  it('deve renderizar corretamente o título passado via props', () => {
    const { getByText } = render(<PrimaryButton title="Iniciar Foco" onPress={() => {}} />);

    expect(getByText('Iniciar Foco')).toBeTruthy();
  });

  it('deve acionar a função onPress apenas uma vez ao ser clicado', () => {
    const mockFuncao = jest.fn();
    const { getByText } = render(<PrimaryButton title="Pausar" onPress={mockFuncao} />);

    fireEvent.press(getByText('Pausar'));

    expect(mockFuncao).toHaveBeenCalledTimes(1);
  });
});
