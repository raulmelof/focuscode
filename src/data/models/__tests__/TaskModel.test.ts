import { TaskModel } from '../TaskModel';
import * as SQLite from 'expo-sqlite';

const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => ({
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
  })),
}));

describe('TaskModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should insert a task with default values', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 1 });
    const id = await TaskModel.insertTask('Learn Jest');
    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT INTO tasks (title, description, isCompleted, tagId) VALUES (?, ?, ?, ?)',
      ['Learn Jest', null, 0, null]
    );
    expect(id).toBe(1);
  });

  it('should insert a task with description and tagId', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 2 });
    const id = await TaskModel.insertTask('Learn Expo', 'Expo docs', 1);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT INTO tasks (title, description, isCompleted, tagId) VALUES (?, ?, ?, ?)',
      ['Learn Expo', 'Expo docs', 0, 1]
    );
    expect(id).toBe(2);
  });

  it('should get all tasks and map them correctly', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      { id: 1, title: 'Task 1', description: null, isCompleted: 0, tagId: null },
      { id: 2, title: 'Task 2', description: 'Desc', isCompleted: 1, tagId: 2 }
    ]);
    
    const tasks = await TaskModel.getTasks();
    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM tasks');
    expect(tasks).toHaveLength(2);
    
    // Mapping assertions
    expect(tasks[0].isCompleted).toBe(false);
    expect(tasks[0].description).toBeUndefined();
    expect(tasks[0].tagId).toBeUndefined();

    expect(tasks[1].isCompleted).toBe(true);
    expect(tasks[1].description).toBe('Desc');
    expect(tasks[1].tagId).toBe(2);
  });

  it('should update task status', async () => {
    await TaskModel.updateTaskStatus(1, true);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isCompleted = ? WHERE id = ?',
      [1, 1] // true becomes 1
    );

    await TaskModel.updateTaskStatus(2, false);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isCompleted = ? WHERE id = ?',
      [0, 2] // false becomes 0
    );
  });

  it('should delete a task', async () => {
    await TaskModel.deleteTask(5);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'DELETE FROM tasks WHERE id = ?',
      [5]
    );
  });
});
