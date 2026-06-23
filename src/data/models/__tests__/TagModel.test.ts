import { TagModel } from '../TagModel';

const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
  })),
}));

const TEST_USER_ID = 'user-abc-123';

describe('TagModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should insert a tag with userId', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 1 });
    const id = await TagModel.insertTag(TEST_USER_ID, 'Study', '#FF0000');
    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT INTO tags (name, color, userId) VALUES (?, ?, ?)',
      ['Study', '#FF0000', TEST_USER_ID]
    );
    expect(id).toBe(1);
  });

  it('should get tags filtered by userId', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      { id: 1, name: 'Study', color: '#FF0000' }
    ]);
    const tags = await TagModel.getTags(TEST_USER_ID);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      'SELECT * FROM tags WHERE isDeleted = 0 AND userId = ?',
      [TEST_USER_ID]
    );
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('Study');
  });

  it('should soft-delete a tag with userId', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    await TagModel.deleteTag(TEST_USER_ID, 1);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tags SET isDeleted = 1, updatedAt = ? WHERE id = ? AND userId = ?',
      [1234567890, 1, TEST_USER_ID]
    );

    mockDateNow.mockRestore();
  });

  it('should update a tag with userId', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);

    await TagModel.updateTag(TEST_USER_ID, 1, 'Work', '#0000FF');
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tags SET name = ?, color = ?, updatedAt = ? WHERE id = ? AND userId = ?',
      ['Work', '#0000FF', 1234567890, 1, TEST_USER_ID]
    );

    mockDateNow.mockRestore();
  });
});
