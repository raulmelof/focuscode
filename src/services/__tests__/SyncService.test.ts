import { SyncService } from '../SyncService';
import { getDBConnection, initDB } from '../../data/database/database';
import { setDoc, getDocs, doc } from 'firebase/firestore';
import { StorageService } from '../StorageService';

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn((uri) => Promise.resolve({ uri })),
  SaveFormat: { JPEG: 'jpeg' }
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn()
}));

jest.mock('../../data/database/database');
jest.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'test-user-id', email: 'test@example.com' } },
  db: {}
}));

jest.mock('../StorageService', () => ({
  StorageService: {
    uploadTaskImage: jest.fn()
  }
}));

jest.mock('firebase/firestore', () => {
  const actual = jest.requireActual('firebase/firestore');
  return {
    ...actual,
    setDoc: jest.fn(),
    deleteDoc: jest.fn(),
    getDocs: jest.fn(),
    collection: jest.fn((db, name) => name),
    query: jest.fn((col) => col),
    where: jest.fn(),
    doc: jest.fn()
  };
});

const TEST_USER_ID = 'test-user-id';

describe('SyncService', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockDb = {
      getAllAsync: jest.fn().mockResolvedValue([]),
      runAsync: jest.fn().mockResolvedValue({}),
      getFirstAsync: jest.fn().mockResolvedValue(null)
    };
    (getDBConnection as jest.Mock).mockResolvedValue(mockDb);
    (initDB as jest.Mock).mockResolvedValue(true);
  });

  it('deve realizar push de novas tasks e tags com userId', async () => {
    mockDb.getAllAsync.mockImplementation((queryStr: string) => {
      if (queryStr.includes('tasks')) {
        return Promise.resolve([
          { id: 1, title: 'Task 1', firebaseId: null, updatedAt: 1000, isDeleted: 0, userId: TEST_USER_ID }
        ]);
      }
      if (queryStr.includes('tags')) {
        return Promise.resolve([
          { id: 10, name: 'Tag 1', color: 'red', firebaseId: null, updatedAt: 1000, isDeleted: 0, userId: TEST_USER_ID }
        ]);
      }
      return Promise.resolve([]);
    });

    (doc as jest.Mock).mockImplementation(() => ({ id: 'new-id' }));
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    await SyncService.sync();

    expect(initDB).toHaveBeenCalled();
    expect(mockDb.runAsync).toHaveBeenCalledWith('UPDATE tasks SET firebaseId = ? WHERE id = ?', ['new-id', 1]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('UPDATE tags SET firebaseId = ? WHERE id = ?', ['new-id', 10]);
    expect(setDoc).toHaveBeenCalledTimes(2);
  });

  it('deve realizar pull de tasks e tags remotas e salvar com userId', async () => {
    (getDocs as jest.Mock).mockImplementation((q) => {
      if (q === 'tags') {
        return Promise.resolve({
          docs: [{ id: 'remote-tag-1', data: () => ({ name: 'Remote Tag', color: 'blue', updatedAt: 2000 }) }]
        });
      }
      if (q === 'tasks') {
        return Promise.resolve({
          docs: [{ id: 'remote-task-1', data: () => ({ title: 'Remote Task', description: null, isCompleted: false, tagId: null, updatedAt: 2000 }) }]
        });
      }
      return Promise.resolve({ docs: [] });
    });

    await SyncService.sync();

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tags'),
      expect.arrayContaining(['Remote Tag', 'blue', 'remote-tag-1', TEST_USER_ID])
    );
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tasks'),
      expect.arrayContaining(['Remote Task', 'remote-task-1', TEST_USER_ID])
    );
  });

  it('deve mapear corretamente o tagId remoto para o id local durante o pull', async () => {
    (getDocs as jest.Mock).mockImplementation((q) => {
      if (q === 'tags') {
        return Promise.resolve({
          docs: [{ id: 'remote-tag-abc', data: () => ({ name: 'Tag Mapeada', color: 'green', updatedAt: 2000 }) }]
        });
      }
      if (q === 'tasks') {
        return Promise.resolve({
          docs: [{ id: 'task-with-tag', data: () => ({ title: 'Task com Tag', tagId: 'remote-tag-abc', updatedAt: 2000 }) }]
        });
      }
      return Promise.resolve({ docs: [] });
    });

    mockDb.getFirstAsync.mockImplementation((sql: string) => {
      if (sql.includes('FROM tags')) return Promise.resolve({ id: 55 });
      return Promise.resolve(null);
    });

    await SyncService.sync();

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tasks'),
      expect.arrayContaining(['Task com Tag', 55, 'task-with-tag'])
    );
  });

  it('deve respeitar updatedAt para não sobrescrever dados mais novos localmente', async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [{ id: 'remote-id', data: () => ({ name: 'Old Remote', updatedAt: 1000 }) }]
    });

    mockDb.getFirstAsync.mockResolvedValue({ id: 1, updatedAt: 2000 });

    await SyncService.sync();

    expect(mockDb.runAsync).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE'), expect.anything());
  });

  it('deve fazer upload de imagem local para o Firebase Storage durante o push e atualizar a URL no SQLite e Firestore', async () => {
    (StorageService.uploadTaskImage as jest.Mock).mockResolvedValue('https://firebase.com/uploaded.jpg');

    mockDb.getAllAsync.mockImplementation((queryStr: string) => {
      if (queryStr.includes('tasks')) {
        return Promise.resolve([
          { id: 1, title: 'Task Local Image', firebaseId: 'fb-task-1', updatedAt: 1000, isDeleted: 0, userId: TEST_USER_ID, summaryImageUri: 'file:///path/to/image.jpg' }
        ]);
      }
      return Promise.resolve([]);
    });

    (doc as jest.Mock).mockImplementation(() => ({ id: 'fb-task-1' }));
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    await SyncService.sync();

    // Deve chamar o upload da imagem
    expect(StorageService.uploadTaskImage).toHaveBeenCalledWith('file:///path/to/image.jpg', 1);

    // Deve salvar a nova URL pública no SQLite local
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET summaryImageUri = ? WHERE id = ?',
      ['https://firebase.com/uploaded.jpg', 1]
    );

    // Deve enviar a URL pública para o Firestore
    expect(setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        summaryImageUri: 'https://firebase.com/uploaded.jpg'
      }),
      { merge: true }
    );
  });
});
