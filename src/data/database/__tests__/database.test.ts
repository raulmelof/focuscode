import { Platform } from 'react-native';
import * as databaseModule from '../database';

const mockOpenDatabaseAsync = jest.fn();
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: (...args: any[]) => mockOpenDatabaseAsync(...args)
}));

describe('Database', () => {
  let mockDb: any;
  // Removed dynamic databaseModule
  let mockStorage: Record<string, string> = {};

  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockStorage[key] || null),
        setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
      },
      writable: true,
      configurable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {};

    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1 }),
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null)
    };

    mockOpenDatabaseAsync.mockResolvedValue(mockDb);
    // import handled at the top
    databaseModule.clearDBCache();
  });

  afterEach(() => {
    databaseModule.clearDBCache();
  });

  it('should initialize database and enable foreign keys (iOS)', async () => {
    Platform.OS = 'ios';
    await databaseModule.initDB();

    expect(mockOpenDatabaseAsync).toHaveBeenCalledWith('focuscode.db');
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS tags'));
    expect(mockDb.execAsync).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS tasks'));
    expect(mockDb.runAsync).toHaveBeenCalledWith(expect.stringContaining('UPDATE tasks SET summaryImageUri = NULL'));
  });

  it('should handle error during image cleanup on native', async () => {
    Platform.OS = 'android';
    mockDb.runAsync.mockRejectedValueOnce(new Error('Cleanup error'));
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    
    await databaseModule.initDB();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[database] Erro ao limpar Base64 gigantes do banco local:',
      expect.any(Error)
    );
    consoleWarnSpy.mockRestore();
  });

  it('should initialize database on web (skip base64 cleanup)', async () => {
    Platform.OS = 'web';
    await databaseModule.initDB();
    expect(mockOpenDatabaseAsync).toHaveBeenCalled();
    // It should NOT run the UPDATE task SET summaryImageUri = NULL
    expect(mockDb.runAsync).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE tasks SET summaryImageUri = NULL'));
  });

  it('should handle initialization error', async () => {
    Platform.OS = 'ios';
    mockOpenDatabaseAsync.mockRejectedValueOnce(new Error('Init Error'));
    
    await expect(databaseModule.initDB()).rejects.toThrow('Init Error');
  });

  it('should run initDB only once for concurrent calls', async () => {
    Platform.OS = 'ios';
    const p1 = databaseModule.initDB();
    const p2 = databaseModule.initDB();
    await Promise.all([p1, p2]);
    // It should only call PRAGMA once
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(mockDb.execAsync.mock.calls.filter((c: any) => c[0] === 'PRAGMA foreign_keys = ON;').length).toBe(1);
  });

  it('should work on web using OPFS if openDatabaseAsync succeeds', async () => {
    Platform.OS = 'web';
    mockOpenDatabaseAsync.mockResolvedValueOnce(mockDb);

    const db1 = await databaseModule.getDBConnection();
    const db2 = await databaseModule.getDBConnection();

    expect(db1).toBe(db2);
    expect(mockOpenDatabaseAsync).toHaveBeenCalledTimes(1);
  });

  describe('WebDBAdapter (Fallback for web)', () => {
    let webDb: any;

    beforeEach(async () => {
      Platform.OS = 'web';
      mockOpenDatabaseAsync.mockRejectedValueOnce(new Error('No OPFS'));
      webDb = await databaseModule.getDBConnection();
    });

    it('should create tables correctly', async () => {
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS users (id INTEGER); CREATE TABLE IF NOT EXISTS tags (id INTEGER);');
      // Execute twice to check condition
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS users (id INTEGER);');
      // Tables are kept in memory and not persisted to local storage until insert/update.
      // We test it by inserting which will succeed.
      const res = await webDb.runAsync('INSERT INTO users (name) VALUES (?)', ['John']);
      expect(res.lastInsertRowId).toBe(1);
    });

    it('should run INSERT and return lastInsertRowId', async () => {
      // Skipping execAsync to test the auto-creation of table during INSERT (lines 53-54)
      const result = await webDb.runAsync('INSERT INTO new_tasks (title, isCompleted) VALUES (?, ?)', ['Test', 1]);
      expect(result.lastInsertRowId).toBe(1);
      
      const result2 = await webDb.runAsync('INSERT INTO new_tasks (title) VALUES (?)', ['Test 2']);
      expect(result2.lastInsertRowId).toBe(2);

      // Insert with updatedAt to bypass fallback
      const result3 = await webDb.runAsync('INSERT INTO new_tasks (title, updatedAt) VALUES (?, ?)', ['Test 3', 1000]);
      expect(result3.lastInsertRowId).toBe(3);
    });

    it('should handle UPDATE queries correctly', async () => {
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS tags (id INTEGER)');
      await webDb.runAsync('INSERT INTO tags (name, isDeleted, isCompleted) VALUES (?, ?, ?)', ['Tag1', 0, 0]);
      
      // Update by id
      await webDb.runAsync('UPDATE tags SET name = ?, updatedAt = ? WHERE id = ?', ['Tag1Updated', 12345, 1]);
      
      // Update firebaseId
      await webDb.runAsync('UPDATE tags SET firebaseId = ? WHERE id = ?', ['fb123', 1]);

      // Update isCompleted and isDeleted
      await webDb.runAsync('UPDATE tags SET isCompleted = ? WHERE id = ?', [1, 1]);
      await webDb.runAsync('UPDATE tags SET isDeleted = ?, updatedAt = ? WHERE id = ?', [1, 9999, 1]);
      // Insert another tag to ensure Array.find loop evaluates false branch for r.firebaseId === idParam
      await webDb.runAsync('INSERT INTO tags (name, color) VALUES (?, ?)', ['Tag2', 'blue']);
      await webDb.runAsync('UPDATE tags SET firebaseId = ? WHERE id = ?', ['fb456', 2]);

      const items = await webDb.getAllAsync('SELECT * FROM tags');
      // It includes deleted items if not filtering
      expect(items[0].firebaseId).toBe('fb123');
      expect(items[0].isCompleted).toBe(1);
      expect(items[0].isDeleted).toBe(1);

      // Update by firebaseId
      await webDb.runAsync('UPDATE tags SET isCompleted = ? WHERE firebaseId = ?', [0, 'fb123']);
      const itemsAfterFbUpdate = await webDb.getAllAsync('SELECT * FROM tags');
      expect(itemsAfterFbUpdate[0].isCompleted).toBe(0);

      // Create existing table to hit false branch
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS tags (id INTEGER)');
      
      // Empty table name to hit tableName false branch
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS ');
      
      // Update missing id to hit false branch in find
      await webDb.runAsync('UPDATE tags SET name = ? WHERE id = ?', ['Missing', 999]);

      // Get first on empty table to hit || null fallback
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS empty_table (id INTEGER)');
      const emptyFirst = await webDb.getFirstAsync('SELECT * FROM empty_table');
      expect(emptyFirst).toBeNull();
    });

    it('should handle DELETE queries', async () => {
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS tasks (id INTEGER)');
      await webDb.runAsync('INSERT INTO tasks (title) VALUES (?)', ['To Delete']);
      await webDb.runAsync('DELETE FROM tasks WHERE id = ?', [1]);
      
      const items = await webDb.getAllAsync('SELECT * FROM tasks');
      expect(items.length).toBe(0);
    });

    it('should return empty for unknown runAsync', async () => {
      const res = await webDb.runAsync('SELECT * FROM tasks');
      expect(res).toEqual({ lastInsertRowId: 0, changes: 0 });
    });

    it('should getAllAsync with filters', async () => {
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS tasks (id INTEGER)');
      await webDb.runAsync('INSERT INTO tasks (title, userId) VALUES (?, ?)', ['T1', 'user1']);
      await webDb.runAsync('INSERT INTO tasks (title, isCompleted, userId) VALUES (?, ?, ?)', ['T2', 1, 'user1']);
      await webDb.runAsync('INSERT INTO tasks (title, isDeleted, userId) VALUES (?, ?, ?)', ['T3', 1, 'user2']);

      const all = await webDb.getAllAsync('SELECT * FROM tasks');
      expect(all.length).toBe(3);

      const notDeleted = await webDb.getAllAsync('SELECT * FROM tasks WHERE isDeleted = 0');
      expect(notDeleted.length).toBe(2);

      const completed = await webDb.getAllAsync('SELECT * FROM tasks WHERE isCompleted = 1');
      expect(completed.length).toBe(1);

      const byUser = await webDb.getAllAsync('SELECT * FROM tasks WHERE userId = ?', ['user1']);
      expect(byUser.length).toBe(2);

      const count = await webDb.getAllAsync('SELECT COUNT(*) FROM tasks');
      expect((count[0] as any).count).toBe(3);
    });

    it('should return empty array for getAllAsync if table does not exist', async () => {
      const res = await webDb.getAllAsync('SELECT * FROM unknown_table');
      expect(res).toEqual([]);
    });

    it('should getFirstAsync correctly', async () => {
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS tasks (id INTEGER)');
      await webDb.runAsync('INSERT INTO tasks (title, firebaseId) VALUES (?, ?)', ['T1', 'fb_1']);
      await webDb.runAsync('INSERT INTO tasks (title, firebaseId) VALUES (?, ?)', ['T2', 'fb_2']);

      const item1 = await webDb.getFirstAsync('SELECT * FROM tasks');
      expect((item1 as any).title).toBe('T1');

      const fbItem = await webDb.getFirstAsync('SELECT * FROM tasks WHERE firebaseId = ?', ['fb_2']);
      expect((fbItem as any).title).toBe('T2');

      const fbItemMissing = await webDb.getFirstAsync('SELECT * FROM tasks WHERE firebaseId = ?', ['unknown_fb']);
      expect(fbItemMissing).toBeNull();
      
      const noItem = await webDb.getFirstAsync('SELECT * FROM unknown_table');
      expect(noItem).toBeNull();
    });

    it('should handle malformed or missing tables in queries gracefully', async () => {
      // execAsync
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS '); // no table name
      
      // runAsync INSERT
      await webDb.runAsync('INSERT INTO'); // no table
      await webDb.runAsync('INSERT INTO tasks VALUES (?)', [1]); // no columns
      
      // runAsync UPDATE
      await webDb.runAsync('UPDATE'); // no table
      await webDb.runAsync('UPDATE missing_table SET name = ?', ['A']);
      
      // runAsync DELETE
      await webDb.runAsync('DELETE FROM'); // no table
      await webDb.runAsync('DELETE FROM missing_table WHERE id = ?', [1]);

      // getAllAsync
      const resAll = await webDb.getAllAsync('SELECT * FROM '); // no table
      expect(resAll).toEqual([]);

      // getFirstAsync
      const resFirst = await webDb.getFirstAsync('SELECT * FROM '); // no table
      expect(resFirst).toBeNull();
    });

    it('should use Date.now() fallback for updatedAt in UPDATE if param is missing', async () => {
      await webDb.execAsync('CREATE TABLE IF NOT EXISTS tags (id INTEGER)');
      await webDb.runAsync('INSERT INTO tags (name, isDeleted, isCompleted) VALUES (?, ?, ?)', ['Tag1', 0, 0]);
      
      // Update with isDeleted but missing param for updatedAt (simulating undefined param)
      await webDb.runAsync('UPDATE tags SET isDeleted = ?, updatedAt = ? WHERE id = ?', [1, undefined, 1]);
      const items = await webDb.getAllAsync('SELECT * FROM tags');
      expect(items[0].updatedAt).toBeDefined();

      // Update isCompleted but missing param for updatedAt
      await webDb.runAsync('UPDATE tags SET isCompleted = ?, updatedAt = ? WHERE id = ?', [1, undefined, 1]);
      const items2 = await webDb.getAllAsync('SELECT * FROM tags');
      expect(items2[0].isCompleted).toBe(1);
    });
  });

  it('should restore data from localStorage correctly on initialization', async () => {
    Platform.OS = 'web';
    mockOpenDatabaseAsync.mockRejectedValueOnce(new Error('No OPFS'));
    mockStorage['focuscode_web_db'] = JSON.stringify({
      tasks: [{ id: 5, title: 'Restored' }]
    });

    const webDb = await databaseModule.getDBConnection();
    const items = await webDb.getAllAsync('SELECT * FROM tasks');
    expect(items.length).toBe(1);
    expect((items[0] as any).title).toBe('Restored');
    
    // Check auto increment continues from 5
    const res = await webDb.runAsync('INSERT INTO tasks (title) VALUES (?)', ['New']);
    expect(res.lastInsertRowId).toBe(6);
  });
});
