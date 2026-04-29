export interface Task {
  id: number;
  title: string;
  tag: string;
}

export const MOCK_TASKS: Task[] = [
  { id: 1, title: 'Estudar React', tag: 'Faculdade' },
  { id: 2, title: 'Fazer exercícios de Matemática', tag: 'Estudos' },
  { id: 3, title: 'Ler livro de UX', tag: 'Leitura' },
];
