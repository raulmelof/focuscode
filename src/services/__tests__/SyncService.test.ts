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

  it('deve lidar com erro critico na sincronizacao', async () => {
    (initDB as jest.Mock).mockRejectedValueOnce(new Error('Init Failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await SyncService.sync();

    expect(consoleSpy).toHaveBeenCalledWith('[SyncService] Erro crítico na sincronização:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('deve realizar push de delete para tasks e tags isDeleted=1', async () => {
    mockDb.getAllAsync.mockImplementation((queryStr: string) => {
      if (queryStr.includes('tasks')) {
        return Promise.resolve([
          { id: 2, title: 'Deleted Task', firebaseId: 'fb-task-2', isDeleted: 1, userId: TEST_USER_ID }
        ]);
      }
      if (queryStr.includes('tags')) {
        return Promise.resolve([
          { id: 20, name: 'Deleted Tag', firebaseId: 'fb-tag-2', isDeleted: 1, userId: TEST_USER_ID }
        ]);
      }
      return Promise.resolve([]);
    });

    const { deleteDoc } = require('firebase/firestore');
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    await SyncService.sync();

    expect(deleteDoc).toHaveBeenCalledTimes(2);
    expect(mockDb.runAsync).toHaveBeenCalledWith('UPDATE tags SET firebaseId = NULL WHERE id = ?', [20]);
    expect(mockDb.runAsync).toHaveBeenCalledWith('DELETE FROM tasks WHERE id = ?', [2]);
  });

  it('deve capturar erros no upload da imagem e continuar o sync', async () => {
    (StorageService.uploadTaskImage as jest.Mock).mockRejectedValueOnce(new Error('Upload Error'));
    
    mockDb.getAllAsync.mockImplementation((queryStr: string) => {
      if (queryStr.includes('tasks')) {
        return Promise.resolve([
          { id: 1, title: 'Task Local Image Error', firebaseId: 'fb-task-err', isDeleted: 0, userId: TEST_USER_ID, summaryImageUri: 'file:///path/to/error.jpg' }
        ]);
      }
      return Promise.resolve([]);
    });

    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await SyncService.sync();

    expect(consoleSpy).toHaveBeenCalledWith(`[SyncService] Erro ao fazer upload da imagem para a tarefa 1:`, expect.any(Error));
    expect(setDoc).toHaveBeenCalled(); // Should still try to sync
    consoleSpy.mockRestore();
  });

  it('deve tratar exceptions permission-denied e outros erros ao salvar tags e tasks', async () => {
    mockDb.getAllAsync.mockImplementation((queryStr: string) => {
      if (queryStr.includes('tasks')) {
        return Promise.resolve([
          { id: 101, title: 'Task P-Denied', firebaseId: 'fb-t-denied', isDeleted: 0, userId: TEST_USER_ID },
          { id: 102, title: 'Task Other Err', firebaseId: 'fb-t-other', isDeleted: 0, userId: TEST_USER_ID }
        ]);
      }
      if (queryStr.includes('tags')) {
        return Promise.resolve([
          { id: 201, name: 'Tag P-Denied', firebaseId: 'fb-tag-denied', isDeleted: 0, userId: TEST_USER_ID },
          { id: 202, name: 'Tag Other Err', firebaseId: 'fb-tag-other', isDeleted: 0, userId: TEST_USER_ID }
        ]);
      }
      return Promise.resolve([]);
    });

    const { setDoc } = require('firebase/firestore');
    // We have 4 calls to setDoc
    setDoc
      .mockRejectedValueOnce({ code: 'permission-denied', message: 'denied' }) // Tag P-Denied
      .mockRejectedValueOnce(new Error('Network error')) // Tag Other Err
      .mockRejectedValueOnce({ code: 'permission-denied', message: 'denied' }) // Task P-Denied
      .mockRejectedValueOnce(new Error('Network error')); // Task Other Err

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    await SyncService.sync();

    expect(consoleWarnSpy).toHaveBeenCalledWith(`[SyncService] Ignorando Tag 201: Sem permissão (Dono diferente).`);
    expect(consoleErrorSpy).toHaveBeenCalledWith(`[SyncService] Erro na tag 202:`, 'Network error');
    expect(consoleWarnSpy).toHaveBeenCalledWith(`[SyncService] Ignorando Tarefa 101: Sem permissão.`);
    expect(consoleErrorSpy).toHaveBeenCalledWith(`[SyncService] Erro na tarefa 102:`, 'Network error');

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('deve realizar update local (pull) se dado remoto for mais novo', async () => {
    (getDocs as jest.Mock).mockImplementation((q) => {
      if (q === 'tags') {
        return Promise.resolve({
          docs: [{ id: 'remote-tag-updated', data: () => ({ name: 'New Tag Name', color: 'newcolor', updatedAt: 3000 }) }]
        });
      }
      if (q === 'tasks') {
        return Promise.resolve({
          docs: [{ id: 'remote-task-updated', data: () => ({ title: 'New Task Title', isCompleted: true, tagId: null, summaryImageUri: 'remote-url', focusTimeMinutes: 30, updatedAt: 3000 }) }]
        });
      }
      return Promise.resolve({ docs: [] });
    });

    mockDb.getFirstAsync.mockImplementation((sql: string) => {
      if (sql.includes('FROM tags')) return Promise.resolve({ id: 55, updatedAt: 1000 });
      if (sql.includes('FROM tasks')) return Promise.resolve({ id: 99, updatedAt: 1000 });
      return Promise.resolve(null);
    });

    await SyncService.sync();

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'UPDATE tags SET name = ?, color = ?, updatedAt = ? WHERE id = ?',
      ['New Tag Name', 'newcolor', 3000, 55]
    );
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      'UPDATE tasks SET title = ?, description = ?, isCompleted = ?, tagId = ?, updatedAt = ?, summaryImageUri = ?, focusTimeMinutes = ? WHERE id = ?',
      ['New Task Title', null, 1, null, 3000, 'remote-url', 30, 99]
    );
  });

  it('deve capturar erro em pullRemoteChanges', async () => {
    mockDb.getAllAsync.mockResolvedValue([]);
    (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Pull Error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await SyncService.sync();

    expect(consoleSpy).toHaveBeenCalledWith('[SyncService] Erro ao baixar mudanças:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('deve retornar silenciosamente se nao houver usuario', async () => {
    require('../firebase').auth.currentUser = null;
    await SyncService.sync();
    expect(initDB).not.toHaveBeenCalled();
    require('../firebase').auth.currentUser = { uid: TEST_USER_ID, email: 'test@example.com' };
  });

  it('deve usar fallbacks quando updatedAt ou outros campos opcionais faltarem no pull', async () => {
    (getDocs as jest.Mock).mockImplementation((q) => {
      if (q === 'tags') {
        return Promise.resolve({
          docs: [{ id: 'tag-no-date', data: () => ({ name: 'Tag Sem Data', color: 'blue' }) }] // missing updatedAt
        });
      }
      if (q === 'tasks') {
        return Promise.resolve({
          docs: [{ id: 'task-no-date', data: () => ({ title: 'Task Sem Campos', isCompleted: false }) }] // missing description, updatedAt, summaryImageUri, focusTimeMinutes
        });
      }
      return Promise.resolve({ docs: [] });
    });

    mockDb.getFirstAsync.mockResolvedValue(null);

    await SyncService.sync();

    // The Date.now() logic should be hit and fallbacks used
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tags'),
      expect.arrayContaining(['Tag Sem Data', 'blue', 'tag-no-date', expect.any(Number), TEST_USER_ID])
    );
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tasks'),
      expect.arrayContaining(['Task Sem Campos', null, 0, null, 'task-no-date', expect.any(Number), TEST_USER_ID, null, 25])
    );
  });

  it('deve fazer upload de imagens para outros schemes (content, ph, blob) e ignorar https', async () => {
    (StorageService.uploadTaskImage as jest.Mock).mockResolvedValue('https://firebase.com/uploaded.jpg');
    mockDb.getAllAsync.mockImplementation((queryStr: string) => {
      if (queryStr.includes('tasks')) {
        return Promise.resolve([
          { id: 2, title: 'Task Content Image', firebaseId: 'fb-task-2', isDeleted: 0, userId: TEST_USER_ID, summaryImageUri: 'content://image.jpg', tagId: 5 },
          { id: 3, title: 'Task Ph Image', firebaseId: 'fb-task-3', isDeleted: 0, userId: TEST_USER_ID, summaryImageUri: 'ph://image.jpg' },
          { id: 4, title: 'Task Blob Image', firebaseId: 'fb-task-4', isDeleted: 0, userId: TEST_USER_ID, summaryImageUri: 'blob:image' },
          { id: 5, title: 'Task Http Image', firebaseId: 'fb-task-5', isDeleted: 0, userId: TEST_USER_ID, summaryImageUri: 'https://image.jpg' }
        ]);
      }
      return Promise.resolve([]);
    });
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

    await SyncService.sync();

    expect(StorageService.uploadTaskImage).toHaveBeenCalledWith('content://image.jpg', 2);
    expect(StorageService.uploadTaskImage).toHaveBeenCalledWith('ph://image.jpg', 3);
    expect(StorageService.uploadTaskImage).toHaveBeenCalledWith('blob:image', 4);
    expect(StorageService.uploadTaskImage).not.toHaveBeenCalledWith('https://image.jpg', 5);
  });

  it('deve mapear corretamente o tagId remoto mesmo quando a tag local não é encontrada (localTagId permanece null)', async () => {
    (getDocs as jest.Mock).mockImplementation((q) => {
      if (q === 'tasks') {
        return Promise.resolve({
          docs: [{ id: 'task-with-unknown-tag', data: () => ({ title: 'Task com Tag Desconhecida', tagId: 'remote-tag-unknown', description: 'Desc', isCompleted: true, summaryImageUri: 'uri', focusTimeMinutes: 30, updatedAt: 2000 }) }]
        });
      }
      return Promise.resolve({ docs: [] });
    });

    mockDb.getFirstAsync.mockImplementation((sql: string) => {
      if (sql.includes('FROM tags')) return Promise.resolve(null); // Unknown tag
      if (sql.includes('FROM tasks')) return Promise.resolve(null); // Task does not exist locally
      return Promise.resolve(null);
    });

    await SyncService.sync();

    // tagId deve ser inserido como null, e isCompleted como 1, e todos os fallbacks true paths atingidos
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO tasks'),
      expect.arrayContaining(['Task com Tag Desconhecida', 'Desc', 1, null, 'task-with-unknown-tag', 2000, TEST_USER_ID, 'uri', 30])
    );
  });

  it('deve atualizar tarefas existentes utilizando os campos fornecidos em vez dos fallbacks', async () => {
    (getDocs as jest.Mock).mockImplementation((q) => {
      if (q === 'tasks') {
        return Promise.resolve({
          docs: [{ id: 'task-fb-existing', data: () => ({ title: 'Updated Title', description: 'Updated Desc', isCompleted: false, summaryImageUri: 'new-uri', focusTimeMinutes: 45, updatedAt: 3000 }) }]
        });
      }
      return Promise.resolve({ docs: [] });
    });

    mockDb.getFirstAsync.mockImplementation((sql: string) => {
      if (sql.includes('FROM tasks')) return Promise.resolve({ id: 99, updatedAt: 1000 }); // Existing task (older)
      return Promise.resolve(null);
    });

    await SyncService.sync();

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tasks SET'),
      expect.arrayContaining(['Updated Title', 'Updated Desc', 0, null, 3000, 'new-uri', 45, 99])
    );
  });

  it('deve atualizar tarefas existentes com fallbacks quando campos estão ausentes', async () => {
    (getDocs as jest.Mock).mockImplementation((q) => {
      if (q === 'tasks') {
        return Promise.resolve({
          docs: [{ id: 'task-fb-existing-missing', data: () => ({ title: 'Updated Title', isCompleted: true, updatedAt: 4000 }) }] // missing description, summaryImageUri, focusTimeMinutes
        });
      }
      return Promise.resolve({ docs: [] });
    });

    mockDb.getFirstAsync.mockImplementation((sql: string) => {
      if (sql.includes('FROM tasks')) return Promise.resolve({ id: 100, updatedAt: 1000 }); // Existing task
      return Promise.resolve(null);
    });

    await SyncService.sync();

    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE tasks SET'),
      expect.arrayContaining(['Updated Title', null, 1, null, 4000, null, 25, 100])
    );
  });
});
