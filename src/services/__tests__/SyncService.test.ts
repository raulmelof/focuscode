import { SyncService } from '../SyncService';
import { getDBConnection } from '../../data/database/database';
import { writeBatch, getDocs, doc, collection, query } from 'firebase/firestore';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn()
}));

jest.mock('../../data/database/database');
jest.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'test-user-id' } },
  db: {}
}));

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    writeBatch: jest.fn(),
    getDocs: jest.fn(),
    collection: jest.fn((db, name) => name), // Retorna o nome da coleção como identificador
    query: jest.fn((col) => col), // Retorna o nome da coleção
    where: jest.fn(),
    doc: jest.fn()
  };
});

describe('SyncService', () => {
  let mockDb: any;
  let mockBatch: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDb = {
      getAllAsync: jest.fn(),
      runAsync: jest.fn(),
      getFirstAsync: jest.fn()
    };
    (getDBConnection as jest.Mock).mockResolvedValue(mockDb);

    mockBatch = {
      set: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn()
    };
    (writeBatch as jest.Mock).mockReturnValue(mockBatch);
  });

  it('deve realizar push de novas tasks e tags', async () => {
    mockDb.getAllAsync.mockImplementation((queryStr: string) => {
      if (queryStr.includes('tasks')) {
        return Promise.resolve([
          { id: 1, title: 'Task 1', firebaseId: null, updatedAt: 1000, isDeleted: 0 }
        ]);
      }
      if (queryStr.includes('tags')) {
        return Promise.resolve([
          { id: 10, name: 'Tag 1', color: 'red', firebaseId: null, updatedAt: 1000, isDeleted: 0 }
        ]);
      }
      return Promise.resolve([]);
    });

    (doc as jest.Mock).mockImplementation(() => ({ id: 'new-id' }));
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    await SyncService.sync();

    expect(mockDb.runAsync).toHaveBeenCalledWith('UPDATE tasks SET firebaseId = ? WHERE id = ?', ['new-id', 1]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('UPDATE tags SET firebaseId = ? WHERE id = ?', ['new-id', 10]);
    expect(mockBatch.set).toHaveBeenCalledTimes(2);
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('deve realizar pull de tasks e tags remotas', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    
    (getDocs as jest.Mock).mockImplementation((q) => {
      if (q === 'tags') {
        return Promise.resolve({
          docs: [{ id: 'remote-tag-1', data: () => ({ name: 'Remote Tag', color: 'blue', updatedAt: 2000 }) }]
        });
      }
      if (q === 'tasks') {
        return Promise.resolve({
          docs: [{ id: 'remote-task-1', data: () => ({ title: 'Remote Task', updatedAt: 2000 }) }]
        });
      }
      return Promise.resolve({ docs: [] });
    });

    mockDb.getFirstAsync.mockResolvedValue(null);

    await SyncService.sync();

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tags'),
      expect.arrayContaining(['Remote Tag', 'blue', 'remote-tag-1'])
    );
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tasks'),
      expect.arrayContaining(['Remote Task', 'remote-task-1'])
    );
  });

  it('deve respeitar updatedAt para não sobrescrever dados mais novos localmente', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ id: 'remote-id', data: () => ({ name: 'Old Remote', updatedAt: 1000 }) }]
    });

    mockDb.getFirstAsync.mockResolvedValue({ id: 1, updatedAt: 2000 });

    await SyncService.sync();

    expect(mockDb.runAsync).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE'), expect.anything());
  });
});
