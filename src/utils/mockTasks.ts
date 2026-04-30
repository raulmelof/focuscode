export interface Task {
  id: number;
  title: string;
  tag: string;
  completed?: boolean;
}

export const MOCK_TASKS: Task[] = [
  { id: 1, title: 'Estudar React', tag: 'Faculdade', completed: false },
  { id: 2, title: 'Fazer exercícios de Matemática', tag: 'Estudos', completed: false },
  { id: 3, title: 'Ler livro de UX', tag: 'Leitura', completed: false },
];
