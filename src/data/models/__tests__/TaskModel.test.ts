import { TaskModel } from '../TaskModel';

const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
  })),
}));

const TEST_USER_ID = 'user-abc-123';

describe('TaskModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should insert a task with userId and default values', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 1 });
    const id = await TaskModel.insertTask(TEST_USER_ID, 'Learn Jest');
    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT INTO tasks (title, description, isCompleted, tagId, userId, focusTimeMinutes) VALUES (?, ?, ?, ?, ?, ?)',
      ['Learn Jest', null, 0, null, TEST_USER_ID, 25]
    );
    expect(id).toBe(1);
  });

  it('should insert a task with userId, description and tagId', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 2 });
    const id = await TaskModel.insertTask(TEST_USER_ID, 'Learn Expo', 'Expo docs', 1);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT INTO tasks (title, description, isCompleted, tagId, userId, focusTimeMinutes) VALUES (?, ?, ?, ?, ?, ?)',
      ['Learn Expo', 'Expo docs', 0, 1, TEST_USER_ID, 25]
    );
    expect(id).toBe(2);
  });

  it('should get tasks filtered by userId and map them correctly', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      { id: 1, title: 'Task 1', description: null, isCompleted: 0, tagId: null },
      { id: 2, title: 'Task 2', description: 'Desc', isCompleted: 1, tagId: 2 },
      { id: 3, title: 'Task 3', description: '', isCompleted: 0, tagId: 0 }
    ]);

    const tasks = await TaskModel.getTasks(TEST_USER_ID);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      'SELECT * FROM tasks WHERE isDeleted = 0 AND userId = ?',
      [TEST_USER_ID]
    );
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

  it('should update task status with userId guard', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    await TaskModel.updateTaskStatus(TEST_USER_ID, 1, true);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isCompleted = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [1, 1234567890, 1, TEST_USER_ID]
    );

    await TaskModel.updateTaskStatus(TEST_USER_ID, 2, false);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isCompleted = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [0, 1234567890, 2, TEST_USER_ID]
    );

    mockDateNow.mockRestore();
  });

  it('should update task summary image with userId guard', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    await TaskModel.updateTaskSummary(TEST_USER_ID, 1, 'image-uri');
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET summaryImageUri = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      ['image-uri', 1234567890, 1, TEST_USER_ID]
    );

    await TaskModel.updateTaskSummary(TEST_USER_ID, 2, undefined as any);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET summaryImageUri = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [null, 1234567890, 2, TEST_USER_ID]
    );

    mockDateNow.mockRestore();
  });

  it('should update task focus time with userId guard', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    await TaskModel.updateTaskFocusTime(TEST_USER_ID, 1, 30);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET focusTimeMinutes = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [30, 1234567890, 1, TEST_USER_ID]
    );

    mockDateNow.mockRestore();
  });

  it('should soft-delete a task with userId guard', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    await TaskModel.deleteTask(TEST_USER_ID, 5);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isDeleted = 1, updatedAt = ? WHERE id = ? AND userId = ?',
      [1234567890, 5, TEST_USER_ID]
    );

    mockDateNow.mockRestore();
  });

  it('should get completed tasks count for userId', async () => {
    mockGetAllAsync.mockResolvedValueOnce([{ count: 4 }]);
    const count = await TaskModel.getCompletedTasksCount(TEST_USER_ID);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ?',
      [TEST_USER_ID]
    );
    expect(count).toBe(4);
  });

  it('should return 0 when completed tasks count result is empty', async () => {
    mockGetAllAsync.mockResolvedValueOnce([]);
    const count = await TaskModel.getCompletedTasksCount(TEST_USER_ID);
    expect(count).toBe(0);
  });

  it('should get completed tasks for userId', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      { id: 10, title: 'Completed Task', description: 'Done description', isCompleted: 1, tagId: null, summaryImageUri: 'img-uri' }
    ]);
    const tasks = await TaskModel.getCompletedTasks(TEST_USER_ID);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      'SELECT * FROM tasks WHERE isCompleted = 1 AND isDeleted = 0 AND userId = ?',
      [TEST_USER_ID]
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(10);
    expect(tasks[0].isCompleted).toBe(true);
    expect(tasks[0].description).toBe('Done description');
    expect(tasks[0].summaryImageUri).toBe('img-uri');
  });

  it('should use null fallbacks when userId or other fields are missing', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    // Test updates with null/undefined userId
    await TaskModel.updateTaskSummary(null as any, 1, null as any);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET summaryImageUri = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [null, 1234567890, 1, null]
    );

    await TaskModel.updateTaskStatus(undefined as any, 1, true);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isCompleted = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [1, 1234567890, 1, null]
    );

    await TaskModel.deleteTask(null as any, 1);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET isDeleted = 1, updatedAt = ? WHERE id = ? AND userId = ?',
      [1234567890, 1, null]
    );

    await TaskModel.updateTaskFocusTime(null as any, 1, 30);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET focusTimeMinutes = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      [30, 1234567890, 1, null]
    );

    mockDateNow.mockRestore();
  });

  it('should map optional fields correctly in getCompletedTasks', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      { id: 10, title: 'Completed Task', description: null, isCompleted: 1, tagId: null, summaryImageUri: null, focusTimeMinutes: null }
    ]);
    const tasks = await TaskModel.getCompletedTasks(TEST_USER_ID);
    expect(tasks[0].description).toBeUndefined();
    expect(tasks[0].tagId).toBeUndefined();
    expect(tasks[0].summaryImageUri).toBeUndefined();
    expect(tasks[0].focusTimeMinutes).toBe(25);
  });
});
