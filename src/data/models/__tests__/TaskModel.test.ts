import { TaskModel } from '../TaskModel';

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
      { id: 2, title: 'Task 2', description: 'Desc', isCompleted: 1, tagId: 2 },
      { id: 3, title: 'Task 3', description: '', isCompleted: 0, tagId: 0 }
    ]);
    
    const tasks = await TaskModel.getTasks();
    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM tasks WHERE isDeleted = 0');
    expect(tasks).toHaveLength(3);
    
    // Mapping assertions
    expect(tasks[0].isCompleted).toBe(false);
    expect(tasks[0].description).toBeUndefined();
    expect(tasks[0].tagId).toBeUndefined();

    expect(tasks[1].isCompleted).toBe(true);
    expect(tasks[1].description).toBe('Desc');
    expect(tasks[1].tagId).toBe(2);

    expect(tasks[2].isCompleted).toBe(false);
    expect(tasks[2].description).toBe('');
    expect(tasks[2].tagId).toBe(0);
  });

  it('should update task status', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    
    await TaskModel.updateTaskStatus(1, true);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isCompleted = ?, updatedAt = ? WHERE id = ?',
      [1, 1234567890, 1] // true becomes 1
    );

    await TaskModel.updateTaskStatus(2, false);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isCompleted = ?, updatedAt = ? WHERE id = ?',
      [0, 1234567890, 2] // false becomes 0
    );

    mockDateNow.mockRestore();
  });

  it('should delete a task', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    
    await TaskModel.deleteTask(5);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isDeleted = 1, updatedAt = ? WHERE id = ?',
      [1234567890, 5]
    );

    mockDateNow.mockRestore();
  });
});
