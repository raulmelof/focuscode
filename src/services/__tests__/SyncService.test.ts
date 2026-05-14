import { SyncService } from '../SyncService';
import { getDBConnection } from '../../data/database/database';
import { writeBatch, getDocs, doc } from 'firebase/firestore';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn()
}));

jest.mock('../../data/database/database');
jest.mock('../../data/models/TaskModel');
jest.mock('../firebase', () => ({
  auth: { currentUser: { uid: 'test-user-id' } },
  signInAnonymouslyToFirebase: jest.fn(),
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  writeBatch: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn()
}));

const TEST_USER_ID = 'test-user-id';

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

  it('deve realizar push de novas tarefas (firebaseId null)', async () => {
    // Configura mock de tasks locais onde firebaseId é null (novo registro)
    // A query agora filtra por userId: 'SELECT * FROM tasks WHERE userId = ?'
    mockDb.getAllAsync.mockImplementation((queryStr: string) => {
      if (queryStr.includes('tasks')) {
        return Promise.resolve([
          { id: 1, title: 'Nova Task', description: 'Desc', isCompleted: 0, tagId: null, firebaseId: null, updatedAt: 1000, isDeleted: 0, userId: TEST_USER_ID }
        ]);
      }
      return Promise.resolve([]);
    });

    // Mock doc() to return a ref with an id
    (doc as jest.Mock).mockImplementation(() => ({ id: 'new-firebase-id' }));

    // Mock getDocs para o pull retornar vazio
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    await SyncService.sync();

    // Verifica se atualizou o SQLite com o novo firebaseId
    expect(mockDb.runAsync).toHaveBeenCalledWith('UPDATE tasks SET firebaseId = ? WHERE id = ?', ['new-firebase-id', 1]);

    // Verifica se adicionou ao batch do Firestore
    expect(mockBatch.set).toHaveBeenCalled();
    expect(mockBatch.commit).toHaveBeenCalled();
  });

  it('deve realizar pull de tarefas remotas e salvar com userId', async () => {
    // SQLite vazio
    mockDb.getAllAsync.mockResolvedValue([]);

    // Firestore com dados
    (getDocs as jest.Mock).mockResolvedValue({
      docs: [
        {
          id: 'remote-id-1',
          data: () => ({ title: 'Remote Task', description: null, isCompleted: false, tagId: null, updatedAt: 2000 })
        }
      ]
    });

    mockDb.getFirstAsync.mockResolvedValue(null); // Localmente não existe

    await SyncService.sync();

    // Verifica se inseriu localmente com userId no INSERT
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tasks'),
      // userId agora é o último parâmetro
      ['Remote Task', null, 0, null, 'remote-id-1', 2000, TEST_USER_ID]
    );
  });
});
