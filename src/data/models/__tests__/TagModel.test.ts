import { TagModel } from '../TagModel';

const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => ({
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
  })),
}));

describe('TagModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should insert a tag', async () => {
    mockRunAsync.mockResolvedValueOnce({ lastInsertRowId: 1 });
    const id = await TagModel.insertTag('Study', '#FF0000');
    expect(mockRunAsync).toHaveBeenCalledWith(
      'INSERT INTO tags (name, color) VALUES (?, ?)',
      ['Study', '#FF0000']
    );
    expect(id).toBe(1);
  });

  it('should get all tags', async () => {
    mockGetAllAsync.mockResolvedValueOnce([
      { id: 1, name: 'Study', color: '#FF0000' }
    ]);
    const tags = await TagModel.getTags();
    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM tags WHERE isDeleted = 0');
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('Study');
  });

  it('should delete a tag', async () => {
    const mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1234567890);
    
    await TagModel.deleteTag(1);
    expect(mockRunAsync).toHaveBeenCalledWith(
      'UPDATE tags SET isDeleted = 1, updatedAt = ? WHERE id = ?',
      [1234567890, 1]
    );

    mockDateNow.mockRestore();
  });
});
